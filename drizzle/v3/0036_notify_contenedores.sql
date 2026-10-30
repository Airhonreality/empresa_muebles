-- 0036 · Trigger de reactividad para la tabla descriptiva compartida (Fase 2, 2026-10-29).
-- La función notify_veta_change() ya existe (0004). Sin este trigger, guardar descripción/fotos
-- de un espacio NO emite NOTIFY y las otras pestañas/usuarios no se enteran del cambio.
--
-- ADITIVO e IDEMPOTENTE (DROP TRIGGER IF EXISTS + CREATE).
-- Aplicar con: npx tsx scripts/apply-sql-migration.ts drizzle/v3/0036_notify_contenedores.sql --apply
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'contenedores_descriptivos'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS veta_notify_trigger ON %I;
       CREATE TRIGGER veta_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION notify_veta_change();',
      tbl, tbl
    );
  END LOOP;
END $$;
