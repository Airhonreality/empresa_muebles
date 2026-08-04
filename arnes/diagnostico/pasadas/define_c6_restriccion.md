# Pasada C6 — Restricción y flujo (subagente, loop de 3 pasadas)

**Lente:** RESTRICCIÓN Y FLUJO. Unidad de análisis: el camino crítico de un proyecto a través de los 15 bounded contexts (Comercial → Contratos → Control de cronograma → Desarrollo → Compras → Taller → Calidad → Entrega → Garantía, con Finanzas cruzando). Pregunta rectora: ¿el grafo de contextos soporta la tesis de capacidad (restricción en la demanda, no en la fábrica) y el flujo no tiene cuellos que la convergencia no declara?

**Fuentes leídas:** `diamante2_define_eventos.md` (LA UNIDAD A AUDITAR), `diamante2_discover_eventos.md` (61 eventos), `cierre_diamante.md` (§5 capacidad), `pasadas/diamante2_panorama_consolidado.md` (P2-P8), `logica_de_negocio.md` (mapa), `loop2_y_retroalimentacion.md` (A10/A11).

---

## Iteración 1 (bruta)

Hallazgos crudos, sin filtrar, con la unidad de análisis del flujo:

- **B1.** E-59 (check de 15 días, Control de cronograma = capa 1) consume tres entradas de I-025: (a) insumos en taller, (b) comprados/pagados, (c) **proyectos en fila en el taller**. La (c) vive en el contexto Taller, que §8 difiere a capa 2. La tabla §5 de interfaces no tiene ninguna fila `Taller → Control de cronograma`. El enforcement más grande del cronograma nace sin una de sus entradas contratada.
- **B2.** El verificador único (I-035: "comercial o gerente") es un punto serial de la línea crítica en E-18 (check de schema) y E-24 (calidad). Si la persona designada es el comercial — el rol del cuello de demanda (P4-F5, ratio 4:1) — los gates de producción compiten por la misma persona que alimenta el embudo. El Define no declara esta consecuencia de flujo.
- **B3.** El desarrollador-proxy (P4-F10, 5 sombreros) es el hilo serial del tramo crítico de producción: E-15 (retoma) → E-17 (desarrollo, la etapa "más bloqueante") → E-19 (pedido) → E-21 (recepción triple) → E-41 (documentación) → E-22 (distribución al taller). Cruza Desarrollo, Compras, Documentación y Taller. La convergencia no lo declara como riesgo de flujo; solo el panorama.
- **B4.** E-52 (estimación) está agrupado en Control de cronograma pero se dispara en el flujo comercial **pre-contrato** (E-10 ajustes, E-11 antes de cotizar). La tabla §5 no declara la interfaz `Comercial → Control de cronograma`. El cronograma "calculable, no estimado de memoria" (A9) depende de una interfaz que la convergencia no tipa.
- **B5.** §8 lista como precondiciones de capa 1 solo "firma virtual y pasarela de pago". El modelo rol-vs-persona que §3 declara "requisito de todos los guards del §4" no está en esa lista: un lector de §8 solo no ve que los guards de capa 1 (E-18, E-21, E-24, E-31, E-35) exigen el modelo de roles tipados.
- **B6.** E-44 (tienda → producción) es un evento de **entrada** al pipeline (inflow), no parte del core post-contrato; su ausencia no rompe capa 1. Pero la tienda es la palanca de crecimiento que A11 prioriza y comparte el taller (H-05 tragedy of the commons), sin medición de demanda total vs. capacidad (E-47/Gobierno diferido): se construye la palanca contra un recurso compartido no medido.
- **B7.** E-42 (medición de embudo, P6-05 "precondición de la tesis de capacidad"): diferirla **parece correcto** — el sustrato de datos (E-01..E-11 + E-51 lead→cliente) es todo capa 1 (Comercial), así que E-42 es una agregación de lectura pura sobre datos que el core sí captura. Backlog limpio, no palanca bloqueada.
- **B8.** E-60 (comunicación frontstage, capa 1, central) depende del contenido que produce E-41 (Documentación), que §6 declara "sin rol de captura" (P4-F8 VACÍO). Si E-41 nunca dispara, el frontstage — la resolución de P5-01/P5-02/P5-10 — queda hueco.
- **B9.** El Taller (capa 2, diferida) está **en la línea crítica**: ~1 semana de ensamblaje entre E-21 y E-23 (mapa: el cronograma del contrato reserva "1 semana de ensamblaje"). La convergencia difiere el detalle interno (correcto) pero no declara que un tramo de la línea crítica es capa 2 y que su estado es dato de entrada del enforcement central.

---

## Iteración 2 (autocrítica)

**Qué sobrevive y qué cae:**

- **B1 sobrevive** → F1 (`NUEVO_CONTRATO`). No es un re-reporte: P8 F-4 ya pidió el check de 15 días, pero nadie exigió el contrato de la entrada "fila del taller". B9 se **fusiona** en F1: el Taller está en la línea crítica Y su fila es entrada de E-59; es la misma raíz.
- **B2 sobrevive** → F3 (`DECISION_PENDIENTE`). Cuidado anti-duplicación: P4-F5 (comercial más cargado) e I-035 (verificador único) ya están resueltos. Lo NUEVO es la **consecuencia de flujo** de una decisión ya tomada: la identidad concreta del verificador único (comercial vs. gerente) determina si el gate de producción compite con el cuello de demanda. No es un defecto del grafo — es una decisión de negocio que el Define no expone como tal.
- **B3 sobrevive** → F4 (`DIFERIDO`). P4-F10 es un hallazgo conocido del panorama, pero la convergencia no lo declara; el lente de flujo muestra que es el punto serial del tramo crítico de producción. Se registra para el loop 2, no mueve fronteras.
- **B4 sobrevive** → F2 (`NUEVO_CONTRATO`). Verificado: E-52 está en Control de cronograma (define §2) y su dato previo es "proyecto en ajustes o previo a contrato" (discover). Interfaz no tipada en §5.
- **B5 sobrevive** → F5 (`CORRECCION`). Es una inconsistencia interna del propio Define: §3 declara el rol-vs-persona como requisito de todos los guards; §8 (la lista operativa de precondiciones de capa 1) lo omite. No contradice al mapa, se contradice a sí mismo.
- **B6 sobrevive recortado** → F6 (`DIFERIDO`). Descarté la tentación de marcarlo como "E-44 bloquea el core" — NO lo hace (es inflow). La pregunta de alto impacto del encargo se responde con no: ningún contexto diferido bloquea capa 1. Lo que queda es un riesgo de **secuenciación**: la palanca de demanda (tienda, A11) se construye antes que la medición (E-47) sobre un recurso compartido sin medir.
- **B7 sobrevive** → F8 (`OK_CON_DOC`, afirmativo). Releí E-42 en el inventario: su "dato previo" son los eventos del embudo, todos capa 1. Diferir la agregación es correcto.
- **B8 sobrevive** → F7 (`OK_CON_DOC`). El VACÍO de E-41 está bien declarado en §6, pero la dependencia de flujo E-41→E-60 no se enuncia.

**Qué cayó (y por qué):**
- *"El gate de caja E-20 en modo bloquear/avisar es la restricción máxima sin enforcement"* → **CAE, YA RESUELTO**: §7.2 ya lo lista como decisión del Supervisor; §6 como VACÍO. Re-reportarlo sería repetir el panorama.
- *"Chatwoot/WhatsApp como precondición de capa 1 no listada"* → **CAE**: es infraestructura externa con decisión técnica ya tomada (mapa:480-487), no una frontera del Define.
- *"E-42 diferido bloquea la tesis de capacidad"* → **CAE**: la tesis ya está sustentada con números reales de Q17/Q20/Q21 (cierre §5, mapa §Capacidad) y el sustrato de datos es capa 1. La medición es precondición de *operar* la palanca, no de construir el core.

**Qué se me escapó en la pasada 1:** no había visto que la corrección P5-09 (§4.2, orden de etapas "aprobación → compras") ya resuelve la contradicción de la lista de etapas de E-14 — lo registro como resuelto, no como hallazgo. También tardé en ver que la respuesta a "¿el grafo amortigua o agrava el cuello comercial?" es: **ni lo amortigua ni lo agrava estructuralmente** — los bounded contexts son lógicos, no load-balanceados; el grafo refleja fielmente la carga real del rol (P4-F1: diseñador=comercial), y el único punto donde el flujo la empeora es F3 (verificador).

---

## Iteración 3 (refinamiento final)

Hallazgos depurados (8, de 9 brutos):

1. **F1 — NUEVO_CONTRATO:** falta la frontera `Taller → Control de cronograma` (entrada "fila del taller" de E-59). El Taller es capa 2 pero está en la línea crítica (~1 semana) y su carga es dato de entrada del enforcement central de capa 1. Es el único cuello estructural que el grafo esconde: la restricción declarada (dinero → leads → cronograma) omite que el recurso compartido del taller es diferido pero su fila alimenta el check de 15 días y el corte temprano por saturación (H-04 → E-34).
2. **F2 — NUEVO_CONTRATO:** falta la frontera `Comercial → Control de cronograma` para E-52 (estimación pre-contrato). El cronograma calculable (A9) y la promesa de 7 semanas (E-14) dependen de una interfaz no tipada.
3. **F3 — DECISION_PENDIENTE:** la identidad del verificador único (I-035: comercial o gerente) no está decidida en el Define y tiene consecuencia de flujo directa sobre el cuello de demanda: si es el comercial, E-18 y E-24 compiten con el embudo; si es el gerente, revive "el gerente hace todo" (P4-F3).
4. **F4 — DIFERIDO:** el desarrollador-proxy (P4-F10) es el punto serial del tramo crítico de producción (E-15→E-21). La convergencia no lo declara como riesgo de flujo; se registra para el loop 2 (es carga de diseño, no bug de frontera).
5. **F5 — CORRECCION:** §8 "Precondiciones de capa 1" omite el modelo rol-vs-persona que §3 declara requisito de todos los guards. Inconsistencia interna del Define.
6. **F6 — DIFERIDO:** secuenciación de la palanca de demanda: tienda (E-44, A11) comparte el taller (H-05) sin medición de demanda total vs. capacidad (E-47/Gobierno diferido). La palanca de crecimiento se construye contra un recurso compartido no medido. No bloquea el core.
7. **F7 — OK_CON_DOC:** E-60 (frontstage) depende del contenido de E-41 (Documentación), cuyo rol de captura es VACÍO (§6). VACÍO bien declarado; la dependencia de flujo no.
8. **F8 — OK_CON_DOC (afirmativo):** diferir Marketing/Demanda (E-40/E-42) es correcto: el sustrato de datos del embudo (E-01..E-11, E-51) es capa 1; E-42 es agregación de lectura pura. Backlog limpio, no palanca bloqueada.

---

## Camino crítico del proyecto (recorrido por contextos)

### Pre-contrato — el embudo (donde vive la restricción #2)

```
Comercial/Cotizador          Contratos              Control de cronograma
E-01 lead ─ E-02/E-50 SLA ─ E-03 califica ─ E-05 presupuesto
  ─ E-06 agenda ─ E-07 visita ─ E-48 diseño 3D ─ E-08 pago* 
  ─ E-09/E-10 propuesta/ajustes ─ E-11 cotización ─ E-51 lead→cliente
                                   │  E-52 estimación (pre-contrato) ────► (F2: sin contrato)
                                   ▼
E-12 borrador ─ E-13 firma* ─ E-53 viajes ─►  E-14 cronograma (7 semanas, doble línea)
                            (Finanzas: E-56 obligación nace)
```

- **Dónde se gasta el tiempo acá:** no en el proyecto individual, en el **throughput**: 1.25 proyectos/mes contra ~5/mes de fábrica (ratio 4:1, cierre:70-72, mapa:301-307). La cola está en los leads, no en la ejecución. El rol que carga el embudo es el comercial (2 personas, 15 eventos en su contexto + apariciones en Contratos E-13/E-53, Desarrollo E-15/E-18, Calidad E-24, Garantía E-36, Finanzas E-29).
- **La restricción #1 cruza acá:** E-08 (pago diseño) → Finanzas; E-43 (caja) se nutre de E-28 (anticipo del cliente). El dinero del cliente alimenta el gate de compras.
- **El grafo NO amortigua ni agrava el cuello comercial:** los bounded contexts son lógicos, no load-balanceados; el grafo refleja la carga real (P4-F1: diseñador = comercial). El único punto donde el flujo lo empeora es F3 (si el verificador único es el comercial).

### Post-contrato — el core (la línea crítica, 4 a 6.5 semanas)

```
Control        Desarrollo        Compras            Taller (capa 2)
E-14 cronograma → E-15 retoma ─ E-17 desarrollo ─► E-18 gate schema*
                        (la etapa más bloqueante,   (verificador único, F3)
                         mapa:148)                       │
                    ▼                                    ▼
              E-19 pedido ─ E-20 pago* (gate caja) ─ E-21 recepción triple* → E-22 armado (~1 sem)
              (espera: dinero E-43→E-20 + lead time   (desarrollador)         (F1: su fila alimenta E-59,
               proveedor — la restricción #1 operando)                        pero sin contrato)
                                                                                    │
Calidad               Control de cronograma         Entrega              Garantía
E-23 citación push ←─────────────────────────────┘                      (post-ciclo)
E-24 veredicto* (verificador único, F3) ─ E-59 check 15 días* (lee fila del taller, F1)
                                                                                 
         E-59 feliz → E-25 instalación (rango 5 días, consume E-53) → E-26 acta*
         E-59 novedad → posponer línea interna (E-33, comisiones E-35)
         E-60 frontstage (depende del contenido de E-41, F7)
```

- **Dónde se gasta el tiempo:** el tramo E-17 (desarrollo, bloqueante) → E-22 (armado, 1 semana) → E-25 (instalación), cargado casi todo sobre el desarrollador-proxy (F4), con la espera de caja/proveedor en E-20/E-21 gobernada por la restricción #1. Ideal: 30 días (2 ciclos de 15); real: 6.5 semanas; tope contractual: 7 semanas (E-59 es el enforcement).
- **Los gates que detienen el proyecto (por diseño):** E-18, E-20, E-21, E-23/E-24 — todos declarados en §4 con dueño y guard.
- **El contexto que recibe el proyecto y lo retiene sin evento propio:** el **Taller**. Entra por E-21, se queda ~1 semana (ensamblaje) y su única señal de salida es E-23 (citación). Su avance interno es capa 2 y su carga es entrada del check de 15 días (E-59) sin contrato tipado (F1). Es el único "cuello que la convergencia no declara".
- **Finanzas cruza en:** E-08 (pago diseño), E-28 (pago cliente → E-43 → gate E-20), E-30 (deducción), E-33/E-35 (causa → comisiones), E-31/E-32 (compensación), E-57 (arriendos). La restricción #1 (dinero) queda operacionalizada en el grafo vía E-43 → E-20 (define §4.3).

### Veredicto sobre la tesis de capacidad

**SÍ, el grafo de contextos soporta la tesis** (restricción en la demanda, no en la fábrica): los contextos de producción (Desarrollo, Compras, Calidad, Entrega, Garantía, Control de cronograma) se construyen para el volumen de fábrica (~5/mes) sin ningún gate de capacidad; los contextos de demanda (Marketing, Tienda, Gobierno/Medición) se difieren **sin bloquear el core** porque su sustrato de datos (eventos del embudo, capa 1) queda capturado. El dinero (E-43→E-20) y el cronograma (Control central, doble línea, E-33/E-59) están reflejados. Con **un matiz estructural**: el único punto donde la capacidad de la fábrica entra al sistema — la fila del taller como input de E-59 — no tiene contrato declarado (F1). La tesis se declara, pero su instrumentación en el grafo queda incompleta.

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Contexto(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| C6-01 | NUEVO_CONTRATO | E-59 (check 15 días, capa 1) lee "proyectos en fila en el taller" — dato del contexto Taller (capa 2) — sin frontera `Taller → Control de cronograma` en §5. El enforcement central nace sin su entrada clave; el Taller retiene el proyecto ~1 semana en la línea crítica sin evento de avance propio. | Taller / Armado ↔ Control de cronograma | define:38 (E-59 en Control); discover:112 (input c de I-025); mapa:251 (desenlaces del check); define:95-105 (§5 sin esa fila) |
| C6-02 | NUEVO_CONTRATO | E-52 (estimación) vive en Control de cronograma pero se dispara en el flujo comercial pre-contrato (E-10/E-11); §5 no tipa `Comercial → Control de cronograma`. El cronograma calculable (A9) y la promesa de 7 semanas dependen de una interfaz no declarada. | Comercial ↔ Control de cronograma | define:38 (E-52 en Control); discover:44 (dispara en ajustes/pre-contrato); loop2:64 (A9 estimación); define:95-105 (§5 sin la fila) |
| C6-03 | DECISION_PENDIENTE | La identidad del verificador único (I-035: "comercial o gerente") no está decidida y decide el flujo: si es el comercial, E-18 y E-24 compiten con el cuello de demanda (P4-F5); si es el gerente, revive P4-F3 ("el gerente hace todo"). El Define no expone esta consecuencia. | Desarrollo ↔ Compras (E-18); Calidad ↔ Entrega (E-24) | define:21 (I-035); panorama:114 (P4-F5); panorama:111 (P4-F3); define:73-76 (guards E-18/E-24) |
| C6-04 | DIFERIDO | El desarrollador-proxy (P4-F10, 5 sombreros) es el hilo serial del tramo crítico de producción (E-15→E-21, cruzando Desarrollo/Compras/Documentación/Taller). La convergencia no lo declara como riesgo de flujo; se registra para el loop 2. | Desarrollo, Compras, Documentación, Taller | panorama:116 (P4-F10); define:39-46 (contextos); mapa:148 (desarrollo bloqueante); discover:63-74 (E-15..E-21) |
| C6-05 | CORRECCION | §8 "Precondiciones de capa 1" lista solo firma virtual + pasarela y omite el modelo rol-vs-persona que §3 declara "requisito de todos los guards del §4". Inconsistencia interna del Define: un lector de §8 no ve la precondición de E-18/E-24/E-31/E-35. | §8 (todas las de capa 1) | define:59 (§3 requisito); define:152 (§8 precondiciones incompletas) |
| C6-06 | DIFERIDO | Secuenciación de la palanca de demanda: la tienda (E-44, A11 la prioriza) comparte el taller (H-05) y se construye sin medición de demanda total vs. capacidad (E-47/Gobierno diferido). E-44 es inflow: no bloquea el core, pero la palanca opera a ciegas sobre un recurso compartido. | Tienda web ↔ Taller; Gobierno/Medición | discover:147 (E-44, H-05); loop2:81 (A11 prioriza tienda); mapa:307 (A11 en mapa); panorama:144 (H-05); define:36/150 (E-47 diferido) |
| C6-07 | OK_CON_DOC | E-60 (frontstage, capa 1, central) depende del contenido de E-41 (Documentación) cuyo rol de captura es VACÍO (§6). VACÍO bien declarado; la dependencia de flujo E-41→E-60 (frontstage hueco si E-41 nunca dispara) no se enuncia. | Documentación ↔ Control de cronograma | define:46 (E-41 sin rol); define:125 (§6 VACÍO); discover:114 (E-60 unifica frontstage); discover:141 (E-41 catch-all) |
| C6-08 | OK_CON_DOC (afirmativo) | Diferir Marketing/Demanda (E-40/E-42) es correcto: el sustrato de datos del embudo (E-01..E-11, E-51) es capa 1; E-42 es agregación de lectura pura. La medición (P6-05) no es palanca bloqueada, es backlog limpio. La tesis de capacidad queda sustentada con números reales (Q17/Q20/Q21). | Marketing / Demanda (diferido) | discover:118 (E-42, dato previo = eventos E-01..E-11); define:34/150 (diferido, interfaces de frontera); panorama:164 (P6-05); cierre:70-72 (capacidades) |

---

## Notas para el Orquestador / Define

- **C6-01 (NUEVO_CONTRATO) es el único hallazgo que mueve una frontera (la agrega):** no re-posiciona contextos ni gates existentes, completa la entrada de E-59. Por la regla de reapertura del ciclo, se lleva a checkpoint: si se acepta, el loop 2 debe modelar un **evento de frontera mínimo "carga/fila del taller"** (contador o vista) como input de E-59 y de E-34 (corte temprano por saturación H-04), SIN abrir el detalle interno de Taller (capa 2 sigue diferida). Sin esto, E-59 se implementa incompleto y el "silencio deliberado" del desenlace novedad se decide sin saber la fila real.
- **C6-02 (NUEVO_CONTRATO):** agregar la fila `Comercial → Control de cronograma · E-52 estimación (pre-contrato)` a la tabla §5. Es barato (es el mismo motor que E-14) y evita que el cronograma nace "a ojo" (fallo declarado en discover:44).
- **C6-03 (DECISION_PENDIENTE):** superficie como decisión del Supervisor **dentro de** I-035: la identidad del verificador único (comercial vs. gerente) no es un detalle de implementación, es un punto de la línea crítica con efecto directo sobre el cuello de demanda. El Define §7 no la lista; conviene agregarla.
- **C6-04 (DIFERIDO):** registro para el loop 2 como dato de diseño (load): el tramo crítico de producción se serializa sobre el desarrollador. No mueve fronteras; informa el diseño de la UI/calendario por rol (P6-01).
- **C6-05 (CORRECCION):** corregir §8 para incluir el modelo rol-vs-persona en "Precondiciones de capa 1" (ya está resuelto en §3; falta arrastrarlo a la lista operativa). El loop 2 no debe abrir guards sin el modelo de roles tipados.
- **C6-06 (DIFERIDO):** la decisión de alto impacto se responde con NO — ningún contexto diferido bloquea el core de capa 1. El matiz es de secuenciación: cuando t-034 (palanca de demanda) construya la tienda, conviene que la medición de demanda total vs. capacidad (E-47) entre en ese mismo alcance o el siguiente, para no operar la palanca a ciegas sobre el taller compartido (H-05).
- **C6-07 (OK_CON_DOC):** al diseñar el loop 2, asignar el rol de captura de E-41 junto con E-60 (frontstage), o el mecanismo de progreso queda sin contenido.
- **Conclusión para el veredicto del ciclo:** la convergencia es **estable respecto a restricción y flujo**. El grafo soporta la tesis de capacidad (demanda < fábrica; dinero > leads > cronograma reflejados). Los dos NUEVO_CONTRATO (C6-01, C6-02) agregan fronteras faltantes sin re-posicionar nada; C6-05 es una corrección documental; C6-03 es una decisión de negocio ya en camino (I-035); C6-04/C6-06 son diferidos. Ninguno obliga a reabrir el Define ni el cierre del diamante 1.
