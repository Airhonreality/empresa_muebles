# WP-5 — Migrar empresa_muebles_clone (opción B) + sync

Requiere WP-4 completado y verificado por el orquestador. SE EJECUTA EN EL REPO DEL FORK: `c:\Users\javir\Documents\DEVs\empresa_muebles_clone`. Copia todo este archivo como prompt inicial de la sesión.

---

ROL: Ejecutas el WP-5 del plan (ver `storage/fork_doc/REFACTOR_MODULOS/00_LINEA_DE_TRABAJO.md` del repo SEED `agnostic system`). Solo este WP. Lee el `CLAUDE.md` del fork y su `storage/progreso/current_state.md`.

HECHOS AUDITADOS: este fork usa bloques built-in SOLO en la ruta `/app/prefabricados`: `collection`+`form` para `prefabricados` y `collection`+`form` para `prefabricados_items` (maestro-detalle). Además `src/app/app/layout.tsx` importa `AppNavbarDynamic` desde `@/components/agnostic/blocks/`, carpeta que desaparece con el nuevo engine.

ORDEN ESTRICTO (el fork nunca debe quedar roto):

1. PRE-SYNC — Adoptar el navbar: copia `AppNavbarDynamic.tsx` (desde el engine viejo aún presente en el fork) a `src/components/specialized/app-navbar/AppNavbarDynamic.tsx` y actualiza el import en `src/app/app/layout.tsx`. Verifica `npx tsc --noEmit`.
2. SYNC del engine desde el seed, con el procedimiento habitual del fork (el que usa el usuario; si no está documentado en el fork, pregunta antes de inventar). El sync trae: purga de bloques, subsistema de módulos, catálogo `packages/modules/`, `validate:routes`.
3. `npx tsx scripts/agno.ts validate:routes` → DEBE fallar exactamente con los 4 bloques de `/app/prefabricados` (form ×2, collection ×2). Si falla con más tipos, DETENTE y repórtalo.
4. `npx tsx scripts/agno.ts install-module data-table` (ciclo plan → dry → confirm).
5. Reescribir `/app/prefabricados` vía ciclo gobernado del CLI (nunca editando `storage/db/page_routes.json` a mano): reemplaza los 4 bloques por 2 bloques `data_table` — uno con `context: prefabricados`, otro con `context: prefabricados_items` en modo maestro-detalle (`parent_key` según la relación existente en `schema_definitions.json`; verifícala antes).
6. Verificación funcional en `npm run dev`: `/app/prefabricados` lista, filtra, crea, edita y borra registros de ambas entidades. Los datos existentes en `storage/db/prefabricados*.json` se ven intactos.

PROHIBIDO:
- Editar archivos de `storage/db/` a mano.
- Tocar otras rutas o componentes specialized del fork.
- Instalar `calendar-scheduler` u otros módulos no pedidos (el fork ya tiene su propio `calendar_scheduler` specialized: NO lo toques).
- Hacer push; el usuario decide cuándo publicar.

CRITERIOS DE ACEPTACIÓN (pega salidas):
1. `npx tsc --noEmit` limpio post-sync.
2. `validate:routes` verde al final.
3. `npm run build` sin errores.
4. Evidencia del paso 6 (operaciones realizadas y resultado).
5. Backup del `page_routes.json` previo en `storage/progreso/backups/`.
6. `git status` del fork pegado completo (para revisión del orquestador antes de commitear).

REPORTE: crea `storage/progreso/REPORTE_WP5_REFACTOR_MODULOS.md` EN EL FORK con archivos tocados, salidas, y dudas. Luego DETENTE (sin commit).
