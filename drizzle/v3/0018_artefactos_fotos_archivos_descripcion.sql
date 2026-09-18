ALTER TABLE "espacios_artefactos" ADD COLUMN "descripcion" text;
--> statement-breakpoint
ALTER TABLE "espacios_artefactos" ADD COLUMN "foto_urls" text[] DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "espacios_artefactos" ADD COLUMN "archivos_urls" text[] DEFAULT '{}' NOT NULL;
--> statement-breakpoint
UPDATE "espacios_artefactos" SET "foto_urls" = ARRAY[foto_url] WHERE "foto_url" IS NOT NULL;