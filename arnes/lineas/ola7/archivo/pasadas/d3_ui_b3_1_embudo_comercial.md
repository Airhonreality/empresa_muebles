# Pase B3-1 — Embudo comercial + cotizador (subagente, loop de 3 iteraciones)

**Lente:** diseño de alto detalle de las pantallas de la familia **B3-1** (embudo comercial + cotizador) según el contrato de formato de `diamante3_metodologia.md:110-123`.
**Rol:** sub-agente B3-1 del Diamante 3 (`met:49`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_consolidado.md` (sch_c: schema objetivo 65 tablas, predicados de gates §6) · `d3_ui_b2_2_pantallas_requeridas.md` (inv: inventario de pantallas) · `d3_ui_b2_1_destilacion_inv.md` (reg: 40 reglas B2-1) · `d3_ui_b1_1_ux_ergonomia.md` (ux: 28 principios B1-1) · `diamante2_define_eventos.md` (define) · `diamante2_discover_eventos.md` (discover) · `diamante3_metodologia.md` (met).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b3_1_embudo_comercial.md`.
**Vocabulario:** `met:98-107`. Trazabilidad `archivo:línea` en todo hallazgo. Escepticismo: nada de reglas de negocio inventadas; lo no escrito → `DECISION_PENDIENTE`.

---

## Iteración 1 (bruta)

Inventario de lo que la familia B3-1 debe cubrir, sin filtrar:

- **Pantallas del inventario** (`inv:107`): P-01 Embudo comercial, P-02 Ficha lead/cliente, P-03 Agenda, P-04 Cotizador, P-05 Contratos + F-01 Landing/lead, F-02 Propuesta, F-03 Agendar, F-08 Pago diseño 3D. 9 pantallas, 16 eventos (E-01..E-13, E-46, E-48..E-53).
- **Datos disponibles en el consolidado** (`sch_c:§1-2`): `leads` (embudo completo + gclid + SLA), `clientes`, `conversaciones`, `citas`, `visitas`, `proyectos` (estado extendido), `cotizaciones` (snapshot), `diseños3d` (precio sembrado de parámetro), `espacio_variantes`+`items_variante`, `productos_catalogo`, `contratos`, `hitos_pago`, `firmas_contrato`, `disponibilidad_cliente`, `cambios_contrato`.
- **Reglas que aplican** (`reg:R01-R40`): R01 arnés del operador, R02 vocabulario del taller/cliente, R03 dos lenguajes visuales, R04 preventa de olvido, R05 matemática en servidor, R06 rastreabilidad, R09 una tarea por pantalla, R11 reconocimiento sobre recuerdo, R12 constraints, R13 validación en línea, R16 gates con guard, R17 SLA como temporizadores, R25 input minimizado, R26 autoguardado, R29 un toque para avanzar el embudo, R30-R39 responsive/a11y.
- **Principios UX** (`ux:P01-P28`): P01 una tarea, P03 visibilidad de estado, P04 reconocimiento, P08 gates con guard, P13 input minimizado, P14 autoguardado, P17 SLA temporizadores, P19 un toque de embudo, P26 empty states, P28 confirmación destructiva.
- **Eventos y transiciones de embudo** (`define:51`): E-01 lead entra → E-02 primera respuesta (SLA 5 min) → E-03 califica → E-04 descarta/redirige → E-49 no viable → E-51 lead→cliente; E-06 agenda visita → E-07 visita → E-46 no-show; E-05 preliminar → E-48 diseño 3D → E-52 estimación → E-09/E-10/E-11 cotización → E-12/E-13 contrato → E-53 cuestionario de viajes → E-16 cambios.

**Conteo bruto:** 9 pantallas × 8 secciones del contrato = 72 bloques de especificación.

---

## Iteración 2 (autocrítica)

Dudo de mis decisiones de diseño una por una:

1. **¿P-02 es pantalla propia o detalle de P-01?** El inventario la marca `(nuevo)` con historial + calificación + SLA (`inv:45`). Con R09 (una tarea por pantalla) y R03 (progressive disclosure), una ficha de lead es la vista de decisión del comercial sobre un lead — sí es pantalla propia, profunda en historial, no un drawer.
2. **¿F-08 (pago 3D) es embebida en F-02?** El inventario la deja `PANTALLA_AMBIGUA → se recomienda embebido en F-02` (`inv:99`). La frontera define:120 ("Comercial solo registra el hecho, Finanzas crea el dinero") exige que el pago del cliente dispare E-08 pero el movimiento lo cree el backend de Finanzas. **Decisión: paso de pago embebido en la propuesta pública (F-02), no ruta propia.** El botón "Pagar diseño 3D" solo aparece si `diseños3d.estado='propuesto'`.
3. **¿El cotizador (P-04) es el MISMO formulario en todas las etapas?** El mapa dice que presupuesto preliminar → visita → diseño → cotización es EL MISMO artefacto (`ux:P13`; `reg:R25`). El consolidado lo soporta: `proyectos` con estados + `cotizaciones` con snapshot + `espacio_variantes`/`items_variante`. **Decisión: P-04 es un proyecto con estados de completitud, no pantallas separadas por etapa.** Los campos vacíos no bloquean; E-49 solo registra motivo.
4. **¿El SLA E-50 es temporizador en la tarjeta?** `reg:R17` y `ux:P17` lo exigen. `leads.sla_ventana_min` + `parametros.sla_primera_respuesta_min` (default 5). El temporizador muestra cuenta regresiva y al vencer el sistema escala solo (LLM o segundo comercial) y registra en `eventos` con payload. Esto es determinista y en servidor (`reg:R05`); la UI solo muestra el chip y el resultado.
5. **¿Qué pasa con `leads.destino_redireccion` (A3-C2)?** Al descartar/redirigir (E-04), la UI pide motivo (`motivo_no_viable`) y, si redirige, el destino (libre o de una lista). Columna incorporada al consolidado (`sch_c:§1`).
6. **¿El cuestionario de viajes (E-53) va al cerrar el contrato?** El inventario dice "P-05 al cerrar" (`inv:159`). `disponibilidad_cliente` es tabla (`sch_c:§2`). **Decisión: paso post-firma dentro del flujo de P-05** (se marca como pendiente si no se completa; no bloquea la firma).
7. **Autocrítica sobre datos que NO debo inventar:** los textos de los contratos (I-027 flow de cambios) los especifico como flow, no como copy legal; la pasarela de pago es externa (Wompi/etc.) → `DECISION_PENDIENTE` de proveedor; el agendamiento híbrido IA vs humano (`inv:H-B2-2-10`) → `DECISION_PENDIENTE`.

**Resultado:** las 9 pantallas se mantienen; F-08 se embebe en F-02; P-04 se especifica como artefacto evolutivo; el resto queda con el alcance del inventario.

---

## Iteración 3 (refinamiento final)

Decisiones depuradas que gobiernan las 9 pantallas:

- **Vocabulario de negocio (R02):** "Lead", "Cliente", "Visita", "Retoma", "Propuesta", "Diseño 3D", "Contrato", "Anticipo", "Esquema (schema)" — labels del taller/cliente, nunca nombres de tabla.
- **Backstage/frontstage (R03):** P-01/P-02/P-04/P-05 muestran el embudo completo y la línea interna; F-01/F-02/F-03/F-07/F-08 muestran solo lo que el cliente decide (línea contractual + cambio positivo, E-60).
- **Determinismo en servidor (R05):** el total del cotizador, el SLA, el descuento E-30 y la calificación se calculan en `lib/modules/*`; la UI consume resultados (mapeo de datos fuente = cálculo).
- **Gates:** B3-1 no tiene gates de ejecución (E-18/E-21/E-24/E-33/E-20 viven en B3-2/B3-3); el único guard es de superficie: lead no viable (E-49) y la transición E-51 lead→cliente. Confirmación destructiva R18 para "Descartar lead" (irreversible con motivo).
- **Responsive:** R30-R39 — móvil-first, 3 breakpoints, Familia B (embudo = cards en base), CTA primario en tercio inferior, objetivos ≥48px, reflow 320px.

---

## Entregable: especificación de pantallas (9)

> Convenciones: `sch_c:` = consolidado · `reg:` = B2-1 reglas · `ux:` = B1-1 principios · `inv:` = B2-2 inventario. Los nombres de columnas son los del schema objetivo (snake_case). Formato según `met:110-123`.

### P-01 — Embudo comercial (kanban de leads)

**1. Encabezado**
- Nombre: Embudo comercial. Ruta: `/app/erp/comercial` (existe, extiende — `inv:44`).
- Bounded context: Comercial/Cotizador. Rol: comercial, gerente (`inv:44`).
- Eventos que cubre: E-01, E-02, E-03, E-04, E-49, E-50, E-51.

**2. Wireframe estructural**
```
┌ Header: [Embudo comercial] [Filtros: estado/canal/fecha] [Buscar lead ⌕] ───────┐
├────────────────────────────────────────────────────────────────────────────────┤
│ [Kanban: columnas por estado]                                                  │
│ ┌ Nuevos │ ┌ En contacto │ ┌ Calificados │ ┌ No viables ┐                     │
│ │ card   │ │ card (SLA)  │ │ card        │ │ card       │                     │
│ │ card   │ │ card (SLA)  │ │ card        │ │ card       │                     │
│ └────────┘ └─────────────┘ └─────────────┘ └────────────┘                     │
├────────────────────────────────────────────────────────────────────────────────┤
│ [Empty state: "Captura tu primer lead desde el formulario público" → CTA]      │
└────────────────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento E-XX | Transición de estado | Guard (rol) | Rama negativa / error | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Tarjeta de lead (click) | card-link | — | → P-02 (ficha) | comercial/gerente | — | — | — |
| Avanzar a "En contacto" | botón | E-02 | `leads.estado: nuevo→en_contacto`; ancla `hora_primera_respuesta` | comercial | — | requiere `hora_primer_contacto` presente (auto) | si no hay teléfono/email |
| Avanzar a "Calificado" | botón | E-03 | `leads.estado: en_contacto→calificado`; graba `score_conversion` | comercial | — | requiere score 1-10 | si estado≠en_contacto |
| Descartar | botón (rojo) | E-04 | `leads.estado→descartado` + `motivo_no_viable` | comercial | modal R18 con motivo requerido | motivo requerido | si estado≠en_contacto/calificado |
| Redirigir | botón | E-04 | `leads.estado→redirigido` + `destino_redireccion` | comercial | modal con destino requerido | destino requerido | — |
| Marcar no viable | botón | E-49 | `leads.estado→no_viable` + motivo | comercial | — | motivo requerido | si ya es cliente |
| Crear cliente | botón | E-51 | `leads.estado→cliente` + `cliente_id` FK + `procedencia(cliente←lead,E-51)` + `clientes.etapa_funnel='cliente'` | comercial | — | requiere estado=calificado | si estado≠calificado |
| Menu contextual (… por lead) | menú | — | reasignar comercial (bulk), ver historial, WhatsApp | comercial/gerente | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Nuevos" / "En contacto" / "Calificados" / "No viables" | encabezados de columna kanban (R02 vocabulario) |
| Chip SLA: "Faltan 2:14 min" / "SLA vencido — escalado a LLM" | en la tarjeta `en_contacto` (R17); escalación automática al vencer (E-50) |
| "Captura tu primer lead desde el formulario público" | empty state primera vez (P26) |
| "No hay leads en esta columna" | empty state sin datos |
| "Limpiar filtros" | filtro sin resultados |
| "Lead descartado" / "Lead redirigido a {destino}" | toast `role="status"` tras E-04 |
| "SLA incumplido — se escaló a {LLM|segundo comercial}" | toast `role="alert"` al vencer (E-50) |

**5. Mapeo de datos (TABLA)**

| Campo visual | entidad.columna (schema objetivo) | Formato | Fuente |
|---|---|---|---|
| Nombre del lead | `leads.nombre` | texto | E-01 (F-01) |
| WhatsApp | `leads.telefono_whatsapp` | teléfono | E-01 |
| Canal | `leads.canal` | texto/enum | E-01 |
| Score | `leads.score_conversion` | entero 1-10 (S-01) | E-03 (manual) / E-42 (derivado) |
| SLA restante | `leads.hora_primer_contacto` + `parametros.sla_primera_respuesta_min` (default 5) | tiempo | cálculo servidor (R05) |
| Etapa | `leads.estado` | enum embudo | E-01..E-04, E-49, E-51 |
| Estado de escalación | `leads.escalacion_sla` | jsonb | sistema (E-50) |
| Destino de redirección | `leads.destino_redireccion` (A3-C2) | texto | E-04 |
| Cliente ligado | `leads.cliente_id → clientes.id` | uuid | E-51 |
| GCLID | `leads.gclid` | texto | E-01 (F-01, DIFERIDO t-034) |

**6. Máquina de estados del gate** — Sin gates de ejecución. Guard de superficie: la transición E-51 (lead→cliente) solo se habilita con `estado=calificado` (R16; botón deshabilitado con razón visible "Califica el lead primero").

**7. Responsive + accesibilidad (R30-R39)**
- <768px: kanban colapsa a lista vertical de cards (Familia B, R34) con el mismo orden de datos; CTA de la tarjeta en el tercio inferior (R35).
- 768-1023px: kanban de 2 columnas; ≥1024px: 4 columnas completas. Nunca hamburguesa en desktop (R33).
- Cards ≥48px de objetivo táctil (R35); estados con icono+texto+color (R14, WCAG 1.4.1); focus visible 2px+3:1 (R39); reflow 320px sin scroll horizontal (R32).

**8. Aspectos de código React**
- Componentes: `KanbanBoard`, `LeadCard`, `SlaChip`, `LeadActions` (menú), `EstadoBadge`.
- API: `GET /api/erp/leads?estado=&canal=` (lista, server component), `POST /api/erp/leads/[id]/transicion` (PATCH `estado` + campos; escribe `eventos` en el mismo `tx`), `POST /api/erp/leads/[id]/escalar-sla` (sistema).
- Hooks: `useTransition` para transiciones (no bloquear UI); `useRouter().refresh()` tras mutación.
- Validación zod: `estado ∈ enum`; `motivo_no_viable`/`destino_redireccion` required en sus transiciones; `score_conversion` 1-10.
- Error/loading: skeleton de kanban (P27); toast `role="alert"` en fallo; retry.

---

### P-02 — Ficha de lead/cliente

**1. Encabezado**
- Nombre: Ficha de lead/cliente. Ruta: `/app/erp/comercial/[clienteId]` (nuevo — `inv:45`).
- Contexto: Comercial/Cotizador. Rol: comercial, gerente.
- Eventos: E-02, E-03, E-04, E-07, E-46, E-49, E-50, E-51.

**2. Wireframe estructural**
```
┌ Header: [← Volver] [Lead: {nombre}] [estado badge] [SLA chip] ────────────┐
├── Columna izquierda ────────────────┬── Columna derecha ──────────────────┤
│ Datos de identidad (pre-cargados)   │ Historial (timeline de eventos)      │
│ Contacto (WhatsApp, email)          │   E-01 lead entra                   │
│ Score + calificación (input 1-10)   │   E-02 primera respuesta (hora)     │
│ Motivo (si no_viable/descartado)    │   E-06 visita agendada              │
│ Acciones: [Calificar] [Crear        │   E-07 visita realizada (medidas)   │
│   cliente] [Descartar] [Redirigir]  │   ...                               │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Score (1-10) | slider/select | E-03 | graba `score_conversion` | comercial | — | 1-10 | — |
| Guardar calificación | botón | E-03 | `leads.estado→calificado` | comercial | — | score requerido | — |
| Crear cliente | botón primario | E-51 | `estado→cliente` + FK + procedencia | comercial | — | requiere calificado | si estado≠calificado |
| Descartar | botón rojo | E-04 | `estado→descartado` + motivo | comercial | modal R18 motivo requerido | motivo | — |
| Redirigir | botón | E-04 | `estado→redirigido` + destino | comercial | modal destino | destino | — |
| Registrar visita (desde ficha) | botón | E-07 | crea/actualiza `visitas` con medidas | comercial | — | fecha + medidas | — |
| Reagendar cita | botón | E-46 | `citas.estado→agendada` nuevo slot; `reagendaConteo` | comercial | si conteo≥1 → modal "segunda falla descarta" (V-1) | — | si reagendaConteo≥1 |
| Ver historial (expandir) | acordeón | — | — | — | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Lead aún no es cliente" | header si `leads.estado≠cliente` (P03) |
| "SLA 5 min — vence en {mm:ss}" | chip en vivo (E-50) |
| "Motivo del descarte: {motivo}" | si estado=descartado/no_viable |
| "Primera respuesta: {hora}" | en timeline (E-02) |
| "No hay historial todavía" | empty state del timeline |
| "Segunda falla de cita — el lead se descarta" | modal de V-1 (define:140) |
| "Cliente creado desde este lead" | toast `role="status"` tras E-51 |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Nombre/documento/telefono/email | `leads.*` / `clientes.*` | texto | E-01 / E-51 |
| Etapa | `leads.estado` | enum | embudo |
| Score | `leads.score_conversion` | 1-10 | E-03 |
| Motivo | `leads.motivo_no_viable` | texto | E-04/E-49 |
| Destino | `leads.destino_redireccion` | texto | E-04 |
| Medidas de visita | `visitas.medidas_tomadas` | jsonb | E-07 |
| Reagenda | `citas.reagenda_conteo` | int | E-46 |
| Hora primera respuesta | `leads.hora_primera_respuesta` / `conversaciones.hora_primera_respuesta` | timestamp | E-02 |
| Timeline | `eventos` (leadId) | append-only | lectura |

**6. Máquina de estados del gate** — Mismo guard E-51 que P-01 (R16). La ficha es la vista de decisión: muestra qué falta para materializar el cliente.

**7. Responsive + accesibilidad** — <768px: una columna (datos → historial); CTA primario en tercio inferior; timeline con `aria-live="polite"` al cargar. Objetivos ≥48px; contraste AA (R38).

**8. Aspectos de código React** — Server component que lee lead+historial con `.with()`; formulario de score/es/estado como client component aislado; `POST /api/erp/leads/[id]/transicion`. Pre-carga de datos de identidad (R11).

---

### P-03 — Agenda / calendario de visitas

**1. Encabezado**
- Nombre: Agenda de visitas. Ruta: `/app/erp/calendario` (existe, extiende — `inv:46`).
- Rol: comercial, gerente. Eventos: E-06, E-07, E-46.

**2. Wireframe estructural**
```
┌ Header: [Agenda] [Vista: día | semana] [‹ › Hoy] ──────────────────────┐
├───────────────────────────────────────────────────────────────────────┤
│ [Calendario: franjas horarias libres por comercial]                    │
│  [Cita: 10:00-11:00 Cliente X — visita]                                │
│  [Cita: 14:00-15:00 Cliente Y — visita (no_show reagendable)]          │
├───────────────────────────────────────────────────────────────────────┤
│ [Panel lateral: crear cita → selecciona franja + cliente + tipo]       │
└───────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Franja horaria libre | slot clickeable | E-06 | crea `citas` (tipo='visita') | comercial | conflicto → modal "franja ocupada" | franja libre + cliente | si franja ocupada |
| Crear cita | botón | E-06 | `citas.estado→agendada` | comercial | — | fecha+franja+cliente requeridos | — |
| Marcar realizada | botón | E-07 | `citas.estado→realizada` + `visitas` | comercial | — | requiere medidas/observaciones (opcional) | si estado≠agendada |
| Marcar no_show | botón | E-46 | `citas.estado→no_show` + `reagenda_conteo+1` | comercial | si conteo≥1 → modal "segunda falla descarta el lead" (V-1) | — | si estado≠agendada |
| Reagendar | botón | E-46 | nueva `citas` | comercial | límite V-1 | — | si reagenda_conteo≥1 |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Franja libre" | slot disponible |
| "Visita con {cliente} — {dirección}" | cita programada |
| "Cita no asistida — reagenda disponible" | estado no_show |
| "Segunda falla de cita: el lead se descartará" | modal V-1 |
| "No hay visitas esta semana" | empty state |
| "Visita registrada con medidas" | toast tras E-07 |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Franja | `citas.franja_inicio/franja_fin` | timestamp | E-06 |
| Tipo | `citas.tipo` ('visita') | enum | E-06 |
| Estado | `citas.estado` (agendada/realizada/no_show/cancelada) | enum | E-06/E-07/E-46 |
| Conteo reagenda | `citas.reagenda_conteo` | int | E-46 |
| Medidas | `visitas.medidas_tomadas` | jsonb | E-07 |

**6. Máquina de estados del gate** — Ningún gate. V-1 es regla de límite (conteo ≥1 → descarte) implementada como guard de UI + validación de servidor.

**7. Responsive + accesibilidad (R40)** — timezone explícita + fecha determinista en SSR (R40); <768px: lista de citas del día + bottom-sheet para crear; ≥1024px: calendario completo. Layout de colisiones O(n log n).

**8. Aspectos de código React** — `Calendar` (día/semana), `CitaForm`, `SlaNoShowModal`. API `GET /api/erp/citas`, `POST /api/erp/citas`. Calendar math de `lib` (R40).

---

### P-04 — Cotizador (arteFacto evolutivo: preliminar → visita → diseño → cotización)

**1. Encabezado**
- Nombre: Cotizador. Ruta: `/app/erp/cotizador` + `/app/erp/cotizador/[proyectoId]` (existe, extiende — `inv:47`).
- Rol: comercial, diseñador, gerente. Contexto: Comercial/Cotizador + Control de cronograma (frontera E-52).
- Eventos: E-05, E-09, E-10, E-11, E-48, E-52 (proyecta), E-08 (registro del hecho).

**2. Wireframe estructural**
```
┌ Header: [Cotizador] [Proyecto: {nombre}] [estado] [pasos: 1 Preliminar 2 Diseño 3D 3 Cotización] ┐
├───────────────────────────────────────────────────────────────────────────┤
│ [Sección: espacios/variantes]          [Sección: diseño 3D]                │
│  Espacio 1: nombre + variantes          [Render/imagen] [Precio: $130.000] │
│  Espacio 2: ...                          [Estado: propuesto | pagado]      │
│  [+ Agregar espacio]                     [Botón: pedir diseño 3D (E-48)]   │
│ [Sección: estimación (E-52)]            [Sección: total (servidor)]        │
│  duración estimada / módulos             materiales + mano de obra +       │
│                                          costos operativos = TOTAL         │
│ [Barra inferior: Autoguardado ✓]  [Publicar propuesta (E-09/E-11)]        │
└───────────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Agregar espacio/variante | botón | E-05 | crea `espacio_variantes`+`items_variante` | comercial | — | nombre espacio | — |
| Editar variante | form inline | E-05/E-10 | actualiza items (autosave) | comercial | — | constraint inventario (R12) | — |
| Pedir diseño 3D | botón | E-48 | crea `diseños3d` (estado=propuesto, precio desde `parametros.bruto_diseno_3d`) | comercial/diseñador | — | — | si ya existe propuesto |
| Registrar pago 3D (hecho) | botón | E-08 (hecho) | `diseños3d.estado→pagado` (registro del hecho; el dinero nace en Finanzas, frontera define:120) | comercial | — | comprobante | si estado≠propuesto |
| Proyectar estimación | botón | E-52 | crea `estimaciones` (estado=borrador) | comercial | — | duración/módulos | — |
| Publicar propuesta | botón primario | E-09 | `cotizaciones.estado→en_revision` + snapshot | comercial | — | requiere al menos 1 espacio | si proyecto en revisión |
| Formalizar cotización | botón | E-11 | `cotizaciones.estado→cotizado` + `publicada_at` | comercial | — | requiere E-09 previo | si estado≠en_revision |
| Marcar no viable | botón | E-49 | `proyectos.estado→perdida` + motivo (solo registro, no bloquea) | comercial | — | motivo | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Presupuesto preliminar" / "En revisión" / "Cotizado" | estado del proyecto (R02) |
| "Diseño 3D: $130.000 (se descuenta del contrato al firmar)" | pie del diseño 3D (E-08/E-30) |
| "El total se calcula con el precio actual del catálogo" | nota bajo total (R05, matemática servidor) |
| "Borrador guardado" / "Guardando…" | autosave (R26, solo estados borrador) |
| "La propuesta no puede publicarse sin un espacio" | validación E-09 |
| "Estimación proyectada — se fijará en el cronograma" | tras E-52 (frontera) |
| "Este diseño ya está pagado" | si estado=descontado/pagado |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Espacios | `espacio_variantes.*` | texto/jsonb | E-05 |
| Items | `items_variante.catalogo_id/cantidad/precio_unitario/total_linea` | numeric | E-05/E-10 |
| Total | Σ materiales+mano de obra+costos operativos | currency (servidor R05) | cálculo |
| Versión cotización | `cotizaciones.version/ajustes_count` | int | E-10 |
| Snapshot | `cotizaciones.snapshot_proyecto` | jsonb | E-09 |
| Diseño 3D | `diseños3d.precio/estado` | currency/enum | E-48/E-08 |
| Estimación | `estimaciones.duracion_estimada_jornadas/factor_crecimiento_pct` | numeric | E-52 |

**6. Máquina de estados del gate** — Sin gates de ejecución. Guard de completitud: publicar propuesta exige ≥1 espacio (R16). E-49 no bloquea (solo registra motivo — define:134).

**7. Responsive + accesibilidad** — <768px: secciones apiladas, CTA "Publicar propuesta" fijo en el tercio inferior; autosave con indicador visible; inputs ≥16px; reflow sin pérdida.

**8. Aspectos de código React** — `ProyectoForm` (evolutivo, estados de completitud), `EspacioVarianteEditor`, `Diseno3DSeccion`, `TotalServidor`. Hooks: autosave con debounce + indicador "Guardado" (R26). API: `POST /api/erp/proyectos`, `PUT /api/erp/proyectos/[id]/espacios`, `POST /api/erp/proyectos/[id]/diseno3d`. Cálculo total en servidor (R05) — nunca `useMemo` para dinero.

---

### P-05 — Contratos + firma + cambios + cuestionario de viajes

**1. Encabezado**
- Nombre: Contratos. Ruta: `/app/erp/contratos` + `/app/erp/contratos/[proyectoId]` (existe, extiende — `inv:48`).
- Rol: comercial, gerente. Eventos: E-12, E-13, E-16, E-53.

**2. Wireframe estructural**
```
┌ Header: [Contratos] [Proyecto: {nombre}] ──────────────────────────────┐
├───────────────────────────────────────────────────────────────────────┤
│ [Borrador de contrato: datos firmados (valor_total NO se toca, CC-10)] │
│  hitos de pago (hitos_pago) → nacen obligaciones E-56 en Finanzas      │
│  [Enviar para firma (E-13)] → wizard firma digital (D8)                │
│ [Cuestionario de viajes (E-53)]: ¿tiene viajes? → fechas (opcional)    │
│ [Cambios de contrato (E-16, flow I-027)]: lista + crear + estado       │
│  (propuesto → aprobado → aplicado; dispara E-33 si afecta cronograma)  │
└───────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Crear borrador | botón | E-12 | `contratos.estado→borrador` + hitos | comercial | — | valor_total + hitos | — |
| Enviar para firma | botón primario | E-13 | crea `firmas_contrato` (token) → wizard firma digital | comercial | firma falla → reintento + traza | — | si estado≠borrador |
| Completar cuestionario de viajes | form | E-53 | `disponibilidad_cliente` (tiene_viajes, viajes_programados) | comercial | — | — | — |
| Crear cambio | botón | E-16 | `cambios_contrato` (tipo adicional/cambio/reproceso) | comercial | — | descripción + impacto | si contrato no firmado |
| Aprobar cambio | botón | E-16 | `cambios_contrato.estado→aprobado` | gerente | modal R18 impacto | impacto_medible requerido | si rol≠gerente |
| Aplicar cambio | botón | E-16 | `estado→aplicado` → dispara E-33 en cronograma si afecta fechas | gerente | — | requiere aprobado | si estado≠aprobado |
| Anular contrato (type-to-confirm) | botón rojo | — | `contratos.estado→cancelado` | gerente | modal R18 + type-to-confirm (acción irreversible D1) | — | si hay hitos pagados |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Contrato borrador — no compromete entrega" | label borrador (D3: no debe parecer compromiso) |
| "Firma enviada al cliente — enlace válido 48 h" | tras E-13 |
| "¿Tiene viajes programados durante el proyecto?" | cuestionario E-53 |
| "Este cambio recalculará el cronograma (causa: cambio de contrato)" | modal E-16→E-33 (I-027) |
| "No hay cambios de contrato" | empty state |
| "Contrato firmado — valor_total $X" | tras E-13 (CC-10) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Valor total | `contratos.valor_total` | currency (NO se modifica) | E-12 |
| Hitos | `hitos_pago.tipo/monto_o_porcentaje/razon` | enum/numeric | E-12 |
| Firma | `firmas_contrato.token_firma/fecha_firma` | texto/timestamp | E-13 |
| Viajes | `disponibilidad_cliente.tiene_viajes/viajes_programados` | bool/jsonb | E-53 |
| Cambios | `cambios_contrato.tipo/estado/impacto_medible/origen` | enum/enum/jsonb | E-16 |

**6. Máquina de estados del gate** — E-13 firma digital es subsistema DIFERIDO (wizard, `inv:158`). El cambio de contrato (E-16) es el origen de causa `cambio_contrato` del gate E-33 (B3-2, P-09): al aplicar, notifica a cronograma para que P-09 muestre el desfase con causa estructurada (I-027).

**7. Responsive + accesibilidad** — <768px: wizard de firma en una columna; hitos como cards; modal de cambio con `role="dialog"` + focus trap.

**8. Aspectos de código React** — `ContratoForm`, `PaymentScheduleEditor` (ya existe t-009), `FirmaWizard`, `CambiosContratoFlow`, `ViajesForm`. API: `POST /api/erp/contratos`, `POST /api/erp/contratos/[id]/firmar`, `POST /api/erp/contratos/[id]/cambios`. Validación zod en hitos (validacion.ts:37-43).

---

### F-01 — Landing + formulario de lead

**1. Encabezado**
- Nombre: Landing + formulario de contacto/lead. Ruta: `/` + `POST /api/leads` (existe — `inv:92`).
- Rol: público. Eventos: E-01.

**2. Wireframe estructural**
```
┌ Hero: [titular] [CTA: Agendar visita] [CTA: Cotizar por WhatsApp] ───┐
├──────────────────────────────────────────────────────────────────────┤
│ [Secciones: servicios, portafolio, proceso, testimonios (DIFERIDO)]   │
│ [Formulario: nombre | WhatsApp | email | qué necesitas] → [Enviar]   │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Formulario de lead | form | E-01 | crea `leads` (estado=nuevo, `canal`=web, UTM si hay) | público | error campo → inline | nombre + teléfono o email requeridos | — |
| Enviar | botón primario | E-01 | POST `/api/leads` → toast "¡Gracias! Te escribimos" | público | red → retry | zod | — |
| CTA WhatsApp | link | — | abre wa.me con número NAP | público | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Te contactamos en menos de 5 minutos" | promesa de SLA visible (E-50, copy honesto) |
| "¡Gracias, {nombre}! Un asesor te escribe por WhatsApp." | éxito E-01 |
| "Cuéntanos qué necesitas" | label del textarea |
| "Algo falló al enviar. Reintenta." | error |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Nombre | `leads.nombre` | texto | E-01 |
| WhatsApp | `leads.telefono_whatsapp` | teléfono | E-01 |
| Email | `leads.email` | email | E-01 |
| Canal | `leads.canal` ('web') | enum | E-01 |
| UTM | `leads.utm_source/medium/campaign` | texto | E-01 |

**6. Máquina de estados del gate** — Ninguno. Solo captura.

**7. Responsive + accesibilidad** — Mobile-first (R30); form en una columna <768px; CTA del hero repetido abajo; contraste AA; inputs ≥16px.

**8. Aspectos de código React** — `LeadForm` client component + `POST /api/leads` (endpoint público sin auth — correcto por diseño, `estado.md`). Zod; mensaje de éxito inline; sin redirección forzada (se mantiene en página con toast).

---

### F-02 — Propuesta pública (incluye pago diseño 3D F-08 embebido)

**1. Encabezado**
- Nombre: Propuesta. Ruta: `/propuesta/[proyectoId]` (existe, extiende — `inv:93`).
- Rol: cliente (por link). Eventos: E-09, E-08 (pago 3D embebido, resuelto en iteración 2).

**2. Wireframe estructural**
```
┌ Header: [Veta Dorada] [Propuesta #{codigo}] ──────────────────────────┐
├───────────────────────────────────────────────────────────────────────┤
│ [Snapshot congelado de la cotización (cotizaciones.snapshot_proyecto)] │
│  espacios + items + total (sin edición)                               │
│ [Bloque diseño 3D (solo si propuesto)]: [Pagar $130.000 →] pasarela    │
│ [CTA: Aceptar propuesta → /agendar + WhatsApp]                        │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Pagar diseño 3D | botón | E-08 | abre pasarela; al confirmar → `diseños3d.estado→pagado` (el dinero lo crea Finanzas, frontera) | cliente | pago rechazado → mensaje de pasarela | — | si ya pagado |
| Aceptar propuesta | botón | — | → `/agendar` | cliente | — | — | — |
| Contactar por WhatsApp | link | — | wa.me | cliente | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Diseño 3D de tu espacio" | bloque diseño |
| "El valor del diseño se descuenta del contrato al firmar" | pie del pago (E-30) |
| "Propuesta {estado}" | según cotizaciones.estado |
| "Esta propuesta expiró" | si proyecto≠cotizado (404 por estado, patrón t-031) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Snapshot | `cotizaciones.snapshot_proyecto` | jsonb (congelado) | E-09 |
| Total | `cotizaciones.valor_total` | currency | E-09 |
| Diseño 3D | `diseños3d.precio/estado` | currency/enum | E-48 |
| Estado proyecto | `proyectos.estado` | enum | E-11.. |

**6. Máquina de estados del gate** — Sin gates. Control de acceso: `activa`/`cotizado` visible; proyecto no publicado → 404 (patrón t-031, `estado.md`).

**7. Responsive + accesibilidad** — Mismo snapshot en los 3 breakpoints (jamás dos versiones desincronizadas); CTA en tercio inferior; contraste AA; `aspect-ratio` en imágenes (R37).

**8. Aspectos de código React** — Server component que lee `cotizaciones.snapshot`; `PagoDiseno3D` embebido (client) llama a `POST /api/erp/proyectos/[id]/diseno3d/pago` (registro del hecho) que a su vez dispara el movimiento en Finanzas (R05). Proveedor de pasarela → `DECISION_PENDIENTE`.

---

### F-03 — Agendar cita (autoservicio)

**1. Encabezado**
- Nombre: Agenda tu visita. Ruta: `/agendar` (existe, extiende — `inv:94`).
- Rol: cliente. Eventos: E-06.

**2. Wireframe estructural**
```
┌ Header: [Agenda tu visita] ───────────────────────────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Paso 1: datos de contacto (pre-cargados si ya es cliente)]           │
│ [Paso 2: calendario de franjas libres por comercial]                  │
│ [Paso 3: confirmación + resumen] → [Confirmar cita]                   │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Franja libre | slot | E-06 | selecciona franja | cliente | franja ocupada → otro slot | — | si no libre |
| Confirmar cita | botón | E-06 | `citas.estado→agendada` | cliente | conflicto → reintento | datos + franja | si no hay franja |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Elige el horario que mejor te quede" | paso 2 |
| "Cita confirmada para {fecha} {hora}" | éxito |
| "No hay horarios disponibles esa semana" | empty |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Franja | `citas.franja_inicio/franja_fin` | timestamp | E-06 |
| Cliente | `clientes.*` (o lead) | texto | pre-carga R11 |

**6. Máquina de estados del gate** — Ninguno. Agendamiento híbrido IA vs humano → `DECISION_PENDIENTE` (`inv:H-B2-2-10`).

**7. Responsive + accesibilidad** — R40 (timezone + hidratación); calendario en bottom-sheet <768px; CTA confirmar en tercio inferior.

**8. Aspectos de código React** — `AgendarForm` (3 pasos), `POST /api/citas`. Usa `<Suspense>` alrededor de `useSearchParams()` (lección del build, `estado.md`).

---

### F-08 — Pago del diseño 3D (pasarela) — **EMBEBIDO en F-02** (decisión de iteración 2)

Bloque de pago dentro de `/propuesta/[proyectoId]` (no ruta propia — resuelve la `PANTALLA_AMBIGUA` de `inv:99`). Especificación completa en F-02 (§Bloque diseño 3D). Frontera declarada: el cliente paga → el movimiento financiero nace en Finanzas (define:120); la UI del ERP solo registra el hecho (P-04). Proveedor de pasarela → `DECISION_PENDIENTE`.

---

## Cobertura de eventos (16/16 de la familia)

| Evento | Pantalla(s) | Observación |
|---|---|---|
| E-01 | F-01 (captura) + P-01 (visible) | híbrido |
| E-02 | P-01/P-02 | hora de primera respuesta |
| E-50 | P-01/P-02 (SLA chip) + sistema | temporizador + escalación |
| E-03 | P-01/P-02 | score_conversion |
| E-04 | P-01/P-02 | motivo + destino_redireccion (A3-C2) |
| E-49 | P-01/P-04 | solo registro de motivo |
| E-05 | P-04 | artefacto evolutivo |
| E-06 | P-03 + F-03 | híbrido |
| E-07 | P-03/P-02 | medidas estructuradas |
| E-46 | P-03/P-02 | V-1 reagenda con límite |
| E-48 | P-04 | diseño 3D sección |
| E-08 | F-02 (pago) + P-04 (hecho) + Finanzas (dinero) | frontera define:120 |
| E-52 | P-04 (proyecta) + P-09 (acordada, B3-2) | frontera |
| E-09/E-10/E-11 | P-04 + F-02 | snapshot congelado |
| E-51 | P-01/P-02 | lead→cliente |
| E-12/E-13/E-53/E-16 | P-05 | contrato + firma + viajes + cambios |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B3-1-01 | `DECISION_PENDIENTE` | Proveedor de pasarela de pago (F-08 embebido en F-02): Wompi/PayU/u otro. Afecta integración y los datos del comprobante E-08 | `inv:99`; define:120 |
| H-B3-1-02 | `DECISION_PENDIENTE` | Agendamiento híbrido IA vs humano (E-06/F-03): quién responde el horario en primera instancia | `inv:H-B2-2-10`; logica:132 |
| H-B3-1-03 | `DECISION_PENDIENTE` | Transparencia por rol (H8): qué ve el comercial de caja/cronograma interno (roza P-04 totales vs internals) | `inv:H-B2-2-03` |
| H-B3-1-04 | GAP (heredado, resuelto) | Glosario único de estados/verbos (reg:H07): este pase fijó labels por pantalla (R02) pero falta el glosario único consolidado que B4 audite | `reg:H07` |
| H-B3-1-05 | DIFERIDO | Testimonios (E-55) en la landing F-01 → curaduría P-33 / t-034; la landing reserva la sección sin construirla | `inv:33`; `inv:86` |
| H-B3-1-06 | `DECISION_PENDIENTE` | `clientes.etapa_funnel` (A3-C3): este pase la escribe en E-51 (P-01/P-02); confirmar si se conserva o elimina | `sch_c:§1`; `a3:C3` |
| H-B3-1-07 | NOTA | El total del cotizador es cálculo de servidor (R05); la UI jamás suma `items_variante.total_linea` en cliente | `reg:R05`; `ux:P13` |

---

## Notas para el Orquestador

- **Contrato cumplido (met:110-123):** 9 pantallas × 8 secciones; la F-08 quedó embebida en F-02 (resuelve `PANTALLA_AMBIGUA`); P-04 especificado como artefacto evolutivo (R25) consistente con `logica:458`.
- **Precondiciones que B3-1 asume (del Define):** rol-vs-persona (P-12, B3-2), pasarela de pago (F-08), firma digital (P-05 wizard). Se diseñan como interfaces, no se construyen aquí.
- **Para B4-1 (determinismo de gates):** B3-1 no ejecuta gates; los guards documentados (E-51 completitud, E-49 motivo) son de superficie y deben auditarse como tales.
- **Para B4-2 (roles×gates):** matriz de permisos de P-01/P-02/P-03/P-04/P-05 (comercial vs gerente) y de F-01/F-02/F-03/F-08 (público/cliente) queda lista para auditar.
- **Prohibido cumplido:** este pase solo escribió `arnes/diagnostico/pasadas/d3_ui_b3_1_embudo_comercial.md`.

## Registro

- Fecha: 2026-08-04 · Pase B3-1 (ola 4, Fase B — diseño de pantallas, familia embudo comercial).
- Archivo de salida (único escrito): `arnes/diagnostico/pasadas/d3_ui_b3_1_embudo_comercial.md`.
- Conteo: **9 pantallas** especificadas (P-01..P-05 + F-01, F-02, F-03 + F-08 embebido) · 16/16 eventos de la familia · 7 hallazgos (3 DECISION_PENDIENTE, 1 GAP resuelto, 1 DIFERIDO, 1 DECISION_PENDIENTE heredada, 1 nota).
