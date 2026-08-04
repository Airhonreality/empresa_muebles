# Pase D4-A1 — auditoría visual de identidad (subagente, loop de 3 iteraciones)

**Lente:** identidad visual de marca (arte, madera, artesanal, premium, local Bogotá) como cimiento del sistema visual D4. **Investigación y análisis, cero código.**
**Fuentes leídas:** `destilacion_docs_veta.md` (primaria), `marco_estrategia_mercado.md`, `logica_de_negocio.md` (Parte I), `d3_ui_b1_1_ux_ergonomia.md` (28 principios, respetados), `d3_ui_b1_3_inv_clasificacion.md` (Familia A/B). Complemento de gobierno: `diamante4_metodologia.md` y `plan_demanda.md` §1 (decisiones cerradas que remplazan al marco como fuente de verdad de la línea de demanda).
**Regla de trazabilidad:** cada afirmación lleva `archivo:línea`. Sin traza no es hallazgo. Los literales de token que **no** vienen del corpus se marcan `(derivado)` y se justifican con medida de contraste.

---

## Iteración 1 (bruta)

Inventario crudo de todo lo que el corpus dice sobre lo visual, sin filtrar:

- **Tema visual aprobado ("no reabrir"):** migrar de dark-lujo (`#0A0A0A`) a **"Luz & Biofilia"** — luz solar y fotografía natural, **nunca verde literal en los tokens**, **acento dorado intacto** (`destilacion_docs_veta.md:595`; ratificado `plan_demanda.md:28`).
- **Tokens literales portables (Luz & Biofilia):** `--veta-bg-warm-paper: 40 30% 98%` (#FCFBF9), `--veta-bg-linen: 38 26% 93%` (#F3EFE9), `--veta-text-carbon: 0 0% 17%` (#2B2B2B), `--veta-text-stone: 43 4% 46%` (#7A7873), `--veta-glass-light-bg: rgba(255,255,255,0.55)`, `--veta-glass-light-border: rgba(43,43,43,0.08)` (`destilacion_docs_veta.md:601-608`).
- **Literales de marca legacy (para rescatar con pinzas):** `#8b6f3c`, `#a68c59`, `rgba(212,197,161,0.85)`, `#0A0A0A`, `0x8b6914` (madera 3D), namespace `--veta-*` con superficies glass/stone/matte/sheen (`destilacion_docs_veta.md:304`).
- **Método de tokens rescatado entero:** jerarquía primitivos → semánticos → componente; override reglado (cualquier color literal o `!important` = "falta un token canónico"); criterio de escalamiento: valor que **se repite, expresa marca, o se necesita en otra lane** deja de ser local (`destilacion_docs_veta.md:300-302`).
- **Arquetipo:** El Creador Experto (honesto, meticuloso, con autoridad) (`destilacion_docs_veta.md:267`).
- **Tono:** directo, elegante, sin jerga pretenciosa; confianza técnica + transparencia financiera (`destilacion_docs_veta.md:268`).
- **Anti-posicionamiento:** *no* estudio de arquitectura esnob con comisiones ocultas, *no* muebles baratos/desechables, *no* CNC industrializado masivo → **proceso Híbrido Artesanal** (`destilacion_docs_veta.md:269`).
- **Señales de confianza:** desde 1995 (en relato; **2014 en datos estructurados**), +2 décadas, garantía estructural con acompañamiento post-venta (`destilacion_docs_veta.md:271`; `plan_demanda.md:25`).
- **Diferenciador local defendible:** *"Conocemos la arquitectura de Bogotá. Sabemos cómo entrar a tu conjunto residencial cumpliendo todos los protocolos y entendemos que cada muro tiene desniveles únicos que exigen una medición técnica exacta en persona."* (`destilacion_docs_veta.md:276-278`).
- **Prueba social curada con contexto barrial:** reseñas enriquecidas tipo *"instalación de cocina en el barrio Rosales"*; decisión de NO usar widget de Google Maps (`destilacion_docs_veta.md:280`).
- **Posicionamiento sintetizado:** *"estudio de carpintería arquitectónica"* — síntesis de la disputa fábrica/autor (`destilacion_docs_veta.md:633`); hero aprobado *"Carpintería arquitectónica de alta precisión."* (`destilacion_docs_veta.md:627`).
- **Identidad legal (fórmula aprobada para pie de página):** *"Veta Dorada es una marca comercial registrada. … HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9."* — marca arriba, sociedad abajo (`destilacion_docs_veta.md:639`; `plan_demanda.md:26`).
- **Nombre de marca:** **Veta Dorada**; renombre del Perfil de Empresa aparte y después del corte (`plan_demanda.md:27`). Hoy conviven **4 nombres** en distintas superficies (`destilacion_docs_veta.md:369-374, 389`).
- **NAP:** Cra. 72a #71A-57 Bogotá; tel 302 5922101; Lun–Sáb 08:00–18:00 (`destilacion_docs_veta.md:509-510, 596`).
- **Guía de imágenes accionable:** convención `{espacio}-{tipo}-{ubicación}-{numero}.jpg`, alt 125-150 chars, caption 60-120 visible, <500KB, min 4000x2400, JPEG 87-90% o WebP, `ImageObject` JSON-LD (`destilacion_docs_veta.md:550`).
- **Home especificada:** hero con Respuesta Atómica de 46 palabras; grid "Validación Técnica"; portafolio aspiracional 16:9 con hover `scale-103` en 0.8s; testimonios solo si existen; CTA final (`destilacion_docs_veta.md:627-631`).
- **Reglas responsive/UX portables:** tipografía fluida `clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)` para H1; ninguna imagen sin `aspect-ratio`; hero con `fetchpriority="high"` y WebP/AVIF; grids `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`; CTAs ≥48px con 8px de separación; LCP<2,5s · INP<200ms · CLS<0,1; `<figcaption>` visible con material + ubicación (`destilacion_docs_veta.md:614-621`).
- **27 principios UX (respetados, no reescritos):** botón primario con color de marca dorado (`d3_ui_b1_1_ux_ergonomia.md:65`); WCAG 2.2 contraste (`:68`); gráficos sin dependencia del color (`:88`); dos lenguajes visuales backstage/frontstage (`:67`); vocabulario del taller — módulos, cajón, mesón, herraje, retoma (`:45`); decision-first en dashboards (`:86`); 5-7 KPIs (`:87`); confirmación destructiva escalada (`:99`).
- **Familia A/B y tendencias (INV):** `INVS_diseño global 2026-2027` (REFERENCIA, tienda premium): bases telúricas (marrón, khaki, neutros desérticos) + acentos dopamínicos (azul eléctrico, lila, verde bioluminiscente); emociones 2027 Strategic Joy / Witherwill; autenticidad tangible y trazabilidad radical (`d3_ui_b1_3_inv_clasificacion.md:52, 131-132`). Datos técnicos: tráfico móvil 52-67% y Mobile-First Indexing (`:103`); tablas filas 48-52/36-40px con alineación por tipo (`:109`); KPI número 28-32px + comparación 14px + un sparkline (`:110`); sidebar 240-280/riel 64/drawer (`:111`); hit targets 44/48px (`:108`).
- **Colores semánticos ya existentes en el corpus (mermaid del mapa):** reproceso `fill #ffdddd / stroke #cc0000 / text #660000`; gap/causa `fill #fff3cd / stroke #cc8800 / text #664400` (`logica_de_negocio.md:67-68, 102-104`).
- **Momentos de verdad:** la entrega es "como un segundo contrato" — se diseña con "¿qué necesita sentir el cliente acá?", no solo con campos (`logica_de_negocio.md:546`); frontstage vs backstage (Service Blueprint) (`logica_de_negocio.md:548-561`).
- **Bienestar como capa no financiera:** *"de nada sirve tener muchos números en finanzas si los jefes estamos estallados"* (`logica_de_negocio.md:172`).
- **Arte del negocio ya inventariado:** carpeta `Branding Veta Dorada 2026/` con logos SVG+PNG (positivo/negativo), card, **vetas**, `.cdr` fuente; 5,3 MB "casi todo imágenes de marca" (`destilacion_docs_veta.md:43, 47`).
- **Fotos por etapa como documentación (E-41)** y rol de captura en retoma (comercial + desarrollador) (`logica_de_negocio.md:376`; `d3_ui_b1_1_ux_ergonomia.md:79`).
- **Taller propio como diferenciador no comunicado:** intención de búsqueda *"fábrica/taller"* sin explotar en el sitio (`destilacion_docs_veta.md:158, 176`).
- **Imágenes rotas en las 6 landings (I-016):** los archivos siguen la convención de la guía → probablemente recuperar del sitio actual, no producir nuevas (`destilacion_docs_veta.md:550-552, 779`).
- **Discrepancia de ruteo:** la metodología D4 cita `marco_estrategia_mercado.md §5` como "sistema de marca", pero ese §5 es *"Tu informe de sector"* (`marco_estrategia_mercado.md:125-131`); el sistema de marca vigente vive en `plan_demanda.md:21-33` (decisiones cerradas) y en la destilación §6.1 (`destilacion_docs_veta.md:261-280`). El propio marco se declara **registro histórico** (`marco_estrategia_mercado.md:1-6`).

---

## Iteración 2 (autocrítica)

Qué se sostiene, qué cae, qué se me escapó:

- **Cae:** la paleta "telúrica + dopamínica" de `INVS_diseño global` como propuesta. Es REFERENCIA de tienda (`d3_ui_b1_3_inv_clasificacion.md:52`), no decisión aprobada. La base telúrica (marrón/khaki/neutros) **converge** con linen/paper cálidos de Luz & Biofilia, pero los acentos dopamínicos (azul eléctrico, lila, **verde bioluminiscente**) **contradicen de frente** "nunca verde literal en los tokens" + "acento dorado intacto" (`destilacion_docs_veta.md:595`). No se portan.
- **Cae:** portar "tal cual" los literales legacy de marca sin verificar contraste. Medido: `#7A7873` (stone) sobre paper = **4,26:1** — no llega a AA 4,5 para texto normal; `#A68C59` sobre paper = **3,12:1** y sobre linen = **2,81:1** — no sirve ni para texto grande sobre linen; `#8B6F3C` sobre linen = **4,13:1** (solo large). El corpus da la *materia prima*; la *escala usable* con roles y AA es trabajo de este pase y de A3.
- **Se sostiene:** Luz & Biofilia + acento dorado como sistema semilla (`plan_demanda.md:28`); el arquetipo Creador Experto como filtro de cualquier decisión visual (`destilacion_docs_veta.md:267`); la dirección de fotografía natural con material y contexto barrial (`destilacion_docs_veta.md:595, 620`); el doble lenguaje visual (backstage honesto / frontstage selectivo) como principio de superficie (`d3_ui_b1_1_ux_ergonomia.md:32, 67`).
- **Se sostiene y se vuelve restricción de marca:** los colores semánticos de los mermaid (`logica_de_negocio.md:67-68`) **sí pasan AA** medido (rojo 10,6:1 · ámbar 7,9:1) → son la paleta semántica legítima del corpus.
- **Se me escapó en la pasada 1:** (a) que "nunca verde literal en tokens" **choca con la necesidad funcional de un estado de éxito** en gates (E-21/E-24) — es una tensión real que no puedo resolver con gusto, es `DECISION_DISEÑO`; (b) que **ninguna fuente del corpus nombra una familia tipográfica** — hay 0 traza de tipografía, solo reglas de escala fluida (`destilacion_docs_veta.md:614`) → la elección de familias es propuesta con `DECISION_DISEÑO` implícita; (c) que la jerarquía de tokens legacy (primitivo→semántico→componente, `destilacion_docs_veta.md:300-302`) exige que los "colores de marca" (dorados) sean una **escala**, no literales sueltos; (d) que el "modelo de 4 dimensiones de tono" que R5 exige (`marco_estrategia_mercado.md:96`) **no está definido en el corpus** — hay adjetivos (directo, elegante, sin jerga) pero no las 4 dimensiones operativas → `GAP_VISUAL` + decisión en A2.
- **Corrección metodológica:** el marco está reemplazado (`plan_demanda.md:3`) y la regla de gobierno D4 dice que "gana la evidencia de primera mano del Supervisor" (`diamante4_metodologia.md:33`) → las decisiones cerradas de `plan_demanda.md:21-33` priman sobre el research SEO y sobre los literales legacy cuando contradicen.

---

## Iteración 3 (refinamiento final)

Set final curado — el cimiento que A2 y A3 consumirán:

1. **Semilla del sistema = Luz & Biofilia** (paper/linen/carbon + acento dorado) con los 6 tokens literales del corpus como base (`destilacion_docs_veta.md:601-608`), y el método de jerarquía primitivo→semántico→componente (`:300-302`).
2. **Escala dorada como paleta primaria de marca**, construida sobre los 3 literales legacy (`#8B6914`, `#8B6F3C`, `#A68C59` — `destilacion_docs_veta.md:304`), con roles de uso dictados por **contraste medido** y un paso más oscuro `(derivado)` para texto AA sobre linen.
3. **Paleta semántica heredada del corpus mermaid** (error/reproceso, warning/gap — `logica_de_negocio.md:67-68`), verificada AA; el **estado de éxito** queda como `DECISION_DISEÑO` por el conflicto con "no verde literal".
4. **Tipografía:** el corpus no nombra familias → propuesta de dos familias (display serif cálida + UI sans humanista) + mono técnico para tablas de taller, con justificación en español y validación de stack para A3; la aprobación es del Supervisor.
5. **Arte/fotografía:** luz natural, material real (veta/madera), contexto barrial, taller visible, convención de nombres y metadatos de la guía (`destilacion_docs_veta.md:550`), recuperar archivos antes de producir nuevos (I-016).
6. **Tono por superficie:** ERP denso/operativo con vocabulario del taller y backstage honesto; público emocional/venta con frontstage selectivo y momentos de verdad; portal de cliente claro/de confianza (`diamante4_metodologia.md:18`).
7. **Regla de oro de marca cumplida:** donde el material previo contradice al gusto no escrito o a decisiones cerradas, se marca `DECISION_DISEÑO` y se documenta — no se inventa la resolución.

---

## Entregable

### 1. Identidad destilada

Qué dice el corpus que la marca **es** (con traza):

| Atributo | Declaración | Traza |
|---|---|---|
| Categoría | **Estudio de carpintería arquitectónica** — ni taller informal ni estudio esnob; síntesis de la disputa fábrica/autor | `destilacion_docs_veta.md:633` |
| Proceso | **Híbrido artesanal**: anti-CNC masivo, anti-mueble desechable | `destilacion_docs_veta.md:269` |
| Arquetipo | **El Creador Experto** (honesto, meticuloso, con autoridad) | `destilacion_docs_veta.md:267` |
| Tono | Directo, elegante, sin jerga pretenciosa; confianza técnica + transparencia financiera | `destilacion_docs_veta.md:268` |
| Territorio | **Bogotá local**: arquitectura de Bogotá, conjuntos residenciales, medición en persona | `destilacion_docs_veta.md:276-278` |
| Materialidad | Madera y veta como identidad; restauración de pisos de madera natural; arte del negocio = logos SVG/PNG, card, **vetas**, `.cdr` | `destilacion_docs_veta.md:284, 47` |
| Premium pero accesible | "Diseño de autor a precio de fabricante. Paga por calidad, no por intermediación" | `destilacion_docs_veta.md:246` |
| Tema visual | **Luz & Biofilia**: luz solar y fotografía natural, nunca verde literal, acento dorado intacto | `destilacion_docs_veta.md:595`; `plan_demanda.md:28` |
| Confianza | Tradición familiar desde 1995, estudio de diseño desde 2014 (2014 en datos estructurados); garantía estructural + post-venta | `plan_demanda.md:25`; `destilacion_docs_veta.md:271` |
| Identidad legal | Marca comercial arriba, sociedad abajo (NIT 901421357-9) | `destilacion_docs_veta.md:639`; `plan_demanda.md:26` |
| Nombre | **Veta Dorada** (a unificar en todas las superficies) | `plan_demanda.md:27`; `destilacion_docs_veta.md:369-374, 389` |
| Prueba social | Reseñas curadas con contexto barrial, sin widget de Google | `destilacion_docs_veta.md:280` |
| Valores humanos | Bienestar del equipo como pilar (cero horas extra, tiempo de jefes) | `logica_de_negocio.md:172` |
| Modelo de relación | Roles-no-personas; separación ejecutor/verificador | `logica_de_negocio.md:438` |

**Tensión de identidad NO resuelta (no inventar):** audiencia y posicionamiento geográfico tienen tres definiciones en conflicto (estrategia premium-norte de la investigación SEO vs. búsquedas reales occidente/noroccidente vs. "amas de casa y familias" de `Marca y discurso`) (`destilacion_docs_veta.md:454, 683`; `plan_demanda.md:39`). No se resuelve acá: es `DECISION_DISEÑO` (ver DD-02) y alimenta a A2 en el tono emocional del público.

### 2. Paleta de color propuesta

**Sistema:** Luz & Biofilia (claro, cálido) + acento dorado. Contraste calculado sobre `archivo:línea` del corpus (método WCAG; valores a recalcular en A3 con herramienta — acá van las mediciones manuales).

#### 2.1 Primarios — la escala dorada (marca)

| Token | Hex | Origen | Uso | Contraste vs fondo |
|---|---|---|---|---|
| `veta-gold-700` | `#6B5220` (derivado) | Paso más oscuro derivado de `#8B6914` para alcanzar AA como texto sobre linen | Texto dorado de marca sobre fondos claros (CTA primario P09, títulos de acento, número destacado KPI) | 7,1:1 vs paper AA / 6,1:1 vs linen AA |
| `veta-gold-600` | `#8B6914` | `0x8b6914` (madera 3D) `destilacion:304` | **CTA primario en relleno** con texto blanco; acento fuerte; bordes activos | 4,9:1 vs paper AA · 4,4:1 vs linen (large) · **blanco sobre él: 5,1:1 AA** |
| `veta-gold-500` | `#8B6F3C` | `#8b6f3c` `destilacion:304` | Texto de marca tamaño normal sobre paper (AA justo); iconos; subrayados | 4,6:1 vs paper AA · 4,1:1 vs linen (large) |
| `veta-gold-300` | `#A68C59` | `#a68c59` `destilacion:304` | Solo decorativo/large: divisores, rellenos suaves, ilustración de veta; **nunca texto normal** | 3,1:1 vs paper · 2,8:1 vs linen (no texto) |
| `veta-gold-sheen` | `rgba(212,197,161,0.85)` | `destilacion:304` | Tinta de superficie sobre fotografía de madera, marca sobre imagen | contraste a validar por caso en A3 |

*Nota: la escala de dorados es un trabajo de derivación reglado (jerarquía primitivo→semántico, `destilacion:300-302`); el paso `-700` está marcado `(derivado)` por ser necesario para AA. Los literales del corpus quedan mapeados a la escala, no se descartan.*

#### 2.2 Secundarios — maderas y cálidos

| Token | Hex | Origen | Uso |
|---|---|---|---|
| `veta-wood-dark` | `#5F4A2E` (derivado) | Marrón de madera oscura derivado de la familia dorada | Texto sobre fotografía de madera clara; encabezados de sección sobre foto |
| `veta-wood-mid` | `#8B6F3C` (reuso gold-500) | `destilacion:304` | Tono de la veta como acento de gráficos y barras |
| `veta-taupe` | `#B8A889` (derivado) | Neutro cálido entre linen y gold-300 | Rellenos suaves, chips, fondos de tarjeta en público |
| `veta-glass-light-bg` | `rgba(255,255,255,0.55)` | `destilacion:607` | Superficies flotantes (glass) sobre contenido |
| `veta-glass-light-border` | `rgba(43,43,43,0.08)` | `destilacion:608` | Borde de superficies glass |

*Nota: `(derivado)` = construido a partir de la familia dorada del corpus para cubrir usos de "madera" que el corpus nombra pero no da en hex (`destilacion:284, 595`). A3 formaliza valores finales.*

#### 2.3 Semánticos (heredados del corpus, verificado AA)

| Token | Hex | Origen | Uso | Contraste |
|---|---|---|---|---|
| `veta-error-text` | `#660000` | mermaid `logica_de_negocio.md:67` | Texto de error/reproceso | 10,6:1 vs `#ffdddd` AAA |
| `veta-error-fill` | `#FFDDDD` | `logica_de_negocio.md:67` | Fondo de alerta de error | — |
| `veta-error-stroke` | `#CC0000` | `logica_de_negocio.md:67` | Borde/icono de error | — |
| `veta-warning-text` | `#664400` | `logica_de_negocio.md:68` | Texto de warning/gap | 7,9:1 vs `#fff3cd` AA (AAA large) |
| `veta-warning-fill` | `#FFF3CD` | `logica_de_negocio.md:68` | Fondo de alerta de warning | — |
| `veta-warning-stroke` | `#CC8800` | `logica_de_negocio.md:68` | Borde/icono de warning | — |
| `veta-success-*` | **GAP + DECISION** | — | Estado de éxito de gates (E-21/E-24) | sin definir |

**Conflicto declarado:** el estado de éxito normalmente es verde, pero "nunca verde literal en los tokens" (`destilacion_docs_veta.md:595`) fue aprobado para la biofilia. ¿Excepción funcional para semántica, o un éxito no-verde (ámbar profundo/teal)? **No se inventa la resolución — `DECISION_DISEÑO` (DD-05).**

#### 2.4 Neutros

| Token | Hex | Origen | Uso | Contraste vs fondo |
|---|---|---|---|---|
| `veta-bg-warm-paper` | `#FCFBF9` | `destilacion:602` | Fondo principal (luz solar) | — |
| `veta-bg-linen` | `#F3EFE9` | `destilacion:603` | Fondo alterno (lino natural) | — |
| `veta-text-carbon` | `#2B2B2B` | `destilacion:604` | Texto principal | 13,7:1 vs paper AAA · 12,4:1 vs linen AAA |
| `veta-text-stone` | `#7A7873` | `destilacion:605` | Texto secundario | **4,26:1 vs paper — no AA normal** → solo large/decorativo o variante `#5F5D57` (derivado, 6,4:1 AA) para cuerpo |

**Corrección de este pase (CV-03):** el token de texto secundario del corpus **no pasa AA en tamaño normal**; se propone a A3 dos escalones (stone para meta/large, stone-dark `(derivado)` para cuerpo).

### 3. Tipografía propuesta

**Gap declarado:** ninguna fuente del corpus nombra una familia tipográfica (0 traza; solo hay regla de escala fluida `clamp()`, `destilacion:614`, y criterio de legibilidad responsive de la INV, `d3_ui_b1_3:107-108`). La propuesta de familias es `DECISION_DISEÑO` (DD-07) para el Supervisor; la *regla de escala* sí viene del corpus.

| Rol | Familia propuesta | Pesos | Uso | Justificación (español / stack) |
|---|---|---|---|---|
| **Display** (público) | **Fraunces** (variable, serif cálida, optical size) | 400/500/600 + itálica | H1-H2, hero, títulos de landing y portafolio | Serif con carácter artesanal/editorial que encarna al Creador Experto y la veta de madera; evita el esnobismo de un display frío; soporte completo de tildes/ñ (latin-ext). Contraste con UI sans = jerarquía clara. |
| **UI sans** (ERP + cuerpo público + portal) | **Inter** | 400/500/600/700 | Cuerpo, labels, tablas de datos, formularios, dashboards, portal | Humanista neutra, x-height alta: legibilidad en densidad operativa del ERP; español completo; `tabular-nums` para montos COP y medidas; fallback system-ui. |
| **Mono técnico** (ERP taller) | **IBM Plex Mono** | 400/500 | Medidas (mm), cantidades, referencias de pieza, códigos de orden, timestamps, BOM | Alinea números en listas de corte/partes y deja visible "dato de máquina" vs. lenguaje natural — vocabulario del taller (`d3_ui_b1_1:45`); es la fuente de datos de desarrollo/compras (`logica_de_negocio.md:466`). |

**Escala modular sugerida (a validar en A3):**
- **UI/ERP:** base 16px, ratio 1,25 (tercera mayor) — densidad operativa. Micro 12px (labels), small 14px (meta), body 16px, h4 20px, h3 25px, h2 31px, h1 39px.
- **Público/display:** ratio 1,333 (cuarta perfecta) con `clamp()` fluido; **H1 = `clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)`** (literal del corpus, `destilacion:614`).
- Line-height: display 1,1–1,2; body 1,5–1,6 (espacio vertical que las tildes necesitan).
- Spacing base de 4px (`diamante4_metodologia.md:97`); tokens `--spacing-*` fluidos (`d3_ui_b1_3:107`).

**Legibilidad en español/español colombiano:** pesos <400 prohibidos en cuerpo (tildes delgadas); ¿¡ y ñ verificados en **todos** los pesos de las 3 familias; sin todo-mayúsculas en frases largas (solo labels cortos con `letter-spacing` 0,02–0,05em); línea de 60–75 caracteres en cuerpo; `font-variant-numeric: tabular-nums` en tablas de dinero/medida; formato es-CO para COP (`#.##`). Compatibilidad: `next/font` self-hosted (Google), subset `latin-ext`, variable fonts para pesos — validar en A3/A4 contra Tailwind 4 / React 19 / Next 15 (`diamante4_metodologia.md:99`).

### 4. Arte / fotografía

Dirección coherente con el corpus (no microdetalle):

- **Pilar 1 — Luz & Biofilia:** fotografía con luz solar natural, sin verde literal, acento dorado como la "veta" que atraviesa el sistema (`destilacion:595`). El color de material 3D `0x8b6914` (`destilacion:304`) como temperatura de render de producto: madera teñida cálida, nunca render frío.
- **Pilar 2 — Material y taller:** el taller propio es un diferenciador no comunicado hoy (`destilacion:158, 176`) → fotografiar el proceso híbrido artesanal (manos, herramientas, corte, ensamble) y la veta. El arte del negocio ya existe: logos SVG/PNG (positivo/negativo), card, vetas, `.cdr` (`destilacion:47`).
- **Pilar 3 — Contexto barrial y local:** testimonios con contexto ("instalación de cocina en el barrio Rosales", `destilacion:280`); figcaption visible con material + ubicación ("Cocina integral en Cedritos, melamina RH 18mm", `destilacion:620`).
- **Pilar 4 — Producto y proceso:** 1 proyecto → 10 fotos → 1 caso de estudio (Sistema de Proyectos, `destilacion:715`); fotos por etapa como documentación E-41 (`logica_de_negocio.md:376`); portafolio aspiracional 16:9 con hover `scale-103`/0,8s (`destilacion:629`).
- **Pilar 5 — Técnica (obligatorio):** hero con `aspect-ratio` + `fetchpriority="high"`; WebP/AVIF; <500KB, min 4000x2400; convención `{espacio}-{tipo}-{ubicación}-{numero}.jpg`; alt 125-150 / caption 60-120 (`destilacion:550, 614-620`).
- **Decisión inmediata pendiente:** recuperar los archivos del sitio actual vs. producir nuevos (I-016 — `destilacion:552, 779`). `DECISION_DISEÑO` (DD-06).

### 5. Tono del lenguaje visual

Dirección por superficie (los 28 principios UX se respetan íntegros; acá solo el tono):

| Superficie | Tono | Concreción direccional |
|---|---|---|
| **ERP (denso, operativo)** | Backstage honesto (`d3_ui_b1_1:32, 67`); vocabulario del taller — módulos, cajón, mesón, herraje, retoma (`:45`) | Densidad alta pero sin ruido: una tarea por pantalla (P01), decision-first (P20), 5-7 KPIs (P21), gráficos con patrones + etiquetas sin depender del color (P22), tablas densas 36-40px (`d3_ui_b1_3:109`), dorado solo en la acción primaria (P09), semántica con los colores del corpus mermaid. Luz & Biofilia en modo claro; el glass (rgba) solo si tiene función. |
| **Público (emocional, de venta)** | Frontstage selectivo: solo cambio positivo (`d3_ui_b1_1:32`); momentos de verdad (`logica_de_negocio.md:546`); "estudio de carpintería arquitectónica" como voz (`destilacion:633`) | Luz solar, aire, hero aspiracional 16:9, Respuesta Atómica visible, portafolio con figcaption material+ubicación, reseñas con contexto barrial, CTA dorado ≥48px. El dorado como acento emocional, no decoración. |
| **Portal cliente (claro, de confianza)** | Confianza y transparencia (`diamante4_metodologia.md:18`) | Solo la línea contractual + "adelantamos tu entrega" (E-59) (`d3_ui_b1_1:67`); anticipos, avisos de pago, acta de entrega, seguimiento de garantía (`logica_de_negocio.md:476`); la entrega como "segundo contrato" (momento de verdad) (`logica:546`). |

### 6. Clasificación de hallazgos (vocabulario del diamante 4)

| ID | Clase | Hallazgo | Traza | Efecto en A3/A4 |
|---|---|---|---|---|
| CV-01 | `CORRECCION_VISUAL` | Dark-lujo `#0A0A0A` y superficies glass/stone/matte/sheen del legacy quedaron superados por Luz & Biofilia "no reabrir" — no portarlos como tema | `destilacion:595, 304`; `plan_demanda:28` | A3 descarta dark tokens |
| CV-02 | `CORRECCION_VISUAL` | Acentos dopamínicos (azul eléctrico, lila, verde bioluminiscente) contradicen "nunca verde literal" + "acento dorado intacto" — no adoptar | `destilacion:595`; `d3_ui_b1_3:52, 132` | A3 excluye de la paleta |
| CV-03 | `CORRECCION_VISUAL` | `#7A7873` como texto secundario no pasa AA 4,5 en tamaño normal (4,26:1) | `destilacion:605` | A3 corrige a escala stone + stone-dark |
| CV-04 | `CORRECCION_VISUAL` | `#A68C59`/`#8B6F3C` como texto normal sobre linen fallan AA → roles restringidos a large/decorativo | `destilacion:304` | A3 fija roles por contraste |
| GV-01 | `GAP_VISUAL` | Cero familias tipográficas en el corpus (0 traza) | — | A3 define + Supervisor aprueba |
| GV-02 | `GAP_VISUAL` | No existe escala dorada formalizada con roles y contraste | `destilacion:304` | A3 formaliza (base: tabla 2.1) |
| GV-03 | `GAP_VISUAL` | No existe token de éxito/semántico-info; el verde funcional choca con la regla aprobada | `destilacion:595` | A3 + DD-05 |
| GV-04 | `GAP_VISUAL` | Sin tokens de spacing/radio/borde/sombra/z-index/motion en el corpus (solo color y reglas responsive) | — | A3 los define desde `d3_ui_b1_2` y `d3_ui_b1_3` |
| GV-05 | `GAP_VISUAL` | Modelo de 4 dimensiones de tono que R5 exige sin definir en el corpus | `marco:96` (⚠️) | A2 fija el modelo; Supervisor valida |
| RV-01 | `RUIDO_VISUAL` | Cuatro nombres de marca conviviendo (Cocinas integrales Veta de oro / Veta de Oro / Veta Dorada / +legales) | `destilacion:369-374, 389` | A2/A4 unifican a "Veta Dorada" en todas las superficies |
| RV-02 | `RUIDO_VISUAL` | Glassmorphism legacy sin función en el ERP denso (anti-bloater) | `destilacion:607`; `d3_ui_b1_1:65` (minimalismo P09) | A4 lo permite solo con función |
| RV-03 | `RUIDO_VISUAL` | "Strategic Joy/dopamina" (tendencia REF) como dirección estética si se adopta sin decisión — decoración sin función vs. Creador Experto | `d3_ui_b1_3:52` | A2 no la adopta por defecto |
| DD-01 | `DECISION_DISEÑO` | Eslogan: 3 versiones en conflicto | `destilacion:270, 641, 682`; `plan_demanda:38` | Bloquea copy de hero en A2 |
| DD-02 | `DECISION_DISEÑO` | Audiencia: 3 definiciones incompatibles (premium-norte / occidente / familias) | `plan_demanda:39`; `destilacion:454, 683` | Define el tono emocional del público |
| DD-03 | `DECISION_DISEÑO` | Tagline/hero "estudio de carpintería arquitectónica" vs. ángulo fábrica/taller — la síntesis la propone el corpus pero su adopción es del negocio | `destilacion:633, 158` | A2 no resuelve por gusto |
| DD-04 | `DECISION_DISEÑO` | Peso de la base telúrica (marrón/khaki) en la paleta: converge con linen/paper pero cuánto entra es decisión de marca | `d3_ui_b1_3:52`; `destilacion:595` | A3 balancea cálidos |
| DD-05 | `DECISION_DISEÑO` | Token de éxito: ¿excepción funcional al verde o éxito no-verde? | `destilacion:595` | A3 define tras decisión |
| DD-06 | `DECISION_DISEÑO` | Imágenes de landings: recuperar del sitio actual vs. producir nuevas (I-016) | `destilacion:552, 779` | Afecta dirección de arte inmediata |
| DD-07 | `DECISION_DISEÑO` | Familias tipográficas (ninguna nombrada en corpus) | — | A3 + Supervisor |
| DD-08 | `DECISION_DISEÑO` | Renombre del Perfil de Empresa a "Veta Dorada": aparte y después del corte, con medición antes/después | `plan_demanda:27`; `destilacion:378` | A2 no lo toca para corte |
| DF-01 | `DIFERIDO` | Identidad visual de tienda web/checkout (F-04/F-05/F-06) | `diamante4:88`; `estado:345` | No se diseña ahora |
| DF-02 | `DIFERIDO` | Renders IA de producto (blueprint renderz) como estética de tienda premium | `d3_ui_b1_3:26, 155` | Registrado, no bloquea corte |
| DF-03 | `DIFERIDO` | Sistema de marca en redes (IG/TikTok): canal único reel, 16 piezas en estado Idea | `destilacion:731-732` | Registrado |
| DF-04 | `DIFERIDO` | Capa ecológica (taller de bioinspiración / solar punk) y restauración de pisos como superficies de marca propias | `destilacion:740, 284` | Registrado; activación condicionada (`marco:139`) |

**Total: 23 hallazgos** → 4 `CORRECCION_VISUAL` · 5 `GAP_VISUAL` · 3 `RUIDO_VISUAL` · 8 `DECISION_DISEÑO` · 3 `DIFERIDO`.

### 7. Trazabilidad / Notas para el Orquestador

- **Fuentes usadas** (todas leídas completas): `destilacion_docs_veta.md`, `marco_estrategia_mercado.md`, `logica_de_negocio.md`, `d3_ui_b1_1_ux_ergonomia.md`, `d3_ui_b1_3_inv_clasificacion.md`. Complemento de gobierno leído: `diamante4_metodologia.md`, `plan_demanda.md` (§1-2) para resolver la referencia "§5" y para respetar la regla "gana la evidencia de primera mano del Supervisor".
- **Corrección de ruteo para el Orquestador:** `marco_estrategia_mercado.md` está reemplazado por `plan_demanda.md` (`plan_demanda.md:3`) y su §5 es "Tu informe de sector", no sistema de marca. **El sistema de marca vigente vive en `plan_demanda.md:21-33`** (decisiones cerradas: Luz & Biofilia, Veta Dorada, arquetipo, antigüedad 2014, geografía por portafolio) y en `destilacion_docs_veta.md:261-280` (§6.1). Recomiendo actualizar la cita en `diamante4_metodologia.md:17, 52`.
- **Contrastes:** medidos a mano en este pase (método WCAG 2.x); A3 debe recalcularlos con herramienta y formalizar. El paso `(derivado)` (`#6B5220`, `#5F5D57`, maderas/taupe) es construcción para cumplir AA, **no** literal del corpus.
- **Lo que este pase NO hace:** no define tokens finales (A3), no conceptos por superficie (A2), no primitivas (A4), no motion (A5), no decide eslogan/audiencia/verde-funcional/tipografías (Supervisor vía checkpoint).
- **Qué decide el pase A2** (`d4_a2_concepto_superficies.md`): el concepto por superficie sobre esta identidad (ERP/público/portal), el modelo de 4 dimensiones de tono (GV-05), la dirección emocional del público (depende de DD-02), y resolver la tensión fábrica/autor solo si el Supervisor cierra DD-03.
- **Los 28 principios UX de B1-1 se respetan íntegros**: este pase los usa como restricción (P09 dorado, P12 contraste, P22 sin color-dependencia, P11 doble lenguaje), no los modifica.
- **Regla de oro cumplida:** los puntos de gusto no escrito (eslogan, audiencia, verde funcional, tipografías, peso telúrico, imágenes, renombre perfil) están marcados `DECISION_DISEÑO` y documentados — no inventé la resolución.

## Registro

- Fecha: 2026-08-04
- Pase: D4-A1 (Ola 1 del Diamante 4), lente auditoría visual de identidad.
- Archivo de salida único: `arnes/diagnostico/pasadas/d4_a1_auditoria_visual.md` (este archivo).
- No se modificó ningún otro archivo; no se leyó output de otros sub-agentes.
