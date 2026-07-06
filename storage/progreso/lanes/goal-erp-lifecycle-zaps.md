# Contrato de lane: goal/erp-lifecycle-zaps

> Construye el GUARDIA de la máquina de estados: ninguna transición ilegal de
> `proyectos.estado` puede persistirse. Depende del canon ya integrado en
> `MATRIZ_ESTADOS.md`. Corre en paralelo con `erp-finanzas-ux` (no comparten archivos).

## Identidad
- **Rama:** `goal/erp-lifecycle-zaps`
- **Worktree:** `git worktree add ../wt-lifecycle -b goal/erp-lifecycle-zaps`
- **Rol/modelo:** worker de código (liviano). El diseño ya está en la matriz aprobada.
- **Estado:** plan_aprobado

## Goal (teleología)
Que el ciclo de vida comercial sea una **máquina de estados real**: hoy el kanban persiste
cualquier `newStage` sin validar, y varios zaps escriben `estado` directo. Al cerrar, toda
escritura de estado pasa por un guardia que rechaza transiciones no permitidas por la matriz.

## Fuente de verdad
`storage/progreso/MATRIZ_ESTADOS.md` (ya integrada en dev). Lee de ahí el vocabulario canónico
y la tabla de transiciones legales + las "Correcciones manuales". NO redefinas estados.

## Superficie (y SOLO esta)
- `storage/db/scripts.json` (el nuevo zap + los zaps que escriben estado).
- `src/components/specialized/kanban/ComercialKanban.tsx` (el handler de move que persiste estado).

## Fuera de alcance
- NO tocar el schema (lo cerró comercial-state), ni finanzas, ni tokens.
- NO cambiar el vocabulario de estados ni las transiciones (vienen de la matriz).

## DAG de tareas (cada una con DoD ejecutable)
1. **Crear `zap_validar_transicion_estado`** en scripts.json: recibe `estado_actual` y
   `estado_destino`, devuelve permitido/rechazado según la tabla de la matriz (incluye las
   "Correcciones manuales" como permitidas). DoD: probar por CLI
   (`npx tsx scripts/agno.ts ...`) una transición legal (OK) y una ilegal (rechazada).
   Mutación de scripts.json bajo la Harness Mutation Rule (plan → dry → confirmación → backup).
2. **Cablear el move del kanban** para que consulte el guardia antes de persistir: si la
   transición es ilegal, no escribe y avisa (`api.notify.error`). DoD: mover una tarjeta a un
   estado no permitido no persiste.
3. **Enrutar los zaps que escriben estado** (p.ej. `generar_contrato`,
   `registrar_abono_y_activar`, `zap_activar_produccion`) para que validen la transición antes
   de escribir. DoD: cada uno rechaza una transición ilegal.
4. Si necesitas cambiar el comportamiento del kanban MÁS ALLÁ de agregar validación, PÁRATE y
   pregunta (no rediseñes UI aquí).

## DoD de cierre
- [ ] `zap_validar_transicion_estado` existe y valida contra la matriz (legal OK, ilegal rechazada).
- [ ] Kanban y los zaps de estado pasan por el guardia; ninguna transición ilegal persiste.
- [ ] `npm run validate:storage` + `npm run validate:encoding` verdes.
- [ ] commit(s) en la rama sin `--no-verify`; matriz de verificación completa.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | Guardia legal | CLI transición permitida | permitido | | |
| V2 | Guardia ilegal | CLI transición no permitida | rechazado | | |
| V3 | Kanban bloquea ilegal | mover tarjeta a estado no permitido | no persiste + aviso | | |
| V4 | Zaps validan | ejecutar zap con transición ilegal | rechazado | | |
| V5 | Gates | validate:storage + validate:encoding | verdes | | |

## Handoff
Al cerrar, el Orquestador audita (incluido `git show --stat` buscando archivos fuera de
superficie) e integra a `dev` con `--no-ff`.
