-- Contacto comercial completo del proveedor (2026-10-17).
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "contacto_nombre" text;
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "contacto_cargo" text;
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "whatsapp" text;
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "telefono_alterno" text;
