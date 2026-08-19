# Plan: módulo de búsqueda resiliente estándar (tildes/tokens/fuzzy) + filtros, en las pantallas principales del ERP

**ID de tarea**: t-141
**Zona**: `lib/search/` (nuevo) + `lib/hooks/` (nuevo) + `components/veta/` (primitivas + SmartSearch) + 6 pantallas ERP
**Tipo**: mixto: lógica (módulo puro + hooks) + UI (primitivas + integración en pantallas)
**Riesgo**: bajo-medio — cero escrituras a Neon (build con `DATA_IMPL=mock`), cero cambios de schema, cero `lib/data/actions/`

## Objetivo

Un buscador "resiliente" (tolera tildes, ñ/ü, mayúsculas, caracteres raros, orden de palabras y typos) como módulo estándar reutilizable con filtros, incorporado a las pantallas del ERP que listan colecciones/registros, materializando el contrato M-06 §A.3/A.5 y las primitivas D4 §2.2/§2.3 (Búsqueda y Filtros).

## Decisiones del Supervisor (2026-08-19)

1. **Opción A — fuzzy acotado ON por default**: matcher en capas — normalización (NFD) → tokens AND → fallback Levenshtein ≤1 edición para tokens ≥4, ≤2 para ≥6. Reversible por flag por pantalla.
2. **Desviación documentada vs m06 §A.5**: A.5 describe fuzzy (Levenshtein) como mecanismo principal; acá es la **capa 3** de un pipeline cuya base es normalización+tokens. Se registra en este plan y en `t-141.json`; el hook implementa A.5 completo (historial/contexto/LRU) — solo cambia el matcher.
3. Alcance: todas las pantallas principales con colecciones (kanban comercial, portafolio, clientes, equipo, pedidos-web, taller) + catálogo (beneficio gratis vía SmartSearch).

## Archivos afectados

### Nuevos
- `lib/search/normalizar.ts` — util pura: `normalizarTexto`, `tokensDe`, `distanciaLevenshtein`, `coincide` (layers), `scoreCoincidencia` (ranking).
- `lib/search/normalizar.test.ts` — round-trip del matcher (12 casos: tildes, tokens AND, fuzzy, umbrales).
- `lib/hooks/useDebounce.ts` — patrón M-06 §A.3 (materializa la doc).
- `lib/hooks/useSmartSearch.ts` — patrón M-06 §A.5 (materializa la doc): matcher en capas + historial por contexto (clave `<contexto>-search`) + uso frecuente LRU (max 50) + ranking.
- `components/veta/busqueda.tsx` — primitiva D4 "Búsqueda" (variante local, lupa, ✕ limpiar, a11y).
- `components/veta/filtros.tsx` — primitiva D4 "Filtros" (`FiltroChip` con `aria-pressed`, `BarraFiltros` con fieldset/legend y "Limpiar filtros").
- `arnes/tareas/t-141.json` — ledger.
- `arnes/lineas/ola7/plan_t-141.md` — este plan.

### Modificados
- `components/veta/smart-search.tsx` — matching naive → `useSmartSearch` (matcher resiliente); prop nueva aditiva `contexto?: string`; sugerencias de uso frecuente; fix del dropdown vacío.
- `lib/data/mock-store.ts` — `catalogo.buscar()` alineado al matcher (read-only, sin `notify()`).
- `lib/data/drizzle-impl.ts` — `catalogo.buscar()` alineado al matcher.
- `lib/data/mock-store.test.ts` — nuevo test round-trip de `catalogo.buscar()` con tildes/tokens/typo.
- `app/erp/comercial/page.tsx` — cierra **CA-7** (disenio_p01 §5.2): `Busqueda` + `useSmartSearch` con `contexto="comercial-kanban"` (localStorage `comercial-kanban-search`), filtro por tipo de proyecto, filtro aplicado **antes** de `columnData` (los conteos de columna reflejan el filtro), "Limpiar filtros".
- `app/erp/portafolio/page.tsx` — `Busqueda` + filtro por `coincide` (título/proyecto/categoría/descripción).
- `app/erp/clientes/page.tsx` — input naive → `Busqueda` + `coincide` (nombre/teléfono/email/documento).
- `app/erp/equipo/page.tsx` — input naive → `Busqueda` + `coincide` (nombre/email/documento/teléfono).
- `app/erp/pedidos-web/page.tsx` — filtro cliente naive → `Busqueda` + `coincide`; filtro total alineado.
- `app/erp/taller/page.tsx` — `Busqueda` + `coincide` (proyecto/cliente/obra) sobre el resumen filtrado por gate.

## Criterios de aceptación

1. `lib/search/normalizar.test.ts` pasa (12 tests): tildes (García→garcia), tokens AND en orden distinto, fuzzy ≤1 (≥4 chars) y ≤2 (≥6 chars), sin fuzzy para tokens < 4, umbral configurable.
2. `mock-store.test.ts` incluye el caso round-trip de `catalogo.buscar()` (tildes + tokens + typo) y pasa.
3. Kanban: escribir "cocina" filtra las tarjetas; la clave `comercial-kanban-search` se escribe en localStorage; el filtro por tipo se aplica antes de `columnData`; "Limpiar filtros" restaura todo.
4. Portafolio, clientes, equipo, pedidos-web y taller muestran el buscador en el nivel superior y filtran con tolerancia a tildes/typos.
5. Catálogo y el selector de proyecto de pedidos-web (SmartSearch) buscan con el matcher resiliente sin cambios en sus callers.
6. `npx tsc --noEmit` = 0 errores.
7. `npx eslint .` = 0 errores.
8. `DATA_IMPL=mock npx next build` no muestra errores salvo los esperados por falta de `DATABASE_URL` (páginas que consultan datos, AGENTS.md).
9. Sin escrituras a Neon, sin cambios de schema, sin `getDataStore()`.

## Verificación

- `npx tsx lib/search/normalizar.test.ts`
- `DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx lib/data/mock-store.test.ts`
- `npx tsc --noEmit`
- `npx eslint .`
- `DATA_IMPL=mock npx next build`

## Notas

- **C.7 (M-06)**: los hooks viven en `lib/hooks/`, las primitivas en `components/veta/` siguiendo tokens D4 ya vigentes (`bg-bg-paper`, `border-border-subtle`, `focus:border-brand`, `focus:shadow-ring-focus`, `gold-*`, `duration-fast`). Sin `cn()`/clsx (template literals, patrón del repo).
- **C.4**: `SmartSearch` gana una prop aditiva (`contexto?`) — no rompe los callers existentes.
- **DoD F10**: `useId()` en los inputs de las primitivas; `buscar()` es read-only (no `notify()`); memos con `getVersion()`.
- **Escrituras**: ninguna. El único almacenamiento es localStorage del navegador (historial/uso), best-effort y aislado por contexto.
- Contrato vivo: al cerrar se marca A.3/A.5 de `m06_capa_tecnica_transversal.md` como materializados y se actualiza `arnes/estado.md`/`estado_ola7.md`.