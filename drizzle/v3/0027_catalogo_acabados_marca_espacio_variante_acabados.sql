-- t-172 (2026-09-30): catálogo de acabados tipado (nombre + imagen + marca) asociable a varios
-- espacios cotizados, cada asociación con su propio texto libre de destino ("fachadas módulo X",
-- "mesón de isla"). Reemplaza a espacio_variantes.colores (jsonb) como fuente de verdad (migración
-- de UI en t-174, esta migración solo crea la base de datos).
-- APLICAR ANTES de hacer push: drizzle-kit generate sigue bloqueado por el choque de snapshots
-- 0010/0011 (documentado desde 2026-08-28) — se escribe a mano, mismo método que 0012/0014/0015/0019/0020/0021.
ALTER TABLE "catalogo_acabados" ADD COLUMN IF NOT EXISTS "marca" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "espacio_variante_acabados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"espacio_variante_id" uuid NOT NULL,
	"acabado_id" uuid NOT NULL,
	"descripcion_uso" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "espacio_variante_acabados" ADD CONSTRAINT "espacio_variante_acabados_espacio_variante_id_espacio_variantes_id_fk" FOREIGN KEY ("espacio_variante_id") REFERENCES "public"."espacio_variantes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "espacio_variante_acabados" ADD CONSTRAINT "espacio_variante_acabados_acabado_id_catalogo_acabados_id_fk" FOREIGN KEY ("acabado_id") REFERENCES "public"."catalogo_acabados"("id") ON DELETE no action ON UPDATE no action;
