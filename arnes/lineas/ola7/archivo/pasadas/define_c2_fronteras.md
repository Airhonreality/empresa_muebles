# Pasada C2 — Fronteras y contratos (subagente, loop de 3 pasadas)

**Lente:** FRONTERAS Y CONTRATOS. Unidad de análisis: cada interfaz entre pares de bounded contexts del Define (`diamante2_define_eventos.md` §5 y §4). Pregunta rectora: ¿cada interfaz es explícita, mínima, estable y tipada, o hay acoplamiento oculto / contextos que se hablan sin evento de frontera?

---

## Iteración 1 (bruta)

Hallazgos crudos, sin filtro:

1. La tabla §5 (define:95-105) tiene 9 filas; los 9 eventos de frontera existen en el inventario y cada gate tiene dueño en §4.1. Pero hay flujos cruzados reales que NO aparecen en la tabla: E-13→E-56 (Contratos→Finanzas, obligación), E-08 (Comercial→Finanzas, pago diseño 3D), E-16→E-33 (Contratos→Control, tercer origen), E-53→motor de cronograma (Contratos→Control, viajes), E-59→E-25 (Control→Entrega, insinuar instalación), E-18→E-38/E-39 (Desarrollo→Integraciones), E-26→E-36 (Entrega→Garantía).
2. Sospecha de ciclo oculto Control↔Finanzas: Control→Finanzas (E-33/E-14→E-35) y el dinero→cronograma (RED3).
3. Sospecha del hint del prompt "Compras→Control por estimación".
4. E-59 (check de 15 días) consume estado de Compras (comprados/pagados) y fila del Taller — Control leyendo las tripas de otros contextos.
5. E-31 (compensación base) necesita hechos de Control (fases terminadas), Taller (módulos armados) y Entrega (módulo instalado) — "Taller→Finanzas por órdenes de trabajo".
6. E-52 (estimación) vive en Control pero se dispara desde el flujo Comercial pre-contrato.
7. E-54 (reproceso): ramas negativas de E-24 (Calidad) y E-25 (Entrega) que devuelven a Desarrollo, y E-54→E-33, sin fila en la tabla.
8. P3-02: la nota "Contratos declara, Finanzas administra" no dice quién es dueño del hito ni dónde lee la vista del contrato el estado de pago.
9. E-08: no sé aún si la cuenta de cobro del diseñador vive bien (Finanzas, E-32/E-58) o si quedó partida.
10. E-51: no sé aún quién posee la identidad del cliente.
11. E-42 (Marketing lee el embudo de Comercial) sin interfaz declarada; E-40/E-44/E-47/E-55 igual.

---

## Iteración 2 (autocrítica)

**Qué cae y por qué:**

- **Cae la sospecha de ciclo directo Control↔Finanzas (bruto 2).** No existe evento Finanzas→Control directo: E-43 (dinero) va a Compras, y el dinero llega a Control solo vía E-59 (lee estado de compras) o vía E-33 (causa externa reportada). El ciclo es de NEGOCIO (H-03/RED3), mediado por Compras. Conclusión: no hay ciclo de interfaz, y hay que **preservarlo mediado** — no crear un contrato directo Finanzas→Control.
- **Cae la lectura literal "Compras→Control por estimación" (bruto 3).** La estimación (E-52) es alimentada por el scope del proyecto (valor + módulos), que vive en Comercial/Cotizador, no en Compras. El flujo real Compras→Control es E-59 (check de 15 días lee insumos/pagos), no estimación. El hint del prompt apuntaba a un acoplamiento real, pero la dirección correcta es Comercial→Control (E-52) y Compras→Control (E-59).
- **Caen E-42/E-40/E-44/E-47/E-55 (bruto 11).** Son contextos de capa 2/backlog (t-034); el Define §8 ya dice "se diseñan las interfaces de frontera" (define:150). No es una omisión del Define, es diferido por diseño. Se consolidan como DIFERIDO, no como defecto.
- **Caen P6-03/P6-04 (eventos sin hogar).** Resueltos por los 3 contextos nuevos (define:34-36); los valido, no los re-reporto.
- **Caen P3-07, P3-08, P3-09.** Son flujos internos de un solo contexto (snapshot de Comercial; E-33/E-34 dentro de Control; E-07/E-15 dentro de Comercial/Desarrollo), no fronteras. No son de mi lente.

**Qué sobrevive (y se precisa):**

- El hueco central NO es que las 9 filas estén mal — están bien (explícitas, unidireccionales, tipadas, con evento en inventario). El hueco es que la tabla §5 es declarada como "los que el loop 2 debe implementar como integraciones" (define:94) y **excluye al menos 6 flujos cruzados reales** que el loop 2 implementará igual, por teléfono.
- El acoplamiento oculto real son los **read-models**: E-59 (Control←Compras/Taller), E-31 base (Finanzas←Control/Taller/Entrega), E-52 (Control←Comercial). Son "contextos que se hablan sin evento tipado" — NUEVO_CONTRATO.
- P3-02 sobrevive como refinamiento de la resolución (no como re-reporte): la dirección "Contratos declara, Finanzas administra" es correcta pero no ejecutable sin declarar el dueño del hito y el single-source-of-truth.

**Qué se me escapó en la iteración 1 y detecté al releer:**

- **E-23: el mapa (logica:282) y el inventario (discover:82) dicen "citación de calidad push hacia Comercial", pero el Define §4.1/§5 dice Taller→Calidad.** Es la misma realidad (el verificador único es una persona, que puede ser el comercial — I-035/I-043), pero el wording de dos documentos autoritativos quedó desincronizado. El loop 2 podría implementar el destino de la notificación contra el texto viejo. Es una corrección de wording a aplicar al converger el inventario + reconciliación del mapa vía loop focalizado.
- **La fila §5 "Contratos → Control: E-13/E-14 firmado + estimación" (define:98) mezcla el evento de frontera (E-13, emisor) con el evento interno del consumidor (E-14/E-52, que viven en Control — define:38).** Todas las demás filas listan solo el evento de frontera. Inconsistencia de notación menor.

---

## Iteración 3 (refinamiento final)

Hallazgos depurados, 13 consolidados. Los 9 contratos declarados se validan como bien formados (ver nota positiva en §Notas). Los hallazgos apuntan a (a) flujos cruzados que faltan en la tabla §5, (b) read-models sin contrato (el "teléfono"), (c) refinamientos de las resoluciones P3-02/E-08/E-51, (d) correcciones de wording.

---

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Frontera/contrato afectado | Fuente (archivo:línea) |
|---|---|---|---|---|
| C2-01 | REFORZAR_FRONTERA | La tabla §5 ("los que el loop 2 debe implementar como integraciones") omite ≥6 flujos cruzados reales que el loop 2 implementará igual: E-13→E-56 (Contratos→Finanzas, obligación), E-08 (Comercial→Finanzas), E-16→E-33 (Contratos→Control, tercer origen), E-53→motor (Contratos→Control, viajes), E-59→E-25 (Control→Entrega, desenlace feliz), E-18→E-38/E-39 (Desarrollo→Integraciones), E-26→E-36 (Entrega→Garantía). Las 9 filas existentes son correctas; el conjunto es incompleto como lista de integraciones. | §5 tabla de interfaces (incompleta) | define:93-105; define:86; define:18; discover:98; discover:112 |
| C2-02 | REFORZAR_FRONTERA | P3-02: "Contratos declara, Finanzas administra" (define:109) es correcta en dirección pero no ejecutable sin declarar: (a) dueño del hito = spec en Contratos (E-12 crea `hitos_pago`) y ciclo de vida en Finanzas (E-56→E-28); (b) la pierna E-13→E-56 como fila; (c) el read-model del estado de pago para la vista del contrato — si `hitos_pago` conserva estado `pagado`, la duplicación de 4 namespaces (P3-02/P3-12) revive. El hito es un objeto compartido con dueño dual: Contratos define, Finanzas administra. | Contratos ↔ Finanzas (dinero del cliente) | define:109; discover:54; discover:98; panorama:68; panorama:72 |
| C2-03 | NUEVO_CONTRATO | E-59 (check de 15 días, I-025) consume estado de Compras (comprados/pagados) y la fila del Taller sin contrato declarado. La fila del taller es dato del contexto Taller (capa 2, diferida — define:41); en capa 1 E-59 debe derivarla de los eventos de frontera (E-21→E-22→E-23→E-24) o leer capa 2. Sin contrato, Control lee las tripas de Compras y Taller. | Control de cronograma ← Compras y ← Taller (check 15 días) | define:19; define:38; define:41; discover:112; panorama:15 |
| C2-04 | NUEVO_CONTRATO | E-31 (compensación base) necesita hechos de Control (fases terminadas, E-14), de Taller (módulos armados, E-22) y de Entrega (módulo instalado, E-25). La comisión "por módulo instalado" del carpintero/auxiliar es el caso "Taller→Finanzas por órdenes de trabajo" del prompt. Solo la pierna E-33→E-35 (ajuste) está declarada; la base E-31 queda sin interfaz. | Finanzas ← Taller, ← Entrega, ← Control (base de E-31) | discover:103; discover:65; cierre:30-35; cierre:33; cierre:35; panorama:134 |
| C2-05 | NUEVO_CONTRATO | E-52 (estimación pre-contrato) vive en Control (define:38) pero se dispara desde el flujo Comercial (proyecto en ajustes, E-10) y necesita el scope (valor + módulos), dato del cotizador (Comercial). No hay fila Comercial→Control para E-52. La estimación la alimenta Comercial, no Compras (corrige el hint del prompt). | Comercial → Control (E-52 estimación) | discover:44; define:38; define:95-105 |
| C2-06 | REFORZAR_FRONTERA | E-54 (reproceso) es evento de rechazo cruzado sin filas: E-24 negativo→E-54 (Calidad→Desarrollo), E-25 falla→E-54 (Entrega→Desarrollo), E-54→E-33 (Desarrollo→Control, recalculo). El patrón §4.1 (rama negativa explícita) está bien; las ramas negativas de frontera no están declaradas y el "quién se entera" del reproceso queda informal. | Calidad→Desarrollo, Entrega→Desarrollo, Desarrollo→Control (vía E-54) | define:73; discover:84; define:100; define:103 |
| C2-07 | REFORZAR_FRONTERA | P3-05 linaje del material: la interfaz Desarrollo→Compras es doble — E-18 (guard, declarada) + el BOM/lista de compras de E-17 que alimenta E-19 (no declarada). El linaje cotización→BOM→lista→OC→recepción cruza Comercial→Desarrollo→Compras→Taller sin contrato de datos. P3-05 sigue sin resolverse como frontera. | Desarrollo → Compras (BOM/lista de compras) | define:100; discover:65; panorama:92 |
| C2-08 | REFORZAR_FRONTERA | E-53 (cuestionario de viajes): el Define declara el consumidor en el motor de cronograma solo como "riesgo de campo muerto" (define:18). Falta la interfaz Contratos→Control que consume E-53 en E-14/E-33 (restricciones de disponibilidad). Misma mecánica que C2-05. Sin contrato, repite la muerte de `score_conversion` (I-005). | Contratos → Control (E-53 viajes → motor) | define:18; discover:56; define:95-105 |
| C2-09 | OK_CON_DOC | E-08 (pago diseño 3D) bien resuelta: el movimiento y la cuenta de cobro del diseñador viven en Finanzas (E-32 autogenerada desde E-08/E-31; lectura en E-58). Single source mata P3-03. Solo falta la fila Comercial→Finanzas (E-08) en la tabla §5. | Comercial → Finanzas (E-08/E-32) | define:107; discover:43; discover:105; panorama:131 |
| C2-10 | OK_CON_DOC | E-51 lead→cliente: la identidad del cliente la posee Comercial (E-51, mismo registro, sin duplicado); Contratos recibe "identidad cliente" por frontera declarada. Refinamiento: la identidad del cliente es shared kernel consumida por Contratos, Finanzas (E-28), Garantía (E-36), Entrega (E-26) y Tienda (E-44, P3-11) — declarar Comercial como dueño del master, resto referencia por ID. | Comercial → Contratos (identidad cliente) + shared kernel | define:97; define:33; discover:48; discover:147 |
| C2-11 | CORRECCION | Wording desincronizado de E-23: el mapa (logica:282) y el inventario (discover:82) dicen "citación de calidad push hacia Comercial"; el Define §4.1/§5 dice Taller→Calidad. Misma realidad (verificador único puede ser el comercial, I-035/I-043), pero el destino de la notificación es ambiguo para el loop 2. Corregir el inventario al converger + reconciliar el mapa vía loop focalizado (checkpoint Supervisor, mutación del arnés). | Taller → Calidad (E-23 citación) | logica:282; discover:82; define:102; define:75 |
| C2-12 | DIFERIDO | Interfaces de contextos capa 2/backlog: Marketing (E-40/E-42/E-55), Tienda (E-44→pipeline), Gobierno (E-47), y Desarrollo→Taller (E-17 órdenes de armado→E-22). El Define §8 las difiere correctamente ("se diseñan las interfaces de frontera"); registrar que E-44 (Tienda→producción, P3-11) y E-17→E-22 son fronteras reales que no deben olvidarse al abrir esos contextos. | Tienda→pipeline; Desarrollo→Taller; contextos backlog | define:148-150; discover:147; discover:65 |
| C2-13 | CORRECCION | Notación de la fila §5 "Contratos → Control: E-13/E-14 firmado + estimación" (define:98): mezcla el evento de frontera (E-13, emisor) con eventos internos del consumidor (E-14 y E-52 viven en Control, define:38). Todas las demás filas listan solo el evento de frontera. Corregir a "Contratos → Control: E-13 firmado (input; E-14/E-52 son eventos de Control que lo consumen)". | §5 fila Contratos→Control (cosmética) | define:98; define:37; define:38 |

---

## Notas para el Orquestador / Define

**Validación positiva (no forzar hallazgos):** los 9 contratos declarados en §5 están bien formados — explícitos, unidireccionales, con evento de frontera existente en el inventario y dueño claro (los gates en §4.1 y los emisores en §5). No hay ciclo de interfaz directo entre contextos; el ciclo dinero→cronograma (RED3, H-03) es de negocio y está mediado por Compras/E-59 — no crear un contrato directo Finanzas→Control o se duplica. Las resoluciones P3-01 (E-51), P3-03 (E-08 single source) y P3-04 (E-31 base + E-35 ajuste en Finanzas) se validan.

**Qué implica cada hallazgo para la convergencia (sin decidir todavía):**

- **C2-01 y C2-07 (tabla §5 incompleta):** el loop 2 debe ampliar la tabla de integraciones, o declarar una sección "interfaces de lectura/derivación" aparte de las de escritura. Sin esto, los flujos omitidos se implementan ad hoc y las fronteras se vuelven porosas. Es el hallazgo más estructural de esta pasada.
- **C2-02 (P3-02):** la resolución es correcta como dirección pero necesita dos decisiones en el loop 2: (a) dueño dual del hito (spec en Contratos, ciclo de vida en Finanzas), (b) single-source-of-truth del estado de pago (la vista del contrato debe ser proyección de la obligación de Finanzas, no una columna de estado en `hitos_pago`). Si no, la duplicación de 4 namespaces (P3-02) y el patrón "dos verdades" (P3-12) reviven.
- **C2-03, C2-04, C2-05 (read-models sin contrato):** son los "contextos que se hablan por teléfono". La recomendación de diseño (no decidida acá): modelarlos como proyecciones event-sourced con dueño declarado (el contexto lector posee su proyección; el contexto fuente publica eventos). C2-03 además toca la frontera capa 1/capa 2 aprobada por el Supervisor: el check de 15 días necesita la fila del taller (dato de capa 2) en capa 1 — decisión de diseño: derivar la fila de los eventos de frontera o hacer una lectura mínima de capa 2.
- **C2-06 (E-54):** las ramas negativas son fronteras igual que las positivas. El "quién se entera" del reproceso debe ser un evento tipado (Calidad→Desarrollo, Entrega→Desarrollo, Desarrollo→Control), no una notificación informal.
- **C2-08 (E-53):** declarar el consumo para evitar el campo muerto; es la misma mecánica que C2-05 y vale la pena resolverlos juntos como "Contratos y Comercial alimentan el motor de cronograma".
- **C2-09/C2-10:** validaciones. Solo falta que la tabla §5 las liste (E-08, identidad cliente) y que se declare el shared kernel de la identidad del cliente (dueño: Comercial).
- **C2-11/C2-13:** correcciones de wording, se aplican al converger el inventario; C2-11 requiere mutación del mapa → loop focalizado con checkpoint del Supervisor (regla del arnés).
- **C2-12 (DIFERIDO):** no bloquea; registrar E-44→pipeline y E-17→E-22 como fronteras pendientes de abrir con la palanca de demanda (t-034).

**Frontera "mal resuelta" (checkpoint):** ninguna es contradictoria ni invalida el Define. La más cercana a requerir decisión es **C2-03** (E-59 leyendo la fila del taller de capa 2 en capa 1), porque cruza la división capa 1/capa 2 que aprobó el Supervisor — se recomienda que el Define/loop 2 la resuelva explícitamente (derivación vs. lectura mínima) y, si toca la división de capas, se lleve al Supervisor.

---

