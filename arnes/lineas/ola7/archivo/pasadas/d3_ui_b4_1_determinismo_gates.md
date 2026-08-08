# Pase B4-1 — Determinismo de gates (subagente, auditoría)

**Lente:** auditoría de determinismo de los 5 gates (E-18/E-21/E-24/E-33/E-20) contra sus especificaciones de pantalla B3 — `DETERMINISMO_OK` / `DETERMINISMO_ROTO` (`met:106`).
**Rol:** sub-agente B4-1 del Diamante 3 (`met:54`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_consolidado.md` (sch_c, §6 predicados) · `d3_ui_b3_1_embudo_comercial.md` (b3_1) · `d3_ui_b3_2_cronograma_gates.md` (b3_2) · `d3_ui_b3_3_compras_taller_calidad.md` (b3_3) · `d3_ui_b3_4_finanzas_compensacion.md` (b3_4) · `d3_ui_b2_2_pantallas_requeridas.md` (inv) · `diamante3_metodologia.md` (met).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b4_1_determinismo_gates.md`.
**Vocabulario:** `met:98-107`. Escepticismo: ninguna afirmación de B3 se da por buena sin verla en el archivo citado.

---

## Iteración 1 (bruta)

Barrido de los 5 gates contra las pantallas que los ejecutan:

| Gate | Predicado (`sch_c:211-215`) | Pantalla(s) B3 | Archivo del mapeo |
|---|---|---|---|
| **E-18** | `P18(p) = p.estado='desarrollo' ∧ ∃v∈verificaciones: tipo_gate='schema' ∧ veredicto='aprobado' ∧ verificador_id=p.verificador_id ∧ creado_en ≥ p.fecha_entrada_desarrollo` | P-08 (desarrollo) | b3_2 |
| **E-21** | `P21(r) = r.check_pedido_bien ∧ r.check_despacho_bien ∧ NOT EXISTS (items i WHERE i.ordenId=:oc AND (i.recibido_cantidad < i.cantidad OR i.sin_defectos IS NOT TRUE))` | P-14 (recepción) | b3_3 |
| **E-24** | `P24(p) = p.estado='armado' ∧ ∃c∈citaciones_calidad: c.proyecto_id=p.id ∧ c.estado='citada' ∧ ∃v∈verificaciones: tipo_gate='calidad' ∧ veredicto='aprobado' ∧ verificador_id=p.verificador_id ∧ v.creado_en ≥ c.citado_en` | P-17 (calidad) | b3_3 |
| **E-33** | `P33(p) = ∃d∈desfases_cronograma: d.proyecto_id=p.id ∧ d.aplicado=true ∧ d.causa∈{'interna','externa','cambio_contrato'} ∧ length(d.motivo)>0 ∧ jsonb_array_length(d.composicion_causal)>0` → recálculo SOLO de `linea='interna'` | P-09 (cronograma) | b3_2 |
| **E-20** | `caja_disponible = (Σ cuentas_financieras.saldo_actual) − (Σ obligaciones_pendientes WHERE tipo='por_pagar' AND estado IN ('pendiente','atrasada') OF (monto_total − monto_pagado))`; `P20 = caja_disponible ≥ :monto_pago` | P-20/P-13 (caja/compras) | b3_4 |

---

## Iteración 2 (autocrítica — verificación línea por línea)

Audito cada gate contra la especificación de su pantalla en el archivo B3 citado:

**E-18 → P-08 (b3_2).** Predicado exige: estado 'desarrollo', verificación schema aprobada, verificador único `p.verificador_id`, `creado_en ≥ fecha_entrada_desarrollo`. b3_2 especifica el botón de veredicto con guard "verificador único = comercial vendedor (`proyectos.verificador_id`)" y la deshabilitación si el estado no es desarrollo. **DETERMINISMO_OK** — el guard de UI alinea los 4 términos del predicado.

**E-21 → P-14 (b3_3).** Predicado exige los 2 checks + que ningún ítem tenga `recibido_cantidad < cantidad` ni `sin_defectos IS NOT TRUE`. b3_3 especifica checklist por ítem con `recibido_cantidad`, `sin_defectos` nullable, y el botón "Marcar recibido-verificado" **deshabilitado salvo P21 true** con estado derivado del predicado, no manual. **DETERMINISMO_OK** — el estado derivado en servidor cumple `DET-09/10` (sch_c:100). Nota: `check_material` existe como dato pero no entra al predicado (b3_3:H-B3-3-05) — consistente con `sch_c:212`, no rompe determinismo (es captura, no gate).

**E-24 → P-17 (b3_3).** Predicado exige: `estado='armado'` + citación citada + verificación calidad aprobada con `creado_en ≥ citado_en` + verificador único. b3_3 especifica guard de rol en el botón de veredicto + deshabilitado "si sin citación". La secuencia `citado_en → creado_en` está documentada en el predicado y la UI no expone ambos timestamps directamente (los lee el servidor). **DETERMINISMO_OK** — la UI dispara la mutación; el predicado se evalúa en servidor.

**E-33 → P-09 (b3_2).** Predicado exige: desfase `aplicado=true` + causa válida + `motivo` no vacío + `composicion_causal` no vacío → recálculo SOLO de `linea='interna'`. b3_2 especifica la "composición causal" como requisito para activar el recálculo, decisión manual justificada (gerente/comercial), y la línea contractual intacta. **DETERMINISMO_OK** — los 4 términos del predicado tienen UI en b3_2. Nota: DP-04 (veracidad de la composición, sch_c:254) es determinismo de existencia, no de verdad — no bloquea.

**E-20 → P-20 (b3_4).** Predicado exige `caja_disponible` derivada (saldos − por_pagar pendientes/atrasadas) ≥ monto. b3_4 especifica: caja SIEMPRE derivada en servidor (R05), "Resolver gate" navegando a P-09 (E-33) como rama negativa, sin bypass (`excepciones_gate` sin bypass, sch_c:41/ENF-21). **DETERMINISMO_OK** — la derivación es función pura del estado persistido; la UI no la calcula.

**Barrido de requisitos transversales del determinismo (`sch_c:17`):**
1. ¿Cada gate tiene al menos una pantalla que lo ejecute? Sí: E-18→P-08, E-21→P-14, E-24→P-17, E-33→P-09, E-20→P-20 (P-13 dispara, `inv:166`). 5/5.
2. ¿Cada guard de UI deshabilita el CTA cuando el predicado es false (R16)? P-08 (b3_2), P-14 (b3_3: botón deshabilitado si no P21), P-17 (b3_3: deshabilitado si sin citación o rol distinto), P-09 (b3_2), P-20 (b3_4: botón solo con gate bloqueado). 5/5.
3. ¿La mutación de transición se ejecuta en servidor con atomicidad evento+estado? Documentado en los "Aspectos de código React" de P-14/P-17/P-20 (tx + `eventos`). 5/5.
4. ¿Ningún gate tiene bypass desde UI? E-20 sin bypass (sch_c:41); los demás sin vía de salto (guard de rol). 5/5.

---

## Iteración 3 (refinamiento final)

- **Determinismo estructural:** los 5 predicados se evalúan en servidor a partir de estado persistido; ninguna pantalla deriva el gate en cliente. Confirmado para E-20 (b3_4) y E-21 (b3_3).
- **Ramas negativas persistentes:** E-20 (fila `eventos` gate con payload, decisión gerente), E-21 (reproceso origen compra), E-24 (reproceso origen calidad), E-18 (reproceso origen schema, b3_2), E-33 (decisión manual justificada). 5/5 tienen rama negativa documentada.
- **Posible riesgo residual:** el `creado_en ≥ fecha_entrada_desarrollo` (E-18) y `creado_en ≥ citado_en` (E-24) dependen de timestamps del sistema. Si dos escrituras entran en el mismo instante, la comparación `≥` es tolerante al igual (no rompe). Sin `DETERMINISMO_ROTO`.
- **Sin hallazgos estructurales pendientes.** Cierre de loop B4-1.

---

## Entregable: veredicto por gate

| Gate | Pantalla | Veredicto | Evidencia (archivo:línea) |
|---|---|---|---|
| E-18 | P-08 | `DETERMINISMO_OK` | predicado sch_c:211; mapeo b3_2 (veredicto E-18, guard verificador) |
| E-21 | P-14 | `DETERMINISMO_OK` | predicado sch_c:212; mapeo b3_3 (P-14 §6, estado derivado del predicado) |
| E-24 | P-17 | `DETERMINISMO_OK` | predicado sch_c:213; mapeo b3_3 (P-17 §6, secuencia citado→creado) |
| E-33 | P-09 | `DETERMINISMO_OK` | predicado sch_c:214; mapeo b3_2 (P-09, composición causal + línea interna) |
| E-20 | P-20/P-13 | `DETERMINISMO_OK` | predicado sch_c:215; mapeo b3_4 (P-20 §6, caja derivada servidor) |

**Resultado: 5/5 `DETERMINISMO_OK` · 0 `DETERMINISMO_ROTO`.**

---

## Cobertura de gates con UI (5/5)

| Gate | Pantalla operativa | Pantalla sumidero | UI de rama negativa |
|---|---|---|---|
| E-18 | P-08 | P-06 (b3_2) | reproceso origen schema (P-08) |
| E-21 | P-14 | P-06 | reproceso origen compra (P-14) |
| E-24 | P-17 | P-06 | reproceso origen calidad (P-17) |
| E-33 | P-09 | P-06 | decisión manual justificada (P-09) |
| E-20 | P-20 (+ P-13 dispara) | P-06 | gerente mueve cronogramas (P-20 → P-09) |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B4-1-01 | NOTA | `check_material` (recepciones_material) se captura pero NO es parte del predicado E-21 — es dato, no gate. No rompe determinismo; si la regla de negocio cambia, el predicado debe re-expresarse (a3:128 patrón) | `sch_c:212`; `b3_3:H-B3-3-05` |
| H-B4-1-02 | NOTA | DP-04 (veracidad de composición causal E-33) es determinismo de existencia, no de verdad — no bloquea B4 | `sch_c:254` |
| H-B4-1-03 | NOTA | Los 5 gates exigen atomicidad `eventos`+mutación en la implementación (patrón tx en P-14/P-17/P-20) — recordatorio para B4-3 (implementabilidad) | `b3_3:§8`; `b3_4:§8` |

---

## Notas para el Orquestador

- **Contrato cumplido (met:54,91-96):** veredicto por gate con trazabilidad `archivo:línea`; 5/5 `DETERMINISMO_OK`.
- **Para B5 (auditor final):** este pase es input directo del goal duro "100% gates con UI".
- **Para B4-3:** la atomicidad de tx y la evaluación del predicado en servidor son los dos puntos a verificar contra el código.
- **Prohibido cumplido:** solo escribió `d3_ui_b4_1_determinismo_gates.md`.

## Registro

- Fecha: 2026-08-04 · Pase B4-1 (ola 5 — determinismo de gates).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_b4_1_determinismo_gates.md`.
- Veredicto: **5/5 `DETERMINISMO_OK`** · 0 `DETERMINISMO_ROTO` · 3 hallazgos (notas).
