# Pasada C1 — Cohesión de contextos (subagente, loop de 3 pasadas)

**Lente:** cada bounded context de la tabla §2 del Define. Pregunta rectora: ¿es internamente cohesivo (lenguaje ubicuo único, modelo de datos propio, un motivo de cambio) o es un cajón de sastre?

**Fuentes leídas:** `diamante2_define_eventos.md` (unidad a auditar), `diamante2_discover_eventos.md` (inventario 61 eventos), `diamante2_panorama_consolidado.md` (P2-P8), `cierre_diamante.md`, `logica_de_negocio.md`, `loop2_y_retroalimentacion.md` (A1-A12).

---

## Iteración 1 (bruta)

Barrido de los 15 contextos con la pregunta de cohesión, sin filtrar:

1. **Comercial/Cotizador (15 eventos)** — dos vocabularios visibles: (a) ciclo de vida del lead (lead, calificado, descartado, redirigido, no_show, SLA) con entidad *lead* (E-01..E-04, E-46, E-49, E-50, E-51) y (b) mundo de la cotización (borrador, en_revision, cotizado, diseño 3D) con entidad *proyecto* (E-05, E-09, E-10, E-11, E-48). ¿Dos motivos de cambio? ¿El SLA E-50 (temporizador del sistema) pertenece acá o al consumidor? ¿E-48 (diseño 3D) es de Comercial o de un contexto "diseño"?
2. **Finanzas/Compensación (12 eventos)** — dos vocabularios visibles: (a) cobros/caja (obligación, cobro, atraso, deducción, dinero disponible, arriendos: E-27..E-30, E-43, E-56, E-57) y (b) compensación a socios (compensación, comisión, micro cuenta de cobro, cuenta por socio: E-08, E-31, E-32, E-35, E-58). ¿Cajón de sastre? ¿E-35 (cálculo de comisiones según cumplimiento) es de Finanzas o de Control de cronograma, que es quien produce la causa (E-33)?
3. **Control de cronograma (6)** — E-60 (comunicación frontstage) habla el lenguaje de Comercial (cliente, progreso visible), no el de cronograma (desfase, causa, holgura). ¿Está mal asignado?
4. **Contratos (4)** — E-53 (cuestionario de viajes) se captura al firmar (Contratos) pero su consumidor es el motor de cronograma (Define §1); ¿el evento de consumo existe o es campo muerto?
5. **Desarrollo (4)** — E-54 (reproceso) es la rama negativa de E-18 (Desarrollo) pero también de E-24 (Calidad) y E-25 (Entrega); Desarrollo absorbe vocabulario de fallo de otros contextos.
6. **Compras (4)** — E-20 (pago a proveedor) nace un *movimiento financiero* (discover:73), y el precedente E-08 dice que "el movimiento financiero nace en Finanzas" (define:107). Asimetría no declarada: ¿el pago a proveedor es de Compras o de Finanzas?
7. **Marketing/Demanda (3)** — E-40 (conversión Google Ads), E-42 (medición de embudo), E-55 (testimonio curado) son tres cosas distintas: una integración externa, una capa de lectura, un activo de reputación. ¿Un solo motivo (palanca de demanda) alcanza? E-42 vs. E-47 (Gobierno): ambos leen datos de otros contextos.
8. **Gobierno/Medición (1)** — E-47: contexto de un solo evento, capa de lectura. Trivialmente cohesivo, pero su frontera con E-42 (Marketing) es borrosa.
9. **Tienda web (1)** — E-44: contexto de un evento, su enganche cruza a Desarrollo/Compras/Taller (mismo pipeline). Cohesivo por deferimiento.
10. **Taller/Armado (1)** — E-22 solo frontera (capa 2 diferida). Cohesivo por deferimiento.
11. **Calidad (2)** — E-23/E-24: citación + veredicto. Un solo lenguaje (verificación). Cohesivo.
12. **Entrega (2)** — E-25/E-26: instalación + acta. Cohesivo.
13. **Garantía (3)** — E-36/E-37/E-61: agenda → completitud → orden. Un solo lenguaje (orden de garantía). Cohesivo.
14. **Documentación (1)** — E-41: disparador catch-all (P4-F8 VACÍO), transversal por diseño.
15. **Integraciones (2)** — E-38/E-39: schema→modelo→corte. Un lenguaje (producción). Cohesivo.

Candidatos crudos: PARTIR Comercial (embudo vs. cotizador), PARTIR Finanzas (cobros vs. compensación), MOVER E-60 a Comercial, MOVER E-35 a Control de cronograma, MOVER E-20 a Finanzas, mover E-54 a un contexto de "reproceso".

---

## Iteración 2 (autocrítica)

**Lo que cae (y por qué):**

- **PARTIR Comercial en embudo + cotizador: CAE.** E-51 materializa que lead→cliente es el MISMO registro, no dos entidades (discover:48, P3-01 en panorama:130). El presupuesto preliminar E-05 crea `proyecto: borrador` dentro del embudo (discover:37), o sea la entidad *proyecto* nace en el embudo y se muta en el cotizador — partir exigiría compartir la entidad entre dos contextos, peor que mantenerla. Y el rol que los conduce es uno (comercial = diseñador, P4-F1/P4-F5, panorama:110/114). El motivo es único: conseguir y cotizar clientes. Mantenerlo es cohesivo; el §2 debería declarar la identidad compartida para no repartirlo en loop 2.
- **PARTIR Finanzas en cobros + compensación: CAE.** E-08 es simultáneamente cobro del cliente Y compensación del diseñador ("no es ingreso general de la empresa, es la compensación", logica:137); E-30 (deducción del diseño 3D) cruza ambos lados; E-32 (micro cuentas) son vistas por-socio de los mismos movimientos. La raíz es una (dinero / movimientos_financieros) — partir cortaría el ledger por la mitad. Mantenerlo es cohesivo.
- **MOVER E-60 a Comercial: CAE, con matiz de documentación.** El contenido del frontstage (progreso, adelanto, único cambio visible = positivo) solo lo conoce el cronograma (I-034, logica:250); el canal hacia el cliente es de Comercial. El Define ya declara la interfaz "Control de cronograma → Comercial · E-60" (define:105). La asignación (cronograma produce, comercial entrega) es coherente; queda implícito el doble dueño (disparador "sistema/comercial" en discover:114).
- **MOVER E-35 a Control de cronograma: CAE.** Es una regla de compensación ejecutada en cierre de período (discover:116); el cronograma provee el input (causa de E-33). A6 ya lo fija: "Es un input de Finanzas, no de calendario" (loop2:50). Cohesivo en Finanzas (familia compensación). Pero su disparador no es solo E-33: E-59 (check de 15 días) también reduce comisiones (logica:251) y la tabla §5 solo declara E-33→E-35 — interfaz incompleta.
- **MOVER E-20 a Finanzas: se debilita a REFORZAR_FRONTERA.** El pago a proveedor es el acto de compra (OC, proveedor, prioridad materiales→arriendos→nóminas), y el gate de caja E-43 ya es el guard desde Finanzas (define:104). Tenerlo en Compras es defendible. El problema no es el hogar sino la asimetría no documentada con E-08: para E-08 el Define declara "el movimiento nace en Finanzas" (define:107); para E-20 no declara quién registra el movimiento financiero. Si la decisión es simetría total, mover E-20 a Finanzas SÍ cambiaría frontera (checkpoint); si es "Compras paga, Finanzas lleva el saldo", solo falta documentarlo.
- **E-54: sobrevive como REFORZAR_FRONTERA (debilidad real).** El reproceso es un lenguaje de fallo compartido por Calidad (E-24) y Entrega (E-25) alojado en Desarrollo. No es cajón de Desarrollo, pero la rama negativa multi-contexto no tiene dueño declarado (la de E-21 sigue VACÍO, define:74/§6).

**Lo que se me escapó en la pasada 1:**

- **E-42 (Marketing) vs. E-47 (Gobierno):** dos capas de lectura que consumen datos de terceros (discover:118,119). Frontera "métricas de demanda" vs. "KPIs operativos" borrosa — pero ambos contextos están diferidos (define:150), no bloquea.
- **E-53 (Contratos):** el consumo por el motor de cronograma está declarado en el Define §1 (define:18) pero no hay evento de frontera tipado (la interfaz Contratos→Cronograma declarada es E-13/E-14, define:98). Riesgo de campo muerto (ya advertido en discover:56). Es más frontera que cohesión → lo dejo como nota para C2, no fuerza un hallazgo C1.
- **E-50 (SLA):** el temporizador es infraestructura del loop 2, no un subdominio; el evento mide el compromiso del comercial y su escalación es decisión pendiente ya listada (§6 y §7.3, define:119/136). No es problema de cohesión: lo marco DIFERIDO y paso.

**Regla de escepticismo aplicada:** no inventé un contexto "Reprocesos" ni moví E-20 por simetría — ambas serían decisiones de negocio/arquitectura que el Define no tomó; solo las señalo.

---

## Iteración 3 (refinamiento final)

Depurados, sobreviven **7 hallazgos** (ninguno mueve un contexto ni pide subdivisión; tres refuerzan fronteras, uno es interfaz incompleta, dos son documentación, uno diferido):

1. **C1-01 (OK_CON_DOC)** — Comercial/Cotizador: cohesivo por identidad única y rol único; no es cajón; el §2 debe declarar que embudo y cotizador comparten la entidad lead→cliente→proyecto.
2. **C1-02 (DIFERIDO)** — SLA E-50: temporizador = infra; pertenece a Comercial; ventana/escalación ya son VACÍO/decisión pendiente. No cambia cohesión.
3. **C1-03 (REFORZAR_FRONTERA)** — Finanzas: cohesivo (cobros + compensación = una raíz de dinero); pero E-20 (Compras) nace un movimiento financiero sin la declaración de frontera que SÍ tiene E-08 → asimetría Compras↔Finanzas no documentada.
4. **C1-04 (REFORZAR_FRONTERA)** — E-35 en Finanzas es correcto; falta declarar E-59→E-35 (reducción de comisiones por check de 15 días) en la tabla de interfaces §5.
5. **C1-05 (OK_CON_DOC)** — E-60 frontstage: cronograma produce, Comercial entrega; §5 ya lo declara; falta explicitarlo como contrato (doble dueño implícito).
6. **C1-06 (REFORZAR_FRONTERA)** — E-54 reproceso en Desarrollo absorbe las ramas negativas de E-24 (Calidad) y E-25 (Entrega); dueño de la rama negativa multi-contexto ambiguo.
7. **C1-07 (DIFERIDO)** — Marketing/Demanda: E-42 (lectura) vs. Gobierno E-47 (lectura) tienen frontera borrosa y E-55 se dispara desde E-26 (Entrega) sin contrato declarado; todo diferido con el backlog t-034.

**Pregunta rectora — respuesta explícita:** en los 15 contextos no hay cajón de sastre que pida subdivisión. Comercial (15) y Finanzas (12) se sostienen como un solo contexto por identidad evolutiva (lead→cliente) y raíz de dinero (movimientos_financieros) respectivamente. Los tres hallazgos de frontera (C1-03, C1-04, C1-06) son ambigüedades de dueño/documentación, no reasignaciones.

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Contexto(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| C1-01 | OK_CON_DOC | Comercial/Cotizador (15) NO es cajón: embudo de leads y cotización comparten la entidad evolutiva lead→cliente→proyecto (E-51, mismo registro) y el mismo rol (comercial=diseñador). PARTIR cortaría la transición de identidad. Recomendación: §2 debe declarar la identidad compartida para que el loop 2 no los reparta. | Comercial/Cotizador | define:33,49; discover:48 (E-51); panorama:130 (P3-01); cierre:49 |
| C1-02 | DIFERIDO | SLA de primera respuesta E-50: el temporizador es infraestructura del loop 2, no un subdominio; el evento mide el compromiso del comercial → vive en Comercial. Ventana y escalación ya son VACÍO (§6) y decisión del Supervisor (§7.3). No hay problema de cohesión ni se mueve nada. | Comercial/Cotizador | discover:34 (E-50); define:119,136 |
| C1-03 | REFORZAR_FRONTERA | Finanzas (12) NO es cajón: cobros al cliente y compensación a socios comparten la raíz dinero (E-08 es a la vez cobro del cliente y compensación del diseñador; E-30 los cruza; E-32 son vistas por-socio del mismo ledger). PERO E-20 (pago a proveedor, en Compras) nace un *movimiento financiero* y el precedente E-08 ("el movimiento nace en Finanzas") no se aplica simétricamente: la frontera Compras↔Finanzas no declara quién registra el movimiento. | Finanzas/Compensación, Compras | define:40,45,104,107; discover:73 (E-20); cierre:58 |
| C1-04 | REFORZAR_FRONTERA | E-35 (comisiones según cumplimiento) en Finanzas es correcto (regla de compensación al cierre de período; input = causa de E-33, A6). Pero E-59 (check de 15 días) también dispara reducción de comisiones (I-025) y la tabla de interfaces §5 solo declara E-33→E-35: falta declarar E-59→E-35. | Finanzas, Control de cronograma | define:45,99,105; discover:112 (E-59),116 (E-35); logica:251 (I-025); loop2:50 (A6) |
| C1-05 | OK_CON_DOC | E-60 comunicación frontstage: el dato (progreso contractual, único cambio visible = positivo) solo lo conoce el cronograma (I-034); el canal hacia el cliente es de Comercial. §5 ya declara la interfaz Cronograma→Comercial. No se mueve. Doc: el contrato debe explicitar "cronograma produce, comercial entrega" (hoy el disparador "sistema/comercial" deja el doble dueño implícito). | Control de cronograma, Comercial | define:38,105; discover:114 (E-60); logica:250 (I-034) |
| C1-06 | REFORZAR_FRONTERA | E-54 (reproceso) está alojado en Desarrollo pero es la rama negativa de E-18 (Desarrollo), E-24 (Calidad) y E-25 (Entrega): Desarrollo absorbe vocabulario de fallo de otros contextos. Dueño de la rama negativa multi-contexto ambiguo (la de E-21 sigue VACÍO en §6). | Desarrollo, Calidad, Entrega | define:39,46,74; discover:84 (E-54); panorama:93 (P2-3) |
| C1-07 | DIFERIDO | Marketing/Demanda (E-42 medición de embudo) y Gobierno/Medición (E-47 KPIs) son dos capas de lectura de datos de otros contextos con frontera borrosa (métricas de demanda vs. KPIs operativos); E-55 (testimonio) se dispara desde E-26 (Entrega) sin contrato de frontera declarado. Ambos contextos están diferidos al backlog t-034: no bloquea la convergencia. | Marketing/Demanda, Gobierno/Medición, Entrega | define:34,36,150; discover:92 (E-55),118 (E-42),119 (E-47) |

---

## Notas para el Orquestador / Define

1. **Veredicto de cohesión: la convergencia es estable desde la lente C1.** No hay `PARTIR_CONTEXTO` ni `MOVER_CONTEXTO` entre los 15. Comercial (15) y Finanzas (12) — los dos sospechosos por tamaño — se sostienen por identidad evolutiva (E-51, P3-01) y por raíz de dinero (movimientos_financieros). El lenguaje ubicuo se conserva contexto por contexto; los únicos vocabularios "extranjeros" (E-60 en cronograma, E-54 en Desarrollo, E-08/E-35 en Finanzas) son eventos de frontera que el Define ya declaró o que se refuerzan abajo.
2. **Los 3 hallazgos de frontera (C1-03, C1-04, C1-06) NO mueven frontera por sí mismos — la refuerzan.** C1-04 y C1-06 se resuelven completando la tabla §5 (declarar E-59→E-35) y declarando el dueño de la rama negativa (E-54), sin checkpoint.
3. **C1-03 es el único con potencial de mover frontera.** Si el Orquestador decide que E-20 debe trasladarse a Finanzas (simetría total con E-08), eso SÍ cambia una frontera → **checkpoint del Supervisor** (regla 5 de la metodología). Si en cambio decide "Compras paga y registra; Finanzas lleva el saldo vía E-43", solo falta documentarlo como nota de frontera análoga a la de E-08 (define:107) — sin checkpoint. Es decisión del Define/Orquestador, no mía.
4. **Para el loop 2 de diseño:** (a) §2 debe declarar la identidad compartida lead→cliente→proyecto en Comercial (C1-01); (b) el contrato de E-60 debe fijar "cronograma produce, comercial entrega" (C1-05); (c) el temporizador de E-50 es infra, no subdominio (C1-02); (d) verificar el consumo de E-53 por el motor de cronograma (riesgo de campo muerto) — lo dejo acá como nota; probablemente lo recoja C2/C3.
5. **Anti-duplicación:** los problemas de P2-P8 que el Define ya resolvió (P3-01 identidad lead→cliente, P4-F1 rol diseñador, P2-9 SLA sin consecuencia, P2-2 gate de caja, P2-3 rama negativa E-21) fueron validados como resueltos, no re-reportados. Lo que C1 agrega son las consecuencias de cohesión/frontera de esas resoluciones (asimetría E-08/E-20, tabla §5 incompleta, dueño de E-54).
