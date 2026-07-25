# WP-2 — Mover calendar-scheduler al catálogo

Requiere WP-1 completado. Copia todo este archivo como prompt inicial de la sesión.

---

ROL: Ejecutas el WP-2 del plan `storage/fork_doc/REFACTOR_MODULOS/00_LINEA_DE_TRABAJO.md`. Solo este WP. Lee primero `CLAUDE.md` del root.

OBJETIVO: Convertir `src/components/specialized/calendar-scheduler/` en el primer módulo real del catálogo, sin que la ruta del seed que usa `calendar_scheduler` deje de funcionar.

CONTEXTO OBLIGATORIO:
- `packages/core/src/module.ts` — `ModuleManifest` (creado en WP-1).
- `scripts/agno-modules.ts` — comandos install/remove (creados en WP-1).
- `src/components/specialized/calendar-scheduler/README.md` y `CalendarScheduler.tsx` — el módulo a mover.
- `agnostic.config.ts` — registro actual de `calendar_scheduler`.

PASOS:
1. Copia `src/components/specialized/calendar-scheduler/` → `packages/modules/calendar-scheduler/` y escribe su `manifest.ts` (`block_types: { calendar_scheduler: { entry: './CalendarScheduler', ... } }`). Si el módulo hoy importa APIs del engine (`@/lib/agnostic/...`, `@agnostic/core`), déjalas: los módulos instalados viven en el fork y pueden usar el engine.
2. Quita el registro manual de `calendar_scheduler` de `agnostic.config.ts` y borra `src/components/specialized/calendar-scheduler/`.
3. Reinstala vía el flujo real: `npx tsx scripts/agno.ts install-module calendar-scheduler` (plan → dry → confirm). Esto valida el subsistema con un módulo de verdad.
4. Si `install-module` falla por algo que es un bug de WP-1, corrígelo con el cambio MÍNIMO y documéntalo en el reporte.

PROHIBIDO:
- Refactorizar la lógica interna del calendario (se mueve tal cual).
- Tocar `src/components/agnostic/blocks/` o `init.ts` (más allá de lo que WP-1 ya cambió).
- Editar `storage/db/` a mano.

CRITERIOS DE ACEPTACIÓN (pega salidas):
1. `npx tsc --noEmit` limpio.
2. `npx tsx scripts/agno.ts list-modules` muestra `calendar-scheduler` como instalado.
3. `npx tsx scripts/agno.ts validate:routes` verde (la ruta del seed con `calendar_scheduler` resuelve).
4. `npm run build` (o `npm run dev` + carga de la ruta del calendario) sin errores de import.
5. `git status`: no queda rastro de la carpeta vieja; `packages/modules/calendar-scheduler/` contiene módulo + manifest; `src/components/specialized/calendar-scheduler/` existe como copia instalada.

REPORTE: `storage/fork_doc/REFACTOR_MODULOS/REPORTE_WP2.md` con archivos tocados, salidas, bugs de WP-1 corregidos (si hubo) y dudas. Luego DETENTE.
