# Pasada C3 — Trazabilidad inversa (subagente, loop de 3 pasadas)

**Lente:** trazabilidad inversa sobre la convergencia (`diamante2_define_eventos.md`). Unidad de análisis: cada hallazgo/decisión que debió materializarse en el Define.
**Pregunta rectora:** ¿todo lo que el negocio decidió está materializado en la convergencia, o algo se perdió al pasar de eventos a contextos?
**Fuentes auditadas:** `define` (define_eventos, 169 líneas), `discover` (discover_eventos, 169 líneas), `panorama` (panorama_consolidado, 200 líneas), `log` (log_insights_fase2, 70 líneas), `cierre` (cierre_diamante, 138 líneas), `loop2` (loop2_y_retroalimentacion, 199 líneas), `loop_apertura` (diamante2_loop_apertura, 146 líneas).

---

## Iteración 1 (bruta)

Hallazgos crudos, sin depurar, salidos de la primera barrida sobre las 7 fuentes:

- B1. E-54 (reproceso) está asignado al contexto **Desarrollo** (`define:39`), pero su definición en el inventario cubre 3 orígenes: schema rechazado (E-18), calidad rechazada (E-24) e instalación fallida (E-25) (`discover:84`). El patrón de gates `define:71-77` solo declara la rama negativa de E-18; las ramas de E-24/E-25 no tienen rama negativa documentada.
- B2. El cuestionario de viajes E-53 tiene hogar en Contratos (`define:37`) y §1:18 declara el riesgo de campo muerto ("sin consumidor en el motor de cronograma"), pero la tabla de interfaces §5 (`define:95-105`) no tiene la fila Contratos → Control de cronograma que consuma E-53.
- B3. P3-09 (captura duplicada E-07/E-15 sin relación de superación) — E-07 quedó en Comercial (`define:33`) y E-15 en Desarrollo (`define:39`), sin contrato en §5 que declare la superación.
- B4. P3-11 (identidad del cliente de tienda sin relación tipada al ERP) — E-44 con hogar en Tienda web (`define:35`), pero §5 no tiene la interfaz Tienda → ERP.
- B5. P3-05 (linaje del material cotización→BOM→lista→OC→recepción) — los eventos tienen hogar (Comercial/Desarrollo/Compras), pero el linaje como contrato no figura en §5.
- B6. Los VACÍO del loop de apertura V-1 (regla de no-show, `loop_apertura:93`), V-4 (envío tienda, `loop_apertura:96`), V-5 (registro de horas para bienestar, `loop_apertura:97`) y V-6 (mecanismo de firma, `loop_apertura:98`) no figuran en la tabla §6 de "por definir" (`define:117-129`); solo viven en las notas de sus eventos.
- B7. P8 F-2 (KPI "15-20 días" contradicho): el Define ancla el cronograma a 7 semanas (`define:17`) pero el evento E-47 conserva el KPI "entrega en ~15-20 días" (`discover:119`). La reconciliación quedó a medias.
- B8. I-014 (restauración de pisos de madera, `log:29`) e I-021 (B2B diseño de interiores, `log:36`) son líneas de servicio reales (contrato vivo Parte I) sin evento ni contexto en la convergencia; estado abierto en el log.
- B9. P3-12 (dualidad saldo derivado vs. `saldo_actual`) y P3-07 (snapshot congelado vs. proyecto vivo) no tienen huella de resolución en el Define ni VACÍO declarado.
- B10. Los 3 contextos nuevos (Marketing/Demanda, Tienda web, Gobierno/Medición) tienen sus eventos, pero sus interfaces de frontera (E-40/E-42/E-44/E-47/E-55) no tienen fila en §5; §8:150 solo declara la intención.
- B11. Completitud de eventos: verificación aritmética del Define da 61/61 — ningún evento sin hogar.
- B12. Decisiones I-024..I-043 del Supervisor: todas las que tocan la convergencia (I-024, I-025, I-027, I-034, I-035, I-043) aparecen asumidas en §1 y materializadas en eventos.

## Iteración 2 (autocrítica)

**Qué sobrevive y qué cae:**

- **Cae B5 (parcial).** P3-05 es un REFUERZO de linaje de datos: los eventos están en contextos y el linaje como relación de esquema es materia del loop 2, no de frontera de contexto. El Define no lo declara, pero tampoco es una pérdida estructural. Se mantiene como nota débil, no como hallazgo de frontera fuerte.
- **Cae B9 (parcial).** P3-12 y P3-07 son dualidades de cómputo/UI (derivado vs. almacenado; snapshot vs. edición viva). El Define declara explícitamente que NO decide schema ni UI (`define:158`). Clasificarlas como "pérdida" sería pedirle al Define lo que no es su contrato → bajan a OK_CON_DOC (loop 2 las consume).
- **Cae B10 (parcial).** §8:150 ya declara que las interfaces de frontera de los contextos diferidos "se diseñan". La intención está documentada; falta llenar la tabla §5. Baja a OK_CON_DOC con recomendación.
- **B6 se refina.** V-6 (mecanismo de firma) sí tiene apoyo parcial en §8:152 (firma virtual como precondición de capa 1). El hueco real de registro es V-1, V-4 y V-5 (y en menor grado V-6): están en notas de eventos pero no formalizados en §6.
- **B8 se refina.** I-014/I-021 no son decisiones del Supervisor materializables en el Define técnico: son líneas de servicio de contrato vivo (Parte I) pendientes de alcance. No disparan checkpoint de la convergencia; se registran como DECISION_PENDIENTE de alcance.

**Qué se me escapó en la pasada bruta (autocrítica):**

- E.1. La corrección P5-09 (`define:80`) y la tabla de bounded contexts del cierre §4 quedaron **registradas como checkpoint pendiente del Supervisor** (`define:159,168`). Verifiqué que es un pendiente documentado, no una pérdida.
- E.2. P4-F3 (poder real del gerente) se resuelve en §4.1 (dueños de gates) PERO el gate de caja E-20 deja la autoridad como VACÍO (`define:123`, §7#2) — es el único punto donde "el gerente hace todo" no se cierra.
- E.3. E-59 (check de 15 días) depende como input de "proyectos en fila en el taller" (`define:19`), dato que nace en Taller (capa 2) — una dependencia de frontera Control↔Taller que §5 no declara. Menor: el dato está anotado en §1.
- E.4. La tensión híbrida de agendamiento E-06 quedó declarada en el inventario (`discover:39`) pero no pasó a §7 del Define (lista de decisiones de negocio). Menor.

**Fallo de escepticismo detectado en la propia pasada:** en B1 estuve a punto de proponer PARTIR_CONTEXTO para E-54 (crear un contexto "reproceso"); la lectura correcta es que E-54 es un evento de frontera transversal cuyo hogar está bien (quien ejecuta la etapa) y lo que falta es declarar la **rama negativa de E-24/E-25** en la tabla de gates — corrección de la tabla §4.1, no nuevo contexto. → REFORZAR_FRONTERA.

## Iteración 3 (refinamiento final)

Hallazgos depurados (10). Se eliminan los que la anti-duplicación descarta (YA RESUELTO: B5, B9, B10 → se consumen como OK_CON_DOC; E.1/E.2/E.3/E.4 → ya resueltos o documentados) y quedan:

1. **C3-01 (REFORZAR_FRONTERA)** — E-54 con 3 ramas negativas (E-18/E-24/E-25) pero solo la de E-18 declarada en §4.1.
2. **C3-02 (REFORZAR_FRONTERA)** — E-53 sin consumidor declarado en §5; riesgo de campo muerto §1:18 sin contrato de interfaz.
3. **C3-03 (REFORZAR_FRONTERA)** — P3-09: superación E-07/E-15 sin contrato; hoy viven en contextos distintos sin relación.
4. **C3-04 (REFORZAR_FRONTERA)** — P3-11: identidad tienda→ERP sin interfaz tipada en §5.
5. **C3-05 (CORRECCION)** — VACÍOs del loop de apertura V-1/V-4/V-5/V-6 no formalizados en §6 (V-6 parcial en §8:152).
6. **C3-06 (DECISION_PENDIENTE)** — E-47 conserva el KPI "15-20 días" contra el ancla de 7 semanas (§1:17); P8 F-2 reconciliado a medias.
7. **C3-07 (DECISION_PENDIENTE)** — I-014 (restauración de pisos) e I-021 (B2B interiores): líneas de servicio abiertas sin evento/contexto en la convergencia.
8. **C3-08 (OK_CON_DOC)** — P3-12 y P3-07 sin resolución en el Define: son decisiones de cómputo/UI del loop 2 (fuera del contrato del Define, `define:158`).
9. **C3-09 (OK_CON_DOC)** — Interfaces de frontera de los 3 contextos nuevos no llenadas en §5 (intención declarada en §8:150).
10. **C3-10 (OK_CON_DOC)** — E-06 tensión híbrida y P2-5 validación de holguras: declaradas en el inventario, no formalizadas en §6/§7 (parámetros de loop 2).

---

## Matriz de trazabilidad — eventos → contextos

Verificación de completitud contra la aritmética del Define (`define:49`). **61/61 eventos con hogar. 0 SIN HOGAR.** Re-verificación independiente del conteo por contexto:

| Bounded context | Eventos | N | Verificación |
|---|---|---|---|
| Comercial / Cotizador | E-01..E-07, E-09..E-11, E-46, E-48, E-49, E-50, E-51 | 15 | ✓ (Sección A del discover menos E-08 → Finanzas, E-52 → Control) |
| Marketing / Demanda (NUEVO) | E-40, E-42, E-55 | 3 | ✓ (E-55 movido desde Sección F; E-42 desde Sección H) |
| Tienda web (NUEVO) | E-44 | 1 | ✓ |
| Gobierno / Medición (NUEVO) | E-47 | 1 | ✓ (movido desde Sección H) |
| Contratos | E-12, E-13, E-16, E-53 | 4 | ✓ |
| Control de cronograma ⭐ | E-14, E-33, E-34, E-52, E-59, E-60 | 6 | ✓ (E-52 movido desde Sección A) |
| Desarrollo | E-15, E-17, E-18, E-54 | 4 | ✓ |
| Compras | E-19, E-20, E-21, E-45 | 4 | ✓ |
| Taller / Armado (capa 2) | E-22 (solo frontera) | 1 | ✓ |
| Calidad / Verificación | E-23, E-24 | 2 | ✓ |
| Entrega / Instalación | E-25, E-26 | 2 | ✓ |
| Garantía | E-36, E-37, E-61 | 3 | ✓ |
| Finanzas / Compensación | E-08, E-27..E-32, E-35, E-43, E-56, E-57, E-58 | 12 | ✓ |
| Documentación | E-41 | 1 | ✓ |
| Integraciones (producción) | E-38, E-39 | 2 | ✓ |
| **TOTAL** | | **61** | **61/61 con hogar — 0 SIN HOGAR** |

**Eventos SIN HOGAR:** ninguno. Los 5 que el panorama señaló como huérfanos (E-40, E-42, E-44, E-45, E-47) fueron los que motivaron los 3 contextos nuevos y la fila de Compras (`define:29,34-36,40`); verificado.

**Movimientos de contexto intencionales (documentados, no pérdidas):** E-08 (Comercial → Finanzas, frontera §5:107), E-52 (Comercial → Control, §2:38), E-42/E-47/E-55 (Secciones H/F → contextos nuevos). Todos están explicitados en el Define.

**Flags del loop de apertura (verificación anti-duplicación):** A-1→E-44, A-2→E-45, A-3→E-46, A-5→E-47, A-4→E-06 (nota), A-6→E-40 (nota dos caminos), A-7→§4.3/I-034, B-1→E-41 (nota), B-3→E-07 (nota), B-4→E-31 (nota) + §6, B-5→DIFERIDO, D-1→Taller capa 2 (§2:41), D-2→dueño E-21 (§4.1), D-3→dueños §4.1, D-4→§4.3:87. **Todos los flags del loop 1 tienen huella.**

---

## Matriz de trazabilidad — hallazgos/decisiones → resolución

### Bloque 1 — Hallazgos del panorama consolidado (P2-P8, 52 filas de familia + 12 de P8)

**Familia A — El dinero (6):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| P3-02 nacimiento de la obligación (4 namespaces, 6/7 sin hitos) | E-56 en Finanzas `define:45`; frontera P3-02 `define:109` | RESUELTO |
| P2-2 gate de caja E-20 (dato previo, no enforcement) | VACÍO §6 `define:123` + decisión de negocio §7#2 `define:135` | VACÍO declarado |
| P2-1 pago de arriendos (3er flujo) | E-57 en Finanzas `define:45` | RESUELTO |
| P5-04/H-03 RED3 dinero gobierna compras | Precedencia dinero→E-20 `define:84` | RESUELTO |
| P3-12 dos verdades (derivado vs. `saldo_actual`) | E-43 en Finanzas `define:45`; la dualidad de cómputo queda para loop 2 (`define:158`) | SIN HUELLA (de resolución) → OK_CON_DOC (C3-08) |
| H-03 límite al crecimiento por dinero | E-43 con hogar (único operador de la vista de caja) `define:45` | RESUELTO |

**Familia B — El cronograma y su enforcement (7):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| P2-4/P4-F2 inmutabilidad sin enforcement + clasificación sin verificador | Patrón máquina de estados+guard `define:69`; clasificador de causa §3 `define:58` | RESUELTO (enforcement); actor respondiente → VACÍO §6/§7#1 |
| P2-5 holguras/ventanas sin validación (≤5, 5 días, 8-12, sábado) | Valores en E-14/E-25/E-36 (inventario); validación paramétrica de loop 2 | RESUELTO (hogar); validación no declarada → OK_CON_DOC (C3-10) |
| P2-9 consecuencia del SLA 5-24h | VACÍO §6 `define:122` + §7#4 `define:137` | VACÍO declarado |
| P5-07/P6-02 cadencia (15-20 vs. 30 vs. 6.5) | Ancla 7 semanas §1:17 (I-024) → E-14/E-11 | RESUELTO (nota: "venta sin definir" sin huella, menor) |
| P3-08 ¿E-34 subtipo de desfase? | E-33 y E-34 co-ubicados en Control de cronograma `define:38` | RESUELTO por co-ubicación (relación formal = loop 2) |
| P5-03/P3-06 E-16 impacto en cronograma no documentado | §1:23 (I-027) + precedencia E-16→E-33 `define:86` | RESUELTO |
| P5-09 orden "compras→aprobación" vs. E-18 | Corrección §4.2 `define:80` (checkpoint de Supervisor al converger, `define:159,168`) | RESUELTO (con checkpoint documentado) |

**Familia C — El schema como definidor (4):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| P2-8/P6-07 versionado del schema | E-17 en Desarrollo `define:39`; precedencia E-18→E-38/39 `define:85` | RESUELTO (mecanismo de versionado = loop 2) |
| P3-05 linaje del material + costo con 3 dueños | E-17/E-19/E-21 con hogar (Desarrollo/Compras); linaje como contrato NO en §5 | RESUELTO (hogar); contrato de linaje SIN declarar → nota débil (C3-05 relación) |
| P2-3 rama negativa de recepción E-21 | VACÍO §6 `define:124` + tabla de gates `define:74` | VACÍO declarado |
| P5-13 precedencia E-38/E-39 frente a E-18 | §4.3 `define:85` | RESUELTO |

**Familia D — El cliente (5):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| P5-01 tramo silencioso E-15→E-26 | E-60 unifica `define:38,105` | RESUELTO |
| P5-02 deslizamiento sin comunicación | E-60 + cronograma doble §1:20 (I-034); silencio deliberado I-043 | RESUELTO |
| P5-10 garantía sin evento intermedio | E-60 unifica los 3 sueltos `define:38` | RESUELTO |
| P4-F7 cliente bloqueado por infraestructura | Precondiciones de capa 1 §8:152 (firma RED2, acta RED4, pasarela) | RESUELTO |
| P6-06 prueba social / testimonio | E-55 en Marketing/Demanda `define:34` (protocolo I-013) | RESUELTO |

**Familia E — Roles, poder y actores (7):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| P4-F1 rol diseñador ausente | E-48 en Comercial `define:33` + solapamiento §3:55 | RESUELTO |
| P4-F3 poder real vs. diseño (gates sin rol) | Dueños de gates §4.1 `define:71-77`; excepción gate de caja → VACÍO §6/§7#2 | RESUELTO (salvo gate de caja, VACÍO declarado) |
| P4-F2 E-33/E-34 sin actor asignado | §3:58 propuesta gerente/comercial + VACÍO §6 `define:128` + §7#1 | VACÍO declarado |
| P4-F4 pool de verificadores irreal | I-035 verificador único §1:21, §2:42, §4.1:73 | RESUELTO |
| P4-F5 comercial rol más cargado (ratio 4:1) | Nota de frontera §2:33 | RESUELTO (documentado) |
| P4-F6 responsabilidad sin autoridad | I-043 §1:22 (comisión por ventas, no producción) + E-60 | RESUELTO |
| P4-F10 desarrollador proxy del taller | Taller diferido a capa 2 §2:41, §8:149 | RESUELTO (diferido por diseño) |

**Familia F — Rol-vs-persona y capturas sin dueño (3):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| P2-12 modelo rol-vs-persona | §3 `define:55` (roles tipados, persona≠rol) | RESUELTO |
| P4-F8 E-41 sin rol de captura | VACÍO §6 `define:125` + nota §2:46 | VACÍO declarado |
| P2-7 cuenta/saldo por socio | E-58 en Finanzas `define:45` | RESUELTO |

**Familia G — Datos duplicados / sin dueño (6):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| P3-01 lead→cliente sin materialización | E-51 en Comercial `define:33` | RESUELTO |
| P3-03 doble nacimiento cuenta de cobro (E-08/E-32) | Frontera E-08 `define:107` (Comercial registra, Finanzas crea) | RESUELTO |
| P3-04 nómina compuesta (E-31 base + E-35 ajuste) | E-31 y E-35 co-ubicados en Finanzas `define:45` | RESUELTO por co-ubicación (relación formal = loop 2) |
| P3-07 snapshot vs. proyecto vivo (E-09→E-10→E-11) | E-09 en Comercial; dualidad de UI queda para loop 2 (`define:158`) | SIN HUELLA → OK_CON_DOC (C3-08) |
| P3-09 captura duplicada E-07/E-15 | Hogares en Comercial/Desarrollo; **relación de superación SIN contrato en §5** | SIN HUELLA → C3-03 (REFORZAR_FRONTERA) |
| P3-11 identidad tienda sin relación tipada | E-44 en Tienda web `define:35`; **interfaz tienda→ERP SIN fila en §5** | SIN HUELLA → C3-04 (REFORZAR_FRONTERA) |

**Familia H — Bucles sistémicos (7):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| H-01 reputación→demanda | E-26/E-41/E-01 con hogar | RESUELTO (lectura sistémica) |
| H-02 incentivo cronograma→comisión | E-14/E-35/E-24/E-33 con hogar | RESUELTO |
| H-04 saturación del taller (1.25/semana) | E-22/E-33/E-34/E-35 con hogar; Taller capa 2 | RESUELTO |
| H-05 tragedy of the commons | Nota de Tienda web §2:35 ("comparte el taller") | RESUELTO (documentado) |
| H-07 drifting goals (causa externa) | E-33 con causa auditable §4.1:76 | RESUELTO |
| H-10 fixes that fail (memoria en cobro) | E-30 automático + precedencia E-08→E-30 `define:87` | RESUELTO |
| H-11 success to the successful | E-35 compensador + I-043 §1:22 | RESUELTO |

**Familia I — Límites y bienestar (3):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| H-06 límite por bienestar | E-47 en Gobierno `define:36`; registro de horas (V-5) NO formalizado en §6 | RESUELTO (hogar); V-5 → C3-05 |
| H-08 bucle aprendizaje/calidad | Sin huella en el Define (clasificado DIFERIDO en el panorama, `panorama:154`) | DIFERIDO (no es pérdida) |
| H-09 fuga causal del no-show | E-46 en Comercial `define:33`; regla (V-1) NO formalizada en §6 | RESUELTO (hogar); V-1 → C3-05 |

**Familia J — Fronteras y contextos sin hogar (4):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| P6-03 4 eventos sin contexto | 3 contextos nuevos §2:34-36 | RESUELTO |
| P6-04 E-45 sin contexto | Compras `define:40` | RESUELTO |
| P6-01 visibilidad por rol (calendario+compras) | §3 + E-58/E-43/E-47 | RESUELTO |
| P6-05 medición = precondición de la tesis | §8:150 (backlog t-034) + §7#5 | RESUELTO (declarado backlog) |

**P8 — Excepciones y fricción (12):**

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| F-1 promesa 7 semanas sin evento | §1:17 + E-14/E-11 | RESUELTO |
| F-2 KPI 15-20 días contradicho | §1:17 (ancla 7 semanas); **E-47 conserva el KPI viejo** | RESUELTO (parcial) → C3-06 (DECISION_PENDIENTE) |
| F-3 cuestionario de viajes sin evento/campo | E-53 en Contratos `define:37` + §1:18 | RESUELTO (riesgo campo muerto señalado; consumidor → C3-02) |
| F-4 check de 15 días | E-59 en Control `define:38` + §1:19 | RESUELTO |
| F-5 pool de verificadores | I-035 §1:21 | RESUELTO |
| F-6 flow de cambios con tercer origen | §1:23 (I-027) + E-33 `define:76` | RESUELTO |
| F-7 SLA primera respuesta sin ventana | E-50 en Comercial + VACÍO §6 `define:119` + §7#3 | VACÍO declarado |
| F-8 presupuesto no viable (Z1) | E-49 en Comercial + VACÍO §6 `define:121` | VACÍO declarado |
| F-9 ramas negativas E-18/E-24/E-25 | E-54 en Desarrollo `define:39`; **solo rama de E-18 declarada en §4.1:73** | RESUELTO (parcial) → C3-01 |
| F-10 función de estimación sin evento | E-52 en Control `define:38` | RESUELTO |
| F-11 orden de garantía sin check | E-61 en Garantía `define:44` | RESUELTO |
| F-12 cobro con atraso sin consecuencia | VACÍO §6 `define:120` (prioridad baja) | VACÍO declarado |

### Bloque 2 — Decisiones del Supervisor (I-024..I-043 relevantes a la convergencia)

| Decisión | Estado en el log | Materialización en el Define | Estado |
|---|---|---|---|
| I-024 promesa de 7 semanas | integrado | §1:17; E-14/E-11 | RESUELTO |
| I-024 cuestionario de viajes/situaciones | integrado | §1:18; E-53 | RESUELTO (consumidor → C3-02) |
| I-025 check de los 15 días | integrado | §1:19; E-59 (3 desenlaces) | RESUELTO |
| I-026 calidad por comercial/gerente | integrado | Absorbida por I-035 (`panorama:23-29`) | RESUELTO |
| I-027 flow organizado de cambios | integrado | §1:23; E-16/E-33 (tercer origen) | RESUELTO |
| I-034 cronograma doble | integrado | §1:20; E-14/E-33/E-60 | RESUELTO |
| I-035 verificador único | integrado | §1:21; E-18/E-24 (§4.1) | RESUELTO |
| I-043 sin conflicto de interés + entrega antes | integrado | §1:22; E-31/E-35/E-60 | RESUELTO |

**I-001..I-013, I-029..I-042** (destino Parte II / refuerzos a eventos): verificados en sus eventos (I-001→E-21/E-41, I-002→E-39, I-003→E-38, I-005→E-03/E-40, I-008→E-55, I-010→E-07, I-013→E-55). I-015/I-017/I-039 son decisiones del Supervisor de **sitio público** (Parte II) — fuera del alcance de la convergencia de eventos, no requieren materialización en el Define. I-014/I-021 → C3-07.

**Conteo decisiones I-024..I-043 tocantes a la convergencia: 7/7 materializadas. Ninguna sin materializar.**

### Bloque 3 — Loop 2 (A1-A12)

| Hallazgo | Dónde se resuelve en el Define | Estado |
|---|---|---|
| A1 schema = definidor estructural | E-17/E-38 (Desarrollo/Integraciones) + §4.3:85 | RESUELTO |
| A2 separación ejecutor-verificador por evento | §3 + §4.1 E-18 (verificador único) | RESUELTO |
| A3 gates estructurales, no procedimentales | §4.1 patrón máquina de estados + rama negativa E-54 | RESUELTO |
| A4 triple verificación + citación push | §4.1 E-21/E-23 | RESUELTO |
| A5 SLA novedad 5-24h | E-34 (ventana en evento); consecuencia → VACÍO §6 | RESUELTO (ventana); consecuencia VACÍO |
| A6 causa del desfase = dato auditable | E-33 §4.1:76 + §3 | RESUELTO |
| A7 micro cuentas de cobro autogeneradas | E-32 en Finanzas + §5:107 | RESUELTO |
| A8 compras = gobernanza de la sociedad | E-43/E-58 en Finanzas | RESUELTO (hogar) |
| A9 estimación por tamaño | E-52 en Control `define:38` | RESUELTO |
| A10 4 rutinas clave = núcleo capa 1 | §8 capa 1 `define:146` | RESUELTO |
| A11 desequilibrio 4:1 demanda > fábrica | §2:33 nota (P4-F5) | RESUELTO (documentado) |
| A12 4 gates de la capa 1 | §4.1 `define:71-77` | RESUELTO |

### Resumen de la matriz B (conteo verificable)

| Estado | Conteo |
|---|---|
| **RESUELTO / materializado** (incluye OK_CON_DOC y hogares asignados) | **70** |
| **VACÍO declarado** (§6 y §7) | **8** |
| **SIN HUELLA en el Define** | **5** (P3-12, P3-07, P3-09, P3-11, H-08) |
| **Total de filas trazadas** | **83** |

Detalle de las 8 filas VACÍO: P2-2 (gate de caja), P2-9 (consecuencia SLA novedad), P2-3 (rama negativa E-21), P4-F2 (actor respondiente E-33), P4-F8 (rol captura E-41), F-7 (SLA primera respuesta), F-8 (presupuesto no viable), F-12 (consecuencia 12 días). Coinciden con 8 de las 10 filas de §6 (las 2 restantes — % carpintero, neto diseñador — provienen del cierre §9, no del panorama). **Los 10 "por definir" de §6 están todos presentes y declarados no-bloqueantes.**

Las 5 SIN HUELLA se descomponen así: 4 son **relaciones** (P3-12 dualidad de cómputo, P3-07 snapshot, P3-09 superación, P3-11 identidad tienda) cuyos eventos sí tienen hogar — no son pérdidas de eventos, son contratos/fronteras que el loop 2 debe resolver (P3-09 y P3-11 se elevan como C3-03/C3-04); 1 es H-08, DIFERIDO declarado en el panorama (no pérdida).

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Contexto(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| C3-01 | REFORZAR_FRONTERA | E-54 (reproceso) tiene 3 ramas negativas (E-18/E-24/E-25) pero §4.1 solo declara la de E-18; las ramas de calidad/instalación retornan al Taller (capa 2) sin rama negativa documentada ni transferencia de frontera. | Desarrollo, Calidad, Taller, Entrega | `define:39,73`; `discover:84` |
| C3-02 | REFORZAR_FRONTERA | E-53 (cuestionario de viajes): §1:18 declara el riesgo de campo muerto pero §5 no tiene la interfaz Contratos→Control que consuma el cuestionario en el motor de cronograma; sin ella se repite la muerte de `score_conversion` (I-005). | Contratos, Control de cronograma | `define:18,98`; `discover:56` |
| C3-03 | REFORZAR_FRONTERA | P3-09: relación de superación E-07 (visita, pre-contrato) / E-15 (retoma, post-contrato) sin contrato en §5; la duplicación de captura que P3-09 destapó queda sin resolución declarada. | Comercial, Desarrollo | `panorama:134`; `define:33,39,95-105`; `discover:40,63` |
| C3-04 | REFORZAR_FRONTERA | P3-11: identidad del cliente de tienda (`pedidos_web`) sin relación tipada al ERP; E-44 tiene hogar (Tienda web) pero §5 no declara la interfaz Tienda→ERP. | Tienda web | `panorama:135`; `define:35,95-105`; `discover:147` |
| C3-05 | CORRECCION | VACÍOs del loop de apertura V-1 (regla de no-show E-46), V-4 (alcance de envío E-44), V-5 (registro de horas para bienestar E-47) y V-6 (mecanismo de firma E-13) no formalizados en §6 — solo viven en notas de eventos; V-6 tiene apoyo parcial en §8:152. | Comercial, Tienda web, Gobierno/Medición, Contratos | `loop_apertura:93-98`; `define:113-129,152` |
| C3-06 | DECISION_PENDIENTE | P8 F-2 reconciliado a medias: el cronograma del contrato se ancla a 7 semanas (§1:17) pero E-47 conserva el KPI "entrega en ~15-20 días" (`discover:119`); la métrica de Gobierno/Medición contradice la promesa contractual. | Gobierno/Medición | `panorama:21`; `discover:119`; `define:17` |
| C3-07 | DECISION_PENDIENTE | I-014 (restauración de pisos de madera) e I-021 (B2B diseño de interiores por m²) son líneas de servicio reales (contrato vivo Parte I) sin evento ni contexto en la convergencia; estado abierto en el log. No es pérdida de los 61 eventos; requiere decisión de alcance. | (nuevo — línea de negocio) | `log:29,36` |
| C3-08 | OK_CON_DOC | P3-12 (dualidad saldo derivado vs. `saldo_actual`) y P3-07 (snapshot congelado vs. proyecto vivo) sin resolución ni VACÍO en el Define: son decisiones de cómputo/UI, fuera del contrato del Define (`define:158`). | Finanzas, Comercial | `panorama:72,133`; `define:156-160` |
| C3-09 | OK_CON_DOC | Contextos nuevos (Marketing/Demanda, Tienda web, Gobierno/Medición): §8:150 declara el diseño de sus interfaces de frontera (E-40/E-42/E-44/E-47/E-55) pero la tabla §5 no tiene filas para ellas; intención documentada, tabla sin llenar. | Marketing, Tienda web, Gobierno/Medición | `define:95-105,150` |
| C3-10 | OK_CON_DOC | E-06 tensión híbrida de agendamiento (declarada en `discover:39`) y P2-5 validación de holguras no formalizadas en §6/§7; parámetros de loop 2, no bloquean. | Comercial, Control, Entrega, Garantía | `discover:39`; `panorama:80`; `define:113-139` |

---

## Notas para el Orquestador / Define

1. **Frente A cerrado y limpio:** 61/61 eventos con hogar, 0 sin hogar. La convergencia 61 eventos → 15 contextos no perdió ningún evento. Los 5 huérfanos de P6-03/P6-04 quedaron resueltos con 3 contextos nuevos + fila de Compras. No hay nada que reponer en §2.

2. **La matriz B confirma que la convergencia materializó el cuerpo de las decisiones:** 70 de 83 filas resueltas/materializadas, 8 declaradas VACÍO (todas en §6 con su fila y su decisión de negocio en §7), 5 SIN HUELLA que se descomponen en relaciones de cómputo/UI (loop 2) y 1 diferido declarado (H-08).

3. **Las 7 decisiones del Supervisor tocantes a la convergencia (I-024, I-025, I-026→I-035, I-027, I-034, I-035, I-043) están todas materializadas. NO se detectó ninguna decisión del Supervisor sin materializar → no se dispara checkpoint nuevo por esta pasada.** El checkpoint ya registrado del Define (P5-09 al mapa, decisiones §7, tabla de bounded contexts del cierre §4) se mantiene tal cual (`define:168-169`).

4. **Los hallazgos C3-01 a C3-04 son contratos de interfaz ausentes en §5, no reaperturas de contexto.** Se resuelven como filas de la tabla de interfaces (o notas de frontera) en el loop 2 de diseño. C3-02 (consumidor de E-53) es el más urgente: el propio Define lo señaló como riesgo de campo muerto; si no se declara la frontera Contratos→Control, se materializa la advertencia.

5. **C3-05 (VACÍOs no formalizados):** pedir al Define/loop 2 que decida si §6 formaliza V-1/V-4/V-5/V-6 o si declara explícitamente que el registro "por definir" vive en las notas de eventos. Riesgo: que el loop 2 no las recoja por no estar en §6.

6. **C3-06 (KPI E-47):** es la única tensión interna residual entre una decisión del Supervisor (I-024, 7 semanas) y un evento (E-47, 15-20 días). No bloquea la convergencia, pero conviene alinear la métrica en el loop 2 para no reintroducir la contradicción de P8 F-2 que el Define declaró resuelta.

7. **C3-07 (I-014/I-021):** decisión de alcance de negocio, no del Define técnico. Sugerencia de secuencia: resolver antes de cerrar la capa 1 si alguna de las dos líneas comparte el pipeline de producción; si no, quedan fuera del corte como registro histórico.

8. **Gate de caja (E-20, VACÍO §7#2) es el "por definir" más estructural de los 10:** decide si RED3 (el dinero gobierna compras) es hard o soft, y con eso el "poder real del gerente" (P4-F3). No bloquea la convergencia (el evento y el guard configurable existen), pero debe cerrarse antes del diseño del gate en el loop 2.

9. **C3-09/C3-10 son informativos:** no piden acción de convergencia; recomiendan completar §5 y §6/§7 en el loop 2 para que la documentación de fronteras quede donde el método la busca.
