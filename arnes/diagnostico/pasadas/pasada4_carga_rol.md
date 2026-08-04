# Pasada P4 — Carga por rol (subagente, loop de 3 pasadas)

**Lente:** el ACTOR como unidad. Matriz rol × eventos construida sobre `diamante2_discover_eventos.md` (47 eventos), cruzada con capacidad instalada (`logica_de_negocio.md` §Capacidad, ratio 4:1), poder real vs. diseño (Q5/Q18), y separación ejecutor-verificador.

**Matriz rol × eventos (resumen de la pasada):**

| Rol | Dispara | Eventos | Valida/recibe |
|---|---|---|---|
| **Comercial** | 13 | E-02, E-03, E-04, E-05, E-06 (o IA), E-07 (con cliente), E-10 (con cliente), E-11, E-12, E-15 (con desarrollador), E-16, E-29 (con sistema), E-36 (con cliente) | E-23 (espera citación de calidad); E-18 (verificador posible) |
| **Sistema** | 11 | E-09, E-14, E-27, E-30, E-31, E-32, E-35, E-40, E-42, E-43 (con gerente), E-47 (con gerente) | — (automatiza) |
| **Cliente** | 10 | E-01, E-07 (con comercial), E-08, E-10 (con comercial), E-13, E-26 (con empresa), E-28, E-36 (con comercial), E-44, E-46 | E-09, E-27, E-26 (recibe) |
| **Desarrollador** | 6 | E-15 (con comercial), E-17, E-19 (con compras), E-21, E-22, E-41 (quien ejecuta) | E-18 (su trabajo se verifica); origen de E-23 |
| **Verificador** | 2 | E-18, E-24 | — |
| **Instalador** | 2 | E-25, E-37 | E-26 (con empresa) |
| **Compras** | 2 | E-19 (con desarrollador), E-20 | — |
| **Gerente** | 2 | E-43 (con sistema), E-47 (con sistema) | — |
| **Taller** | 1 | E-45 | — |
| **IA** | 1 | E-06 (híbrido) | — |
| **Proveedor/ext. | 1 | E-33 (causa externa) | — |
| **Diseñador** | **0** | — | E-08, E-31 (solo cobra) |
| **Carpintero** | **0** | — | E-31, E-35 (solo cobra) |
| **Auxiliar** | **0** | — | E-31, E-35 (solo cobra) |

---

## Iteración 1 (bruta)

Hallazgos crudos que el lente detecta, sin filtrar:

1. Comercial dispara 13 de 47 eventos — la carga humana más alta del sistema.
2. Sistema dispara 11 — el diseño descarga una porción enorme en automatización.
3. Cliente dispara 10 — rol hiperactivo, casi tan cargado como Comercial.
4. **Diseñador dispara 0 eventos** — pese a tener capacidad propia (3 visitas/3 diseños/3 presupuestos por semana) y un modelo de compensación dedicado ($130k + comisión, E-08/E-31).
5. Carpintero dispara 0 y Auxiliar 0 — solo aparecen en la compensación (E-31/E-35).
6. E-05 (presupuesto preliminar) y E-07 (visita) están asignados a "comercial", mientras la capacidad y la compensación del diseñador asumen esos actos como suyos.
7. No existe el evento "diseño 3D producido" (el acto pre-contrato que el cliente paga en E-08 y que E-31 compensa).
8. E-33 (clasificación causa interno/externo) no tiene actor asignado, y de esa clasificación cuelgan las comisiones de E-31/E-35 — conflicto de interés monetario.
9. E-34 (novedad crítica con SLA 5-24h) tampoco asigna quién responde.
10. Gerente: en el inventario solo lee (E-43/E-47), pero en la realidad (Q5) dirige cada momento, hace los pagos de compras, verifica llamando al desarrollador y a veces se salta sus propios protocolos.
11. E-18 y E-24 respetan la separación ejecutor-verificador (≠ quien construyó), pero el pool humano de verificadores es 1-2 personas (producción = 2.5 personas; el padre de Javier es comercial Y arma Y verifica).
12. Comercial promete fechas (E-14 rango de instalación) que dependen de E-23 (citación empujada que no agenda) y de la caja (E-33/RED3) — responsabilidad sin autoridad.
13. E-29 (cobro con atraso) es 100% manual del comercial — carga de cobranza sobre el rol ya más cargado.
14. Cliente: 4 de sus 10 eventos (E-08, E-13, E-28, E-44) dependen de mecanismos que hoy no existen (firma virtual RED2, acta digital RED4, pasarela de pago).
15. E-41 ("quien ejecuta la etapa") es el único evento con disparador catch-all — sin rol ni momento definido.
16. E-22 asigna el armado a "desarrollador distribuye a auxiliares": el carpintero queda invisible; toda señal de producción del taller pasa por el desarrollador.
17. E-23: Comercial "espera" pasivamente la citación de calidad — el diseño lo documenta, pero deja a Comercial sin ningún instrumento sobre la cadena que determina sus fechas.
18. El gerente "se salta sus propios protocolos" (Q5) — la capa 1 ya tiene la respuesta (gate que ni el dueño puede saltar), pero el inventario no la materializa como evento de autorización con rol.
19. E-36 (garantía) y E-29 (cobro) son cargas post-venta que se suman a Comercial por proyecto.
20. E-47 (bienestar) requiere registrar horas, y ningún rol del inventario las registra (RRHH/Nómina ausente).
21. Contador y fotógrafo/contenido: roles que el mapa lista (374-385) sin ningún evento en el inventario.
22. E-30 (deducción del anticipo) la hace el "sistema" — correcto por diseño, pero su activación depende del registro del pago E-08, que hoy es informal.

---

## Iteración 2 (autocrítica)

**Descartados por `YA LOOP 1` (ya reportados en `diamante2_loop_apertura.md`):**
- El #17 (Comercial "espera" la citación) es el diseño declarado del gate (c) — ya en `diamante2_loop_apertura.md` D-1/D-3 (dueño del gate) y `logica_de_negocio.md:276`. Cae; el ángulo nuevo se conserva en F6 (responsabilidad sin autoridad sobre las fechas).
- El #18 (gerente se salta protocolos → gate que ni el dueño salta) es una decisión ya tomada en el mapa (`logica_de_negocio.md:269`). No se repite como hallazgo; la parte NUEVA es que el inventario no asigna roles de autorización (F3).
- El #20 (E-47 requiere horas) ya está en `diamante2_loop_apertura.md` V-5. Cae.
- El #22 (E-08 informal → E-30) ya está cubierto por D-4 (enlace E-08↔E-30) y C1/C2 del árbol de problemas. Cae.
- El #6 en su lado de "tensión híbrido agenda" ya está en A-4. El ángulo de *asignación de rol* (E-05/E-07 vs. capacidad del diseñador) NO está en el loop 1 → sobrevive (F1).

**Lo que sobrevive (núcleo del lente):**
- #4/#6/#7 → F1: el rol diseñador es un fantasma en el inventario (0 eventos; acto productivo no modelado; contradicción E-05/E-07 vs. capacidad).
- #8/#9 → F2: clasificador de causa y respondiente del SLA sin actor, con incentivo adverso.
- #10/#18 → F3: poder real (gerente hace todo) vs. diagrama (gerente solo lee); las funciones reales no se reasignan a ningún rol de autorización.
- #11 → F4: separación ejecutor-verificador correcta en diseño pero irreal de poblar con 2.5 personas.
- #1/#13/#19 → F5: Comercial es el rol más cargado y a la vez el que la palanca de demanda quiere hacer crecer → saturación.
- #12/#13 → F6: responsabilidad sin autoridad del comercial (fechas + cobranza).
- #3/#14 → F7: el cliente, 2º rol más activo, bloqueado por infraestructura pendiente.
- #15 → F8: E-41 catch-all sin dueño de captura.
- #16 → F10: desarrollador como proxy humano del taller (5 sombreros en capa 1).
- #21 → F9: contador y fotógrafo sin eventos (DIFERIDO).

**Lo que se me escapó en la pasada 1 (busca deliberada):**
- E-30 se dispara "sistema", pero su precondición (E-08 registrado) depende de que alguien registre un pago informal — el rol que lo registra no está asignado (nadie del inventario "recibe el pago del diseño"). Se integra a F8 (eventos sin rol de captura) y se nota en F3 (nadie asignado para registrar ingresos informales).
- El solapamiento Javier = comercial + diseñador (Q5 "Yo soy comercial", Q15 "yo soy diseñador") refuerza F1: la ausencia del diseñador puede ser el colapso real de dos roles en una persona, pero el inventario no lo declara.
- E-10 (ajustes del cliente, cliente/comercial) es un loop de negociación humano sin límite de rondas — carga adicional del comercial no contabilizada en la capacidad. Se integra a F5.

**Regla anti-espiral:** ninguno de los 10 hallazgos restantes cambia bounded contexts ni gates (se mantiene la regla 6 de `diamante2_metodologia_pasadas.md`); son asignaciones, actores y notas — material de Define, no reapertura.

---

## Iteración 3 (refinamiento final)

**F1 — ADICIÓN.** Rol diseñador ausente del inventario. Dispara 0 eventos de 47. El acto productivo que el cliente paga (E-08) y que E-31 compensa — producir el diseño 3D pre-contrato — no tiene evento; E-09 (entrega) y E-08 (pago) existen sin el trabajo intermedio. Además E-05/E-07 (presupuesto preliminar y visita) están asignados solo a "comercial" mientras la capacidad declarada del diseñador (3 visitas+3 diseños+3 presupuestos/semana) y su compensación asumen esos actos como suyos. Solapamiento real Javier=comercial+diseñador (Q5/Q15) puede explicarlo, pero el inventario no lo declara. **Implicación:** si la palanca de demanda crece, el diseñador (rol con capacidad 12/semana) no tiene evento donde registrar su trabajo; el sistema no podrá trazar qué diseñó quién (necesario para E-31).

**F2 — ADICIÓN.** E-33 (clasificación de causa interno/externo) y E-34 (SLA 5-24h) sin actor asignado. De la clasificación cuelgan las comisiones de E-31/E-35 — el dinero de desarrollador, auxiliar y carpintero. Quien clasifica "externa" preserva el incentivo del equipo; sin protección, el rol que clasifica puede jugar el sistema en su favor. Y E-34 no asigna quién responde dentro de la ventana de 5-24h. **Implicación:** el evento necesita un dato de actor clasificador + regla de quién NO puede clasificar (p.ej. quien se beneficia de la clasificación), o un tercero; el Define no puede dejar E-33 como "causa interna/externa" sin dueño de la decisión.

**F3 — ADICIÓN.** Estructura de poder real vs. de diseño: el gerente (Javier) hace de todo en la práctica (Q5: dirige cada momento, paga compras, verifica llamando, se salta sus propios protocolos) pero en el inventario solo dispara 2 eventos de lectura (E-43/E-47). Las funciones reales del gerente — pagar compras (E-20), aprobar el check (E-18), ocupar el pool de verificación (E-24), registrar ingresos informales (E-08) — no tienen rol de autorización asignado. Sin asignación explícita, todo vuelve al gerente por defecto y el diagrama repite la realidad que la capa 1 quería romper (el gate que ni el dueño salta, `logica_de_negocio.md:269`, no está materializado como evento de autorización con rol). **Implicación:** el Define debe asignar roles de autorización para E-18/E-20/E-24 y decidir explícitamente qué retiene el gerente — dejar vacante es decidir "sigue haciendo todo".

**F4 — VACÍO.** Separación ejecutor-verificador respetada en diseño (E-18: "puede ser la misma persona en rol distinto"; E-24: "≠ quien construyó") pero irreal de poblar: producción = 2.5 personas (`logica_de_negocio.md:293`) y el padre de Javier es comercial Y arma Y verifica (`logica_de_negocio.md:424`). El pool de verificadores posibles para E-24 es 1-2 personas. **Implicación:** o se formaliza al gerente como verificador único (concentra más poder → choca con F3), o se relaja la separación por escasez, o se define un pool rotativo. Es un vacío de asignación humana, distinto del D-3 del loop 1 (dueño del contexto del gate) — acá el problema es factibilidad de personal, no de frontera.

**F5 — REFUERZO.** Comercial es el rol más cargado (13 eventos, el doble del segundo humano) y a la vez el cuello de la demanda (1.25 proy/mes, limitado por leads; fábrica haría 5 proy/mes — ratio 4:1, `logica_de_negocio.md:299`). Su carga es lineal por proyecto: cada proyecto nuevo = ~13 disparos, más el loop de negociación E-10 sin límite de rondas, más la cobranza manual E-29 y la garantía E-36 post-venta. **Implicación:** con la palanca de demanda, el comercial se satura primero — antes que la fábrica — porque su capacidad declarada (1.25/mes) ya está al tope de su límite real (leads) y su carga por evento no tiene margen. El Define debería descontar del comercial E-29 (sistema), E-36 (agenda), E-02/E-03 (IA) antes de escalar demanda.

**F6 — REFUERZO.** Comercial: responsabilidad sin autoridad, estructural. (a) Fechas: promete al cliente el rango de instalación (E-14) pero no controla la cadena que las cumple — la citación de calidad es empujada por desarrollo-taller (E-23) y el cronograma se mueve por la caja (E-33/RED3). (b) Cobranza: E-29 es 100% manual del comercial (`logica_de_negocio.md:468`) y el cobro depende de la entrega (E-25/E-26) que él no ejecuta. **Implicación:** no se corrige por asignación sola; el Define debe decidir cuánta autoridad se transfiere al comercial sobre producción/caja, o cuánta responsabilidad se le quita (que las fechas las prometa el sistema del cronograma, no la persona).

**F7 — REFUERZO.** El cliente es el 2º rol más activo del diseño (10 eventos) y 4 de ellos (E-08, E-13, E-28, E-44) dependen de mecanismos inexistentes: firma virtual (RED2), acta digital (RED4), pasarela de pago (visión del mapa, `logica_de_negocio.md:133`). **Implicación:** el rol más activo del sistema está bloqueado por infraestructura pendiente — resolver firma + pasarela es precondición del embudo, no decoración; su ausencia no es "el cliente no hace nada", es que los eventos de dinero/firma del cliente no pueden ocurrir.

**F8 — VACÍO.** E-41 ("quien ejecuta la etapa") es el único evento con disparador catch-all. Sin rol y sin momento definido, la evidencia por etapa queda a la voluntad — "a veces no se suben y están en el celular" (`segunda_ronda_preguntas.md:75`). Es el evento más barato (filosofía log=acción) y el más frágil. Mismo patrón: E-08 necesita que alguien registre un pago informal, y nadie está asignado a "recibir y registrar". **Implicación:** el Define necesita un dueño de captura por etapa (candidato natural: el desarrollador como proxy del taller, ver F10) y para E-08 un rol de registro del pago.

**F9 — DIFERIDO.** Contador y fotógrafo/contenido: roles que el mapa lista (`logica_de_negocio.md:374-377` contador con dashboard de facturación pendiente; `:383` roles que se acumulan) sin ningún evento en el inventario. El dashboard del contador sería una lectura análoga a E-43/E-47. **Implicación:** se registra para no perderlo; no bloquea el Define (la facturación vive en Aliado, externo).

**F10 — REFUERZO.** Desarrollador como proxy humano del taller. E-22 asigna "desarrollador distribuye a auxiliares" — el carpintero (parte de las 2.5 personas, `segunda_ronda_preguntas.md:88`, compensado por % + comisión) no dispara ni ejecuta ningún evento. Deliberado parcialmente (capa 2: "carpinteros y auxiliares no deberían usar pantallas todavía", Q6), pero en capa 1 el desarrollador carga 5 sombreros: ejecutor técnico (E-17), comprador (E-19), receptor-verificador (E-21), distribuidor (E-22), documentador (E-41) — y su trabajo es además el más bloqueante (`logica_de_negocio.md:148`). **Implicación:** el desarrollador es el micro-cuello humano de capa 1; cualquier crecimiento sin desagregar sus eventos satura la fábrica antes que el ratio 4:1 declare. Conecta con la pasada de tiempo (P5) para cuantificar cuánto de su semana es espera vs. ejecución.

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Evento(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| F1 | ADICIÓN | Rol diseñador ausente del inventario: 0 eventos; falta el acto "diseño 3D producido" (pago E-08 y compensación E-31 sin trabajo intermedio); E-05/E-07 asignados solo a comercial contradicen la capacidad del diseñador (3 visitas/3 diseños/3 presupuestos/semana) y el solapamiento real Javier=comercial+diseñador no se declara | E-05, E-07, E-08, E-09, E-31 | diamante2_discover_eventos.md:34,36,38,39,92; logica_de_negocio.md:295; segunda_ronda_preguntas.md:88,15,32 |
| F2 | ADICIÓN | E-33/E-34 sin actor: la clasificación causa interno/externo (de la que cuelgan las comisiones E-35→E-31) y la respuesta al SLA 5-24h no tienen dueño; conflicto de interés monetario para quien clasifica. Relacionado con D-3 (loop 1), aporta el ángulo de incentivo adverso y SLA | E-33, E-34, E-35 | diamante2_discover_eventos.md:99,100,101; logica_de_negocio.md:251 |
| F3 | ADICIÓN | Poder real vs. diseño: el gerente hace todo (paga compras, aprueba, verifica, se salta protocolos — Q5) pero en el inventario solo lee (E-43/E-47); las funciones reales no se reasignan a ningún rol de autorización; el gate "ni el dueño lo salta" no se materializa como evento de autorización | E-20, E-18, E-24, E-08, E-43, E-47 | segunda_ronda_preguntas.md:32; logica_de_negocio.md:269; diamante2_discover_eventos.md:58,65,75,124,125 |
| F4 | VACÍO | Separación ejecutor-verificador correcta en diseño (E-18/E-24) pero irreal de poblar: pool de verificadores = 1-2 personas (producción 2.5; el padre de Javier es comercial Y arma Y verifica). No duplica D-3 (dueño del contexto): es factibilidad de personal | E-18, E-24 | diamante2_discover_eventos.md:58,75; logica_de_negocio.md:293,424,440 |
| F5 | REFUERZO | Comercial = rol más cargado (13 de 47 eventos) y es el cuello de demanda (ratio 4:1): carga lineal por proyecto + E-10 sin límite de rondas + cobranza E-29 + garantía E-36 → se satura primero, antes que la fábrica | E-02..E-07, E-10, E-11, E-12, E-15, E-16, E-29, E-36 | diamante2_discover_eventos.md:31-41,90,107; logica_de_negocio.md:299 |
| F6 | REFUERZO | Comercial con responsabilidad sin autoridad, estructural: promete fechas (E-14) que no controla (E-23 push, E-33 caja) y cobra (E-29) sobre una entrega (E-25/E-26) que no ejecuta. No se corrige por asignación sola | E-14, E-23, E-33, E-25, E-26, E-29 | diamante2_discover_eventos.md:49,74,90,81,82,99; logica_de_negocio.md:468 |
| F7 | REFUERZO | Cliente = 2º rol más activo (10 eventos) pero 4 dependen de mecanismos inexistentes (firma virtual RED2, acta digital RED4, pasarela) → el rol más activo está bloqueado por infraestructura pendiente | E-08, E-13, E-28, E-44 | diamante2_discover_eventos.md:38,48,89,131; logica_de_negocio.md:464,133 |
| F8 | VACÍO | E-41 (y el registro del pago informal E-08) sin rol de captura: el único disparador catch-all del inventario; la evidencia queda a la voluntad ("a veces no se suben, están en el celular") | E-41, E-08 | diamante2_discover_eventos.md:38,122; segunda_ronda_preguntas.md:75 |
| F9 | DIFERIDO | Contador y fotógrafo/contenido: roles listados en el mapa sin ningún evento en el inventario (dashboard de facturación pendiente; roles que se acumulan). Se registra, no se modela | — | logica_de_negocio.md:374-377,383 |
| F10 | REFUERZO | Desarrollador como proxy humano del taller: 5 sombreros en capa 1 (E-17, E-19, E-21, E-22, E-41); el carpintero (2.5 personas, % por tamaño + comisión) no dispara nada (capa 2 deliberada). Micro-cuello humano coherente con "desarrollo = etapa más bloqueante" | E-17, E-19, E-21, E-22, E-41 | diamante2_discover_eventos.md:57,64,66,73,122; segunda_ronda_preguntas.md:35,88; logica_de_negocio.md:148 |

**Conteo:** 10 hallazgos — ADICIÓN ×3 (F1, F2, F3), REFUERZO ×4 (F5, F6, F7, F10), VACÍO ×2 (F4, F8), DIFERIDO ×1 (F9). Ninguno cambia bounded contexts ni gates (regla 6 de la metodología: sin reapertura; es material de Define).

---

## Notas para el Define

1. **Los 3 roles sin eventos (diseñador 0, carpintero 0, auxiliar 0) se explican distinto:** carpintero/auxiliar es capa 2 deliberada (Q6); diseñador NO — su ausencia (F1) es una omisión con efecto real en trazabilidad de compensación (E-31 necesita saber quién diseñó). El Define debe decidir si el diseñador es un rol del sistema o un alias de comercial, y agregar el evento "diseño 3D producido" si es rol propio.
2. **El cuello humano no es la fábrica, es la cola del embudo (F5/F6):** el comercial carga 13 eventos y su saturación es el primer límite al crecimiento — antes del ratio 4:1. Cualquier decisión de la palanca de demanda debe pasar por descontarle eventos automáticos (E-29, E-02/E-03 con IA) o el crecimiento escala a una persona, no a la empresa.
3. **El gerente (F3) es la decisión más incómoda del Define:** el poder real ya está concentrado; asignar roles de autorización (E-18/E-20/E-24) es redistribuir poder, no llenar casillas. El vacío actual equivale a decidir "el gerente sigue haciendo todo" — la capa 1 necesita un evento de autorización con rol explícito que ni el dueño pueda saltar.
4. **E-33/E-34 (F2) necesitan un actor clasificador protegido:** la clasificación interno/externo decide dinero; el Define debe asignar quién clasifica y quién queda impedido de clasificar (no quien se beneficia). Relacionado con D-3 del loop 1, pero acá el peso es el incentivo, no la frontera.
5. **E-24 (F4) es el punto donde la separación ejecutor-verificador puede romperse por escasez:** con 2.5 personas el verificador "≠ quien construyó" puede no existir el día del despacho. El Define debe prever el caso (verificador externo, gerente, o verificación diferida) antes de prometer el invariante.
6. **Dos eventos dependen de la misma decisión (F8):** el dueño de captura por etapa (E-41) y el registro del pago informal (E-08) son capturas sin rol. El candidato natural en capa 1 es el desarrollador como proxy del taller — pero eso concentra más carga en el micro-cuello de F10.
7. **La infraestructura bloquea al rol más activo (F7):** firma virtual y pasarela de pago no son eventos opcionales del cliente — son precondiciones de E-13/E-28/E-44. El orden de construcción del Define debe ponerlas junto a los gates de capa 1, no después.
