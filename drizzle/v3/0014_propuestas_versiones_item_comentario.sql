CREATE TABLE IF NOT EXISTS "propuestas_versiones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot_json" jsonb NOT NULL,
	"publicada_en" timestamp DEFAULT now() NOT NULL,
	"publicada_por_id" uuid,
	CONSTRAINT "propuestas_versiones_proyecto_id_version_unique" UNIQUE("proyecto_id","version")
);
--> statement-breakpoint
ALTER TABLE "items_variante" ADD COLUMN "comentario" text;
--> statement-breakpoint
ALTER TABLE "propuestas_versiones" ADD CONSTRAINT "propuestas_versiones_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "propuestas_versiones" ADD CONSTRAINT "propuestas_versiones_publicada_por_id_usuarios_id_fk" FOREIGN KEY ("publicada_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
