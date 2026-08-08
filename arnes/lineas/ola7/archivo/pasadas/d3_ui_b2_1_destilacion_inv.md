# Pase B2-1 — Destilación de investigaciones (subagente, loop de 3 iteraciones)

**Lente:** destilación de las investigaciones de la Ola 1 (B1-1 UX/ergonomía, B1-2 responsive/design system, B1-3 clasificación INV) en **reglas aplicables, priorizadas** para que B3 las use en el contrato de pantalla (`diamante3_metodologia.md:110-123`).
**Fuentes leídas:** `d3_ui_b1_1_ux_ergonomia.md` (28 principios P01-P28, 4 reglas transversales, DECISION_PENDIENTE D1-D4), `d3_ui_b1_2_responsive_design.md` (breakpoints, checklist WCAG 2.2, componentes, tokens, 4 DECISION_PENDIENTE), `d3_ui_b1_3_inv_clasificacion.md` (7 VALIOSA / 5 REFERENCIA / 5 DESCARTADA), `diamante2_define_eventos.md` (contexto de negocio), `diamante3_metodologia.md` (método). No se leyeron outputs de otros sub-agentes (serialización).
**Leyenda de fuentes:** `B1-1` = d3_ui_b1_1_ux_ergonomia.md · `B1-2` = d3_ui_b1_2_responsive_design.md · `B1-3` = d3_ui_b1_3_inv_clasificacion.md · `define` = diamante2_define_eventos.md · `met` = diamante3_metodologia.md.
**Trazabilidad:** `archivo:línea` en todo hallazgo. Vocabulario del diamante 3 (`met:98-107`): `DECISION_PENDIENTE` = requiere decisión de negocio del Supervisor.

---

## Iteración 1 (bruta)

Inventario crudo de todo lo que las 3 investigaciones ofrecen como candidato a regla para el contrato de pantalla:

- **B1-1:** 28 principios (P01-P28) en 4 bloques + 4 reglas transversales (B1-1:43-47) + 4 `DECISION_PENDIENTE` (D1-D4, B1-1:107-110).
- **B1-2:** 4 tierings de breakpoints (B1-2:87-94) + regla de contrato de 3 breakpoints (B1-2:96) + reflow obligatorio (B1-2:98) + 10 principios responsive (B1-2:118-130) + checklist WCAG 2.2 de 56 criterios (B1-2:210-286) + estándar de 8 componentes base (B1-2:290-361) + design tokens (color/espaciado/radio/tipografía, B1-2:140-206) + 4 `DECISION_PENDIENTE` (B1-2:393-397).
- **B1-3:** 7 INV VALIOSA (B1-3:44-50) con principios extraíbles: gobernanza agéntica, reglas de negocio del motor viejo (matemática en servidor, rastreabilidad, matemática ciega, verificación humana, workspaces por rol, KPIs derivados), diseño axiomático (B1-3:90-94), ergonomía cognitiva (B1-3:96-100), responsive (B1-3:102-112), calendar math (B1-3:114-119), SEO/JSON-LD (B1-3:121-128); 5 REFERENCIA (B1-3:51-55); 5 DESCARTADA (B1-3:56-61).
- **Contexto de negocio (define):** 15 bounded contexts, 61 eventos, gates deterministas E-18/E-21/E-24/E-33/E-20 (define:73-79), capa 1 vs capa 2 (define:168-176), KPI por subsistema (define:178), SLA 5 min E-50 (define:132), reproceso recuperable E-54 (define:116), verificador único = comercial (define:153), E-41 retoma comercial+desarrollador (define:138).

**Choques y solapamientos detectados a priori:**
1. `tabla→card` (misión) vs. INS (desaconseja colapsar tablas de gestión) — ya resuelto en B1-2 como regla de **dos familias** (B1-2:120-123).
2. `48px` (estándar) vs. `24px` (piso WCAG 2.2 2.5.8) — se adopta 48×48 como barra de diseño (B1-2:124, :259).
3. `2.4.13 Focus Appearance` es AAA, no AA — se adopta como meta, no como requisito AA (B1-2:61, :286).
4. `Autoguardado` vs. `línea contractual inmutable` — se resuelve por el cronograma doble I-034 (B1-1:18; define:20).
5. Dorado de marca vs. contraste 1.4.3 — el dorado solo como acento sobre fondos oscuros o large-text/UI (B1-2:65, :151).
6. `display:none` móvil, `vw` puro, contenedores px fijos, hamburguesa en desktop — prohibidos explícitamente (B1-2:18, :60, :119, :130).
7. Motor "Agnostic/Zap" (schema-driven) **prohibido** — B1-3 conserva solo el conocimiento de negocio del motor viejo, nunca su mecanismo (B1-3:170).

**Conteo bruto de candidatos:** ~28 (B1-1) + 10 (responsive) + 56 (WCAG) + 8 (componentes) + ~9 (INV de negocio B1-3) + ~6 (tokens) = **>110 ítems**. La destilación debe llevarlos a ≤40 reglas accionables.

---

## Iteración 2 (autocrítica)

Qué se sostiene, qué cae, qué se fusiona, qué faltaba:

1. **Cae lo genérico, no lo accionable.** De B1-1: eye-tracking, telemetría de cursor y clasificación de perfiles cognitivos por ML son investigación, no decisión de diseño (B1-1:29). De B1-2: 2.4.13 como requisito AA (es AAA, B1-2:61), EN 301 549 como mandato legal en Colombia (es referencia europea, B1-2:66). De B1-3: las 5 DESCARTADAS por contenido (B1-3:56-61).
2. **Las reglas de negocio del motor viejo (B1-3) NO son reglas de pantalla: son invariantes que la pantalla debe respetar.** Matemática en servidor, matemática ciega, anular-no-borrar y verificación humana se traducen a: "la UI muestra cálculo, no lo duplica", "los errores se anulan con traza, no se borran", "hay pantalla de revisión antes de automatizar". Se escriben como reglas de comportamiento de pantalla.
3. **Fusión por tema en vez de lista plana.** Los 28 principios de B1-1 + 10 de B1-2 + WCAG + INV colapsan por tema: estados (P03+P22+checklist 1.4.1 → 1 regla), gates (P08+P07+D1 → 2 reglas), dashboards (P20-P25 → 5 reglas), responsive (10 principios → 8 reglas), rendimiento (CLS+display:none+clamp → 1 regla). Los 4 "gates deterministas" y la "confirmación destructiva" se separan porque son capas distintas (negocio vs. interacción, B1-1:34).
4. **Priorización no es solo obligatoriedad.** Se separa **prioridad de ejecución** (P1 alta / P2 media / P3 baja, para que B3 resuelva primero lo que desbloquea el resto) de **nivel de obligatoriedad** (obligatoria = criterio duro; recomendada = meta de calidad). Ej.: SLA-temporizador es obligatoria (negocio) pero P2 (secundaria a los flujos core); contraste AA es obligatoria y P1.
5. **Lo que casi se me escapa:** (a) teclado/foco en datatables (el ERP es denso en tablas — B1-2:62) debe quedar como regla explícita, no solo checklist; (b) calendar math (timezone + hidratación SSR + colisiones) es obligatorio para el contexto central Control de cronograma (B1-3:114-119) y no estaba en B1-1/B1-2; (c) empty states y loading (P26/P27) viven en las convenciones de interacción, no solo en la tabla.
6. **Resoluciones de las 8 `DECISION_PENDIENTE` (4 de B1-1 + 4 de B1-2):** se aplica mejor juicio con justificación (ver sección dedicada). 6 requieren reconfirmación del Supervisor (afectan contrato/negocio/build); 2 se resuelven por decisión ya tomada (I-034) o por ser barra de calidad, no contrato.
7. **No hay glosario único de estados/verbos** (requisito P02 de B1-1:58): se declara GAP — B3 necesita esa fuente única antes de escribir labels.

---

## Iteración 3 (refinamiento final)

Estructura final del entregable:

- **40 reglas destiladas** en 8 grupos, cada una con trazabilidad, rol/pantalla, obligatoriedad y prioridad. Orden de los grupos = prioridad descendente: Fundacionales (P1) → Ergonomía/estados (P1) → Gates y confirmaciones (P1) → Dashboards (P1) → Flujos de campo (P1) → Responsive (P1) → Accesibilidad (P1) → Dominio específico (P2).
- **Design tokens finales** para B3, consolidados de B1-2 §3 con marca `DECISION_PENDIENTE` en hex y fuente.
- **Convenciones de interacción** del ERP (confirmaciones, empty states, loading, errores, atajos, toasts, focus, undo, conectividad, consistencia).
- **Resolución de las 8 `DECISION_PENDIENTE`** heredadas.
- **Qué NO usar** con razón.
- **Hallazgos** (incluye los `DECISION_PENDIENTE` que escalan al Supervisor).

Reglas de oro de esta destilación (heredadas de B1-1:43-47):
1. La UI es el arnés del operador, no el operador de la UI.
2. Vocabulario del taller y del cliente, nunca del schema.
3. Dos lenguajes visuales explícitos: backstage honesto / frontstage selectivo.
4. El sistema previene el olvido humano (automatiza, no recuerda).

---

## Reglas destiladas aplicables

### Grupo F0 — Fundacionales (reglas de comportamiento que gobiernan TODO contrato de pantalla)

| ID | Regla (accionable) | Fuente (B1-X:línea / INV) | Rol/pantalla que aplica | Nivel de obligatoriedad | Prioridad |
|---|---|---|---|---|---|
| R01 | **La UI es el arnés del operador**: el sistema sostiene, recuerda y registra; la persona decide. Prohibido añadir fricción (confirmaciones/validaciones extra) a decisiones que la regla de negocio ya legitima (guía + registrador de la realidad). | B1-1:43-44; define:71 | Todo el ERP | obligatoria | P1 |
| R02 | **Vocabulario del taller y del cliente**: toda etiqueta, botón, estado y mensaje usa el término de negocio (módulos, módulo/componente, cajón, mesón, herraje, retoma, schema); nunca nombres de tabla ni del schema Drizzle. Requiere glosario único de estados y verbos (GAP, ver Hallazgos). | B1-1:45, B1-1:58 (P02); define:138 | Todo el ERP y portal de cliente | obligatoria | P1 |
| R03 | **Dos lenguajes visuales por audiencia**: el ERP (backstage) muestra desfases, causas y la línea interna movible; el portal del cliente (frontstage) muestra SOLO la línea contractual y el cambio positivo (E-60, "adelantamos tu entrega"). La separación es por contexto y rol; nada se oculta "por si acaso". | B1-1:46, B1-1:67 (P11); define:108; B1-1:18 | ERP vs. portal cliente | obligatoria | P1 |
| R04 | **El sistema previene el olvido humano**: descuento E-08→E-30, recálculo de fechas E-33 y comisiones E-35 se ejecutan automáticamente o con un default; nunca un recordatorio. | B1-1:47, B1-1:62 (P06); define:90 | Comercial, gerente, finanzas | obligatoria | P1 |
| R05 | **Matemática crítica en el servidor, nunca en la UI** (diodo de entropía): saldo, comisiones, fechas y dinero se calculan en el servidor; la UI solo muestra el resultado. Cálculos derivados recalculados desde el origen (matemática ciega: `saldo = Monto_Total − SUMA(abonos)`). | B1-3:82, B1-3:84 (zaps §1-2) | Cotizador, finanzas, caja, cronograma | obligatoria | P1 |
| R06 | **Rastreabilidad absoluta**: un error se anula/compensa con traza visible en pantalla, jamás se borra; la auditoría queda intacta y el historial es consultable desde la UI. | B1-3:83 (zaps §1) | Finanzas, caja, cronograma | obligatoria | P1 |
| R07 | **Verificación humana en loops críticos**: listado→orden de compra, cobro→desbloqueo de proyecto y nómina pasan por una pantalla de revisión/auditoría del input antes de automatizar el output. | B1-3:85 (zaps §1, §4) | Compras, finanzas | obligatoria | P2 |
| R08 | **Workspaces aislados por rol + progressive disclosure**: el comercial no ve internals de producción que no le aplican; causa/composición causal/comisiones se despliegan bajo demanda en "resumen de una línea + detalle expandible". | B1-3:86 (zaps §2-D); B1-1:66 (P10); B1-1:67 (I-043) | Por rol | obligatoria | P2 |

### Grupo E — Ergonomía cognitiva y estados de interfaz

| ID | Regla (accionable) | Fuente (B1-X:línea / INV) | Rol/pantalla que aplica | Nivel de obligatoriedad | Prioridad |
|---|---|---|---|---|---|
| R09 | **Una tarea por pantalla**: cada vista resuelve una decisión o una captura; header persistente con el contexto (proyecto + módulo + rol + estado del gate) traído del schema, nunca tecleado de nuevo. | B1-1:57 (P01) | Todos; crítico comercial en campo | obligatoria | P1 |
| R10 | **Jerarquía visual: lo que decide la gente es lo prominente** — una sola acción primaria dominante por pantalla (color de marca dorado); orden visual = guard pendiente → acción primaria → datos de contexto; nada compite con el dato que falta. | B1-1:65 (P09) | Todos | obligatoria | P1 |
| R11 | **Reconocimiento sobre recuerdo**: pre-cargar medidas, colores y datos de identidad del lead/cliente/proyecto; autocompletar catálogo y proveedores; nunca re-pedir datos que el sistema ya tiene (WCAG 2.2 3.3.7 Redundant Entry). | B1-1:60 (P04); B1-2:276 | Comercial, desarrollador | obligatoria | P1 |
| R12 | **Prevención de errores de interacción**: constraints y defaults en vez de mensajes — datepicker (no texto libre), selects con catálogo, cantidades con constraint de inventario/schema, checklist E-21 como checkbox, verificación por lista de compra. | B1-1:61 (P05); define:76 | Todos los formularios | obligatoria | P1 |
| R13 | **Validación en línea**: error junto al campo mientras se escribe con `aria-describedby`; al enviar, resumen de errores con anclaje al primero. | B1-1:76 (P15) | Formularios (cotización, retoma, E-21) | obligatoria | P1 |
| R14 | **Visibilidad permanente del estado + nunca solo color**: el estado del gate se codifica con icono+texto+color (WCAG 1.4.1) y badge consistente en todas las vistas; siempre visible qué falta para avanzar. | B1-1:59 (P03); B1-2:226, B1-2:159 | Comercial, desarrollador, gerente | obligatoria | P1 |
| R15 | **Deshacer en bucles reversibles**: toda captura en borrador es reversible con undo+toast; cerrar un gate (E-18/E-21/E-24) sale del borrador y exige confirmación explícita + traza. | B1-1:63 (P07) | Todos; crítico gerente y comercial | obligatoria | P1 |
| R16 | **Gates como propiedades de estado con guard**: el botón de avanzar se deshabilita con razón visible ("Falta veredicto de schema"); la excepción justificada (decisión manual E-33) registra motivo y quién decidió. El sistema avisa, registra y recalcula; no transiciona sin el guard. | B1-1:64 (P08); define:71, define:79 | Comercial (E-18/E-24), desarrollador (E-21), gerente (E-20/E-33) | obligatoria | P1 |
| R17 | **SLA visibles como temporizadores**: chip de cuenta regresiva en la tarjeta del lead (E-50, 5 min) y de la novedad crítica (E-34, 5-24 h); al vencer, el sistema escala solo (LLM o segundo comercial) y registra el incumplimiento. | B1-1:78 (P17); define:132, define:158 | Comercial, desarrollador/gerente | obligatoria | P2 |

### Grupo G — Gates y acciones destructivas

| ID | Regla (accionable) | Fuente (B1-X:línea / INV) | Rol/pantalla que aplica | Nivel de obligatoriedad | Prioridad |
|---|---|---|---|---|---|
| R18 | **Confirmación destructiva escalada al radio de daño** (matriz P28): (a) reversible → acción + "Deshacer"; (b) irreversible con radio de daño → modal con el efecto exacto nombrado ("Reprocesar módulo X recalcula el cronograma y las comisiones"); (c) solo irreversibles de alto impacto → type-to-confirm opcional. Botón destructivo en rojo, nunca auto-enfocado; nunca "¿Estás seguro?" genérico. | B1-1:99 (P28); define:116 (C2) | Gerente (E-54, E-24, E-33), comercial (descartar lead) | obligatoria | P1 |
| R19 | **Las transiciones de gate no se disparan por foco ni por cambio de input** (WCAG 3.2.1/3.2.2): cambiar un select no envía la transición sola; el cronograma recalcula TRAS guardar la causa (E-33). | B1-2:268 | Gates E-18/E-21/E-24/E-33/E-20 | obligatoria | P2 |

### Grupo D — Dashboards de gerente

| ID | Regla (accionable) | Fuente (B1-X:línea / INV) | Rol/pantalla que aplica | Nivel de obligatoriedad | Prioridad |
|---|---|---|---|---|---|
| R20 | **Decision-first, no data-first**: panel "Requiere tu decisión" al tope (E-20 caja bloqueante, E-33 desfase, E-29 atraso 12 días) con la acción que resuelve a un clic; layout de zonas: decisión → KPIs → detalle. | B1-1:86 (P20); define:133 | Gerente | obligatoria | P1 |
| R21 | **Máximo 5-7 KPIs por vista, uno por subsistema, ninguno residual**: 4 semanas (dev+carpintero 5%), ventas (comercial), 7 semanas (cliente recomienda), salud de caja + bienestar. Cada tarjeta con semáforo, tendencia y desglose al expandir. | B1-1:87 (P21); define:178 (D6) | Gerente | obligatoria | P1 |
| R22 | **Gráficos sin dependencia del color** (WCAG 1.4.1): series con patrones/textura + etiquetas; tipo de gráfico más simple (barra/línea); tooltip con el número exacto. | B1-1:88 (P22); B1-2:226 | Gerente, contador | obligatoria | P2 |
| R23 | **Bienestar como KPI automático**: carga por persona (horas trabajadas vs. compensación) medido automáticamente (V-5), nunca captura manual; alerta de saturación sin juicio humano. | B1-1:90 (P24); define:142 | Gerente | obligatoria | P2 |
| R24 | **Transparencia de compras/caja como contrato de sociedad**: vista de caja con prioridad de pagos (materiales → arriendos → nóminas) y vista SOLO-LECTURA para el contador externo con contratos pendientes de facturar. | B1-1:91 (P25) | Gerente, socios, contador | obligatoria | P2 |

### Grupo C — Flujos de campo (comercial en visita/WhatsApp, retoma, parte de taller)

| ID | Regla (accionable) | Fuente (B1-X:línea / INV) | Rol/pantalla que aplica | Nivel de obligatoriedad | Prioridad |
|---|---|---|---|---|---|
| R25 | **Input minimizado / artefacto evolutivo**: presupuesto preliminar → visita → diseño → cotización son EL MISMO formulario/proyecto con estados de completitud; los pasos vacíos no bloquean (E-49 lead no viable solo registra motivo). | B1-1:74 (P13); define:134 | Comercial | obligatoria | P1 |
| R26 | **Autoguardado de borrador**: la captura en campo se guarda sola con indicador "Guardado" visible; borrador persistido por proyecto y recuperable al reabrir; la pérdida por cierre/interrupción es un bug. Aplica SOLO a estados borrador (ver resolución de D3). | B1-1:75 (P14) | Comercial en campo | obligatoria | P1 |
| R27 | **Resiliencia de red**: toda mutación en móvil muestra estados loading/retry/offline explícitos ("sin conexión — se guardó localmente"); ninguna captura se pierde por fallo de conexión. (Política offline-first → `DECISION_PENDIENTE`, ver D7.) | B1-1:77 (P16); B1-2:132 | Comercial en campo | obligatoria | P2 |
| R28 | **Captura por foto/nota en el punto de verdad**: la documentación E-41 vive DENTRO del flujo de retoma, no en un módulo aparte; fotos por módulo con captura directa; notas de medidas/obstáculos pegadas al módulo correspondiente. | B1-1:79 (P18); define:138 (D5) | Comercial + desarrollador (retoma) | obligatoria | P2 |
| R29 | **Un solo toque para avanzar el embudo**: transiciones tipadas (lead→calificado→visita→cotización) con acción por defecto y feedback inmediato; menú contextual por lead; bulk para reasignar. | B1-1:80 (P19) | Comercial | obligatoria | P2 |

### Grupo R — Responsive y rendimiento

| ID | Regla (accionable) | Fuente (B1-X:línea / INV) | Rol/pantalla que aplica | Nivel de obligatoriedad | Prioridad |
|---|---|---|---|---|---|
| R30 | **Mobile-first**: se diseña primero la experiencia <768px y se mejora hacia desktop (Google Mobile-First Indexing desde 2023-10-31; tráfico móvil 52-67%). | B1-2:118 (principio 1); B1-3:103 | Todas las pantallas | obligatoria | P1 |
| R31 | **3 breakpoints obligatorios por pantalla** (sección 7 del contrato): base (<768), md (768-1023), ≥lg (1024+), mecanismo Tailwind v4 `min-width` mobile-first, rangos cerrados sin huecos; wide (≥1440) es mejora opcional, nunca bloqueante. | B1-2:96, B1-2:87-94; met:120 | Todas | obligatoria | P1 |
| R32 | **Reflow WCAG 1.4.10**: a 320px de ancho y 400% de zoom no hay scroll horizontal de contenido ni pérdida de información/función; scroll bidireccional solo para datos estructurados (tablas, gráficos). | B1-2:98, B1-2:231 | Todas | obligatoria | P1 |
| R33 | **Navegación por densidad de contexto**: desktop = nav lateral completa (≥220px); tablera = rail de íconos; móvil = drawer colapsable. Nunca hamburguesa en desktop. Skip-link a contenido (WCAG 2.4.1). | B1-2:119 (principio 2), B1-2:92-94 | ERP completo | obligatoria | P1 |
| R34 | **Dos familias de tablas**: Familia A (datos densos: dinero, compras, cronograma, fila del taller) = `overflow-x:auto` + 1ª columna sticky con fondo sólido + cabecera sticky, PROHIBIDO colapsar a cards; Familia B (entidades con prioridad móvil: leads, cotizaciones, proyectos, garantías) = card collapse en base con el mismo orden de datos. Criterio para B3: "escaneo/consulta de estado" → Familia A; "progresión de embudo/pipeline" → Familia B. | B1-2:120-123 (principio 3), B1-2:329-336 | Según pantalla | obligatoria | P1 |
| R35 | **Objetivos táctiles ≥48×48 CSS px + 8px de separación** en toda superficie interactiva (botones, filas accionables, links de nav, checkboxes de fila); filas accionables mín 48px; en móvil el CTA primario va en el tercio inferior (zona del pulgar) y los destructivos en zonas de estiramiento. (Piso legal WCAG 2.2 2.5.8 = 24px; el estándar lo supera por diseño.) | B1-2:124-125 (principios 4-5), B1-2:259 | Todas | obligatoria | P1 |
| R36 | **Hover ≠ interacción**: estados hover solo bajo `(hover:hover)`; toda funcionalidad de hover tiene equivalente `:focus`/`:focus-visible`; los menús de acciones de fila son accesibles por teclado y por tap en móvil (nunca solo hover); `pointer:coarse` aumenta el padding de toque. | B1-2:126 (principio 6); B1-2:355 | Todas; crítico en datatables | obligatoria | P1 |
| R37 | **Tipografía/espaciado fluidos y cero CLS**: `clamp()` con híbrido `rem+vw`, NUNCA `vw` puro ni contenedores de ancho fijo en px; base en `rem` (ERP usa escala estática rem, portal usa escala fluida); imágenes con `aspect-ratio` + dimensiones reservadas, `lazy-loading`, `fetchpriority="high"` en LCP; el contenido relevante nunca se oculta con `display:none` en móvil (se reestructura o se cuestiona el producto). | B1-2:127, B1-2:129-130; B1-3:107 | Todas; fotos E-41 | obligatoria | P1 |

### Grupo A — Accesibilidad (WCAG 2.2 AA)

| ID | Regla (accionable) | Fuente (B1-X:línea / INV) | Rol/pantalla que aplica | Nivel de obligatoriedad | Prioridad |
|---|---|---|---|---|---|
| R38 | **Contraste verificado con herramienta**: todo par de color pasa 1.4.3 (4.5:1 texto / 3:1 texto grande) y 1.4.11 (3:1 UI) ANTES de fijarse; el dorado de marca se usa como acento sobre `espresso` o large-text/UI, NUNCA para texto pequeño sobre claro. | B1-2:151, B1-2:228, B1-2:140 | Tokens y pantallas de B3 | obligatoria | P1 |
| R39 | **Operable por teclado con foco visible**: todo accionable (gates, datatables, datepicker, modales, dropdowns) por teclado (2.1.1); foco visible 2px + 3:1, nunca `outline:none` sin reemplazo (2.4.7, meta 2.4.13 AAA); sin focus trap salvo modal con Esc como salida; sticky header/footer no tapan el foco (`scroll-padding-top` = altura del sticky, 2.4.11 [N22]); labels visibles (3.3.2) e inputs ≥16px en móvil. | B1-2:240-259 (checklist O), B1-2:300-316 | Todo el ERP | obligatoria | P1 |

### Grupo X — Dominio específico

| ID | Regla (accionable) | Fuente (B1-X:línea / INV) | Rol/pantalla que aplica | Nivel de obligatoriedad | Prioridad |
|---|---|---|---|---|---|
| R40 | **Cronograma/agenda con timezone explícita y fecha determinista en SSR**: eventos persistidos con `timezone` + ISO; hidratación con cookie `x-user-timezone` + middleware de Next.js (o `suppressHydrationWarning` acotado sin flash); layout de eventos colisionantes O(n log n) con condición C(i,j) ⇔ S_i < E_j ∧ S_j < E_i; rango de instalación (≤5 días) en datepicker de rango; calendario con mini-vista de puntos en móvil y drawer/bottom-sheet según breakpoint. | B1-3:49, B1-3:114-119 (INVS_Calendar math); define:254 | Control de cronograma (B3-2), agenda, garantía (E-61) | obligatoria | P2 |

**Total: 40 reglas** (8 F0 + 9 E + 2 G + 5 D + 5 C + 8 R + 2 A + 1 X). Todas accionables; las de P1 desbloquean el 80% del contrato de pantalla.

---

## Design tokens finales

Fuente: B1-2 §3 (B1-2:140-206). **Los hex exactos y la fuente display son `DECISION_PENDIENTE` del Supervisor** (identidad de marca, B1-2:394) — lo siguiente es una propuesta coherente y contrastable; todo par de color se verifica con herramienta antes de fijarse (R38).

### Color — paleta Veta de Oro (PROPUESTA, hex pendiente de Supervisor)

| Token | Hex propuesto | Uso | Contraste objetivo |
|---|---|---|---|
| `--color-ink` | `#241C15` | Texto primario (casi negro cálido) | ≥4.5:1 (≈11:1 sobre surface) |
| `--color-ink-muted` | `#5C5349` | Texto secundario, placeholders no esenciales | ≥4.5:1 |
| `--color-surface` | `#F7F4F0` | Fondo de app (cálido neutro) | — |
| `--color-surface-raised` | `#FFFFFF` | Tarjetas, modales, inputs | — |
| `--color-border` | `#D8D0C6` | Bordes, divisores | 3:1 si es gráfico de borde |
| `--color-espresso` | `#3E2A21` | Marca madera oscura: títulos, nav, badges | 3:1 UI/large-text |
| `--color-wood` | `#6B4A35` | Acentos secundarios de marca | solo large-text/UI |
| `--color-gold` | `#A67C28` | Acento "veta de oro": iconos, focos, activo | sobre espresso ≥4.5:1; nunca texto pequeño sobre claro |
| `--color-success` | `#1E7A4F` | Cobros OK, KPI positivo, E-21/E-24 positivo | ≥4.5:1 |
| `--color-danger` | `#B3261E` | Reprocesos E-54, gates fallidos, errores | ≥4.5:1 |
| `--color-warning` | `#B06000` | SLA en riesgo, atraso E-33, comisiones reducidas | ≥4.5:1 |
| `--color-info` | `#0B5E8C` | Novedades, avisos E-34/E-60 | ≥4.5:1 |
| `--color-focus` | `#1D5FD0` | Anillo de foco visible | 3:1 (1.4.11/2.4.13) |

**Mapeo de estado de gate → token (siempre icono+texto, nunca solo color):**
- E-18 aprobado → `success`; rechazado/reproceso → `danger`/`warning`.
- E-21 `recibido_verificado` → `success`; en espera de ítems → `warning`.
- E-24 veredicto positivo → `success`; negativo → `danger`.
- E-33 desfase causa interna → `warning`; externa o cambio de contrato → `info`.
- E-20 caja bloqueada → `danger` con la acción del gerente en el panel de decisión (R20).

### Espaciado (escala base 4px para ERP; fluida para público)

| Token | Valor | Uso |
|---|---|---|
| `--space-1` | 0.25rem (4px) | ajuste fino, iconos internos |
| `--space-2` | 0.5rem (8px) | separación táctil mínima entre objetivos (R35) |
| `--space-3` | 0.75rem (12px) | padding compacto inputs, gap interno tarjetas |
| `--space-4` | 1rem (16px) | padding estándar de controles y celdas |
| `--space-5` | 1.5rem (24px) | margen entre secciones, padding de tarjetas |
| `--space-6` | 2rem (32px) | espaciado de paneles |
| `--space-8` | 3rem (48px) | separación de regiones de página |
| `--space-10` | 4rem (64px) | página wide |
| `--space-page-mobile` | `clamp(12px, 0.75rem + 1vw, 24px)` | margen lateral móvil |
| `--space-page-desktop` | `clamp(32px, 2rem + 2.27vw, 80px)` | margen lateral desktop |

### Radio

| Token | Valor | Uso |
|---|---|---|
| `--radius-none` | 0 | tablas, cabeceras de datatable |
| `--radius-sm` | 4px | inputs, botones, selects |
| `--radius-md` | 8px | tarjetas, modales |
| `--radius-lg` | 12px | toasts, datepicker |
| `--radius-full` | 9999px | badges, chips de estado |

### Tipografía

| Token | Valor | Uso |
|---|---|---|
| `--text-xs` | 0.75rem (12px) | captions, tablas densas (no texto esencial largo) |
| `--text-sm` | 0.875rem (14px) | tablas, meta, dato secundario KPI |
| `--text-base` | 1rem (16px) | cuerpo; **inputs en móvil nunca <16px** |
| `--text-lg` | 1.25rem (20px) | subtítulos, acciones de fila |
| `--text-xl` | 1.5rem (24px) | títulos de pantalla |
| `--text-2xl` | 2rem (32px) | números KPI (28-32px gruesos), h1 ERP |
| `--text-display` | `clamp(1.75rem, 1.2955rem + 2.273vw, 3rem)` | hero tienda pública (solo frontstage) |
| `--font-sans` | sistema (declarar) + display serif premium | familia `DECISION_PENDIENTE` |

- Line-height: 1.5 cuerpo / 1.25 títulos; 65-75 chars por línea.
- Mapeo a Tailwind v4: declarar en `@theme` (`--color-*`, `--spacing-*`, `--radius-*`, `--text-*`), **nunca literales inline** (hoy el código usa `#e5e5e5` en `app\(publico)\page.tsx:64` y `app\app\erp\layout.tsx:17`; B1-2:206) — B3 debe consumir tokens.
- `prefers-reduced-motion`: animaciones desactivables (práctica WCAG 2.3.3); `prefers-contrast` como mejora.

---

## Convenciones de interacción (para B3 y para el código)

1. **Confirmaciones destructivas (matriz de severidad, de R18):** (a) reversible → acción + toast "Deshacer" (ventana ~5 s, traza de auditoría); (b) irreversible con radio de daño → modal `role="dialog"` + `aria-modal` con título, efecto exacto nombrado y botón destructivo rojo no auto-enfocado; (c) irreversibles de alto impacto (firma E-13, anular cobro/compensación, cerrar contrato) → type-to-confirm opcional. Nunca "¿Estás seguro?" genérico.
2. **Empty states (P26, B1-1:97):** 3 variantes — primera vez (CTA: "Crear primer proyecto", "Importar catálogo"), sin datos ("No hay pedidos de compra pendientes"), filtro sin resultados ("Limpiar filtros"). Nunca pantalla en blanco sin guía.
3. **Loading (P27, B1-1:98):** skeleton del layout final que reserva espacio (cero CLS), `aria-busy="true"`, no spinner genérico; mutaciones con estado de progreso y reintento.
4. **Errores (P15, B1-1:76 + checklist 3.3.1/3.3.3, B1-2:272-274):** inline junto al campo con `aria-describedby`; resumen al enviar anclado al primero; lenguaje claro "qué pasó + qué hacer" + sugerencia corregible; toast `role="alert"` en fallo de acción; foco vuelve al origen del error.
5. **Atajos de teclado (mínimo, siempre desactivables — WCAG 2.1.4):** `Enter` = confirmar acción primaria en formularios; `Esc` = cerrar modal/dropdown/datepicker (nunca cancela gates); `Ctrl/Cmd+S` = guardar borrador (solo estados borrador); `/` = foco a búsqueda global; flechas + Home/End = navegación en datatables/combobox/datepicker. Prohibidos atajos de carácter único que disparen acciones destructivas o de gate; todo atajo con equivalente visible en mouse/touch.
6. **Mensajes de estado / toasts (4.1.3, B1-2:348-350):** `role="status"` (info/éxito) vs `role="alert"` (error/SLA); icono + texto (nunca solo color); timeout pausa en hover/focus (2.2.1); botón cerrar ≥48px; no roba foco.
7. **Focus management (INS:70, B1-2:341):** skip-link; anillo de foco 2px + 3:1; modal con focus trap, foco inicial al primer control, retorno al trigger al cerrar; `scroll-padding-top` igual a la altura del sticky.
8. **Undo (P07):** toast con acción "Deshacer" para todo bucle reversible; el undo también deja traza de auditoría (R06).
9. **Conectividad de campo (P16):** toda mutación en móvil con estados loading/retry/offline ("sin conexión — se guardó localmente"); la política offline-first real (cola de escrituras) es `DECISION_PENDIENTE` (D7).
10. **Consistencia de verbos y labels (P02, 3.2.4, B1-2:270):** glosario único — "Aprobar schema", "Recibir verificado", "Reprocesar módulo X", "Registrar veredicto", "Marcar verificado"; mismos íconos/texto en todo el sistema. B3 necesita ese glosario antes de escribir labels (GAP, ver Hallazgos).

---

## Resolución de DECISION_PENDIENTE heredadas

| # | DECISION (fuente) | Resolución de B2-1 (mejor juicio) | Justificación | ¿Reconfirma Supervisor? |
|---|---|---|---|---|
| D1 | Umbral de destructividad del ERP (B1-1:107) | Matriz de 3 niveles (R18). Type-to-confirm SOLO para el subconjunto de acciones con consecuencia irreversible y de alto impacto: firmar contrato (E-13), anular cobros/compensaciones, cierre definitivo de proyecto/contrato. El reproceso E-54 y los gates quedan en nivel (b) modal con efecto nombrado. | C2: el reproceso es recuperable por diseño (define:116); sistema = guía + registrador (define:71); E-33 causa auditable (define:79). | **SÍ** — la lista finita de acciones irreversibles es criterio de negocio. |
| D2 | Alcance de dispositivo del comercial en campo (B1-1:108) | Capa 1 = web móvil optimizada (Next.js responsive); app nativa descartada; PWA instalable como mejora progresiva post-corte. | Capa 1 es web (B1-1:30); precondiciones de capa 1 son firma virtual + pasarela (define:176), no una app nativa; costo de infra. | **SÍ** — afecta requisitos de build (offline, push). |
| D3 | Autoguardado vs. línea contractual inmutable (B1-1:109) | Autoguardado SOLO en estados borrador (cotizador pre-firma, retoma, borradores editables). Post-firma E-13 el cronograma contractual es inmutable y cualquier cambio exige evento E-33 con causa. Todo estado borrador lleva label "Borrador" visible y NO usa colores de confirmación (nada de "borrador" que parezca compromiso). | Se deriva del cronograma doble I-034 ya aprobado (B1-1:18; define:20): la línea contractual inmutable es decisión tomada. | **NO** — se sustenta en I-034; solo el wording del label queda sujeto a preferencia del negocio. |
| D4 | Dashboard del contador: acceso y lectura (B1-1:110) | Rol SOLO-LECTURA dentro del ERP (mismo login, sin portal separado) con scoping estricto a finanzas + contratos pendientes de facturar. Sin 2FA obligatorio en v1 (mitigación: sesión corta, sin exportación masiva); 2FA recomendado si el contador opera fuera de red controlada. | El contador es un "Aliado" externo que solo necesita consultar (B1-1:110; P25); portal separado es costo sin beneficio para un rol de lectura. | **SÍ** — la política de autenticación/2FA es decisión de seguridad del Supervisor. |
| D5 | Hex de paleta + fuente display (B1-2:394) | Adoptar la paleta propuesta (§Design tokens) como base y verificar contraste con herramienta antes de fijar (R38); incorporar una display serif premium para el frontstage. | Coherencia con marca "Veta de Oro" (muebles premium, madera/mármol); el dorado solo como acento (B1-2:65, :151). | **SÍ** — identidad de marca. |
| D6 | Card collapse en listas de gestión, Familia B (B1-2:396) | Permitido por defecto con los criterios de la regla de dos familias (R34): las listas de entidades con prioridad móvil (leads, cotizaciones, proyectos, garantías) colapsan a cards en base; ninguna tabla de datos densa colapsa jamás. | El INS desaconseja colapsar tablas de gestión salvo prioridad móvil crítica (B1-2:120-123); el embudo comercial es precisamente progresión móvil. | **SÍ** — el negocio puede prohibir cards en absoluto. |
| D7 | Política de conectividad offline real en campo (B1-2:396) | v1 = estados online robustos con loading/retry/offline-visible en toda mutación (R27); cola de escrituras local (offline-first) como mejora post-corte; el autoguardado de borrador (R26) cubre el riesgo principal de pérdida. | B1-2:132 no resuelve la política (la declara del negocio); el autoguardado (P14) es la mitigación de menor costo para el riesgo real (pérdida por interrupción). | **SÍ** — afecta alcance de build del flujo de campo. |
| D8 | WCAG 2.2 AA como requisito en el ERP interno (B1-2:397) | Aplicar AA en TODO el sistema (ERP + tienda + portal). El frontstage (tienda + portal) es obligatorio de todos modos (mapa:546 "momento de verdad"); el ERP interno cumple AA porque el costo marginal es bajo si los tokens y componentes base lo llevan desde B3. | Recomendación técnica fuerte de B1-2:397; el checklist de 56 criterios (B1-2:210) ya está listo para auditar por pantalla (B4-4). | **NO** — es barra de calidad, no contrato/negocio; se documenta como decisión de arquitectura de UI. |

**Resumen:** 8 resueltas con mejor juicio; **6 escalan a `DECISION_PENDIENTE`** para confirmación del Supervisor (D1, D2, D4, D5, D6, D7); **2 quedan resueltas** sin confirmación requerida (D3 por I-034, D8 por ser barra de calidad).

---

## Qué NO usar (descartado con razón)

| Ítem | Fuente | Razón |
|---|---|---|
| Eye-tracking, telemetría de cursor, clasificación de perfiles cognitivos por ML | B1-1:29 | Investigación, no decisión de diseño; no resuelven un problema real del proyecto. |
| App nativa móvil como decisión de infraestructura | B1-1:30 | Capa 1 es web (Next.js); PWA instalable es mejora post-corte (D2). |
| "Recordatorio" como mecanismo de cumplimiento | B1-1:33, :47 | El sistema previene el olvido (automatiza/default), nunca lo recuerda (R04). |
| Tipografía solo en `vw` y contenedores de ancho fijo en px | B1-2:18, :60 | Rompen zoom de accesibilidad; se usa `clamp()` rem+vw (R37). |
| Hamburguesa en desktop | B1-2:18, :119 | Reduce descubribilidad ~50% (R33). |
| Ocultar contenido relevante con `display:none` en móvil | B1-2:18, :130 | No evita descarga y pierde contenido (R37). |
| Colapsar tablas de datos densas a tarjetas | B1-2:120-123 | Prohibido para Familia A; solo listas de entidades (Familia B) colapsan (R34). |
| Tratar 2.4.13 Focus Appearance como requisito AA | B1-2:61, :286 | Es AAA; se adopta como meta de calidad, no como criterio AA (R39). |
| EN 301 549 como mandato legal en Colombia | B1-2:66 | Norma europea (UE WAD); en Colombia el marco es NTC 5854/Ley 1712 (a verificar vigencia); se usa solo como referencia. |
| `deep research agent.txt`, `formateo pc...`, `server less frontera...`, `Windows deboulating...`, `Curso bootcam IA.txt` | B1-3:56-61 | Fuera de dominio del ERP+muebles, duplicado o stack ya decidido. |
| `INS_Accesibilidad...WCAG.md` (0 KB) | B1-3:61, B1-3:169 | Vacía/inleíble; la accesibilidad se cubre con el checklist W3C y tokens (B1-2:210). |
| NRP/CQL/embeddings/grafo neuronal y automatizar esquemas desde diagramas | B1-3:90-94, B1-3:171 | Teoría sin aplicación en Drizzle/Neon y roza el patrón schema-driven **prohibido**; solo se conserva el método de diseño axiomático (matriz desacoplada). |
| Motor "Zap"/zaps interpretados en runtime (Agnostic Seed) | B1-3:170; AGENTS.md | Patrón schema-driven **prohibido**; se conserva solo el conocimiento de negocio (reglas de cálculo, verificación humana), nunca el mecanismo. |
| Party Pattern (una sola entidad persona universal) | B1-3:88 | Rechazado por el motor viejo; el Define usa roles tipados + personas (define:57-61). |
| Paleta telúrica+dopamínica de `INVS_diseño global` como tokens del ERP | B1-3:52, B1-3:132 | Es dirección de marca de consumo (REFERENCIA, tienda); no aplica al ERP; el ERP usa la paleta Veta de Oro propia. |
| Render IA de producto (blueprint `renderz`) | B1-3:54, B1-3:135 | Feature futura opcional de la tienda; no bloquea el corte (DIFERIDO). |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| H01 | `DECISION_PENDIENTE` | Confirmar lista finita de acciones irreversibles de alto impacto para type-to-confirm (D1). | B1-1:107; este pase §Resolución |
| H02 | `DECISION_PENDIENTE` | Confirmar alcance de dispositivo del comercial en campo: web móvil optimizada + PWA como mejora (D2). | B1-1:108; B1-2:396 |
| H03 | `DECISION_PENDIENTE` | Confirmar política de autenticación/2FA del rol contador externo (D4). | B1-1:110 |
| H04 | `DECISION_PENDIENTE` | Confirmar hex exactos de la paleta y fuente display (marca) (D5). | B1-2:394; B1-2:201 |
| H05 | `DECISION_PENDIENTE` | Confirmar si el card collapse (Familia B) está permitido en listas de gestión o se prohíbe en todo el ERP (D6). | B1-2:396; B1-2:123 |
| H06 | `DECISION_PENDIENTE` | Confirmar política de conectividad offline real para flujos de campo (D7). | B1-2:132; B1-2:396 |
| H07 | GAP | No existe glosario único de estados y verbos de negocio; B3 lo necesita antes de escribir labels (R02). | B1-1:58 (P02); B1-2:270 |
| H08 | GAP | El checklist WCAG 2.2 de 56 criterios (B1-2:210-286) debe traducirse a verificación por pantalla en la sección 7 del contrato; B4-4 auditará. | B1-2:210; met:120 |
| H09 | GAP | La INV de accesibilidad está vacía (0 KB); el hueco se cubre con tokens + checklist W3C. Si el Supervisor regenera la INV, revisar contra este pase. | B1-3:61, B1-3:169 |
| H10 | GAP | Código actual usa literales inline (`#e5e5e5`) en vez de tokens; B3 debe consumir los tokens y migrar. | B1-2:206; B1-2:64 |
| H11 | GAP | Adoptar `prefers-reduced-motion` como práctica en todo el sistema. | B1-2:204 |
| H12 | DIFERIDO | SEO/JSON-LD de la tienda (Organization, LocalBusiness/GeoCircle, Product, Core Web Vitals) queda como insumo de B3-5 si la tienda pública entra en detalle; UCP/Universal Cart y WebMCP quedan en t-034. | B1-3:48, B1-3:121-128 |
| H13 | DIFERIDO | Render IA de producto (cola + workers GPU + CDN, ControlNet, Real-ESRGAN) — feature futura de la tienda, no bloquea el corte. | B1-3:54, B1-3:135 |
| H14 | GAP | La resolución D3 (autoguardado solo borradores) depende del labeling "Borrador vs. compromiso"; el sistema no debe presentar un borrador que parezca compromiso. | B1-1:109; este pase §Resolución |

---

## Notas para el Orquestador

1. **Este pase cierra el goal B2 de la lente destilación** (`met:148-149`). Entrega a B3: 40 reglas (grupos F0/E/G/D/C/R/A/X), design tokens, convenciones de interacción y resolución de 8 `DECISION_PENDIENTE`.
2. **Consumo por B3:** las reglas mapean directo al contrato de pantalla (`met:110-123`): sección 7 usa el Grupo R + Grupo A (R30-R39); sección 6 usa R16/R18/R19; sección 3/4 usa R02/R09-R13/R25/R26; sección 5 usa R05/R06/R40; sección 8 usa convenciones de interacción + tokens Tailwind v4.
3. **Dependencias para B3:** (a) glosario único de estados/verbos (H07) debe crearse antes de los labels; (b) los 6 `DECISION_PENDIENTE` escalados (H01-H06) no bloquean el diseño de B3 (se aplica la resolución propuesta) pero deben confirmarse antes del corte; (c) B4-4 auditará el cumplimiento del Grupo R/A en las pantallas.
4. **Para B2-2 (pantallas requeridas):** las reglas por rol (R09-R29) y la tabla de superficies por rol de B1-2 (B1-2:102-110) son el insumo directo del inventario roles×gates; este pase no duplica esa lista.
5. **Advertencia de prohibición:** ninguna regla de este pase arrastra el patrón Zap/schema-driven (R05/R06 conservan solo el conocimiento de negocio, nunca el mecanismo — B1-3:170).
6. **Coherencia:** ninguna regla contradice el Define aprobado; las únicas decisiones no escritas del negocio quedaron escaladas como `DECISION_PENDIENTE` con justificación y resolución propuesta aplicable.

## Registro

- Fecha: 2026-08-04.
- Pase: B2-1 (ola 2, Fase B — destilación), lente destilación de investigaciones en reglas aplicables.
- Archivo de salida único: `arnes/diagnostico/pasadas/d3_ui_b2_1_destilacion_inv.md` (este archivo).
- **40 reglas destiladas** · 8 `DECISION_PENDIENTE` resueltas (6 escalan al Supervisor) · tokens · convenciones · descartes con razón.
- No se modificó ningún otro archivo; no se leyó ningún output de otros sub-agentes.
