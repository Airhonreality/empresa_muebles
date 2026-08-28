CREATE TABLE IF NOT EXISTS "atributos_tecnicos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_espacio" text NOT NULL,
	"titulo" text NOT NULL,
	"cuerpo" text NOT NULL,
	"badge" text,
	"imagen_url" text,
	"visible" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
