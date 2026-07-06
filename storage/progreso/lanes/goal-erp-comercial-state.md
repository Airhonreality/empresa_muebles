# Contrato de lane: goal/erp-comercial-state  (KEYSTONE)

> Contrato para delegar. Esta lane produce la `MATRIZ_ESTADOS.md`, el diccionario
> canónico de estados de proyecto. Es el keystone: desbloquea `erp-lifecycle-zaps` y
> `erp-finanzas-ux`. Se ejecuta en DOS fases con aprobación humana en medio.

## Identidad
- **Rama:** `goal/erp-comercial-state`
- **Worktree:** `git worktree add ../wt-comercial-state -b goal/erp-comercial-state`
- **Rol/modelo:** Fase 1 = worker de PLAN (modelo con juicio). Fase 2 = worker de código (liviano).
- **Estado:** plan_borrador

## Goal (teleología)
Que **el archivero (schema) y la pizarra (UI kanban) usen EXACTAMENTE el mismo vocabulario
de estados de un proyecto**, con reglas explícitas de qué transición es legal. Hoy no
coinciden y el kanban persiste estados sin validación → se pierde la trazabilidad del ciclo
de vida comercial.

## Superficie (y SOLO esta)
- `storage/db/schema_definitions.json` → el schema `proyectos` (campo `estado`).
- `src/components/specialized/kanban/ComercialKanban.tsx`, `ComercialCard.tsx`, `CotizadorPro.tsx`.
- Nuevo: `storage/progreso/MATRIZ_ESTADOS.md` (el deliverable).

## Fuera de alcance
- **NO** crear zaps de transición (eso es `goal/erp-lifecycle-zaps`, lane siguiente).
- **NO** tocar finanzas, adapters, tokens/css.
- **NO** renombrar `proyecto`/`cotizacion`/`nombre_proyecto` todavía (deuda semántica: solo
  documéntala como hallazgo, no la ejecutes).

## Contexto conocido (VERIFICAR en los archivos, pueden haber cambiado)
- Auditorías previas coinciden en que este es el problema #1 del ERP.
- El schema `proyectos.estado` estaría en vocabulario viejo (p.ej. `Prospecto`, `Cotizando`,
  `Aprobado`, `Producción`, `Entregado`).
- La UI kanban usaría otro (p.ej. `activa`, `enviada`, `en_contrato`, `pre_produccion`,
  `produccion`).
- El move del kanban escribiría al vault sin validación de transición.
- Fuente de verdad = los archivos reales + los árboles en `storage/docs/` (`agno docs all`).

---

## FASE 1 — Producir la matriz (NO tocar código)

### DAG
1. **Inventariar el vocabulario real.** DoD: tabla con los valores EXACTOS de `estado` en
   (a) el enum del schema `proyectos`, (b) las columnas del `ComercialKanban`, (c) cualquier
   `estado` leído/escrito por zaps comerciales. Con `archivo:línea`.
2. **Detectar el desalineamiento.** DoD: mapeo columna-por-columna de qué valor de UI
   corresponde (o no) a qué valor de schema; marcar huérfanos en ambos lados.
3. **Proponer el vocabulario canónico + máquina de estados.** DoD: `MATRIZ_ESTADOS.md` con:
   - Lista única y definitiva de estados (nombres exactos, `snake_case`, una sola vocabulario).
   - Tabla de transiciones legales: `estado_actual → [estados_destino_permitidos]`.
   - Mapeo de migración: valor viejo → valor canónico (para no perder datos existentes).
   - Sección "Hallazgos" (deuda `proyecto/cotizacion`, campos huérfanos) — documentar, no arreglar.
4. **Marcar `Estado: plan_borrador` y PARARSE.** No implementar nada. Devolver la propuesta
   para aprobación humana.

### Cierre de Fase 1
- [ ] `MATRIZ_ESTADOS.md` creado, con vocabulario canónico + transiciones + mapeo de migración.
- [ ] Cero cambios en schema/UI (solo el doc nuevo).
- [ ] commit en `goal/erp-comercial-state`; `validate:encoding` + `validate:storage` verdes.
- [ ] Devolver al Orquestador/humano. **Esperar aprobación explícita (`APROBAR MATRIZ`) antes de Fase 2.**

---

## FASE 2 — Alinear (SOLO tras `APROBAR MATRIZ`)

### DAG
1. Alinear el enum de `proyectos.estado` en el schema al vocabulario canónico (usando `agno`,
   no edición cruda; seguir la Harness Mutation Rule: plan → dry → confirmación → backup).
2. Migrar los registros existentes con el mapeo viejo→canónico.
3. Alinear el vocabulario del `ComercialKanban`/`ComercialCard` al mismo canon.
4. `npm run agnostic:compile` para regenerar tipos.
5. Dejar preparado (documentado, no creado) el punto donde `erp-lifecycle-zaps` insertará
   `zap_validar_transicion_estado`.

### DoD de cierre
- [ ] Schema `estado` y UI kanban usan el MISMO vocabulario (verificable: grep de valores coincide).
- [ ] Registros migrados; ninguno quedó con valor viejo.
- [ ] `agnostic:compile` corrido; tipos regenerados.
- [ ] `validate:encoding` + `validate:storage` verdes; commit(s) sin `--no-verify`.
- [ ] Matriz de verificación abajo, completa.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | Vocabulario único | grep de valores `estado` en schema vs UI | conjuntos idénticos | | |
| V2 | Sin huérfanos | revisión del mapeo | todo valor UI ↔ valor schema | | |
| V3 | Datos migrados | inspección de `proyectos` | 0 registros con valor viejo | | |
| V4 | Tipos al día | `npm run agnostic:compile` | sin diff pendiente | | |
| V5 | Gates | `validate:encoding` + `validate:storage` | verdes | | |

## Handoff
Fase 1 → Orquestador revisa la matriz y decide `APROBAR MATRIZ`. Recién ahí se autoriza
Fase 2 y, al cerrar, se desbloquean `erp-lifecycle-zaps` y `erp-finanzas-ux`.
