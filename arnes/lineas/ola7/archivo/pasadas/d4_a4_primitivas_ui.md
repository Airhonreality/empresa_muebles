# Pase D4-A4 — primitivas UI (subagente, loop de 3 iteraciones)

**Rol:** Component/UI architect del Diamante 4 (t-095, D4-A4 "primitivas UI").
**Lente:** definir la biblioteca de primitivas UI de la V3 — cada componente con sus estados, variantes, medidas y los tokens que usa — para que un desarrollador codifique sin releer otra fuente. Cobertura de las 34 pantallas core (26 ERP + 8 frontstage). **Investigación y análisis, cero código.**
**Fuentes leídas (todas completas):** `d4_a3_tokens_visuales.md` (LOS tokens, jerarquía primitivo→semántico→componente, ~135 tokens), `d4_a2_concepto_superficies.md` (3 superficies, 1 sistema, 3 modos), `d4_a5_motion_efectos.md` (timing/easing por estado, transiciones de los 5 gates, reduce-motion), `d3_ui_b2_1_destilacion_inv.md` (R01-R40, estándar de 8 componentes, convenciones de interacción), `d3_ui_b1_1_ux_ergonomia.md` (28 principios P01-P28), `d3_ui_consolidado.md` (34 pantallas, 5 gates E-18/E-21/E-24/E-33/E-20), `d3_ui_b1_2_responsive_design.md` (8 componentes base, checklist WCAG 2.2, 2 familias de tablas).
**Regla de trazabilidad:** `archivo:línea` en toda afirmación; cada primitiva cita sus tokens del A3 por nombre (`--veta-*`). Los literales que NO vienen del corpus se marcan `(derivado)` y se justifican. Lo incierto va a `DECISION_DISEÑO`, nunca se inventa.
**Reglas de oro aplicadas:** R34 dos familias de tablas · R35 hit targets 48px+8px · R10 dorado solo acción primaria · R14 estado icono+texto+color, nunca solo color · R02 vocabulario del taller ("módulos, cajón, mesón, herraje, retoma"), nunca schema · R16 gate con guard visible · R17 SLA como temporizadores · R18 confirmación destructiva escalada.

---

## Iteración 1 (bruta)

Inventario crudo, sin filtrar, de todo lo que las fuentes ofrecen como candidato a primitiva:

- **Estándar de 8 componentes base (B1-2:290-361):** botón, input, select, tabla/datatable, modal, toast, dropdown, datepicker — con estados `default · hover · focus-visible · active · disabled · error · loading`.
- **Faltantes que el estándar NO cubre (GAP de A2/A3/A5):** kanban (GV-01, P-01/P-16), stepper/timeline de gates (GV-02, P-06), cronograma doble (GV-03, P-09). El A5 define su comportamiento (estados del DnD, reflow 400ms, skeleton por geometría); A4 los especifica como componentes.
- **Lo que las 34 pantallas de verdad usan (consolidado + A2 §3):** datatables Familia A (P-13/P-14/P-16/P-20/P-21/P-22/P-23), Familia B (P-01/P-02/P-06/P-25/P-24), kanban (P-01/P-16), timeline/stepper (P-06/P-09), checklist E-21 (P-14), SLA timers (P-01/P-02/P-10), guard visible (P-08/P-09/P-13/P-14/P-17/P-18/P-20), panel "Requiere tu decisión" (P-20), KPIs (P-20/P-21/P-22/P-23), tablas de caja/dinero (P-20/P-21/P-22/P-23), wizard de firma E-13 (P-05/F-08), upload de fotos E-41 (P-07/P-26/P-19), empty states (P-13/P-01/P-15), skeletons, formularios, datepicker de rango ≤5 días (P-18), avatar/equipo (P-12/P-22), sidebar/rail/drawer (R33), header de contexto (P01), notificaciones (P-10/P-17/F-07).
- **Estados por componente del B1-2** (botón :294-304, input :306-316, select :318-321, tabla :323-336, modal :338-344, toast :346-350, dropdown :352-355, datepicker :357-361).
- **Tokens disponibles (A3):** escala dorada gold-100..700; semánticos error/warning/info + focus; éxito LOCKED (DD-05); superficie bg/text/border/glass; status-draft (borrador); skeleton; media-caption; tipografía xs..kpi + mono data; spacing 4px; radius none/sm/md/lg/full; bordes 1px/2px; sombras none..xl + ring-focus; z-content..z-loader; motion `--dur-*`/`--ease-*` (A5).
- **Motion por estado (A5):** hover 100-150ms, press 100ms, focus 0-100ms, modal 200/150ms, drawer 300ms, badge morph 150ms, cascade checklist ≤50ms/ítem, timer SLA continuo, reflow cronograma 400ms.
- **Vocabulario R02 (B2-1:235):** "Aprobar schema", "Recibir verificado", "Reprocesar módulo X", "Registrar veredicto", "Marcar verificado".

---

## Iteración 2 (autocrítica)

Qué se sostiene, qué cae, qué se me escapó:

1. **Cae separar por superficie como "sistemas distintos"** (lección de A2 :91-95): una primitiva es UNA; cambia su modo de superficie (densidad, tipografía display, imagery), nunca su token de color. Un botón primario dorado es el mismo componente en las 3 superficies con el mismo token.
2. **Cae declarar tokens nuevos de color sin necesidad.** El A3 ya cubre neutros, semánticos, dorados, draft, skeleton, focus. Lo que este pase necesita y NO está en A3 como semántico: `--veta-btn-danger-bg` (botón destructivo sólido), tooltip oscuro, backdrop de modal, sparkline trazo, densidad de modo. → GAP_VISUAL con mapeo a primitivos que A3 SÍ definió (`#B3261E` danger, charcoal-800, etc.), para que la PoC los declare en `@theme` sin inventar marca.
3. **Cae el "éxito verde literal" en cualquier primitiva** (DD-05 LOCKED, A3 :150-159): badge success, checkbox verificado E-21, stepper completado, KPI tendencia, caja liberada NO pueden usar verde hasta que el Supervisor decida. Se respeta R14: icono+texto+neutral mientras tanto. Los contratos lo anotan como "token LOCKED".
4. **Se sostiene y se vuelve regla dura — el vocabulario R02 dentro de los contratos:** los labels de cada primitiva de gate usan el lenguaje del taller ("Falta veredicto de schema", "Recibir verificado"), nunca el nombre de tabla/schema. Cada primitiva de gate lleva su label canónico.
5. **Se me escapó en la bruta — el dropdown/menú de acciones es una primitiva aparte del estándar** (B1-2:352-355) y las 34 pantallas lo usan en filas de tablas, kanban y KPIs (menú contextual por lead R29). Y el **avatar** (equipo P-12, compensación P-22, header) con fallback de iniciales. → se incorporan.
6. **Se me escapó — la "tabla de caja" no es una tabla más:** es la composición Familia A + columna de prioridad de pagos (R24) + badge de gate E-20 + panel decisión (R20). Necesita contrato propio (P-20/P-21/P-23).
7. **Se me escapó — el stepper de gates y el wizard de firma comparten el mecanismo "stepper"** pero difieren en contrato (información vs. captura+confirmación). Se especifican por separado para no reutilizar mal (R19: el stepper de gates es estático, el wizard avanza por pasos).
8. **Tensión: densidad de las medidas.** B1-2 pide filas cómodas 48-52 / densas 36-40 y R35 exige ≥48px en accionables. Resolución por tipo de celda: fila con acciones = 48px mínimo; fila solo lectura densa = 36-40px; inputs siempre 48px (nunca se achican por densidad salvo toolbar).
9. **Lo incierto NO se inventa:** radio de inputs en público, trazo del sparkline, densidad del modo portal, éxito, card collapse (D6) → DECISION_DISEÑO con default razonado aplicable.

---

## Iteración 3 (refinamiento final)

Síntesis depurada. Decisiones de cierre:

1. **38 primitivas en 8 categorías** (Acción · Entrada · Datos · Estructura/Navegación · Contenedores · Feedback/Estado · Proceso/Gates · Identidad) — cubren las 34 pantallas core; las 3 del estándar faltante (kanban, stepper de gates, timeline doble) quedan formalizadas en este pase (GV-01/GV-02/GV-03 de A2/A3).
2. **Cada contrato fija: estados (default/hover/focus/active/disabled/error/loading + estado propio), variantes (por superficie/tamaño), medidas (alto/padding/radio/borde), tokens (por nombre A3/A5), pantallas (P-XX/F-XX), a11y (focus/aria/hit target).**
3. **Dos mecanismos transversales:** (a) **modo de superficie** = densidad + tipografía display + imagery (A2), con tabla de variantes por superficie en §3; (b) **estado de documento** borrador vs compromiso (D3) con tokens `--veta-status-draft-*`, neutral, sin colores de confirmación.
4. **Sistema de gates = 6 primitivas dedicadas** (gate-guard, sla-timer, stepper de gates, timeline cronograma doble, tabla de caja, checklist E-21) + 3 de apoyo (badge, modal, toast) en §4.
5. **Tablas en 2 familias (R34)** con medidas, alineación por tipo, columna de acciones, estados de fila y densidad en §5.
6. **a11y transversal** consolidada (foco 2px+3:1, contraste AA medido, hit targets 48px+8px, aria por componente, tab-order, teclado completo incl. alternativa 2.5.7 del DnD kanban) en §6.
7. **Regla de oro cumplida:** toda primitiva cita sus tokens por nombre; lo que falta se marca GAP_VISUAL con mapeo, no se inventa; lo de gusto va a DECISION_DISEÑO (vocabulario del diamante 4, `diamante4_metodologia.md:87`).

---

## Entregable

### 1. Inventario de primitivas (38, en 8 categorías)

| # | Primitiva | Categoría | Origen (estándar/GAP) | Pantallas core donde se aplica |
|---|---|---|---|---|
| 1 | Button (incl. icon-only) | Acción | estándar 8 (B1-2:294) | todas |
| 2 | Input (incl. textarea) | Entrada | estándar 8 (B1-2:306) | P-02/P-04/P-07/P-13/P-18/P-21/F-01/F-03/F-07 |
| 3 | Select (incl. combobox) | Entrada | estándar 8 (B1-2:318) | P-02/P-04/P-08/P-09/P-12/P-13/P-17/P-18 |
| 4 | Checkbox | Entrada | estándar 8 (checklist fila) | P-14/P-12/P-04 + selección de fila en tablas |
| 5 | Radio | Entrada | estándar 8 (grupos) | P-11/P-05/P-09 |
| 6 | Switch | Entrada | estándar 8 (toggle) | P-12/P-08/P-23 |
| 7 | Datepicker (single/range ≤5d) | Entrada | estándar 8 (B1-2:357) | P-03/P-18/P-25/F-03 |
| 8 | Upload (foto E-41) | Entrada | componente (R28/P18) | P-07/P-26/P-19/P-25/P-30 |
| 9 | Búsqueda (global `/`, lookup) | Entrada | componente (2.4.5/R11) | global; P-02/P-13/P-21 |
| 10 | Filtros (barra de filtros) | Entrada | componente (P26 filtro vacío) | P-13/P-20/P-21/P-22/P-25/P-03/P-24 |
| 11 | Formulario (Form/Field/FieldGroup) | Entrada | composición (R13/P15) | todos los formularios |
| 12 | DataTable Familia A (densa) | Datos | estándar 8 (B1-2:323) + R34 | P-13/P-14/P-16/P-20/P-21/P-22/P-23/P-15/P-24/P-12 |
| 13 | DataTable Familia B (cards) | Datos | estándar 8 + R34 (B1-2:120-123) | P-01/P-02/P-06/P-25/P-24/F-07 |
| 14 | Tabla de caja (finanzas) | Datos | composición (R20/R24/R05) | P-20/P-21/P-22/P-23 |
| 15 | Paginación | Datos | estándar 8 (B1-2:334) | P-13/P-21/P-22/P-25/P-03 |
| 16 | Card / Tarjeta | Contenedor | componente (Familia B/público) | F-01/F-02/F-07/P-25/P-06/P-01 |
| 17 | Modal (dialog) | Contenedor | estándar 8 (B1-2:338) | P-05/P-08/P-14/P-17/P-09/P-22/P-20/F-07 |
| 18 | Drawer / Bottom-sheet | Contenedor | componente (R33/INS:70) | P-01/P-02/P-03/P-04/P-07/F-07 |
| 19 | Accordion (progressive disclosure) | Estructura | componente (P10/R08) | P-02/P-09/P-21/P-22/P-08 |
| 20 | Tabs | Estructura | componente (3.2.4) | P-25/P-08/P-20/F-07 |
| 21 | Sidebar / Nav (sidebar/rail/drawer) | Estructura | componente (R33) | todo el ERP; F-07 (portal) |
| 22 | Header de contexto (P01) | Estructura | componente (P01/R09) | P-02/P-07/P-08/P-09/P-11/P-13/P-14/P-17/P-18/P-19/P-20/P-26 |
| 23 | Badge / Chip de estado | Feedback | estándar 8 (estados) + R14 | todas (gates E-18/E-21/E-24/E-33/E-20, P-10/P-14/P-25/F-07) |
| 24 | Toast (status/alert/undo) | Feedback | estándar 8 (B1-2:346) | P-04/P-07/P-08/P-14/P-17/P-20/P-22/P-05/F-07 |
| 25 | Tooltip | Feedback | estándar 8 (1.4.13) | KPI, gráficos P-22/P-23, iconos sin label |
| 26 | Skeleton | Feedback | componente (P27/RV-04) | P-13/P-14/P-20/P-21/P-22 (A); P-01/P-02/P-06/P-25 (B); P-26/P-07/P-19/F-07 (foto); F-01/F-02 |
| 27 | Empty-state (vaciostate) | Feedback | componente (P26) | P-13/P-01/P-15/P-25/P-03/F-07 |
| 28 | SLA Timer | Feedback/Gate | componente (R17/P17) | P-01/P-02/P-10 |
| 29 | Gate Guard | Feedback/Gate | componente (R16/P08) | P-08/P-09/P-13/P-14/P-17/P-18/P-20 |
| 30 | Notificación push / centro | Feedback | componente (4.1.3) | P-10/P-17/F-07 + header global |
| 31 | KPI Tile (+sparkline) | Datos | componente (R21/INS:70) | P-20/P-21/P-22/P-23/P-06/P-16 |
| 32 | Kanban | Proceso/Gate | **GAP GV-01** (A2:282/A5:GM-03) | P-01/P-16 |
| 33 | Stepper de gates | Proceso/Gate | **GAP GV-02** (A2:283) | P-06/F-07 |
| 34 | Timeline cronograma doble | Proceso/Gate | **GAP GV-02/GV-03** (A2:284) | P-09 |
| 35 | Checklist recepción E-21 | Proceso/Gate | composición (R12/A5) | P-14 |
| 36 | Wizard de firma E-13 | Proceso/Gate | composición (R18c/D1) | P-05/F-08/F-07 |
| 37 | Dropdown / Menú de acciones | Estructura | estándar 8 (B1-2:352) | filas de tabla, kanban, KPIs (R29) |
| 38 | Avatar | Identidad | componente | P-12/P-22/header |

**Conteo:** 38 primitivas. De ellas **6 dedicadas al sistema de gates** (28 SLA Timer, 29 Gate Guard, 33 Stepper, 34 Timeline, 35 Checklist E-21, 14 Tabla de caja) + **3 de apoyo** (23 Badge, 17 Modal, 24 Toast) = **9 primitivas implicadas en los 5 gates**. Las 3 del estándar faltante (32/33/34) quedan especificadas en este pase.

---

### 2. Contrato por primitiva (regla del método: `primitiva | estados | variantes | medidas | token que usa | pantalla(s) | accesibilidad`)

#### 2.1 Acción

| Primitiva | Estados | Variantes | Medidas | Tokens (A3/A5) | Pantallas | A11y |
|---|---|---|---|---|---|---|
| **Button** | default · hover `(hover:hover)` · focus-visible · active (press) · disabled · loading · (error → toast externo) | `primary` (dorado, única acción primaria R10) · `secondary` (raised+borde) · `ghost` · `destructive` (rojo R18) · `icon-only` (IconButton); tamaños `sm` 32 (toolbar denso) · `md` 40 (tabla) · `lg` 48+ (estándar) | alto ≥48px (R35); radio `--veta-radius-sm`; padding `--veta-space-3`/`--veta-space-4`; borde `--veta-border-width-1`; gap icono-texto `--veta-space-2` | primary bg `--veta-btn-primary-bg` (=`--veta-gold-600` #8B6914) + text `#FFFFFF` (5,1:1); hover darken a `--veta-gold-700`; secondary bg `--veta-bg-raised` + border `--veta-border-default` + text `--veta-text-primary`; ghost text `--veta-text-muted`; destructive bg `--veta-btn-danger-bg` (mapea a primitivo danger `#B3261E`, text blanco 6,5:1, ver GV-A4-02); disabled 40% opacity; loading spinner 16px + label | todas | `<button>` real; nombre accesible = texto visible (2.5.3); focus `--veta-ring-focus` (2px+3:1, R39) nunca outline:none; disabled real fuera de taborder; loading `aria-busy`+`disabled` (sin CLS, label fijo); target ≥48px + 8px separación (R35); en móvil primario en tercio inferior |
| **Input** | default · hover · focus-visible · disabled · readonly · error · loading (skeleton width) | `text` · `textarea` (multilínea) · `money` (COP `tabular-nums`, inputmode decimal, `--veta-text-data`) · `measure` (mm, `--veta-font-mono`) · `search` (icono lupa) · `number` (inputmode, constraints R12) | alto 48px (móvil ≥16px font, R39); radio `--veta-radius-sm`; padding `--veta-space-3`; borde `--veta-border-width-1` | bg `--veta-bg-raised`; border `--veta-border-default` (#8A8479 3,7:1); text `--veta-text-primary`; placeholder/label `--veta-text-muted`; label `--veta-text-label`; error border `--veta-border-error` + text `--veta-color-error-text` + bg `--veta-color-error-fill`; focus `--veta-ring-focus`; disabled bg `--veta-bg-surface` 40%; skeleton `--veta-skeleton-bg` | P-02/P-04/P-07/P-13/P-18/P-21/F-01/F-03/F-07 | `<label for>` siempre visible (3.3.2, nunca placeholder como label); error `aria-invalid`+`aria-describedby` con icono+texto (R14/3.3.1); autocomplete 1.3.5 (tel/email/nombre/dirección); `inputmode` numérico; 16px móvil (evita zoom iOS) |

#### 2.2 Entrada

| Primitiva | Estados | Variantes | Medidas | Tokens (A3/A5) | Pantallas | A11y |
|---|---|---|---|---|---|---|
| **Select** | default · hover · focus-visible · disabled · error · open/closed | `native` (default, preferido B1-2:318) · `combobox` (custom con filtro, listbox) | como Input; popover 280-320px; radio `--veta-radius-sm`; shadow `--veta-shadow-md`; z-dropdown | como Input + lista bg `--veta-bg-raised` + border `--veta-border-default`; selección highlight `--veta-bg-surface-alt`; focus ring | P-02/P-04/P-08/P-09/P-12/P-13/P-17/P-18 | combobox `role="combobox"`+`aria-expanded`+`aria-controls`+`aria-activedescendant`; opciones `role="option"`+`aria-selected`; flechas + Home/End; Esc cierra (R39); native `<select>` con label |
| **Checkbox** | default · hover · focus-visible · checked · indeterminate · disabled · error | `label-right` (default) · `row-check` (selección de fila) · `checklist` (E-21, ver #35) | box 20px (24 móvil); hit target ≥48px (R35); radio `--veta-radius-sm` | borde `--veta-border-default`; checked bg `--veta-color-brand` (=gold-600) + check `#FFFFFF` (5,1:1); error `--veta-border-error`; indeterminate `--veta-color-brand` | P-14/P-12/P-04 + selección en tablas | `<input type=checkbox>` nativo o `role="checkbox"`+`aria-checked` (incl. mixed); label asociada ("Seleccionar proyecto #123"); nunca solo color (1.4.1); row-check ≥48px |
| **Radio** | default · hover · focus-visible · checked · disabled | `grupo` (fieldset/legend) · `radio-card` (tarjetas seleccionables) | 20px; hit 48px; radio `--veta-radius-full` | checked dot `--veta-color-brand`; borde `--veta-border-default`; focus ring | P-11 (3 desenlaces)/P-05 (viajes)/P-09 (clasificador causa) | `<fieldset><legend>` (1.3.1); navegación flechas en grupo; nombre accesible; radio-card con focus visible |
| **Switch** | default · hover · focus-visible · checked · disabled · loading | `standard` · `compact` (tabla) | track 40×24; knob 20px; hit ≥48px con padding; radio full | track off `--veta-bg-raised`+`--veta-border-default`; on `--veta-color-brand`; focus ring; disabled 40% | P-12 (verificador)/P-08 (integraciones E-38/E-39)/P-23 | `role="switch"`+`aria-checked`; label; estado acompañado de texto (R14) |
| **Datepicker** | default · hover · focus-visible · disabled · error · open | `single` · `range` (inicio–fin ≤5 días, R40) | campo 48px; popover 320px; radio `--veta-radius-lg`; shadow `--veta-shadow-md`; z-dropdown | campo como Input; calendario bg `--veta-bg-raised`; día seleccionado `--veta-color-brand` + texto blanco; día en rango bg `--veta-gold-100`; hoy borde `--veta-border-brand`; error `--veta-border-error` | P-03/P-18 (rango 5d)/P-25 (E-61)/F-03 | campo de texto editable con formato visible (3.3.2/3.3.3) + calendario como enhancement; grilla `role="grid"`+`aria-selected`; teclado flechas/Home/End/PageUp-Down; validación de rango; timezone explícita (R40) |
| **Upload** (foto E-41) | default · hover · focus-visible · drag-over · loading · error · uploaded | `foto-retoma` (E-41 + caption material/ubicación) · `avatar` · `documento` | tarjeta 120×90 con `aspect-ratio` reservado (R37); botón de captura ≥48px; radio `--veta-radius-md` | dropzone border `--veta-border-default` dashed; drag-over `--veta-border-brand`; bg `--veta-bg-surface-alt`; preview en carga `--veta-skeleton-bg`; caption `--veta-media-caption`; error `--veta-border-error` | P-07/P-26/P-19/P-25/P-30 | label + instrucción; foco en botón; estado por texto+icono (R14); alt de foto (1.1.1); cero CLS por aspect-ratio (R37); offline "se guardó localmente" (R27) |
| **Búsqueda** | default · focus-visible · loading (sugerencias) · empty (sin resultados) · error | `global` (atajo `/`, B2-1:230) · `local` (filtro de tabla) · `lookup` (catálogo/proveedores, R11) | alto 48px; radio `--veta-radius-sm`; ancho 320-480px | como Input + icono lupa `--veta-text-muted`; listbox bg `--veta-bg-raised`+`--veta-shadow-md`; vacío `--veta-text-muted` | global (2.4.5)/P-02/P-13/P-21 | label; patrón combobox; resultados `aria-live`; atajo desactivable (2.1.4); Esc cierra |
| **Filtros** | default · focus-visible · active (aplicado) · loading | `toolbar` (chips) · `panel` (side, progressive) · `filtro-vacio` ("Limpiar filtros") | chip 32-40px; gap `--veta-space-2`; botón limpiar ≥48px; radio `--veta-radius-full` | chip bg `--veta-bg-raised` + border `--veta-border-default`; activo border `--veta-border-brand` + text `--veta-gold-700`; focus ring | P-13/P-20/P-21/P-22/P-25/P-03/P-24 | grupo en `fieldset` con `legend`; chips `aria-pressed`; estado activo icono+texto; filtro sin resultados → empty-state (P26) |
| **Formulario** (Form/Field/FieldGroup) | valid (llenando) · error · submitted-summary | `inline` (campo en tabla) · `step` (wizard) · `estándar` | gap campo `--veta-space-3`; sección `--veta-space-5`; 1 col móvil / 2 cols md / 3 cols desktop; inputs ≥16px móvil | label `--veta-text-label`; requerido `*`; error text `--veta-color-error-text`; resumen de errores bg `--veta-color-error-fill` | todos los formularios (P-02/P-04/P-05/P-07/P-13/P-14/P-17/P-19/F-03/F-07) | labels visibles (3.3.2); errores inline `aria-describedby` + resumen anclado al primero (R13/P15); no re-pedir datos (3.3.7); autocomplete |

#### 2.3 Datos

| Primitiva | Estados | Variantes | Medidas | Tokens (A3/A5) | Pantallas | A11y |
|---|---|---|---|---|---|---|
| **DataTable Familia A** (densa) | fila default · hover (solo fondo, R34/CM-01) · focus-visible · selected · active; sort asc/desc; loading (skeleton filas); empty; error | `densa` 36-40px · `cómoda` 48-52px · `accionable` (menú de fila) · `sticky-1st-col` (móvil) | filas 36-40 (densa) / 48-52 (cómoda) / ≥48 accionables (R35); radio `--veta-radius-none`; separador `--veta-border-subtle`; cabecera+1ª col sticky `--veta-z-sticky`; ver §5 | bg `--veta-bg-surface`; header text `--veta-text-muted`; fila hover `--veta-bg-surface-alt`; selected border-strong izquierda 2px; sort `aria-sort`; dato dinero/medida `--veta-text-data` (mono tabular); skeleton filas `--veta-skeleton-bg` | P-13/P-14/P-16/P-20/P-21/P-22/P-23/P-15/P-24/P-12 | `<table>` + `<caption>` + `scope`; `overflow-x:auto` + sticky (1.4.10); teclado completo (R39); menú de fila accesible (R36); selección checkbox ≥48; `aria-sort`; zero CLS (skeleton geometría final) |
| **DataTable Familia B** (cards) | tarjeta default · hover · focus-visible · selected; empty | `tabla` (desktop) · `card-collapse` (móvil, mismo orden de datos, R34/D6) | fila 48-52; card móvil con `aspect-ratio` si hay imagen (R37); radio `--veta-radius-md`; shadow `--veta-shadow-xs` | card bg `--veta-bg-raised` + border `--veta-border-subtle` + shadow-xs; título `--veta-text-heading`; badge estado semántico | P-01/P-02/P-06/P-25/P-24/F-07 | card = `<article>` con título = fila clave; orden DOM = orden lógico (1.3.2); acciones en tercio inferior móvil (R35); focus visible |
| **Tabla de caja** (finanzas) | fila por prioridad (materiales→arriendos→nóminas, R24); columna gate `bloqueada/liberada`; fila pendiente/atrasada; totales | `saldos` (contador read-only P-23) · `decisión` (gerente + panel R20) | densa 36-40; dinero derecha `tabular-nums`; estado centro; cabecera sticky; ver §4.4 y §5 | dinero `--veta-text-data` (mono); bloqueada badge `--veta-color-error-*` + candado; liberada LOCKED (DD-05); prioridad con etiqueta+icono (R22/R14); totales `--veta-text-heading` | P-20/P-21/P-22/P-23 | suma SIEMPRE del servidor (R05), nunca recálculo cliente; resumen textual del total; gráficos con patrones+etiquetas (R22); gate E-20 con acción a un clic (R20) |
| **Paginación** | page current · disabled · loading | `páginas` · `carga-incremental` (load more) | botones 40-48px; gap `--veta-space-2`; radio sm | botón ghost; actual borde/texto `--veta-color-brand`; `aria-current="page"` | P-13/P-21/P-22/P-25/P-03 | `aria-current="page"`; labels descriptivos; teclado; no ocultar conteo |
| **KPI Tile** (+sparkline) | default · loading (skeleton) · error · tendencia up/down | `valor` (28-32px + compare 14px + sparkline) · `semáforo` (R21) · `expansible` (desglose P10) | número `--veta-text-kpi` (clamp 28-32, grueso, tabular); compare `--veta-text-kpi-compare` 14px; sparkline 40px alto; tarjeta padding `--veta-space-4`; shadow-xs | número `--veta-text-heading`; comparación `--veta-text-muted`; sparkline trazo `--veta-gold-600` (DECISION_DISEÑO DD-A4-10); tendencia icono+texto (R14); skeleton `--veta-skeleton-bg` | P-20/P-21/P-22/P-23/P-06/P-16 | número = héroe (P09); máx 5-7 KPIs (R21); sin animación de conteo (R05/RM-04, el número salta al valor); sparkline con valor textual alternativo (R22); tooltip con número exacto |

#### 2.4 Contenedores y estructura

| Primitiva | Estados | Variantes | Medidas | Tokens (A3/A5) | Pantallas | A11y |
|---|---|---|---|---|---|---|
| **Card / Tarjeta** | default · hover · focus-visible (si enlazada) · selected | `entidad` (Familia B) · `portafolio` (16:9, hover scale-103/0.8s A5, SOLO público) · `glass` (público) | radio `--veta-radius-md` (público `lg`); padding `--veta-space-4`/`--veta-space-5`; media `aspect-ratio` 16:9 (R37); shadow-xs | bg `--veta-bg-raised` + border `--veta-border-subtle` + `--veta-shadow-xs`; glass `--veta-glass-bg`+`--veta-glass-border`+`--veta-shadow-glass`; título `--veta-text-heading` | F-01/F-02/F-07/P-25/P-06/P-01 | imagen alt (1.1.1); aspect-ratio reservado cero CLS (R37); tarjeta enlazada focus-visible + teclado (R36); hover portafolio bajo reduce-motion = estática (A5) |
| **Modal** (dialog) | abierto/cerrado; entrada 200ms `ease-out` · salida 150ms `ease-in` (A5) | `confirmación` (R18b: efecto nombrado, botón destructivo NO auto-enfocado) · `wizard` (firma E-13) · `full-screen` (móvil) | desktop max-w 480-640px; radio `--veta-radius-md`; shadow `--veta-shadow-lg`; z-modal; backdrop `rgba(43,43,43,0.4)` (derivado, GV-A4-05) | bg `--veta-bg-raised` + border `--veta-border-subtle`; título `--veta-text-heading`; cuerpo `--veta-text-primary`; destructivo `--veta-btn-danger-bg` | P-05 (firma E-13)/P-08 (E-18 reproceso)/P-14 (E-21 rechazo)/P-17 (E-24)/P-09 (E-33 causa)/P-22/P-20/F-07 | `role="dialog"`+`aria-modal`+`aria-labelledby`/`aria-describedby`; focus trap + Esc + retorno al trigger (R39); sin shake (R18/RM-02); destructivo nunca auto-enfocado (R18); móvil full-screen (INS:70) |
| **Drawer / Bottom-sheet** | abierto/cerrado; slide 300ms `ease-out` (A5) | `nav-drawer` (móvil R33) · `task-sheet` (formularios móvil) · `side-panel` (progressive desktop) | nav 280px; bottom-sheet 100% ancho, ≤85vh; radio top `--veta-radius-lg`; shadow `--veta-shadow-xl`; z-drawer-nav / z-drawer-sheet | bg `--veta-bg-raised`; shadow-xl; borde superior `--veta-border-subtle` | P-01/P-02/P-03/P-04/P-07/F-07 | `role="dialog"` (sheet) o `<nav>`; foco atrapado mientras abierto; Esc; retorno al trigger; scroll interno; reduce-motion = sin slide (crossfade, A5) |
| **Accordion** | colapsado · expandido · disabled; transición 200ms `ease-in-out` grid-rows (A5, cero CLS) | `progressive-disclosure` (R08/P10) · `detalle-fila` · `auditoría` | fila 48px; padding `--veta-space-4`; chevron 20px; borde `--veta-border-subtle` | bg `--veta-bg-raised`/`--veta-bg-surface`; resumen `--veta-text-primary`; detalle `--veta-text-muted` | P-02/P-09/P-21/P-22/P-08 | `<button>` con `aria-expanded`+`aria-controls`; región; foco; altura real grid-rows (nunca max-height mágico, P10) |
| **Tabs** | activo · inactivo · hover · focus-visible · disabled | `secciones` (P-25 garantía 3 secciones) · `sub-navegación` · `scrollable` (móvil) | altura 48px; radio none; underline activo 2px `--veta-border-brand` | texto inactivo `--veta-text-muted`; activo `--veta-text-primary` + underline `--veta-color-brand` | P-25/P-08/P-20/F-07 | `role="tablist"`/`tab`/`tabpanel` + `aria-selected` + tabindex roving; flechas; panel `aria-labelledby` |
| **Sidebar / Nav** | item default · hover · focus-visible · active · disabled (scoping por rol R08) | `sidebar` (desktop ≥220px) · `rail` (tablera 64px íconos) · `drawer` (móvil R33) | sidebar 220-260px; rail 64px; item 48px; gap `--veta-space-1`; z-nav | bg `--veta-bg-surface`; item activo bg `--veta-bg-raised` + borde izquierdo `--veta-border-strong`; texto `--veta-text-primary`/`--veta-text-muted` | todo el ERP; F-07 (portal, menos densidad) | `<nav>` + `aria-label`; skip-link (2.4.1); foco visible; rail con tooltip; nunca hamburguesa desktop (R33); activo icono+texto |
| **Header de contexto** (P01) | default (contexto estático) · alerta (SLA/gate pendiente) | `proyecto+módulo+rol+gate` (ERP) · `breadcrumb` (2.4.5) · `sticky` | alto 56px; sticky `--veta-z-header`; `scroll-padding-top` = alto (R39/2.4.11) | bg `--veta-bg-raised` + border `--veta-border-subtle`; título `--veta-text-heading`; módulo/rol `--veta-text-muted`; badge de gate embebido | P-02/P-07/P-08/P-09/P-11/P-13/P-14/P-17/P-18/P-19/P-20/P-26 | contexto traído del schema (R09, nunca tecleado); breadcrumb `<nav aria-label>`; foco no oscurecido por el sticky (2.4.11) |
| **Dropdown / Menú de acciones** | cerrado · abierto · item default/hover/focus-visible/disabled; 150ms `ease-out` fade+translateY 4-6px (A5) | `fila` (acciones de fila) · `contextual` (por lead R29) · `bulk` (reasignar) | trigger ≥48px; menú 200-280px; item 40-48px; radio sm; shadow `--veta-shadow-md`; z-dropdown | menú bg `--veta-bg-raised` + border `--veta-border-subtle`; item hover `--veta-bg-surface-alt`; destructivo dentro del menú `--veta-color-error-text` | filas de tabla/kanban/KPI (R29) | trigger `<button>` `aria-haspopup="menu"`+`aria-expanded`; menú `role="menu"`+`menuitem`; flechas + Esc; acciones visibles desktop / tap móvil, NUNCA solo hover (R36) |

#### 2.5 Feedback y estado

| Primitiva | Estados | Variantes | Medidas | Tokens (A3/A5) | Pantallas | A11y |
|---|---|---|---|---|---|---|
| **Badge / Chip de estado** | estado fijo por semántica; anima como UNIDAD (crossfade icono+texto+color 150ms, A5) | `solo` · `chip-accionable` (filtro) · `con-countdown` (SLA) · `borrador` (D3) | alto 24-32px; radio `--veta-radius-full`; padding `--veta-space-2`; icono 16px + texto `--veta-text-sm` | error `--veta-color-error-*`; warning `--veta-color-warning-*`; info `--veta-color-info-*`; success LOCKED (DD-05); borrador `--veta-status-draft-*` (bg lino + borde dashed + label neutral, D3 sin colores de confirmación); "en curso" info | todas; gates E-18/E-21/E-24/E-33/E-20, P-10/P-14/P-25/F-07 | icono+texto+color, NUNCA solo color (R14/1.4.1); `aria-label` descriptivo; contraste AA (A3 medidos); crossfade unitario sin lecturas intermedias (A5) |
| **Toast** | visible · hiding; entrada 200ms / salida 150ms (A5) | `status` (info/éxito) · `alert` (error/SLA persistente hasta cerrar) · `undo` (Deshacer ~5s con traza, R15/R06) | radio `--veta-radius-lg`; shadow `--veta-shadow-lg`; z-toast; ancho 320-420px; botón cerrar ≥48px | bg `--veta-bg-raised` + border `--veta-border-subtle`; icono semántico (error/warning/info); text `--veta-text-primary` | P-04/P-07/P-08/P-14/P-17/P-20/P-22/P-05/F-07 | `role="status"` (info/éxito) vs `role="alert"` (error/SLA) (4.1.3); timeout pausa en hover/focus (2.2.1); no roba foco; icono+texto (R14); undo con botón ≥48px |
| **Tooltip** | visible on hover/focus (1.4.13: dismissible Esc, hover-pasable, persistente) | `label` (corto) · `rich` (número exacto en gráficos, R22) | radio `--veta-radius-sm`; shadow `--veta-shadow-md`; z-tooltip; padding `--veta-space-2`/`--veta-space-3` | bg `--veta-charcoal-800` (#2B2B2B) + text `#FFFFFF` (13,7:1) (GV-A4-06); flecha borde | KPI, gráficos P-22/P-23, iconos sin label | nunca depender solo del hover (R36); contenido esencial jamás solo en tooltip (P10); dismissible Esc (1.4.13) |
| **Skeleton** | animando (shimmer 1200ms `linear`, A5) · estático (reduce-motion) · con geometría final | `tabla-A` (filas 36-40 con columnas) · `cards-B` (aspect-ratio) · `foto` (aspect-ratio + caption) · `línea` (texto) | reserva EXACTA del layout final (P27 cero CLS); filas tabla; cards aspect-ratio 16:9 | bg `--veta-skeleton-bg` (#ECE7DE); shimmer highlight blanco suave; aria-busy | P-13/P-14/P-20/P-21/P-22 (A); P-01/P-02/P-06/P-25 (B); P-26/P-07/P-19/F-07 (foto); F-01/F-02 | `aria-busy="true"`; NUNCA spinner genérico de página (RV-04/RM-01); reduce-motion = relleno estático (A5) |
| **Empty-state** (vaciostate) | 3 variantes: `primera-vez` (CTA crear/importar) · `sin-datos` (texto explicativo) · `filtro-vacio` ("Limpiar filtros") | `primera-vez` · `sin-datos` · `filtro-vacio` | icono 48px; título `--veta-text-h3` (ERP: text-lg); padding `--veta-space-8`; CTA primario dorado | icono `--veta-text-muted`; título `--veta-text-heading`; texto `--veta-text-muted`; CTA primary | P-13 ("Crear primera OC")/P-01/P-15/P-25/P-03/F-07 | nunca pantalla en blanco (P26); mensaje real + acción; foco al CTA; entrada sutil 200ms (A5) |
| **Notificación push / centro** | pendiente · leída; crítica (alert) · info; contador cambia sin rebote (A5) | `toast-push` (E-23/E-34/E-60 entrante) · `contador` (header) | contador badge 20px; item 48px+; z-toast | badge semántico (error/warning/info); item hover `--veta-bg-surface-alt`; texto `--veta-text-primary` | P-10/P-17 (E-23)/F-07 (E-60)/header global | icono+texto (R14); contador con `aria-label`; foco solo si el usuario invoca el centro (A5); crítico `role="alert"` |

#### 2.6 Proceso / Gates (primitivas nuevas del estándar — GV-01/GV-02/GV-03)

| Primitiva | Estados | Variantes | Medidas | Tokens (A3/A5) | Pantallas | A11y |
|---|---|---|---|---|---|---|
| **Kanban** | columna default · over-DnD · colapsada; tarjeta default · hover · dragging · focus-visible · selected; placeholder | `embudo` (P-01, columnas por estado E-01..E-04, SLA embebido) · `taller` (P-16 módulos capa 1, tablet md) | columna 280-320px; tarjeta 280px; gap `--veta-space-3`; tarjeta padding `--veta-space-3`/`--veta-space-4`; radio `--veta-radius-md`; shadow-xs → dragging shadow-md + `scale 1.03` (A5) | columna bg `--veta-bg-surface`/alt; tarjeta `--veta-bg-raised`+`--veta-border-subtle`+shadow-xs; columna over border `--veta-border-brand` + bg `--veta-gold-100`; badge estado semántico; SLA timer embebido | P-01/P-16 | DnD es MEJORA PROGRESIVA + alternativa teclado obligatoria 2.5.7 (menú "Mover a…" con flechas; `aria-grabbed`/`aria-live` anuncian resultado); estado visible sin drag; colapso de columna no oculta estado (R37); target ≥48px; reduce-motion = snap directo (A5) |
| **Stepper de gates** | nodo `completado` (check) · `en curso` (icono+texto) · `pendiente` · `bloqueado` (guard visible) · `con excepción` (E-33 motivo); SIN animación persistente (P03/A5 estático) | `horizontal` (desktop) · `vertical` (móvil Familia B) · `compacto` (header) | nodo 32px; conector 2px; deep-link cada gate; badge E-59/E-34; radio full nodo | completado → success LOCKED (DD-05); en curso `--veta-color-info-*`; pendiente `--veta-text-muted`; conector completado `--veta-color-brand` / pendiente `--veta-border-subtle` | P-06/F-07 (progreso lenguaje cliente) | lista `ol` + `aria-label` ("Mapa de gates del proyecto"); cada nodo = enlace deep-link a su pantalla; icono+texto (R14); progreso sin animación decorativa |
| **Timeline cronograma doble** | línea contractual (sólida espresso, INMUTABLE R03) · línea interna (discontinua, movible) · desfase por causa: interna `warning` / externa-cambio-contrato `info` / bloqueante `error`; hitos · nodos de evento | `meses` · `semanas` · `compacto` | dos líneas paralelas gap 24-32px; nodo 12-16px; etiqueta desfase = chip con patrón+etiqueta+icono (R22/R14); reflow 400ms `ease-in-out` (A5, DM-04) | contractual `--veta-border-strong` (espresso sólido); interna `--veta-text-muted` dashed; desfase `--veta-color-warning-*`/`info`/`error`; fecha `--veta-text-data` (mono); timezone R40 | P-09 | gráfico con resumen textual + tabla subyacente accesible; NO solo color (R22/1.4.1); reduce-motion = recálculo instantáneo con resaltado (A5); teclado navegación de nodos; la contractual jamás se mueve en ningún modo (R03) |
| **Checklist recepción E-21** | por ítem: `pendiente` · `verificado` · `con defecto` (rechazado) · `parcial`; triplete por ítem tipo/cantidad/sin defectos (R12) | `triple` (3 checks por ítem) · `compacto` | fila ≥48px; checkbox 20px; radio sm; cascade checkmarks ≤50ms/ítem, máx 300ms, solo ≤8 ítems (A5/RM-03) | verificado → success LOCKED (DD-05); defecto `--veta-color-error-*`; pendiente `--veta-color-warning-*`/muted; botón "Recibir verificado" habilitado al pasar guard (R12/R19) | P-14 | label por ítem; estado icono+texto (R14); foco por fila; guard visible (R16); confirmación destructiva para rechazo (R18b); nunca solo color (1.4.1) |
| **Wizard de firma E-13** | paso 1..n · completado · type-to-confirm (nivel c, R18/D1) | `firma` (E-13) · `pago` (E-08/F-08) · `cuestionario-viajes` | modal max-w 640px; stepper horizontal de pasos; campos estándar; botón primario al tercio inferior móvil | como Modal + Stepper; type-to-confirm campo neutral hasta coincidir, botón se habilita al coincidir (A5: el movimiento NO es el único feedback) | P-05/F-08/F-07 | progreso con `aria` (paso actual `aria-current`); autenticación sin captcha de memoria (3.3.8); firma post-commit (R19); confirmación con el efecto nombrado, no "¿Estás seguro?" (R18) |

---

### 3. Variantes por superficie (mismo componente, 3 modos — A2 :91-95, :187)

**Regla de enlace (A2 :187):** ninguna primitiva cambia su token de color por superficie; cambia la **densidad**, la **tipografía display** y la **proporción de imagery**.

| Primitiva | ERP — "El taller en el panel" (denso, dato-first) | Sitio público — "Luz & Biofilia" (emocional) | Portal cliente — "Tu proyecto, en calma" (tranquilidad) |
|---|---|---|---|
| **Button primary** | dorado `--veta-btn-primary-bg` (gold-600) + texto blanco; altura 48px; UNA acción primaria por pantalla (R10) | mismo token; más grande (altura 56px opcional, DECISION_DISEÑO público DD-A4-09); único CTA dominante por vista → WhatsApp/agendar (H8, A2 :139) | mismo token; un CTA por decisión (pagar/firmar/solicitar); en tercio inferior móvil (A2 :160) |
| **Input** | 48px, radio sm 4px, escala estática rem (`--veta-text-sm`/base) | escala fluida `clamp()` (R37), radio puede crecer a md (DECISION_DISEÑO), label `--veta-text-label` | 48px, igual que ERP, menos campos visibles (progressive disclosure) |
| **Select / Datepicker** | igual que Input; popover shadow-md; 36-40px de dato en tablas | mismo componente, mayor padding de toque (`pointer:coarse`) | mismo componente, simplificado al rango de acción del cliente |
| **DataTable** | Familia A densa 36-40px (P-13/P-20/P-21/P-22); Familia B cards en P-01/P-06; radio none; sin sombras decorativas | NO hay tablas de datos en el público (solo cards/portafolio F-01/F-02) | progreso por etapa = Stepper vertical (F-07), sin tablas densas |
| **Card** | bg raised + border-subtle + shadow-xs (función, RV-A3-01) | bg raised / glass `--veta-glass-bg`+`--veta-glass-border`+`--veta-shadow-glass` (nav flotante, sobre foto); portafolio 16:9 con hover `scale-103`/0.8s (A5, única excepción de marca) | bg raised; orientada a avance positivo (badge E-60 "Adelantamos tu entrega") |
| **Tipografía** | Inter estática rem xs..2xl, `--veta-text-data` mono para dinero/medidas; SIN serif (RV-02/A2 RV-01) | Fraunces display SOLO frontstage (`--veta-text-hero`, `--veta-text-display`, DD-07); Inter cuerpo | Inter; serif NO agresiva; números de saldos prominentes (`--veta-text-kpi`) |
| **Motion** | funcional 100-200ms: estados, carga, gates; sin efecto decorativo (A5 :80) | fotografía 300-800ms; UI 150-300ms; hover portafolio 0.8s (A5 :81) | 200-400ms; check "pop" emphasized + línea de progreso (A5 :82); NUNCA sugerir urgencia ni backstage (R03) |
| **Fondo** | `--veta-bg-surface` (#F7F4F0) | `--veta-bg-surface-paper` (#FCFBF9) + alterno `--veta-bg-surface-alt` (#F3EFE9) | `--veta-bg-surface-paper` (base Luz & Biofilia cálida) |
| **Glass** | PROHIBIDO (RV-A3-03) | permitido con función (nav, tarjetas sobre foto) | no necesario |

---

### 4. Componentes de los 5 gates (tabla por gate)

| Gate / Componente | Pantalla | Estados | Tokens (A3) | Motion (A5) | A11y | Labels R02 |
|---|---|---|---|---|---|---|
| **Gate Guard** (transversal R16) | P-08 (E-18), P-13 (guard E-18), P-14 (E-21), P-17 (E-24), P-18 (guard E-24), P-20 (E-20), P-09 (E-33 excepción) | `presente` (bloqueado, botón disabled con razón) · `superado` (desaparece post-commit R19) · `excepción` (E-33: motivo + quién decidió) | texto `--veta-text-muted`/warning; icono candado `--veta-text-muted`; superado → success LOCKED (DD-05); excepción registra en UI | aparecer/desaparecer instante o 150ms crossfade; post-commit R19 | texto visible SIEMPRE (R16/P08); botón `disabled` con `aria-describedby` al guard; excepción con traza auditable (R06) | "Falta veredicto de schema", "Falta verificar recepción", "Caja bloqueada" |
| **SLA Timer** (R17/P17) | P-01 (E-50 5 min, tarjeta lead), P-02, P-10 (E-34 5-24 h, novedad) | `ok` (holgura) · `riesgo` (warning, sin pulso por defecto — DM-05) · `vencido` (danger, el sistema escala y registra, R04) | cuenta `--veta-text-primary` (tabular-nums); riesgo `--veta-color-warning-*`; vencido `--veta-color-error-*`; chip `--veta-bg-raised` | el NÚMERO sigue contando bajo reduce-motion (es estado, no decoración); solo el pulso se apaga (A5) | `role="timer"` + `aria-label` ("Respuesta SLA 5:00"); icono+texto+color (R14); al vencer escala SOLO y registra | "SLA 5:00", "Novedad crítica — SLA 5-24 h" |
| **Stepper de gates** (GV-02) | P-06 (mapa de gates, sumidero) | nodo `completado` / `en curso` / `pendiente` / `bloqueado` / `excepción` | completado success LOCKED (DD-05); en curso info; pendiente muted; conector brand/pendiente; deep-link cada gate | ESTÁTICO (P03/A5: el estado es informativo, no decorativo); línea de progreso 400ms solo en F-07 (A5) | `ol`+`aria-label`; nodos enlazados (deep link); icono+texto (R14); badge E-59/E-34 | "Schema", "Recepción", "Calidad", "Cronograma", "Caja" (lenguaje cliente en F-07) |
| **Timeline cronograma doble** (GV-03) | P-09 (E-33) | línea contractual INMUTABLE (sólida espresso, R03) · línea interna movible (discontinua) · desfase: interna `warning` / externa-cambio-contrato `info` / bloqueante `error` · sin desfase | contractual `--veta-border-strong`; interna `--veta-text-muted` dashed; desfases semánticos con patrón+etiqueta+icono (R22); fecha `--veta-text-data` | reflow de la línea interna 400ms `ease-in-out` (DM-04); la contractual jamás se mueve; recálculo TRAS guardar la causa (R19) | resumen textual + tabla subyacente accesible; no solo color (R22); reduce-motion = recálculo instantáneo | "Desfase aplicado", causa interna/externa/cambio de contrato |
| **Tabla de caja** (E-20) | P-20 (+P-13 dispara), P-21, P-22, P-23 | columna gate `bloqueada` / `liberada`; fila pendiente/atrasada; prioridad materiales→arriendos→nóminas (R24) | bloqueada `--veta-color-error-*` + candado; liberada success LOCKED (DD-05); dinero `--veta-text-data`; totales `--veta-text-heading` | panel "Requiere tu decisión" entra al tope 200ms, entrada única (R20/A5); colapsa 200ms al liberar | suma del servidor (R05); acción que resuelve a un clic (R20); gráficos patrones+etiquetas (R22) | "Caja bloqueada", "Pago liberado" |
| **Checklist recepción** (E-21) | P-14 | ítem `pendiente` / `verificado` / `con defecto` / `parcial`; triplete tipo/cantidad/sin defectos (R12) | verificado success LOCKED (DD-05); defecto error; pendiente warning; botón "Recibir verificado" habilitado al pasar el guard | cascade de checkmarks ≤50ms/ítem, máx 300ms, solo ≤8 ítems (A5/RM-03); check "pop" 200ms emphasized | label por ítem; icono+texto (R14); foco por fila; guard visible (R16); rechazo con R18b | "Recibido verificado", "En espera de ítem", "Reprocesar módulo X" |

**Apoyo transversal de los gates:** Badge (#23), Modal (#17, R18b), Toast (#24, `role="alert"` para E-23/E-34/E-20) — ver §2.5/§2.4.

---

### 5. Tablas — Familia A y Familia B (R34)

**Criterio de asignación (B1-2:123):** "escaneo/consulta de estado" → Familia A (P-13/P-14/P-16/P-20/P-21/P-22/P-23/P-15/P-24/P-12); "progresión de embudo/pipeline" → Familia B (P-01/P-02/P-06/P-25/P-24/F-07).

| Aspecto | Familia A (datos densos) | Familia B (entidades con prioridad móvil) |
|---|---|---|
| Filas cómodas | 48-52px | 48-52px |
| Filas densas | **36-40px** (solo lectura) | n/a (cards) |
| Filas accionables | ≥48px mínimo (R35) | tarjeta ≥48px |
| Móvil | `overflow-x:auto` + 1ª columna sticky con fondo sólido + cabecera sticky (`--veta-z-sticky`); **PROHIBIDO colapsar a cards (R34)** | card collapse en base con MISMO orden de datos (1.3.2) |
| Alineación (INS:70) | texto izquierda · numérico/fechas derecha (`--veta-text-data` tabular) · badges/estados centro | igual por campo |
| Columna de acciones | menú de fila (Dropdown #37) en la última columna; acciones visibles desktop, tap móvil, teclado siempre (R36) | acciones en tercio inferior de la card (R35) |
| Estados de fila | default · hover (SOLO fondo 100ms, R34/CM-01) · selected (borde izquierdo 2px `--veta-border-strong`) · active · loading (skeleton filas) · empty | default · hover · focus-visible · selected (borde brand) · empty |
| Cabecera | sticky, bg `--veta-bg-surface`, text `--veta-text-muted`, sort `aria-sort` | n/a (título de pantalla) |
| Selección | checkbox de fila ≥48px con label | n/a |
| Paginación | sí (P-13/P-21/P-22) | carga-incremental (P-01/P-06) |
| Tokens | bg `--veta-bg-surface`; separadores `--veta-border-subtle`; fila hover `--veta-bg-surface-alt`; radio none; shadow none | card `--veta-bg-raised`+`--veta-border-subtle`+`--veta-shadow-xs`; radio `--veta-radius-md` |
| Radios de esquina | `--veta-radius-none` (cabecera/1ª col) | `--veta-radius-md` |
| a11y | `<table>`+`<caption>`+`scope`; teclado completo; `aria-sort`; `aria-current` en paginación | `<article>` por card; orden DOM lógico; focus visible |

---

### 6. A11y transversal (aplica a TODAS las primitivas, WCAG 2.2 AA — D8/B1-2:210)

| Área | Estándar | Regla/fuente |
|---|---|---|
| **Focus visible** | anillo 2px + 3:1 `--veta-ring-focus` (0 0 0 2px #FFF, 0 0 0 4px `--veta-color-focus` #1D5FD0); sobre espresso usar `--veta-color-focus-inverse` (#FFF); aparece ≤100ms; NUNCA `outline:none` sin reemplazo; `scroll-padding-top` = altura del sticky (2.4.11) | R39 (B2-1:139); A3 `--veta-ring-focus`; A5 focus 0-100ms |
| **Contraste** | texto normal ≥4,5:1 · texto grande/UI ≥3:1 (R38); dorado: gold-500/700 texto sobre claro, gold-600 relleno con texto blanco (5,1:1), gold-200 sobre espresso/foto; gold-200/300/400 NUNCA texto normal sobre claro; semánticos del mermaid (A3 §2.3) | A3 :96-159; R38 (B2-1:138) |
| **Hit targets** | ≥48×48 CSS px + 8px separación en TODA superficie interactiva (R35); piso WCAG 2.5.8 = 24px; filas accionables ≥48px; CTA primario en tercio inferior móvil; destructivos en zona de estiramiento | R35 (B2-1:130); INS:50; B1-2:259 |
| **Estado nunca solo color** | icono+texto+color (R14/1.4.1); badges se animan como unidad (A5); gráficos con patrones+etiquetas (R22); estado de documento borrador sin colores de confirmación (D3) | R14 (B2-1:89); A3 status-draft; A5 §3 |
| **ARIA por componente** | dialog (`role="dialog"`+`aria-modal`+`aria-labelledby/describedby`); toast `role="status"`/`role="alert"` (4.1.3); combobox (`aria-expanded`/`aria-controls`/`aria-activedescendant`); tabla (`caption`/`scope`/`aria-sort`); menú (`role="menu"`/`menuitem`/`aria-haspopup`); tabs (`role="tablist"`/`aria-selected`); switch (`role="switch"`/`aria-checked`); timer (`role="timer"`); paginación (`aria-current="page"`); loading (`aria-busy`); errores (`aria-invalid`+`aria-describedby`) | B1-2:210-286 (4.1.2/4.1.3); B2-1:229-232 |
| **Tab order** | skip-link (2.4.1); orden DOM = orden visual (1.3.2); drawer→tabla→modal (2.4.3); modal con focus trap + Esc + retorno al trigger (INS:70); dropdown/datepicker Esc cierra; foco no robado por toasts/paneles (A5) | R39; B1-2:338-361 |
| **Keyboard nav** | todo accionable por teclado (2.1.1): datatables flechas+Home/End, datepicker PageUp/Down, menús flechas+Esc; atajos desactivables (2.1.4): Enter/Esc/`Ctrl+S`/`/`; **kanban DnD con alternativa 2.5.7** (menú "Mover a…" por teclado, `aria-grabbed`/`aria-live` anuncian resultado; el DnD es mejora progresiva, el teclado funciona sin él) | R39; 2.5.7 (B1-2:258); A5 GM-03; A2 :210 |
| **Reduced motion** | `prefers-reduced-motion` obligatorio (H11): transformaciones ninguna, fades a instante, shimmer estático, DnD snap directo, reflow = recálculo; el NÚMERO del SLA y el anillo de foco NO se apagan (son estado); ninguna superficie depende de la animación (corolario A5) | A5 §7; B2-1:220,293 |

---

### 7. Clasificación de hallazgos

#### CORRECCION_VISUAL (lo que contradice decisiones aprobadas o criterio)

| ID | Hallazgo | Fuente | Resolución |
|---|---|---|---|
| CV-A4-01 | Cualquier primitiva que renderice **éxito con verde literal** (badge success, checkbox E-21 verificado, stepper completado, caja liberada, tendencia KPI) viola DD-05 LOCKED | A3 :150-159 | R14: icono+texto+neutral mientras el Supervisor decide; los contratos lo marcan LOCKED |
| CV-A4-02 | Botón destructivo sin token componente; la opción B de DD-05 (ámbar/bronce) **colisiona con warning** y no sirve para destructivo | A3 :157; R18 (B2-1:98) | `--veta-btn-danger-bg` mapea al primitivo danger `#B3261E` (A3 §2.3 nota) + texto blanco (6,5:1); la PoC lo declara en `@theme` |
| CV-A4-03 | Menús de acciones de fila **solo-hover** — inaccesibles por teclado | R36 (B2-1:131) | acciones visibles desktop + tap móvil + `:focus-visible` equivalente siempre |
| CV-A4-04 | Anillo de foco del navegador default en inputs/selects/datepicker custom | R39 (B2-1:139) | `--veta-ring-focus` en todo elemento interactivo custom |
| CV-A4-05 | Checkbox/radio/switch checked en azul genérico — debe ser marca | A3 gold | checked con `--veta-color-brand` (gold-600) + check blanco; switch on brand |

#### GAP_VISUAL (token/primitiva que falta para cubrir sin ambigüedad)

| ID | Hallazgo | Efecto | Quién lo resuelve |
|---|---|---|---|
| GV-A4-01 | Token de éxito (DD-05) sigue sin resolver — **bloquea el corte del token** en 5 primitivas (badge, checkbox E-21, stepper, KPI tendencia, caja liberada) | estados "aprobado/verificado" sin semántica final | Supervisor (DD-05) |
| GV-A4-02 | Kanban, stepper de gates y timeline doble **no existían en el estándar de 8** (GV-01/02/03 heredados) — este pase los formaliza como primitivas #32/#33/#34 | primera especificación de estas 3 | PoC las valida en P-01/P-06/P-09 |
| GV-A4-03 | Tokens de motion `--veta-dur-*`/`--veta-ease-*`: A3 contó "6 motion" pero no los nombró en el archivo | la PoC no puede consumirlos por nombre | PoC los declara en `@theme` desde la tabla de A5 §2 |
| GV-A4-04 | Token de backdrop de modal no definido por A3 | modales sin fondo especificado | PoC declara `rgba(43,43,43,0.4)` (derivado) |
| GV-A4-05 | Token de tooltip oscuro no definido por A3 | tooltips sin contraste garantizado | PoC declara bg `--veta-charcoal-800` + texto blanco (13,7:1, A3 :109) |
| GV-A4-06 | Glosario único de estados/verbos (H07) no existe | labels finales de badges/gates dependen de él | Orquestador/Supervisor (H07, B2-1:289) |
| GV-A4-07 | "Tabla de caja" y "checklist E-21" como composiciones nuevas fuera del estándar de 8 | composiciones sin contrato previo | este pase (§4); PoC las valida |
| GV-A4-08 | Densidad por modo de superficie (ERP/publicado/portal) sin token formal — es un mecanismo de uso, no un valor | sin token no hay switch de modo | PoC: declarar utilidad de modo (p.ej. `data-surface`) mapeada a los mismos tokens; NOTA: no es GAP de color |

#### RUIDO_VISUAL (estilo sin función — prohibido en las primitivas)

| ID | Hallazgo | Regla |
|---|---|---|
| RV-A4-01 | Sombras decorativas en tarjetas/filas del ERP (solo `none/xs/sm/md` con función; `lg/xl` solo modal/drawer) | RV-A3-01 |
| RV-A4-02 | Display serif Fraunces dentro del ERP (SOLO frontstage) | RV-A3-02 / A2 RV-01 |
| RV-A4-03 | Spinner genérico de página en vez de skeleton del layout final | RV-A4 (P27) / RM-01 |
| RV-A4-04 | Glassmorphism dentro del panel admin | RV-A3-03 |
| RV-A4-05 | Animación de conteo de KPI y stagger largo de filas | R05/RM-04; RM-03 (cascade ≤50ms/ítem ≤8) |

#### DECISION_DISEÑO (gusto/negocio — default razonado aplicable, no bloquea la PoC salvo DD-05)

| ID | Hallazgo | Opciones / default |
|---|---|---|
| DD-A4-01 | **Estado de éxito** (heredado DD-05): ¿verde funcional backstage (A) o no-verde bronce (B)? | **A) verde ERP `#1E7A4F` (recomendada)** · B) bronce que colisiona con warning; afecta 5 primitivas |
| DD-A4-02 | Familias tipográficas (heredado DD-07): Fraunces / Inter / IBM Plex Mono | propuesta A1 validada por A3 |
| DD-A4-03 | Card collapse en listas de gestión Familia B (heredado D6/H05) | permitido por defecto en P-01/P-06/P-25 |
| DD-A4-04 | ¿Pulso de SLA "en riesgo" en el ERP? (heredado DM-05) | default NO (badge estático icono+texto+countdown) |
| DD-A4-05 | Reflow del cronograma: ¿animar el movimiento de fechas 400ms o solo recálculo con resaltado? (heredado DM-04) | default 400ms `ease-in-out`; la contractual inmutable en ambos |
| DD-A4-06 | ¿Confetti/celebración en E-26/cierre? (heredado DM-01) | default celebración contenida (check emphasized + glow dorado), sin confetti |
| DD-A4-07 | "Nudge" de una sola vez en CTA WhatsApp (heredado DM-03) | default sin nudge (sobriedad artesanal) |
| DD-A4-08 | View Transitions API para el crossfade de rutas ERP (heredado DM-02) | PoC decide |
| DD-A4-09 | Radio de inputs/CTAs en el frontstage (¿md 8px en vez de sm 4px?) y altura de CTA público (56px) | gusto público; default sm 4px / 48px |
| DD-A4-10 | Trazo del sparkline KPI (gold-600 vs espresso-700) | default gold-600 (marca); alternar si compite con el CTA dorado (R10) |

#### DIFERIDO (se registra, no se especifica)

| ID | Hallazgo |
|---|---|
| DF-A4-01 | Primitivas de la tienda F-04/F-05/F-06 (catálogo, ficha, checkout) — frontera DIFERIDO (DF-01) |
| DF-A4-02 | P-32 KPIs gerenciales y P-33 curaduría de testimonios (DF-02/DF-03) |
| DF-A4-03 | Render IA de producto, facturación DIAN, firma digital avanzada (el wizard E-13 cubre v1) |

**Conteo:** 5 CORRECCION_VISUAL · 8 GAP_VISUAL · 5 RUIDO_VISUAL · 10 DECISION_DISEÑO · 3 DIFERIDO = **31 hallazgos** (de los cuales 8 DD son heredados de A2/A3/A5).

---

### 8. Trazabilidad / Notas para el Orquestador

**Fuentes y afirmaciones clave:**

| Afirmación | Fuente (archivo:línea) |
|---|---|
| Jerarquía de tokens primitivo→semántico→componente; regla "literal = falta token canónico"; mapeo a Tailwind v4 `@theme` | `d4_a3_tokens_visuales.md:74-94` |
| Primitivos neutros/dorados/semánticos/estado-documento/skeleton/focus con hex y contraste | `d4_a3_tokens_visuales.md:100-185` |
| Éxito LOCKED en DD-05 con opciones A/B medidas; R14 permite neutral+icono mientras tanto | `d4_a3_tokens_visuales.md:150-159` |
| Tipografía (familias DD-07, escala estática/fluida, kpi/mono/label) | `d4_a3_tokens_visuales.md:187-220` |
| Spacing 4px, radios, bordes, sombras, z-index | `d4_a3_tokens_visuales.md:222-297` |
| GAP del estándar de 8 componentes: kanban GV-01, stepper/timeline GV-02, cronograma doble GV-03 | `d4_a2_concepto_superficies.md:282-284` |
| 3 superficies = 1 sistema, 3 modos (densidad/display/imagery); regla de enlace: mismo token, distinta densidad | `d4_a2_concepto_superficies.md:162-187` |
| Estándar de 8 componentes base con estados y a11y (botón/input/select/tabla/modal/toast/dropdown/datepicker) | `d3_ui_b1_2_responsive_design.md:290-361` |
| Dos familias de tablas (A densa sticky / B cards) con criterio de asignación | `d3_ui_b1_2:120-123,329-336` |
| Filas cómodas 48-52 / densas 36-40; alineación por tipo; KPIs 28-32+14+sparkline | `d3_ui_b1_2:26-28` (INS:70) |
| R10 dorado una acción primaria; R14 estado icono+texto; R16 guard visible; R17 SLA timers; R18 destructiva; R34/R35 | `d3_ui_b2_1_destilacion_inv.md:85,89,91,92,98,129,130` |
| Convenciones de interacción (toasts, focus, undo, empty states, loading, atajos) | `d3_ui_b2_1:224-236` |
| Glosario de verbos R02 ("Aprobar schema", "Recibir verificado"…) — GAP H07 | `d3_ui_b2_1:72,235,289` |
| Empty states 3 variantes; loading skeleton sin CLS; destructiva escalada | `d3_ui_b1_1_ux_ergonomia.md:97-99` |
| 34 pantallas core y 5 gates con predicado y pantalla | `d3_ui_consolidado.md:24-86,92-98` |
| Timing/easing (dur 0-800, ease out/in/in-out/emphasized/linear); compositor-only; reduce-motion | `d4_a5_motion_efectos.md:88-138,216-235` |
| Transiciones de estado de los 5 gates (icono+texto, post-commit R19) | `d4_a5_motion_efectos.md:142-162` |
| DnD kanban con alternativa teclado 2.5.7; skeleton por geometría | `d4_a5_motion_efectos.md:174-196` |
| Vocabulario del diamante 4 (CORRECCION/GAP/RUIDO/DECISION/DIFERIDO) | `diamante4_metodologia.md:83-89` |

**Notas para el Orquestador:**

1. **Qué decide el auditor B1 (diamante 4):** verificar que cada contrato de este pase (medidas, tokens, estados) tenga coherencia con las 34 pantallas del consolidado (ninguna primitiva sin pantalla, ninguna pantalla sin primitiva — cobertura 38 primitivas / 34 pantallas ✓) y que el checklist WCAG 2.2 de B1-2 se cumpla por primitiva, no solo por pantalla.
2. **Qué decide la PoC (Ola 7):** (a) declarar en `@theme` de Tailwind v4 los tokens que A3 marcó como mapeo y este pase necesita: `--veta-btn-danger-bg` (mapea a danger `#B3261E`), tooltip oscuro, backdrop `rgba(43,43,43,0.4)`, `--veta-dur-*`/`--veta-ease-*` desde A5 §2 (GV-A4-03), utilidad de modo de superficie; (b) validar en pantalla las 3 primitivas nuevas (kanban P-01, stepper P-06, timeline P-09) y las 2 composiciones (tabla de caja P-20, checklist P-14); (c) fijar con herramienta los contrastes de A3 (DD-A3-02) antes de cortar tokens.
3. **Qué escala al Supervisor (no bloquea la PoC salvo el corte del token de éxito):** **DD-05 (éxito)** — bloquea el valor del token success en 5 primitivas, aunque R14 permite renderizar con icono+texto+neutral mientras tanto; **DD-07 (familias)**, D6 (cards), DM-01/03/04/05 (motion) y DD-A4-09/10 (gusto público). El resto de DD son default razonado aplicable.
4. **GAP de proceso heredado:** GV-A4-06 (glosario H07) debe crearse antes de escribir los labels finales de badges/estados; este pase usa los verbos ya listados en `d3_ui_b2_1:235`.
5. **Restricciones respetadas:** no se tocó ningún otro archivo; este pase solo escribe `d4_a4_primitivas_ui.md`. No se escribió código, no hay commits. No se inventó marca: lo incierto está en `DECISION_DISEÑO`; los valores fuera del corpus se marcan `(derivado)` y se justifican.
6. **Conteo para el reporte:** **38 primitivas** inventariadas · **6 dedicadas + 3 de apoyo** implicadas en los 5 gates · cobertura **34/34 pantallas** · hallazgos: 5 CORRECCION_VISUAL · 8 GAP_VISUAL · 5 RUIDO_VISUAL · 10 DECISION_DISEÑO · 3 DIFERIDO.

---

## Registro

- Fecha: 2026-08-04.
- Pase: D4-A4 (Ola 3 del Diamante 4, después de A2/A3/A5), lente primitivas UI.
- Archivo de salida único: `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d4_a4_primitivas_ui.md` (este archivo).
- Resultado: **38 primitivas** en 8 categorías (contrato completo: estados/variantes/medidas/tokens/pantallas/a11y) · **6 primitivas dedicadas + 3 de apoyo** para los 5 gates · cobertura **34/34** pantallas core · hallazgos: 5 CORRECCION_VISUAL · 8 GAP_VISUAL · 5 RUIDO_VISUAL · 10 DECISION_DISEÑO · 3 DIFERIDO.
- No se modificó ningún otro archivo.
