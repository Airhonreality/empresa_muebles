# Auditoría independiente de la Fase B (re-auditoría — subagente sin historial de ejecución)

**Rol:** AUDITOR FINAL INDEPENDIENTE del Diamante 3 (Fase B — diseño de pantallas). No escribí B3 ni B4 ni B5; solo lectura de fuentes. Veredicto construido re-contando de las fuentes primarias, sin aceptar conteos de pases previos (B4/B5 se leyeron solo como contraste no vinculante).
**Goals duros auditados** (`diamante3_metodologia.md:152`): 100% pantallas · 100% gates con UI · roles×gates · 0 ambigüedad · UX destilado. Contrato de 8 secciones: `diamante3_metodologia.md:110-123`.
**Fuentes:** `diamante3_metodologia.md` (met) · `d3_ui_b2_2_pantallas_requeridas.md` (inv) · `d3_ui_b3_1_embudo_comercial.md` (b3_1) · `d3_ui_b3_2_cronograma_gates.md` (b3_2) · `d3_ui_b3_3_compras_taller_calidad.md` (b3_3) · `d3_ui_b3_4_finanzas_compensacion.md` (b3_4) · `d3_ui_b3_5_cliente_documentacion.md` (b3_5) · `d3_schema_consolidado.md` (sch_c) · `d3_ui_b2_1_destilacion_inv.md` (reg) · `d3_ui_b1_1_ux_ergonomia.md` (ux) · `diamante2_define_eventos.md` (define) · contrastes no vinculantes: `d3_ui_b4_1/2/3/4` y `d3_ui_b5_auditor.md`.
**Vocabulario:** `PANTALLA_FALTA` · `PANTALLA_AMBIGUA` · `PANTALLA_DETALLE_INSUFICIENTE` · `DETERMINISMO_OK` · `DETERMINISMO_ROTO` · `DECISION_PENDIENTE` · `DIFERIDO` (`met:98-107`).

---

## Iteración 1 (bruta)

Re-conteo crudo, sin filtrar, directo de las fuentes:

1. **Pantallas:** `inv:115` declara "26 admin + 8 frontstage = 34 core (+5 soporte +2 diferidos admin +3 tienda DIFERIDO)". Conteo de especificaciones B3: b3_1=9, b3_2=7, b3_3=7, b3_4=4, b3_5=7 → **34**. Re-sumo admin B3: P-01..P-05 (5) + P-06..P-12 (7) + P-13..P-19 (7) + P-20..P-23 (4) + P-24..P-26 (3) = **26 admin**. Frontstage B3: F-01, F-02, F-03, F-08 (b3_1) + F-04, F-05, F-06, F-07 (b3_5) = **8**. 26+8 = 34. ✓
2. **Gates:** `sch_c:17`/`met:119` = **5** (E-18/E-21/E-24/E-33/E-20). `inv:49` y `b3_2:16` hablan de "los 6 gates" (incluyen E-23, que es señal — `sch_c:213` nota, `b3_3:318`). Tensión de vocabulario detectada.
3. **Cobertura de eventos:** tabla `inv:140-199` — re-cuento manual de filas = **60** (falta E-59). `inv:201` afirma "61/61". Discrepancia detectada.
4. **Gates→UI:** E-18→P-08 (b3_2), E-21→P-14 (b3_3), E-24→P-17 (b3_3), E-33→P-09 (b3_2), E-20→P-20/P-13 (b3_4). 5/5 con pantalla. ✓
5. **Roles:** E-18/E-24=comercial vendedor (define:75,78,153), E-21=desarrollador (define:76), E-33=gerente/comercial (define:60), E-20=gerente (define:87,154).

**Sospecha bruta:** la transición de E-24 en `b3_3:294` escribe `proyectos.estado→instalado`, pero el predicado `P24` (`b3_3:316`/`sch_c:213`) exige `p.estado='armado'`, y el guard de P-18 (`b3_3:370`) deshabilita "Iniciar" si `P24` no pasó. Posible `DETERMINISMO_ROTO`. A verificar línea por línea.

---

## Iteración 2 (autocrítica)

Dudo de mis propios hallazgos antes de afirmarlos:

1. **¿El conteo 34 es sólido?** Verifiqué dos veces la suma (26+8=34) y el desajuste "26 vs 30" que B5 resolvió: P-27..P-31 son soporte conservado (no rediseñado, `inv:71-79`); si se incluyeran darían 31 admin. El conteo 26/34 es correcto **solo si** no se cuentan las 5 de soporte. Confirmado.
2. **¿E-24 realmente rompe?** Releí `b3_3:294`, `b3_3:316`, `b3_3:351`, `b3_3:370` y `sch_c:213`. Cadena: (a) E-24 aprobación → `proyectos.estado→instalado`; (b) `P24` exige `estado='armado'`; (c) P-18 "Iniciar" deshabilitado si `P24` no pasó; (d) E-25 "Marcar instalada" también → `proyectos.estado→instalado`. Consecuencia: tras E-24, `P24=false` (estado≠armado) → "Iniciar" de P-18 queda deshabilitado permanentemente → instalación imposible (deadlock). Además, dos eventos distintos (E-24 veredicto, E-25 instalación completa) escriben el mismo estado `instalado`, colapsando dos hitos. Busqué una lectura rescatable (¿que el guard de P-18 evaluara solo el veredicto?) pero `b3_3:370` nombra explícitamente `P24` tal como está definido en `b3_3:316`. **No hay lectura que rescate el flujo sin cambiar al menos una de las tres sentencias.** Hallazgo legítimo.
3. **¿La tabla de cobertura realmente omite E-59?** `grep E-59` en inv devuelve solo líneas 49/52/54/59/108/132 (tablas de inventario y familias), **cero filas en la tabla de cobertura (140-199)**. La tabla tiene 60 filas y el título afirma "61/61" (`inv:136`). E-59 SÍ tiene pantalla (P-11, `inv:54`, especificada en `b3_2:360-412`), así que **no es `PANTALLA_FALTA`**, pero la evidencia de cobertura está incompleta en el documento. Hallazgo documental legítimo.
4. **¿La frontera de F-04/F-05/F-06 invalida el Goal 1?** El inventario —que es el contrato de B3 (`inv:227`: "Este inventario ES el contrato de B3")— marca F-04/F-05/F-06 como `(nuevo, DIFERIDO)` (`inv:95-97`) y ordena: "las diferidas (P-32/P-33 y construcción de tienda) se diseñan como frontera, no se construyen" (`inv:227`). B3-5 las diseñó como frontera con etiqueta explícita (`b3_5:192-251`). No es una violación silenciosa del contrato de 8 secciones: es una excepción sancionada por el propio contrato. **No estructural.** (Nota: el propio `inv:115` cuenta 34 core incluyendo 3 pantallas DIFERIDO — inconsistencia interna de conteo del inventario, documentada abajo.)
5. **¿E-20 tiene el mismo problema que E-24?** No: el predicado `P20` (`sch_c:215`) es consistente con P-20 (caja derivada en servidor). Pero la acción de pago del proveedor (egreso por OC) no está especificada como elemento interactivo en P-20 (`b3_4:77-84`): "Resolver gate" navega a P-09, y P-13 "Registrar pago" solo navega a P-20. No hay botón/acción que materialice el movimiento de E-20 en `movimientos_financieros`. Es `PANTALLA_DETALLE_INSUFICIENTE` (secundario), no `DETERMINISMO_ROTO`.
6. **¿E-18 tiene el mismo patrón?** `define:75` etiqueta la transición "desarrollo → aprobado_compras", pero `sch_c:211` (predicado auditable, contrato para B3) exige `estado='desarrollo'` y `b3_2:196` escribe `→desarrollo`. El predicado del consolidado y la UI **coinciden** (P18 queda true tras aprobar, desbloqueando OC en P-13). La etiqueta de `define:75` es un residuo de un modelo previo; inconsistencia fuente-a-fuente menor, **no** contradicción pantalla-vs-predicado. No rompe determinismo.
7. **¿"6 gates" es un defecto?** Es vocabulario: el sumidero P-06 agrega 6 estados (5 gates + E-23 señal). `met:119`/`sch_c:17` fijan 5. Inconsistencia de nomenclatura, no estructural.

---

## Iteración 3 (refinamiento final)

Veredicto depurado por goal, con conteos finales recalculados:

- **Goal 1:** 34/34 pantallas del inventario tienen especificación en B3. 30 con contrato completo de 8 secciones (26 admin + F-01/F-02/F-03/F-07) + F-08 embebida en F-02 (resolución de `PANTALLA_AMBIGUA` sancionada por `inv:99`) + F-04/F-05/F-06 como frontera DIFERIDO (excepción del contrato `inv:227`). **APROBADO con excepción documentada.**
- **Goal 2:** 5/5 gates con pantalla y predicado mapeado a columnas reales. **4/5 `DETERMINISMO_OK` · 1 `DETERMINISMO_ROTO` (E-24).** Fallo estructural → **RECHAZADO global.**
- **Goal 3:** 5/5 roles consistentes entre Define y B3 (con nota: E-33 fijado en "gerente" en B3-2, subconjunto de {gerente, comercial} de `define:60`). **APROBADO.**
- **Goal 4:** 0 `PANTALLA_FALTA` estructural; las 6 `PANTALLA_AMBIGUA` de B2-2 resueltas en B3; 1 fila faltante en la tabla de cobertura (E-59) → evidencia documental 60/61, cobertura real 61/61; 1 `PANTALLA_DETALLE_INSUFICIENTE` (acción de pago E-20). **APROBADO con correcciones documentales.**
- **Goal 5:** reglas R01-R40 y principios P01-P28 aplicados por familia (muestreo verificado). **APROBADO.**

---

## Goal 1: 100% de pantallas (re-conteo)

**Contrato de 8 secciones:** `met:110-123` (encabezado · wireframe · interactivos tabla · textos tabla · mapeo datos tabla · máquina de estados del gate · responsive+a11y · React).

| Pantalla | 8 secciones? | Fuente (b3_X:línea) |
|---|---|---|
| P-01 Embudo comercial | SÍ | b3_1:57-130 |
| P-02 Ficha de lead/cliente | SÍ | b3_1:134-197 |
| P-03 Agenda / calendario | SÍ | b3_1:201-254 |
| P-04 Cotizador (artefacto evolutivo) | SÍ | b3_1:258-321 |
| P-05 Contratos + firma + cambios + viajes | SÍ | b3_1:325-381 |
| P-06 Proyectos + mapa de gates (sumidero) | SÍ | b3_2:54-114 |
| P-07 Retoma de medidas | SÍ | b3_2:118-165 |
| P-08 Desarrollo técnico / schema | SÍ | b3_2:169-234 |
| P-09 Cronograma doble | SÍ | b3_2:238-306 |
| P-10 Novedades críticas | SÍ | b3_2:310-356 |
| P-11 Check de los 15 días | SÍ | b3_2:360-412 |
| P-12 Equipo / roles / verificador | SÍ | b3_2:416-463 |
| P-13 Compras (OC, 3 mecánicas) | SÍ | b3_3:54-107 |
| P-14 Recepción de material (E-21) | SÍ | b3_3:111-171 |
| P-15 Herramientas / reposición | SÍ | b3_3:175-217 |
| P-16 Fila del taller | SÍ | b3_3:221-265 |
| P-17 Calidad (E-23/E-24) | SÍ | b3_3:269-324 |
| P-18 Instalación | SÍ | b3_3:328-374 |
| P-19 Acta de entrega | SÍ | b3_3:378-422 |
| P-20 Caja / movimientos | SÍ | b3_4:55-113 |
| P-21 Obligaciones y cobros | SÍ | b3_4:117-165 |
| P-22 Compensación y comisiones | SÍ | b3_4:169-220 |
| P-23 Dashboard del contador | SÍ | b3_4:224-268 |
| P-24 Pedidos web (admin) | SÍ | b3_5:54-96 |
| P-25 Garantía (agenda/orden/check) | SÍ | b3_5:100-144 |
| P-26 Documentación del proyecto | SÍ | b3_5:148-188 |
| F-01 Landing + lead | SÍ | b3_1:385-431 |
| F-02 Propuesta pública (+ pago 3D) | SÍ | b3_1:435-482 |
| F-03 Agendar cita | SÍ | b3_1:486-528 |
| F-04 Tienda catálogo | NO — frontera DIFERIDO (t-034) | b3_5:192-213 (secciones 2/3-4/5/6-8 resumidas) |
| F-05 Tienda ficha | NO — frontera DIFERIDO (t-034) | b3_5:217-231 |
| F-06 Tienda checkout | NO — frontera DIFERIDO (t-034) | b3_5:235-249 |
| F-07 Portal del cliente | SÍ | b3_5:253-302 |
| F-08 Pago diseño 3D | EMBEBIDO en F-02 (no ruta propia) | b3_1:532-534 → spec dentro de F-02 b3_1:435-482 |

**Conteo final Goal 1: 34/34 pantallas presentes · 30 con 8 secciones completas · 1 embebida (F-08, resuelve `inv:99`) · 3 frontera DIFERIDO (`F-04/F-05/F-06`, excepción del contrato `inv:227`).**

Notas:
- P-27..P-31 (soporte existente) no se rediseñan (`inv:71-79`) → no entran al conteo core. Correcto.
- Inconsistencia interna del inventario: `inv:115` cuenta F-04/F-05/F-06 dentro de las "8 frontstage core" siendo DIFERIDO (`inv:113` las lista aparte como "3 frontstage" diferidas). El 34 nominal incluye 3 pantallas que el propio contrato difiere. No es falla de B3 (siguió `inv:227`) pero el conteo del inventario debe aclararse.
- `PANTALLA_DETALLE_INSUFICIENTE` detectada en Goal 2 (P-20 acción de pago E-20), ver abajo.

---

## Goal 2: 100% de gates con UI

| Gate | Pantalla | Predicado | DETERMINISMO_OK/ROTO |
|---|---|---|---|
| E-18 | P-08 (b3_2:169-234) | `P18 = estado='desarrollo' ∧ ∃v∈verificaciones: tipo_gate='schema' ∧ veredicto='aprobado' ∧ verificadorId=p.verificador_id ∧ creadoEn ≥ p.fecha_entrada_desarrollo` (sch_c:211) — mapeo a columnas reales b3_2:214-222 | `DETERMINISMO_OK` — guard de rol + tx atómico (b3_2:196,228); transición →`desarrollo` coincide con el predicado |
| E-21 | P-14 (b3_3:111-171) | `P21 = check_pedido_bien ∧ check_despacho_bien ∧ NOT EXISTS (items: recibido_cantidad<cantidad OR sin_defectos IS NOT TRUE)` (sch_c:212) — mapeo b3_3:151-159 | `DETERMINISMO_OK` — estado global derivado del predicado, botón deshabilitado hasta P21 (b3_3:139,165) |
| **E-24** | **P-17** (b3_3:269-324) | `P24 = estado='armado' ∧ ∃c: citaciones_calidad.estado='citada' ∧ ∃v: tipo_gate='calidad' ∧ veredicto='aprobado' ∧ verificadorId=p.verificador_id ∧ creadoEn ≥ citadoEn` (sch_c:213) — mapeo b3_3:306-312 | **`DETERMINISMO_ROTO`** — la transición de E-24 (b3_3:294) escribe `proyectos.estado→instalado`, dejando `P24=false` (requiere `'armado'`) inmediatamente tras aprobar; el guard de P-18 "Iniciar si `P24` no pasó" (b3_3:370) bloquea la instalación en deadlock; y E-25 (b3_3:351) re-escribe el mismo estado `instalado`, colapsando veredicto e instalación |
| E-33 | P-09 (b3_2:238-306) | `P33 = ∃d: aplicado=true ∧ causa∈{interna,externa,cambio_contrato} ∧ length(motivo)>0 ∧ jsonb_array_length(composicionCausal)>0` → recálculo SOLO `linea='interna'` (sch_c:214) — mapeo b3_2:284-294 | `DETERMINISMO_OK` — editor de composición causal + motivo + decisión manual (b3_2:265-270,298); línea contractual intacta |
| E-20 | P-20/P-13 (b3_4:55-113 / b3_3:54-107) | `caja_disponible = Σcuentas_financieras.saldo_actual − Σobligaciones_pendientes(por_pagar, pendiente/atrasada)(monto_total−monto_pagado); P20 = caja_disponible ≥ monto_pago` (sch_c:215) — mapeo b3_4:95-101 | `DETERMINISMO_OK` con **`PANTALLA_DETALLE_INSUFICIENTE`** — caja derivada en servidor y sin bypass correctos (b3_4:105-109), pero la acción que materializa el egreso del pago a proveedor (E-20) no está especificada en los interactivos de P-20 (b3_4:77-84): "Resolver gate" navega a P-09 y P-13 "Registrar pago" solo navega a P-20 (b3_3:80) |

**Conteo final Goal 2: 5/5 gates con pantalla operativa + sumidero P-06 · predicados mapeados a columnas reales 5/5 · `DETERMINISMO_OK` 4/5 · `DETERMINISMO_ROTO` 1/5 (E-24).**

Corrección exacta para E-24 (bloqueante):
- `b3_3:294`: la transición de "Aprobar veredicto" debe reconciliarse con `P24` (`b3_3:316`/`sch_c:213`). Opción A: NO mover `proyectos.estado` fuera de `'armado'` al aprobar (dejar que P-18/`instalaciones` maneje el paso a `en_curso`/`instalada`, y que `proyectos.estado` salga de `'armado'` en E-25 con un destino distinto, p. ej. `en_instalacion`→`instalado`, no duplicar `instalado` en E-24 y E-25). Opción B: redefinir el guard de P-18 (`b3_3:370`) para evaluar el subconjunto persistente de P24 (veredicto `calidad` aprobado del verificador único) en vez del predicado completo con `estado='armado'`, y fijar en `sch_c:213` cuál es el criterio "gate pasó". En cualquier caso debe quedar UN solo destino de estado por transición y sin deadlock entre E-24 y P-18.

Corrección exacta para E-20 (secundaria):
- `b3_4:77-84`: especificar el elemento interactivo que registra el pago a proveedor (p. ej. botón "Registrar pago OC" en P-20 habilitado cuando `P20=true`, escribiendo `movimientos_financieros` tipo egreso + `ordenCompraId`), o documentar la auto-materialización al liberar el gate. Hoy el egreso de E-20 está mapeado como dato (`b3_4:101`) pero no tiene acción de UI.

---

## Goal 3: roles × gates

| Gate | Rol dueño en Define | Guard en B3 | Consistente? |
|---|---|---|---|
| E-18 | Comercial vendedor (verificador único, D3) — `define:75,153` | `verificador_id = rol actual` en P-08 (`b3_2:196,228`) | CONSISTENTE |
| E-21 | Desarrollador (checklist C3) — `define:76` | `verificadoPorRol='desarrollador'` en P-14 (`b3_3:159`) | CONSISTENTE |
| E-24 | Comercial vendedor (verificador único, D3) — `define:78,153` | `verificador_id = rol actual` en P-17 (`b3_3:294`) | CONSISTENTE |
| E-33 | Gerente o comercial (decisión manual) — `define:60,139` | "Aplicar desfase"/"Decisión manual" guard gerente en P-09 (`b3_2:269-270`) | CONSISTENTE (B3-2 fija "gerente", subconjunto de {gerente, comercial} de `define:60` — notar que `inv:52` dice gerente/comercial) |
| E-20 | Gerente (gate de caja bloqueante) — `define:87,154` | Gerente en P-20 (`b3_4:81`) | CONSISTENTE |

**Conteo final Goal 3: 5/5 consistentes · 0 contradicciones estructurales.** Nota: la designación del verificador es por despacho (`proyectos.verificador_id`), no rol permanente (`sch_c:35`); P-12/P-06 lo administran (`b3_2:416-463`). Correcto.

---

## Goal 4: 0 ambigüedad / cobertura 61 eventos

**Cobertura de eventos:** re-conteo de la tabla `inv:140-199` = **60 filas**. Falta la fila **E-59** (Check de los 15 días). E-59 sí está cubierto por una pantalla diseñada: P-11 (`inv:54`; spec completa `b3_2:360-412`; desenlace en el badge de P-06 `b3_2:95`). **No es `PANTALLA_FALTA` estructural — es evidencia documental incompleta**: `inv:201` afirma "61/61" pero la tabla que debería probarlo tiene 60 filas. Corrección: agregar la fila `| E-59 Check de los 15 días | P-11 (+ badge P-06) | Humano (3 desenlaces) |` en `inv:138-199`.

**`PANTALLA_AMBIGUA` del inventario (B2-2) — resueltas en B3:**
- E-08 (H-B2-2-01): frontera 3 pantallas respetada — F-02 pago (b3_1:452-458), P-04 registro del hecho (b3_1:287), P-20 dinero (b3_4:101). ✓
- E-38/E-39 (H-B2-2-06): acciones en P-08 con precedencia E-18 (b3_2:182,198-199). ✓
- E-50 (H-B2-2-08): visibilidad en P-01/P-02, temporizador/escalación de sistema (b3_1:83,96). ✓
- E-13 (H-B2-2-09): wizard de firma en P-05/F-07, subsistema DIFERIDO (b3_1:337,381; b3_5:274). ✓
- E-60 (H-B2-2-11): único canal F-07 (b3_5:257,264); sin módulo de mensajería propio. ✓
- F-08 (inv:99): embebida en F-02 (b3_1:532-534). ✓

**Hallazgos de ambigüedad nuevos (esta auditoría):**
1. `DETERMINISMO_ROTO` de E-24 (Goal 2) — contradicción pantalla-vs-predicado: `b3_3:294` vs `b3_3:316` vs `b3_3:370` vs `b3_3:351`.
2. `PANTALLA_DETALLE_INSUFICIENTE` E-20 — acción de pago OC no especificada (`b3_4:77-84`).
3. Vocabulario "6 gates" vs "5 gates": `inv:49` y `b3_2:16` cuentan E-23 como gate del sumidero; E-23 es señal, no gate (`sch_c:213` nota, `b3_3:318`). Unificar a 5 (met:119/sch_c:17).
4. Nomenclatura camelCase vs snake_case en predicados del consolidado: `composicionCausal` (sch_c:214) vs `composicion_causal` (b3_2:291); `creadoEn`/`verificadorId`/`citadoEn` (sch_c:211,213) vs `creado_en`/`verificador_id`/`citado_en` (b3_2:218). La convención declarada es snake_case (`sch_c:267`); los mapeos B3 la respetan, los predicados del §6 no. Unificar.
5. Residuo de transición en `define:75` ("desarrollo → aprobado_compras") vs `sch_c:211`/`b3_2:196` (`estado→desarrollo`). Inconsistencia fuente-a-fuente, no pantalla-a-predicado; aclarar en el checkpoint.

**`PANTALLA_FALTA` estructural: 0.** Las 4 `DECISION_PENDIENTE` de permisos (DP-02 rol compras, DP-04 login contador, H8 transparencia, H12 pedidos anónimos — `b4_2:H-B4-2-01..04`) siguen abiertas y se escalan al Supervisor; ninguna es estructural de pantalla.

---

## Goal 5: UX destilado

Muestreo por familia (reglas R01-R40 `reg:` / principios P01-P28 `ux:` citados explícitamente en cada pantalla y aplicados en las secciones 3/6/7/8):

| Familia | Reglas aplicadas | Principios aplicados | §7 responsive+a11y |
|---|---|---|---|
| B3-1 (P-01..P-05, F-01..F-03/F-08) | R02, R03, R05, R09, R11, R12, R13, R16, R17, R25, R26, R29, R30-R39 | P01, P03, P04, P08, P13, P14, P17, P19, P26, P28 | 3 breakpoints + ≥48px + foco (p. ej. b3_1:120-123) |
| B3-2 (P-06..P-12) | R03, R04, R05, R06, R14, R16, R17, R18, R20, R21, R28, R34, R40 | P01, P03, P08, P10, P20 | Familia A/B + R40 timezone (b3_2:112,232,304) |
| B3-3 (P-13..P-19) | R05, R07, R12, R16, R18, R28, R34 | P01, P03, P08, P14, P28 | Familia A + CTA tercio inferior (b3_3:105,169) |
| B3-4 (P-20..P-23) | R05, R07, R16, R18, R20, R28 | P01, P03, P08, P14, P22, P28 | Familia A + moneda (b3_4:111,163) |
| B3-5 (P-24..P-26, F-04..F-07) | R07, R16, R18, R19, R23, R24, R25, R26, R27 | P01, P02, P03, P08, P14, P15, P23, P24, P25, P26, P27, P28 | Familia A/B + móvil-first cliente (b3_5:94,142,300) |

Verificación de reglas críticas con evidencia puntual: R05 (matemática servidor) en P-04/P-20/P-22 (b3_1:321, b3_4:113,220); R16 (gates con guard visible) en P-08/P-09/P-14/P-17/P-18/P-20 (botones deshabilitados con razón); R18 (confirmación destructiva) en ramas negativas de P-05/P-13/P-14/P-17/P-18/P-22/F-07; R34 (Familia A dinero/compras/cronograma/taller) en P-13/P-14/P-16/P-20/P-21/P-22. Familia A/B asignada según `inv_clas` (R34).

**Conteo final Goal 5: cubierto sin hallazgos estructurales.** Nota débil (no estructural): P05/P06/P24/P25 citados con menos evidencia explícita en B3-2/B3-3/B3-4 (cobertura implícita en wireframes/§8) — refuerzo opcional, ya señalado en `b4_4:H-B4-4-01/02`.

---

## VEREDICTO FINAL: RECHAZADO

**Razón:** el Goal 2 —"100% de gates con UI"— falla por **1 hallazgo estructural `DETERMINISMO_ROTO` en el gate E-24**: la transición de aprobación del veredicto de calidad (`b3_3:294`) escribe `proyectos.estado→instalado`, lo que contradice el predicado `P24` (`b3_3:316`/`sch_c:213`, que exige `p.estado='armado'`), deja `P24` falso inmediatamente después de aprobar, y por el guard de P-18 (`b3_3:370`, "Iniciar se deshabilita si P24 no pasó") **bloquea la instalación en deadlock**; además colisiona con E-25 (`b3_3:351`), que escribe el mismo estado `instalado`, colapsando dos hitos de negocio distintos. Un único fallo estructural es suficiente para RECHAZAR (`met:16`).

**Correcciones exactas (ordenadas por prioridad):**

1. **`b3_3:294` — E-24 DETERMINISMO_ROTO (bloqueante).** Reconciliar la transición "Aprobar veredicto" con `P24` (`b3_3:316`/`sch_c:213`) y con el guard de P-18 (`b3_3:370`) y con E-25 (`b3_3:351`). Opciones: (A) que E-24 NO mueva `proyectos.estado` fuera de `'armado'` y que E-25 lo lleve a `en_instalacion`/`instalado` (un solo destino por transición, sin duplicar `instalado`); o (B) redefinir el guard de P-18 para evaluar solo el subconjunto persistente de P24 (veredicto `calidad` aprobado del verificador único) y fijar en `sch_c:213` el criterio exacto "gate pasó". Cualquiera de las dos debe eliminar el deadlock y unificar el destino de estado.
2. **`b3_4:77-84` — E-20 PANTALLA_DETALLE_INSUFICIENTE.** Especificar la acción de UI que materializa el pago a proveedor (egreso en `movimientos_financieros` con `ordenCompraId`), o documentar su auto-materialización al liberar el gate. Hoy el monto de E-20 está mapeado (`b3_4:101`) pero ninguna pantalla especifica el botón/acción.
3. **`inv:138-201` — evidencia de cobertura incompleta.** Agregar la fila E-59 a la tabla de cobertura (hoy 60 filas; `inv:201` afirma 61/61). E-59 está cubierto por P-11 (`inv:54`, `b3_2:360-412`) — es corrección documental, no `PANTALLA_FALTA`.
4. **`inv:49`/`b3_2:16` — vocabulario de gates.** Unificar "6 gates" → "5 gates + E-23 señal" (met:119, sch_c:17, b3_3:318) para que el sumidero P-06 no induzca a tratar E-23 como gate.
5. **`sch_c:211-215` — nomenclatura de predicados.** Unificar `composicionCausal`/`creadoEn`/`verificadorId`/`citadoEn` a snake_case real (`composicion_causal`, `creado_en`, `verificador_id`, `citado_en`) conforme a la convención `sch_c:267` que los mapeos B3 ya respetan.
6. **`define:75` — residuo de transición.** Aclarar la etiqueta "desarrollo → aprobado_compras" frente al predicado `sch_c:211`/transición `b3_2:196` (`estado→desarrollo`) en el checkpoint (no bloquea determinismo; los mapeos B3 siguen el consolidado).

**Notas de conteo Goal por Goal (para el informe al Supervisor):**
- Goal 1: 34/34 presentes · 30 con 8 secciones · 1 embebida (F-08) · 3 frontera DIFERIDO (F-04/05/06, excepción `inv:227`). APROBADO (con excepción documentada).
- Goal 2: 5/5 gates con UI · predicados mapeados 5/5 · 4 `DETERMINISMO_OK` · 1 `DETERMINISMO_ROTO` (E-24). **RECHAZADO.**
- Goal 3: 5/5 roles consistentes. APROBADO.
- Goal 4: 0 `PANTALLA_FALTA` · 6 `PANTALLA_AMBIGUA` resueltas · cobertura real 61/61 (evidencia 60/61, corregir fila E-59) · 1 `PANTALLA_DETALLE_INSUFICIENTE` (E-20). APROBADO con correcciones.
- Goal 5: UX destilado aplicado por familia (R01-R40/P01-P28, muestreo). APROBADO.

---

## Notas para el Orquestador

- **Reapertura focalizada (met:16, máx 2 loops):** reabrir SOLO el contexto afectado por la corrección 1 (B3-3, pantallas P-17/P-18 — transición E-24 y guard de instalación) y por la corrección 2 (B3-4, P-20 — acción de pago E-20). Corregir también el documento de inventario (corrección 3: fila E-59) y los ajustes de vocabulario/nomenclatura (4, 5). La corrección 6 es para el checkpoint humano.
- **No re-auditar B3-1/B3-2/B3-5 en profundidad:** salvo la nomenclatura de predicados, sus gates (E-18/E-33) y pantallas quedaron `DETERMINISMO_OK` y con contrato completo en esta auditoría.
- **Re-auditoría tras corrección:** el pase corregido debe re-pasar por un auditor independiente (no el que corrigió) antes de emitir APROBADO. Los conteos de B4/B5 previos (5/5 `DETERMINISMO_OK`) quedan **invalidados** por este hallazgo — B4-1 no detectó la contradicción E-24.
- **DECISION_PENDIENTE que siguen abiertas para el Supervisor (no bloquean estructura, sí el build):** DP-02 (rol compras), DP-04 (login contador), H8 (transparencia por rol), H12 (pedidos anónimos F-06), DP-06 (base comisión E-35), DP-09 (alojador docs E-41), proveedor de pasarela (F-08), H-B2-2-10 (agendamiento híbrido E-06). Registrar como `esperando_humano` en el ledger.
- **Archivo de salida único de esta auditoría:** `arnes/diagnostico/pasadas/d3_ui_auditoria_independiente.md`. No se modificó ningún otro archivo; no se tocó código.

## Registro

- Fecha: 2026-08-04 · Auditoría final independiente (re-auditoría de Fase B, reemplaza a B5 por conflicto de independencia).
- Conteos: pantallas 34/34 (31 detalle completo o embebido + 3 frontera) · gates 5/5 con UI (4 OK + 1 ROTO) · roles 5/5 consistentes · cobertura eventos 61/61 real (evidencia 60/61) · UX por familia cubierto.
- **Veredicto: RECHAZADO** (1 falla estructural: E-24 `DETERMINISMO_ROTO`).
