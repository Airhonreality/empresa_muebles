# WP-3 — Módulo `data-table` (súper tabla de gestión)

Requiere WP-1 completado. Independiente de WP-2. Copia todo este archivo como prompt inicial de la sesión.

---

ROL: Ejecutas el WP-3 del plan `storage/fork_doc/REFACTOR_MODULOS/00_LINEA_DE_TRABAJO.md`. Solo este WP. Lee primero `CLAUDE.md` del root e `Interfaces Custom.md`.

OBJETIVO: Crear `packages/modules/data-table/`, un módulo compuesto hiperespecializado de gestión tabular. Registra UN tipo de bloque: `data_table`. Es el reemplazo con valor real de los viejos `table`/`collection`/`form`: una vista de gestión completa, no un widget genérico.

CONTEXTO OBLIGATORIO (leer antes de diseñar):
- `src/components/agnostic/blocks/AgnosticCollection.tsx` — lógica probada de listado/vistas: REUTILIZA su conocimiento (fetch de records vía props del Renderer, relaciones, pivot). Los bloques viejos serán borrados en WP-4: este módulo NO debe importarlos; copia/adapta lo que necesite.
- `src/components/agnostic/blocks/AgnosticForm.tsx` + `src/lib/agnostic/SchemaInterpreter.ts` — cómo se derivan campos de edición desde el schema.
- `src/components/agnostic/engine/AgnosticRenderer.tsx` — contrato de props que recibe un bloque (`schema`, `context`, `records`, `intent`, `parentId`, `parentKey`, `api`, `onSuccess`).
- `src/components/specialized/_TEMPLATE.tsx` — patrón de componente specialized.
- `packages/core/src/module.ts` y un manifest de referencia si WP-2 ya corrió (`packages/modules/calendar-scheduler/manifest.ts`).

CONTRATO FUNCIONAL de `data_table` (config del bloque, todo snake_case):
- Datos: usa `context` + `records` que ya inyecta el Renderer; soporta `parent_id`/`parent_key` para modo maestro-detalle (caso real: `prefabricados` → `prefabricados_items`).
- Columnas: autoderivadas del schema, con override `columns: [{ key, label?, width?, format? }]`.
- Filtros: barra de búsqueda global + filtros por columna según tipo de campo (texto/número/fecha/select de opciones del schema). Estado en memoria del cliente.
- Orden y paginación client-side (`page_size`, default 25).
- CRUD inline: crear (fila nueva o panel lateral), editar en celda o panel, borrar con confirmación — todo vía `api.saveItem`/`api.deleteItem` que ya provee el Renderer. Nada de fetch propio a `/api/vault`.
- Selección múltiple + acción de borrado en lote.
- Densidad visual sobria; estilos con las primitivas de `src/components/ui/` existentes (no añadas librería de tablas ni de estado).
- `settings_schema.json` en el módulo describiendo la config para el designer.

ESTRUCTURA (imita calendar-scheduler): `packages/modules/data-table/{manifest.ts, DataTable.tsx, model/, controls/, README.md}` — README con el contrato de config y un ejemplo de bloque JSON.

PASOS: construir el módulo → `install-module data-table` (ciclo completo) → crear una ruta de prueba temporal vía CLI/designer apuntando a un schema existente del seed → verificar en `npm run dev` filtros, orden, paginación, crear/editar/borrar → eliminar la ruta de prueba (ciclo gobernado) → dejar instalado.

PROHIBIDO:
- Importar desde `src/components/agnostic/blocks/` (van a morir).
- Dependencias npm nuevas.
- Tocar el engine (`Renderer`, `Registry`, `vault`, APIs).
- Navegación, navbar, hero o cualquier cosa ajena a gestión tabular (violación axiomática).

CRITERIOS DE ACEPTACIÓN (pega salidas/capturas de consola):
1. `npx tsc --noEmit` limpio.
2. `list-modules` muestra `data-table` instalado; `validate:routes` verde.
3. `grep -r "agnostic/blocks" packages/modules/data-table src/components/specialized/data-table` → vacío.
4. Evidencia de la verificación manual en dev: qué schema usaste, qué operaciones CRUD ejecutaste, resultado.
5. La ruta de prueba temporal ya no existe en `storage/db/page_routes.json`.

REPORTE: `storage/fork_doc/REFACTOR_MODULOS/REPORTE_WP3.md` con archivos, salidas, decisiones de diseño (máx. 10 líneas) y dudas. Luego DETENTE.
