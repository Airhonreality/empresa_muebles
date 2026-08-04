# Pase B1-2 — Responsive y design system (subagente, loop de 3 iteraciones)

**Lente:** responsive design system + accesibilidad (WCAG 2.2 nivel AA mínimo).
**Rol:** definir el estándar de breakpoints, principios responsive, design tokens y checklist de accesibilidad que **B3 usará en la sección 7 del contrato de pantalla** (Responsive + accesibilidad: comportamiento en 3 breakpoints, objetivos táctiles ≥48px, `aria`, estados de foco — ver `diamante3_metodologia.md:120`).
**Alcance de aplicación:** ERP administrativo (backstage, desktop) + flujos móviles en campo (comercial/desarrollador/gerente) + tienda pública y portal de cliente (frontstage).
**Fuentes internas:** `diamante2_define_eventos.md` (roles, bounded contexts, capa 1/2), `logica_de_negocio.md` (mapa maestro), `INS_Pantallas responsive y CSS.md` (INV responsive). **INV de accesibilidad que se intentó leer estaba vacía** (`INS_Accesibilidad...WCAG.md`, 0 líneas) → el estándar WCAG se verificó directo contra W3C (abajo, en Trazabilidad).

---

## Iteración 1 (bruta)

Captura cruda, sin filtrar, de lo que cada fuente aporta al lente.

**Desde el INS responsive (`Arnes natural\INS_Pantallas responsive y CSS.md`):**
- Responsive > técnica de adaptación; los dispositivos móviles son 52–67% del tráfico global; Google Mobile-First Indexing completo desde el 31/10/2023 (INS:1).
- Core Web Vitals (LCP, CLS, INP) como señales de ranking → WebP/AVIF + `srcset`/`<picture>`, lazy-loading + `fetchpriority="high"` en LCP, `aspect-ratio` para evitar CLS (INS:1).
- Prueba de **reflow a 320px** = 400% de zoom sobre 1280px; tolerancia de text-spacing manual (line-height ×1.5, párrafos ×2, letter-spacing 0.12, word-spacing 0.16) sin colisiones (INS:1).
- Prohibidos: ocultar contenido con `display:none` como estrategia móvil (no evita descarga), contenedores de ancho fijo en px, tipografía solo en `vw`, **hamburguesa en desktop** (reduce descubribilidad ~50%) (INS:1).
- CSS Grid + Flexbox en capas; **Container Queries** (`container-type: inline-size`) para componentes modulares; `subgrid` para alinear tarjetas (INS:2–46).
- Tipografía fluida con `clamp()`; híbrido `calc(rem + vw)` para no romper zoom (INS:47–49). Tabla de tokens de espaciado fluido `--spacing-xs..xl` (INS:50).
- Ergonomía táctil (Hoober): 49% pulgar, 36% acunamiento, 15% bimanual; ~75% de toques con pulgar; zonas: natural (tercio inferior, 25–40% de superficie), transición (medio, ~84% precisión), estiramiento (superior/esquinas, 61% precisión, +0.7–1.2s) (INS:50).
- `@media (pointer)` y `(hover)`; hover solo en `hover:hover`; `pointer: coarse` aumenta padding; nunca depender solo de hover → siempre `:focus`/`:focus-within` (INS:50).
- Hit targets: Apple 44×44pt, Google 48×48dp; separación ≥8px entre objetivos táctiles (INS:50).
- Tableta: agarre periférico, navegación en bordes/esquinas superiores, no barras fijas abajo (síndrome del brazo de gorila) (INS:50).
- Swipes: desplazamiento mínimo 80–120px, velocidad 200–250px/s, ángulo <25° (INS:50).
- Tablas densas: filas cómodas 48–52px, densas 36–40px; alineación izquierda texto, derecha numérico/fechas, centro badges/estados (INS:70).
- Tablas en móvil: **desaconseja colapsar a tarjetas salvo que el uso móvil de gestión sea prioridad crítica**; recomienda `overflow-x:auto` + primera columna `position:sticky` con fondo sólido (INS:70).
- KPIs: valor numérico 28–32px grueso alto contraste + dato secundario 14px + un solo sparkline (INS:70).
- Modales: en móvil full-screen o 100% ancho; **focus trap**; cierre visible; Esc; retorno de foco al trigger (INS:70).
- Tabla comparativa de retícula: Smartphone 0–479px / 4 col / margen 16px / gutter 16px; Tableta 768–1023px / 8 col / margen 32–40px / gutter 16–24px; Desktop 1280–1919px / 12 col / margen 80–120px / gutter 20–24px / contenedor 1140–1200px (INS:70).

**Desde el Define (`diamante2_define_eventos.md`):**
- Roles tipados que la UI debe servir: comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente, verificador; una persona puede ocupar varios roles (define:57–61).
- El rol comercial es el más cargado (define:33); la firma virtual RED2 y el checkout son precondiciones de capa 1 que desbloquean al rol más activo (define:37, :176).
- Contextos de capa 1 con pantalla: Comercial/Cotizador, Contratos, Control de cronograma, Desarrollo, Compras, Calidad, Entrega, Finanzas, Documentación, Garantía + fila del taller (define:168–170).
- Gates con UI determinista: E-18 schema pre-compras, E-21 recepción triple, E-23 citación calidad (push), E-24 veredicto pre-despacho, E-33 cambio de cronograma con causa, E-20 gate de caja (define:73–79).
- Documentación (E-41): captura con fotos por etapa, comercial + desarrollador en retoma (define:138) → **captura de fotos en móvil en campo**.
- Cronograma doble: línea interna móvil + línea contractual inmutable; KPI 4 semanas / ventas / 7 semanas (define:178, mapa:250–260).

**Desde el mapa (`logica_de_negocio.md`):**
- Portal de cliente: ver anticipos, notificaciones de pago, acta de entrega, garantía; cliente controla su proyecto desde su app (mapa:476).
- Entrega = "momento de verdad" (Jan Carlzon), "como un segundo contrato" (mapa:546) → la UI móvil del acta importa emocionalmente.
- Dashboard para el contador (mapa:390): finanzas + contratos pendientes de facturar (desktop).
- Tienda web = línea de negocio nueva; productos que comparten el pipeline de producción (mapa:153–158, :327).
- Campo real del comercial: visita, retoma de medidas, fotos, medidas de electrodomésticos/obstáculos (mapa:376, :462) → **input de datos y fotos desde el sitio del cliente**.

**Desde W3C (verificación web):**
- WCAG 2.2 publicada el 5/10/2023; añade 9 criterios nuevos y **elimina 4.1.1 Parsing**; niveles: 2×A (3.2.6 Consistent Help, 3.3.7 Redundant Entry), 4×AA (2.4.11 Focus Not Obscured min, 2.5.7 Dragging Movements, 2.5.8 Target Size min 24×24px, 3.3.8 Accessible Authentication min), 3×AAA (2.4.12, 2.4.13 Focus Appearance, 3.3.9) (W3C "What's New", Vispero).
- EN 301 549 v3.2.1 (mar/2021, armonizada feb/2022): norma europea armonizada que incorpora **WCAG 2.1 A/AA** para la WAD 2016/2102; cláusula 9 Web, 10 Documentos, 11 Software; la v4.1.1 (prevista 2026) incorporará WCAG 2.2 (accesible-eu-centre, ETSI, arc42).

---

## Iteración 2 (autocrítica)

Qué sobrevive, qué cae y por qué; qué se escapó en la pasada 1.

1. **Sobrevive — breakpoints de INS, pero con laguna crítica.** El INS define Smartphone 0–479 / Tableta 768–1023 / Desktop 1280–1919 (INS:70), dejando **480–767 y 1024–1279 sin definir**. El stack real del proyecto es **Tailwind v4** (`package.json:26–27`), cuyos breakpoints son `sm:640 md:768 lg:1024 xl:1280 2xl:1536`. **Decisión:** reconciliar ambos: usar la escala de Tailwind como mecanismo (`min-width`, mobile-first) y definir 4 tierings semánticos (móvil/tablera/desktop/wide) mapeados a tokens de Tailwind, con rangos explícitos y sin huecos. No me invento un quinto punto de ruptura.
2. **Sobrevive — "tabla→card en móvil" (pedido de la misión) CONFLICTA con el INS.** El INS desaconseja colapsar tablas de gestión a tarjetas (INS:70) y la misión pide tabla→card como principio. **Resolución (la escribo como regla de diseño, no como contradicción):** dos familias de tablas — (a) **tablas de datos densas** (dinero, compras, cronograma, fila del taller) → scroll horizontal + 1ª columna sticky (INS), (b) **listas de entidades con prioridad móvil** (leads, cotizaciones, proyectos) → card collapse. Qué pantalla cae en cada familia lo decide B3; el estándar da los criterios. Esto queda como `DECISION_PENDIENTE` solo si el negocio quiere prohibir cards en absoluto.
3. **Sobrevive — objetivos ≥48px.** La misión exige ≥48px; el INS da 44pt Apple / 48dp Google con separación de 8px (INS:50); WCAG 2.2 2.5.8 exige solo 24×24px (mínimo legal). **Regla:** estándar de diseño = 48×48 CSS px como tamaño mínimo del objetivo + 8px de separación; el 24px de WCAG es el piso, no la meta. Sin contradicción.
4. **Cae — tipografía solo con `vw` y contenedores rígidos en px.** INS los prohíbe explícitamente (INS:1). El estándar usa `rem` + `clamp()` con híbrido `rem+vw`.
5. **Cae — "contraste de foco 3:1 entre estados" como requisito AA.** 2.4.13 Focus Appearance es **AAA**, no AA (W3C, Vispero). Error común en blogs (un blog lo rotula como AA). El estándar del ERP lo adopta como **meta de calidad** (mejora 2.4.7 AA), pero el checklist AA lo declara AAA/opcional. Honestidad de nivel.
6. **Se escapó en pasada 1 — el foco debe distinguir superficie táctil vs. objetivo visual** (área de padding cuenta para 2.5.8). Y el teclado: el ERP es denso en datatables → orden de foco, skip-link y aria-sort son críticos, no decoración.
7. **Se escapó — formularios en móvil con teclado numérico** (`inputmode`), y campos de fecha con formato visible (instalación en rango de 5 días → datepicker de rango, define:254).
8. **Se escapó — estado de conectividad en campo.** El comercial fotografía y mide en sitio del cliente (mapa:376); el estándar responsive debe declarar comportamiento de falla/espera (loading, retry) sin asumir online. No resuelvo la política de offline (es `DECISION_PENDIENTE` del negocio), pero el estándar de componentes exige estados de loading/error en toda mutación.
9. **Se escapó — contraste con marca dorada.** "Veta de Oro" sugiere dorado/madera; el dorado sobre blanco falla 1.4.3. El token dorado debe usarse como acento sobre fondos oscuros o para UI/large-text (3:1), nunca para texto pequeño sobre blanco. La paleta se propone y se marca `DECISION_PENDIENTE` (el hex exacto lo confirma el Supervisor; yo no invento una marca).
10. **Se escapó — diferenciar entorno legal/INV.** WCAG 2.2 AA es el estándar de referencia técnica; EN 301 549 (UE) no aplica a Colombia pero es la INV que formaliza WCAG en software; en Colombia el marco es NTC 5854/Ley 1712 (a verificar vigencia, no la cito como mandato). Lo dejo marcado para que B3/B5 no mezclen "obligatorio por ley UE" con "estándar de calidad propio".

---

## Iteración 3 (refinamiento final)

Síntesis depurada que forma el estándar. Decisiones de esta pasada:

- **Breakpoints:** 4 tierings semánticos (móvil <768 / tablera 768–1023 / desktop 1024–1439 / wide ≥1440), mobile-first, con mecanismo Tailwind. El contrato de B3 exige **3 comportamientos** (base, tablera, desktop); wide es mejora progresiva (no bloquea entrega).
- **Principios responsive:** 10 reglas, cada una con fuente y con la aplicación concreta al ERP por rol/contexto.
- **Checklist WCAG 2.2 AA:** 56 criterios A/AA agrupados POUR con columna de verificación ERP. Los 6 criterios nuevos de 2.2 se marcan explícitos.
- **Componentes base:** botón, input, select, tabla/datatable, modal, toast, dropdown, datepicker — estados (default/hover/focus/disabled/error/loading) + accesibilidad por componente.
- **Design tokens:** color (paleta Veta de Oro PROPUESTA), spacing fluido, radius, tipografía; con variable CSS y mapeo a `@theme` de Tailwind.
- **INV vs. estándares:** sección de trazabilidad distingue `INV_VALIOSA` (INS responsive, WCAG 2.2, EN 301 549) de `INV_REFERENCIA` (Apple HIG, Material, Tailwind) y de `INV_DESCARTADA` (archivo INS accesibilidad vacío).

---

## Entregable 1 — Breakpoints (estándar para B3)

### 1.1 Escala semántica

Mobile-first (`min-width`). Mecanismo = clases de Tailwind v4 del proyecto (`package.json:26–27`); rangos cerrados sin huecos (corrige el hueco 480–767 del INS, INS:70).

| Tiering | Rango | Token Tailwind | Rejilla | Margen lateral | Gutter | Qué cambia (contenido por breakpoint) |
|---|---|---|---|---|---|---|
| **Móvil** | < 768px (test de reflow a **320px**) | base–`max-md` | 4 col | 16px | 16px | Nav → drawer colapsable; tablas densas → scroll horizontal sticky 1ª col (o card en listas de entidades); modales full-screen; formularios 1 col full-width; CTA primario fijo en zona del pulgar (tercio inferior); inputs 16px para evitar zoom iOS |
| **Tablera** | 768–1023px | `md`–`max-lg` | 8 col | 32–40px | 16–24px | Nav lateral → rail de íconos (no drawer); formularios a 2 columnas; tablas densas ya legibles a 48px; acciones de fila visibles sin menú |
| **Desktop** | 1024–1439px | `lg`–`max-xl` | 12 col | 80px | 20–24px | Nav lateral completa (≥220px); datatables con filtros + cabecera sticky; multi-panel (lista + detalle); KPIs en grid |
| **Wide** | ≥ 1440px | `xl`+ | 12+ col | centrado | 24px | Contenido acotado a `max-width: 1440px` (texto 1200px, ~65–75 chars/línea); dashboards multi-panel; no estirar líneas de lectura |

**Regla de contrato para B3 (sección 7):** toda pantalla especifica comportamiento en **3 breakpoints** — `base (<768)`, `md (768–1023)`, `≥lg (1024+)`; el tiering wide es mejora opcional, nunca bloqueante.

**Reflow obligatorio (WCAG 1.4.10):** en 320px de ancho y a 400% de zoom (1280→320) no debe haber scroll horizontal de contenido ni pérdida de información/función; se permite scroll bidireccional solo para datos estructurados (tablas, gráficos) — ver `aria` y patrón en §Componentes. Sustento: `INS_Pantallas responsive y CSS.md:1` y Understanding WCAG 2.2 1.4.10.

### 1.2 Tipos de pantalla por rol (aplicación de los breakpoints)

| Rol / persona | Superficie dominante | Breakpoint principal | Pantallas clave (contextos de capa 1) |
|---|---|---|---|
| **Comercial** (rol más cargado, define:33) | Smartphone en campo + desktop en oficina | base + desktop | Embudo de leads (E-01..E-07, E-46, E-48..E-51), visita/agenda, retoma de medidas con fotos (E-41), check de schema E-18 y veredicto E-24 (verificador único, define:75, :78), envío de cotización E-11 |
| **Desarrollador** | Tablet/desktop (taller) | md + desktop | Retoma (define en campo, mapa:376), desarrollo técnico E-17, fila del taller (estado por módulo, define:118), recepción triple E-21 |
| **Gerente** | Desktop + smartphone de consulta | desktop + base (consulta) | KPIs por subsistema (define:178), gate de caja E-20 (define:79), decisión de E-33, SLA de novedad E-34 |
| **Taller (fila de salida, capa 1)** | Tablet montada en taller | md | Fila de módulos y estados (input de E-59/E-34) — sin pantallas de carpinteros (define:118) |
| **Contador** | Desktop | desktop | Dashboard finanzas + contratos pendientes de facturar (mapa:390) |
| **Cliente (frontstage)** | Smartphone | base | Portal: progreso E-60, firma E-13, pagos E-56, acta de entrega E-26 (momento de verdad, mapa:546), garantía E-61 |
| **Visitante tienda web** | Smartphone (52–67% del tráfico, INS:1) | base | Catálogo/producto, checkout (pedido E-44) |

---

## Entregable 2 — Principios de diseño responsive del ERP

Cada principio con fuente y regla de implementación.

1. **Mobile-first, no mobile-after.** Se diseña primero la experiencia <768px y se mejora hacia desktop. Google indexa y clasifica sobre la versión móvil desde el 31/10/2023. *(INS:1; beneficia además a la tienda pública en SEO.)*
2. **Navegación por densidad de contexto:** desktop = nav lateral completa; tablera = rail de íconos; móvil = drawer colapsable. **Nunca hamburguesa en desktop** (reduce descubribilidad ~50%, INS:1). Todo con skip-link a contenido (WCAG 2.4.1).
3. **Dos familias de tablas (resuelve el conflicto tabla→card):**
   - **Familia A — datos densos** (dinero, compras, cronograma, fila del taller): contenedor `overflow-x:auto`, primera columna `position:sticky` con fondo sólido, cabecera sticky. Prohibido colapsar a cards. *(INS:70.)*
   - **Familia B — listas de entidades con prioridad móvil** (leads, cotizaciones, proyectos, garantías): card collapse en base (<768) con mismo orden de datos que la tabla.
   - Criterio para B3: si la acción móvil del rol sobre esa pantalla es "escaneo/consulta de estado" → Familia A; si es "progresión de embudo/pipeline" → Familia B. `DECISION_PENDIENTE` si el negocio quiere prohibir cards en cualquier lista de gestión.
4. **Objetivos táctiles ≥48×48 CSS px** en toda superficie interactiva (botones, filas accionables, links de nav, checkboxes de fila) + **8px de separación** mínima entre objetivos contiguos. Supera el piso de WCAG 2.2 2.5.8 (24px) y las normas de plataforma (44pt Apple / 48dp Material). *(INS:50; WCAG 2.2 2.5.8.)* En tablas densas el row mínimo 48px lo garantiza.
5. **Acciones críticas en la zona del pulgar (tercio inferior).** En móvil, los CTA de avance ("Guardar", "Siguiente", "Enviar cotización", "Registrar veredicto") van en el tercio inferior (zona natural, precisión máxima); los destructivos/baja frecuencia en zonas de estiramiento. *(INS:50.)*
6. **Hover ≠ interacción.** Estados hover solo bajo `@media (hover:hover)`; toda funcionalidad de hover debe tener equivalente en `:focus`/`:focus-visible`. `pointer: coarse` → aumentar padding de toque. *(INS:50; WCAG 2.4.7, 2.1.1.)* Particularmente crítico en el ERP: menús de acciones de fila que solo aparecen en hover son inaccesibles por teclado.
7. **Tipografía y espaciado fluidos con `clamp()`, nunca `vw` puro** (rompe zoom, INS:1, :47–50). Base en `rem`; páginas del portal público usan la escala fluida; el ERP usa escala estática rem para densidad.
8. **Container Queries para componentes reutilizables** (`container-type: inline-size`): la misma tarjeta/KPI funciona en un sidebar estrecho y en el panel principal sin depender del viewport. *(INS:2–11.)*
9. **Cero CLS:** imágenes con `aspect-ratio` + dimensiones reservadas, `lazy-loading`, `fetchpriority="high"` en LCP; en el ERP las fotos de retoma/etapas (E-41) siempre reservan espacio. *(INS:1.)*
10. **No ocultar con `display:none` el contenido relevante en móvil**; si un bloque no importa en móvil, o se reestructura (divulgación progresiva) o se cuestiona en el producto. *(INS:1.)*

**Nota de conectividad de campo:** toda mutación en móvil (guardar medidas, subir foto E-41, registrar veredicto E-18/E-24) exige estados loading/retry/offline explícitos (ver estados de componentes). La política de offline verdadero (cola de escrituras) es `DECISION_PENDIENTE` del negocio.

---

## Entregable 3 — Design tokens Veta de Oro (PROPUESTA — validar marca)

### 3.1 Color

Paleta **propuesta** por la marca "Veta de Oro" (muebles premium, madera/mármol — mapa §0). **Los hex son `DECISION_PENDIENTE` del Supervisor** (no invento la identidad visual; esto es una propuesta coherente y contrastable). Todo par de color debe pasar 1.4.3 (4.5:1 texto / 3:1 texto grande) y 1.4.11 (3:1 UI), verificado con herramienta antes de fijarse.

| Token | Hex propuesto | Uso | Contraste objetivo |
|---|---|---|---|
| `--color-ink` | `#241C15` | Texto primario (casi negro cálido) | ≥4.5:1 sobre fondo claro (≈11:1 sobre `--surface`) |
| `--color-ink-muted` | `#5C5349` | Texto secundario / placeholders no esenciales | ≥4.5:1 sobre fondo claro |
| `--color-surface` | `#F7F4F0` | Fondo de app (cálido neutro) | — |
| `--color-surface-raised` | `#FFFFFF` | Tarjetas, modales, inputs | — |
| `--color-border` | `#D8D0C6` | Bordes, divisores | 3:1 (1.4.11 si es gráfico de borde) |
| `--color-espresso` | `#3E2A21` | Marca/madera oscura: títulos grandes, nav, badges | 3:1 para UI/large-text |
| `--color-wood` | `#6B4A35` | Acentos secundarios (marca) | solo large-text/UI |
| `--color-gold` | `#A67C28` | Acento "veta de oro": iconos, focos, estado activo | **nunca texto pequeño sobre claro**; usar sobre `espresso` (≥4.5:1) o UI 3:1 |
| `--color-success` | `#1E7A4F` | Caja verde, cobros OK, KPI positivo | ≥4.5:1 texto |
| `--color-danger` | `#B3261E` | Reprocesos, gates fallidos, errores | ≥4.5:1 texto |
| `--color-warning` | `#B06000` | SLA en riesgo, atraso E-33, comisiones reducidas | ≥4.5:1 texto |
| `--color-info` | `#0B5E8C` | Novedades, avisos E-34/E-60 | ≥4.5:1 texto |
| `--color-focus` | `#1D5FD0` | Anillo de foco visible | 3:1 contra fondos adyacentes (1.4.11/2.4.13) |

Reglas de semántica visual:
- Estado del proyecto/gate se codifica por **texto + icono**, nunca solo color (WCAG 1.4.1).
- Estado de badge (E-18 aprobado/compras, E-21 recibido_verificado, E-24 veredicto, E-33 causa) → par de color con ratio verificado.

### 3.2 Espaciado

Escala base 4px para el ERP (densidad de datos) + escala fluida para páginas públicas/portal (INS:50).

| Token | Valor (rem ≈ px) | Uso |
|---|---|---|
| `--space-1` | 0.25rem (4px) | ajuste fino, iconos internos |
| `--space-2` | 0.5rem (8px) | separación táctil mínima entre objetivos (INS:50) |
| `--space-3` | 0.75rem (12px) | padding compacto inputs, gap interno tarjetas |
| `--space-4` | 1rem (16px) | padding estándar de controles y celdas |
| `--space-5` | 1.5rem (24px) | margen entre secciones, padding de tarjetas |
| `--space-6` | 2rem (32px) | espaciado de paneles |
| `--space-8` | 3rem (48px) | separación de regiones de página |
| `--space-10` | 4rem (64px) | página wide |
| `--space-page-mobile` | `clamp(12px, 0.75rem + 1vw, 24px)` | margen lateral móvil (INS:50) |
| `--space-page-desktop` | `clamp(32px, 2rem + 2.27vw, 80px)` | margen lateral desktop (INS:70) |

### 3.3 Radio

| Token | Valor | Uso |
|---|---|---|
| `--radius-none` | 0 | tablas, cabeceras de datatable |
| `--radius-sm` | 4px | inputs, botones, selects |
| `--radius-md` | 8px | tarjetas, modales (código actual ya usa 8px, `app\(publico)\page.tsx:64`) |
| `--radius-lg` | 12px | toasts, datepicker |
| `--radius-full` | 9999px | badges, chips de estado |

### 3.4 Tipografía

| Token | Valor | Uso | Nota |
|---|---|---|---|
| `--text-xs` | 0.75rem (12px) | captions, tablas densas | no para texto esencial largo |
| `--text-sm` | 0.875rem (14px) | tablas, meta, dato secundario KPI (INS:70) | ≥14px para legibilidad de datos |
| `--text-base` | 1rem (16px) | cuerpo, inputs | **inputs en móvil nunca <16px** (evita zoom forzado iOS) |
| `--text-lg` | 1.25rem (20px) | subtítulos, acciones de fila | — |
| `--text-xl` | 1.5rem (24px) | títulos de pantalla | — |
| `--text-2xl` | 2rem (32px) | KPI numbers (28–32px grueso, INS:70), h1 ERP | — |
| `--text-display` | `clamp(1.75rem, 1.2955rem + 2.273vw, 3rem)` | hero tienda pública (INS:48) | solo frontstage |

- Familia: sistema (sin variable declarada hoy, `app\globals.css:4`) → definir `--font-sans` e incorporar una display serif para marca premium (propuesta, `DECISION_PENDIENTE`).
- Line-height: 1.5 cuerpo / 1.25 títulos; medidas de texto 65–75 chars por línea.
- Escala en rem (el usuario puede re-escalar, 1.4.4); en público, escala fluida con `clamp()` híbrido `rem+vw` (INS:49).
- Estado de `prefers-reduced-motion`: animaciones/transiciones desactivables (WCAG 2.3.3 AAA / práctica). `prefers-contrast` como mejora.

Mapeo a Tailwind v4: declarar en `@theme` (`--color-*`, `--spacing-*`, `--radius-*`, `--text-*`), no en literales inline (hoy el código usa `style={{ border: '1px solid #e5e5e5' }}`, `app\(publico)\page.tsx:64` y `app\app\erp\layout.tsx:17` — se migra a tokens).

---

## Checklist WCAG 2.2 para B3 (nivel AA mínimo)

56 criterios A/AA (WCAG 2.2 eliminó 4.1.1 Parsing). Los **6 criterios nuevos de 2.2 a nivel A/AA** van marcados **[N22]**. Columna *ERP* = qué verificar en las pantallas. Fuente del inventario: Understanding WCAG 2.2 (https://www.w3.org/WAI/WCAG22/Understanding/).

### Perceptible (P)

| Criterio | Nivel | ERP — verificación |
|---|---|---|
| 1.1.1 Non-text Content | A | Alt de fotos de producto, fotos de etapa E-41, iconos (aria-hidden o alt), gráficos KPI con resumen de texto |
| 1.2.1–1.2.3 Media (prerecorded) | A | Si hay video de testimonios/renders: captions + alternativa; no bloquea el core (sin media: cumple por inaplicabilidad) |
| 1.2.4–1.2.5 Captions/AD live | AA | Igual, si hay live media |
| 1.3.1 Info and Relationships | A | `<th scope>`, `<label for>`, `<fieldset>` en formularios de gates, encabezados jerárquicos, listas reales |
| 1.3.2 Meaningful Sequence | A | Orden DOM = orden visual (critical en card collapse de tablas: el DOM debe mantener el orden lógico de datos) |
| 1.3.3 Sensory Characteristics | A | Errores/instrucciones sin "el botón rojo/el de la derecha" |
| 1.3.4 Orientation | AA | App usable en vertical y horizontal (retoma de medidas con fotos lo exige) |
| 1.3.5 Identify Input Purpose | AA | `autocomplete` en teléfono, email, nombre, dirección del cliente en formularios de lead/contrato |
| 1.4.1 Use of Color | A | Estados (E-18/E-21/E-24/E-33) con icono+texto, no solo color |
| 1.4.2 Audio Control | A | (sin audio autoplay: N/A) |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 texto, 3:1 texto grande; validar paleta propuesta (ver tokens) |
| 1.4.4 Resize Text | AA | Escala 200% sin pérdida; tipografía en rem |
| 1.4.5 Images of Text | AA | No texto en imágenes de portafolio/producto |
| 1.4.10 Reflow | AA | 320px y 400% zoom sin scroll horizontal (excepto tablas/gráficos); **regla obligatoria de §1.1** |
| 1.4.11 Non-text Contrast | AA | 3:1 en bordes de input, iconos de estado, focus ring, gráficos de KPI |
| 1.4.12 Text Spacing | AA | Sin colisiones con los 4 ajustes del INS (line-height 1.5, párrafo 2×, letter 0.12, word 0.16) |
| 1.4.13 Content on Hover or Focus | AA | Tooltips/paneles hover: dismissible (Esc), hover-pasable, persistente |

### Operable (O)

| Criterio | Nivel | ERP — verificación |
|---|---|---|
| 2.1.1 Keyboard | A | Todo accionable por teclado: gates, datatables, datepicker, modales, dropdowns |
| 2.1.2 No Keyboard Trap | A | Sin trampas; focus trap solo en modal con Esc como salida |
| 2.1.4 Character Key Shortcuts | A | Si hay atajos (S=guardar), desactivables o con un solo carácter |
| 2.2.1 Timing Adjustable | A | Toasts con timeout: pausar en hover/focus; SLA sin acción destructiva automática |
| 2.2.2 Pause, Stop, Hide | A | Spinners/animaciones de carga sin auto-rotación que impida leer |
| 2.3.1 Three Flashes | A | Sin parpadeos (fotografía/renders del negocio) |
| 2.4.1 Bypass Blocks | A | Skip-link a contenido en ERP y tienda |
| 2.4.2 Page Titled | A | `<title>` descriptivo por pantalla (`/app/erp/cronograma/:proyectoId`) |
| 2.4.3 Focus Order | A | Orden lógico: drawer, tablas, modales (mover foco al abrir, devolver al cerrar, INS:70) |
| 2.4.4 Link Purpose (In Context) | A | Enlaces de acciones de fila con propósito claro ("Ver orden de compra #123") |
| 2.4.5 Multiple Ways | AA | Navegación ERP + búsqueda + breadcrumb; tienda: nav + filtros + búsqueda |
| 2.4.6 Headings and Labels | AA | Títulos de pantalla y labels de gates descriptivos |
| 2.4.7 Focus Visible | AA | Indicador visible en toda superficie; **regla del ERP: anillo 2px + 3:1, nunca quitar outline sin reemplazo** |
| 2.4.11 Focus Not Obscured (Minimum) **[N22]** | AA | Sticky header/footer/rail no deben tapar el elemento enfocado (`scroll-padding-top` = altura del sticky) |
| 2.5.1 Pointer Gestures | A | Gestos complejos con alternativa de toque simple (sliders de cronograma → botones +/−) |
| 2.5.2 Pointer Cancellation | A | Evento `pointerup` para activar, no `pointerdown` (crítico en tablas de móvil) |
| 2.5.3 Label in Name | A | Nombre accesible contiene el texto visible (botones con icono + label) |
| 2.5.4 Motion Actuation | A | Sin interacciones por agitación/gesto corporal |
| 2.5.7 Dragging Movements **[N22]** | AA | Reordenar módulos/fila de taller, slider de fechas → alternativa de click/teclado (2.5.7) |
| 2.5.8 Target Size (Minimum) **[N22]** | AA | ≥24px piso legal; **estándar del ERP 48px** (excede el criterio por diseño, §Principio 4) |

### Comprensible (U)

| Criterio | Nivel | ERP — verificación |
|---|---|---|
| 3.1.1 Language of Page | A | `lang="es"` (Colombia) en layout raíz |
| 3.1.2 Language of Parts | AA | Términos técnicos/abreviaturas con atributo/lang o glosa (muebles, melamina, CVC, BOM) |
| 3.2.1 On Focus | A | Enfocar no dispara acciones (foco de input no guarda/abre modal) |
| 3.2.2 On Input | A | Cambiar un select no envía sola la transición de gate sin confirmación; el cronograma recalcula **tras** guardar causa (E-33) |
| 3.2.3 Consistent Navigation | AA | Nav del ERP idéntica en todas las pantallas (drawer/rail/sidebar por breakpoint, misma posición) |
| 3.2.4 Consistent Identification | AA | "Guardar"/"Aprobar schema"/"Marcar verificado" con el mismo ícono/texto en todo el sistema |
| 3.2.6 Consistent Help **[N22]** | A | Ayuda/SLA/contacto en posición consistente si se repite |
| 3.3.1 Error Identification | A | Errores identificados en texto, asociados al campo (`aria-describedby`) |
| 3.3.2 Labels or Instructions | AA→A (3.3.2 es A) | Labels siempre visibles (nunca placeholder como label); formato de fecha/moneda explícito; instrucción del rango de 5 días de instalación |
| 3.3.3 Error Suggestion | AA | Sugerencia corregible en errores (ej. "fecha anterior al contrato") |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | **Crítico en el ERP**: confirmación/deshacer en acciones de dinero (gate E-20, E-56) y firma de contrato E-13; revisión antes de enviar |
| 3.3.7 Redundant Entry **[N22]** | A | Reusar datos del lead en cotización/contrato sin re-pedir (identidad compartida, define:51) |
| 3.3.8 Accessible Authentication (Minimum) **[N22]** | AA | Login sin CAPTCHA de memoria; permitir pegar contraseñas (gestores); alternativa SSO/magic-link si hay captcha |

### Robusto (R)

| Criterio | Nivel | ERP — verificación |
|---|---|---|
| 4.1.2 Name, Role, Value | A | ARIA correcto en componentes custom (dropdown combobox/listbox, modal dialog, datepicker grid) |
| 4.1.3 Status Messages **[existe en 2.1, AA]** | AA | Toasts con `role="status"` (info/éxito) o `role="alert"` (error/gate) — ver componente toast |

**Nota de nivel (honestidad):** 2.4.13 Focus Appearance es **AAA** (no AA). El estándar del ERP lo adopta como meta (anillo ≥2px, 3:1 entre estado enfocado/no enfocado) porque es barato y robusto, pero en el checklist AA figura como recomendado, no obligatorio. 3.3.2 Labels or Instructions es nivel **A** (no AA) — en la tabla lo alineo: es A.

---

## Estándar de componentes base

Convención de estados: `default · hover · focus-visible · active · disabled · error · loading`. Aplicar en todo componente; cada fila de pantalla que B3 diseñe reutiliza estos contratos en su sección 7.

### Botón (`Button`)

| Estado | Visual | Accesibilidad |
|---|---|---|
| default | fondo `--color-espresso` (primaria) o `--color-surface-raised` + borde (secundaria); radio 4px; altura **≥48px** | `<button>` real; nombre accesible = texto visible (2.5.3) |
| hover | darken/lighten 4–8% — **solo `(hover:hover)`** (INS:50) | sin cambio de nombre/rol |
| focus-visible | anillo `--color-focus` 2px + offset 2px (3:1) | nunca `outline:none` sin reemplazo (2.4.7) |
| active | press (translateY 1px / darken) | — |
| disabled | 40% opacidad + cursor no-action | `disabled` real (fuera del taborder) o `aria-disabled`; el texto sigue legible |
| loading | spinner 16px inline + texto; layout reservado (sin CLS) | `aria-busy="true"` + `disabled` durante la operación |
| error | (acción que falla) | toast `role="alert"` + foco retorna al origen |

### Input

| Estado | Visual | Accesibilidad |
|---|---|---|
| default | fondo `--color-surface-raised`, borde `--color-border`, alto 48px, radio 4px | `<label for>` siempre visible (3.3.2); font ≥16px en móvil |
| hover | borde `--color-ink-muted` (hover:hover) | — |
| focus-visible | anillo 2px `--color-focus` | 1.4.11 |
| disabled | fondo `--color-surface`, 40% | `disabled`/`aria-disabled` + label |
| error | borde + icono + texto `--color-danger` | `aria-invalid="true"` + `aria-describedby="id-error"` (3.3.1); **nunca solo color** (1.4.1) |
| loading | skeleton width reservada | `aria-busy` (autocompletar/sugerencias) |
| readonly | igual a default, sin borde de hover | `readonly` + ayuda |

### Select

- Preferir `<select>` nativo (accesibilidad y teclado gratis). Custom solo con patrón combobox/listbox: `role="combobox"`, `aria-expanded`, `aria-controls`, opciones `role="option"` + `aria-selected`.
- Estados como input + estado **open/closed** (`aria-expanded`), navegación por flechas, filtrado con `aria-activedescendant`.

### Tabla / DataTable

| Aspecto | Estándar |
|---|---|
| Semántica | `<table>` real o `role="table"/"grid"` con `row`/`columnheader`/`rowheader`; `<caption>` descriptivo |
| Cabecera | `<thead>` con `scope="col"`; sticky en scroll vertical |
| Scroll móvil | contenedor `overflow-x:auto` + **primera columna sticky** con fondo sólido (Familia A, INS:70) |
| Filas | cómodas 48–52px / densas 36–40px; mínimo 48px si la fila es accionable (2.5.8 + principio 4) |
| Alineación | texto izquierda, numérico/fechas derecha, badges/estados centro (INS:70) |
| Sort | botones en `th` con `aria-sort="ascending|descending"` |
| Selección | checkbox de fila con label accesible ("Seleccionar proyecto #123") |
| Paginación | enlaces/botones accesibles; página actual `aria-current="page"` |
| Empty state | texto real ("No hay pedidos de compra pendientes") + acción de crear si aplica |
| Card collapse (Familia B) | en base: cada card = `<article>` con título = fila clave; botones de fila en el tercio inferior (principio 5) |

### Modal (`Dialog`)

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (título) + `aria-describedby` (descripción).
- **Focus trap** (2.1.2); foco inicial al primer control; al cerrar (Esc, X o cancelar), **foco vuelve al trigger** (INS:70).
- Móvil: full-screen o 100% ancho (INS:70); fondo `inert`.
- No requiere scroll horizontal (1.4.10) en 320px.
- Uso en ERP: confirmación de gates (E-18/E-24), reproceso E-54, decisión de E-33 (clasificador de causa).

### Toast (`Toast`)

- `role="status"` (info/éxito) o `role="alert"` (error/SLA) — 4.1.3.
- Icono + texto (nunca solo color, 1.4.1); timeout pausa en hover/focus (2.2.1); botón cerrar ≥48px.
- No roba foco; si la acción falló, el foco queda en el origen del error.

### Dropdown / menú de acciones de fila

- Trigger: `<button>` con `aria-haspopup="menu"` + `aria-expanded`; menú `role="menu"` + `role="menuitem"`, navegación por flechas, Esc cierra.
- Acciones visibles en desktop; en móvil el menú siempre abierto por tap (nunca solo hover — principio 6).

### Datepicker (rango de instalación 5 días, define:254)

- Campo de texto editable con formato visible + calendario como enhancement (no reemplazo, 3.3.2/3.3.3).
- Calendario `role="dialog"` o popover `aria-expanded`; grilla de días `role="grid"` con `aria-selected`; teclado: flechas, Home/End, PageUp/Down (mes), Tab sale (no focus trap salvo modal).
- Soporte de rango (inicio–fin ≤5 días, validación del rango de la semana de instalación).

---

## Trazabilidad y fuentes (INV vs. estándares externos)

**INV_VALIOSA** (incorporadas al estándar):
- `C:\Users\javir\Documents\DEVs\Arnes natural\INS_Pantallas responsive y CSS.md` — breakpoints de retícula (INS:70), hit targets y zonas del pulgar (INS:50), tablas/scroll sticky (INS:70), modales y focus trap (INS:70), fluid type y tokens de espaciado (INS:47–50), prohibiciones (INS:1), container queries (INS:2–11), Core Web Vitals (INS:1).
- W3C Understanding WCAG 2.2 — https://www.w3.org/WAI/WCAG22/Understanding/ (verificado 2026-08-04; inventario completo de criterios, incl. 4.1.3 Status Messages, 1.4.10 Reflow).
- W3C "What's New in WCAG 2.2" — https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ (publicación 5/10/2023; 9 criterios nuevos).
- EN 301 549 v3.2.1 — https://accessible-eu-centre.ec.europa.eu/content-corner/digital-library/en-3015492021-accessibility-requirements-ict-products-and-services_en y https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf (incorpora WCAG 2.1 A/AA; cláusulas 9–11; v4.1.1 prevista 2026 con WCAG 2.2 — arc42/accessibility.build).

**INV_REFERENCIA** (citadas vía INS, no releídas): Apple HIG (44×44pt), Google Material (48×48dp, Material breakpoints 600/840/1280), Tailwind v4 del proyecto (`package.json:26–27`).

**INV_DESCARTADA:** `INS_Accesibilidad y Usabilidad Universal...WCAG.md` — archivo **vacío (0 líneas)**; el estándar de accesibilidad se tomó de la fuente primaria W3C. Se informa al Orquestador.

**Trazabilidad interna (archivo:línea):**
- Roles y pantallas por rol: `diamante2_define_eventos.md:33,57-61,168-170,176`
- Gates con UI: `diamante2_define_eventos.md:73-79`
- Rango de instalación 5 días: `diamante2_define_eventos.md:254` (mapa) / define:87
- Cronograma doble y KPI: `diamante2_define_eventos.md:178`; `logica_de_negocio.md:250-260`
- Captura de fotos en campo (E-41): `diamante2_define_eventos.md:138`; `logica_de_negocio.md:376,462`
- Portal de cliente y acta (momento de verdad): `logica_de_negocio.md:476,546`
- Dashboard del contador: `logica_de_negocio.md:390`
- Tienda web: `logica_de_negocio.md:153-158,327`
- Stack del proyecto (Tailwind 4, Next 15): `package.json:26-27`; CSS actual sin tokens: `app\globals.css:3-5`; bordes inline `#e5e5e5`: `app\(publico)\page.tsx:64`, `app\app\erp\layout.tsx:17`

---

## Notas para el Orquestador

1. **Este pase entrega el estándar de la sección 7 del contrato de pantalla** (metodología:120). B3 usa: breakpoints de §1.1 (3 comportamientos obligatorios), principios de §Entregable 2, checklist de §Checklist y componentes de §Estándar de componentes.
2. **`DECISION_PENDIENTE` para el Supervisor** (no inventadas por este subagente):
   - Hex exactos de la paleta Veta de Oro y elección de fuente display (marca).
   - ¿Card collapse permitido en listas de gestión (Familia B) o prohibido en el ERP completo?
   - Política de conectividad offline real para flujos de campo (retoma de medidas, fotos E-41).
   - ¿WCAG 2.2 AA se aplica como requisito duro al ERP interno (backstage) o solo a tienda pública + portal de cliente? (Recomendación técnica: aplicar AA en todo — costo marginal bajo si los tokens y componentes lo llevan; la tienda pública/checkout y el portal sí son obligatorios por estar frontstage, mapa:546.)
3. **Registro de correcciones de esta pasada:** (a) se cerró el hueco de breakpoints 480–767 del INS con la escala Tailwind; (b) se corrigió el nivel real de 2.4.13 (AAA, no AA) y de 3.3.2 (A, no AA); (c) se resolvió el conflicto tabla→card entre la misión y el INS con la regla de dos familias.
4. **INV faltante:** el archivo INS de accesibilidad está vacío; WCAG se verificó directo contra W3C. Si el Supervisor quiere, re-cargar esa INV en B1-3 (inventario) o marcarla descartada.
5. **Coherencia con otros lentes:** B1-1 (UX/ergonomía) y B1-2 se solapan en zonas del pulgar y estados; B4-4 auditará el cumplimiento de este estándar en las pantallas de B3. No se leyeron outputs de otros sub-agentes (serialización respetada).
6. **Fuera de alcance de este pase:** inventario de INV clasificadas (es B1-3), lista de pantallas (B2-2), detalle de pantallas (B3), determinismo de gates (B4-1). Acá solo el estándar que esos pases consumen.

**Archivo de salida (único escrito):** `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\pasadas\d3_ui_b1_2_responsive_design.md`
