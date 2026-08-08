# Pase D4-A2 — concepto por superficies (subagente, loop de 3 iteraciones)

**Rol:** Diseñador de concepto del Diamante 4 (t-092, D4-A2 "concepto por superficies").
**Lente:** definir el concepto de diseño de las 3 superficies de la V3 (ERP / sitio público / portal cliente) y cómo se traduce en dirección de estilo para cada una de las 34 pantallas core — el pase que da coherencia de conjunto antes de definir tokens (D4-A3).
**Fuentes leídas:** `d3_ui_consolidado.md` (34 pantallas, familias B3-1..B3-5), `d3_ui_b2_1_destilacion_inv.md` (reglas R01-R40, tokens propuestos), `d3_ui_b1_2_responsive_design.md` (3 breakpoints, paleta propuesta), `d3_ui_b1_1_ux_ergonomia.md` (28 principios P01-P28), `d3_ui_b2_2_pantallas_requeridas.md` (matriz roles×pantallas, frontera admin/frontstage), `destilacion_docs_veta.md` (identidad — FALLBACK), `marco_estrategia_mercado.md` (H1-H8, §5).
**Supuesto de serialización (registrado):** el output del pase **D4-A1 (`d4_a1_auditoria_visual.md`) NO EXISTE todavía** (A1 corre en paralelo con A2, Ola 1 del grafo — `diamante4_metodologia.md:108`). Conforme al contrato de A2, la identidad se toma directamente de `destilacion_docs_veta.md` (fuente primaria de marca) y de la paleta/tipografía propuestas de `d3_ui_b2_1_destilacion_inv.md` §Design tokens. **Si el A1 fija hex o fuente display distintos, el A3 (tokens) reconcilia; este pase NO fija hex** — los usa como dirección, no como valor final.
**Regla de marca permanente aplicada:** cuando el material previo contradiga a la evidencia de primera mano del Supervisor, gana el Supervisor (`diamante4_metodologia.md:33`). La identidad "Luz & Biofilia" (reemplaza el dark-lujo `#0A0A0A`) y "marca Veta Dorada" son decisiones ratificadas del Supervisor — se cumplen como restricción dura.

---

## Iteración 1 (bruta)

Captura cruda, sin filtrar, de todo lo que el corpus dice sobre "cómo se ve":

**Identidad (fallback, `destilacion_docs_veta.md`):**
- Arquetipo **El Creador Experto** (honesto, meticuloso, con autoridad) — `destilacion_docs_veta.md:267`.
- Tono: **directo, elegante, sin jerga pretenciosa; confianza técnica + transparencia financiera** — `destilacion_docs_veta.md:268`.
- Anti-posicionamiento: *"no somos un Estudio de Arquitectura esnob que cobra comisiones ocultas… no fabricamos muebles baratos o desechables… proceso **Híbrido Artesanal**"* — `destilacion_docs_veta.md:269`.
- Eslogan: *"Diseña tu espacio. Habita el bienestar."* — `destilacion_docs_veta.md:270`.
- **Tema visual ya decidido:** migrar de dark-lujo (`#0A0A0A`) a **"Luz & Biofilia"** — biofilia con **luz solar y fotografía natural, NUNCA verde literal en los tokens; el acento dorado permanece** — `destilacion_docs_veta.md:595`.
- Tokens Luz & Biofilia portables: `--veta-bg-warm-paper` `#FCFBF9`, `--veta-bg-linen` `#F3EFE9`, `--veta-text-carbon` `#2B2B2B`, `--veta-text-stone` `#7A7873`, `--veta-glass-light-bg` `rgba(255,255,255,0.55)`, `--veta-glass-light-border` `rgba(43,43,43,0.08)` — `destilacion_docs_veta.md:601-608`.
- Home especificado: hero *"Carpintería arquitectónica de alta precisión."* + Respuesta Atómica de 46 palabras **visible bajo el H1**; Portafolio Aspiracional 16:9 con hover `scale-103` en 0.8s; **Testimonios reales solo si existen**; CTA final — `destilacion_docs_veta.md:627-631`.
- Diferenciador no explotado: **taller propio / fábrica directa** (términos `fabrica cocinas integrales bogota` generan impresiones y cero clics) — `destilacion_docs_veta.md:158,176`.
- Prueba social diseñada: **reseñas curadas con contexto barrial** (`VetaTestimonials`, ej. *"instalación de cocina en el barrio Rosales"*), no widget de Google Maps — `destilacion_docs_veta.md:280`.
- Marca cambia a **"Veta Dorada"**; hoy conviven 4 nombres en las superficies (inconsistencia) — `destilacion_docs_veta.md:367-378,384,389`.
- Las 6 landings SEO sirven **imágenes rotas** (404); las fotos existieron según la guía de nombres de la carpeta → probable recuperación del sitio actual — `destilacion_docs_veta.md:391-398,552`.
- Antigüedad "desde 1995" vs "6 años" **sin resolver**; afecta señales de confianza visuales — `destilacion_docs_veta.md:668-674`.
- "Noticiario de diseño" (contenido orgánico) no existe — `destilacion_docs_veta.md:315-317`.

**Comportamiento comercial (H1-H8, `marco_estrategia_mercado.md`):**
- La conversión real es **clic a WhatsApp** (`wa.link/rmgga6`), todos los CTA del legacy convergen ahí; el sitio nuevo tiene 5 enlaces a `/agendar` y cero a WhatsApp (H8) — `marco_estrategia_mercado.md:54,198-199`.
- El sitio legacy convierte el 14% del tráfico pagado (no el "colador del 99%") — `marco_estrategia_mercado.md:235-239`.
- Propuesta de valor legacy: *"Diseño de autor a precio de fabricante"* — `marco_estrategia_mercado.md:246`.
- §5: el informe del sector entra al registro de hipótesis con falsador declarado (no al de hallazgos) — `marco_estrategia_mercado.md:127-131`.

**Reglas y tokens (D3, `d3_ui_b2_1_destilacion_inv.md`):**
- 40 reglas R01-R40 en 8 grupos; P1 desbloquea el 80% — `d3_ui_b2_1_destilacion_inv.md:147`.
- R01 "la UI es el arnés del operador", R02 vocabulario del taller/cliente (nunca schema), R03 dos lenguajes visuales (backstage honesto / frontstage selectivo), R04 el sistema previene el olvido — `:71-74`.
- R10 jerarquía visual: una sola acción primaria dominante (color de marca **dorado**); orden = guard pendiente → acción primaria → contexto — `:85`.
- R14 estado con icono+texto+color, nunca solo color — `:89`.
- R16 gates con guard visible ("Falta veredicto de schema") — `:91`.
- R17 SLA como temporizadores (E-50 5 min; E-34 5-24 h) — `:92`.
- R20 decisión-first: panel "Requiere tu decisión" al tope; layout decisión → KPIs → detalle — `:105`.
- R21 máximo 5-7 KPIs por vista — `:106`.
- R30 mobile-first, R31 3 breakpoints obligatorios (base <768 / md 768-1023 / ≥lg 1024+), R33 nav por densidad de contexto (sidebar/rail/drawer, nunca hamburguesa desktop), R34 dos familias de tablas, R35 objetivos ≥48px+8px, R37 tipografía fluida `clamp()` cero CLS, R38 contraste verificado (dorado nunca texto pequeño sobre claro), R40 timezone explícita — `:125-145`.
- Paleta propuesta (13 tokens) con hex y contraste objetivo — `:157-171`.
- Espaciado base 4px ERP + fluido público; radios none/sm/md/lg/full; tipografía `xs..2xl` + `--text-display` (hero, **solo frontstage**); familia display serif premium `DECISION_PENDIENTE` — `:180-216`.
- Código actual usa literales `#e5e5e5` en vez de tokens — `:219`.
- Glosario único de estados/verbos pendiente (GAP H07) — `:289`.
- Resolución D3: autoguardado SOLO borradores, label "Borrador" visible sin colores de compromiso — `:245`.

**Responsive (B1-2):**
- Paleta Veta de Oro PROPUESTA (hex `DECISION_PENDIENTE` del Supervisor), dorado como acento sobre espresso o UI/large-text, nunca texto pequeño sobre claro — `d3_ui_b1_2_responsive_design.md:65,140-156`.
- Breakpoints semánticos: móvil <768 / tablera 768-1023 / desktop 1024-1439 / wide ≥1440; contrato de 3 comportamientos por pantalla — `:89-96`.
- Dos familias de tablas (Familia A datos densos / Familia B entidades con prioridad móvil) — `:120-123`.
- KPI: número 28-32px grueso + dato secundario 14px + un sparkline — `:28`; tokens tipográficos — `:191-201`.
- Estándar de 8 componentes base (botón, input, select, datatable, modal, toast, dropdown, datepicker) — **no incluye kanban, stepper de gates ni timeline de cronograma doble** — `:290-361`.
- Display serif premium propuesta para marca, `DECISION_PENDIENTE` — `:201`.

**UX/ergonomía (B1-1):**
- P09 jerarquía visual (dashboards preattentive), P10 progressive disclosure, P11 dos lenguajes visuales por audiencia (backstage honesto / frontstage selectivo), P20 decisión-first, P22 gráficos sin dependencia del color, P26 empty states que enseñan la primera acción, P27 skeletons sin layout shift, P28 confirmación destructiva escalada — `d3_ui_b1_1_ux_ergonomia.md:65-99`.

**Pantallas (consolidado):**
- 34 core = P-01..P-26 (26 admin `/app/erp/*`) + F-01..F-08 (8 frontstage) — `d3_ui_consolidado.md:24-86`.
- Familias: B3-1 embudo/cotizador (9: P-01..P-05, F-01/F-02/F-03/F-08), B3-2 cronograma+gates (7: P-06..P-12), B3-3 compras+taller+calidad+entrega (7: P-13..P-19), B3-4 finanzas (4: P-20..P-23), B3-5 cliente/documentación (7: P-24..P-26, F-04/F-05/F-06/F-07) — `:26-86`.
- DIFERIDO: F-04/F-05/F-06 (tienda), P-32 KPIs, P-33 testimonios — `:86`.
- Frontera: el cliente NO entra al admin, solo E-60 frontstage — `d3_ui_b2_2_pantallas_requeridas.md:32`.

---

## Iteración 2 (autocrítica)

Qué sobrevive, qué cae, qué falta:

1. **Cae la tentación de "un sistema por superficie" (3 sistemas).** La misión advierte el riesgo explícito. El corpus lo refuta por dos lados: (a) las reglas R01-R40 y la paleta Veta de Oro son **una sola** para todo el sistema (`d3_ui_b2_1_destilacion_inv.md:157-171`); (b) los tokens Luz & Biofilia del frontstage (`destilacion_docs_veta.md:601-608`) y la paleta ERP (`d3_ui_b2_1:157-171`) comparten la misma base cálida (`#F7F4F0` ≈ `#FCFBF9`, `#F3EFE9`). **La separación es por densidad, tipografía display y rol del dato, no por paleta.** Un solo sistema de tokens con 3 "modos de superficie".
2. **Cae el "ERP neutro, sin marca".** El arquetipo Creador Experto, el tono directo-elegante y el dorado como acción primaria (`d3_ui_b2_1:85`) son marca dentro del ERP también. La diferencia no es "marca vs sin marca", es **el dato compitiendo con la decoración**: el ERP gasta su marca en jerarquía y estados, el público la gasta en emoción y fotografía.
3. **Cae el frontstage "aspiracional premium del norte".** La demanda revelada (Fontibón, Suba, Cedritos) y el posicionamiento ratificado (*"estudio de carpintería arquitectónica", no estudio esnob*, `destilacion_docs_veta.md:633`) prohíben el lujo aspiracional frío. El público es **artesanal, luminoso, honesto** (Luz & Biofilia), no dark-lujo. El dark-lujo `#0A0A0A` está descartado por decisión (`:595`).
4. **Cae usar testimonios como relleno.** La regla del plan de julio (*"si `testimonios` está vacío, la sección no se renderiza"*, `destilacion_docs_veta.md:571`) y el protocolo de reseñas curadas (`:280`) mandan: **la prueba social es real o no existe**. En el concepto, F-01/F-07 diseñan el espacio para testimonios reales; el contenido vacío no se simula.
5. **Se escapó en la bruta — el acta de entrega como "momento de verdad".** La entrega es *"como un segundo contrato"* (mapa:546, citado en `d3_ui_b1_2_responsive_design.md:42`). F-07 y P-19 necesitan un tratamiento de celebración-contenida (cambio positivo visible, tono de cierre), no solo un formulario más.
6. **Se escapó — el cronograma doble es la pieza visual más compleja del ERP y no tiene primitiva en el estándar.** La visualización de dos líneas (contractual inmutable + interna movible) con desfases coloreados por causa (`d3_ui_b2_1:73,145`) no existe entre los 8 componentes base (`d3_ui_b1_2_responsive_design.md:290-361`). Es GAP_VISUAL para A4.
7. **Se escapó — el embudo comercial (kanban) tampoco está en el estándar de componentes.** P-01 es kanban de tarjetas con SLA (Familia B), y el estándar de B1-2 no lo cubre. Otro GAP_VISUAL.
8. **Se escapó — el "borrador vs compromiso".** La resolución D3 (`d3_ui_b2_1:245`) impone que un borrador NUNCA parezca compromiso: el concepto debe fijar una **semántica de estado de documento** (borrador / borrador-visible / firmado) que no use colores de confirmación. Es regla de estilo, no solo de labels.
9. **Lo incierto NO se inventa.** Hex exactos, fuente display, eslogan, antigüedad, estrategia de imágenes, precio del diseño 3D, nombre de marca final: todo va a `DECISION_DISEÑO` (vocabulario del D4, `diamante4_metodologia.md:87`). Este pase entrega **dirección** con la propuesta del corpus como base contrastable, nunca un veredicto de marca nuevo.

---

## Iteración 3 (refinamiento final)

Estructura final del entregable (las 6 secciones exigidas). Decisiones de cierre de este pase:

- **3 superficies, 1 sistema:** tokens base y primitivas compartidos; variación por **modo de superficie** (densidad, rol del dato, tipografía display, imagery). La superficie NO es un tema de color distinto.
- **Nombres de concepto por superficie:**
  - **ERP = "El taller en el panel"** (denso, operativo, alto rendimiento, de facturación): el dato es la decoración; marca = jerarquía + estado + precisión.
  - **Sitio público = "Luz & Biofilia / El Creador Experto"** (emocional, de venta, premium artesanal): storytelling, fotografía grande, madera real, luz natural; un solo CTA (WhatsApp/agendar).
  - **Portal cliente = "Tu proyecto, en calma"** (claro, de confianza, seguimiento de su proyecto): tranquilidad, progreso visible, cambio positivo; el cliente nunca ve el backstage.
- **Jerarquía visual por superficie** (§4): ERP = dato > decoración; público = emoción > dato; portal = tranquilidad > dato.
- **34/34 pantallas mapeadas** (§3), con DIFERIDO registrado no diseñado (F-04/F-05/F-06).
- **Hallazgos clasificados** (§5) en el vocabulario del diamante 4.

---

## Entregable

### 1. Concepto por superficie (tablas)

#### 1.1 ERP — "El taller en el panel" (26 pantallas admin, `/app/erp/*`)

**One-liner:** *denso, operativo, alto rendimiento, de facturación — el dato es la decoración.*

| Atributo | Dirección de estilo | Fuente |
|---|---|---|
| Rol del sistema | Arnés del operador: sostiene, recuerda, registra; la persona decide | `d3_ui_b2_1_destilacion_inv.md:71` (R01) |
| Layout dominante | Tabla/kanban; una tarea por pantalla; header persistente de contexto (proyecto+módulo+rol+gate) | `d3_ui_b1_1_ux_ergonomia.md:57` (P01); `d3_ui_b2_1:84` (R09) |
| Densidad | Alta. Escala de espaciado base 4px estática rem; filas densas 36-40px, cómodas 48-52px | `d3_ui_b2_1:180,182-193`; `d3_ui_b1_2_responsive_design.md:330` |
| Tablas | Familia A (dinero, compras, cronograma, fila taller): `overflow-x:auto` + 1ª columna sticky + cabecera sticky, prohibido colapsar a cards. Familia B (leads, cotizaciones, proyectos, garantías): card collapse en base | `d3_ui_b1_2_responsive_design.md:120-123`; `d3_ui_b2_1:129` (R34) |
| Kanban | P-01 (embudo) y P-16 (fila del taller) usan tarjetas con estado icono+texto+color y SLA | `d3_ui_consolidado.md:30,59`; `d3_ui_b2_1:89` (R14) |
| Jerarquía | Decisión-first: guard pendiente → acción primaria → contexto; una acción primaria dominante (dorado) | `d3_ui_b2_1:85` (R10), `:105` (R20) |
| Estado | Badge icono+texto+color, nunca solo color; gates con guard visible ("Falta veredicto de schema"); SLA como temporizador | `d3_ui_b2_1:89` (R14), `:91` (R16), `:92` (R17) |
| Color | Paleta Veta de Oro base: surface cálida `#F7F4F0`, espresso/nav `#3E2A21`, dorado SOLO como acento de acción primaria (nunca texto pequeño sobre claro) | `d3_ui_b2_1:157-171`, `:85`; `d3_ui_b1_2:65,151` |
| Tipografía | Sans de sistema; escala rem estática `xs..2xl`; KPI 28-32px gruesos; **sin display serif** | `d3_ui_b2_1:207-216`; `d3_ui_b1_2:191-201` |
| Bordes/radios | Radio 0 en tablas/cabeceras; 4px inputs/botones; 8px tarjetas/modales; 9999px badges | `d3_ui_b2_1:196-204` |
| Navegación | Sidebar completa desktop (≥220px) → rail 64px tablera → drawer móvil; nunca hamburguesa desktop; skip-link | `d3_ui_b1_2:119` (R33); `d3_ui_b1_3_inv_clasificacion.md:111` |
| Imagery | Mínima: fotos de retoma/etapas E-41 con `aspect-ratio` reservado y caption (material+ubicación); cero fotografía decorativa | `d3_ui_b2_1:132` (R37); `destilacion_docs_veta.md:620` |
| A11y | WCAG 2.2 AA en todo el ERP (decisión D8: barra de calidad) | `d3_ui_b2_1:250` (D8) |
| Móvil campo | CTA primario en tercio inferior (zona del pulgar); inputs ≥16px; loading/retry/offline visibles; autoguardado borrador | `d3_ui_b1_2:124-125`; `d3_ui_b2_1:130-131` (R35-R36) |

#### 1.2 Sitio público — "Luz & Biofilia / El Creador Experto" (F-01 landing, F-02 propuesta, F-03 agendar, F-08 pago 3D, landings SEO)

**One-liner:** *emocional, de venta, premium artesanal — storytelling, fotografía grande, madera real.*

| Atributo | Dirección de estilo | Fuente |
|---|---|---|
| Rol del sistema | Vender y cualificar: contar el oficio (estudio de carpintería arquitectónica), generar confianza técnica y transparencia, captar lead en un toque | `destilacion_docs_veta.md:633`; `marco_estrategia_mercado.md:268` |
| Tema | **Luz & Biofilia**: luz solar, fotografía natural, papel/lino cálidos, glass-light; **sin verde literal en tokens**; acento dorado permanece | `destilacion_docs_veta.md:595,601-608` |
| Imagery | Fotografía grande de proyectos reales (16:9, `scale-103` 0.8s en hover), madera/vetas, `aspect-ratio` reservado, WebP/AVIF, `fetchpriority="high"` en LCP | `destilacion_docs_veta.md:629`; `d3_ui_b1_2:16-17` |
| Hero | H1 + Respuesta Atómica visible bajo el H1 (copy aprobado); CTA de WhatsApp/agendar dominante | `destilacion_docs_veta.md:627`; `marco_estrategia_mercado.md:54` (H8) |
| Tipografía | Escala fluida `clamp()` (híbrido rem+vw); **display serif premium** para H1/hero (DECISION_DISEÑO: cuál) | `d3_ui_b2_1:215-216`; `d3_ui_b1_2:127,201` |
| Color | Base `#FCFBF9`/`#F3EFE9` + espresso `#3E2A21` títulos + dorado como acento sobre espresso o UI (nunca texto pequeño sobre claro) | `destilacion_docs_veta.md:601-608`; `d3_ui_b1_2:65,151` |
| CTA | **Uno dominante por vista** → WhatsApp (canal real de conversión) + `/agendar`; los CTAs no compiten | `marco_estrategia_mercado.md:54,199`; `destilacion_docs_veta.md:198` |
| Prueba social | Reseñas curadas reales con contexto barrial; **nunca relleno ni rating inventado**; si no hay testimonios, la sección no se renderiza | `destilacion_docs_veta.md:280,571` |
| Diferenciador | Taller propio / fábrica directa ("Diseño de autor a precio de fabricante") visible en landings y proceso | `destilacion_docs_veta.md:158,176`; `marco_estrategia_mercado.md:246` |
| Confianza | NAP completo y consistente, señales (garantía estructural, acompañamiento post-venta), proceso híbrido artesanal explicado | `destilacion_docs_veta.md:271,276-278` |
| SEO/JSON-LD | `Organization` + `LocalBusiness` + `Product`, `areaServed` Bogotá, sitemap/robots, CWV LCP<2,5s | `d3_ui_b1_3_inv_clasificacion.md:48,121-128` |
| Responsive | Mobile-first (52-67% del tráfico); 3 breakpoints; reflow 320px/400%; grids fluidos | `d3_ui_b1_2:118,96-98` |

#### 1.3 Portal cliente — "Tu proyecto, en calma" (F-07, `/cuenta/proyectos`)

**One-liner:** *claro, de confianza, seguimiento de su proyecto — tranquilidad y progreso visible.*

| Atributo | Dirección de estilo | Fuente |
|---|---|---|
| Rol del sistema | El cliente controla su proyecto SIN ruido: ver solo la línea contractual y el cambio positivo; nunca el backstage | `d3_ui_b1_1_ux_ergonomia.md:67` (P11); `d3_ui_b2_2_pantallas_requeridas.md:32` |
| Lenguaje | Frontstage selectivo: "adelantamos tu entrega" (E-60); los desfases internos jamás llegan | `d3_ui_b2_1:73` (R03); `d3_ui_b1_1:67` |
| Estado | Progreso visible por etapa (E-18/E-21/E-24/E-33/E-20 traducido a lenguaje cliente: schema→armado→calidad→instalación→entrega), badges icono+texto | `d3_ui_b2_1:89` (R14); `d3_ui_consolidado.md:83` |
| Momento de verdad | Acta de entrega digital como "segundo contrato": celebración contenida, claro, con firma | `d3_ui_b1_2:42,109` |
| Transacciones | Pagos online (E-56/E-28), deducción del diseño 3D visible, garantía (solicitud + estado 8-12 días) | `d3_ui_b1_1:17`; `d3_ui_consolidado.md:83` |
| Confianza | NAP/contacto, señales de marca (marca comercial arriba / sociedad legal abajo), historial de comunicaciones E-60 | `destilacion_docs_veta.md:637-641` |
| Aislamiento | Scoping estricto por `clienteId`; sin navegación al admin | `d3_ui_b2_1:118` (R26); `d3_ui_b2_2:32` |
| Color/tipografía | Misma base Luz & Biofilia cálida; menos densidad que el ERP, sin display serif agresiva (la serif queda para hero público); números de saldos/pagos prominentes | `destilacion_docs_veta.md:601-608`; `d3_ui_b2_1:180` |
| Responsive | Smartphone dominante (cliente) — CTA primario en tercio inferior, modales full-screen | `d3_ui_b1_2:109,91` |

### 2. Coherencia entre superficies (lo común vs. lo que varía)

**Lo común (un solo sistema — sin esto se rompe en 3 sistemas):**

| Capa | Qué es común | Fuente |
|---|---|---|
| Tokens de color base | Paleta Veta de Oro cálida compartida (surface/espresso/ink/border); la variación es por **uso**, no por paleta distinta | `d3_ui_b2_1:157-171`; `destilacion_docs_veta.md:601-608` |
| Primitivas base | botón, input, select, datatable, modal, toast, dropdown, datepicker — mismos estados por componente (default/hover/focus/disabled/error/loading) | `d3_ui_b1_2:290-361` |
| Espaciado/radio | Escala base 4px y radios `sm/md/lg/full` definidos una vez; el ERP los usa en densidad estática, el público en fluida | `d3_ui_b2_1:180-204` |
| Accesibilidad | WCAG 2.2 AA en las 3 superficies (decisión D8) | `d3_ui_b2_1:250` |
| Responsive | 3 breakpoints obligatorios por pantalla; mobile-first; reflow 320px | `d3_ui_b1_2:96-98` |
| Reglas de comportamiento | R01-R04, R14 (estado icono+texto), R35 (targets 48px), R37 (cero CLS) aplican a TODO | `d3_ui_b2_1:71-74,89,130,132` |
| Vocabulario | Términos del taller y del cliente; el schema nunca se filtra (glosario único pendiente, GAP H07) | `d3_ui_b2_1:72` (R02), `:289` |

**Lo que varía por superficie (mecanismo = modo de superficie, no sistema aparte):**

| Atributo | ERP | Sitio público | Portal cliente |
|---|---|---|---|
| Densidad / escala tipográfica | Estática rem, densa, `xs..2xl` | Fluida `clamp()`, display serif en hero | Intermedia; serif no agresiva |
| Color de acento | Dorado = única acción primaria por pantalla | Dorado sobre espresso (títulos/CTA) + glass-light | Dorado sobrio en CTA/avances |
| Imagery | Fotos de trabajo (E-41) con caption; sin decoración | Fotografía grande de proyectos/madera | Fotos del proyecto del cliente (progreso) |
| Rol del dato | Dato > decoración (el dato ES la jerarquía) | Emoción > dato (storytelling) | Tranquilidad > dato (progreso claro) |
| CTA | Múltiples según tarea, uno dominante | Uno dominante (WhatsApp/agendar) | Uno por decisión (pagar, firmar, solicitar) |
| Motion | Mínimo, funcional (estados/loading) | Hover 0.8s en portafolio, transiciones suaves | Sutil, orientado a feedback de avance |

**Regla de enlace entre superficies:** ninguna primitiva cambia su token de color por superficie; lo que cambia es **la densidad con que se usa, la tipografía display y la proporción de imagery**. Un botón primario es el mismo componente en las 3 superficies, con el mismo token `espresso`/dorado. (Fuente del token compartido: `d3_ui_b2_1:157-171`; `d3_ui_b1_2:294-304`.)

### 3. Mapa pantalla → concepto (34/34)

**Superficie: `ERP`** · Concepto: "El taller en el panel" (denso, operativo, dato-first).

| ID | Pantalla | Ruta | Familia | Dirección de estilo (notas) |
|---|---|---|---|---|
| P-01 | Embudo comercial (kanban) | `/app/erp/comercial` | B3-1 | Kanban Familia B de tarjetas; tarjeta de lead con SLA timer (E-50), badge estado icono+texto; bulk reasignar (R29); CTA de avance por tarjeta; drawer móvil | 
| P-02 | Ficha de lead/cliente | `/app/erp/comercial/[clienteId]` | B3-1 | Historial + calificación + SLA; pre-carga de datos (R11); progressive disclosure (causa/comisión expandible, R08); estado E-50; acciones contextuales en menú accesible por teclado |
| P-03 | Agenda/calendario | `/app/erp/calendario` | B3-1 | Calendario con timezone explícita (R40); franjas libres por comercial; mini-calendario de puntos en móvil / agenda scroll; bottom-sheet en móvil; hit target ≥44px |
| P-04 | Cotizador (+3D + estimación) | `/app/erp/cotizador` | B3-1 | Artefacto evolutivo (mismo proyecto en todo el embudo, R25); autoguardado con label "Borrador" visible (D3, nunca parece compromiso); sección diseño 3D; matemática en servidor (R05); una acción primaria "Enviar cotización" |
| P-05 | Contratos + firma + cambios + viajes | `/app/erp/contratos` | B3-1 | Línea contractual; wizard de firma E-13 (modal/wizard, no módulo); cuestionario de viajes; confirmación destructiva nivel (c) type-to-confirm para firma (R18/D1); cambio de contrato → dispara E-33 en P-09 |
| P-06 | Proyectos + mapa de gates (sumidero) | `/app/erp/proyectos` | B3-2 | Timeline/stepper de los 5 gates con estados icono+texto (R14); badges E-59/E-34; deep link a cada pantalla de gate; Familia B en móvil; es el ancla de determinismo de gates |
| P-07 | Retoma de medidas | `/app/erp/proyectos/[id]/retoma` | B3-2 | Flujo de campo móvil; foto/nota pegada al módulo (R28); autoguardado (R26); input minimizado; orientación vertical/horizontal (1.3.4); skeleton reservando espacio para fotos (R37) |
| P-08 | Desarrollo/schema (BOM + E-18 + integraciones) | `/app/erp/proyectos/[id]/desarrollo` | B3-2 | BOM denso (Familia A); veredicto E-18 con guard visible; integraciones E-38/E-39 como acciones con estado (precedencia schema aprobado); versionado del schema |
| P-09 | Cronograma doble | `/app/erp/cronograma` | B3-2 | **Pieza visual más compleja**: dos líneas (contractual inmutable + interna movible); desfases coloreados por causa con icono+texto (R03/R14); E-33 con composición causal + decisión manual justificada; recálculo tras guardar (R19); timezone (R40); Familia A densa; **GAP: primitiva timeline de cronograma doble no existe en el estándar** |
| P-10 | Novedades críticas (SLA 5-24h) | `/app/erp/cronograma/novedades` | B3-2 | SLA como temporizador visible (R17); escalación; prioridad visual = lo que exige decisión (R20); lista con semáforo icono+texto |
| P-11 | Check 15 días (3 desenlaces) | `/app/erp/proyectos/[id]/check-15-dias` | B3-2 | Log de producción; panel "Requiere tu decisión" con los 3 desenlaces; confirmación destructiva para desenlaces irreversibles (R18); desenlace feliz → dispara E-60 positivo en F-07 |
| P-12 | Equipo / verificador | `/app/erp/equipo` | B3-2 | Administración simple: tabla personas×roles; designación de verificador por despacho (infra de gates E-18/E-24); sin decoración, dato-first (R10) |
| P-13 | Compras (3 mecánicas) | `/app/erp/compras` | B3-3 | Familia A densa (dinero/OC); E-20 dispara pago con gate de caja visible; guard E-18 (no OC sin schema aprobado); verificación humana listado→OC (R07); empty state "Crear primera OC" (P26) |
| P-14 | Recepción (triple verificación) | `/app/erp/compras/[ocId]/recepcion` | B3-3 | Checklist E-21 como checkbox por ítem (tipo/cantidad/sin defectos, R12); estados por ítem icono+texto; confirmación destructiva para rechazo; Familia A; guard visible |
| P-15 | Herramientas/reposición | `/app/erp/compras/herramientas` | B3-3 | Tabla densa simple; reposición como OC operativa (E-45); bajo riesgo visual, dato-first |
| P-16 | Fila del taller (capa 1) | `/app/erp/taller` | B3-3 | Kanban de módulos por estado (fila de salida, capa 1); tablet montada en taller (breakpoint md); reordenar con alternativa teclado (2.5.7); Familia A en detalle denso; input de E-59/E-34 |
| P-17 | Calidad: citación + veredicto | `/app/erp/calidad` | B3-3 | E-23 push (señal) + E-24 veredicto con guard y CTA prominente (R10/R16); confirmación destructiva para rechazo E-24; citación por módulo; nunca solo color (1.4.1) |
| P-18 | Instalación (rango 5 días) | `/app/erp/instalaciones` | B3-3 | Datepicker de rango ≤5 días (R40); guard E-24 visible; agenda del instalador móvil; falla en sitio → E-54 con rastro de origen |
| P-19 | Acta de entrega digital | `/app/erp/instalaciones/[id]/acta` | B3-3 | Momento de verdad (mapa:546): acta clara con fotos, firma del cliente (E-26), sin jerga; tono de cierre/celebración contenida; vincula a F-07 |
| P-20 | Caja (derivada) | `/app/erp/finanzas` | B3-4 | Familia A densa (dinero); decisión-first: panel "Requiere tu decisión" para E-20 bloqueante; prioridad de pagos materiales→arriendos→nóminas (R24); matemática en servidor (R05); lectura para contador; KPI salud de caja |
| P-21 | Obligaciones y cobros | `/app/erp/finanzas/obligaciones` | B3-4 | Familia A densa; estados de cobro con semáforo icono+texto (E-29 atraso 12 días avisa al gerente); deducción diseño 3D automática (R04); gráficos sin dependencia del color (R22) |
| P-22 | Compensación y comisiones | `/app/erp/finanzas/compensacion` | B3-4 | Familia A densa; matemática servidor (R05); cuenta por socio (roles de taller ven solo su saldo, E-58); bienestar KPI automático (R23); gráficos barra/línea con etiquetas (R22) |
| P-23 | Dashboard contador | `/app/erp/finanzas/contador` | B3-4 | Solo lectura (rol Aliado externo); contratos pendientes de facturar + finanzas; sin acciones destructivas; gráficos con texto (R22); desktop |
| P-24 | Pedidos web (admin) | `/app/erp/pedidos` | B3-5 | Tabla de pedidos E-44 + enganche a producción; Familia B (progresión pedido→producción) o Familia A por densidad; frontera con tienda DIFERIDO |
| P-25 | Garantía (3 secciones) | `/app/erp/garantia` | B3-5 | Familia B cards (garantías); agenda + orden + check completitud E-61 (icono+texto); plazo 8-12 días hábiles visible; contactos/Nap de soporte |
| P-26 | Documentación por etapa | `/app/erp/proyectos/[id]/documentacion` | B3-5 | Galería de fotos E-41 por etapa/módulo con `aspect-ratio` reservado (cero CLS) y caption material+ubicación; captura en campo; recupera la fotografía del negocio (estratégico) |

**Superficie: `Sitio público`** · Concepto: "Luz & Biofilia / El Creador Experto" (emocional, de venta, premium artesanal).

| ID | Pantalla | Ruta | Familia | Dirección de estilo (notas) |
|---|---|---|---|---|
| F-01 | Landing + lead | `/` | B3-1 | Hero "Carpintería arquitectónica de alta precisión" + Respuesta Atómica visible; fotografía grande 16:9; portafolio aspiracional con hover 0.8s; testimonios reales solo si existen; CTA único dominante WhatsApp/agendar (H8); Luz & Biofilia + glass-light; display serif (DD: cuál) |
| F-02 | Propuesta pública | `/propuesta/[proyectoId]` | B3-1 | Snapshot congelado de la propuesta (E-09); storytelling del proyecto (fotos, diseño 3D, estimación); lenguaje del cliente, sin schema; contiene el paso de pago F-08; premium artesanal honesto |
| F-03 | Agendar cita | `/agendar` | B3-1 | Autoservicio E-06; franjas libres por comercial; timezone (R40); modal de filtro (tipo espacio + estado + nombre) heredado del embudo híbrido con captura `gclid`/utm (nunca mostrado en UI); input minimizado; CTA a confirmar |
| F-08 | Pago diseño 3D (paso en F-02) | paso en `/propuesta/[proyectoId]` | B3-1 | Paso de pago embebido; importe claro (DD: $100k/2 espacios vs $130k — decisión de negocio); "reembolsable/deducible de la cotización" comunicado; confianza: métodos, seguridad, transparencia financiera (tono de marca) |
| F-04 | Tienda: catálogo | `/tienda` | B3-5 | **DIFERIDO** — registrado, no diseñado. Dirección futura: marca de consumo REFERENCIA (paleta telúrica+dopamínica solo aquí), render IA de producto opcional, UCP/WebMCP |
| F-05 | Tienda: ficha | `/tienda/[sku]` | B3-5 | **DIFERIDO** — registrado, no diseñado. Producto con esquema `Product`, fotos de catálogo, ficha de materiales |
| F-06 | Tienda: checkout | `/tienda/checkout` | B3-5 | **DIFERIDO** — registrado, no diseñado. Cuenta obligatoria (no checkout anónimo, H-B2-2-05 resuelto); carrito + pago E-44 |

**Superficie: `Portal cliente`** · Concepto: "Tu proyecto, en calma" (claro, de confianza, seguimiento).

| ID | Pantalla | Ruta | Familia | Dirección de estilo (notas) |
|---|---|---|---|---|
| F-07 | Portal del cliente | `/cuenta/proyectos` | B3-5 | Progreso visible por etapa en lenguaje cliente; solo línea contractual + cambio positivo (E-60, "adelantamos tu entrega"); acta de entrega (momento de verdad); pagos online E-56/E-28; garantía E-36; firma E-13; aislamiento `clienteId`; NAP/contacto y señales de confianza; cero jerga interna |

**Cobertura:** 34/34 pantallas core mapeadas (26 ERP + 4 sitio público diseñadas + 3 tienda DIFERIDO registradas + 1 portal cliente). P-32 (KPIs) y P-33 (testimonios) son DIFERIDO fuera del conteo core (`d3_ui_consolidado.md:86`).

### 4. Principios de jerarquía visual (cómo se prioriza el dato vs. la emoción)

**ERP — el dato gana sobre la decoración:**
1. **Orden visual = guard pendiente → acción primaria → contexto** (R10, `d3_ui_b2_1:85`). Lo que falta para avanzar es lo más prominente.
2. **Decisión-first en dashboards**: panel "Requiere tu decisión" al tope; después KPIs (máx 5-7, ninguno residual); después detalle (R20/R21, `d3_ui_b2_1:105-106`).
3. **La marca se gasta en jerarquía y estado, no en ornamentos**: dorado reservado para la única acción primaria; badges de estado icono+texto; cero texturas/venas decorativas en el panel.
4. **El número es el héroe**: KPI 28-32px grueso, dato secundario 14px, un sparkline máximo (`d3_ui_b1_2:28`).
5. **Anti-bloater**: ningún detalle visual sin función (vocabulario `RUIDO_VISUAL`, `diamante4_metodologia.md:86`); tablas Familia A no colapsan a cards (`d3_ui_b1_2:120-123`).
6. **El estado nunca es solo color** (R14, `d3_ui_b2_1:89`): icono+texto+color, para que la jerarquía funcione para todos.

**Sitio público — la emoción gana sobre el dato:**
1. **La fotografía es la jerarquía**: el hero y el portafolio aspiracional llevan la narrativa (16:9, luz natural, madera) — `destilacion_docs_veta.md:627-629`.
2. **Una sola idea por pantalla, una sola llamada**: Respuesta Atómica bajo el H1, CTA único dominante a WhatsApp/agendar (H8) — `marco_estrategia_mercado.md:54`.
3. **La prueba social es evidencia, no relleno**: testimonios curados reales con contexto barrial; sección ausente si no hay datos (`destilacion_docs_veta.md:280,571`).
4. **El lujo es artesanal, no aspiracional frío**: Luz & Biofilia (luz, papel, madera, vidrio), anti-esnob declarado (`destilacion_docs_veta.md:269,595,633`).
5. **La confianza técnica se muestra, no se declara**: taller propio, híbrido artesanal, NAP consistente, señales de confianza — `destilacion_docs_veta.md:158,176,271`.

**Portal cliente — la tranquilidad gana sobre el dato:**
1. **El progreso es la jerarquía**: la línea del proyecto y su avance (con cambio positivo) son lo prominente; los números financieros en segundo plano — `d3_ui_b1_1:67` (P11).
2. **El backstage no existe para el cliente**: nada de desfases, causas ni comisiones (R03, `d3_ui_b2_1:73`).
3. **Los momentos de verdad se celebran con sobriedad**: acta de entrega como "segundo contrato" (`d3_ui_b1_2:42`); comunicaciones E-60 como historial de tranquilidad.
4. **Las acciones se presentan una a la vez**: pagar, firmar, solicitar garantía — cada una con su contexto y confirmación (R18, `d3_ui_b2_1:98`).

### 5. Clasificación de hallazgos

Vocabulario del diamante 4 (`diamante4_metodologia.md:83-89`).

#### CORRECCION_VISUAL (el diseño propuesto contradice identidad o principios aprobados)

| ID | Hallazgo | Fuente |
|---|---|---|
| CV-01 | El dorado de marca como texto pequeño sobre fondo claro queda **prohibido**; solo acento sobre `espresso` o large-text/UI 3:1. Cualquier pantalla que lo use para texto rompe la regla | `d3_ui_b1_2:65,151`; `d3_ui_b2_1:138` (R38) |
| CV-02 | El tema **dark-lujo (`#0A0A0A`) queda descartado** por decisión ratificada ("Luz & Biofilia"); ningún token ni pantalla nueva debe arrastrarlo | `destilacion_docs_veta.md:595` |
| CV-03 | Ningún estado puede depender del color: icono+texto+color en gates, SLAs, cobros, KPIs | `d3_ui_b2_1:89` (R14), `:107` (R22); `d3_ui_b1_2:226` |
| CV-04 | El portal cliente **nunca muestra el backstage** (desfases, causas, comisiones); violarlo es la mayor corrección de coherencia entre superficies | `d3_ui_b2_1:73` (R03); `d3_ui_b2_2:32` |

#### GAP_VISUAL (token/primitiva/familia que falta para cubrir una pantalla)

| ID | Hallazgo | Fuente |
|---|---|---|
| GV-01 | **No existe primitiva de kanban** (necesaria para P-01 embudo y P-16 fila del taller); el estándar de 8 componentes base no la incluye | `d3_ui_b1_2:290-361`; `d3_ui_consolidado.md:30,59` |
| GV-02 | **No existe primitiva de timeline/stepper de gates** (necesaria para P-06 mapa de gates y P-09 cronograma doble); la pieza visual más compleja del ERP no tiene componente | `d3_ui_b1_2:290-361`; `d3_ui_consolidado.md:44,47` |
| GV-03 | **No existe visualización de cronograma doble** (línea contractual + línea interna con desfases por causa); exige tokens de estado específicos | `d3_ui_b2_1:73,145`; `d3_ui_consolidado.md:47` |
| GV-04 | **Sin tokens en código**: literales `#e5e5e5` inline; el sistema de diseño se declara en `@theme` Tailwind v4 | `d3_ui_b2_1:219`; `d3_ui_b1_2:206` |
| GV-05 | **Sin glosario único de estados/verbos** (H07): A4/A3 no pueden fijar labels consistentes sin él; bloquea la semántica de estado de documento (borrador vs compromiso, D3) | `d3_ui_b2_1:289` (H07), `:245` (D3) |
| GV-06 | **Sin estrategia de imágenes del negocio**: las 6 landings SEO sirven imágenes rotas; falta el pipeline de arte (fotografía/madera) que el frontstage exige | `destilacion_docs_veta.md:391-398,552` |

#### RUIDO_VISUAL (estilo/decoración sin función)

| ID | Hallazgo | Fuente |
|---|---|---|
| RV-01 | `--text-display` (hero serif) si se aplicara al ERP sería ruido: está marcado **solo frontstage**; el ERP usa escala estática | `d3_ui_b2_1:215` |
| RV-02 | Texturas/venas de madera o glass decorativos dentro del panel admin: el ERP gasta su marca en jerarquía/estado, no en ornamentos | `d3_ui_b2_1:85` (R10) |
| RV-03 | La paleta telúrica+dopamínica de consumo (azul eléctrico/lila/verde bioluminiscente) no debe colarse al ERP ni al portal; es dirección de marca de la tienda DIFERIDO | `d3_ui_b1_3:52,132`; `d3_ui_b2_1:274` |
| RV-04 | Spinners genéricos en vez de skeletons del layout final (cero CLS): el skeleton es la carga correcta en las 3 superficies | `d3_ui_b1_1:98` (P27); `d3_ui_b2_1:228` |

#### DECISION_DISEÑO (requiere decisión de gusto/negocio del Supervisor — no inventar)

| ID | Hallazgo | Fuente |
|---|---|---|
| DD-01 | **Nombre de marca unificado** ("Veta Dorada" vs "Veta de Oro"; 4 nombres conviven hoy) y NAP consistente — condición de la identidad en todo el frontstage | `destilacion_docs_veta.md:367-378,384,389` |
| DD-02 | **Hex exactos de la paleta y fuente display serif premium** — el A1/A3 los fija; este pase usa la propuesta del corpus como dirección | `d3_ui_b2_1:153,216`; `d3_ui_b1_2:394` |
| DD-03 | **¿Qué eslogan rige?** ("Diseña tu espacio. Habita el bienestar." vs variantes; 3 candidatos en el corpus) | `destilacion_docs_veta.md:270,641,682,778` |
| DD-04 | **Antigüedad de las señales de confianza**: "desde 1995" (2 décadas) vs "6 años" — afecta badges/footer/sitio y Perfil de Empresa | `destilacion_docs_veta.md:668-674` |
| DD-05 | **Estrategia de imágenes**: ¿recuperar del sitio actual (fotos ya nombradas según la guía) o producir arte nuevo? | `destilacion_docs_veta.md:552,779` |
| DD-06 | **Precio del diseño 3D** ($100k/2 espacios vs $130k) y mensaje "reembolsable/deducible" en F-08 | `destilacion_docs_veta.md:286-293,680` |
| DD-07 | **¿Card collapse (Familia B) permitido en listas de gestión?** (D6) — define P-01/P-06/P-25 en móvil | `d3_ui_b2_1:247` (D6) |
| DD-08 | **Peso visual del CTA de WhatsApp en el frontstage** (canal real de conversión, H8): ¿cuánto compite con `/agendar`? | `marco_estrategia_mercado.md:54,199`; `destilacion_docs_veta.md:198` |

#### DIFERIDO (se registra, no se diseña ahora)

| ID | Hallazgo | Fuente |
|---|---|---|
| DF-01 | Tienda F-04/F-05/F-06 (construcción) — frontera documentada, no se diseña | `d3_ui_consolidado.md:86`; `d3_ui_b2_2:95-97` |
| DF-02 | P-32 Panel gerencial/KPIs operativos (t-034) | `d3_ui_consolidado.md:86`; `d3_ui_b2_2:85` |
| DF-03 | P-33 Curaduría de testimonios (t-034; el protocolo de reseñas curadas se respeta, no se construye) | `d3_ui_consolidado.md:86`; `destilacion_docs_veta.md:280` |
| DF-04 | Render IA de producto (cola+workers GPU+CDN; ControlNet/Real-ESRGAN) — feature futura de tienda | `d3_ui_b1_3:54,135`; `d3_ui_b2_1:295` |
| DF-05 | UCP/Universal Cart + WebMCP (transporte de comercio 2026-2027) | `d3_ui_b1_3:125-126`; `d3_ui_b2_1:294` |
| DF-06 | "Noticiario de diseño" (contenido orgánico) — no existe en el mapa de páginas; alimentaría SEO pero es capa 2 | `destilacion_docs_veta.md:315-317` |

**Conteo:** 4 CORRECCION_VISUAL · 6 GAP_VISUAL · 4 RUIDO_VISUAL · 8 DECISION_DISEÑO · 6 DIFERIDO = **28 hallazgos**.

### 6. Trazabilidad de afirmaciones clave

| Afirmación | Fuente (archivo:línea) |
|---|---|
| Arquetipo Creador Experto, tono directo-elegante, híbrido artesanal, eslogan | `destilacion_docs_veta.md:267,268,269,270` |
| Tema Luz & Biofilia ratificado, sin verde literal, dorado permanece | `destilacion_docs_veta.md:595` |
| Tokens Luz & Biofilia (warm-paper, linen, carbon, stone, glass) | `destilacion_docs_veta.md:601-608` |
| Home especificado (hero, Respuesta Atómica, portafolio, testimonios reales) | `destilacion_docs_veta.md:627-631` |
| Taller propio como diferenciador no explotado | `destilacion_docs_veta.md:158,176` |
| Reseñas curadas con contexto barrial, no widget; nunca rating inventado | `destilacion_docs_veta.md:280,571` |
| Marca Veta Dorada, 4 nombres inconsistentes, NAP | `destilacion_docs_veta.md:367-378,384,389` |
| Imágenes landings rotas; probable recuperación del sitio actual | `destilacion_docs_veta.md:391-398,552` |
| Antigüedad 1995 vs 6 años sin resolver | `destilacion_docs_veta.md:668-674` |
| Conversión real = clic a WhatsApp; sitio nuevo sin WhatsApp (H8) | `marco_estrategia_mercado.md:54,198-199` |
| El sitio legacy convierte 14%, no "colador del 99%" | `marco_estrategia_mercado.md:235-239` |
| §5 del marco: informe del sector → registro de hipótesis con falsador | `marco_estrategia_mercado.md:127-131` |
| R01-R04, R10, R14, R16, R17, R20, R21, R30-R40 | `d3_ui_b2_1_destilacion_inv.md:71-74,85,89,91,92,105,106,125-145` |
| Paleta propuesta, espaciado, radios, tipografía, display solo frontstage | `d3_ui_b2_1:157-171,180-204,207-216` |
| Literales `#e5e5e5`; glosario pendiente H07; D3 autoguardado borradores | `d3_ui_b2_1:219,289,245` |
| Breakpoints semánticos y contrato de 3 comportamientos | `d3_ui_b1_2_responsive_design.md:89-96` |
| Dos familias de tablas; KPI 28-32px; estándar 8 componentes base | `d3_ui_b1_2:120-123,28,290-361` |
| Display serif `DECISION_PENDIENTE`; dorado sobre espresso | `d3_ui_b1_2:201,65,151` |
| P11 dos lenguajes; P20 decisión-first; P26/P27 empty/loading; P28 destructivas | `d3_ui_b1_1_ux_ergonomia.md:67,86,97,98,99` |
| 34 pantallas core, familias B3-1..B3-5, DIFERIDO | `d3_ui_consolidado.md:24-86` |
| Frontera admin/frontstage; cliente nunca toca backstage | `d3_ui_b2_2_pantallas_requeridas.md:32` |
| Vocabulario del D4 (CORRECCION/GAP/RUIDO/DECISION/DIFERIDO) | `diamante4_metodologia.md:83-89` |

---

## Trazabilidad / Notas para el Orquestador

1. **A1 en paralelo (supuesto activo):** este pase corrió con fallback (`destilacion_docs_veta.md` + paleta propuesta de B2-1) porque `d4_a1_auditoria_visual.md` aún no existía al momento de la lectura. **A3 (tokens) reconcilia si A1 fija hex o fuente display distintos** — este pase no fija valores, solo dirección.
2. **Qué decide el pase A3 (tokens):** DD-02 (hex + fuente display serif), CV-01/R38 (contraste dorado), la escala tipográfica por superficie (estática ERP vs fluida público, `d3_ui_b2_1:215`), y los tokens de estado del cronograma doble (GV-03) y de documento (borrador vs compromiso, D3).
3. **Qué decide A4 (primitivas):** GV-01 kanban, GV-02 stepper/timeline de gates, GV-03 cronograma doble — las 3 exigen componentes nuevos fuera del estándar de 8 de B1-2 (`d3_ui_b1_2:290-361`).
4. **Bloqueadores que escalan al Supervisor (DECISION_DISEÑO, no bloquean el diseño de A3/A4 pero sí el corte):** DD-01 (nombre/Nap), DD-03 (eslogan), DD-04 (antigüedad), DD-05 (imágenes), DD-06 (precio diseño 3D), DD-07 (cards), DD-08 (peso del CTA WhatsApp). Los 6 `DECISION_PENDIENTE` heredados de B2-1 (H01-H06, `d3_ui_b2_1:283-288`) siguen vivos.
5. **GAP de proceso:** GV-05 (glosario único de estados/verbos, H07) debe crearse antes de escribir labels finales en la PoC; sin él, la semántica "borrador vs compromiso" (D3) queda ambigua.
6. **Restricciones respetadas:** no se tocó ningún otro archivo; este pase solo escribe `d4_a2_concepto_superficies.md`. No se inventó marca: lo incierto está en `DECISION_DISEÑO` (`diamante4_metodologia.md:32`).
7. **Verificación del goal A2** (`diamante4_metodologia.md:123`): concepto por superficie cerrado (ERP / público / portal) con direcciones coherentes entre sí — un solo sistema de tokens, 3 modos de superficie; 34/34 pantallas mapeadas; 28 hallazgos clasificados.

## Registro

- Fecha: 2026-08-04 · Pase D4-A2 (Ola 1, paralelo con A1).
- Archivo de salida único: `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d4_a2_concepto_superficies.md`.
- 34/34 pantallas mapeadas · 28 hallazgos (4 CV · 6 GAP · 4 RUIDO · 8 DD · 6 DIFERIDO).
- No se leyó el output de A1 (no existía al momento de la lectura — fallback documentado) ni se modificó ningún otro archivo.
