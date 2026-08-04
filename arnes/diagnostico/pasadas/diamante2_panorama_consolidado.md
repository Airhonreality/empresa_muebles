# Diamante 2 · Panorama consolidado del ciclo de 6 pasadas sistémicas

**Qué es esto:** la convergencia del Orquestador sobre los outputs de las pasadas sistémicas (`arnes/diagnostico/pasadas/`). Cada pasada fue un subagente independiente con su propio contexto y su loop interno de 3 pasadas (bruta → autocrítica → refinamiento). Este documento es el único que se audita contra el inventario: los outputs se deduplicaron entre sí.

**Estado: no se aplicó nada al inventario todavía.** Esto es el panorama para el checkpoint del Supervisor. Solo tras su aprobación se tocan `diamante2_discover_eventos.md` (y, en su caso, el cierre o el mapa vía loop focalizado).

---

## PASADA 8 (7ª, 2026-08-03) — Excepciones y fricción (el FALLO como unidad)

**Contexto:** el Supervisor aprobó una 7ª pasada con el lente del fallo (¿qué pasa cuando cada evento NO ocurre, falla o se sale del camino feliz?), que ataca el punto débil detectado por P2-P7 (inventario fuerte en eventos de estado, débil en negación/enforcement). Además entregó **4 decisiones de negocio nuevas** (registradas como I-024 a I-027 en `log_insights_fase2.md`), que la pasada auditó como reglas reales:

1. **Promesa contractual de 7 semanas, entregable antes** (I-024) — resuelve el VACÍO de cadencia.
2. **Cuestionario de viajes/situaciones del cliente al cerrar contrato** (I-024).
3. **Check de los 15 días** (I-025): log real de producción (insumos en taller / comprados-pagados / proyectos en fila) → 3 desenlaces: feliz (insinuar instalación en 15 días) / novedad (posponer + comisiones reducen + entrega 3 semanas tarde dentro de la promesa) / extremo (negociar).
4. **Calidad revisable por el comercial vendedor o el gerente** (I-026) — resuelve el pool de verificadores.
5. **Flow organizado de cambios de contrato** (I-027): adicional = módulo con especificación y tiempo propio; cambio = protocolo con impacto medible; reprocesos con costo al cliente; **tercer origen de causa en E-33: "cambio de contrato"**.

**Resultado:** 12 hallazgos nuevos (8 ADICIÓN, 2 REFUERZO, 1 ADICIÓN+VACÍO, 1 VACÍO). **4 de las 5 decisiones del Supervisor NO tienen evento en el inventario** — el inventario de 47 eventos no materializa las reglas nuevas del negocio real (F-1 promesa, F-3 viajes, F-4 check 15 días, F-6 cambios; F-5 verificador parcial).

**Los 12 hallazgos P8:** F-1 promesa 7 semanas sin evento · F-2 KPI 15-20 días contradicho · F-3 cuestionario de viajes sin evento/campo · F-4 check de 15 días (el enforcement más grande del cronograma) · F-5 pool de verificadores (con conflicto de interés vendedor-verificador a declarar) · F-6 flow de cambios con tercer origen en E-33 · F-7 SLA de primera respuesta al lead sin ventana · F-8 rama "presupuesto no viable" (Z1) sin proceso · F-9 ramas negativas de E-18/E-24/E-25 sin reproceso · F-10 función de estimación sin evento · F-11 orden de garantía incompleta sin check de completitud · F-12 cobro con atraso sin consecuencia tras 12 días.

### ✅ DECISIONES DEL SUPERVISOR — punto abierto resuelto (2026-08-03, registradas como I-034, I-035 e I-043)

**Cronograma doble, precisado (I-034 + I-043):** el Supervisor confirmó **SÍ, hay DOS calendarios**, y precisó la lógica completa: cada proyecto tiene **predefinido un cambio de cronograma al cliente** — cuando el cronograma ideal de producción se cumple a los 15 días, se le notifica al cliente que **su proyecto se entrega antes** (cambio esperado y positivo, ya anticipado en el proyecto). Si ese cambio no se hace internamente, es un **mal indicador de producción**; externamente el cliente no se entera. La regla: **el único cambio visible al cliente es el positivo (entrega antes); los deslizamientos internos nunca llegan al cliente dentro de la promesa de 7 semanas.** Corrige la inmutabilidad de E-33/A-7 (una sola línea) y matiza P5-02.

**Verificador único + sin conflicto de interés (I-035 + I-043):** la verificación la hace **UNA sola persona designada por despacho** — comercial o gerente — con la misión única de verificar y aprobar. **No hay conflicto de interés**: el comercial cobra comisión por **ventas**, no por métricas de producción — si el cronograma de producción se afecta, afecta al equipo de producción, no al comercial. La verificación por el comercial vendedor es limpia.

Ambas decisiones quedan integradas como correcciones a contrato vivo (Parte I) vía loop focalizado, no esperan más checkpoint.

### ⚠️ HALLAZGO DE CONTRATO VIVO detectado por P8 (requiere decisión del Supervisor)

**I-025 (check de 15 días) implica DOS cronogramas, y la inmutabilidad de E-33/A-7 asume UNO.**
I-025 dice: en novedad "el proyecto **pospone cronograma de producción**" PERO "el cliente **NO ve cambios** en el cronograma contratado". Eso exige separar la **línea interna de producción** (movible, con comisiones) de la **línea contractual al cliente** (inmutable dentro de las 7 semanas). La inmutabilidad actual (`logica_de_negocio.md:250-251`, cierre:19) modela una sola línea. **No se puede integrar I-025 al inventario sin decidir esto primero** — es una decisión de diseño estructural, candidata a loop focalizado del mapa.

### Interacción entre I-026/I-035 y P4-F6 — SIN conflicto, resuelto por el Supervisor (I-043)

I-035 define **un solo verificador designado por despacho** (comercial o gerente), con misión única de verificar y aprobar. I-043 elimina el conflicto: **la comisión del comercial es por ventas, no por producción** — si el cronograma se afecta, afecta al equipo de producción, no al comercial. Verificar su propio proyecto es limpio; se documenta en el Define sin mecanismo de mitigación inventado.

### Corrección a un hallazgo previo (P5-02)

P5-02 marcó como defecto "el deslizamiento de cronograma se comunica en silencio". I-025 lo aclara: **dentro de la promesa de 7 semanas, el silencio deliberado es por diseño** (el cliente NO debe ver el cronograma interno moverse). P5-02 queda acotado: la comunicación importa SOLO cuando se sale de la promesa (desenlace extremo → negociar).

---

## Resultado de la auditoría del Orquestador

**Recuento:** 66 hallazgos brutos → **61 únicos** tras deduplicación cruzada entre pasadas. Por lente:
- P2 (invariantes): 12 → 10 únicos
- P3 (flujo de datos): 12 → 11 únicos
- P4 (carga por rol): 10 → 9 únicos (1 se fusiona con P2)
- P5 (tiempo/dependencias): 13 → 9 únicos (3 fusionados + 1 reclasificado)
- P6 (tesis ↔ eventos): 8 → 5 únicos (2 fusionados, 1 descartado por contradicción)
- P7 (arquetipos): 11 → 10 únicos (1 fusionado)

**Verificación mecánica:** formato de output correcto en los 6 (iteraciones 1/2/3 + tabla + notas), trazabilidad `archivo:línea` en el 100% de los hallazgos, anti-duplicación contra el loop 1 declarada y verificada en cada pasada, y serialización respetada (cada subagente escribió solo su archivo; `git status` lo confirma). Los subagentes cumplieron la regla de escepticismo: los hallazgos inferidos (no escritos en el mapa) se marcaron VACÍO en vez de inventar reglas.

**Contradicción entre pasadas resuelta:** P5-03 y P3-06 pedían el vínculo E-16→cronograma (ajuste de contrato recalcula fechas); P6 lo descartó por no estar documentado. El Orquestador falla a favor de P6: el mapa (`logica_de_negocio.md:530`) solo dice "corre en paralelo, no bloquea"; el impacto en fechas **no está documentado**. Se consolida como VACÍO, no como adición.

---

## Los 61 hallazgos únicos, agrupados por FAMILIA (para el Define)

### Familia A — El dinero: cadena, gates y dueño (6 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Nacimiento de la obligación de cobro sin declarar; mismo dinero en 4 namespaces (`hitos_pago`, `obligaciones_pendientes`, `abonos_contrato`, `movimientos_financieros`); 6/7 contratos sin hitos | P3-02 | ADICIÓN | E-12, E-28, E-29, E-30 |
| Gate de caja en E-20: "dinero disponible" es dato previo, no enforcement con consecuencia | P2-2 | REFUERZO | E-20, E-43 |
| Pago de arriendos: la política "no acumular deuda" define 3 flujos; el inventario solo modela 2 | P2-1 | ADICIÓN | E-20, E-31 |
| RED3: el dinero gobierna el timing de compras (cadena crítica pasa por caja) | P5-04/H-03 | REFUERZO | E-20, E-28, E-43 |
| Dinero disponible: derivado de movimientos vs. `saldo_actual` almacenado — dos verdades | P3-12 | REFUERZO | E-43 |
| Límite al crecimiento por dinero ("entropía total"); E-43 es la única forma de operarlo con info | H-03 | REFUERZO | E-20, E-43 |

### Familia B — El cronograma y su enforcement (7 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Inmutabilidad sin enforcement: no hay evento que bloquee una mutación espontánea; clasificación interno/externo (que decide comisiones) sin verificador | P2-4 / P4-F2 | REFUERZO | E-33, E-35 |
| Holguras/ventanas sin validación (holgura ≤5, rango instalación 5 días, garantía 8-12, sábado libre) | P2-5 | REFUERZO | E-14, E-33, E-36 |
| Consecuencia de incumplir el SLA 5-24h sin definir (un SLA sin consecuencia es deseo) | P2-9 | VACÍO | E-34 |
| Promesa 15-20 días vs. 30 días ideal vs. 6.5 reales; "venta" sin definir | P5-07/P6-02 | REFUERZO | E-11, E-13, E-14, E-47 |
| E-33 y E-34 comparten el dato cronograma sin relación declarada (¿novedad crítica es subtipo de desfase?) | P3-08 | REFUERZO | E-33, E-34 |
| E-16 (ajuste en paralelo) y su impacto en cronograma/BOM: NO documentado en el mapa | P5-03/P3-06 | VACÍO | E-16, E-33 |
| Inconsistencia de orden: E-18 "check pre-compras" vs. lista de etapas "compras → aprobación" | P5-09 | VACÍO | E-14, E-18 |

### Familia C — El schema como definidor (4 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Versionado del schema de desarrollo (E-17): la tesis exige "versionable" pero solo E-10/E-16 versionan | P2-8/P6-07 | REFUERZO | E-17, E-18, E-38 |
| Cadena del material sin linaje (cotización→BOM→lista→OC→recepción) + costo con 3 dueños | P3-05 | REFUERZO | E-17, E-19, E-21 |
| Rama negativa de recepción (E-21): solo modelo la triple verificación exitosa; falta el reproceso | P2-3 | REFUERZO | E-21 |
| E-38/E-39 sin precedencia declarada frente a E-18 (corte contra schema no aprobado = reproceso) | P5-13 | ADICIÓN | E-18, E-38, E-39 |

### Familia D — El cliente: comunicación en los tramos largos (5 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Tramo silencioso E-15→E-26: ~4 semanas sin evento frontstage (tienda E-44 hereda el hueco) | P5-01 | ADICIÓN | E-15..E-26, E-41, E-44 |
| Deslizamiento de cronograma (E-33) sin comunicación al cliente (rompe el rango prometido en silencio) | P5-02 | ADICIÓN | E-14, E-25, E-33 |
| Garantía (8-12 días hábiles) sin evento intermedio hacia el cliente en momento de verdad | P5-10 | ADICIÓN | E-36, E-37 |
| Cliente = 2º rol más activo, bloqueado por infraestructura (firma RED2, acta RED4, pasarela) | P4-F7 | REFUERZO | E-08, E-13, E-28, E-44 |
| H7: prueba social (testimonio/reseña) sin evento; el dato existió en legacy | P6-06 | ADICIÓN | E-26 |

### Familia E — Roles, poder y actores (7 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Rol diseñador ausente: 0 eventos; falta "diseño 3D producido" (E-08/E-31 sin trabajo intermedio); solapamiento real comercial+diseñador no declarado | P4-F1 | ADICIÓN | E-05, E-07, E-08, E-09, E-31 |
| Poder real vs. diseño: el gerente hace todo pero el inventario solo lee (E-43/E-47); funciones reales sin rol de autorización; el gate "ni el dueño lo salta" no se materializa | P4-F3 | ADICIÓN | E-20, E-18, E-24, E-08 |
| E-33/E-34 sin actor asignado (clasificador de causa con conflicto de interés monetario + SLA sin respondiente) | P4-F2 | ADICIÓN | E-33, E-34, E-35 |
| Separación ejecutor-verificador irreal de poblar: pool de 1-2 personas con producción de 2.5 | P4-F4 | VACÍO | E-18, E-24 |
| Comercial = rol más cargado (13 eventos) y es el cuello de demanda (ratio 4:1); se satura primero | P4-F5 | REFUERZO | E-02..E-12, E-29, E-36 |
| Comercial con responsabilidad sin autoridad (promete fechas que no controla, cobra sobre entrega que no ejecuta) | P4-F6 | REFUERZO | E-14, E-23, E-25, E-29 |
| Desarrollador como proxy del taller (5 sombreros en capa 1) — micro-cuello humano | P4-F10 | REFUERZO | E-17, E-19, E-21, E-22, E-41 |

### Familia F — Modelo rol-vs-persona y capturas sin dueño (3 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Modelo rol-vs-persona como precondición del enforcement (P2-6, P2-7 solo implementables si distingue rol de persona) | P2-12 | DIFERIDO | E-18, E-24, E-31 |
| E-41 (y registro de pago informal E-08) sin rol de captura: el único disparador catch-all | P4-F8 | VACÍO | E-41, E-08 |
| Lectura de cuenta/saldo por socio (análogo a E-43 para caja) — "el sistema debe llevar la cuenta del diseñador" | P2-7 | ADICIÓN | E-31, E-32, E-35 |

### Familia G — Datos duplicados / sin dueño / sin nacimiento (6 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Lead → cliente sin evento de materialización (conversión manual, contacto duplicado, bloquea E-42) | P3-01 | ADICIÓN | E-01, E-05 |
| Cuenta de cobro del diseñador con doble nacimiento (E-08 y E-32) | P3-03 | REFUERZO | E-08, E-32 |
| Nómina como dato compuesto (E-31 base + E-35 ajuste) sin relación declarada | P3-04 | REFUERZO | E-31, E-35 |
| Propuesta pública = snapshot congelado vs. proyecto vivo editándose (E-09→E-10→E-11) | P3-07 | REFUERZO | E-09, E-10, E-11 |
| Medición de sitio capturada dos veces (E-07 visita, E-15 retoma) sin relación de superación | P3-09 | REFUERZO | E-07, E-15 |
| Identidad del cliente en tienda web (`pedidos_web`) sin relación tipada al ERP | P3-11 | REFUERZO | E-44 |

### Familia H — Bucles sistémicos (7 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Bucle de refuerzo reputación→demanda→proyectos→portafolio; palancas E-26 (acta) y E-41 (docs) | H-01 | REFUERZO | E-26, E-41, E-01 |
| Bucle de refuerzo incentivo (cronograma cumplido→comisión→calidad): núcleo de la tesis | H-02 | REFUERZO | E-14, E-35, E-24, E-33 |
| Bucle de equilibrio saturación del taller (capacidad 1.25/semana); corte temprano E-34 | H-04 | REFUERZO | E-22, E-33, E-34, E-35 |
| *Tragedy of the commons*: el taller es recurso común de proyectos (E-22), tienda (E-44) y garantía (E-37); falta medición de demanda total vs. capacidad | H-05 | ADICIÓN | E-22, E-44, E-37 |
| *Drifting goals*: la causa externa erosiona el estándar (4→6.5 semanas); E-33 con causa auditable es el antídoto | H-07 | REFUERZO | E-33, E-35, E-14 |
| *Fixes that fail* (memoria humana en descuento/cobro): E-30 automático elimina C1/C2 | H-10 | ADICIÓN | E-08, E-30, E-27, E-29 |
| *Success to the successful*: comisión por cierre (volumen) vs. por cumplimiento (calidad); E-35 es el compensador | H-11 | REFUERZO | E-31, E-35 |

### Familia I — Límites al crecimiento y bienestar (3 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| Límite por bienestar: política escrita (cero horas extra, no sábados) pero causalidad y dato (horas) inexistentes | H-06 | VACÍO | E-47 |
| Bucle de aprendizaje/calidad: taxonomía de fallas existe pero no hay ciclo "falla→lección→menos fallas" | H-08 | DIFERIDO | E-41 |
| Fuga causal del no-show en el bucle de demanda (consumo de capacidad comercial sin dato) | H-09 | VACÍO | E-46 |

### Familia J — Fronteras y contextos sin hogar (4 hallazgos)

| Hallazgo | Pasadas | Tipo | Evento(s) |
|---|---|---|---|
| 4 eventos sin bounded context en el cierre §4: E-40/E-42 (no existe Marketing), E-44 (no existe Tienda), E-47 (no existe KPIs) | P6-03 | REFUERZO | E-40, E-42, E-44, E-47 |
| E-45 (reposición) sin contexto en el cierre; su hogar solo vive en la Parte II | P6-04 | REFUERZO | E-45 |
| Visibilidad por rol/socio (calendario por rol + transparencia de compras) sin evento propio; dimensión transversal | P6-01 | REFUERZO | E-14, E-33, E-20, E-43 |
| Medición = precondición de la tesis de capacidad (E-03/E-07/E-40/E-42 no producen dato; H5 parcial) | P6-05 | REFUERZO | E-03, E-07, E-40, E-42 |

---

## Lectura de conjunto (lo que dicen las 6 pasadas juntas)

1. **El inventario es fuerte en eventos de ESTADO y débil en eventos de ENFORCEMENT/NEGACIÓN.** Es el patrón transversal de P2: gates y transiciones modelados; bloqueos, rechazos y consecuencias de violación no. 5 de los 61 hallazgos son exactamente eso (P2-2, P2-4, P2-5, P2-9, P2-11).
2. **El dinero es la cadena crítica oculta del sistema.** Seis hallazgos (Familia A) giran alrededor: no hay gate de caja, falta el nacimiento de la obligación, falta el tercer flujo de pago (arriendos), y el dinero gobierna el timing de compras (RED3). Es la restricción que P7 llama "entropía total".
3. **El cuello humano no es la fábrica, es la cola del embudo.** P4: el comercial carga 13 de 47 eventos y se satura primero — antes que el ratio 4:1. Cualquier palanca de demanda que no le descargue eventos automáticos escala a una persona.
4. **El cliente queda en silencio durante ~4 semanas** (P5). Y el rol más activo del sistema está bloqueado por infraestructura inexistente (firma, acta, pasarela).
5. **La promesa comercial (15-20 días) no reconcilia con el modelo interno (30 días) ni con la realidad (6.5 semanas).** Es el hallazgo más citado (P5-07, P6-02, P7 drifting goals) y el único que necesita dato de Javier.
6. **Los 4 eventos de la palanca de demanda no producen dato hoy** y la medición es precondición de la tesis de capacidad (P6-05). No es analytics opcional.
7. **Ningún hallazgo cambia bounded contexts ni gates.** Lo verifica P2 (nota final), P3 ("solo decisiones de dueño/linaje"), P4 ("sin reapertura"), P5 ("ninguna obliga a reabrir el diamante 1"), P6 ("no cambia el esqueleto"), P7 (nota 7). La única excepción que roza una frontera es P3-02 (dueño del dinero del cliente Contratos↔Finanzas) — se resuelve como frontera del Define, no reabre el esqueleto.

---

## Qué necesita el Define para no dejar la tesis en deseo (acciones derivadas)

1. **Decidir el enforcement como invariantes de máquina de estados** (el estado no transiciona sin el guard) o como **eventos de rechazo explícitos** — P2 pide elegir, contexto por contexto.
2. **Resolver el modelo rol-vs-persona ANTES de los guards** (P2-12, P4-F2/F4): sin roles tipados, la separación ejecutor-verificador y la compensación por rol son inejecutables.
3. **Asignar roles de autorización explícitos** (E-18, E-20, E-24, E-33 clasificador): dejar vacante = decidir "el gerente sigue haciendo todo".
4. **Declarar las dependencias de precedencia que hoy están ocultas:** dinero→E-20 (RED3), E-16→cronograma (marcado VACÍO), E-18→E-38/E-39, E-08→E-30.
5. **Poner firma virtual y pasarela de pago junto a los gates de capa 1** (P4-F7): son precondiciones del rol más activo, no decoración.
6. **Resolver los 5 eventos sin hogar de contexto** (E-40, E-42, E-44, E-45, E-47) en la tabla de bounded contexts del cierre (P6-03/P6-04).
7. **Re-pasar la palanca de demanda completa (H5-H8)**, que el inventario dejó congelada en H1-H4 (P6-05, P6-06).
8. **Cerrar la cadencia (15-20 vs. 30 días) como decisión de negocio** — el mismo número alimenta E-14 y E-47.
9. **Unificar la meta de comunicación al cliente en UN mecanismo frontstage** (progreso visible del proyecto) en vez de tres eventos sueltos (P5-01/P5-02/P5-10).

---

## Registro

- Fecha: 2026-08-03
- Orquestador: consolidación de 6 subagentes (P2-P7), cada uno con loop interno de 3 pasadas.
- Resultado: 61 hallazgos únicos (de 66 brutos). Verificación: formato, trazabilidad, anti-duplicación y serialización auditadas.
- **Estado: esperando checkpoint del Supervisor.** Nada se aplicó al inventario. Tras aprobación: (a) aplicar adiciones/refuerzos a `diamante2_discover_eventos.md`; (b) decidir si los VACÍO entran como datos "por definir"; (c) resolver los refuerzos que tocan el cierre §4 (P6-03/P6-04) como material del Define.
- Ledger: t-035 a t-040 creadas, `esperando_humano`.
