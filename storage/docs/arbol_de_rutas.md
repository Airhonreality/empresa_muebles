# Arbol De Rutas

Generated: 2026-07-03T22:12:49.273Z
Source: storage/db/page_routes.json

> Documento generado por `agno docs`. No es fuente canonica; la fuente canonica sigue en `storage/db/`.

## /

- title: Veta Dorada
- blocks:
  - type:veta_home id:062b2cab

## /agendar

- title: Agendar Asesoría
- blocks:
  - type:veta_agendar context:leads id:4c9f0987

## /app/erp/calendar

- title: ERP Calendario
- blocks:
  - type:calendar_scheduler context:tareas_operativas id:63171d14

## /app/erp/catalogo

- title: ERP Catalogo
- blocks:
  - type:catalogo_manager context:productos_catalogo id:ffe6e8d2

## /app/erp/comercial

- title: ERP Comercial
- blocks:
  - type:comercial_kanban context:proyectos id:3a2c7f42

## /app/erp/cotizador

- title: ERP Cotizador
- blocks:
  - type:cotizador_pro context:proyectos id:fa8b140f

## /app/erp/equipo

- title: ERP Equipo
- blocks:
  - type:equipo_directory context:usuarios_equipo id:5e1312e7

## /app/erp/finanzas

- title: Finanzas Operativas
- blocks:
  - type:finanzas_shell context:movimientos_financieros id:block_fi

## /app/erp/perfil

- title: ERP Perfil
- blocks:
  - type:user_profile context:usuarios_equipo id:7d362d9a

## /app/erp/proveedores

- title: ERP Proveedores
- blocks:
  - type:proveedores_directory context:proveedores id:d3da0a50

## /app/erp/taller

- title: ERP Taller
- blocks:
  - type:production_kanban context:ordenes_trabajo id:2140370b

## /app/ficha/:id

- title: Ficha de Producción
- blocks:
  - type:ficha_produccion context:proyectos id:92376842

## /app/prefabricados

- blocks:
  - type:collection context:prefabricados id:bc48f0fb
  - type:form context:prefabricados id:161235be
  - type:collection context:prefabricados_items id:e92b4844
  - type:form context:prefabricados_items id:ca07bb74

## /colecciones

- title: Colecciones
- blocks:
  - type:veta_catalog context:productos_catalogo id:e8fc7a82
