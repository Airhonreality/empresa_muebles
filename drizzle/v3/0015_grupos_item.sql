CREATE TABLE IF NOT EXISTS "grupos_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"espacio_variante_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"padre_id" uuid,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items_variante" ADD COLUMN "grupo_item_id" uuid;
--> statement-breakpoint
ALTER TABLE "grupos_item" ADD CONSTRAINT "grupos_item_espacio_variante_id_espacio_variantes_id_fk" FOREIGN KEY ("espacio_variante_id") REFERENCES "public"."espacio_variantes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "grupos_item" ADD CONSTRAINT "grupos_item_padre_id_grupos_item_id_fk" FOREIGN KEY ("padre_id") REFERENCES "public"."grupos_item"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "items_variante" ADD CONSTRAINT "items_variante_grupo_item_id_grupos_item_id_fk" FOREIGN KEY ("grupo_item_id") REFERENCES "public"."grupos_item"("id") ON DELETE no action ON UPDATE no action;
