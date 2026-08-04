# Pasada P7 — Arquetipos sistémicos y bucles (subagente, loop de 3 pasadas)

**Lente:** la CAUSALIDAD como unidad. Modelo los ciclos causales que unen los 47 eventos del inventario, siguiendo la cadena tipo *cronograma → comisiones → cumplimiento → calidad → garantía → reputación → demanda → más proyectos → saturación del taller* (`diamante2_metodologia_pasadas.md:106`). Todo hallazgo cita fuente con `archivo:línea`. Lo ya reportado en `diamante2_loop_apertura.md` (A-1..A-7, B-1..B-5, D-1..D-4, V-1..V-6) se marca `YA LOOP 1` y no se repite como hallazgo de evento.

---

## Iteración 1 (bruta)

Sin filtrar, todos los ciclos causales que aparecen al cruzar el inventario con el mapa:

**R1 — Reputación → demanda → proyectos → portafolio → reputación (refuerzo, crecimiento).**
Entrega impecable (E-26) → cliente satisfecho → referencia → más leads (E-01) → más cotizaciones (E-11) y contratos (E-13) → más proyectos entregados → más portafolio/documentación (E-41) → reputación. Potencia el bucle: E-26 (hoy el acta nunca se hace, `logica_de_negocio.md:462`) y E-41 (hoy Drive manual).

**R2 — Demanda → proyectos → dinero → marketing → más demanda (refuerzo, crecimiento).**
Leads (E-01) → proyectos cierran (E-11/E-13) → pagos (E-28) → caja → más pago a proveedores (E-20) para cumplir + más inversión en Google Ads (E-40) → más leads. **Hoy el eslabón "leads" está roto**: el cuello de botella es la demanda, ratio 4:1 (`logica_de_negocio.md:299`).

**R3 — Cronograma cumplido → comisión → motivación → calidad → menos reproceso → cronograma cumplido (refuerzo).**
Cronograma fijado (E-14) → cumplimiento → comisión según cumplimiento (E-35) → motivación del socio → calidad en verificación (E-24) → menos reproceso → menos desfases (E-33) → cronograma cumplido. Es el núcleo de la tesis (`cierre_diamante.md:11`): "el cronograma administra los incentivos".

**B1 — Más proyectos → saturación del taller → retrasos → comisiones perdidas → desmotivación → menos calidad → más reproceso (equilibrio, freno).**
Capacidad de producción 1.25 proy/semana (`logica_de_negocio.md:293`) + armado (E-22) + retrasos (E-33) + pérdida de estímulo (E-35, causa interna) + verificación de calidad (E-24) que detecta defectos → reproceso → más saturación. El evento-freno: E-33 con causa estructurada + E-35 que resta comisión por causa interna.

**B2 — Más proyectos → más compras → menos caja → retrasos → menos ventas → menos caja (equilibrio, límite #1).**
Más proyectos → pedidos y pagos a proveedores (E-19/E-20) → sale dinero → caja apretada → compras se retrasa → RED3 "retraso en ventas retrasa TODO el proyecto" (`logica_de_negocio.md:57`, `:149`) → entrega tardía → menos cierre → menos caja. El dinero es "el condicionante máximo, puede causar entropía total" (`:298`).

**B3 — Más demanda → más horas → jefes estallados (equilibrio por valores).**
El mapa declara la política (cero horas extra, no sábados, `logica_de_negocio.md:172`) pero la causalidad "más carga → más horas → menor bienestar → menor calidad" es **inferida, no escrita**. E-47 la mide (bienestar) pero las horas no se registran (V-5).

**B4 — Calidad fallida → garantía → reproceso en taller → menos capacidad → más atraso.**
Si falla la verificación pre-despacho (E-24), la garantía (E-36/E-37) reutiliza `ordenes_trabajo` y consume la misma capacidad del taller (`logica_de_negocio.md:470` — si el instalador no lleva todo, hay que volver 2-3 veces). La garantía es un consumidor invisible de capacidad.

**B5 — Leads → visitas → no-shows → demanda perdida.**
E-46 (no-show) filtra leads y consume capacidad comercial; hoy sin dato (V-1, `:400,506`). Fuga en el embudo de demanda.

**Arquetipo "tragedy of the commons":** el taller (recurso común, capacidad fija 1.25 proy/semana) lo comparten tres flujos que maximizan su propio cierre: proyectos (E-22), tienda web (E-44, mismo pipeline, `:157`) y garantía (E-37). Cada venta adicional satura el recurso común.

**Arquetipo "drifting goals" (metas que se erosionan):** E-35 dice que por causa externa "se corren los plazos y los empleados se miden contra los nuevos" (`:251`). Riesgo: cada desfase externo legitima un estándar nuevo → el estándar de 4 semanas se erosiona a 6.5 (`:256`). Antídoto ya diseñado: inmutabilidad (`:250`).

**Arquetipo "fixes that fail" (remedio que depende de memoria):** RED1 (diseño 3D no descontado, `:44-45`) y cobro 100% manual (`:468`) se resuelven con recordatorios humanos; cuando fallan → cliente pagó de más → mala referencia → reputación (E2/E3 del árbol de problemas, `:80-83`). Es la mitad negativa de R1.

**Tensión "success to the successful":** comisión por cierre (diseñador, `:219`; socios-por-comisión `:209-231`) incentiva cerrar hoy; comisión por cumplimiento (E-35) incentiva la calidad a tiempo. Si la primera domina, el bucle se inclina a volumen sobre calidad; E-35 es la estructura compensadora.

**Aprendizaje/calidad:** la taxonomía de 4 fallas reales (`:432-437`) existe pero no hay ciclo "falla → lección → menos fallas" escrito; Ishikawa está diferido (`:197`).

---

## Iteración 2 (autocrítica)

**Lo que cae o se marca `YA LOOP 1` (no se re-reporta como hallazgo):**
- El enganche `pedidos_web` → producción (E-44) ya es `ADICIÓN` del loop 1 (A-1). Acá solo se conserva la lectura causal que el loop 1 no hizo: E-44 suma un tercer consumidor al recurso común "taller" (→ H-05).
- El no-show (E-46) ya es `ADICIÓN + V-1` del loop 1 (A-3). Acá solo se conserva su lectura como fuga causal del bucle de demanda (→ H-09), no el evento.
- La regla de inmutabilidad ya es `REFUERZO` del loop 1 (A-7). Acá solo se conserva su función sistémica como antídoto al *drifting goals* (→ H-07), no la regla.
- El KPI de bienestar (E-47) ya es `ADICIÓN` del loop 1 (A-5). Acá solo se conserva su función como límite al crecimiento (→ H-06).
- El vínculo E-08 → E-30 ya es nota del Define (D-4). No se repite.
- **R2 cae como hallazgo propio**: es la misma cadena de R1 vista desde el dinero y su eslabón roto (leads) ya está documentado como cuello de botella (`:299`) y como precondición de la palanca de demanda (H1-H4 en `marco_estrategia_mercado.md`, ya enlazados en loop 1). Se fusiona en H-01/H-03 como trasfondo, no como hallazgo independiente.

**Lo que sobrevive (con traza):** R1, R3, B1, B2, B4 (los 4 bucles + los 2 límites al crecimiento), el *tragedy of the commons* (taller compartido), el *drifting goals* (estándar 4→6.5 semanas), el *fixes that fail* (memoria humana en descuento/cobro), la tensión cierre-vs-cumplimiento, y el hueco del bucle de aprendizaje.

**Lo que se me escapó en la pasada 1 (hallazgos que solo aparecieron al releer las fuentes cruzadas):**
1. **El taller como recurso común compartido** — solo emerge al cruzar `:157` (tienda, mismo pipeline), `:470` (garantía reutiliza ordenes_trabajo) y `:293` (capacidad 1.25/semana). En la pasada 1 veía tres eventos sueltos; juntos son un arquetipo.
2. **El *drifting goals* de la causa externa** — solo emerge al cruzar `:251` ("se mide contra los nuevos plazos") con `:256` ("hoy tarda 6.5 semanas"). El dato de la deriva ya existe en el mapa.
3. **La garantía como consumidor de capacidad (B4)** — el matiz de "hay que volver 2-3 veces" (`:470`) es la parte causal que convierte un evento de servicio en un freno de capacidad.
4. **La media negativa de R1 (E2/E3 del árbol de problemas, `:80-83`)** — el árbol lo escribe como efectos de un problema puntual, pero causalmente es el bucle de confianza funcionando a la inversa.

**Decisión de escepticismo aplicada:** B3 (bienestar) y el bucle de aprendizaje se marcan `VACÍO` — la política está escrita pero la causalidad de mejora no; el dato (horas) no existe.

---

## Iteración 3 (refinamiento final)

Once hallazgos depurados, cada uno con un solo eje causal, con su evento-freno/palanca identificado y su punto de intervención del software:

- **H-01** — Bucle de refuerzo de la reputación (R1). Su palanca son E-26 (acta de entrega, hoy nunca ocurre) y E-41 (documentación, hoy Drive manual). El software que instrumente ambos es el que prende el bucle positivo.
- **H-02** — Bucle de refuerzo del incentivo (R3), el núcleo de la tesis. E-35 liquidado desde datos (E-14/E-33) y no de memoria cierra el bucle; E-24 es el verificador que lo protege.
- **H-03** — Límite al crecimiento por dinero (B2), el más severo ("entropía total"). E-43 (lectura de caja) es la única forma de operar el bucle con información y no a ciegas; E-20 es el grifo.
- **H-04** — Bucle de equilibrio del taller (B1) con su evento-freno E-33 (causa interna → comisión perdida → desmotivación) y su palanca de corte temprano E-34 (novedad crítica con SLA 5-24h, `:252`).
- **H-05** — Arquetipo *tragedy of the commons*: el taller es recurso común de proyectos (E-22), tienda (E-44) y garantía (E-37). Falta una medición que cruce demanda total vs. capacidad.
- **H-06** — Límite al crecimiento por bienestar (B3). VACÍO: política escrita (`:172`), causalidad y dato (horas) no existen (V-5).
- **H-07** — Arquetipo *drifting goals* del cronograma y su antídoto (inmutabilidad). E-33 con causa estructurada es el dato que permite auditar la deriva del estándar 4→6.5 semanas.
- **H-08** — Bucle de aprendizaje/calidad. VACÍO/DIFERIDO: la taxonomía de fallas existe (`:432-437`) pero el ciclo de mejora no está escrito y el Ishikawa está diferido (`:197`).
- **H-09** — Fuga causal del no-show en el bucle de demanda (B5). VACÍO: dato no existe (V-1).
- **H-10** — Arquetipo *fixes that fail* (memoria humana): descuento del diseño 3D (RED1) y cobro manual (`:468`) son la mitad negativa de R1 cuando fallan → confianza → reputación. E-08/E-30 y E-27/E-29 son las palancas; E-30 elimina C1/C2 del árbol (`:110`).
- **H-11** — Tensión *success to the successful*: comisión por cierre (volumen hoy) vs. comisión por cumplimiento (calidad a tiempo). E-35 es la estructura compensadora que el Define debe mantener explícita.

**Conteo final: 11 hallazgos — 6 REFUERZO (H-01, H-02, H-03, H-04, H-07, H-11), 2 ADICIÓN (H-05, H-10), 2 VACÍO (H-06, H-09), 1 DIFERIDO (H-08).**

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Evento(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| H-01 | REFUERZO | Bucle de refuerzo reputación→demanda→proyectos→portafolio→reputación. Palancas: acta de entrega (hoy nunca se hace) y documentación por etapa (hoy Drive manual). Instrumentarlas prende el bucle positivo | E-26, E-41, E-01, E-11, E-13 | `diamante2_discover_eventos.md:82,122`; `logica_de_negocio.md:462,532` |
| H-02 | REFUERZO | Bucle de refuerzo cronograma cumplido→comisión→motivación→calidad→menos reproceso. Núcleo de la tesis; E-35 debe liquidarse desde datos (E-14/E-33), no de memoria | E-14, E-35, E-24, E-33 | `diamante2_discover_eventos.md:49,75,99,101`; `cierre_diamante.md:11`; `logica_de_negocio.md:251-253` |
| H-03 | REFUERZO | Límite al crecimiento por dinero (el más severo, "entropía total"): más proyectos→más compras→menos caja→retrasos en cascada (RED3)→menos ventas. E-43 hace visible la restricción que hoy gobierna compras a ciegas | E-20, E-43, E-28, E-33 | `diamante2_discover_eventos.md:65,89,99,124`; `logica_de_negocio.md:57,149,298,345` |
| H-04 | REFUERZO | Bucle de equilibrio saturación del taller (capacidad 1.25 proy/semana): más proyectos→retrasos→comisiones perdidas (causa interna)→desmotivación→menos calidad→reproceso. Evento-freno: E-33/E-35. Corte temprano: E-34 (SLA 5-24h) | E-22, E-33, E-34, E-35, E-24 | `diamante2_discover_eventos.md:73,99,100,101,75`; `logica_de_negocio.md:252,256,293` |
| H-05 | ADICIÓN | Arquetipo *tragedy of the commons*: el taller es recurso común compartido por proyectos (E-22), tienda (E-44, mismo pipeline) y garantía (E-37). Falta una medición que cruce demanda total (3 flujos) vs. capacidad | E-22, E-44, E-37 | `diamante2_discover_eventos.md:73,108,131`; `logica_de_negocio.md:157,293,470` |
| H-06 | VACÍO | Límite al crecimiento por bienestar: la política está escrita (cero horas extra, no sábados) pero la causalidad "más carga→más horas→menos bienestar" es inferida y el dato (horas) no existe. Inferida, no escrita | E-47 | `diamante2_discover_eventos.md:125`; `logica_de_negocio.md:165-172`; `diamante2_loop_apertura.md:97` (V-5) |
| H-07 | REFUERZO | Arquetipo *drifting goals*: causa externa "se mide contra los nuevos plazos" (`:251`) permite que el estándar se erosione (4→6.5 semanas). Antídoto ya diseñado: inmutabilidad (YA LOOP 1 A-7 como regla). Acá: E-33 con causa estructurada es el dato que audita la deriva | E-33, E-35, E-14 | `diamante2_discover_eventos.md:49,99,101`; `logica_de_negocio.md:250-251,256`; `cierre_diamante.md:19,88`; `diamante2_loop_apertura.md:49-53` (A-7) |
| H-08 | DIFERIDO | Bucle de aprendizaje/calidad: la taxonomía de 4 fallas existe pero el ciclo "falla→lección→menos fallas" no está escrito (VACÍO de causalidad) y el Ishikawa está diferido a un futuro módulo de incidencias | E-41 | `logica_de_negocio.md:197,432-437`; `diamante2_discover_eventos.md:122` |
| H-09 | VACÍO | Fuga causal del no-show en el bucle de demanda: visitas agendadas que se pierden consumen capacidad comercial y demandan leads sin dato. Evento ya ADICIÓN del loop 1 (A-3); acá la lectura es causal y el dato no existe | E-46 | `diamante2_discover_eventos.md:37`; `logica_de_negocio.md:400,506`; `diamante2_loop_apertura.md:93` (V-1) |
| H-10 | ADICIÓN | Arquetipo *fixes that fail* (memoria humana): descuento del diseño 3D (RED1) y cobro manual son la mitad negativa de R1 cuando fallan (pago de más→mala referencia). E-30 automático elimina C1/C2 del árbol de problemas | E-08, E-30, E-27, E-29 | `diamante2_discover_eventos.md:38,88,90,91`; `logica_de_negocio.md:44-45,80-83,110,462,468` |
| H-11 | REFUERZO | Tensión *success to the successful*: comisión por cierre (volumen hoy) vs. comisión por cumplimiento (calidad a tiempo). E-35 es la estructura compensadora que el Define debe mantener explícita para que el volumen no erosione la calidad | E-31, E-35 | `diamante2_discover_eventos.md:92,101`; `logica_de_negocio.md:209-231,251-253`; `cierre_diamante.md:17,32-35` |

---

## Notas para el Define

1. **Los 4 bucles centrales forman un solo sistema de relojería:** H-02 (incentivo) y H-04 (saturación) comparten los mismos eventos (E-14/E-33/E-35) — son la cara positiva y negativa del mismo mecanismo. El Define debe tratar "Control de cronograma" como el contexto que gobierna ambos, tal como ya anticipa la tesis (`cierre_diamante.md:11`), y no como un módulo de calendario: sus eventos alimentan Finanzas (E-35), Calidad (E-24) y la entrega (E-26).
2. **Los dos límites al crecimiento (H-03 dinero, H-04 taller) exigen visibilidad, no más procesos:** E-43 (lectura de caja) y la medición de carga total vs. capacidad son agregados de datos que ya existen (`movimientos_financieros`, cronograma) — no eventos nuevos de captura. Coherente con la filosofía del invariante 2 ("el log es la acción, no el reportaje", `cierre_diamante.md:18`).
3. **H-05 (tragedy of the commons) es el único que toca bounded contexts:** el taller es compartido por tres flujos (proyecto, tienda, garantía). No pide cambiar contextos, pero sí exige que el enganche E-44 y la garantía E-37 compartan la misma noción de "capacidad" que E-22 — de lo contrario cada línea de negocio cree que el taller es infinito. Este no debe resolverse en silencio dentro del Define: requiere la decisión de Javier sobre si la capacidad es un dato compartido o por-contexto.
4. **H-07 (drifting goals) es el hallazgo más barato de resolver y el más fácil de ignorar:** la causa estructurada de E-33 ya es un evento del inventario; basta con que el Define lo instrumente como dato auditable con corte interno/externo para que la deriva del estándar (4→6.5 semanas) quede registrada y no se naturalice.
5. **Los tres VACÍO (H-06, H-08, H-09) comparten una raíz: no se registra el dato.** Horas trabajadas, no-shows y lecciones de fallas no se capturan hoy. Ninguno cambia el esqueleto de eventos; se cierran en el loop 2 de diseño si Javier decide que valen la pena (H-06 y H-09 ya tienen su evento candidato, E-47/E-46).
6. **H-10 (fixes that fail) es prioridad operativa, no sistémica:** el bucle negativo de la confianza (pago de más → mala referencia) ya tiene solución de raíz diseñada en el mapa (`:110`, eliminar C1/C2). El Define no necesita decidir nada nuevo — solo no relegar E-30 a "cosmético".
7. **Ningún hallazgo de esta pasada cambia el esqueleto del mapa (bounded contexts, gates, capa 1/2)** — son refuerzos de eventos existentes, 2 adiciones de medición/lectura y 3 vacíos de dato. No dispara reapertura del diamante 1; se resuelven dentro del Define del inventario.

---

## Registro

- Fecha: 2026-08-03
- Lente: CAUSALIDAD (arquetipos sistémicos y bucles de retroalimentación).
- Loop interno de 3 pasadas completado (bruta → autocrítica → refinamiento).
- Resultado: 11 hallazgos finales — 6 REFUERZO, 2 ADICIÓN, 2 VACÍO, 1 DIFERIDO. 0 hallazgos duplicados del loop 1 (lo compartido se marcó `YA LOOP 1`).
