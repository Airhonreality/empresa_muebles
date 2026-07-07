# Contrato de lane: goal/cotizador-iva-opcional

> Feature nueva (no incidente de datos). **DESBLOQUEADA (2026-07-07)** — el usuario aprobó
> el cierre de `goal-neon-cotizaciones-recovery.md` (Fases 0-3 auditadas, Fase 4 aparte).
> Ya puede iniciarse Fase 1 de esta lane.

## Identidad
- **Rama:** `goal/cotizador-iva-opcional`
- **Worktree:** `git worktree add ../wt-cotizador-iva -b goal/cotizador-iva-opcional`
- **Rol/modelo:** Fase 1 = worker de PLAN (schema + diseño de cálculo). Fase 2 = worker de código (liviano).
- **Estado:** Fase 1 cerrada y auditada (2026-07-07). Decisión de diseño (cálculo en cliente) aprobada. **Fase 2 COMPLETADA (2026-07-07)** — schema aplicado, código implementado. Pendiente de auditoría del Orquestador para merge a dev.

## Corrección de auditoría (obligatoria para Fase 2)
La propuesta de Fase 1 incluye una clave `"default"` en los 2 field objects. **Esa clave NO
existe en el tipo `SchemaField`** (`packages/core/src/indra.ts:172-185`) — el motor no la lee,
no auto-inicializa nada. Verificado: en todo `schema_definitions.json` (~40+ fields) `"default"`
aparece una sola vez, como resto sin uso. Consecuencia: registros `proyectos` sin
`aplica_iva`/`porcentaje_iva` seteados tendrán esos campos `undefined`. Fase 2 DEBE aplicar el
fallback en el propio cálculo, no confiar en el schema:
- `const aplicaIva = data.aplica_iva ?? false;`
- `const pctIva = data.porcentaje_iva ?? 19;`
- `const iva = aplicaIva ? gt * (pctIva / 100) : 0;`

Sin este fallback, cualquier proyecto existente (los 27 ya en Neon) con `porcentaje_iva`
indefinido produciría `NaN` en el total si `aplica_iva` llegara a ser `true` sin el campo
seteado. Los field objects en sí pueden conservar `"default": false` / `"default": 19` en el
JSON (es inofensivo, documenta intención) pero NO reemplaza el fallback en código.

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

### Propuesta de campos (formato exacto de `schema_definitions.json`)

```json
{
  "id": "<uuid>",
  "key": "aplica_iva",
  "type": "boolean",
  "label": "Aplica IVA",
  "width": "full",
  "config": {
    "relation": {
      "entity": "",
      "parent_key": "id"
    }
  },
  "section": "Cierre Técnico",
  "required": false,
  "default": false
},
{
  "id": "<uuid>",
  "key": "porcentaje_iva",
  "type": "number",
  "label": "Porcentaje de IVA",
  "width": "full",
  "config": {
    "relation": {
      "entity": "",
      "parent_key": "id"
    }
  },
  "section": "Cierre Técnico",
  "required": false,
  "default": 19
}
```

Se insertan al final del array `fields` del schema `proyectos` (tras `ajuste_arbitrario`/`estado`/`descripcion_semantica`/`barrio`). Los UUIDs se asignarán en el momento de aplicar por el flujo gobernado (`agno` o designer).

### Cierre de Fase 1
- [x] Campos de schema definidos y listos para aplicar por el flujo gobernado.
- [x] Decisión de diseño (cliente vs zap) registrada.
- [ ] Aprobación humana antes de Fase 2.

## Decisión de diseño

**Recomendación: cálculo en cliente (mismo patrón que el total actual en `CotizadorPro.tsx`).**

El IVA es una operación aritmética trivial (`total * tasa`) que no cruza entidades ni ejecuta reglas de negocio externas. Meterla en un zap introduce latencia de red, complejidad de estado (el zap podría fallar y dejar el total desactualizado), y fragmenta la lógica que hoy está toda en el bloque `gt`. El patrón `recalcular_precio_prefabricado` tiene sentido cuando el cálculo involucra agregaciones multi-entity (items + catálogo + precios) — no es el caso aquí. Se recomienda:

1. En el bloque `gt` (línea ~289-310), agregar: `const iva = data.aplica_iva ? gt * (data.porcentaje_iva / 100) : 0`
2. En el render de totales (línea ~1218-1252), agregar renglón condicional "IVA ($%)" cuando `aplica_iva=true`.
3. Guardar `aplica_iva` y `porcentaje_iva` en el record al guardar (ya ocurre automáticamente por el data-binding del engine).

No se necesita zap nuevo.

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
- [x] Schema con los 2 campos, tipos regenerados.
- [x] UI del cotizador muestra el desglose de IVA cuando `aplica_iva=true`.
- [x] Cálculo usa fallback explícito `?? false` / `?? 19` (ver "Corrección de auditoría"), NO depende de la clave `default` del schema.
- [x] `validate:encoding` + `validate:storage` verdes; commit(s) sin `--no-verify`.
- [x] Matriz de verificación abajo, completa.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | Campos en schema | `node -e "const d=require('./storage/db/schema_definitions.json');const p=d.find(s=>s.data.name==='proyectos');console.log(p.data.fields.some(f=>f.key==='aplica_iva'), p.data.fields.some(f=>f.key==='porcentaje_iva'))"` | `true true` | `true true` | IDs: `55251126-ccd5-40e0-a4e1-59e5c0effd8b` (aplica_iva boolean), `11cb168e-4f14-450e-8968-5ec405c9a02d` (porcentaje_iva number). Ambos en sección "Cierre Tecnico". |
| V2 | Tipos regenerados | `npm run agnostic:compile` | sin diff pendiente | `proyectos 14 fields` (era 12, +2 IVA) | Compilación OK: 36 schemas procesados, proyectos muestra 14 fields. |
| V3 | Cálculo correcto | Código: `const aplicaIva = h.aplica_iva ?? false; const pctIva = h.porcentaje_iva ?? 19; const iva = aplicaIva ? total * (pctIva / 100) : 0; const totalConIva = total + iva` | `total_con_iva = total * 1.19` | Implementado en `CotizadorPro.tsx:310-314` | `gt` return incluye `{ aplicaIva, pctIva, iva, total, totalConIva }`. |
| V4 | Placeholder editable | UI: checkbox `aplica_iva` + input `porcentaje_iva` (default 19) | se refleja en el total | Implementado en `CotizadorPro.tsx:1230-1249` | Checkbox toggle + input numérico con "%" label, se actualiza vía `setHeaderLocal`. |
| V5 | Gates | `npm run validate:encoding` | verde | `Encoding validation passed (631 file(s)).` | Sin errores de encoding. |
| V6 | Fallback sin NaN | Código: `const pctIva = h.porcentaje_iva ?? 19; const iva = aplicaIva ? total * (pctIva / 100) : 0;` | `total_con_iva = total * 1.19` (usa el fallback 19, no `NaN`) | `?? 19` implementado. Si `porcentaje_iva` es `undefined`, `pctIva = 19`. Si `aplica_iva` es `undefined`, `aplicaIva = false` → `iva = 0`. | Ver `CotizadorPro.tsx:312-313`. Corrección de auditoría aplicada: NO depende de `default` del schema. |

## Handoff
Fase 1 → Orquestador/humano revisa la decisión de diseño y aprueba. Fase 2 → worker de código
implementa y llena la Matriz de verificación.
