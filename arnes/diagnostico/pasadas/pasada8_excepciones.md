# Pasada P8 — Excepciones y fricción (subagente, loop de 3 pasadas)

**Lente:** el FALLO como unidad. Pregunta rectora: ¿qué pasa cuando este evento NO ocurre, falla, o se sale del camino feliz? Recorrido de los 47 eventos del inventario (`diamante2_discover_eventos.md`), sin repetir el loop 1 (`diamante2_loop_apertura.md`) ni el panorama consolidado P2-P7 (61 hallazgos únicos). Las decisiones del Supervisor I-024..I-027 (`log_insights_fase2.md`) se auditan como reglas reales nuevas, no inventadas.

---

## Iteración 1 (bruta)

Recorrido evento por evento preguntando "¿qué pasa si falla?" — sin filtrar. Se marca `YA PASADA`/`YA LOOP 1` lo que ya vive en el panorama o en el loop de apertura, para no contarlo como hallazgo.

### A. Embudo de demanda
- **E-01** (lead entra): si el canal/formulario falla, el lead muere en el nacimiento sin registro ni reintento; no hay evento de captura fallida ni de retención de datos parciales. Tampoco hay evento negativo para "lead que nunca se atiende".
- **E-02** (se atiende WhatsApp/IG): si nadie responde a tiempo, el lead se enfría y se pierde. El dato "hora de primera respuesta" nace (inventario:31) pero sin ventana ni escalación — nadie se entera de que no se respondió. (ver F-7)
- **E-03** (se califica): si la calificación es falsa (positivo/negativo), la cola comercial se satura con no-clientes o se descarta un buen lead; no hay evento de reversión de calificación. `score_conversion` muerto → P6-05 YA PASADA.
- **E-04** (se descarta/redirige): la redirección al marmolero no tiene evento de confirmación (¿el lead llegó?); aceptado como política de bajo ticket — sin documento, no se fuerza.
- **E-05** (presupuesto preliminar): la rama "no viable" tiene hueco en blanco del propio mapa: `Z1[["¿Se pierde el lead? sin proceso definido"]]` (`logica_de_negocio.md:40`). Es distinta del descarte formal (E-04) y no tiene evento ni regla. (ver F-8)
- **E-06** (se agenda visita): conflicto de franja/sobre-reserva sin evento negativo; el no-show INVERSO (comercial que no llega) no está documentado en el mapa (solo el del cliente) → sin traza, se descarta.
- **E-07** (visita ocurre): visita sin dato estructurado (H4) → P6-05 YA PASADA.
- **E-46** (visita NO ocurre): no-show → A-3 YA LOOP 1.
- **E-08** (paga diseño 3D): descuento olvidado (RED1) → P3-03/H-10 YA PASADA; pago sin atribución al diseñador → P2-7 YA PASADA.
- **E-09** (recibe propuesta): propuesta que el cliente nunca abre/revisa — sin timeout ni evento de re-contacto; snapshot vs. proyecto vivo → P3-07 YA PASADA.
- **E-10** (ajustes del cliente): ciclo sin convergencia / scope creep: la cotización crece y el tiempo no se re-estima (la función de estimación del mapa no tiene evento que la dispare — ver F-10).
- **E-11** (cotización formal): propuesta congelada vs. proyecto vivo → P3-07 YA PASADA.
- **E-12** (contrato borrador): 6/7 contratos sin hitos → P3-02 YA PASADA.
- **E-13** (contrato se firma): sin mecanismo de firma → P4-F7 YA PASADA. Además: al cerrar, la decisión I-024 pide capturar viajes/situaciones del cliente — el inventario no tiene ese evento ni campo. (ver F-3)

### B. Contratos y cronograma
- **E-14** (cronograma se fija): el cronograma nace sin la ancla contractual de la promesa de 7 semanas (I-024) y sin la estimación de duración pre-contrato (mapa:254) — se fija fechas sin base calculada. (ver F-1, F-10)

### C. Desarrollo
- **E-15** (retoma de medidas): anomalía detectada → E-16; anomalía NO detectada en retoma y que estalla en instalación es la taxonomía de fallas #4 → bucle de aprendizaje H-08 YA PASADA (diferido).
- **E-16** (ajuste en paralelo): "corre EN PARALELO, no bloquea" queda obsoleto frente a I-027 (flow organizado de cambios con impacto medible y costo al cliente). (ver F-6)
- **E-17** (desarrollo técnico): error de desarrollo (taxonomía #2) → versión/P2-8 y linaje/P3-05 YA PASADAS; el gate E-18 acota el riesgo.
- **E-18** (check de schema pre-compras): el gate solo modela la aprobación; la rama "schema NO aprobado" no tiene evento de consecuencia (¿desarrollo corrige? ¿quién se entera? ¿corre cronograma?). P2-3 cubrió el negativo de E-21, no el de E-18. (ver F-9)

### D. Compras
- **E-19** (pedido de compra): OC con mecánica equivocada; RED3 (dinero gobierna timing) → P5-04 YA PASADA.
- **E-20** (pago a proveedor): sin dinero → P2-2/P5-04/H-03 YA PASADA; arriendos (3er flujo) → P2-1 YA PASADA; pago sin comprobante → sin documento, se descarta.
- **E-21** (recepción triple verificación): material llega mal → reproceso → P2-3 YA PASADA; proveedor que no entrega → queda sublimado en E-33 (causa externa), sin evento propio.
- **E-45** (reposición de herramienta): herramienta que se daña y NO dispara reposición → sin consecuencia documentada (el enum de estado tiene pendiente "prestada/extraviada", mapa:587); se descarta por falta de traza.

### E. Armado y calidad
- **E-22** (armado): saturación 1.25/semana → H-04/H-05 YA PASADA; la cola del taller no es dato hoy → la decisión I-025 la convierte en input del check de 15 días. (ver F-4)
- **E-23** (citación de calidad push): citación que nunca se empuja o comercial que no asiste → sin evento negativo; el pool de verificadores queda definido por I-026. (ver F-5)
- **E-24** (verificación pre-despacho): calidad RECHAZADA → sin rama negativa (reproceso, retorno al taller, quién se entera); P2-3 solo cubrió E-21. Y el verificador no tiene pool (resuelto por I-026). (ver F-5, F-9)
- **E-22/E-24** (frontera): ver D-1 YA LOOP 1 (estado vs. detalle).

### F. Entrega / instalación
- **E-25** (instalación): instalación que falla en sitio → la taxonomía #4 documenta "reprocesar o devolver un módulo al taller" (`logica_de_negocio.md:436`) pero no hay evento que lo materialice; el rango de 5 días no tiene evento negativo de incumplimiento. (ver F-9)
- **E-26** (acta de entrega): acta nunca se hace (RED4) → P4-F7 YA PASADA; cliente no conforme con el acta → sin documento, se descarta.

### G. Finanzas / compensación
- **E-27** (notificación de pago): notificación que no llega → H-10 YA PASADA.
- **E-28** (pago del cliente): pago parcial/mal conciliado → P3-02/P3-12 YA PASADA.
- **E-29** (cobro con atraso): atraso MÁS ALLÁ de los 12 días de holgura → no hay consecuencia ni escalamiento documentado (mapa:416). (ver F-12)
- **E-30** (deducción del diseño 3D): descuento olvidado → P3-03/H-10 YA PASADA.
- **E-31** (compensación por rol): parámetros sin número → B-4 YA LOOP 1; cuenta del diseñador → P2-7 YA PASADA.
- **E-32** (micro cuenta de cobro): doble nacimiento → P3-03 YA PASADA.
- **E-35** (comisiones según cumplimiento): la reducción de comisiones por novedad de producción (I-025) no tiene evento que la dispare desde el check de 15 días — hoy solo dispara E-33 (causa). (ver F-4)

### H. Control de cronograma
- **E-33** (cambio de cronograma con causa): clasificador sin verificador → P4-F2 YA PASADA; solo interno/externo, sin el TERCER origen "cambio de contrato" que ordena I-027; deslizamiento sin comunicación al cliente → P5-02 YA PASADA, pero la decisión I-025 la MATIZA (silencio deliberado dentro de la promesa de 7 semanas). (ver F-4, F-6)
- **E-34** (novedad crítica): SLA 5-24h sin consecuencia → P2-9 YA PASADA.

### I. Garantía
- **E-36** (garantía se agenda): 8-12 días hábiles → P2-5 YA PASADA; garantía que no se agenda o cobertura rechazada → sin documento, se descarta.
- **E-37** (orden de garantía): orden INCOMPLETA (instalador sin materiales) → el mapa documenta "hay que volver 2 o 3 veces más" (`logica_de_negocio.md:470`); el inventario no modela el check de completitud de la orden ni la segunda visita. (ver F-11)

### J. Integraciones
- **E-38** (schema → 3D): traducción mal hecha → corte mal → reproceso; precedencia vs. E-18 → P5-13 YA PASADA.
- **E-39** (CVC → corte): copia/pega manual → I-002 YA LOOP 1; archivo con error → P5-13 YA PASADA.
- **E-40** (conversión offline): `gclid` perdido → A-6 YA LOOP 1.

### K. Documentación y medición
- **E-41** (foto/documento): documentación que no se sube → P4-F8 YA PASADA; carpeta inconsistente → B-1 YA LOOP 1.
- **E-42** (medición de embudo): no medible sin datos → P6-05 YA PASADA.
- **E-43** (lectura de caja): dos verdades del dinero → P3-12 YA PASADA.
- **E-47** (KPIs operativos): el KPI "entrega en ~15-20 días de la venta" (mapa:169) queda en contradicción con la promesa contractual de 7 semanas y con el mecanismo del check de 15 días (I-024/I-025); bienestar sin horas → P6-03/H-06 YA PASADA. (ver F-2)

### L. Tienda web
- **E-44** (pedido de tienda → producción): enganche inexistente → A-1 YA LOOP 1; identidad del cliente → P3-11 YA PASADA; pedido sin stock / producto no fabricable → sin documento, se descarta.

### Cruce con las 5 decisiones del Supervisor (I-024..I-027) — ver tabla abajo
1. **7 semanas (I-024):** NO hay evento que la materialice. E-14 fija rango/holgura, no la promesa; E-47 la contradice. → F-1, F-2.
2. **Cuestionario de viajes (I-024):** NO hay evento ni campo al cierre de contrato. → F-3.
3. **Check de los 15 días (I-025):** NO hay evento del log de producción (insumos, comprados/pagados, cola del taller) ni de sus 3 desenlaces (insinuación de entrega / posposición con comisiones reducidas / negociación en extremo). → F-4.
4. **Calidad por vendedor o gerente (I-026):** PARCIAL — E-24/E-18 piden "verificador (≠ quien construyó)" sin pool. → F-5.
5. **Flow de cambios (I-027):** NO — E-16 "corre en paralelo" queda obsoleto; E-33 solo interno/externo. → F-6.

---

## Iteración 2 (autocrítica)

**Qué cae y por qué:**
- `YA PASADA`/`YA LOOP 1`: RED1/RED4, H4, score muerto, no-show (A-3), P2-3 (E-21), P2-7, P2-8, P2-9, P3-02, P3-03, P3-07, P3-11, P3-12, P4-F2, P4-F7, P4-F8, P5-01, P5-02, P5-04, P5-13, P6-05, H-04, H-05, H-06, H-08, H-10, A-1, A-6, B-1, B-4, D-1 — ya estaban en el panorama o en el loop 1; NO se cuentan.
- **Sin trazabilidad → descartados:** no-show inverso del comercial (E-06), pago sin comprobante (E-20), herramienta dañada sin reposición (E-45), garantía no agendada/cobertura rechazada (E-36), cliente no conforme con acta (E-26), pedido de tienda sin stock (E-44). No hay documento que las respalde → regla: VACÍO o descarte. Se descartan.

**Qué sobrevive (refinado en iteración 3):** las 6 adiciones/refuerzos derivados de I-024..I-027 (F-1..F-6) y las 6 fallas de los 47 eventos que P2-P7 y el loop 1 NO cubrieron (F-7..F-12).

**Lo que se me escapó en la pasada 1 (relectura):**
1. La función de estimación de duración `f(valor, cantidad)` (mapa:254) no la había cruzado con E-10/E-11 — el scope creep en ajustes también debería dispararla. (F-10)
2. La taxonomía de fallas #4 (instalación → "reprocesar o devolver un módulo al taller", mapa:436) conecta E-25 con la familia de ramas negativas de los gates — no es solo E-24. (F-9)
3. **Doble cronograma:** I-025 dice que en novedad "el proyecto pospone cronograma de producción" PERO "el cliente NO ve cambios en el cronograma contratado". Eso implica DOS líneas de tiempo (la interna de producción, movible, y la contractual al cliente, inmutable dentro de 7 semanas) — choca con la inmutabilidad de E-33/A-7 que asume UN solo cronograma. Nota para el Define, no hallazgo nuevo.
4. El riesgo de campo muerto: el campo de viajes (I-024) podría morir como `score_conversion` (I-005) si el cronograma (E-14/E-25) no lo consume. (Nota en F-3)

---

## Iteración 3 (refinamiento final)

### F-1 · ADICIÓN — La promesa contractual de 7 semanas no tiene evento que la materialice
El inventario E-14 fija rango de instalación de 5 días y holgura ≤5 días pero no la promesa de 7 semanas (I-024) que hoy es la regla contractual real. Sin ancla, E-25 (entrega), E-35 (comisiones) y el check de 15 días (F-4) no tienen contra qué medir el cumplimiento. Fuente: `log_insights_fase2.md:39` (I-024); `diamante2_discover_eventos.md:49` (E-14).

### F-2 · REFUERZO — KPI "15-20 días" de E-47 queda contradicho por la promesa de 7 semanas + check de 15 días
`logica_de_negocio.md:169` define el KPI "entrega dentro de ~15-20 días de la venta". Con I-024 (7 semanas) e I-025 (check a 15 días, instalación en los siguientes 15 → ~30 días ideal; 3 semanas de atraso tolerable → 7 semanas), el número de E-47 ya no es coherente con el contrato. El Define debe reconciliar el KPI con la promesa. Fuente: `logica_de_negocio.md:169`; `log_insights_fase2.md:39-40`; `diamante2_discover_eventos.md:125` (E-47).

### F-3 · ADICIÓN — Cuestionario de viajes/situaciones del cliente al cierre de contrato no tiene evento ni campo
I-024 ordena capturar viajes/situaciones externas del cliente al cerrar el contrato para anticipar cambios del flow. El inventario no tiene ni el evento de captura (E-13/E-14) ni el campo. Fallo si no ocurre: la instalación (E-25) puede chocar con la ausencia del cliente — el mismo riesgo del no-show (E-46), pero con cliente ya contratado. Nota: el campo debe tener consumidor real en el motor de cronograma (E-14/E-25), o morirá como `score_conversion` (I-005). Fuente: `log_insights_fase2.md:39` (I-024); `diamante2_discover_eventos.md:48-49` (E-13/E-14).

### F-4 · ADICIÓN — El check de los 15 días (I-025) no existe como evento y es el mecanismo de enforcement más grande del cronograma
I-025 define: log real de producción a ~15 días ((a) insumos en taller, (b) comprados o pagados, (c) proyectos en fila en el taller) y TRES desenlaces: (1) feliz → insinuar instalación en los siguientes 15 días (frontstage, entrega antes de las 7 semanas); (2) novedad → pospone cronograma interno, comisiones se reducen (E-35), cliente NO ve cambios (silencio deliberado), entrega 3 semanas tarde dentro de la promesa; (3) extremo → máximo estrés y no entrega → negociar con el cliente. El inventario no tiene ninguno de estos eventos (ni el log ni los 3 desenlaces ni la cola del taller como dato). Además matiza el hallazgo P5-02 YA PASADA: dentro de la promesa, el silencio es por diseño, no un bug. Fuente: `log_insights_fase2.md:40` (I-025); `diamante2_discover_eventos.md:73,101` (E-22/E-35).

### F-5 · REFUERZO — I-026 define el pool de verificadores que E-24/E-18 dejan vacío
El inventario exige "verificador (≠ quien construyó)" sin decir quién. I-026 lo resuelve: el comercial que vendió el proyecto o el gerente. Cierra el VACÍO P4-F4 YA PASADA. Implicación a vigilar en el Define: el comercial vendedor verifica Y cobra comisión por entrega (P4-F6) — el mismo actor ahora con doble rol verificador-cobrador; conflicto de interés latente a declarar, no inventado. Fuente: `log_insights_fase2.md:41` (I-026); `diamante2_discover_eventos.md:58,75` (E-18/E-24).

### F-6 · ADICIÓN — I-027 reorganiza E-16 y E-33: flow de adicionales/cambios con tercer origen de causa
I-027: (1) ADICIONAL entra como módulo con su especificación, con tiempo de entrega propio o afectación al cronograma declarada; (2) CAMBIO con protocolo de impacto medible (¿afecta compras? ¿insumos ya comprados homologables?); (3) reprocesos/afectaciones con costo al cliente (en el contrato); (4) E-33 gana un TERCER origen de causa "cambio de contrato" además de interno/externo. E-16 "corre EN PARALELO, no bloquea" queda obsoleto como única respuesta. Resuelve el VACÍO P5-03/P3-06 YA PASADA. Fallo si no ocurre: adicional sin especificación → producción adivina; cambio sin impacto medible → compras mal; insumos no homologables → desperdicio con costo que no se sabe cobrar a quién. Fuente: `log_insights_fase2.md:42` (I-027); `diamante2_discover_eventos.md:56,99` (E-16/E-33).

### F-7 · ADICIÓN — No hay SLA ni escalación para la primera respuesta al lead (E-01/E-02)
El dato "hora de primera respuesta" nace (inventario:31) pero sin ventana, sin consecuencia y sin quién-se-entera: un lead sin atender se pierde en silencio. El mapa lo reconoce como pregunta abierta ("leads perdidos por demora en responder", mapa:508). Es un SLA distinto del de E-34 (P2-9 YA PASADA). Fuente: `diamante2_discover_eventos.md:31` (E-02); `logica_de_negocio.md:508`.

### F-8 · ADICIÓN + VACÍO — Rama "presupuesto preliminar no viable" sin proceso definido (Z1)
El diagrama del mapa tiene el hueco en blanco: `Z1[["¿Se pierde el lead? sin proceso definido"]]` (`logica_de_negocio.md:40`) para la rama E-05 → no viable. Es distinta del descarte formal de E-04 (marmolero/geografía/refacción) y de E-46 no-show (A-3 YA LOOP 1). No hay evento, no hay regla, no hay dato: VACÍO de información + evento que falta. Fuente: `logica_de_negocio.md:40`; `diamante2_discover_eventos.md:34` (E-05).

### F-9 · ADICIÓN — Ramas negativas de los gates E-18, E-24 y E-25 sin evento de reproceso
P2-3 YA PASADA modeló la rama negativa de E-21 (recepción) y nada más. Los otros puntos de verificación quedan sin camino de falla: E-18 (schema no aprobado → ¿desarrollo corrige?), E-24 (calidad rechazada → ¿retorno al taller?), E-25 (instalación que falla → "reprocesar o devolver un módulo al taller", documentado en la taxonomía #4, mapa:436). Para cada uno falta: consecuencia, reproceso, y QUIÉN se entera. Fuente: `logica_de_negocio.md:436,440`; `diamante2_discover_eventos.md:58,75,81` (E-18/E-24/E-25).

### F-10 · ADICIÓN — La función de estimación de duración (mapa:254) no tiene evento que la dispare
"Estimar antes de contratar: existe una función de estimación ≈ f(valor, cantidad de ítems/módulos); si el proyecto crece, se estima un porcentaje de crecimiento; esto permite proyectar el cronograma antes del contrato" (mapa:254). El inventario no la materializa: ni como dato previo de E-14 (cronograma proyectado pre-contrato), ni como re-estimación en E-10/E-11 cuando el alcance crece en ajustes (scope creep sin recalcular tiempo). Fallo si no ocurre: el cronograma nace a ojo → desfase estructural desde el origen. Fuente: `logica_de_negocio.md:254`; `diamante2_discover_eventos.md:41,49` (E-11/E-14).

### F-11 · ADICIÓN — Orden de garantía incompleta → 2-3 vueltas del instalador sin evento (E-37)
El mapa documenta la falla real: "si el instalador no lleva todo lo necesario, hay que volver 2 o 3 veces más donde el cliente" (`logica_de_negocio.md:470`), y que la orden de garantía "necesita una orden tan completa como las de taller". El inventario E-37 solo reutiliza `ordenes_trabajo` con tipo distinguible; no modela el check de completitud (materiales incluidos) ni la segunda visita como evento. En un momento de riesgo de confianza (mapa:545), cada vuelta extra es fricción cobrada en reputación. Fuente: `logica_de_negocio.md:470,545`; `diamante2_discover_eventos.md:108` (E-37).

### F-12 · VACÍO — Cobro con atraso: no hay consecuencia después de la holgura de 12 días (E-29)
El mapa solo documenta: recordatorio manual del comercial + cláusula de 12 días de holgura (`logica_de_negocio.md:416`). El inventario E-29 modela la marca de atraso y el recordatorio. Qué pasa si el atraso supera los 12 días (escalamiento, intereses, suspensión, impacto en caja/RED3) no está documentado ni modelado. Prioridad baja (el mapa no lo define), pero el lente de falla exige marcarlo. Fuente: `logica_de_negocio.md:416`; `diamante2_discover_eventos.md:90` (E-29).

---

## Cobertura de las decisiones del Supervisor (I-024..I-027)

| Decisión | ¿La cubre el inventario? | Hallazgo asociado |
|---|---|---|
| 1. Promesa contractual de 7 semanas, entregable antes (I-024) | **NO** — E-14 fija rango/holgura sin la promesa; E-47 la contradice con "15-20 días" | F-1, F-2 |
| 2. Cuestionario de viajes/situaciones del cliente al cerrar contrato (I-024) | **NO** — sin evento ni campo en E-13/E-14 | F-3 |
| 3. Check de los 15 días con log de producción y 3 desenlaces (I-025) | **NO** — no existe el evento del log ni los desenlaces (insinuación / posposición con comisiones / negociación) | F-4 |
| 4. Calidad revisable por el comercial vendedor o el gerente (I-026) | **PARCIAL** — E-24/E-18 piden "verificador" sin pool definido | F-5 |
| 5. Flow organizado de cambios de contrato, tercer origen para E-33 (I-027) | **NO** — E-16 "corre en paralelo" queda obsoleto; E-33 solo interno/externo | F-6 |

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Evento(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| F-1 | ADICIÓN | Promesa contractual de 7 semanas sin evento que la materialice (E-14 sin ancla de promesa) | E-14, E-25, E-35 | log_insights_fase2.md:39; diamante2_discover_eventos.md:49 |
| F-2 | REFUERZO | KPI "15-20 días" de E-47 contradicho por la promesa de 7 semanas + check de 15 días | E-47, E-14 | logica_de_negocio.md:169; log_insights_fase2.md:39-40; diamante2_discover_eventos.md:125 |
| F-3 | ADICIÓN | Cuestionario de viajes/situaciones del cliente al cierre de contrato: sin evento ni campo; riesgo de campo muerto | E-13, E-14, E-25 | log_insights_fase2.md:39; diamante2_discover_eventos.md:48-49 |
| F-4 | ADICIÓN | Check de los 15 días (I-025): log de producción + 3 desenlaces + cola del taller; silencio deliberado dentro de la promesa | E-14, E-22, E-33, E-35 | log_insights_fase2.md:40; diamante2_discover_eventos.md:73,101 |
| F-5 | REFUERZO | Pool de verificadores definido por I-026 (comercial vendedor o gerente); conflicto de interés vendedor-verificador | E-18, E-24 | log_insights_fase2.md:41; diamante2_discover_eventos.md:58,75 |
| F-6 | ADICIÓN | Flow organizado de cambios (I-027): adicional/cambio con impacto medible, costo al cliente, tercer origen en E-33 | E-16, E-33, E-14 | log_insights_fase2.md:42; diamante2_discover_eventos.md:56,99 |
| F-7 | ADICIÓN | SLA de primera respuesta al lead sin ventana ni escalación | E-01, E-02 | diamante2_discover_eventos.md:31; logica_de_negocio.md:508 |
| F-8 | ADICIÓN+VACÍO | Rama "presupuesto preliminar no viable" (Z1) sin proceso definido ni dato | E-05 | logica_de_negocio.md:40; diamante2_discover_eventos.md:34 |
| F-9 | ADICIÓN | Ramas negativas de los gates E-18/E-24/E-25 sin reproceso ni quién se entera (P2-3 solo cubrió E-21) | E-18, E-24, E-25 | logica_de_negocio.md:436,440; diamante2_discover_eventos.md:58,75,81 |
| F-10 | ADICIÓN | Función de estimación de duración sin evento (pre-contrato en E-14 ni re-estimación en E-10/E-11) | E-10, E-11, E-14 | logica_de_negocio.md:254; diamante2_discover_eventos.md:41,49 |
| F-11 | ADICIÓN | Orden de garantía incompleta → 2-3 vueltas del instalador sin check de completitud ni evento de segunda visita | E-37 | logica_de_negocio.md:470,545; diamante2_discover_eventos.md:108 |
| F-12 | VACÍO | Cobro con atraso sin consecuencia más allá de la holgura de 12 días | E-29 | logica_de_negocio.md:416; diamante2_discover_eventos.md:90 |

---

## Notas para el Define

1. **I-025 fuerza a decidir entre UN cronograma y DOS:** el check de 15 días dice que en novedad "el proyecto pospone cronograma de producción" pero "el cliente NO ve cambios en el cronograma contratado" — mientras la inmutabilidad de E-33/A-7 asume una sola línea de tiempo. El Define debe separar línea interna de producción (movible) de línea contractual al cliente (inmutable dentro de las 7 semanas) o el enforcement de ambas se contradice.
2. **Los 4 desenlaces del check de 15 días (F-4) son la pieza de enforcement que reemplaza el vacío de P2-9 (SLA):** la novedad de producción tiene ahora una consecuencia real y cronometrada (comisión reducida, entrega 3 semanas tarde dentro de la promesa, y en extremo negociación frontstage). Ubicar el "log de producción" como dato de entrada de E-35/E-33.
3. **Reconciliar la cadencia en UN número:** E-14 (promesa 7 semanas), E-47 (KPI 15-20 días) y E-25 (instalación ~30 días ideal vía check de 15+15) conviven hoy con tres números. I-024/I-025 los resuelven de fondo; el Define solo debe anclarlos en eventos y KPI.
4. **El costo de reprocesos (I-027) necesita dueño financiero:** si el cliente asume el costo de cambios/adicionales, hace falta un evento de cobro por cambio (no es E-28 regular) y una regla de cómo se clasifica la causa de E-33 cuando el origen es "cambio de contrato" frente al sistema de comisiones de E-35.
5. **Conflictos de interés a declarar, no inventar:** I-026 (vendedor verifica su venta) + P4-F6 (comercial cobra por entrega) y F-5/F-6 deben resolver en el Define cómo la separación ejecutor-verificador sobrevive cuando el verificador gana si la entrega pasa.
6. **El campo de viajes (I-024) solo sirve si el cronograma lo consume** (E-14/E-25); sin consumidor, repetirá la muerte de `score_conversion` (I-005). El Define debe amarrarlo a la lógica de instalación.
7. **Las ramas negativas de los gates (F-9) son el mismo patrón a decidir que ya pidió P2:** elegir entre invariantes de máquina de estados (el estado no avanza sin el guard) o eventos de rechazo explícitos — pero ahora para E-18, E-24 y E-25, no solo para E-21.

## Registro

- Fecha: 2026-08-03
- Subagente P8, lente excepciones/fricción, loop interno de 3 pasadas (bruta → autocrítica → refinamiento).
- Resultado: **12 hallazgos finales** (8 ADICIÓN, 2 REFUERZO, 1 ADICIÓN+VACÍO, 1 VACÍO). Ninguno duplica el loop 1 ni el panorama P2-P7. 4 de 5 decisiones del Supervisor NO tienen evento en el inventario (I-024 promesa, I-024 viajes, I-025 check 15 días, I-027 cambios); 1 (I-026 verificador) parcial.
- Verificación mecánica: trazabilidad `archivo:línea` en el 100% de los hallazgos; descartados los casos sin documento (no-show inverso, pago sin comprobante, herramienta, garantía no agendada, acta no conforme, stock de tienda).
- Escritura: solo este archivo. No se modificó ningún otro.
