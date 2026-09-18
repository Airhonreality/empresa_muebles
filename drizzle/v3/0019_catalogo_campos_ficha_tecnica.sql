ALTER TABLE "productos_catalogo" ADD COLUMN "campos_personalizados" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "productos_catalogo" ADD COLUMN "ficha_tecnica_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;