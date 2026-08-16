-- t-132 / m07b_reactividad_multiusuario.md: reactividad multi-usuario vía LISTEN/NOTIFY.
-- Función genérica: emite un NOTIFY en el canal 'veta_changes' (tabla:operación) cada vez que
-- una tabla de negocio recibe INSERT/UPDATE/DELETE. El long-poll del servidor
-- (lib/data/actions/longpoll.ts) se queda escuchando este canal en vez de re-consultar en loop.
CREATE OR REPLACE FUNCTION notify_veta_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('veta_changes', TG_TABLE_NAME || ':' || TG_OP);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'roles','personas','personas_roles','leads','contratos','espacio_variantes','hitos_pago',
    'portfolio_publico','imagenes_portfolio','items_variante','espacios_artefactos',
    'cuentas_financieras','movimientos_financieros','obligaciones_pendientes','clientes',
    'proveedores','ordenes_trabajo','pedidos_web','tareas_produccion','usuarios',
    'productos_catalogo','proyectos','proyectos_estados_historial','parametros',
    'parametros_historial','eventos','procedencia','audit_logs','cronogramas',
    'cronograma_etapas','desfases_cronograma','checks_produccion','novedades_criticas',
    'comunicaciones_progreso','schemas_proyecto','bom_material','verificaciones','retomas',
    'cambios_contrato','modulos','estimaciones','ordenes_compra','items_orden_compra',
    'recepciones_material','herramientas','registros_gate_caja','cuentas_cobro_proveedor',
    'citaciones_calidad','reprocesos','instalaciones','actas_entrega','casos_garantia',
    'citas_garantia','categorias','productos_tienda','productos_tienda_componentes',
    'catalogo_acabados','catalogo_producto_acabados','acabados_muestras','portafolio',
    'testimonios','modulos_artefactos','documentos_proyecto','bitacora_articulos'
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
