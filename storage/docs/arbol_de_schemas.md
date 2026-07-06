# Arbol De Schemas

Generated: 2026-07-03T22:12:49.246Z
Source: storage/db/schema_definitions.json

> Documento generado por `agno docs`. No es fuente canonica; la fuente canonica sigue en `storage/db/`.

## abonos_contrato

- contrato_id -> contratos required
- numero_abono required
- valor_abono required
- fecha_recibido
- observaciones
- verificado

## apoyo_tecnico

- tipo_recurso required
- imagen_url
- fecha_visita
- notas
- lista_requisitos
- proyecto_id -> proyectos required

## categorias_financieras

- nombre required
- tipo_flujo required
- subtipo required
- descripcion_semantica

## clientes

- nombre required
- documento
- telefono
- email
- domicilio
- descripcion_semantica

## compras_materiales

- descripcion
- material_id -> productos_catalogo
- cantidad
- unidad_medida
- costo_real_compra
- proveedor_id -> proveedores
- fecha_compra
- notas
- estado
- origen_proyecto -> proyectos

## comprobantes_financieros

- numero_referencia required
- tipo
- archivo_soporte
- descripcion_semantica

## configuracion_comercial

- llave required
- valor required
- grupo required
- etiqueta required

## contratos

- proyecto_id -> proyectos required
- codigo_contrato required
- fecha_contrato required
- contratante_domicilio
- plazo_ejecucion_texto required
- holgura_dias
- garantia_anios
- objeto_items
- especificaciones_estructura
- especificaciones_herrajes
- especificaciones_mesones
- condiciones_desmonte
- valor_total required
- estado required
- email_asunto
- email_cuerpo
- descripcion_semantica

## cuentas_financieras

- nombre required
- tipo required
- saldo_inicial required
- saldo_actual
- estado
- descripcion_semantica

## espacio_variantes

- proyecto_id -> proyectos required
- nombre_espacio required
- nombre_variante required
- activa
- jornadas_desarrollo_tecnico
- jornadas_ensamblaje_taller
- jornadas_instalacion_obra
- notas_markdown
- imagenes
- colores
- descripcion
- descripcion_alternativa
- visible_pdf

## imagenes_espacio

- espacio_variante_id -> espacio_variantes required
- imagen_url required
- descripcion
- orden

## items_variante

- variante_id -> espacio_variantes required
- catalogo_id -> productos_catalogo required
- unidad_medida
- cantidad required
- precio_unitario required
- total_linea
- origen_prefabricado_id -> prefabricados
- imagen_url
- notas_compra
- anulado
- compra_generada

## leads

- nombre_completo
- telefono_whatsapp
- email
- barrio_zona
- tipo_espacio
- mensaje
- gclid
- estado_proyecto
- score_conversion
- utm_source
- utm_medium
- utm_campaign

## movimientos_financieros

- fecha required
- descripcion required
- tipo required
- monto required
- estado required
- cuenta_origen_id -> cuentas_financieras
- cuenta_destino_id -> cuentas_financieras
- categoria_id -> categorias_financieras
- obligacion_id -> obligaciones_pendientes
- comprobante_ref
- descripcion_semantica

## nav_links

- label
- path
- icon
- orden
- grupo

## obligaciones_pendientes

- descripcion required
- tipo required
- monto_total required
- monto_pagado
- fecha_vencimiento
- estado required
- proveedor_id -> proveedores
- cliente_id -> clientes
- usuario_id -> usuarios_equipo
- descripcion_semantica
- proyecto_id -> proyectos
- contrato_id -> contratos

## ordenes_trabajo

- proyecto_id -> proyectos required
- codigo_orden required
- estado required
- fecha_entrega
- notas

## plantillas_tareas

- fase_kanban_trigger required
- titulo_tarea required
- departamento required
- dias_offset

## prefabricados

- nombre required
- descripcion
- catalogo_id -> productos_catalogo required
- imagen_url

## prefabricados_items

- prefabricado_id -> prefabricados required
- catalogo_id -> productos_catalogo required
- cantidad required
- unidad_medida

## productos_catalogo

- sku
- tipo
- descripcion required
- unidad_medida
- ancho
- alto
- profundo
- stock_actual
- precio_directo
- precio_publico
- imagen_url
- modelo_3d
- url_referencia
- proveedor
- categoria_comercial
- proveedor_id -> proveedores

## project_tasks

- variante_id -> espacio_variantes required
- descripcion required
- estado required
- creado_por

## proveedores

- nombre
- nit
- telefono
- direccion
- categoria
- descripcion_semantica

## proyectos

- cliente_id -> clientes
- nombre_proyecto required
- direccion_obra
- dias_entrega_estimados
- garantia_anios
- costos_operativos
- imprevistos_instalacion
- descuento_comercial
- ajuste_arbitrario
- estado required
- descripcion_semantica

## registro_horas

- fecha
- usuario_id -> usuarios_equipo
- proyecto_id -> proyectos
- horas_ordinarias
- horas_extras
- descripcion_semantica
- estado_pago

## registro_logistica

- nombre_flete
- direccion_destino
- estado_flete
- viaje_programado
- fecha_viaje
- notas

## registros_tecnicos

- variante_id -> espacio_variantes required
- etiqueta_evento required
- responsable required
- archivos_multimedia
- notas

## system_groups

- name required
- label
- kind
- description

## tareas_operativas

- proyecto_id -> proyectos required
- titulo required
- departamento required
- estado required
- fase_kanban
- fecha_limite
- asignado_a -> usuarios_equipo

## tareas_produccion

- orden_trabajo_id -> ordenes_trabajo required
- nombre_tarea required
- estado required
- operario_id
- notas
- espacio_variante_id -> espacio_variantes

## testimonios

- nombre_cliente
- barrio
- texto_resena
- calificacion
- proyecto_relacionado
- destacado
- fecha_resena

## usuarios_equipo

- nombre required
- email required
- rol required
- estado required
- descripcion_semantica
- costo_hora
- horas_estimadas_mes
- telefono
- firma_url
