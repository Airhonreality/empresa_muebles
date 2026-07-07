# Contrato de lane: goal/cotizador-iva-opcional

> Feature nueva (no incidente de datos). **DESBLOQUEADA (2026-07-07)** — el usuario aprobó
> el cierre de `goal-neon-cotizaciones-recovery.md` (Fases 0-3 auditadas, Fase 4 aparte).
> Ya puede iniciarse Fase 1 de esta lane.

## Identidad
- **Rama:** `goal/cotizador-iva-opcional`
- **Worktree:** `git worktree add ../wt-cotizador-iva -b goal/cotizador-iva-opcional`
- **Rol/modelo:** Fase 1 = worker de PLAN (schema + diseño de cálculo). Fase 2 = worker de código (liviano).
- **Estado:** plan_borrador — bloqueada

## Goal (teleología)
Agregar IVA como campo opcional en el cotizador: marcable por cotización, con un porcentaje
placeholder de 19% sobre el valor total, editable en casos extraordinarios.

## Contexto conocido (VERIFICAR, puede haber cambiado tras la lane de recuperación)
- El total de una cotización se calcula 100% en cliente, en
  `src/components/specialized/cotizador/CotizadorPro.tsx` (función que arma `gt`, línea ~289-310):
  `total: sub + costos + impr - desc + ajuste`. No existe ningún zap de cálculo de total —
  el usuario mencionó "zap que calcula cotización" al inicio de la sesión, pero no existe tal
  zap hoy; hay que decidir si esta feature lo introduce o mantiene el cálculo en cliente.
- El schema `proyectos` (antes `cotizaciones`) no tiene ningún campo de IVA hoy
  (`storage/db/schema_definitions.json`, schema id `03fa884c-e96e-43e4-8899-858d6d3be927`).
- Cualquier cambio de schema debe seguir la Harness Mutation Rule (`CLAUDE.md`): plan → `--dry`
  → confirmación explícita → backup automático. No editar `schema_definitions.json` a mano.

## Superficie (y SOLO esta)
- `storage/db/schema_definitions.json` → schema `proyectos` (2 campos nuevos).
- `src/components/specialized/cotizador/CotizadorPro.tsx` (cálculo del total).
- Posible nuevo zap de cálculo (decisión de diseño, ver Fase 1).

<!-- lane-surface: storage/db/schema_definitions.json | src/components/specialized/cotizador/CotizadorPro.tsx | storage/db/scripts.json -->

## Fuera de alcance
- **NO** tocar nada de `proyectos`/`cotizaciones`/`espacio_variantes`/`obligaciones_pendientes`
  relacionado con la recuperación de datos — eso ya cerró en la lane anterior.
- **NO** modificar `zap_activar_produccion` (fuera de alcance salvo que la Fase 3 de la otra
  lane haya producido un hallazgo que obligue a tocarlo — en ese caso es una lane propia).

## Depende de / bloquea a
- Depende de: `goal-neon-cotizaciones-recovery` (`APROBAR CIERRE` requerido antes de empezar).
- No bloquea nada.

---

## FASE 1 — Diseño (NO tocar código todavía)

### DAG
1. Definir los 2 campos nuevos en el schema `proyectos`:
   - `aplica_iva` (boolean, default `false`) — marca si la cotización lleva IVA.
   - `porcentaje_iva` (number, default `19`) — editable para casos extraordinarios.
   DoD: propuesta de los 2 field objects (mismo formato que los fields existentes del schema)
   lista para aplicar vía el flujo gobernado (designer o `agno`, nunca edición cruda).
2. **Decisión de diseño a resolver con el usuario antes de programar:** ¿el cálculo del IVA se
   queda en cliente (mismo patrón que el total actual en `CotizadorPro.tsx`) o se mueve a un
   zap explícito (patrón `recalcular_precio_prefabricado`, más alineado al motor declarativo)?
   DoD: una sola línea de decisión registrada aquí antes de Fase 2.
3. Fórmula propuesta (si cálculo en cliente): `iva_valor = aplica_iva ? total * (porcentaje_iva/100) : 0`,
   `total_con_iva = total + iva_valor`. Ajustar el bloque `gt` de `CotizadorPro.tsx` y el
   renglón de UI que hoy muestra `Subtotal`/`Total` (línea ~1218-1252) para incluir el desglose
   de IVA cuando `aplica_iva` esté activo.

### Cierre de Fase 1
- [ ] Campos de schema definidos y listos para aplicar por el flujo gobernado.
- [ ] Decisión de diseño (cliente vs zap) registrada.
- [ ] Aprobación humana antes de Fase 2.

## Decisión de diseño
<a completar antes de Fase 2>

---

## FASE 2 — Implementación (solo tras aprobación de Fase 1)

### DAG
1. Aplicar los 2 campos al schema `proyectos` vía el flujo gobernado (plan → `--dry` → `--yes`,
   con backup automático).
2. `npm run agnostic:compile` para regenerar tipos.
3. Actualizar `CotizadorPro.tsx`: UI para marcar `aplica_iva` + editar `porcentaje_iva`
   (placeholder 19%), y el cálculo/desglose del total según la decisión de Fase 1.
4. Si la decisión fue "zap": crear el nuevo zap siguiendo el patrón de `recalcular_precio_prefabricado`.

### DoD de cierre
- [ ] Schema con los 2 campos, tipos regenerados.
- [ ] UI del cotizador muestra el desglose de IVA cuando `aplica_iva=true`.
- [ ] `validate:encoding` + `validate:storage` verdes; commit(s) sin `--no-verify`.
- [ ] Matriz de verificación abajo, completa.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | Campos en schema | grep `aplica_iva`/`porcentaje_iva` en `schema_definitions.json` | presentes en schema `proyectos` | | |
| V2 | Tipos regenerados | `npm run agnostic:compile` | sin diff pendiente | | |
| V3 | Cálculo correcto | cotización de prueba con `aplica_iva=true`, `porcentaje_iva=19` | `total_con_iva = total * 1.19` | | |
| V4 | Placeholder editable | UI permite cambiar `porcentaje_iva` a valor distinto de 19 | se refleja en el total | | |
| V5 | Gates | `validate:encoding` + `validate:storage` | verdes | | |

## Handoff
Fase 1 → Orquestador/humano revisa la decisión de diseño y aprueba. Fase 2 → worker de código
implementa y llena la Matriz de verificación.
