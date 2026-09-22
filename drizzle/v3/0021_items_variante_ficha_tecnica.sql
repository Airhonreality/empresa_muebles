-- Ficha técnica por ítem cotizado (2026-09-22, aprobado por Supervisor).
-- 6 universales text nullable + campos_personalizados jsonb (patrón productos_catalogo).
-- APLICAR ANTES de hacer push: drizzle-kit generate está bloqueado por choque de snapshots
-- 0010/0011 (documentado desde 2026-08-28), igual que 0012/0014/0019/0020 — se escribe a mano.
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "marca" text;
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "referencia" text;
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "color" text;
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "dimensiones" text;
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "acabado" text;
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "espesor" text;
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "campos_personalizados" jsonb DEFAULT '[]'::jsonb NOT NULL;
