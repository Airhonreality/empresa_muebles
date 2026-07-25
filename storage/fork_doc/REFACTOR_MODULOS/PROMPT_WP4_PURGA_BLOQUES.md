# WP-4 — Purga de bloques built-in

Requiere WP-2 y WP-3 completados. Copia todo este archivo como prompt inicial de la sesión.

---

ROL: Ejecutas el WP-4 del plan `storage/fork_doc/REFACTOR_MODULOS/00_LINEA_DE_TRABAJO.md`. Solo este WP. Lee primero `CLAUDE.md` del root.

OBJETIVO: Eliminar la librería de bloques UI del seed. El registry nace vacío: solo registra lo declarado en `agnostic.config.ts`.

CONTEXTO OBLIGATORIO:
- `src/lib/agnostic/init.ts` — quedará reducido al bucle de bloques de config (líneas 125-139 actuales, con el soporte `settings_schema` de WP-1).
- `src/components/agnostic/designer/components/RecursiveBlockComposer.tsx` — usa `registry.getManifest()` y tiene fallback `blockSettingsSchema`; debe funcionar con manifest solo-guest.
- `src/lib/agnostic/SchemaInterpreter.ts` — referencia a manifest/bloques: revisa qué usa y quita solo lo que dependa de tipos built-in.

BORRAR:
1. `src/components/agnostic/blocks/` completa (18 archivos, incluye `AppNavbarDynamic.tsx`, `SystemHealth.tsx`, `ProjectSelector.tsx`, `AgnosticBelt.tsx` — código muerto confirmado en el seed; `AppNavbarDynamic` lo adopta el fork en WP-5).
2. En `init.ts`: todos los imports de bloques, `AgnosticTableWrapper`, `VISUAL_BLOCKS` y los 19 `registry.register(...)` de built-ins. Queda solo el registro de bloques de config.
3. `src/core/designer/dna/schemas/*.settings.json` que queden huérfanos (verifica con grep uno a uno antes de borrar; los que use el designer como fallback se quedan).
4. Cualquier import roto resultante (búscalo con `npx tsc --noEmit`, no a ojo).

REGLA DE ORO: si un archivo fuera de la lista anterior importa algo borrado, NO reimplementes el bloque: elimina el uso o trae la pieza mínima al consumidor, y documéntalo. Si el consumidor es el engine (Renderer/Shell/vault/designer) y el arreglo no es obvio: DETENTE y pregunta en el reporte.

PROHIBIDO:
- Tocar `packages/modules/`, `src/components/specialized/`, `storage/db/`.
- Borrar `Registry.ts`, `AgnosticRenderer.tsx` o cualquier pieza del motor.
- "Aprovechar" para refactors no pedidos.

CRITERIOS DE ACEPTACIÓN (pega salidas):
1. `npx tsc --noEmit` limpio.
2. `grep -r "agnostic/blocks" src packages agnostic.config.ts` → vacío.
3. `npx tsx scripts/agno.ts validate:routes` verde (el seed solo usa `calendar_scheduler` + lo instalado).
4. `npm run build` sin errores.
5. En `npm run dev`: la ruta del calendario renderiza; el designer (`/_agnostic`) abre y su selector de bloques muestra los bloques guest instalados sin crashear.
6. `wc -l src/lib/agnostic/init.ts` — debe quedar en ~30-40 líneas; pega el archivo completo en el reporte.

REPORTE: `storage/fork_doc/REFACTOR_MODULOS/REPORTE_WP4.md` con archivos borrados/tocados, salidas de los 6 criterios, huérfanos de settings borrados vs conservados, y dudas. Luego DETENTE.
