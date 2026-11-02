-- 0034 · DDL que faltó aplicar del commit 5238385 ("Fases 2+3: esquema descriptivo
-- compartido + grupos como entidad completa"). Ese commit cambió lib/db/schema.ts y
-- lib/data/actions/core.ts pero no generó ni aplicó ninguna migración, así que la base de
-- datos real quedó sin las columnas/tablas que el código desplegado ya usa.
--
-- Todo aquí es ADITIVO e IDEMPOTENTE: no borra columnas, tablas ni filas. Las columnas
-- legacy de espacio_variantes (descripcion, fotosEspacio, fotosDisenio, fotosReferencia) se
-- dejan intactas a propósito — su DROP se decidirá en una migración posterior, cuando el
-- read-path de la UI ya lea de contenedores_descriptivos.
--
-- Aplicarla con: npx tsx scripts/apply-0034-grupos-contenedores.ts --apply
-- (no vía drizzle-kit migrate: el journal de drizzle/v3 tiene drift/corrupción preexistente,
-- ver scripts/apply-0013.ts y scripts/apply-atributos-tecnicos-table.ts).

-- ── 1. grupos_item: jornadas propias, estado y relación a catálogo ───────────
ALTER TABLE "grupos_item" ADD COLUMN IF NOT EXISTS "jornadas_desarrollo_tecnico" numeric(8, 2) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "grupos_item" ADD COLUMN IF NOT EXISTS "jornadas_ensamblaje_taller" numeric(8, 2) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "grupos_item" ADD COLUMN IF NOT EXISTS "jornadas_instalacion_obra" numeric(8, 2) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "grupos_item" ADD COLUMN IF NOT EXISTS "estado" text DEFAULT 'temporal' NOT NULL;
--> statement-breakpoint
ALTER TABLE "grupos_item" ADD COLUMN IF NOT EXISTS "producto_catalogo_id" uuid;
--> statement-breakpoint
ALTER TABLE "grupos_item" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'grupos_item_producto_catalogo_id_productos_catalogo_id_fk'
  ) THEN
    ALTER TABLE "grupos_item" ADD CONSTRAINT "grupos_item_producto_catalogo_id_productos_catalogo_id_fk"
      FOREIGN KEY ("producto_catalogo_id") REFERENCES "public"."productos_catalogo"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- ── 2. contenedores_descriptivos (descripción/fotos de espacios y grupos) ────
-- OJO: en lib/db/schema.ts estas columnas NO tienen nombre explícito
-- (`fotosEspacio: jsonb()`), así que Drizzle las referencia con el identificador camelCase
-- entre comillas. Los nombres deben ser exactamente "fotosEspacio"/"fotosDisenio"/
-- "fotosReferencia", no snake_case (drift real detectado al verificar esta migración).
CREATE TABLE IF NOT EXISTS "contenedores_descriptivos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"espacio_variante_id" uuid,
	"grupo_item_id" uuid,
	"descripcion" text,
	"fotosEspacio" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fotosDisenio" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fotosReferencia" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contenedores_descriptivos_espacio_variante_id_unique" UNIQUE("espacio_variante_id"),
	CONSTRAINT "contenedores_descriptivos_grupo_item_id_unique" UNIQUE("grupo_item_id"),
	CONSTRAINT "contenedores_descriptivos_espacio_variante_id_fk" FOREIGN KEY ("espacio_variante_id") REFERENCES "public"."espacio_variantes"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "contenedores_descriptivos_grupo_item_id_fk" FOREIGN KEY ("grupo_item_id") REFERENCES "public"."grupos_item"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "one_parent" CHECK (
		("espacio_variante_id" IS NOT NULL AND "grupo_item_id" IS NULL) OR
		("espacio_variante_id" IS NULL AND "grupo_item_id" IS NOT NULL)
	)
);
--> statement-breakpoint

-- Corrección de la primera aplicación de esta migración (2026-10-29): se creó con
-- fotos_espacio/fotos_disenio/fotos_referencia y Drizzle espera camelCase. Rename idempotente,
-- no borra datos.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'contenedores_descriptivos' AND column_name = 'fotos_espacio'
	) THEN
		ALTER TABLE "contenedores_descriptivos" RENAME COLUMN "fotos_espacio" TO "fotosEspacio";
	END IF;
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'contenedores_descriptivos' AND column_name = 'fotos_disenio'
	) THEN
		ALTER TABLE "contenedores_descriptivos" RENAME COLUMN "fotos_disenio" TO "fotosDisenio";
	END IF;
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'contenedores_descriptivos' AND column_name = 'fotos_referencia'
	) THEN
		ALTER TABLE "contenedores_descriptivos" RENAME COLUMN "fotos_referencia" TO "fotosReferencia";
	END IF;
END $$;
--> statement-breakpoint

-- ── 3. contenedores_artefactos (artefactos colgados del contenedor) ──────────
CREATE TABLE IF NOT EXISTS "contenedores_artefactos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contenedor_descriptivo_id" uuid NOT NULL,
	"categoria" text NOT NULL,
	"dimensiones_mm" text,
	"tipo_specifique" text,
	"ubicacion" text,
	"foto_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"archivos_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"requiere_verificacion" boolean DEFAULT false NOT NULL,
	"validado_por" uuid,
	"validado_en" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contenedores_artefactos_contenedor_descriptivo_id_fk" FOREIGN KEY ("contenedor_descriptivo_id") REFERENCES "public"."contenedores_descriptivos"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint

-- ── 4. Backfill: descripción/fotos existentes → contenedores_descriptivos ────
-- Copia (no mueve) lo que ya estaba en espacio_variantes, solo para filas con contenido.
-- ON CONFLICT DO NOTHING lo hace re-ejecutable sin duplicar.
INSERT INTO "contenedores_descriptivos" ("espacio_variante_id", "descripcion", "fotosEspacio", "fotosDisenio", "fotosReferencia")
SELECT
	"id",
	"descripcion",
	COALESCE("fotosEspacio", '[]'::jsonb),
	COALESCE("fotosDisenio", '[]'::jsonb),
	COALESCE("fotosReferencia", '[]'::jsonb)
FROM "espacio_variantes"
WHERE "descripcion" IS NOT NULL
	OR COALESCE("fotosEspacio", '[]'::jsonb) <> '[]'::jsonb
	OR COALESCE("fotosDisenio", '[]'::jsonb) <> '[]'::jsonb
	OR COALESCE("fotosReferencia", '[]'::jsonb) <> '[]'::jsonb
ON CONFLICT ("espacio_variante_id") DO NOTHING;
