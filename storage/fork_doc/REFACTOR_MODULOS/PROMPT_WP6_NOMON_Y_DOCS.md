# WP-6 — Sync nomon_clone + docs del seed

Requiere WP-4 completado (no depende de WP-5). Copia todo este archivo como prompt inicial de la sesión.

---

ROL: Ejecutas el WP-6 del plan `storage/fork_doc/REFACTOR_MODULOS/00_LINEA_DE_TRABAJO.md`. Dos partes. Lee primero `CLAUDE.md` del seed.

PARTE A — nomon_clone (`c:\Users\javir\Documents\DEVs\nomon_clone`):
Hecho auditado: sus rutas usan 0 bloques built-in (todo custom: `nomon_home`, `proyectos_taller`, etc.). Riesgo esperado: cero.
1. Sync del engine desde el seed (procedimiento habitual del fork; su `origin` remoto está roto — solo sync local, sin push).
2. `npx tsc --noEmit` + `npx tsx scripts/agno.ts validate:routes` + `npm run build` en el fork. Los tres en verde.
3. Si algo falla, NO arregles el fork: documenta y detente (probablemente es un bug del seed y lo decide el orquestador).

PARTE B — Documentación del seed (`agnostic system`):
Actualizar SOLO estas menciones a los bloques built-in muertos:
1. `CLAUDE.md`: en Safe Operations / Key Files no hay bloques, pero revisa menciones a `form`, `table`, `collection` o al registro built-in; añade en el Adapter Contract (o sección nueva "Module Contract", 5-8 líneas) el contrato de módulos: catálogo `packages/modules/`, copy-on-install a `src/components/specialized/`, `agno install-module`, registry nace vacío.
2. `Comandos CLI.md`: verifica que la sección "Módulos" (WP-1) siga exacta al comportamiento final; añade `validate:routes`.
3. `Interfaces Custom.md`: elimina referencias a bloques built-in como punto de partida; el punto de partida es `_TEMPLATE.tsx` o instalar un módulo del catálogo.
4. `storage/progreso/current_state.md` del seed: añade el cierre de este refactor al Daily Closeout (fecha real, 5-10 líneas).
5. NO toques `storage/docs/` (se regenera con `agno docs all` — ejecútalo al final).

PROHIBIDO: cambios de código en seed o fork (salvo que `agno docs all` regenere `storage/docs/`); push en cualquier repo.

CRITERIOS DE ACEPTACIÓN:
1. Salidas de los 3 comandos de la Parte A en verde.
2. `grep -in "AgnosticForm\|AgnosticNavbar\|'form'\|'collection'" CLAUDE.md "Comandos CLI.md" "Interfaces Custom.md"` → sin menciones obsoletas (pega la salida).
3. `agno docs all` ejecutado sin errores.

REPORTE: `storage/fork_doc/REFACTOR_MODULOS/REPORTE_WP6.md` en el seed con salidas y dudas. Luego DETENTE.
