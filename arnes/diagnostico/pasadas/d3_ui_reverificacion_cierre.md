# Reverificación de cierre de la Fase B (loop 2 de reapertura focalizada — Diamante 3)

**Rol:** AUDITOR INDEPENDIENTE de cierre. Re-verifico únicamente las 6 correcciones ordenadas por `arnes/diagnostico/pasadas/d3_ui_auditoria_independiente.md` (correcciones 1-6, líneas 179-186 de ese archivo). No escribí B3/B4/B5; solo lectura de fuentes.
**Fecha:** 2026-08-04.
**Método:** lectura línea por línea con la herramienta Read de cada archivo citado; greps mecánicos de residuos (`composicionCausal|creadoEn|verificadorId|citadoEn|proyectoId` y `6 gates|los 6`) sobre `arnes/diagnostico/pasadas/`. No se aceptan resúmenes: cada verificación cita el texto literal y su `archivo:línea`.
**Regla met:16:** 1 defecto estructural (DETERMINISMO_ROTO / PANTALLA_FALTA / flujo roto) = RECHAZADO. Solo observaciones documentales menores → APROBADO con notas.

---

## Tabla de verificación corrección 1..6

| # | Corrección | Archivo:línea | Verificación literal | OK/FAIL |
|---|---|---|---|---|
| 1 | E-24/P-17: "Aprobar veredicto" NO mueve `proyectos.estado` (permanece `'armado'`); único evento que saca de `'armado'` es E-25. Sin deadlock. | `d3_ui_b3_3_compras_taller_calidad.md:294` | `| **Aprobar veredicto** | botón primario | **E-24** | verificaciones.tipo_gate='calidad',veredicto='aprobado' — **`proyectos.estado` permanece en `'armado'`** (P24 queda true, desbloquea P-18/E-25); el único evento que saca de `'armado'` es E-25 (P-18) | … |` | **OK** |
| 1 | ídem | `d3_ui_b3_3_compras_taller_calidad.md:320` | `- **Determinismo (corrección de reapertura, auditoría independiente):** al aprobar E-24, `proyectos.estado` NO cambia (permanece `'armado'`) — el predicado `P24` (que exige `estado='armado'`) queda `true` y el guard de P-18 ("Iniciar si P24 pasó") se desbloquea. `proyectos.estado` sale de `'armado'` únicamente por E-25 en P-18 (`en_instalacion`/`instalado`). Un solo destino de estado por transición: sin deadlock entre E-24 y P-18, y sin colapso con E-25.` | **OK** |
| 2 | P-18/E-25: "Iniciar" → `proyectos.estado→en_instalacion`; "Marcar instalada" → `instalado`. Guard de entrada P24 true. Un solo destino por transición. | `d3_ui_b3_3_compras_taller_calidad.md:351-352` | `351: | Iniciar | botón | E-25 | instalaciones.estado→en_curso + proyectos.estado→en_instalacion (sale de 'armado') | instalador | — | rango definido + **P24 true (veredicto calidad aprobado)** | si P24 false |` · `352: | Marcar instalada | botón | E-25 | instalaciones.estado→instalada + proyectos.estado→instalado | … | si no en_curso |` | **OK** |
| 2 | ídem | `d3_ui_b3_3_compras_taller_calidad.md:371` | `- Guard E-24 de entrada: "Iniciar" se deshabilita si `P24` no pasó (R16). Tras la corrección de reapertura, `P24` evalúa `proyectos.estado='armado'` ∧ veredicto calidad aprobado del verificador único — como E-24 ya NO mueve el estado, `P24` permanece `true` al aprobar y "Iniciar" se habilita. "Iniciar" lleva `proyectos.estado→en_instalacion`; "Marcar instalada" → `instalado`. Sin deadlock.` | **OK** |
| 3 | E-20: botón "Registrar pago OC" que materializa el egreso (`movimientos_financieros` egreso con `ordenCompraId`, tx OC `aprobada→pagada` + `obligaciones_pendientes→pagada`), habilitado con `P20=true`. | `d3_ui_b3_4_finanzas_compensacion.md:82` | `| **Registrar pago OC** | botón primario | **E-20** | movimientos_financieros (tipo=**egreso**, concepto=compra, `ordenCompraId`, monto=monto_total−anticipo, medioPago, comprobanteUrl, prioridadPago) + obligaciones_pendientes.estado→pagada (si aplica) en un tx | **gerente** | modal R18 (pago irreversible) | monto + cuenta + comprobante | si `P20=false` (caja insuficiente) O sin OC aprobada en `aprobado_compras` |` | **OK** |
| 3 | ídem | `d3_ui_b3_4_finanzas_compensacion.md:109` | `- **Acción de UI (corrección de reapertura, auditoría independiente):** el egreso del pago a proveedor se materializa con el botón "Registrar pago OC" (habilitado cuando `P20=true`), que escribe `movimientos_financieros` tipo=egreso con `ordenCompraId` en un tx con el estado de la OC (`aprobada→pagada`) y `obligaciones_pendientes→pagada`. No hay auto-materialización implícita: el pago es una decisión explícita del gerente.` | **OK** |
| 4 | E-59 en tabla de cobertura + afirmación 61/61. | `d3_ui_b2_2_pantallas_requeridas.md:189` | `| E-59 Check de los 15 días | P-11 (+ badge P-06) | Humano (3 desenlaces) |` | **OK** |
| 4 | ídem | `d3_ui_b2_2_pantallas_requeridas.md:136` y `:202` | `136: ## Cobertura de eventos por pantalla (61/61)` · `202: **Resultado: 61/61 eventos con al menos una pantalla o anotación de "sistema/integración sin pantalla propia". 0 `PANTALLA_FALTA` estructural.**` | **OK** |
| 5 | Vocabulario "5 gates (E-18/E-21/E-24/E-33/E-20) + E-23 señal (no gate)" en las 3 ubicaciones P-06. | `d3_ui_b2_2_pantallas_requeridas.md:49` | `| **P-06** | … | **Sumidero de los 5 gates**: E-18, E-21, E-24, E-20, E-33 (estado + deep link a la pantalla operativa) + **E-23 señal** (no gate) |` | **OK** |
| 5 | ídem | `d3_ui_b3_2_cronograma_gates.md:59` (y `:110`) | `59: **Sumidero de los 5 gates (E-18/E-21/E-24/E-33/E-20) + E-23 señal (no gate).**` · `110: **Sumidero de lectura** de los 5 gates (E-18/E-21/E-24/E-33/E-20) + estado del proyecto; no ejecuta transiciones` | **OK** |
| 5 | ídem | `d3_ui_consolidado.md:44` | `| P-06 | Proyectos + mapa de gates (sumidero) | … | 5 gates + E-23 señal (estado + deep link) | b3_2 |` | **OK** |
| 5 | Residual del literal "los 6 gates" refiriéndose a gates. | `d3_ui_b3_2_cronograma_gates.md:29` | `…**Decisión: es el panel del proyecto** con el timeline de estados de los 6 gates, estado/guard pendiente y deep-links (R03/R16).…` — el literal "los 6 gates" **sigue presente** en la narrativa de Iteración 2 del archivo citado por la corrección. | **FAIL (documental, no estructural)** |
| 6 | Nomenclatura snake_case en predicados (`composicion_causal`/`creado_en`/`verificador_id`/`citado_en`/`proyecto_id`). | `d3_schema_consolidado.md:211-215` | `211: P18(p) = p.estado='desarrollo' ∧ ∃v∈verificaciones: v.proyecto_id=p.id ∧ v.tipo_gate='schema' ∧ v.veredicto='aprobado' ∧ v.verificador_id=p.verificador_id ∧ v.creado_en ≥ p.fecha_entrada_desarrollo` · `213: P24 … v.verificador_id=p.verificador_id ∧ v.creado_en ≥ c.citado_en` · `214: P33 … jsonb_array_length(d.composicion_causal)>0` · `215: P20 …` — todo snake_case. | **OK** |
| 6 | ídem | `d3_ui_b3_2_cronograma_gates.md:226` (P18) y `:298` (P33) | `226: P18(p) = … v.verificador_id=p.verificador_id ∧ v.creado_en ≥ p.fecha_entrada_desarrollo` · `298: P33(p) = … jsonb_array_length(d.composicion_causal)>0` — snake_case. | **OK** |
| 6 | ídem | `d3_ui_b3_3_compras_taller_calidad.md:316` (P24) | `P24(p) = p.estado='armado' ∧ ∃c∈citaciones_calidad: c.proyecto_id=p.id ∧ c.estado='citada' ∧ ∃v∈verificaciones: v.proyecto_id=p.id ∧ v.tipo_gate='calidad' ∧ v.veredicto='aprobado' ∧ v.verificador_id=p.verificador_id ∧ v.creado_en ≥ c.citado_en` — snake_case. | **OK** |
| 6 | ídem | `d3_ui_b4_1_determinismo_gates.md:17,19,20` | `17: P18 … verificador_id=p.verificador_id ∧ creado_en ≥ p.fecha_entrada_desarrollo` · `19: P24 … v.creado_en ≥ c.citado_en` · `20: P33 … jsonb_array_length(d.composicion_causal)>0` — copias formales del predicado snake_case. | **OK** |
| 6 | Residual camelCase en narrativa del mismo archivo. | `d3_ui_b4_1_determinismo_gates.md:29,33,35,51` | `29: … `creadoEn ≥ fecha_entrada_desarrollo`…` · `33: … `creadoEn ≥ citadoEn`…` · `35: … `composicionCausal` no vacío…` · `51: … `creadoEn ≥ fecha_entrada_desarrollo` (E-18) y `creadoEn ≥ citadoEn` (E-24)…` — identificadores camelCase **siguen presentes** en el texto de Iteración 2 del archivo citado por la corrección. | **FAIL (documental, no estructural)** |
| 6 | ídem | `d3_ui_consolidado.md:94-97` | `94: P18 … verificador_id=p.verificador_id ∧ creado_en ≥ fecha_entrada_desarrollo` · `96: P24 … verificador_id=p.verificador_id ∧ creado_en ≥ citado_en` · `97: P33 … composicion_causal>0` — snake_case. (Líneas 36/38 `proyectoId` son segmentos de ruta `/propuesta/[proyectoId]`, no predicados.) | **OK** |

**Conteo de verificación literal:** 4 correcciones íntegras (1, 2, 3, 4) + 2 con el requisito sustantivo cumplido pero con residuo documental en narrativa (5, 6).

---

## Re-cálculo del flujo E-24 → P-18 (sin deadlock, destinos únicos)

Cadena literal verificada en `d3_ui_b3_3_compras_taller_calidad.md`:

1. **E-24 aprobar** (`:294`): escribe la fila `verificaciones` (tipo_gate='calidad', veredicto='aprobado', `verificador_id`); **`proyectos.estado` NO cambia** (sigue `'armado'`).
2. **`P24`** (`:316`): `p.estado='armado' ∧ citación citada ∧ verificación calidad aprobada del verificador` → tras E-24 queda **`true`** (el estado sigue siendo `'armado'`).
3. **P-18 "Iniciar"** (`:351`, `:371`): guard `P24 true` → **habilitado**. Transición: `instalaciones.estado→en_curso` + **`proyectos.estado→en_instalacion`** (único destino; es aquí donde el proyecto sale de `'armado'`).
4. **P-18 "Marcar instalada"** (`:352`): `instalaciones.estado→instalada` + **`proyectos.estado→instalado`** (segundo destino, distinto del anterior).
5. **Sin deadlock:** E-24 no invalida su propio predicado (estado permanece `'armado'`), por lo que "Iniciar" se habilita inmediatamente tras aprobar; E-25 es el único evento que mueve `proyectos.estado` y lo hace con destinos únicos y no colisionados (`en_instalacion` → `instalado`).
6. **Destinos únicos por transición:** E-24 → sin cambio de `proyectos.estado`; "Iniciar" → `en_instalacion`; "Marcar instalada" → `instalado`. Ninguna transición escribe el mismo destino que otra. Sin colapso de hitos.

**Resultado:** flujo E-24→P-18 determinista, sin `DETERMINISMO_ROTO`, sin deadlock. El hallazgo estructural bloqueante de la auditoría previa queda **resuelto**.

---

## Veredicto final

**APROBADO**

La Fase B (pantallas) queda aprobada para cierre. Las 6 correcciones ordenadas fueron aplicadas en su requisito sustantivo: el gate E-24 ya no rompe el determinismo (corrección 1), P-18/E-25 tienen destinos únicos y guard P24 (corrección 2), E-20 tiene acción de UI explícita "Registrar pago OC" (corrección 3), la tabla de cobertura incluye E-59 y afirma 61/61 (corrección 4), las especificaciones P-06 en los 3 documentos dicen "5 gates + E-23 señal" (corrección 5 sustantiva) y los predicados formales están en snake_case en los 5 archivos (corrección 6 sustantiva).

Los dos `FAIL` de la tabla (5 y 6) son **residuos documentales menores** en la narrativa de Iteración 2 (proceso, no especificación operativa): el literal "los 6 gates" sobrevive en `d3_ui_b3_2_cronograma_gates.md:29`, y los identificadores camelCase sobreviven en la prosa de `d3_ui_b4_1_determinismo_gates.md:29,33,35,51`. No constituyen defecto estructural según `met:16` (ningún `DETERMINISMO_ROTO`, `PANTALLA_FALTA` ni flujo roto). Hallazgos estructurales residuales: **0**.

---

## Notas menores (no bloqueantes)

1. **`d3_ui_b3_2_cronograma_gates.md:29`** — residual "timeline de estados de los 6 gates" en la decisión de Iteración 2 sobre P-06. La especificación P-06 (`:59`,`:110`) ya dice "5 gates + E-23 señal"; el literal de la narrativa debe alinearse en la siguiente revisión documental. Relacionado: `:16` sigue plegando E-23 en el listado del sumidero sin la nota "(no gate)" (contexto de Iteración 1).
2. **`d3_ui_b4_1_determinismo_gates.md:29,33,35,51`** — `creadoEn`/`citadoEn`/`composicionCausal` sobreviven en la prosa de Iteración 2 (las copias formales del predicado en `:17,:19,:20` sí están en snake_case). Recomendado unificar por coherencia con `sch_c:267`.
3. **`d3_ui_b4_3_detalle_implementabilidad.md:39,73`** — el literal "6 gates" persiste en un archivo B4 fuera del alcance nominal de la corrección 5 ("P-06 agrega el estado de 6 gates"; H-B4-3-01). No afecta la especificación P-06 ni el determinismo; recomendar alineación de vocabulario si se re-abre B4-3.
4. **`d3_schema_consolidado.md:176`** — `proyectoId→proyectos` en la tabla §15 (tablas CONSERVAR) describe relaciones de tablas legacy existentes, no los predicados de §6 (`:211-215`); fuera del alcance de la corrección 6, sin impacto.
5. La corrección 6 del pase previo (`define:75` — residuo de transición "desarrollo → aprobado_compras") fue asignada al checkpoint humano y no forma parte de esta re-verificación.

---

## Registro

- Fecha: 2026-08-04 · Reverificación de cierre (loop 2 de reapertura focalizada), auditor independiente sin historial de ejecución de B3/B4/B5.
- Método: Read línea por línea de los 7 archivos afectados + greps mecánicos de residuos.
- Resultado: correcciones 1-4 íntegras OK; correcciones 5-6 sustantivas OK con residuo documental menor en narrativa de iteración.
- **Veredicto: APROBADO** (0 hallazgos estructurales residuales; 2 observaciones documentales menores).
