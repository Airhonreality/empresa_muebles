CREATE TABLE IF NOT EXISTS "renders_conceptuales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_espacio" text NOT NULL,
	"imagen_url" text NOT NULL,
	"titulo" text,
	"visible" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "espacio_variantes" ADD COLUMN "tipo_espacio" text;--> statement-breakpoint
ALTER TABLE "portafolio" ADD COLUMN "espacio_variante_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portafolio" ADD CONSTRAINT "portafolio_espacio_variante_id_espacio_variantes_id_fk" FOREIGN KEY ("espacio_variante_id") REFERENCES "public"."espacio_variantes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
