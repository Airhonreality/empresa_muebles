ALTER TABLE "portafolio" ALTER COLUMN "proyecto_id" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "catalogo_espacios_arquitectonicos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"unidad_base" text,
	"rango_minimo" numeric(14, 2),
	"rango_maximo" numeric(14, 2),
	"ejemplo_tamanio" text,
	"modulos_tipicos_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "catalogo_espacios_arquitectonicos_codigo_unique" UNIQUE("codigo")
);
