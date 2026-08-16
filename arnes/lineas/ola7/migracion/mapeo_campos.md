# Mapeo de Campos: Legacy (Neon main / Agnostic Seed) → V3 (dev-local)

> **Fase 0 (Diagnóstico pre-mapeo) — t-114.** Fuente legacy: `legacy-agnostic-backup` (branch congelado) `storage/db/`.
> V3 físico: `lib/db/schema.ts` (28 tablas Drizzle). V3 canon: `REGISTRO_DE_ENTIDADES.md`.
> **Borrador para checkpoint del Supervisor (CA-1).** El legacy guarda datos de negocio como JSONB genérico (`{id, context, data, updated_at}`); el field-level real vive en `schema_definitions.json`.

---

## 🔴 LIVE PRODUCTION MAPPING — actualizado 2026-08-13 (desde Neon main LIVE)
> **¡IMPORTANTE!** Este mapeo reemplaza el diagnóstico t-114 (snapshot congelado). Fuente: `agnostic_records` en producción live (ep-round-queen-at3nzf87).

### Inventario real (live)
| Legacy namespace | Registros | V3 target | Estado |
|------------------|-----------|-----------|--------|
| clientes | 33 | clientes | directo |
| proyectos | 49 | proyectos | directo (cotizaciones→proyectos con estado='enviada') |
| cotizaciones | 18 | proyectos | directo (estado='enviada') |
| productos_catalogo | 278 | productosCatalogo | directo |
| espacio_variantes | 124 | espacioVariantes | directo |
| items_variante | 626 | itemsVariante | directo |
| contratos | 7 | contratos, hitosPago | directo |
| propuestas_publicas | 23 | portfolioPublico | directo |
| imagenes_espacio | 2 | espacioVariantes.fotosEspacio | directo |
| leads | 1 | leads | opcional |
| proveedores | 3 | proveedores | opcional |
| usuarios_equipo | 5 | personas, usuarios | opcional |

### Mapeo field-level (unión de campos live)
- **clientes**: nombre, documento, telefono, email, domicilio, id
- **proyectos**: estado, nombre_proyecto, cliente_id, direccion_obra, dias_entrega_estimados, garantia_anios, costos_operativos, imprevistos_instalacion, descuento_comercial, ajuste_arbitrario, aplica_iva
- **cotizaciones**: estado, cliente_id, nombre_proyecto, costos_operativos, imprevistos_instalacion, ajuste_arbitrario, descuento_comercial, dias_entrega_estimados, direccion_obra, garantia_anios → **se mapea a proyectos** (mismos campos, estado='enviada')
- **productos_catalogo**: sku, tipo, descripcion, unidad_medida, stock_actual, precio_directo, precio_publico, imagen_url, categoria_comercial, proveedor_id, publicado_web, alto, ancho, profundo, modelo_3d, url_referencia
- **espacio_variantes**: activa, imagenes, proyecto_id, nombre_espacio, nombre_variante, descripcion, descripcion_alternativa, jornadas_desarrollo_tecnico, jornadas_ensamblaje_taller, jornadas_instalacion_obra, colores, orden_espacio, visible_pdf
- **items_variante**: cantidad, catalogo_id, variante_id, unidad_medida, precio_unitario, total_linea, anulado
- **contratos**: estado, proyecto_id, valor_total, email_asunto, email_cuerpo, holgura_dias, objeto_items, cotizacion_id, fecha_contrato, garantia_anios, codigo_contrato, condiciones_desmonte, contratante_domicilio, plazo_ejecucion_texto, especificaciones_mesones, especificaciones_herrajes, especificaciones_estructura
- **hitos_pago**: (array JSON en contratos) → tabla hitosPago (1:N)
- **propuestas_publicas**: estado, proyecto_id, public_slug, snapshot_json, emitida_en, revocado_en → portfolioPublico: proyectoId, slug, publicado (estado='publicado'), descripcionComercial=snapshot_json, titulo derivado de proyecto
- **imagenes_espacio**: 2 registros → espacioVariantes.fotosEspacio (JSONB array)

---

## 1. Inventario y Clasificación (OBSOLETO — ver sección LIVE PRODUCTION MAPPING arriba)

| Legacy namespace | Clasificación | Registros | V3 target | Estado |
|------------------|--------------|-----------|-----------|--------|

## 1. Inventario y Clasificación

| Legacy namespace | Clasificación | Registros | V3 target | Estado |
|------------------|--------------|-----------|-----------|--------|
| abonos_contrato | business | 0 | obligacionesPendientes | fisico |
| ai_config | motor | 9 | — | motor |
| apoyo_tecnico | canon-only | 1 | — | canon-only |
| app_navbars | motor | 6 | — | motor |
| categorias_financieras | canon-only | 14 | — | canon-only |
| clientes | business | 15 | clientes | fisico |
| compras_materiales | canon-only | 0 | — | canon-only |
| comprobantes_financieros | canon-only | 0 | — | canon-only |
| configuracion_comercial | business | 23 | parametros | fisico |
| contratos | business | 1 | contratos, hitosPago | fisico |
| cuentas_financieras | business | 6 | cuentasFinancieras | fisico |
| espacio_variantes | business | 9 | espacioVariantes, itemsVariante, espaciosArtefactos | fisico |
| imagenes_espacio | business | 24 | espacioVariantes | fisico |
| imagenes_portfolio | business | 9 | imagenesPortfolio | fisico |
| imagenes_prefabricado | canon-only | 0 | — | canon-only |
| items_obra_civil | canon-only | 12 | — | canon-only |
| items_variante | business | 156 | itemsVariante | fisico |
| leads | business | 3 | leads | fisico |
| movimientos_financieros | business | 0 | movimientosFinancieros | fisico |
| nav_links | motor | 0 | — | motor |
| obligaciones_pendientes | business | 0 | obligacionesPendientes | fisico |
| ordenes_trabajo | business | 1 | ordenesTrabajo | fisico |
| page_routes | motor | 20 | — | motor |
| pedidos_web | business | 2 | pedidosWeb | fisico |
| plantillas_tareas | motor | 0 | — | motor |
| portfolio_publico | business | 5 | portfolioPublico | fisico |
| prefabricados | canon-only | 3 | productosCatalogo | canon-only |
| prefabricados_items | canon-only | 8 | — | canon-only |
| productos_catalogo | business | 254 | productosCatalogo | fisico |
| project_tasks | canon-only | 0 | — | canon-only |
| propuestas_publicas | canon-only | 1 | — | canon-only |
| proveedores | business | 0 | proveedores | fisico |
| proyectos | business | 4 | proyectos, proyectosEstadosHistorial | fisico |
| registro_horas | canon-only | 0 | — | canon-only |
| registro_logistica | canon-only | 0 | — | canon-only |
| registros_tecnicos | canon-only | 0 | — | canon-only |
| scripts | motor | 31 | — | motor |
| seed_registros | motor | 37 | — | motor |
| system_groups | motor | 0 | — | motor |
| tareas_operativas | canon-only | 0 | — | canon-only |
| tareas_produccion | business | 0 | tareasProduccion | fisico |
| templates | motor | 1 | — | motor |
| testimonios | canon-only | 3 | — | canon-only |
| user_list_members | motor | 0 | — | motor |
| user_lists | motor | 3 | — | motor |
| users | business | 4 | personas, usuarios, personasRoles | fisico |
| usuarios_equipo | business | 5 | personas, usuarios, personasRoles | fisico |

## OBSOLETO — 2. Mapeo de Campos por Namespace

⚠️ **CONTENIDO OBSOLETO** — ver sección **LIVE PRODUCTION MAPPING** arriba. Este diagnóstico fue generado desde el snapshot congelado `legacy-agnostic-backup` y no refleja la estructura real de producción LIVE. Usar solo la sección LIVE PRODUCTION MAPPING para el clone.

Resumen: **21** con tabla física V3, **15** solo-canon (gap → decisión B), **11** motor (no migrar).

### abonos_contrato → obligacionesPendientes  _(fisico)_
> Abonos → filas en obligacionesPendientes (tipo 'abono'); requiere columna `tipo`/origen.

Registros legacy: 0. Campos en schema: 6.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| contrato_id | relation | sí | obligacionesPendientes.contratoId | directo |
| numero_abono | select | sí | — | PENDIENTE |
| valor_abono | number | sí | — | PENDIENTE |
| fecha_recibido | date | no | — | PENDIENTE |
| observaciones | text | no | — | PENDIENTE |
| verificado | boolean | no | — | PENDIENTE |

### apoyo_tecnico → — (sin tabla física)  _(canon-only)_
> E-? Soporte técnico; sin tabla física V3.

Registros legacy: 1. Campos en schema: 6.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| tipo_recurso | select | sí | — | PENDIENTE |
| imagen_url | image | no | — | PENDIENTE |
| fecha_visita | date | no | — | PENDIENTE |
| notas | textarea | no | — | PENDIENTE |
| lista_requisitos | markdown | no | — | PENDIENTE |
| proyecto_id | relation | sí | — | PENDIENTE |

### categorias_financieras → — (sin tabla física)  _(canon-only)_
> Categorías de movimientos; V3 solo tiene cuentas/movimientos.

Registros legacy: 14. Campos en schema: 4.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre | text | sí | — | PENDIENTE |
| tipo_flujo | select | sí | — | PENDIENTE |
| subtipo | select | sí | — | PENDIENTE |
| descripcion_semantica | markdown | no | — | PENDIENTE |

### OBSOLETO — clientes → clientes  _(fisico)_
⚠️ **OBSOLETO** — ver LIVE PRODUCTION MAPPING arriba. Registros reales LIVE: 33.
Registros legacy (snapshot): 15. Campos en schema: 6.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre | text | sí | clientes.nombre | directo |
| documento | text | no | clientes.documento | directo |
| telefono | text | no | clientes.telefono | directo |
| email | text | no | clientes.email | directo |
| domicilio | text | no | clientes.domicilio | directo |
| descripcion_semantica | markdown | no | — | PENDIENTE |

Campos presentes en datos pero no en schema_definitions: `id`.

### compras_materiales → — (sin tabla física)  _(canon-only)_
> ordenesCompra/itemsOrdenCompra no existen físicamente aún.

Registros legacy: 0. Campos en schema: 10.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| descripcion | text | no | — | PENDIENTE |
| material_id | relation | no | — | PENDIENTE |
| cantidad | number | no | — | PENDIENTE |
| unidad_medida | text | no | — | PENDIENTE |
| costo_real_compra | number | no | — | PENDIENTE |
| proveedor_id | relation | no | — | PENDIENTE |
| fecha_compra | date | no | — | PENDIENTE |
| notas | text | no | — | PENDIENTE |
| estado | select | no | — | PENDIENTE |
| origen_proyecto | relation | no | — | PENDIENTE |

### comprobantes_financieros → — (sin tabla física)  _(canon-only)_
> Comprobantes/facturas; sin tabla física V3.

Registros legacy: 0. Campos en schema: 4.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| numero_referencia | text | sí | — | PENDIENTE |
| tipo | select | no | — | PENDIENTE |
| archivo_soporte | file | no | — | PENDIENTE |
| descripcion_semantica | markdown | no | — | PENDIENTE |

### configuracion_comercial → parametros  _(fisico)_
> Config comercial → tabla parametros (con historial).

Registros legacy: 23. Campos en schema: 4.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| llave | text | sí | — | PENDIENTE |
| valor | textarea | sí | — | PENDIENTE |
| grupo | select | sí | parametros.grupo | directo |
| etiqueta | text | sí | — | PENDIENTE |

Campos presentes en datos pero no en schema_definitions: `fuente`.

### OBSOLETO — contratos → contratos, hitosPago  _(fisico)_
⚠️ **OBSOLETO** — ver LIVE PRODUCTION MAPPING arriba. Registros reales LIVE: 7.
Registros legacy (snapshot): 1. Campos en schema: 18.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| proyecto_id | relation | sí | contratos.proyectoId | directo |
| codigo_contrato | text | sí | contratos.codigoContrato | directo |
| fecha_contrato | date | sí | contratos.fechaContrato | directo |
| contratante_domicilio | text | no | contratos.contratanteDomicilio | directo |
| plazo_ejecucion_texto | text | sí | contratos.plazoEjecucionTexto | directo |
| holgura_dias | number | no | contratos.holguraDias | directo |
| garantia_anios | number | no | contratos.garantiaAnios | directo |
| objeto_items | markdown | no | contratos.objetoItems | directo |
| especificaciones_estructura | text | no | contratos.especificacionesEstructura | directo |
| especificaciones_herrajes | text | no | contratos.especificacionesHerrajes | directo |
| especificaciones_mesones | text | no | contratos.especificacionesMesones | directo |
| condiciones_desmonte | text | no | contratos.condicionesDesmonte | directo |
| valor_total | number | sí | contratos.valorTotal | directo |
| estado | select | sí | contratos.estado | directo |
| email_asunto | text | no | contratos.emailAsunto | directo |
| email_cuerpo | markdown | no | contratos.emailCuerpo | directo |
| descripcion_semantica | markdown | no | — | PENDIENTE |
| hitos_pago | json | no | — | PENDIENTE |

### cuentas_financieras → cuentasFinancieras  _(fisico)_
Registros legacy: 6. Campos en schema: 6.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre | text | sí | cuentasFinancieras.nombre | directo |
| tipo | select | sí | cuentasFinancieras.tipo | directo |
| saldo_inicial | number | sí | cuentasFinancieras.saldoInicial | directo |
| saldo_actual | number | no | cuentasFinancieras.saldoActual | directo |
| estado | select | no | — | PENDIENTE |
| descripcion_semantica | markdown | no | — | PENDIENTE |

### OBSOLETO — espacio_variantes → espacioVariantes, itemsVariante, espaciosArtefactos  _(fisico)_
⚠️ **OBSOLETO** — ver LIVE PRODUCTION MAPPING arriba. Registros reales LIVE: 124.
Registros legacy (snapshot): 9. Campos en schema: 13.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| proyecto_id | relation | sí | espacioVariantes.proyectoId | directo |
| nombre_espacio | text | sí | espacioVariantes.nombreEspacio | directo |
| nombre_variante | text | sí | espacioVariantes.nombreVariante | directo |
| activa | boolean | no | espacioVariantes.activa | directo |
| jornadas_desarrollo_tecnico | number | no | espacioVariantes.jornadasDesarrolloTecnico | directo |
| jornadas_ensamblaje_taller | number | no | espacioVariantes.jornadasEnsamblajeTaller | directo |
| jornadas_instalacion_obra | number | no | espacioVariantes.jornadasInstalacionObra | directo |
| notas_markdown | markdown | no | — | PENDIENTE |
| imagenes | text | no | — | PENDIENTE |
| colores | text | no | espacioVariantes.colores | directo |
| descripcion | text | no | espacioVariantes.descripcion | directo |
| descripcion_alternativa | text | no | — | PENDIENTE |
| visible_pdf | boolean | no | espacioVariantes.visiblePdf | directo |

Campos presentes en datos pero no en schema_definitions: `orden`, `orden_espacio`.

### OBSOLETO — imagenes_espacio → espacioVariantes  _(fisico)_
⚠️ **OBSOLETO** — ver LIVE PRODUCTION MAPPING arriba. Registros reales LIVE: 2 (→ espacioVariantes.fotosEspacio).
> Fotos en columnas JSONB de espacioVariantes.

Registros legacy (snapshot): 24. Campos en schema: 4.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| espacio_variante_id | relation | sí | — | PENDIENTE |
| imagen_url | image | sí | — | PENDIENTE |
| descripcion | text | no | espacioVariantes.descripcion | directo |
| orden | number | no | espacioVariantes.orden | directo |

Campos presentes en datos pero no en schema_definitions: `jornadas_ensamblaje_taller`, `jornadas_instalacion_obra`, `nombre_espacio`, `nombre_variante`.

### imagenes_portfolio → imagenesPortfolio  _(fisico)_
Registros legacy: 9. Campos en schema: 4.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| portfolio_id | relation | no | imagenesPortfolio.portfolioId | directo |
| imagen_url | image | sí | imagenesPortfolio.imagenUrl | directo |
| descripcion | text | no | imagenesPortfolio.descripcion | directo |
| orden | number | no | imagenesPortfolio.orden | directo |

### imagenes_prefabricado → — (sin tabla física)  _(canon-only)_
> Imágenes de prefabricados; sin tabla física V3.

Registros legacy: 0. Campos en schema: 4.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| prefabricado_id | relation | no | — | PENDIENTE |
| imagen_url | image | no | — | PENDIENTE |
| descripcion | text | no | — | PENDIENTE |
| orden | number | no | — | PENDIENTE |

### items_obra_civil → — (sin tabla física)  _(canon-only)_
> Obra civil; absorber en itemsVariante (tipo obra_civil) o nueva tabla.

Registros legacy: 12. Campos en schema: 9.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| variante_id | relation | sí | — | PENDIENTE |
| categoria | select | sí | — | PENDIENTE |
| catalogo_id | relation | no | — | PENDIENTE |
| descripcion_manual | text | no | — | PENDIENTE |
| unidad_medida | text | no | — | PENDIENTE |
| cantidad | number | sí | — | PENDIENTE |
| precio_unitario | number | sí | — | PENDIENTE |
| total_linea | number | no | — | PENDIENTE |
| notas | text | no | — | PENDIENTE |

### OBSOLETO — items_variante → itemsVariante  _(fisico)_
⚠️ **OBSOLETO** — ver LIVE PRODUCTION MAPPING arriba. Registros reales LIVE: 626.
Registros legacy (snapshot): 156. Campos en schema: 11.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| variante_id | relation | sí | itemsVariante.varianteId | directo |
| catalogo_id | relation | sí | itemsVariante.catalogoId | directo |
| unidad_medida | text | no | — | PENDIENTE |
| cantidad | number | sí | itemsVariante.cantidad | directo |
| precio_unitario | number | sí | itemsVariante.precioUnitario | directo |
| total_linea | number | no | itemsVariante.totalLinea | directo |
| origen_prefabricado_id | relation | no | — | PENDIENTE |
| imagen_url | image | no | — | PENDIENTE |
| notas_compra | text | no | — | PENDIENTE |
| anulado | boolean | no | itemsVariante.anulado | directo |
| compra_generada | boolean | no | — | PENDIENTE |

### leads → leads  _(fisico)_
Registros legacy: 3. Campos en schema: 12.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre_completo | text | no | — | PENDIENTE |
| telefono_whatsapp | text | no | leads.telefonoWhatsapp | directo |
| email | text | no | leads.email | directo |
| barrio_zona | text | no | — | PENDIENTE |
| tipo_espacio | select | no | — | PENDIENTE |
| mensaje | textarea | no | — | PENDIENTE |
| gclid | text | no | — | PENDIENTE |
| estado_proyecto | select | no | — | PENDIENTE |
| score_conversion | number | no | leads.scoreConversion | directo |
| utm_source | text | no | leads.utmSource | directo |
| utm_medium | text | no | leads.utmMedium | directo |
| utm_campaign | text | no | leads.utmCampaign | directo |

### movimientos_financieros → movimientosFinancieros  _(fisico)_
Registros legacy: 0. Campos en schema: 11.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| fecha | date | sí | movimientosFinancieros.fecha | directo |
| descripcion | text | sí | movimientosFinancieros.descripcion | directo |
| tipo | select | sí | movimientosFinancieros.tipo | directo |
| monto | number | sí | movimientosFinancieros.monto | directo |
| estado | select | sí | movimientosFinancieros.estado | directo |
| cuenta_origen_id | relation | no | movimientosFinancieros.cuentaOrigenId | directo |
| cuenta_destino_id | relation | no | movimientosFinancieros.cuentaDestinoId | directo |
| categoria_id | relation | no | — | PENDIENTE |
| obligacion_id | relation | no | movimientosFinancieros.obligacionId | directo |
| comprobante_ref | text | no | — | PENDIENTE |
| descripcion_semantica | markdown | no | — | PENDIENTE |

### obligaciones_pendientes → obligacionesPendientes  _(fisico)_
Registros legacy: 0. Campos en schema: 12.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| descripcion | text | sí | obligacionesPendientes.descripcion | directo |
| tipo | select | sí | obligacionesPendientes.tipo | directo |
| monto_total | number | sí | obligacionesPendientes.montoTotal | directo |
| monto_pagado | number | no | obligacionesPendientes.montoPagado | directo |
| fecha_vencimiento | date | no | obligacionesPendientes.fechaVencimiento | directo |
| estado | select | sí | obligacionesPendientes.estado | directo |
| proveedor_id | relation | no | obligacionesPendientes.proveedorId | directo |
| cliente_id | relation | no | obligacionesPendientes.clienteId | directo |
| usuario_id | relation | no | — | PENDIENTE |
| descripcion_semantica | markdown | no | — | PENDIENTE |
| proyecto_id | relation | no | obligacionesPendientes.proyectoId | directo |
| contrato_id | relation | no | obligacionesPendientes.contratoId | directo |

### ordenes_trabajo → ordenesTrabajo  _(fisico)_
Registros legacy: 1. Campos en schema: 5.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| proyecto_id | relation | sí | ordenesTrabajo.proyectoId | directo |
| codigo_orden | text | sí | ordenesTrabajo.codigoOrden | directo |
| estado | select | sí | ordenesTrabajo.estado | directo |
| fecha_entrega | date | no | ordenesTrabajo.fechaEntrega | directo |
| notas | text | no | ordenesTrabajo.notas | directo |

### pedidos_web → pedidosWeb  _(fisico)_
Registros legacy: 2. Campos en schema: 16.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| numero | text | sí | — | PENDIENTE |
| user_id | text | no | — | PENDIENTE |
| cliente_id | text | no | pedidosWeb.clienteId | directo |
| nombre | text | sí | — | PENDIENTE |
| email | text | sí | — | PENDIENTE |
| telefono | text | no | — | PENDIENTE |
| direccion_entrega | text | sí | pedidosWeb.direccionEntrega | directo |
| barrio | text | no | — | PENDIENTE |
| items_snapshot | textarea | sí | pedidosWeb.itemsSnapshot | directo |
| subtotal | number | sí | pedidosWeb.subtotal | directo |
| total | number | sí | pedidosWeb.total | directo |
| wompi_reference | text | no | — | PENDIENTE |
| wompi_transaction_id | text | no | — | PENDIENTE |
| metodo_pago | text | no | — | PENDIENTE |
| notas | textarea | no | — | PENDIENTE |
| estado | select | sí | pedidosWeb.estado | directo |

### OBSOLETO — portfolio_publico → portfolioPublico  _(fisico)_
⚠️ **OBSOLETO** — portfolio_publico NO EXISTE en producción LIVE. Ver LIVE PRODUCTION MAPPING: usar propuestas_publicas → portfolioPublico.
Registros legacy (snapshot): 5. Campos en schema: 12.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| proyecto_id | relation | no | portfolioPublico.proyectoId | directo |
| titulo | text | sí | portfolioPublico.titulo | directo |
| slug | text | sí | portfolioPublico.slug | directo |
| descripcion_comercial | markdown | no | — | PENDIENTE |
| cliente_iniciales | text | no | — | PENDIENTE |
| barrio | text | no | portfolioPublico.barrio | directo |
| categoria_espacio | select | no | portfolioPublico.categoriaEspacio | directo |
| materiales_destacados | textarea | no | — | PENDIENTE |
| publicado | boolean | no | portfolioPublico.publicado | directo |
| destacado | boolean | no | — | PENDIENTE |
| orden | number | no | — | PENDIENTE |
| fecha_publicacion | date | no | — | PENDIENTE |

Campos presentes en datos pero no en schema_definitions: `zona`.

### prefabricados → productosCatalogo  _(canon-only)_
> SKUs SERV absorben en productosCatalogo; definir.

Registros legacy: 3. Campos en schema: 11.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre | text | sí | — | PENDIENTE |
| descripcion | text | no | productosCatalogo.descripcion | directo |
| catalogo_id | relation | sí | — | PENDIENTE |
| imagen_url | image | no | productosCatalogo.imagenUrl | directo |
| descripcion_comercial | text | no | — | PENDIENTE |
| categoria_comercial | text | no | productosCatalogo.categoriaComercial | directo |
| precio_publico | number | no | productosCatalogo.precioPublico | directo |
| precio_costo_calculado | number | no | — | PENDIENTE |
| publicado_web | boolean | no | productosCatalogo.publicadoWeb | directo |
| reutilizable_catalogo | boolean | no | — | PENDIENTE |
| slug | text | no | — | PENDIENTE |

### prefabricados_items → — (sin tabla física)  _(canon-only)_
> Items de prefabricado; sin tabla física V3.

Registros legacy: 8. Campos en schema: 5.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| prefabricado_id | relation | sí | — | PENDIENTE |
| catalogo_id | relation | sí | — | PENDIENTE |
| cantidad | number | sí | — | PENDIENTE |
| unidad_medida | text | no | — | PENDIENTE |
| precio_unitario_snapshot | number | no | — | PENDIENTE |

### OBSOLETO — productos_catalogo → productosCatalogo  _(fisico)_
⚠️ **OBSOLETO** — ver LIVE PRODUCTION MAPPING arriba. Registros reales LIVE: 278.
Registros legacy (snapshot): 254. Campos en schema: 18.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| sku | text | no | productosCatalogo.sku | directo |
| tipo | select | no | productosCatalogo.tipo | directo |
| descripcion | text | sí | productosCatalogo.descripcion | directo |
| unidad_medida | select | no | productosCatalogo.unidadMedida | directo |
| ancho | text | no | — | PENDIENTE |
| alto | text | no | — | PENDIENTE |
| profundo | text | no | — | PENDIENTE |
| stock_actual | number | no | productosCatalogo.stockActual | directo |
| precio_directo | number | no | productosCatalogo.precioDirecto | directo |
| precio_publico | number | no | productosCatalogo.precioPublico | directo |
| imagen | image | no | — | PENDIENTE |
| imagen_url | image | no | productosCatalogo.imagenUrl | directo |
| modelo_3d | text | no | — | PENDIENTE |
| url_referencia | text | no | — | PENDIENTE |
| proveedor | select | no | — | PENDIENTE |
| categoria_comercial | select | no | productosCatalogo.categoriaComercial | directo |
| proveedor_id | relation | no | productosCatalogo.proveedorId | directo |
| publicado_web | boolean | no | productosCatalogo.publicadoWeb | directo |

### project_tasks → — (sin tabla física)  _(canon-only)_
> Tareas de proyecto; sin tabla física V3.

Registros legacy: 0. Campos en schema: 4.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| variante_id | relation | sí | — | PENDIENTE |
| descripcion | text | sí | — | PENDIENTE |
| estado | select | sí | — | PENDIENTE |
| creado_por | text | no | — | PENDIENTE |

### propuestas_publicas → — (sin tabla física)  _(canon-only)_
> Snapshot de propuesta pública (F-08); sin tabla física V3.

Registros legacy: 1. Campos en schema: 6.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| proyecto_id | relation | no | — | PENDIENTE |
| public_slug | text | no | — | PENDIENTE |
| snapshot_json | markdown | no | — | PENDIENTE |
| estado | select | no | — | PENDIENTE |
| emitida_en | date | no | — | PENDIENTE |
| revocado_en | date | no | — | PENDIENTE |

### proveedores → proveedores  _(fisico)_
Registros legacy: 0. Campos en schema: 6.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre | text | no | proveedores.nombre | directo |
| nit | text | no | proveedores.nit | directo |
| telefono | text | no | — | PENDIENTE |
| direccion | text | no | — | PENDIENTE |
| categoria | select | no | proveedores.categoria | directo |
| descripcion_semantica | markdown | no | — | PENDIENTE |

### OBSOLETO — proyectos → proyectos, proyectosEstadosHistorial  _(fisico)_
⚠️ **OBSOLETO** — ver LIVE PRODUCTION MAPPING arriba. Registros reales LIVE: 49 (proyectos) + 18 (cotizaciones).
Registros legacy (snapshot): 4. Campos en schema: 14.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| cliente_id | relation | no | proyectos.clienteId | directo |
| nombre_proyecto | text | sí | proyectos.nombreProyecto | directo |
| direccion_obra | text | no | proyectos.direccionObra | directo |
| dias_entrega_estimados | number | no | proyectos.diasEntregaEstimados | directo |
| garantia_anios | number | no | proyectos.garantiaAnios | directo |
| costos_operativos | number | no | proyectos.costosOperativos | directo |
| imprevistos_instalacion | number | no | proyectos.imprevistosInstalacion | directo |
| descuento_comercial | number | no | proyectos.descuentoComercial | directo |
| ajuste_arbitrario | number | no | proyectos.ajusteArbitrario | directo |
| estado | select | sí | proyectos.estado | directo |
| descripcion_semantica | markdown | no | proyectos.descripcionSemantica | directo |
| barrio | text | no | — | PENDIENTE |
| aplica_iva | boolean | no | proyectos.aplicaIva | directo |
| porcentaje_iva | number | no | proyectos.porcentajeIva | directo |

### registro_horas → — (sin tabla física)  _(canon-only)_
> Registro de horas; sin tabla física V3.

Registros legacy: 0. Campos en schema: 7.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| fecha | date | no | — | PENDIENTE |
| usuario_id | relation | no | — | PENDIENTE |
| proyecto_id | relation | no | — | PENDIENTE |
| horas_ordinarias | number | no | — | PENDIENTE |
| horas_extras | number | no | — | PENDIENTE |
| descripcion_semantica | markdown | no | — | PENDIENTE |
| estado_pago | select | no | — | PENDIENTE |

### registro_logistica → — (sin tabla física)  _(canon-only)_
> Logística; sin tabla física V3.

Registros legacy: 0. Campos en schema: 6.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre_flete | text | no | — | PENDIENTE |
| direccion_destino | text | no | — | PENDIENTE |
| estado_flete | select | no | — | PENDIENTE |
| viaje_programado | boolean | no | — | PENDIENTE |
| fecha_viaje | date | no | — | PENDIENTE |
| notas | text | no | — | PENDIENTE |

### registros_tecnicos → — (sin tabla física)  _(canon-only)_
> Visitas/retomas; sin tabla física V3.

Registros legacy: 0. Campos en schema: 5.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| variante_id | relation | sí | — | PENDIENTE |
| etiqueta_evento | text | sí | — | PENDIENTE |
| responsable | text | sí | — | PENDIENTE |
| archivos_multimedia | image | no | — | PENDIENTE |
| notas | textarea | no | — | PENDIENTE |

### tareas_operativas → — (sin tabla física)  _(canon-only)_
> Calendario operativo; sin tabla física V3.

Registros legacy: 0. Campos en schema: 7.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| proyecto_id | relation | sí | — | PENDIENTE |
| titulo | text | sí | — | PENDIENTE |
| departamento | list | sí | — | PENDIENTE |
| estado | list | sí | — | PENDIENTE |
| fase_kanban | text | no | — | PENDIENTE |
| fecha_limite | date | no | — | PENDIENTE |
| asignado_a | relation | no | — | PENDIENTE |

### tareas_produccion → tareasProduccion  _(fisico)_
Registros legacy: 0. Campos en schema: 6.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| orden_trabajo_id | relation | sí | — | PENDIENTE |
| nombre_tarea | text | sí | tareasProduccion.nombreTarea | directo |
| estado | select | sí | tareasProduccion.estado | directo |
| operario_id | text | no | tareasProduccion.operarioId | directo |
| notas | text | no | — | PENDIENTE |
| espacio_variante_id | relation | no | — | PENDIENTE |

### testimonios → — (sin tabla física)  _(canon-only)_
> E-55 Testimonios; sin tabla física V3.

Registros legacy: 3. Campos en schema: 7.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre_cliente | text | no | — | PENDIENTE |
| barrio | text | no | — | PENDIENTE |
| texto_resena | textarea | no | — | PENDIENTE |
| calificacion | number | no | — | PENDIENTE |
| proyecto_relacionado | text | no | — | PENDIENTE |
| destacado | boolean | no | — | PENDIENTE |
| fecha_resena | date | no | — | PENDIENTE |

### users → personas, usuarios, personasRoles  _(fisico)_
> Cuentas de usuario → personas/usuarios/personasRoles.

Registros legacy: 4. Campos en schema: 0.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| _(sin definición de campos en schema; ver dataKeysSample)_ | — | — | — | PENDIENTE |

Campos presentes en datos pero no en schema_definitions: `cliente_id`, `email`, `name`, `password_algo`, `password_hash`, `password_updated_at`, `type`.

### usuarios_equipo → personas, usuarios, personasRoles  _(fisico)_
> Persona + usuario + rol(es).

Registros legacy: 5. Campos en schema: 9.

| Campo legacy | Tipo | Req | → Columna V3 | Estado |
|--------------|------|-----|--------------|--------|
| nombre | text | sí | personas.nombre | directo |
| email | text | sí | usuarios.email | directo |
| rol | list | sí | — | PENDIENTE |
| estado | list | sí | — | PENDIENTE |
| descripcion_semantica | markdown | no | — | PENDIENTE |
| costo_hora | number | no | — | PENDIENTE |
| horas_estimadas_mes | number | no | — | PENDIENTE |
| telefono | text | no | personas.telefono | directo |
| firma_url | image | no | — | PENDIENTE |
