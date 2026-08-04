# Diamante 2 · Loop de apertura — flags, integración de logs y vacíos (segunda pasada)

**Qué es esto:** la segunda vuelta de auditoría sobre el Discover del segundo diamante (`diamante2_discover_eventos.md`, 43 eventos). El primer pase destiló lo obvio del mapa; este pase busca lo que el primero omitió, aplanó o dejó sin enlazar — mismo patrón que el loop 2 del diamante 1 (`loop2_y_retroalimentacion.md`).

**Qué NO es:** no es el Define. Acá solo se clasifican hallazgos; la convergencia en bounded contexts viene después, en `diamante2_define_eventos.md`.

**Método:** relectura crítica del inventario de 43 eventos contra (a) el mapa Parte I, (b) `log_insights_fase2.md` (I-001..I-004), (c) `marco_estrategia_mercado.md` (H1-H4), (d) `cierre_diamante.md`. Cada hallazgo con trazabilidad a su fuente.

---

# PARTE A — Flags de apertura (lo que el inventario omitió o aplanó)

## A-1. Falta el evento del enganche `pedidos_web` → producción (gap conocido del mapa, omitido en el inventario)

El mapa lo documenta dos veces: el punto 5 ("`pedidos_web` (t-015) registra el pedido y el pago, pero **no dispara ninguna orden de producción todavía — ese enganche no existe**") y la línea 188. **El inventario de 43 eventos no tiene ningún evento para "pedido de tienda entra al pipeline de producción".** Los eventos de tienda solo aparecen de refilón en E-38/E-39 (integración SketchUp). Es un hueco real: los productos de tienda pasan por el MISMO pipeline (desarrollo → aprovisionamiento → armado), y ese evento de entrada no está modelado.

**Clasificación: ADICIÓN obligatoria antes del Define** — evento "pedido de tienda → dispara producción" (candidato E-44). Fuente: `logica_de_negocio.md:157,188`.

## A-2. Falta el evento de reposición de herramientas/consumibles (Taller/Herramientas)

El mapa documenta (línea 566-567): "la compra de materiales de proyecto (bisagras, mesones) y la **reposición de herramientas** son necesidades **distintas en origen** (una atada a proyecto, otra **operativa**) pero deben poder **verse juntas por proveedor**." El inventario tiene E-19/E-20 (compras de proyecto) pero **ningún evento para la compra operativa de reposición**. No es un detalle: el mapa distingue explícitamente dos orígenes del mismo evento "comprar".

**Clasificación: ADICIÓN** — evento "reposición de herramienta/consumible" (candidato E-45), con vínculo a `proveedor_id` y vista conjunta por proveedor. Fuente: `logica_de_negocio.md:566-567`; módulo Taller/Herramientas.

## A-3. El evento "visita" no contempla el no-show (hueco en blanco del mapa, arrastrado al inventario)

El mapa lo dice dos veces (línea 400 y 506): "quién agenda, con qué anticipación, **qué pasa si el cliente no se presenta**, sigue abierto". El inventario E-07 ("Visita ocurre") modela la visita feliz pero **no el evento negativo "visita no ocurre / no-show"**. No es cosmética: el propio mapa lo marca como riesgo operativo real ("los no-shows son un problema operativo común").

**Clasificación: ADICIÓN** — evento "visita no ocurre" con regla de qué pasa (¿se reagenda? ¿se pierde el lead? ¿se cobra?). **Y es además VACÍO DE INFORMACIÓN**: el dato no existe, no es solo un evento que falta. Fuente: `logica_de_negocio.md:400,506`.

## A-4. La tensión del agendamiento híbrido quedó aplanada en E-06

El mapa documenta (punto 2, línea 132) una **tensión explícita sin resolver**: Javier quiere app de agendamiento pero teme "que se vuelva muy app" y perder el trato humano; su instinto es un **modelo híbrido según el lead**. El inventario E-06 dice "comercial o IA (híbrido)" — correcto pero aplanado: no registra que es una **decisión de diseño pendiente** que el Define no puede saltar.

**Clasificación: REFUERZO con nota** — E-06 debe llevar la tensión documentada como decisión abierta del Define (no como detalle resuelto). Fuente: `logica_de_negocio.md:132`.

## A-5. El inventario captura el embudo (E-42) pero no los KPIs operativos del mapa (punto 6)

El mapa (punto 6) tiene KPIs propios que NO están en el inventario: **al menos 1 proyecto vendido por semana, entrega en ~15-20 días de la venta, salud de caja** — y la capa de bienestar ("cero horas extra, no trabajar sábados, jefes con tiempo libre", cita textual). El inventario E-42 solo cubre la medición de embudo de `marco_estrategia_mercado.md` (H3). Los KPIs operativos del punto 6 quedaron fuera.

**Clasificación: ADICIÓN** — evento/medición "lectura de KPIs operativos" (candidato E-46: proyecto/semana, ciclo 15-20 días, salud de caja, bienestar). La capa de bienestar depende de RRHH/Nómina (no se registran horas hoy). Fuente: `logica_de_negocio.md:165-172`.

## A-6. E-40 (conversión offline) asume `gclid` sin registrar la alternativa documentada

El inventario E-40 dice "requiere recuperar `gclid` — hoy perdido". `marco_estrategia_mercado.md:40` documenta una **alternativa**: "las *enhanced conversions for leads* permiten hacer lo mismo con email/teléfono hasheado, que sí se capturan hoy — **verificar en la documentación vigente de Google Ads antes de implementar**". El inventario no la registra.

**Clasificación: REFUERZO con nota** — E-40 lleva dos caminos (`gclid` o enhanced conversions), con la verificación pendiente marcada. Fuente: `marco_estrategia_mercado.md:40`.

## A-7. La regla de inmutabilidad del cronograma no quedó explícita en E-33

E-33 captura "cambio de cronograma con causa", pero el mapa define una regla estructural que el Define necesita: **las tareas internas se imprimen una vez y NO se modifican espontáneamente** (solo eventos externos las mueven). E-33 implica la regla pero no la nombra.

**Clasificación: REFUERZO con nota** — E-33 + E-14 deben llevar la inmutabilidad como regla explícita del contexto (no como detalle). Fuente: `logica_de_negocio.md` sección Control de cronograma.

# PARTE B — Integración de logs y marcos (qué quedó sin enlazar al inventario)

## B-1. I-001 (plantilla de PROYECTOS inconsistente) — enlazado, pero con un matiz perdido

I-001 ya se enlazó a E-21 (recepción) en el inventario. **Lo que se perdió:** el diagnóstico mostró que la plantilla estandarizada SÍ existe (PEDIDOS/ + MODELADOS 3D/ + ORDENES DE ARMADO INSTALACIÓN/ + REQUERIMINTOS.xlsx) — esa es **evidencia de la taxonomía de carpetas por etapa que la capa 1 puede reproducir como estructura de documentación** (se conecta con E-41, no solo con E-21).

**Clasificación: REFUERZO** — enlazar I-001 también a E-41 (documentación por etapa). Fuente: `log_insights_fase2.md` I-001; diagnóstico VETA_ERP.

## B-2. I-004 (PROPUESTAS sin convención de naming) — registrado como diferido, correcto

I-004 está diferido a capa 2/limpieza. **Correcto, sin cambios.** No bloquea el Define. Fuente: `log_insights_fase2.md` I-004.

## B-3. H1-H4 (marco estratégico) — enlazados, verificar el cuarto

- H1 (`score_conversion` muerto) → E-03 ✓
- H2 (`gclid` perdido) → E-40 ✓ (ver A-6)
- H3 (embudo no medible) → E-42 ✓
- H4 (visita sin registro) → E-07 ✓
- **Matiz:** H4 dice "instrumentar lo que ya pasa, no agregar actividad nueva" — refuerza la filosofía del invariante 2 del cierre ("el log es la acción, no el reportaje"). Vale la pena que el Define lo use para E-07, no solo como checklist.

**Clasificación: REFUERZO.** Fuente: `marco_estrategia_mercado.md:32-48`.

## B-4. Parámetros pendientes del bloque G no están anotados en el inventario

El inventario E-31 (compensación) lista las reglas por rol pero no lleva la nota de los **parámetros sin número**: % del carpintero "por tamaño" (sin definir) y neto post-impuestos del diseñador (pendiente de contador). Son datos que el Define necesita saber que faltan.

**Clasificación: REFUERZO con nota** — E-31 con sus 2 parámetros pendientes visibles. Fuente: `cierre_diamante.md:9`, `segunda_ronda_preguntas.md:134-135`.

## B-5. Capacitaciones del diseñador (idea emergente) — ausente, pero es decisión consciente

El cierre menciona la idea de capacitaciones especializadas como línea de negocio potencial. **El inventario correctamente no la modela como evento del sistema actual** — es una línea de negocio futura, no un evento. Se registra acá para que no se pierda, clasificada como DIFERIDO explícito.

**Clasificación: DIFERIDO** (registrado, no modelado). Fuente: `cierre_diamante.md:39`.

# PARTE C — Vacíos de información (dato que no existe, no solo evento que falta)

| # | Vacío | Dónde duele | Fuente |
|---|---|---|---|
| V-1 | No-shows de visita: ¿con qué anticipación se agenda? ¿qué pasa si no se presenta? ¿se reagenda o se pierde? | E-07 (visita) — bloquea definir el evento negativo y su regla | `logica_de_negocio.md:400,506` |
| V-2 | % del carpintero "por tamaño" — no tiene número | E-31 (compensación) — no bloquea modelar la regla, bloquea el cálculo | `cierre_diamante.md:118` |
| V-3 | Neto post-impuestos del diseñador ($130k bruto → neto) | E-31 (compensación) + rentabilidad del modelo de diseñador libre | `cierre_diamante.md:115` |
| V-4 | Tienda web como línea de negocio: ¿envío nacional? ¿catálogo distinto al de proyectos? (un Insight diferido) | E-44 candidato (pedido de tienda → producción) — el enganche existe pero su alcance (envío) no | `logica_de_negocio.md:507` |
| V-5 | Cómo se registran hoy las horas trabajadas (RRHH/Nómina) — no se mide la capa de bienestar sin esto | E-46 candidato (KPIs operativos) | `logica_de_negocio.md:172` |
| V-6 | Firma virtual del contrato: ¿qué proveedor/mecanismo? (no existe hoy) | E-13 — el evento está, el mecanismo no | `logica_de_negocio.md:464` |

**Decisión de método:** los vacíos V-1 a V-6 NO bloquean el Define del inventario — se modelan como eventos/reglas con su dato marcado "por definir", y se cierran en el loop 2 de diseño (o con loop focalizado si alguno cambia bounded contexts). Ninguno de los seis cambia el esqueleto de eventos: son parámetros o mecanismos, no estructura.

# PARTE D — Puntos débiles del inventario (revisión interna)

## D-1. La cadena de frontera armado → citación de calidad tiene una aparente contradicción de capas

El inventario marca E-22 (armado) como "capa 2, diferida" y a la vez E-23 (citación de calidad) como gate de capa 1. **Contradicción aparente a resolver en el Define:** si el detalle del armado es capa 2, el evento de frontera "el proyecto pasó por armado y sale a calidad" SÍ es capa 1. La resolución: el **estado** "armado" es de capa 1; el **detalle interno** (tareas por módulo, manual ISO) es capa 2. El Define debe separar estado de detalle.

## D-2. "Recepción de materiales" es el evento más duplicado del inventario

El hallazgo B del mapa (línea 502) ya lo advirtió: recepción aparece en Compras (E-21) y en Producción. El inventario lo puso una vez (E-21, en D-Compras) — **correcto**, pero el Define debe decidir la frontera de propiedad (¿el evento es de Compras con vista en Desarrollo, o un evento con dos vistas?). Queda registrado como punto del Define, no como error del inventario.

## D-3. Los eventos de frontera de los 4 gates no tienen dueño declarado

El inventario nota 2 ya lo dice (E-18, E-21, E-23, E-33 son entre contextos). **Se mantiene como pendiente del Define** — no es un defecto del inventario, es su naturaleza: los eventos de frontera se declaran primero, el dueño se asigna al converger.

## D-4. Falta la conexión E-08 → E-30 (pago de diseño 3D → deducción del anticipo)

El inventario tiene E-08 (pago del diseño) en bloque A y E-30 (deducción del anticipo) en bloque G. **La relación entre ambos no está declarada** — son el mismo dinero visto en dos momentos. El Define debería mantener el vínculo explícito (el movimiento de E-08 es el que E-30 deduce). Refuerzo de trazabilidad.

# PARTE E — Clasificación consolidada

| Hallazgo | Tipo | Acción para el Define |
|---|---|---|
| A-1: enganche `pedidos_web` → producción | **ADICIÓN** | Agregar E-44 al inventario antes de converger |
| A-2: reposición de herramientas | **ADICIÓN** | Agregar E-45 al inventario antes de converger |
| A-3: no-show de visita | **ADICIÓN** + V-1 | Agregar E-46 al inventario con dato "por definir" |
| A-4: tensión agendamiento híbrido | REFUERZO | E-06 con decisión abierta del Define |
| A-5: KPIs operativos del punto 6 | **ADICIÓN** | Agregar E-47 al inventario |
| A-6: alternativa a `gclid` | REFUERZO | E-40 con ambos caminos |
| A-7: inmutabilidad del cronograma | REFUERZO | E-14/E-33 con la regla explícita |
| B-1: I-001 también a E-41 | REFUERZO | Enlace adicional en el inventario |
| B-3: H4 → filosofía de log | REFUERZO | Nota en E-07 |
| B-4: parámetros sin número en E-31 | REFUERZO | Nota en E-31 |
| B-5: capacitaciones | DIFERIDO | Registrado, no modelado |
| D-1 a D-4 | Notas del Define | Se resuelven al converger, no ahora |

**Resultado neto del loop:** el inventario pasa de **43 a 47 eventos** (E-44..E-47), con 4 adiciones obligatorias, 6 refuerzos y 1 diferido. **Ningún hallazgo cambia el esqueleto del mapa** (bounded contexts, gates, capa 1/2) — por eso no dispara reapertura del diamante 1 ni ronda de preguntas: todos son eventos que faltaban o notas de trazabilidad, no contradicciones estructurales.

---

## Registro

- Fecha: 2026-08-03
- Estado: **loop de apertura completado** (segunda pasada sobre `diamante2_discover_eventos.md`).
- Resultado: 43 → 47 eventos; 4 adiciones (E-44 enganche tienda→producción, E-45 reposición de herramientas, E-46 no-show de visita, E-47 KPIs operativos), 6 refuerzos, 1 diferido, 6 vacíos de información (V-1..V-6) que no bloquean el Define.
- Próximo paso: **aplicar las adiciones al inventario y abrir el Define** (`diamante2_define_eventos.md`) — converger los 47 eventos en bounded contexts del sistema y decidir fronteras de los gates.
