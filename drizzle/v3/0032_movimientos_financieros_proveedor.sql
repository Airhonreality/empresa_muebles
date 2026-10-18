-- t-181 (2026-10-17): asociación opcional de un movimiento de salida a un proveedor.
-- Columna aditiva nullable + FK. No borra ni modifica datos existentes.
ALTER TABLE "movimientos_financieros" ADD COLUMN IF NOT EXISTS "proveedor_id" uuid;

DO $$
BEGIN
  ALTER TABLE "movimientos_financieros"
    ADD CONSTRAINT "movimientos_financieros_proveedor_id_fk"
    FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id")
    ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
