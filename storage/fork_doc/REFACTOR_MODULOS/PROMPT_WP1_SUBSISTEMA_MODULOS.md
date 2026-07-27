# WP-1 — Subsistema de módulos instalables

Copia todo este archivo como prompt inicial de la sesión.

---

ROL: Ejecutas el WP-1 del plan `storage/fork_doc/REFACTOR_MODULOS/00_LINEA_DE_TRABAJO.md`. Solo este WP. Lee primero `CLAUDE.md` del root.

OBJETIVO: Crear el subsistema de módulos compuestos instalables, calcando el adapter subsystem existente (misma gobernanza, misma estética CLI).

CONTEXTO OBLIGATORIO:
- `packages/core/src/adapter.ts` — `AdapterManifest`, el molde a imitar.
- `scripts/agno-adapters.ts` — comandos `list-adapters` / `install` / `remove-adapter`: gobernanza, resolver de colisiones, marcadores `agno:adapters:start/end` en `agnostic.config.ts`.
- `packages/core/src/config.ts` — `defineConfig`, tipo del campo `blocks`.
- `src/lib/agnostic/init.ts` líneas 125-139 — cómo se registran hoy los bloques de config (lazy + Suspense, categoría `guest`).
- `Comandos CLI.md` — sección Adapters, para replicar el formato de doc.

ENTREGABLES:

1. `packages/core/src/module.ts` — tipo `ModuleManifest`:
   - `id` (kebab-case, = nombre de carpeta), `name`, `description`, `version`
   - `block_types: Record<string, { entry: string; settings_schema?: string }>` — tipo de bloque (snake_case) → archivo de entrada relativo al módulo y opcional JSON de settings para el designer
   - `required_schemas?: string[]` — namespaces que el fork debe tener en `schema_definitions.json`
   - `npm_dependencies?: Record<string, string>`
2. Extender `defineConfig`: el valor de cada entrada de `blocks` puede ser `() => import(...)` (como hoy) O `{ loader: () => import(...); settings_schema?: object }`. Actualizar `init.ts` para registrar `settings_schema` cuando venga, manteniendo compat con la forma actual.
3. Comandos en un nuevo `scripts/agno-modules.ts` (registrados en `scripts/agno.ts`):
   - `list-modules` — lee `packages/modules/*/manifest.ts` + detecta cuáles están instalados (marcadores en config).
   - `install-module <id>` — ciclo OBLIGATORIO plan → `--dry` → confirmación explícita → backup en `storage/progreso/backups/`. Acción: copia `packages/modules/<id>/` a `src/components/specialized/<id>/` (excluyendo `manifest.ts`), inserta las entradas de `block_types` en `agnostic.config.ts` dentro de marcadores `agno:modules:start/end` (crear la pareja de marcadores en el bloque `blocks` si no existe), avisa de `required_schemas` ausentes y `npm_dependencies` no instaladas (aviso, no bloqueo). Colisiones = error: carpeta destino ya existe o tipo de bloque ya registrado.
   - `remove-module <id>` — inverso, mismo ciclo. Solo borra la carpeta si el usuario confirma; siempre limpia las entradas de los marcadores.
4. Sección "Módulos" en `Comandos CLI.md` (mismo formato que "Adapters").

PROHIBIDO:
- Tocar `src/components/agnostic/blocks/` (eso es WP-4).
- Crear módulos reales (eso es WP-2/WP-3). Para probar, usa un módulo dummy temporal `packages/modules/_dummy/` que BORRAS al final.
- Mutar config o specialized fuera del ciclo gobernado.

CRITERIOS DE ACEPTACIÓN (pega salidas en el reporte):
1. `npx tsc --noEmit` limpio.
2. Round-trip con `_dummy`: `install-module _dummy` (con confirmación) → `agnostic.config.ts` gana la entrada entre marcadores y existe `src/components/specialized/_dummy/` → `remove-module _dummy` → diff de `agnostic.config.ts` vacío (byte a byte o solo EOL) y carpeta eliminada. Pega ambos diffs.
3. `install-module _dummy --dry` no escribe NADA (verifica con `git status`).
4. Existe backup en `storage/progreso/backups/` por cada mutación real.
5. `npx tsx scripts/agno.ts validate:routes` sigue verde.
6. `packages/modules/_dummy/` eliminado al terminar.

REPORTE: `storage/fork_doc/REFACTOR_MODULOS/REPORTE_WP1.md` con archivos tocados, salidas de los 6 criterios, decisiones y dudas. Luego DETENTE.
