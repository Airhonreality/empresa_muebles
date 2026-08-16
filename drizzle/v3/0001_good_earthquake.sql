ALTER TABLE "items_variante" ADD COLUMN "es_referencial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "items_variante" ADD COLUMN "fuente_referencial" "fuente_referencial";--> statement-breakpoint
ALTER TABLE "items_variante" ADD COLUMN "grupo_referencial" text;--> statement-breakpoint
ALTER TABLE "items_variante" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;