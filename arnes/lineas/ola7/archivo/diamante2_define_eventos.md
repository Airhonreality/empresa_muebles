# Diamante 2 · Define — convergencia de eventos a bounded contexts

**Qué es esto:** el cierre del segundo diamante (Fase 2) sobre el inventario de **61 eventos** (`diamante2_discover_eventos.md`). Converge los eventos en **bounded contexts**, decide las **fronteras de los gates** (E-18/E-21/E-23/E-33), el **enforcement** y las **precedencias** que las 7 pasadas dejaron como material del Define. De aquí emergen las interfaces entre contextos; el schema/UI concreto es el segundo ciclo abrir/cerrar (loop 2 de diseño), que se abre cuando el Supervisor apruebe este documento.

**Estado: CONVERGIDO Y APROBADO (checkpoint 2026-08-03).** El Supervisor resolvió el paquete completo de decisiones (D1-D8, C1-C3, B2) y autorizó pasar a **detalle de schemas/UI (loop 2 de diseño)** y luego levantar código. Este documento NO es schema ni UI.

**Aprobación:** el Supervisor aprobó abrir el Define (2026-08-03) tras la auditoría del Orquestador: "se abre el Define — los VACÍO que quedan son parámetros, no bloquean". **Checkpoint de decisiones resuelto el 2026-08-03** (ver §6 y §7).

**Entradas:** inventario 61 eventos, panorama P2-P8 (`pasadas/diamante2_panorama_consolidado.md`), decisiones del Supervisor I-024..I-043 (`log_insights_fase2.md`), cierre del diamante 1 (`cierre_diamante.md` §4 bounded contexts), loop 2 (A1-A12), mapa (`logica_de_negocio.md`).

---

## 1. Decisiones del Supervisor que este Define asume (no se reabren)

| Decisión | Insight | Efecto en el Define |
|---|---|---|
| Promesa contractual de **7 semanas**, entregable antes | I-024 | Ancla E-14/E-11; el cronograma del contrato calcula hacia 7 semanas, no "15-20 días" |
| **Cuestionario de viajes/situaciones** del cliente al cerrar contrato | I-024 | Campo estructurado en Contratos (E-53) con consumidor en el motor de cronograma (riesgo: campo muerto si no se consume) |
| **Check de los 15 días** con log de producción y 3 desenlaces | I-025 | Evento E-59 del Control de cronograma; input: insumos en taller, comprados/pagados, fila del taller |
| **Cronograma DOBLE** — línea interna (movible) + línea contractual (inmutable) | I-034 | E-14/E-33 modelan dos líneas; la comunicación al cliente (E-60) solo ve la contractual + adelantos |
| **Verificador único** designado (comercial o gerente) | I-035 | Los gates E-18/E-24 tienen un rol de autorización, no un pool |
| **Sin conflicto de interés** — comisión comercial por ventas, no por producción | I-043 | E-31/E-35: el comercial no queda acoplado al cronograma; solo el desarrollador (5%) |
| **Flow organizado de cambios de contrato** — tercer origen de causa en E-33 | I-027 | E-16: adicional con tiempo propio / cambio con impacto medible / reproceso con costo al cliente |

---

## 2. Bounded contexts emergentes (61 eventos agrupados)

Base: tabla del cierre §4 + **3 contextos nuevos** que resuelven los 5 eventos sin hogar que P6-03/P6-04 señalaron (E-40, E-42, E-44, E-45, E-47). El contexto central sigue siendo **Control de cronograma** (el pegamento del sistema).

| Bounded context | Eventos | Qué agrupa | Nota de frontera |
|---|---|---|---|
| **Comercial / Cotizador** | E-01..E-07, E-09..E-11, E-46, E-48, E-49, E-50, E-51 | Embudo de demanda (llegada→atención→calificación→visita→diseño 3D→presupuesto→ajustes→cotización), lead→cliente, SLA de primera respuesta | El rol comercial es el más cargado (P4-F5); el contexto absorbe la transición de identidad lead→cliente (E-51, P3-01). **E-08 (pago del diseño 3D) queda fuera de acá**: lo dispara el flujo comercial pero el movimiento financiero nace en Finanzas — frontera (§5) |
| **Marketing / Demanda** ⚠ **NUEVO** | E-40, E-42, E-55 | Conversión offline→Google Ads, medición de embudo, testimonio/reseña curada | **Resuelve P6-03 parcial**: E-40 y E-42 dejan de ser huérfanos. Es la palanca de demanda (H1-H8); hoy es código/backlog, no se diseña hasta cerrar t-034 |
| **Tienda web** ⚠ **NUEVO** | E-44 | Pedido de tienda → enganche al pipeline de producción | **Resuelve P6-03 parcial**: E-44 deja de ser huérfano. Línea de negocio propia; comparte el taller (H-05 tragedy of the commons) |
| **Gobierno / Medición** ⚠ **NUEVO** | E-47 | KPIs operativos (proyecto/semana, ciclo, caja, bienestar) | **Resuelve P6-03 parcial**: E-47 deja de ser huérfano. Consume datos de todos los contextos; capa de lectura, no de escritura |
| **Contratos** | E-12, E-13, E-16, E-53 | Contrato, firma, flow de cambios (I-027), cuestionario de viajes | La firma virtual (RED2) es precondición del rol más activo (P4-F7), no decoración |
| **Control de cronograma** ⭐ | E-14, E-33, E-34, E-52, E-59, E-60 | Fijación del cronograma, cambio con causa (tercer origen), novedad crítica con SLA, estimación, check de 15 días, comunicación frontstage | Contexto central. **La comunicación frontstage (E-60) unifica los 3 eventos sueltos de P5-01/P5-02/P5-10** |
| **Desarrollo** | E-15, E-17, E-18, E-54 | Retoma de medidas, desarrollo técnico, gate de schema, reproceso | E-18 es el gate de frontera con Compras (dueño decidido en §4) |
| **Compras** | E-19, E-20, E-21, E-45 | Pedido, pago a proveedor con gate de caja, recepción triple, reposición de herramientas | **E-45 resuelve P6-04**: la reposición operativa vive acá (compras no-atadas-a-proyecto, vista por proveedor) |
| **Taller / Armado** (capa 2, diferida) | E-22 (solo frontera) | Órdenes de armado por módulo, tareas | Se anticipa el evento de frontera; el detalle interno queda diferido (capa 2) |
| **Calidad / Verificación** | E-23, E-24 | Citación de calidad (push), veredicto pre-despacho | Verificador único (I-035); sin conflicto de interés (I-043) |
| **Entrega / Instalación** | E-25, E-26 | Instalación (rango 5 días), acta de entrega | El desenlace feliz del check de 15 días insinúa la instalación (E-25) |
| **Garantía** | E-36, E-37, E-61 | Agenda de garantía (8-12 días), orden de garantía, check de completitud | E-61 evita las 2-3 vueltas del instalador (F-11) |
| **Finanzas / Compensación** | E-08, E-27..E-32, E-35, E-43, E-56, E-57, E-58 | Obligaciones, cobros, deducción diseño 3D, compensación por rol, comisiones, caja, arriendos, cuenta por socio | E-08 y E-35 son fronteras (ver §5); E-56 resuelve el nacimiento de la obligación (P3-02) |
| **Documentación** | E-41 | Foto/documento por etapa | Sin rol de captura definido (P4-F8 VACÍO — ver §6) |
| **Integraciones (producción)** | E-38, E-39 | Traducción schema→modelo 3D (Veta Designer), CVC→corte | Precedencia: solo con schema aprobado (E-18) |

**Eventos por contexto — verificación de completitud (61/61):** Comercial/Cotizador 15 (E-01..E-07, E-09..E-11, E-46, E-48, E-49, E-50, E-51) + Marketing/Demanda 3 (E-40, E-42, E-55) + Tienda web 1 (E-44) + Gobierno/Medición 1 (E-47) + Contratos 4 (E-12, E-13, E-16, E-53) + Control de cronograma 6 (E-14, E-33, E-34, E-52, E-59, E-60) + Desarrollo 4 (E-15, E-17, E-18, E-54) + Compras 4 (E-19, E-20, E-21, E-45) + Taller 1 (E-22) + Calidad 2 (E-23, E-24) + Entrega 2 (E-25, E-26) + Garantía 3 (E-36, E-37, E-61) + Finanzas 12 (E-08, E-27..E-32, E-35, E-43, E-56, E-57, E-58) + Documentación 1 (E-41) + Integraciones 2 (E-38, E-39) = **61**.

**Identidad compartida (C1-01):** Comercial, Contratos y Control de cronograma comparten **una sola identidad evolutiva lead → cliente → proyecto**. No es dato duplicado entre contextos: es el mismo registro que cambia de estado, y Finanzas la usa como referente del dinero sin poseerla.

---

## 3. Modelo rol-vs-persona (precondición de guards — P2-12, P4-F2/F4)

**Decisión del Define:** el sistema modela **roles tipados** y **personas** por separado; la asignación persona→rol es explícita, y **una persona puede ocupar varios roles** (hoy comercial = diseñador, el solapamiento real que P4-F1 destapó). Los guards de autorización se evalúan contra el **rol**, nunca contra la persona.

- Roles tipados: comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente, **verificador** (rol asignado por despacho a UNA persona, I-035).
- **E-33 clasificador de causa** (P4-F2): asignar un actor respondiente explícito (rol) — propuesta: **gerente o comercial**, decisión de negocio pendiente con el Supervisor (queda marcada en §7).
- Sin roles tipados no hay separación ejecutor-verificador (P4-F4) ni compensación por rol (E-31) ejecutables. **Este modelo es requisito de todos los guards del §4.**

---

## 4. Fronteras de los gates y patrón de enforcement

Las 7 pasadas coinciden: **ningún hallazgo cambia bounded contexts ni gates** (P6 nota 7). El Define solo decide **de quién es cada gate** y **qué patrón de enforcement** usa.

### 4.1 Patrón de enforcement (decisión P2, contexto por contexto)

**Decisión del Define:** los gates usan **máquina de estados con guard** — el estado no transiciona sin el guard — y la rama negativa de cada uno es un **evento de rechazo explícito** (E-54 reproceso). No hay "instrucción que se respeta si se quiere" (A3: el dueño mismo se salta sus protocolos). **Resuelto por el Supervisor (checkpoint 2026-08-03):** el sistema es **guía + registrador de la realidad**, no una camisa de fuerza — si la guía no se cumple, avanza y registra, permite el cambio, pero no cambia flows.

| Gate | Dueño (contexto que impone el guard) | Guard | Rama negativa |
|---|---|---|---|
| **E-18** check de schema pre-compras | **Compras** (no crea pedido sin schema aprobado) | transición `desarrollo → aprobado_compras` exige veredicto del **verificador único** — **resuelto: el comercial vendedor** (D3, I-035) | E-54 reproceso (desarrollo corrige; cronograma se recalcula — enlaces a E-33) |
| **E-21** recepción triple verificación | **Compras → Taller** (el proyecto no pasa a control del taller sin el check completo) | **checklist de la lista de compra esperada** (C3): cada ítem llegó del tipo y cantidades correctas + sin defectos en el producto recibido → `recibido_verificado`. Al completarlo, **el control total pasa al desarrollador sobre el proceso en taller**; dinero y novedades de otros departamentos ya no pueden afectar al taller (tiene todo para trabajar) | E-54 reproceso por **rastreo de origen** (D2): el reproceso lo asume el **culpable causante del error** (proveedor → cambia el material a su costo; planos malos → desarrollador; requerimiento mal definido → comercial) |
| **E-23** citación de calidad | **Taller → Calidad** (push, no lo agenda Comercial) | señal de ventana de calidad, no bloquea por sí sola | — (se resuelve en E-24) |
| **E-24** veredicto pre-despacho | **Calidad** (no se despacha sin veredicto) | veredicto del **verificador único — comercial** (D3) antes del despacho | — (instalación solo con veredicto positivo) |
| **E-33** cambio de cronograma con causa | **Control de cronograma** | ninguna fecha se recalcula **sin causa estructurada** (interno / externo / **cambio de contrato** I-027 + motivo). **Resuelto (D4): la clasificación interna/externa es un atributo, NO el determinante** — el determinante es la **composición causal de dependencias lógicas** que traza el origen; si hace falta, **decisión manual justificada** | causa interna → E-35 comisiones se reducen; el dato es auditable |

### 4.2 Corrección de precedencia que el Define detectó (P5-09)

El cronograma del contrato lista las etapas como "**compras → aprobación → ensamblaje → instalación**", pero E-18 (aprobación de schema) **precede a** las compras. **Decisión del Define:** la lista de etapas del cronograma se corrige a "**aprobación (check de schema) → compras → ensamblaje → instalación**". Esta corrección toca el contrato vivo (Parte I) → **aplicada al mapa el 2026-08-03 con checkpoint del Supervisor**.

### 4.3 Precedencias ocultas que quedan declaradas (P5-09, P5-13)

- **Dinero disponible → E-20** (RED3): el pago a proveedor no ocurre sin caja real (E-43). **Resuelto por el Supervisor (D1, 2026-08-03): el gate de caja es COMPLETAMENTE BLOQUEANTE** y la respuesta es del gerente, que mueve cronogramas. Ejemplo real dado: no hay dinero → compras se retrasa 1 semana → el cronograma de producción se mueve 1 semana; la compra real ocurre 2 semanas después → el cronograma de producción se mueve otra semana → producción entrega al tiempo estimado o 2 semanas después → **producción cumple KPI y recibe comisión** (la penalización cae donde está el origen, no en el eslabón sano). Escenario 2: producción recibe material 2 semanas tarde y había acordado 2.5 semanas de ensamble e instalación → tarda 3.5 semanas → diferencia: 2 semanas extra de compras + 1 semana extra de producción → **producción penalizada 1 semana, compras penalizada 2 semanas**; no se cruzan intereses ni fronteras. **El cronograma es dinámico y responde a cualquier novedad: la planeación no significa que el sistema se bugee; es guía + registrador de la realidad.**
- **E-18 → E-38/E-39**: no se traduce a modelo 3D ni se corta sin schema aprobado (precedencia, no guard).
- **E-16 → E-33**: el cambio de contrato recalcula el cronograma (causa "cambio de contrato").
- **E-08 → E-30**: la deducción del diseño 3D exige el pago registrado (el sistema lo hace, no la memoria — H-10).

---

## 5. Interfaces entre contextos (lo que emerge de los gates)

Los eventos de frontera son los contratos entre contextos. Los que el loop 2 de diseño debe implementar como integraciones:

| De → A | Evento de frontera | Contrato |
|---|---|---|
| Comercial → Contratos | E-11 cotización formal + E-51 lead→cliente | cotización aprobada + identidad cliente |
| Contratos → Control de cronograma | E-13/E-14 firmado + estimación | contrato firmado + cronograma inicial |
| Control de cronograma → Finanzas | E-33 causa de desfase | causa auditable → cálculo de comisiones (E-35) |
| Desarrollo → Compras | E-18 veredicto de schema | guard de apertura de pedidos |
| Compras → Taller | E-21 recepción triple | guard de transferencia de control |
| Taller → Calidad | E-23 citación (push) | señal de ventana de verificación |
| Calidad → Entrega | E-24 veredicto | guard de instalación |
| Finanzas → Compras | E-43 dinero disponible | guard de pago a proveedores (RED3) |
| Control de cronograma → Comercial | E-60 comunicación frontstage | progreso visible (único mecanismo frontstage) |
| Comercial → Control de cronograma | E-52 estimación | disparada en Comercial, fijada/consumida en Control (C2-05, C6-02) |
| Contratos → Control de cronograma | E-53 cuestionario de viajes | consumidor tipado E-14/E-33 — evita el campo muerto de I-005 (C2-08, C3-02, C5-04) |
| Taller → Control de cronograma | fila del taller (avance por módulo) | input de E-59/E-34 — fila de salida del taller en capa 1 (B2, resuelta 2026-08-03) |
| Desarrollo → Compras | E-17 BOM de materiales | interfaz doble con E-18: guard (E-18) + datos (BOM, P3-05) (C2-07) |
| Contratos → Desarrollo | E-16 adicional (schema) | destino 1 del doble destino de I-027: adicional con tiempo propio (C5-02) |
| Contratos → Finanzas | E-16 adicional (costo) | destino 2 del doble destino de I-027: costo del adicional (C5-02) |

**Nota de frontera de las ramas negativas (C1-06, C2-06, C3-01, C4-02):** las ramas negativas de los gates son fronteras tanto como las positivas — E-54 (reproceso) es la interfaz Desarrollo→Control de cronograma (recalculo, enlace a E-33). **Resuelto por el Supervisor (C2, 2026-08-03): la granularidad del reproceso es módulo/componente específico** — un módulo rechazado **frena el proyecto entero** (codependencia sistémica), pero el reproceso se procesa **exactamente el requerimiento sobre el módulo y componente específicos** (o módulos si el reproceso de calidad es grande). Todo rechazo recalcula el cronograma (E-33).

**Nota de frontera Taller → Control de cronograma (B2, resuelta 2026-08-03):** el check de los 15 días (E-59) y la novedad crítica (E-34) leen **la fila del taller** (avance por módulo). **Decisión del Supervisor: diseñar de una vez, no postergar** — se diseñan en capa 1 los aspectos de capa 2 que sean **bloqueantes** (la fila de salida del taller: qué módulos están en qué estado), sin pantallas de carpinteros; el detalle interno del taller queda en capa 2. Son los eventos clave que cierran el círculo de la capa 1.

**Frontera E-08 (pago del diseño 3D):** lo dispara el flujo comercial (cliente paga pre-contrato) pero el movimiento financiero y la cuenta de cobro del diseñador **nacen en Finanzas** — Comercial solo registra el hecho, Finanzas crea el dinero y el documento (A7, P3-03 doble nacimiento con E-32).

**Nota de frontera P3-02** (el dinero del cliente cruza Contratos↔Finanzas): la obligación nace en **Finanzas** (E-56) con los hitos del contrato como especificación — Contratos no crea el dinero, lo declara; Finanzas lo administra. Se resuelve como frontera acá (no reabre el esqueleto).

---

## 6. VACÍO — RESUELTOS por el Supervisor (checkpoint 2026-08-03)

Son parámetros de configuración, no estructura. **El Supervisor resolvió TODO el bloque en el checkpoint del 2026-08-03 — incluidos los 6 valores numéricos** (ventana SLA, consecuencia 12 días, destino lead no viable, consecuencia SLA novedad, % carpintero, neto diseñador). Solo el **valor real de la retención del diseñador (± IVA) queda pendiente de validación con el contador**, modelado como parámetro configurable con estimado provisional:

| VACÍO | Origen | Resolución del Supervisor (2026-08-03) |
|---|---|---|
| SLA de primera respuesta (E-50) | P8 F-7 | **RESUELTO (2026-08-03):** envío de cotización sin duda (D8); **ventana SLA = 5 minutos**; si se excede → **escalación automática a IA (LLM)** con registro del incumplimiento; si no hay LLM → **escala a segundo comercial con notificación** |
| Consecuencia tras 12 días de atraso (E-29) | P8 F-12 | **RESUELTO (2026-08-03):** pasado el día 12 sin pago → **aviso automático al gerente** (decide: llamada, carta, pausa). Prioridad baja, no bloquea |
| Presupuesto preliminar no viable (E-49) | P8 F-8 | **RESUELTO (2026-08-03):** el lead **se pierde** del flujo activo, **solo se registra** el motivo de no viabilidad (dato para el embudo) |
| Consecuencia del SLA de novedad crítica (E-34) | P2-9 | **RESUELTO (2026-08-03):** si se excede la ventana → **registro + visibilidad del gerente + escalación automática** (el gerente entra en la responsabilidad del incidente); sin multa automática |
| Gate de caja (E-20) | P2-2 | **RESUELTO (D1):** bloqueante; lo resuelve el gerente moviendo cronogramas; el sistema registra y recalcula (ver §4.3) |
| Rama negativa de E-21 | P2-3 | **RESUELTO (D2):** rastreo de origen — el reproceso lo asume el culpable causante (proveedor / desarrollador / comercial) |
| Rol de captura de E-41 (documentación) | P4-F8 | **RESUELTO (D5):** el comercial define todo el proyecto; **el desarrollador define también en retoma** (levantamientos de espacio, notas de retoma, medidas de electrodomésticos, obstáculos) — ambos acotan información en el schema al mismo tiempo |
| Actor respondiente de E-33 clasificador | P4-F2 | **RESUELTO (D4):** la clasificación interna/externa es solo un atributo, no el determinante; el determinante es la **composición causal de dependencias lógicas** que traza el origen; si hace falta, **decisión manual justificada** |
| No-show de visita (E-46, V-1) | loop A-3 / mapa:514 | **RESUELTO (V-1, 2026-08-03):** reagenda con límite — el lead vuelve a `calificado`, se reagenda UNA vez; si falla dos veces → `descartado` por no-show; el no-show queda registrado (fuga causal H-09) |
| Envío de cotización (E-11, V-4) | loop V-4 | **RESUELTO (D8):** sin duda — se envía. El envío se registra con su fecha (input del SLA E-50) |
| Horas de bienestar (E-47, V-5) | loop V-5 | **RESUELTO (D8):** el registro de horas es **automático** — se mide cuánto trabaja una persona vs. cuánto gana como KPI automático, no captura manual |
| Firma del cliente (E-13, V-6) | loop V-6 / RED2 | **RESUELTO (D8):** **subsistema verificado de firma digital** en el sistema, simple; precondición de capa 1 |
| % del carpintero "por tamaño" | cierre §9 | **RESUELTO (2026-08-03): 5% por tamaño** del proyecto + comisión por módulo instalado si cumple cronograma (simétrico al desarrollador) |
| Neto post-impuestos del diseñador | cierre §9 | **RESUELTO (2026-08-03):** se modela como **parámetro estimado configurable** ($130k bruto, retención ± IVA); **valor real pendiente de validación con el contador** antes del corte — el sistema calcula el neto desde el parámetro |

---

## 7. Decisiones de negocio — RESUELTAS por el Supervisor (checkpoint 2026-08-03)

Todas las decisiones de negocio que el Define dejó abiertas quedaron **resueltas en este checkpoint**. Lo que queda son valores numéricos configurables para el loop 2:

1. **Verificador único (I-035):** **RESUELTO (D3) — el comercial vendedor**, punto. No el gerente.
2. **Gate de caja (E-20):** **RESUELTO (D1)** — bloqueante; lo maneja el gerente moviendo cronogramas; sistema = guía + registrador de la realidad (ver §4.3).
3. **Clasificador de causa E-33 (P4-F2):** **RESUELTO (D4)** — interna/externa es atributo, no determinante; el determinante es la composición causal de dependencias que traza el origen; decisión manual justificada si hace falta.
4. **Rama negativa de E-21:** **RESUELTO (D2)** — rastreo de origen: reproceso lo asume el culpable (proveedor / desarrollador / comercial).
5. **Rol de captura de E-41:** **RESUELTO (D5)** — comercial define todo el proyecto; desarrollador define también en retoma (levantamientos, notas, medidas, obstáculos).
6. **SLA de primera respuesta (E-50):** **RESUELTO (2026-08-03)** — ventana **5 minutos**; si se excede → **escalación automática a IA (LLM)** con registro; si no hay LLM → **segundo comercial con notificación**.
7. **Consecuencia del SLA de novedad crítica (E-34):** **RESUELTO (2026-08-03)** — registro + visibilidad del gerente + escalación automática; sin multa automática.
8. **I-014 (restauración de pisos) / I-021 (B2B por m²):** **RESUELTO (D7)** — se mueven al flow de **estrategia de mercado** (t-034), anotadas como log en su flow de diamantes; no son parte del core.
9. **Palanca de demanda (H5-H8):** sigue en t-034 (línea de demanda), no bloquea el core.
10. **Pendientes financieros del cierre §9:** **RESUELTOS (2026-08-03)** — % del carpintero = **5% por tamaño** + módulo instalado; neto del diseñador = **parámetro configurable** con retención ± IVA **pendiente de validación con el contador** antes del corte.

---

## 8. Capa 1 vs. capa 2 (filtrado "qué se construye ahora")

**Capa 1 — se diseña en el loop 2 (schema/UI):**
- Comercial/Cotizador (embudo + cotización), Contratos, Control de cronograma (el contexto central), Desarrollo (hasta el gate E-18), Compras, Calidad, Entrega, Finanzas/Compensación, Documentación, Garantía (orden simple), integraciones de producción (E-38/E-39 como fronteras).
- **Taller: su fila de salida (avance por módulo) SÍ es capa 1** (decisión B2, 2026-08-03) — es input de E-59/E-34, los eventos que cierran el círculo de la capa 1. Sin pantallas de carpinteros; solo la fila de estado por módulo.

**Diferido (capa 2 u otro alcance):**
- Taller interno (E-22 detalle, manual ISO, pantallas de carpinteros, novedades de planta: mal manejo de herramientas, daños por mal manejo, mal armado del carpintero — son responsabilidad del subsistema taller, C3).
- Marketing/Demanda, Tienda web, Gobierno/Medición → **se diseñan las interfaces de frontera** (E-40/E-42/E-44/E-47/E-55) pero su construcción es backlog de la palanca de demanda (t-034), no parte del core.

**Precondiciones de capa 1** (P4-F7): firma virtual (subsistema verificado de firma digital, D8) y pasarela de pago van junto a los gates — no son decoración, son lo que desbloquea al rol más activo. **Rol-vs-persona (§3) es precondición de capa 1** — sin roles tipados no hay guards de autorización (P4-F4) ni compensación por rol (E-31); va junto a la primera UI de guards (C6-05).

**KPI de capa 1 (corregido 2026-08-03):** cada KPI mide un subsistema y ninguno es residual — **KPI de 4 semanas → comisión 5% para desarrollador Y carpintero** (producción); **KPI de ventas → comisión del comercial**; **KPI de 7 semanas → el cliente recomienda Veta Dorada** (entrega/promesa). El cronograma acordado se estima por **factores de tamaño** del proyecto (base: 1 semana desarrollo + 1 compra + 1 ensamble + 1 instalación = 4 semanas promedio; un apartamento completo puede requerir 2 semanas de desarrollo y 1.5 de aprovisionamiento), acordado entre desarrollo y gerencia.

---

## 9. Lo que este Define NO decide

- No decide el schema ni la UI (es el loop 2 de diseño).
- No corrige `logica_de_negocio.md` por su cuenta **salvo vía loop focalizado con checkpoint del Supervisor**: la corrección de precedencia P5-09 y el set de KPI por subsistema **fueron aprobados y aplicados el 2026-08-03**.
- No reabre las decisiones I-024..I-043 (son contrato vivo ya integrado).

---

## Registro

- Fecha: 2026-08-03
- Estado: **Define convergido (61/61 eventos en bounded contexts), auditado por el ciclo C1-C6 y APROBADO por el Supervisor (checkpoint de decisiones 2026-08-03)**. Próximo paso del método: **loop 2 de diseño** (schema/UI) — detalle de schemas de capa 1 y luego levantar código.
- Resuelve: P6-03 (E-40/E-42/E-44/E-47 con contexto), P6-04 (E-45 en Compras), P5-09 (precedencia), P5-13, P2-12/P4-F2/F4 (rol-vs-persona), enforcement P2 (máquina de estados + E-54).
- **Ciclo C1-C6 (auditoría de la convergencia, 2026-08-03):** 6 pasadas agentivas ejecutadas (`pasadas/define_c1_cohesion.md` .. `define_c6_restriccion.md`), 55 hallazgos brutos, consolidadas en `pasadas/diamante2_define_consolidado.md`. **Veredicto: convergencia estructuralmente estable** (0 `PARTIR_CONTEXTO`, 0 `MOVER_CONTEXTO`, 61/61 eventos con hogar, 7/7 decisiones materializadas, 0 contradicciones silenciosas). Correcciones documentales aplicadas acá: identidad compartida (§2, C1-01), fila E-24 en §4.1 (C4-08), filas de interfaz B3/B5/B7/B9 y nota de ramas negativas (§5, C2/C3/C4/C6), precondición rol-vs-persona (§8, C6-05).
- **Checkpoint del Supervisor resuelto (2026-08-03):** D1 gate de caja bloqueante (guía + registrador, cronograma dinámico), D2 rastreo de origen del reproceso (culpable asume), D3 verificador único = comercial, D4 clasificador = composición causal + decisión manual justificada, D5 E-41 comercial + desarrollador en retoma, D6 set de KPIs por subsistema (4 semanas dev+carpintero 5% / ventas comercial / 7 semanas cliente), D7 I-014/I-021 → estrategia de mercado, D8 VACÍOs resueltos (V-1 reagenda con límite, V-4 envío, V-5 horas automáticas, V-6 firma digital), C1 adelanto sin penalizar (cronograma por factores), C2 granularidad módulo/componente, C3 E-21 checklist de compra → `recibido_verificado`, B2 fila del taller en capa 1.
- **Valores numéricos resueltos (2026-08-03):** SLA primera respuesta = **5 min** (escala a LLM + registro; sin LLM → segundo comercial notifica); atraso 12 días (E-29) = **aviso automático al gerente**; lead no viable (E-49) = **se pierde, solo se registra** el motivo; SLA novedad crítica (E-34) = **registro + visibilidad + escalación al gerente**, sin multa; % del carpintero = **5% por tamaño** + módulo instalado; neto del diseñador = **parámetro configurable** (retención ± IVA, **validar con el contador** antes del corte). **No quedan decisiones de diseño pendientes — el Define está completo.**
