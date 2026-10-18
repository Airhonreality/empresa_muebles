-- Campo de texto libre para describir al proveedor (qué vende, condiciones,
-- contactos alternos, notas de negociación, etc.).
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "descripcion" text;
