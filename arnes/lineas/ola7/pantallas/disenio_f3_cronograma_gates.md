# Diseño F3 — Cronograma + Gates E-18/E-33 (Veta de Oro)

**Fecha:** 2026-08-05
**Estado:** Propuesta para aprobación del Supervisor
**Objetivo:** Mostrar diseño F3 (especialmente gates E-18/E-33) antes de cerrar F2, para alineación de schema y pantallas.
**Artefactos base:** `OLA_6_GATES_SCHEMAS.md`, `d3_ui_b3_2_cronograma_gates.md`, `glosario_h07.md`

---

## 1. Qué es F3 y por qué se revisa antes de cerrar F2

F3 = **Cronograma + gates E-18/E-33** (B3-2: P-06..P-12).

**Por qué se revisa antes de cerrar F2:**
- P-04 (cotizador, F2) y P-08/P-09 (F3) **comparten `proyectos`** — el estado del proyecto en el cotizador debe alinearse con las transiciones que el cronograma gestiona.
- **E-18** (check de schema) y **E-33** (desfase cronograma) son gates que P-04 dispara visualmente (el kanban y el cotizador leen el estado del proyecto).
- F3 introduce **2 tablas nuevas de schema** (`cronograma_etapas`, `desfases_cronograma`) + 4 tablas de gates (`verificaciones`, `schemas_proyecto`, `veredictos`, `citaciones_calidad` que ya están parciales en Ola 6).

---

## 2. Schema F3 (Resumen — Solo lo que cambia)

### Tablas NUEVAS (F3):

| Tabla | Qué contiene | Gate asociado |
|---|---|---|
| `cronogramas` | `proyecto_id`, `base_semanas (7)`, `holgura_maxima_dias (5)`, `promesa_semanas (7)` | E-33 (base) |
| `cronograma_etapas` | `cronograma_id`, `linea (contractual/interna)`, `etapa`, `fecha_ideal`, `fecha_real`, `estado` | E-33 (recálculo) |
| `desfases_cronograma` | `proyecto_id`, `dias_desfase`, `aplicado`, `causa (interna/externa/cambio_contrato)`, `composicion_causal (jsonb)`, `motivo`, `decision_manual`, `autorizado_por`, `resultado_recalculo` | **E-33** |
| `cambios_contrato` | `proyecto_id`, `tipo_cambio`, `descripcion`, `dispara_desfase` | E-16→E-33 |
| `check_produccion` | `proyecto_id`, `fecha_check`, `desenlace (todo_bien/novedad/extremo)`, `insumos_en_taller`, `comisiones_reducidas` | E-59 (P-11) |
| `novedades_criticas` | `proyecto_id`, `descripcion`, `fase`, `ventana_sla_horas (5-24)`, `estado`, `escalado_a` | E-34 (P-10) |

### Tablas AMPLIADAS (F2→F3):

| Tabla | Campo añadido | Propósito |
|---|---|---|
| `proyectos` | `estado` (enum ampliado: cotizacion, desarrollo, compra, armado, instalacion, entrega, garantia) | Máquina de estados proyecto |
| `proyectos` | `verificador_id` (FK personas) | Verificador único E-18/E-24 (I-035) |
| `proyectos` | `fecha_entrada_desarrollo` (timestamp) | T0 para E-18 |
| `proyectos` | `comercial_vendedor_id` (FK personas) | Verificador único = comercial (D3) |

**NOTA C1:** Las 3 tarifas de mano de obra siguen **calculadas en runtime** desde `parametros` (no en cronograma). El cronograma cuantifica **jornadas** (horas/tiempo), no costo. El costo se deriva al momento del cálculo (cotizador, liquidaciones F6).

---

## 3. Pantallas F3 (P-06..P-12) — Resumen de Diseño

### P-06 — Mapa de Gates (Sumidero)
- **Ruta:** `/app/erp/proyectos/[id]`
- **Rol:** comercial, gerente, desarrollador, diseñador
- **Contenido:** Timeline horizontal de los 5 gates (E-18→E-21→E-24→E-33→E-20) + E-23 señal. Badge estado cada gate (✅ pendiente ⚠ bloqueado 🔴 rechazado). Panel "Requiere tu decisión" (gerente). Deep-link a P-08/P-14/P-17/P-09/P-20.
- **Datos:** derivados de `verificaciones`, `recepciones_material`, `desfases_cronograma`, `eventos`.

### P-07 — Retoma de Medidas
- **Ruta:** `/app/erp/proyectos/[id]/retoma`
- **Evento:** E-15
- **Contenido:** Inputs jsonb por módulo, captura foto (E-41), checkbox "Anomalía detectada" → dispara E-16 (cambio de contrato). Auto-save.

### P-08 — Desarrollo Técnico (Ejecuta **E-18**)
- **Ruta:** `/app/erp/proyectos/[id]/desarrollo`
- **Evento:** E-17, **E-18**, E-54, E-38, E-39
- **Contenido:** Schema versionado (`schemas_proyecto`), BOM (`bom_materiales`), **Veredicto E-18** (botones Aprobar/Rechazar — solo comercial vendedor verificador), Integraciones (E-38 modelo 3D, E-39 corte — **deshabilitados hasta E-18 aprobado**), Reprocesos (E-54).
- **Predicado P18:** `estado='desarrollo' ∧ ∃verificaciones: tipo_gate='schema', veredicto='aprobado', verificador_id=proyectos.verificador_id, creado_en ≥ fecha_entrada_desarrollo`
- **Guard:** Botón "Aprobar" solo si `verificador_id = currentUser.id` (rol comercial). Transición + fecha en 1 tx.

### P-09 — Cronograma Doble (Ejecuta **E-33**)
- **Ruta:** `/app/erp/cronograma` + `/app/erp/proyectos/[id]/cronograma`
- **Evento:** E-14, **E-33**, E-52, E-59, E-60
- **Contenido:** Tabla doble línea (`cronograma_etapas`): Contractual (inmutable) | Interna (movible) | Estado. **Editor de desfase E-33** (causa + composición causal + motivo + decisión manual). **Aplicar desfase** → recalcula SOLO línea `interna` (server). Comunicación E-60 (solo adelantos positivos).
- **Predicado P33:** `∃desfase: aplicado=true ∧ causa∈{interna,externa,cambio_contrato} ∧ motivo>0 ∧ composicion_causal>0`
- **Regla I-034:** Línea `contractual` NUNCA se recalcula. Adelanto positivo (E-59→E-60) NO pasa por E-33.

### P-10 — Novedades Críticas (SLA 5-24h)
- **Ruta:** `/app/erp/cronograma/novedades`
- **Evento:** E-34
- **Contenido:** Lista de cards con descripción, fase, chip SLA (temporizador), estado. `[+ Registrar novedad]`. Escalar/resolver (gerente).

### P-11 — Check de los 15 Días
- **Ruta:** `/app/erp/proyectos/[id]/check-15-dias`
- **Evento:** E-59
- **Contenido:** Estado producción (lee `modulos`). **3 desenlaces:** Todo bien → E-60 adelanto; Novedad → decisión + acción; Extremo → escalar + comisiones reducidas (E-35). `[Confirmar check]` → log + alimenta E-25/E-35/E-60.

### P-12 — Equipo / Verificador
- **Ruta:** `/app/erp/equipo` (extensión existente)
- **Evento:** E-18/E-24 (precondición)
- **Contenido:** Lista `personas_roles` (rol activo). Designación `proyectos.verificador_id` (único comercial vendedor). `[+ Crear empleado]` (t-018).

---

## 4. Integration con F2 (P-04)

| Elemento F3 | Cómo P-04 (cotizador) lo consume |
|---|---|
| `proyectos.estado` (enum ampliado) | Kanban P-01 lee estados + transiciones. Cotizador lee estado actual (P-04 Header). |
| `parametros.transiciones_proyecto` (JSON) | Kanban valida drag-drop. Cotizador muestra badge estado + deshabilita/editable según estado. |
| `parametros.tarifa_*` (físicas) | Cotizador P-04 calcula MO en runtime (C1). |
| `verificaciones.tipo_gate='schema'` | Cotizador P-04 muestra estado del gate E-18 (badge "Schema aprobado/falta"). |
| `cronogramas`/`cronograma_etapas` | Cotizador P-04 muestra timeline resumido en sidebar (promesa 7 semanas, etapas). |

---

## 5. Predicados de Gates (Verificación)

```sql
-- E-18: Check de schema pre-compras (P-08)
P18(p) = p.estado='desarrollo' 
  ∧ ∃v∈verificaciones: v.proyecto_id=p.id 
  ∧ v.tipo_gate='schema' 
  ∧ v.veredicto='aprobado' 
  ∧ v.verificador_id=p.verificador_id 
  ∧ v.creado_en ≥ p.fecha_entrada_desarrollo

-- E-33: Cambio de cronograma con causa (P-09)
P33(p) = ∃d∈desfases_cronograma: d.proyecto_id=p.id 
  ∧ d.aplicado=true 
  ∧ d.causa∈{'interna','externa','cambio_contrato'}
  ∧ length(d.motivo)>0 
  ∧ jsonb_array_length(d.composicion_causal)>0
-- Recálculo: SOLO cronograma_etapas.linea='interna' (contractual inmutable, I-034)

-- E-20: Bloqueo de caja (F4, no F3 — referencia)
P20(o) = caja_disponible ≥ monto_pago
-- caja_disponible = Σcuentas_financieras.saldo_actual − Σobligaciones_pendientes(pendiente/atrasada)(monto_total−monto_pagado)
```

---

## 6. Decisiones Pendientes (Bloqueantes para F3, NO afectan F2 cierre)

| ID | Descripción | Impacto |
|---|---|---|
| H-B3-2-01 | `base_comision_tamano` (E-35): ¿subtotal o total con IVA? | P-11 (check 15 desenlace "extremo") → P-22 (comisiones F6) |
| H-B3-2-02 | Veracidad de la composición causal E-33 (D4): ¿auditar truth del trazado? | P-09 — predicado solo exige existencia, no veracidad |
| H-B3-2-06 | `sla_novedad_critica` (5-24h) y `holgura_cronograma_max_dias` (5) provienen del mapa | P-10, P-09 — validar fuente numérica |

---

## 7. Checklist de Aprobación (Supervisor)

- [ ] Schema: `cronogramas`, `cronograma_etapas`, `desfases_cronograma` — 5 campos nuevos (más tablas B3-3/B3-4)
- [ ] Schema: `proyectos` ampliada — `estado` (enum 8), `verificador_id`, `fecha_entrada_desarrollo`, `comercial_vendedor_id`
- [ ] Schema: `parametros.transiciones_proyecto` (JSON) + `parametros` (4 params C1) — se aplica también en P-01 Kanban
- [ ] P-06 (sumidero gates): timeline + badges + deep-links + panel gerente
- [ ] P-08 (E-18): veredicto comercial + BOM + integraciones precedencia → P-14/P-17
- [ ] **P-09 (E-33)**: tabla doble línea + editor desfase + cálculo línea interna SOLO
- [ ] P-10 (E-34): novedades + SLA 5-24h + escalación
- [ ] P-11 (E-59): check 15 días + 3 desenlaces + reduce comisiones (H-B3-2-01)
- [ ] P-12 (equipo): `personas_roles` + `verificador_id` designación
- [ ] Predicados E-18/E-33 verificables con SQL (tabla §5)
- [ ] I-034: cronograma doble (contractual inmutable, interna recalcula)
- [ ] Integration con P-04: P-04 consume estados/transiciones/params/cronograma

---

## 8. Próximos Pasos (tras aprobación F3)

1. Schema F3 → migración aditiva hacia `dev-local`
2. P-01 (Kanban) + P-04 (cotizador) + P-06 (mapa gates) pueden implementarse en paralelo
3. P-08/P-09 (gates) después de F2/F3 schema fusionado
4. M-06 L1 (capa técnica) se cruza al final de F9

---

**¿Apruebas este diseño F3 (cronograma + gates E-18/E-33)?**
Si sí → F2 puede cerrarse (P-01..P-05 aprobados) y F3 pasa a implementación.
Si ajustes → indícalos y re-itero.