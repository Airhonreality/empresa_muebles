-- Catálogo de bancos + cuentas de consignación del proveedor (2026-10-17).
-- Los nombres de banco NO están hardcodeados en el formulario: viven en `bancos`,
-- se pueden crear desde la UI y se asocian por FK a cada cuenta. El seed inicial
-- es solo para que el catálogo no arranque vacío; agregar más es parte del flujo.
CREATE TABLE IF NOT EXISTS "bancos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nombre" text NOT NULL,
  "codigo" text,
  "activo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "bancos_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
INSERT INTO "bancos" ("nombre") VALUES
  ('Bancolombia'),
  ('Banco de Bogotá'),
  ('Davivienda'),
  ('BBVA Colombia'),
  ('Banco Popular'),
  ('Banco Agrario'),
  ('Banco Caja Social'),
  ('Scotiabank Colpatria'),
  ('Itaú'),
  ('Banco Falabella'),
  ('Banco Pichincha'),
  ('Banco AV Villas'),
  ('Bancoomeva'),
  ('Bancamía'),
  ('Banco W')
ON CONFLICT ("nombre") DO NOTHING;
--> statement-breakpoint
-- Un proveedor puede tener N cuentas: banco (ahorros/corriente), Nequi, Daviplata,
-- llaves Bre-B u otros medios. `es_principal` marca la preferida para pagos.
CREATE TABLE IF NOT EXISTS "proveedor_cuentas_bancarias" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "proveedor_id" uuid NOT NULL REFERENCES "proveedores"("id"),
  "tipo" text DEFAULT 'banco' NOT NULL,
  "alias" text,
  "banco_id" uuid REFERENCES "bancos"("id"),
  "tipo_cuenta" text,
  "numero_cuenta" text,
  "titular" text,
  "documento_titular" text,
  "tipo_llave" text,
  "llave" text,
  "es_principal" boolean DEFAULT false NOT NULL,
  "activa" boolean DEFAULT true NOT NULL,
  "notas" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proveedor_cuentas_bancarias_proveedor_idx"
  ON "proveedor_cuentas_bancarias" ("proveedor_id");
--> statement-breakpoint
-- Una sola cuenta principal activa por proveedor (la UI desmarca las demás antes
-- de guardar; el índice es la garantía dura a nivel de base).
CREATE UNIQUE INDEX IF NOT EXISTS "proveedor_cuentas_bancarias_principal_unique"
  ON "proveedor_cuentas_bancarias" ("proveedor_id")
  WHERE "es_principal" = true AND "activa" = true;
--> statement-breakpoint
-- Reactividad multi-usuario (LISTEN/NOTIFY) para las dos tablas nuevas.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['bancos','proveedor_cuentas_bancarias']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS veta_notify_trigger ON %I;
       CREATE TRIGGER veta_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION notify_veta_change();',
      tbl, tbl
    );
  END LOOP;
END $$;
