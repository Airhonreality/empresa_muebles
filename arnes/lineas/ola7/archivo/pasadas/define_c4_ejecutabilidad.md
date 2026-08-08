# Pasada C4 — Ejecutabilidad del enforcement (subagente, loop de 3 pasadas)

**Pregunta rectora:** ¿la máquina de estados declarada en §4 del Define (`diamante2_define_eventos.md`) es implementable y determinista, o es deseo?

**Unidad de análisis:** cada gate (E-18, E-21, E-23, E-33) y cada rama negativa (E-54), más los gates que el negocio exige y el §4.1 no declaró (E-20, E-24).

---

## Iteración 1 (bruta)

Hallazgos crudos, sin filtro de anti-duplicación:

- B1. El guard de E-33 ("ninguna fecha se recalcula sin causa estructurada") no cubre el **camino positivo**: E-59 desenlace feliz adelanta la instalación (mueve fechas) pero no tiene ruta declarada por E-33, ni la taxonomía de causa (interno/externo/cambio de contrato) tiene clase "positiva". Si el adelanto se enruta como "causa interna", la rama negativa de E-33 ("causa interna → E-35 comisiones se reducen") castiga el éxito.
- B2. E-54 "vuelve a la etapa anterior" no tiene un set de back-edges declarado: ¿qué transiciones reversa son legales? ¿rechazo de E-18 vuelve a `desarrollo`? ¿de E-24 a `armado`? ¿de E-25 a taller? Y la granularidad es ambigua: el inventario dice "proyecto: vuelve a la etapa anterior" (nivel proyecto) pero el mapa (mapa:444) habla de "devolver **un módulo** al taller" (nivel módulo).
- B3. E-21 no tiene transición de estado discreta: "pasa a control total del subsistema desarrollo-taller" es prosa, no un estado nombrado. Sin estado de salida, el borde de la máquina entre `aprobado_compras` y `armado` es difuso.
- B4. La rama negativa de E-21 (material mal recibido) es VACÍO (P2-3): si el guard falla, el proyecto no avanza y no hay transición de escape declarada → estado atascado.
- B5. E-20 gate de caja: solo declarado como precedencia (§4.3), nunca como guard de enforcement en §4.1. La pregunta "¿bloquea o advierte? + quién lo salta" (§7 #2) es la rendija por donde entra "el gerente hace todo": si alguien puede saltarlo, el "ni el dueño lo salta" de A3/P4-F3 no se materializa para el dinero.
- B6. E-23 destinatario del push ambiguo: el inventario dice "empuja **hacia Comercial**" (discover:82) pero el Define §4.1/§5 dice "Taller → **Calidad**". No reconciliado con I-035 (el verificador puede ser el gerente).
- B7. El guard de E-18 ("veredicto del verificador único") no pin de versión de schema: el veredicto no referencia qué versión aprobó; una edición del schema post-aprobación invalidaría silenciosamente el check (P2-8/P6-07).
- B8. E-24 (veredicto pre-despacho, `armado → verificado`) es un gate real con verificador (I-035) y con guard de instalación declarado en §5, pero **no tiene fila en la tabla de enforcement §4.1**; su rama negativa (rechazo → E-54) solo vive en el inventario.
- B9. §3 lista de roles (comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente, verificador) **omite "compras" y "taller"**, que §4.1 usa como dueños de los gates E-18/E-21. Vocabulario roles-vs-contextos sin puente.
- B10. Asimetría de recalculo: el rechazo de E-18 sí declara "cronograma se recalcula" (define:73) pero el rechazo de E-24/E-25 no. Ambos son reproceso por causa interna → ambos deberían recalcular y tocar E-35. ¿Oversight?
- B11. El determinismo del recalculo tras rechazo de E-18 depende del clasificador de causa de E-33, cuyo actor (gerente o comercial) está sin asignar (§7 #1).
- B12. "El gerente hace todo" (P4-F3): resuelto SOLO para E-18/E-24 (verificador único, I-035). No para E-20 (dinero), no para el clasificador E-33, no para E-41 (rol de captura VACÍO, P4-F8).
- B13. Corrección P5-09 (§4.2): a primera vista consistente (aprobación precede compras), pero deja sin precisar a qué línea del cronograma doble pertenece la etapa "aprobación", y las fuentes (mapa:253, cierre:85, discover:57) quedan desactualizadas hasta el loop focalizado.
- B14. Disparador de E-54 "quien ejecuta la etapa" ambiguo: ¿el que rechaza (verificador) o el que rehace (ejecutor)? Y "quién se entera" no tiene destinatario.
- B15. Autoverificación en E-21 check #1 ("compras hizo bien el pedido"): el desarrollador puede ser quien creó la OC (discover:72, "compras/desarrollador") → juzga su propio pedido. A4/I-035 no cubren E-21 (el verificador único es para E-18/E-24).

---

## Iteración 2 (autocrítica)

Filtro anti-duplicación y escepticismo sobre lo bruto:

**Lo que cae o se fusiona:**
- B10 se fusiona en B2: es la misma inconsistencia de las ramas negativas (el recalc no está declarado por igual en todas).
- B11 se fusiona en B12: el clasificador sin actor es parte de "el gerente hace todo" y de la determinancia de E-18/E-33; queda como hallazgo propio (DECISION_PENDIENTE) pero se re-frasea para no triplicar.
- B15 se fusiona en B9: es la misma frontera rol/contexto mal resuelta (compras = desarrollador proxy, P4-F10).
- B14: real pero menor; se subordina a C4-02 (granularidad/back-edges) en vez de hallazgo propio.

**Anti-duplicación explícita (regla del arnés):**
- B4 = P2-3, y el Define NO lo resolvió (lo marcó VACÍO en §6): no es YA RESUELTO. Es DECISION_PENDIENTE (decisión de negocio, parámetro honesto).
- B5 = P2-2, y el Define lo difirió a §7 #2: DECISION_PENDIENTE, pero mi ángulo nuevo es que P4-F3 ("ni el dueño lo salta") no tiene ningún hogar para el dinero — eso sí es observación nueva.
- B11 = P4-F2, difirido a §7 #1: DECISION_PENDIENTE.
- B7 traza a P2-8/P6-07 (REFUERZO): el Define no lo resolvió; mi ángulo es operacional (el guard necesita pin de versión). Se conserva como REFORZAR_FRONTERA.
- B2 traza parcialmente a P8 F-9 (las ramas negativas sin reproceso). El Define SÍ resolvió la parte "existe E-54" (YA RESUELTO para el evento de reproceso en sí), pero NO la granularidad módulo-vs-proyecto ni el set de back-edges ni la asimetría de recalc — eso es ángulo nuevo, no duplicado.
- B1, B3, B6, B8, B9, B12: no estaban levantados por P2-P8 con este ángulo. Conservar.
- Nada es YA DIAMANTE 1: los gates y el enforcement son materia de Fase 2; los pendientes del cierre (§9) no aplican a esta lente.

**Lo que se me escapó en la primera pasada y aparece acá:**
- La relación E-59↔E-33 (camino positivo) no está en el inventario ni en P2-P8 como interacción; el panorama solo resuelve la doble línea (I-034) y el P5-02. Es mi hallazgo más nuevo y el más crítico para el determinismo de E-33.
- El scoping del guard de E-33 ("ninguna fecha") sobre las dos líneas del cronograma doble: la contractual es inmutable salvo el adelanto positivo (excepción que el guard no declara). Está contenido en B1.
- E-21 sin estado de salida nombrado (B3) no estaba en ninguna pasada: es un defecto del modelado de estados del inventario, no del negocio.

**Veredicto intermedio:** la máquina es implementable en los caminos felices de los 4 gates (todos los guards son expresables como condiciones booleanas sobre estado + veredicto + causa). No es deseo para el happy path. Pero E-33 (camino positivo) y E-54 (back-edges/granularidad) no son deterministas como están escritos; E-20/E-21 quedan con ramas negativas dependientes de decisión de negocio, honestamente marcadas VACÍO.

---

## Iteración 3 (refinamiento final)

Hallazgos depurados (12, con IDs C4-01..C4-12). Los tres que disparan checkpoint: C4-01 (E-33 camino positivo), C4-02 (E-54 granularidad/asimetría) y C4-03 (E-21 sin estado discreto). Los VACÍO C4-04/C4-05 son decisiones de negocio ya abiertas con el Supervisor, no defectos silenciosos.

| ID | Tipo | Resumen |
|---|---|---|
| C4-01 | REFORZAR_FRONTERA | Guard de E-33 incompleto: el adelanto positivo (E-59) no tiene ruta ni clase de causa; la rama E-35 castigaría el éxito si se enruta como causa interna. |
| C4-02 | REFORZAR_FRONTERA | E-54 sin set de back-edges ni granularidad (proyecto vs. módulo) ni recalc uniforme (E-18 sí, E-24/E-25 no). |
| C4-03 | CORRECCION | E-21 sin transición de estado discreta (prosa); falta estado nombrado entre `aprobado_compras` y `armado`. |
| C4-04 | DECISION_PENDIENTE | Rama negativa E-21 VACÍO (P2-3): sin escape el guard fallido deja estado atascado. |
| C4-05 | DECISION_PENDIENTE | E-20 solo precedencia, no enforcement; "ni el dueño lo salta" (P4-F3) sin hogar para el dinero. |
| C4-06 | CORRECCION | E-23 destinatario del push ambiguo (Comercial vs. Calidad vs. rol verificador I-035). |
| C4-07 | REFORZAR_FRONTERA | Guard E-18 sin pin de versión de schema (traza P2-8/P6-07). |
| C4-08 | OK_CON_DOC | E-24 es gate real fuera de la tabla §4.1 (cubierto por I-035 y §5, falta fila propia). |
| C4-09 | REFORZAR_FRONTERA | §3 omite roles "compras"/"taller" que §4.1 usa como dueños; incluye riesgo de autoverificación en E-21 #1. |
| C4-10 | OK_CON_DOC | Corrección P5-09 consistente con mapa e inventario; no introduce contradicción. |
| C4-11 | DECISION_PENDIENTE | Recalculo tras rechazo de E-18 depende del clasificador E-33 sin actor (§7 #1). |
| C4-12 | REFORZAR_FRONTERA | "El gerente hace todo" (P4-F3) resuelto solo para verificación (E-18/E-24); dinero, clasificador y captura E-41 quedan abiertos. |

---

## Tabla de gates (estado de entrada / guard / disparador / rama negativa / determinismo)

| Gate | Estado de entrada | Estado de salida | Guard (¿expresable?) | Disparador (rol) | Rama negativa | Determinismo |
|---|---|---|---|---|---|---|
| **E-18** | `desarrollo` (E-17 ✓, discover:65) | `aprobado_compras` (E-18 ✓, discover:66) | Sí: existe veredicto aprobado del rol **verificador** asignado al despacho (I-035) + check de schema; **falta pin de versión** (C4-07) | verificador único designado (comercial o gerente); el contexto Compras no abre OC sin el estado | E-54 → vuelve a `desarrollo`; recalc declarado (define:73), depende del clasificador E-33 (C4-11) | **Determinista en la transición**; rama negativa condicionada a decisión pendiente |
| **E-21** | `aprobado_compras` / "compras en curso" (**prosa, sin estado nombrado**, C4-03) | "pasa a control total del subsistema desarrollo-taller" (**prosa, sin estado nombrado**, C4-03) | Sí: 3 sub-verificaciones AND (pedido bien hecho, despacho bien hecho, material verificado) | desarrollador (discover:74) — no el verificador único; riesgo de autoverificación en check #1 (C4-09) | P2-3 VACÍO (C4-04): material mal recibido sin transición de escape → **estado atascado** | **Happy path determinista; rama negativa inejecutable hasta decisión** |
| **E-23** | `armado` (E-22 ✓, discover:81) | sin cambio de estado (es señal, no transición) | Sí (como señal): ventana de calidad abierta; declarado "no bloquea" (define:75) | subsistema desarrollo-taller → push; **destinatario ambiguo** (C4-06) | — (se resuelve en E-24) | **Determinista como señal**; destinatario a reconciliar |
| **E-33** | cronograma fijado (E-14 ✓) | cronograma recalculado (entidad, no estado de proyecto) | Sí: recalc exige causa enum {interno/externo/cambio de contrato} + motivo; sin causa no recalc (define:76) | causa estructurada; **actor clasificador sin asignar** (§7 #1, C4-11) | causa interna → E-35 se reducen; dato auditable | **Determinista para desfase negativo; camino positivo (E-59 adelanto) sin regla (C4-01) → NO determinista** |
| **E-54 (ramas negativas)** | veredicto negativo de E-18/E-24/E-25 | "vuelve a la etapa anterior" (**sin set de back-edges**, C4-02) | Sí: veredicto negativo registrado (discover:84) | "quien ejecuta la etapa" (**ambiguo**, C4-02) | recalc inconsistente (E-18 sí, E-24/E-25 no) + granularidad módulo vs. proyecto (mapa:444 vs. discover:84) | **NO determinista: dos niveles (proyecto/módulo) y dos políticas de recalc sin regla (C4-02)** |
| E-20 (extra, fuera de §4.1) | pedido (E-19 ✓) | pago registrado | precedencia declarada (§4.3, define:84) pero **sin enforcement** (bloquea/advierte + quién lo salta) = §7 #2 | compras | VACÍO (P2-2) | **No ejecutable hasta §7 #2 (C4-05)** |
| E-24 (extra, fuera de §4.1) | `armado` ✓ | `verificado` (E-24 ✓, discover:83) | Sí: veredicto del verificador único (I-035); guard de instalación declarado en §5 (define:103) | verificador único designado | E-54 → vuelve a taller (inventario); recalc no declarado (C4-02) | **Determinista; falta fila propia en §4.1 (C4-08)** |

**Respuesta a la pregunta rectora:** la máquina de estados NO es deseo — los 4 gates tienen guard expresable y disparador asignado, y los caminos felices son deterministas. Pero **no es 100% implementable todavía**: 2 zonas no deterministas (E-33 positivo, E-54) y 2 gates con rama negativa bloqueada por decisión de negocio (E-20, E-21), más 1 estado de salida sin nombre (E-21).

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Gate/transición afectado | Fuente (archivo:línea) |
|---|---|---|---|---|
| C4-01 | REFORZAR_FRONTERA | El guard de E-33 ("ninguna fecha se recalcula sin causa") no declara el camino positivo: E-59 desenlace feliz adelanta la instalación sin ruta por E-33 y la taxonomía {interno/externo/cambio de contrato} no tiene clase "positiva"; la rama negativa "causa interna → E-35 se reducen" castigaría el éxito. | E-33, E-59, E-35 | define:76; discover:112; panorama:25 |
| C4-02 | REFORZAR_FRONTERA | E-54 no declara set de back-edges ni granularidad: inventario dice "proyecto: vuelve a la etapa anterior" (nivel proyecto) vs. mapa "devolver un módulo al taller" (nivel módulo); y el recalc tras rechazo es asimétrico (E-18 declara recalc, E-24/E-25 no). Disparador "quien ejecuta la etapa" ambiguo. | E-54, E-18, E-24, E-25 | discover:84; define:73; mapa:444; panorama:21 |
| C4-03 | CORRECCION | E-21 no tiene transición de estado discreta: "pasa a control total del subsistema desarrollo-taller" es prosa; la máquina necesita un estado nombrado (ej. `recibido_verificado`) entre `aprobado_compras` y `armado` para que el borde sea determinista y la precondición de E-22 concreta. | E-21, E-22 | discover:74,81 |
| C4-04 | DECISION_PENDIENTE | Rama negativa de E-21 VACÍO (P2-3): material mal recibido → sin transición de escape; guard fallido deja el proyecto atascado. El Define la marcó VACÍO (§6), no la resolvió. | E-21 | define:74; panorama:93 |
| C4-05 | DECISION_PENDIENTE | E-20 gate de caja: declarado como precedencia (§4.3) pero no como guard de enforcement; bloquea/advierte + autoridad de salto = §7 #2. P4-F3 "ni el dueño lo salta" NO se materializa para el dinero; la pregunta "¿quién lo salta?" es la rendija. | E-20, E-43 | define:84,123,135; panorama:111 |
| C4-06 | CORRECCION | E-23 destinatario del push ambiguo: inventario "empuja hacia Comercial" vs. Define "Taller → Calidad"; debe reconciliarse como "al rol verificador asignado por despacho (I-035)" para no errar si el verificador es el gerente. | E-23 | discover:82; define:75; loop:39 |
| C4-07 | REFORZAR_FRONTERA | El guard de E-18 (veredicto del verificador) no pin de versión de schema: sin referencia a la versión aprobada, una edición post-aprobación invalida silenciosamente el check (traza a P2-8/P6-07, no resuelto por el Define). | E-18, E-17, E-38 | discover:66; panorama:91; cierre:24 |
| C4-08 | OK_CON_DOC | E-24 (veredicto pre-despacho, `armado → verificado`) es gate real con verificador (I-035) y guard de instalación (§5) pero no tiene fila en la tabla de enforcement §4.1; su rama negativa (rechazo → E-54) solo vive en el inventario. Implementable; falta completitud declarativa. | E-24, E-25 | define:42,75,103; discover:83 |
| C4-09 | REFORZAR_FRONTERA | §3 lista roles sin "compras" ni "taller", que §4.1 usa como dueños de E-18/E-21; los guards son state-based (ejecutables) pero la autorización de E-19/E-20/E-21 necesita mapear contexto→rol (ej. compras=desarrollador proxy, P4-F10); expone autoverificación en E-21 #1 (mismo actor que creó la OC). | §3, E-19, E-20, E-21 | define:53-59,71-76; panorama:116; discover:72 |
| C4-10 | OK_CON_DOC | Corrección P5-09 (§4.2): la lista "aprobación → compras → ensamblaje → instalación" es consistente con el mapa (aprobación = única causa válida de compra, mapa:147) y con el inventario (E-18 precede E-19); NO introduce contradicción. Deja 2 cabos: (a) qué línea del cronograma doble lista "aprobación" (interna vs. contractual), (b) fuentes desactualizadas (mapa:253, cierre:85, discover:57) hasta el loop focalizado ya planificado. | E-14, E-18, E-19 | define:80; mapa:147,253; cierre:85; discover:57 |
| C4-11 | DECISION_PENDIENTE | El recalc tras rechazo de E-18 necesita causa clasificada por el clasificador de E-33, cuyo actor (gerente o comercial) está sin asignar (§7 #1); sin actor, el recalc queda bloqueado o con default implícito no auditable. | E-18, E-33, E-35 | define:76,134; panorama:112 |
| C4-12 | REFORZAR_FRONTERA | "El gerente hace todo" (P4-F3): el Define lo resolvió en la práctica SOLO para la verificación (E-18/E-24, verificador I-035). No para el dinero (E-20, §7 #2), no para el clasificador (E-33, §7 #1), no para la captura de documentación (E-41, VACÍO P4-F8). En esas zonas sigue siendo declaración, no enforcement. | E-20, E-33, E-41 | define:46,128,134,135; panorama:111,123 |

---

## Notas para el Orquestador / Define

**Lo que es ejecutable (decirlo sin forzar):** los 4 guards de §4.1 son condiciones expresables y sus disparadores están asignados a roles tipados; el modelo rol-vs-persona (§3) es suficiente para los guards de autorización de E-18/E-24/E-21 — la asignación comercial=diseñador NO genera ningún guard imposible (los guards evalúan contra rol). Los caminos felices de E-18, E-21, E-23 y E-33 son deterministas y construibles.

**Lo que bloquea el enforcement como máquina completa (estructural, no parámetro — no se puede diferir a "config"):
1. C4-01 (E-33 camino positivo): el adelanto por E-59 debe declararse como cambio de cronograma SANCIÓNADO (exento del guard de causa, o con clase "positiva" que NO dispare la rama E-35 de reducción). Es el único caso donde el guard escrito castigaría el comportamiento deseado.
2. C4-02 (E-54): hay que declarar el set de back-edges (qué rechazo vuelve a qué estado), la granularidad (proyecto vs. módulo — el mapa manda "módulo", el inventario dice "proyecto") y si todo rechazo recalcula cronograma con causa interna. Sin esto, el reproceso tiene dos caminos válidos sin regla.
3. C4-03 (E-21): el estado de salida de E-21 debe tener nombre en la máquina (ej. `recibido_verificado`) antes del loop 2 de schema.

**Lo que es decisión de negocio ya abierta (no es del Define técnico):** C4-04 (consecuencia de material mal recibido, P2-3), C4-05 (E-20 bloquea o advierte + quién lo salta, P2-2), C4-11 (actor clasificador de E-33, P4-F2), C4-12 (rol de captura de E-41, P4-F8). Para no dejar "el gerente hace todo" en el dinero, el default recomendable es **bloquear con override auditable por rol gerente** (materializa A3 sin inventar regla); eso cierra la rendija de P4-F3 sin esperar la respuesta de "¿quién lo salta?".

**Recomendaciones menores:** C4-06 (reconciliar el destinatario del push de E-23 como "rol verificador asignado"), C4-07 (pin de versión en el guard de E-18 — traza a P2-8), C4-08 (agregar fila E-20/E-24 a la tabla §4.1 o declarar explícitamente dónde viven), C4-09 (mapa de contexto→rol para compras/taller antes del schema de permisos).

**C4-10 (P5-09):** la corrección es correcta y NO introduce contradicción. Al aplicarla vía loop focalizado, actualizar las tres fuentes (mapa:253, cierre:85, discover:57) y decidir si "aprobación" es etapa de la línea interna o también de la contractual — es el único cabo abierto de la corrección.

**Checkpoint:** se dispara. Dos gates no son deterministas como escritos (E-33 camino positivo, E-54 ramas negativas) y uno tiene estado de salida sin nombre (E-21). No es deseo — pero la máquina no está lista para loop 2 sin cerrar C4-01, C4-02 y C4-03.
