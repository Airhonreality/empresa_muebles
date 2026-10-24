DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'atributos_tecnicos',
    'catalogo_espacios_arquitectonicos',
    'espacio_variante_acabados',
    'eventos_conversion_offline',
    'grupos_item',
    'notas_reunion',
    'propuestas_versiones',
    'renders_conceptuales'
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
