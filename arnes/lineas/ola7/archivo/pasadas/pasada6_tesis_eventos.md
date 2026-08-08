# Pasada P6 — Tesis ↔ eventos (subagente, loop de 3 pasadas)

**Lente:** la FINALIDAD como unidad. Cruce inverso por cada tesis, invariante y bounded context del cierre (`cierre_diamante.md`) contra el inventario de 47 eventos (`diamante2_discover_eventos.md`). Pregunta rectora: ¿qué evento materializa cada elemento aprobado?

**Fuentes leídas:** `diamante2_discover_eventos.md` (47 eventos), `diamante2_loop_apertura.md` (para no repetir), `cierre_diamante.md` (fuente principal), `logica_de_negocio.md` (mapa maestro), `marco_estrategia_mercado.md` (H1-H8).

---

## Iteración 1 (bruta)

Cruce completo tesis/tesis-elemento → evento(s). Sin filtrar nada.

### A. Tesis (§1, `cierre_diamante.md:11`) — "schema (programado, verificable, versionable, auditable) ↔ control (gobierna e incentiva)"

| Propiedad de la tesis | Eventos que la materializan | Lectura bruta |
|---|---|---|
| schema **programado** | E-14 (cronograma fijado en contrato) | ✅ cubierto |
| schema **verificable** | E-18 (check de schema), E-21 (triple verificación), E-23 (citación), E-24 (calidad) | ✅ cubierto |
| schema **versionable** | E-10 (versión ajustada de cotización), E-16 (cambio de contrato), E-33 (recalculo con causa) | ⚠ parcial: no hay evento explícito de *versionado del schema de desarrollo* (E-17); solo versiones de cotización/contrato |
| schema **auditable** | E-33 (causa estructurada auditable), E-41 (documentación) | ✅ cubierto |
| control gobierna e incentiva | E-14 (fijar), E-33 (mover con causa), E-35 (comisiones según cumplimiento), E-34 (SLA) | ✅ cubierto |
| simbiosis schema↔control | E-18 (schema verificado antes de comprar) + E-33 (control sobre lo definido) | ✅ cubierto |

### B. Invariantes (§2, `cierre_diamante.md:17-24`)

| Invariante | Eventos | Lectura bruta |
|---|---|---|
| 1. Roles-no-personas, todos-socios | E-31 (compensación por rol), E-32 (micro cuenta por socio), E-18/E-24 (verificador por rol) | ✅ cubierto |
| 2. El log es la acción | E-21 (marcar recepción = la recepción), E-24 (veredicto), E-07 (visita deja dato), E-33 (causa) | ✅ cubierto |
| 3. Cronograma inmutable desde el contrato | E-14, E-33 | ✅ cubierto (refuerzo A-7 ya en loop 1) |
| 4. Calendario por rol, no público | E-23 (push a Comercial), E-14/E-33/E-35 (si llevan dimensión por rol) | ⚠ AGUJERO parcial: ningún evento declara la vista por rol; "cada socio ve su línea temporal" no tiene evento propio |
| 5. Dos capas, solo capa 1 | E-22 (capa 2 diferida), E-23 (frontera capa 1) | ✅ cubierto |
| 6. No acumular deuda | E-20 (pago por prioridad), E-43 (lectura de caja), E-28/E-29 (cobro), E-30 (deducción) | ✅ cubierto |
| 7. Aprobación = check de schema | E-18 | ✅ cubierto |
| 8. Schema ES el definidor | E-17 (BOM/desarrollo), E-38/E-39 (integración al modelo 3D), E-18 | ✅ cubierto |

### C. Bounded contexts (§4, `cierre_diamante.md:47-61`)

13 contextos del cierre. Resultado del cruce:

- 11 contextos → eventos presentes (Comercial→E-01..E-11/E-46, Control→E-14/E-33/E-35/E-34, Contratos→E-12/E-13/E-16, Desarrollo→E-15..E-18/E-38, Compras→E-19/E-20/E-21, Taller/Armado→E-22, Calidad→E-23/E-24/E-21, Entrega→E-25/E-26, Garantía→E-36/E-37, Finanzas→E-27..E-32, Documentación→E-41, Integraciones→E-38/E-39).
- **4 eventos sin contexto declarado en el cierre:** E-40 (conversión → Google Ads) y E-42 (medición de embudo) → no existe contexto Marketing/Captación; E-44 (pedido de tienda → producción) → no existe contexto Tienda; E-47 (KPIs operativos) → no existe contexto de métricas/KPI.
- **E-45 (reposición de herramientas):** el cierre solo tiene "Taller/Armado (capa 2)"; el contexto Taller/Herramientas con reposición vive en `logica_de_negocio.md` Parte II (§[Diseño] Taller/Herramientas), no en el cierre.

### D. Tesis de capacidad (§5, `cierre_diamante.md:70-79`) — ~1 proyecto/semana, ratio 4:1 demanda/fábrica

- Embudo completo de captación → E-01..E-11 materializan la entrada de demanda; E-42 mide los saltos; E-47 mide ≥1 proyecto vendido/semana; E-40 cierra el loop a Ads. La maquinaria existe.
- **Discrepancia detectada:** E-47 dice "entrega en ~15-20 días de la venta" (`diamante2_discover_eventos.md:125`, fuente `logica_de_negocio.md:169`), pero el modelo temporal aprobado dice "2 ciclos de 15 días → 30 días ≈ 4 semanas ideal" (`cierre_diamante.md:79`, `logica_de_negocio.md:256`). Dos metas de cadencia distintas para el mismo ciclo de entrega.
- **Precondición de medición:** los 4 eventos que hoy no producen dato (E-03, E-07, E-40, E-42 — nota 3 del discover) son exactamente los que hacen verificable el ratio 4:1 y la cadencia. Sin ellos, la tesis de capacidad no se puede validar.

### E. Palanca de demanda (H1-H8, `marco_estrategia_mercado.md`)

| Palanca | Evento ancla | Lectura bruta |
|---|---|---|
| H1 (score muerto) | E-03 | ✅ |
| H2 (gclid perdido) | E-40 | ✅ (refuerzo A-6 loop 1) |
| H3 (embudo no medible) | E-42 | ✅ |
| H4 (visita sin dato) | E-07 | ✅ |
| H5 (cero analytics) | E-42 (solo tramo "impresión → clic") | ⚠ parcial: el tag que H5 exige no tiene evento; E-42 solo cita H3 como fuente |
| H6 (NAP incompleto) | E-01 (leads de SEO local entran al embudo) | ✅ indirecto |
| H7 (prueba social perdida) | — | ⚠ AGUJERO: ningún evento del inventario captura testimonio/reseña |
| H8 (CTA WhatsApp) | E-01 (canal WhatsApp), E-02 | ✅ |

### F. Escaneo de ruido (evento sin ancla en tesis/invariante)

- Los 47 eventos tienen ancla en alguna fuente (cierre, mapa, marco). **No hay ruido puro.**
- Matiz: E-40/E-42/E-44/E-47 anclan al marco y al mapa, **no al cierre** — son eventos legítimos cuya tesis no está en el cierre aprobado (ver C). E-45 ancla solo a la Parte II del mapa.
- Nota: el discover declaró como fuentes solo H1-H4 (`diamante2_discover_eventos.md:11`); H5-H8 llegaron después (destilación). La palanca de demanda del inventario está parcialmente congelada en H1-H4.

### G. Momentos de verdad (§7) y decisiones (§8)

- 6 momentos de verdad → E-02, E-09, E-13, E-15, E-26, E-36. ✅ todos cubiertos.
- 7 decisiones → E-08 ($130k DIAN), E-31/E-32 (socios), E-22/E-23 (2 capas), E-33 (inmutable), E-21/E-24 (log-es-acción), E-18 (check de schema), E-20/E-43 (no deuda). ✅ todas cubiertas.
- §9 trabajo abierto → E-31 (V-2/V-3), E-41 (VETA_ERP), E-32 (micro cuentas). ✅ todos anclados.

---

## Iteración 2 (autocrítica)

### Lo que CAE (descartado en esta pasada)

- **E-16 → E-33 (vínculo de cambio de contrato hacia recalculo de cronograma):** lo pensé en la pasada 1, pero el mapa solo dice que el ajuste contractual corre en paralelo y no bloquea (`logica_de_negocio.md:530`); el impacto en fechas no está documentado. Trazar ese vínculo sería **inventar una regla**. Descartado.
- **"Reunión post-desarrollo" como evento faltante:** ya es E-18 (check de schema), no hay hueco. Descartado.
- **Bienestar / horas (E-47):** ya cubierto por loop apertura A-5 + V-5. Descartado (no duplicar).
- **"2 ciclos de 15 días" como estructura faltante:** materializada por E-14. El hallazgo real no es la estructura, es la discrepancia de la meta (ver P6-02). Descartado como estructura.
- **Momentos de verdad y decisiones §8:** todos cubiertos en pasada 1. Sin hallazgo.
- **Capacitaciones del diseñador:** DIFERIDO declarado en loop 1 (B-5). No duplicar.
- **Cruce de H6/H8:** anclan indirecto a E-01/E-02; no fuerzo eventos nuevos. Sin hallazgo.

### YA LOOP 1 (marcados, no repetir)

A-4 (E-06 agendamiento híbrido), A-6 (E-40 dos caminos de conversión), A-7 (inmutabilidad E-14/E-33), B-4 (parámetros sin número en E-31), D-4 (E-08→E-30). Todos verificados y **no duplicados** acá.

### Lo que se ESCAPÓ en la pasada 1 (apareció al releer con el lente)

1. La discrepancia **15-20 días (E-47) vs 30 días ≈ 4 semanas (cierre §5)** — la primera pasada leí E-47 como "ciclo de entrega" sin cruzar contra el modelo temporal. Es una contradicción de finalidad real: el KPI que mide la cadencia no coincide con el cronograma que la produce.
2. **H5 y H7 no tienen ancla** porque el discover solo citó H1-H4 como fuentes (`diamante2_discover_eventos.md:11`). Es un hueco de trazabilidad de la palanca, no un evento que falte por descuido del inventario.
3. **Los 4 eventos de medición (E-03/E-07/E-40/E-42) como precondición de la tesis de capacidad** — la nota 3 del discover los llama "precondición de la palanca", pero el lente de finalidad los conecta además con la tesis §5: sin ellos no hay forma de verificar el ratio 4:1 ni la cadencia de ~1 proy/semana.
4. **E-45 sin contexto en el cierre** — la pasada 1 lo dio por anclado al mapa y no noté que el cierre §4 no tiene "Taller/Herramientas".
5. La **dimensión por rol** como hilo transversal (invariante 4 + Q13): al cruzar los 13 contextos, la "vista por socio" aparece dos veces (calendario y transparencia de compras) y ninguna tiene evento propio.

---

## Iteración 3 (refinamiento final)

Depurados a 8 hallazgos. Clasificación: 7 REFUERZO, 1 ADICIÓN. **Cero ruido** en el inventario: los 47 eventos tienen ancla, pero 5 de ellos (E-40/E-42/E-44/E-45/E-47) anclan fuera del cierre aprobado y su hogar de contexto es decisión abierta del Define.

1. **P6-01 — Visibilidad por rol/socio sin evento propio** (invariante 4 + Q13): la vista "cada socio ve su línea temporal" y la "transparencia de compras como contrato de confianza entre socios" son read-models transversales sin evento que los declare. Solo se sostienen si E-14/E-33/E-35 (cronograma) y E-20/E-43 (compras/caja) llevan la dimensión por rol.
2. **P6-02 — Meta de cadencia contradictoria:** E-47 (15-20 días) vs modelo temporal aprobado (30 días ≈ 4 semanas ideal; hoy 6.5). El KPI que mide la tesis de capacidad no coincide con el cronograma que la produce (E-14).
3. **P6-03 — 4 eventos sin contexto en el cierre §4:** E-40/E-42 (no existe Marketing/Captación), E-44 (no existe Tienda), E-47 (no existe contexto de KPIs). La tabla de bounded contexts aprobada no cubre la palanca de demanda ni la línea de tienda.
4. **P6-04 — E-45 sin contexto en el cierre:** el único evento cuyo hogar (Taller/Herramientas) vive en la Parte II del mapa, no en el cierre.
5. **P6-05 — La medición es precondición de la tesis de capacidad:** E-03/E-07/E-40/E-42 no producen dato hoy; H5 (tag de analítica) solo está parcialmente cubierto por E-42. Sin esos cinco, el ratio 4:1 y ~1 proy/semana son inverificables — no es analytics opcional.
6. **P6-06 — H7 (prueba social) sin evento:** el inventario no captura testimonio/reseña; el dato existió en legacy (tabla `testimonios`). Candidato a evento de post-entrega (frontera Entrega/Garantía) o contenido-solo — decisión del Define, no invento la regla.
7. **P6-07 — "Versionable" de la tesis sin evento explícito:** solo se materializa a nivel cotización (E-10) y contrato (E-16); el versionado del schema de desarrollo (E-17) no tiene evento propio.
8. **P6-08 — Estimación pre-contrato f(valor, módulos) sin evento:** declarada en el mapa y el cierre (§5, "estimar antes de contratar"), solo se materializa al fijar E-14. Falta decidir si la proyección vive en la cotización (E-05..E-11) o solo en el contrato.

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Evento(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| P6-01 | REFUERZO | Visibilidad por rol/socio (calendario por rol + transparencia de compras a socios) sin evento propio; debe llevarse como dimensión transversal de los eventos de cronograma y compras | E-14, E-33, E-35, E-20, E-43 | cierre_diamante.md:20 (invariante 4), :53 (Q13); diamante2_discover_eventos.md:49,99,101,65,124 |
| P6-02 | REFUERZO | Meta de cadencia contradictoria: E-47 "15-20 días de la venta" vs modelo temporal aprobado "30 días ≈ 4 semanas ideal" (y hoy 6.5); unificar antes de modelar | E-47, E-14 | diamante2_discover_eventos.md:125; cierre_diamante.md:79; logica_de_negocio.md:169,256 |
| P6-03 | REFUERZO | 4 eventos del inventario sin bounded context en el cierre §4 (no existen Marketing/Captación, Tienda ni KPIs); la tabla de contextos aprobada no cubre la palanca de demanda ni la línea de tienda | E-40, E-42, E-44, E-47 | cierre_diamante.md:47-61; diamante2_discover_eventos.md:116,123,131,125 |
| P6-04 | REFUERZO | E-45 (reposición de herramientas) sin contexto en el cierre: su hogar (Taller/Herramientas) solo existe en la Parte II del mapa, no en el cierre aprobado | E-45 | diamante2_discover_eventos.md:67; logica_de_negocio.md:565-567; cierre_diamante.md:47-61 |
| P6-05 | REFUERZO | Medición = precondición de la tesis de capacidad: E-03/E-07/E-40/E-42 no producen dato y H5 (tag de analítica) solo está parcialmente cubierto por E-42; sin ellos el ratio 4:1 y ~1 proy/semana son inverificables | E-03, E-07, E-40, E-42 | cierre_diamante.md:76 (restricción 2), :70-71; marco_estrategia_mercado.md:38 (H5); diamante2_discover_eventos.md:139,123,11 |
| P6-06 | ADICIÓN | H7 (prueba social) sin evento que la materialice: no hay captura de testimonio/reseña; el dato existió en legacy (`testimonios`). Candidato: evento de testimonio post-entrega, o contenido-solo — decisión del Define | E-26 (frontera Entrega/Garantía) | marco_estrategia_mercado.md:44 (H7); diamante2_discover_eventos.md:11 (solo H1-H4 como fuentes) |
| P6-07 | REFUERZO | "Versionable" de la tesis solo materializado a nivel cotización/contrato (E-10/E-16); el versionado del schema de desarrollo (E-17) no tiene evento explícito | E-17, E-10, E-16 | cierre_diamante.md:11 (tesis); diamante2_discover_eventos.md:57,37,56 |
| P6-08 | REFUERZO | Estimación pre-contrato f(valor, módulos) declarada pero solo materializada al fijar E-14; decidir si la proyección del cronograma vive en la cotización (E-05..E-11) o solo en el contrato | E-14, E-05..E-11 | logica_de_negocio.md:254; cierre_diamante.md:79; diamante2_discover_eventos.md:49 |

---

## Notas para el Define

- **El cierre §4 necesita extensión o absorción antes de converger:** Marketing/Captación (E-40/E-42), Tienda (E-44), KPIs (E-47) y Herramientas/Operativo (E-45) son los únicos eventos sin hogar en la tabla aprobada. No es un detalle: son los que materializan la palanca de demanda y la tesis de capacidad.
- **P6-02 es bloqueante de consistencia interna, no de estructura:** la meta de cadencia (15-20 vs 30 días) debe unificarse porque el mismo número alimenta E-14 (cronograma) y E-47 (KPI). No cambia el esqueleto de eventos, cambia el objetivo que miden.
- **La dimensión por rol (P6-01) es un read-model transversal, no un evento nuevo:** no agregar eventos; sí exigir que E-14/E-33/E-35/E-20/E-43 lleven la vista por rol al diseñar schema/UI.
- **H5-H8 entraron al diagnóstico después del discover (solo H1-H4 citados en `diamante2_discover_eventos.md:11`):** el Define debe re-pasar la palanca de demanda completa; el inventario está congelado en H1-H4.
- **Los 4 eventos de medición no son analytics opcional (P6-05):** son la precondición para verificar la tesis §5 (restricción 2 = demanda). Prioridad de construcción, no de adorno.
- **P6-06 y P6-07/P6-08 no requieren decisión ahora:** testimonio (ADICIÓN candidata), versionado de schema y estimación pre-contrato son propiedades que pueden resolverse como contenido (H7), propiedad derivada (P6-07) o campo calculado (P6-08). Ninguna cambia el esqueleto de los 47 eventos.

---

## Registro

- Fecha: 2026-08-03
- Subagente: P6 — la FINALIDAD como unidad (tesis ↔ eventos).
- Método: loop interno de 3 pasadas (bruta → autocrítica → refinamiento). Fuentes: `cierre_diamante.md`, `diamante2_discover_eventos.md`, `diamante2_loop_apertura.md`, `logica_de_negocio.md`, `marco_estrategia_mercado.md`.
- Resultado: 8 hallazgos finales (7 REFUERZO, 1 ADICIÓN). Sin ruido en el inventario. Sin duplicados del loop 1 (A-4, A-6, A-7, B-4, D-4 marcados y no repetidos).
- No se modificó ningún otro archivo.
