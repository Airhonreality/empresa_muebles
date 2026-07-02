# Arbol De Rutas

Generated: 2026-07-02T02:07:05.694Z
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

## /app/catalog

- title: CatÃ¡logo de Productos y Servicios
- blocks:
  - type:catalogo_manager context:productos_catalogo id:78eb7b2b

## /app/equipo

- title: Gestión de Equipo
- blocks:
  - type:equipo_directory context:usuarios_equipo id:2281c4e0

## /app/erp/finanzas

- title: Finanzas Operativas
- blocks:
  - type:finanzas_shell context:movimientos_financieros id:block_fi

## /app/ficha/:id

- title: Ficha de Producción
- blocks:
  - type:ficha_produccion context:proyectos id:92376842

## /app/perfil

- title: Mi Perfil
- blocks:
  - type:user_profile context:usuarios_equipo id:65e18569

## /app/prefabricados

- blocks:
  - type:collection context:prefabricados id:bc48f0fb
  - type:form context:prefabricados id:161235be
  - type:collection context:prefabricados_items id:e92b4844
  - type:form context:prefabricados_items id:ca07bb74

## /app/production

- title: Producción
- blocks:
  - type:production_kanban context:ordenes_trabajo id:028ec528

## /app/proveedores

- title: Directorio de Proveedores
- blocks:
  - type:proveedores_directory context:proveedores id:76c1b365

## /app/quoting

- title: Cotizador
- blocks:
  - type:cotizador_pro context:proyectos id:block_co

## /app/quoting/:id

- title: Cotizador — Editor de Propuesta
- blocks:
  - type:cotizador_pro context:proyectos id:block_co

## /colecciones

- title: Colecciones
- blocks:
  - type:veta_catalog context:productos_catalogo id:e8fc7a82

## /espacios-a-medida

- title: Espacios a Medida
- blocks:
  - type:veta_spaces context:espacio_variantes id:a6719596
