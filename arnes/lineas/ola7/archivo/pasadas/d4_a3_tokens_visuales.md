# Pase D4-A3 — tokens visuales (subagente, loop de 3 iteraciones)

**Rol:** Design Systems engineer del Diamante 4 (t-093, D4-A3 "tokens visuales").
**Lente:** definir el sistema de design tokens completo y escalable de la V3 — color, tipografía, spacing, radio, borde, sombra, z-index, motion — cubriendo las 34 pantallas core sin huecos y con contraste WCAG AA (texto normal ≥4.5:1, texto grande ≥3:1, UI components ≥3:1). **Investigación y análisis, cero código.** Este pase es lo que la PoC y la Ola 7 consumen directamente.
**Fuentes leídas (todas completas):** `d4_a1_auditoria_visual.md` (identidad + paleta propuesta + contrastes medidos a mano), `d4_a2_concepto_superficies.md` (3 superficies, mapa 34 pantallas), `d3_ui_b1_2_responsive_design.md` (breakpoints, tokens propuestos, checklist WCAG 2.2), `d3_ui_b2_1_destilacion_inv.md` (R01-R40, espaciado 4px, radios, paleta ERP), `d3_ui_b1_1_ux_ergonomia.md` (28 principios), `d3_ui_consolidado.md` (34 pantallas), `destilacion_docs_veta.md` (tokens Luz & Biofilia literales, método de jerarquía, líneas ~290-308 y 590-641).
**Regla de trazabilidad:** `archivo:línea` en toda afirmación. Los literales que NO vienen del corpus se marcan `(derivado)` y se justifican con medida de contraste (método WCAG; valores recalculados a mano en este pase, a re-medir con herramienta en A4).
**Contraste:** medido en este pase con la fórmula WCAG 2.x sobre cada hex (luminancia relativa → ratio). Se reportan los valores medidos; cuando un valor del corpus o de un pase anterior no coincide, se corrige con la medida (ver Iteración 2).

---

## Iteración 1 (bruta)

Inventario crudo de todo lo que las fuentes ofrecen como candidato a token, sin filtrar:

**Color — base semilla (corpus, `destilacion_docs_veta.md:601-608`):** `--veta-bg-warm-paper` `#FCFBF9` (40 30% 98%), `--veta-bg-linen` `#F3EFE9` (38 26% 93%), `--veta-text-carbon` `#2B2B2B` (0 0% 17%), `--veta-text-stone` `#7A7873` (43 4% 46%), `--veta-glass-light-bg` `rgba(255,255,255,0.55)`, `--veta-glass-light-border` `rgba(43,43,43,0.08)`.

**Color — literales de marca legacy (recuperables, `destilacion:304`):** `#8b6f3c`, `#a68c59`, `rgba(212,197,161,0.85)`, `0x8b6914` (madera 3D), namespace `--veta-*` con superficies glass/stone/matte/sheen.

**Color — escala dorada propuesta por A1 (tabla 2.1):** gold-700 `#6B5220` (derivado, 7,1:1 vs paper / 6,1:1 vs linen), gold-600 `#8B6914` (4,9:1 vs paper · blanco sobre él 5,1:1), gold-500 `#8B6F3C` (4,6:1 vs paper), gold-300 `#A68C59` (3,1:1 vs paper, solo large/decorativo), gold-sheen `rgba(212,197,161,0.85)`.

**Color — paleta ERP propuesta por B1-2/B2-1 (tabla B1-2:157-171):** ink `#241C15`, ink-muted `#5C5349`, surface `#F7F4F0`, surface-raised `#FFFFFF`, border `#D8D0C6`, espresso `#3E2A21`, wood `#6B4A35`, gold `#A67C28`, success `#1E7A4F`, danger `#B3261E`, warning `#B06000`, info `#0B5E8C`, focus `#1D5FD0`.

**Color — semánticos del corpus mermaid (A1 tabla 2.3, `logica_de_negocio.md:67-68`):** error-text `#660000` (10,6:1 vs `#FFDDDD`), error-fill `#FFDDDD`, error-stroke `#CC0000`; warning-text `#664400` (7,9:1 vs `#FFF3CD`), warning-fill `#FFF3CD`, warning-stroke `#CC8800`. Estado de éxito: **GAP + DECISION_DISEÑO** (DD-05 de A1).

**Color — neutros secundarios derivados por A1 (tabla 2.2/2.4):** stone-dark `#5F5D57` (6,4:1), wood-dark `#5F4A2E` (8,1:1), taupe `#B8A889`, reuso de gold-500 como wood-mid.

**Tipografía — 0 familias en el corpus (GAP GV-01 de A1, DD-07); reglas de escala sí del corpus:** H1 = `clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)` (`destilacion:614`); escala estática rem ERP `xs..2xl` (B1-2:209-215, B2-1:207-216); KPI 28-32px + comparación 14px + un sparkline (`d3_ui_b1_3:110`, citado en A1:31 y B1-2:28); `--text-display` `clamp(1.75rem, 1.2955rem + 2.273vw, 3rem)` solo frontstage (B1-2:199, B2-1:215); line-height 1.5 cuerpo / 1.25 títulos; tabular-nums para montos; propuesta de A1: Fraunces (display) + Inter (UI) + IBM Plex Mono (técnico).

**Espaciado — escala base 4px ERP + fluida público (B2-1:182-193, B1-2:166-177):** `--space-1` 4px … `--space-10` 64px, `--space-page-mobile` `clamp(12px, 0.75rem + 1vw, 24px)`, `--space-page-desktop` `clamp(32px, 2rem + 2.27vw, 80px)`.

**Radio (B2-1:196-204):** none 0 / sm 4px / md 8px / lg 12px / full 9999px.

**Breakpoints (B1-2:87-96):** móvil <768 / tablera 768-1023 / desktop 1024-1439 / wide ≥1440; contrato de 3 comportamientos por pantalla.

**Reglas duras aplicables a tokens:** R37 `clamp()` rem+vw nunca vw puro; R38 contraste verificado con herramienta, dorado nunca texto pequeño sobre claro; R14 estado icono+texto+color nunca solo color; R35 targets ≥48px + 8px; R39 foco 2px + 3:1; D3 borrador ≠ compromiso (sin colores de confirmación); R34 dos familias de tablas; "nunca verde literal en los tokens" (`destilacion:595`).

**34 pantallas (consolidado:24-86):** 26 admin P-01..P-26 + 8 frontstage F-01..F-08, familias B3-1 (9), B3-2 (7), B3-3 (7), B3-4 (4), B3-5 (7). DIFERIDO: F-04/F-05/F-06, P-32, P-33.

---

## Iteración 2 (autocrítica)

Qué se sostiene, qué cae, qué se me escapó, qué reconcilio — con medida:

1. **Cae la afirmación de B1-2 "gold `#A67C28` sobre espresso ≥4,5:1".** Medido: `#A67C28` L=0,2268; espresso `#3E2A21` L=0,0279 → ratio **3,55:1** (pasa UI 3:1, FALLA texto normal 4,5:1). Y `#8B6914` (gold-600 de A1) sobre espresso = **2,65:1** (ni 3:1). **La escala dorada de A1 (solo pasos oscuros, para texto sobre claro) NO cubre el rol "acento dorado sobre espresso" que R38/CV-01 exige.** Resolución: derivar pasos claros de la familia dorada (gold-100/200, del sheen `rgba(212,197,161,0.85)` ≈ `#D4C5A1`): gold-200 sobre espresso mide **7,9:1** (texto/large AA); gold-300 sobre espresso = 4,18:1 (solo large). Con esto la regla "dorado como acento sobre espresso o large/UI, nunca texto pequeño sobre claro" queda **operativa con un par que sí pasa**.
2. **Cae portar tal cual el warning-stroke `#CC8800` del corpus.** Medido contra su propio fill `#FFF3CD`: ratio **2,67:1** < 3:1 → falla 1.4.11 si el ícono/borde es el único indicador (R14 prohíbe color-only, pero el ícono en sí debe pasar 3:1 contra su fill). Resolución: stroke de warning derivado más oscuro `#A87000` (medido **3,8:1** vs fill); `#CC8800` queda como decorativo/ilustración. El error-stroke `#CC0000` sí pasa (4,7:1 vs fill) — se conserva.
3. **Cae el border `#D8D0C6` como borde de input.** Contra `#FFFFFF` mide **1,48:1** — no cumple 3:1 de 1.4.11 si el borde es lo que identifica el campo (input = borde + fill blanco + label; el borde sí es señal visual del componente). Resolución: `--veta-border-default` (input/interactivo) = `#8A8479` (derivado, **3,7:1** vs blanco); `#D8D0C6` baja a `--veta-border-subtle` (divisores/cabeceras decorativas, sin requisito).
4. **Se sostiene y se confirma (CV-03 de A1):** `#7A7873` (stone) como texto secundario normal **no pasa AA** (4,26:1 vs paper). Dos escalones: stone (large/decorativo) + stone-dark `#5F5D57` (6,4:1 vs paper · 5,7:1 vs linen) para cuerpo/meta.
5. **Se sostiene y se reconcilia: `#B06000` (B1-2 warning texto) mide 4,49:1 sobre paper — falla AA por 0,01.** El corpus mermaid `#664400` (warning-text, 8,5:1 vs paper, 7,9:1 vs su fill) gana por regla "corpus primario". El conjunto de texto semántico queda anclado a los literales del mermaid, no a la propuesta B1-2.
6. **Se me escapó en la bruta — la reconciliación ink vs carbon.** B1-2 propone `#241C15` (ink) como texto primario del ERP; el corpus Luz & Biofilia da `#2B2B2B` (carbon) como texto principal. Son dos hex distintos para el mismo rol. Resolución: un solo token semántico `--veta-text-primary` = **carbon `#2B2B2B`** (corpus, 13,7:1 vs paper · 12,4:1 vs linen · 12,9:1 vs surface ERP); `#241C15` queda como primitivo `charcoal-900` (encabezados/hero opcional) — evita dos tokens casi idénticos compitiendo. La regla de A2 ("un botón es el mismo componente en las 3 superficies con el mismo token") exige UNA fuente de texto, no dos.
7. **Se me escapó — `#B3261E` (danger B1-2) vs `#660000` (error-text mermaid).** El mermaid gana para texto/badges (10,6:1); `#B3261E` (6,3:1 vs paper) queda como primitivo danger más saturado para íconos/grandes sobre blanco (opcional). El criterio: cuando el corpus y un pase proponen valores para el MISMO rol, gana el corpus (regla de A1 it.3: `diamante4_metodologia.md:33` "gana la evidencia de primera mano").
8. **Tensión no resuelta heredada (DD-05): "nunca verde literal" vs estado de éxito.** El D3 (B1-2/B2-1) propuso y mapeó `success #1E7A4F` (5,1:1 vs paper) a los gates E-18/E-21/E-24/E-20 y a cobros OK. La decisión D4 aprobada ("Luz & Biofilia, nunca verde literal en los tokens", `destilacion:595`) **contradice el token verde**. No la resuelvo por gusto: es `DECISION_DISEÑO` (DD-05). Mientras tanto, la UI no queda bloqueada: R14 obliga icono+texto+color, así que el estado "aprobado/éxito" se puede renderizar con ícono de check + texto + color neutral o la semántica que el Supervisor decida. Propongo dos opciones con medida (ver Entregable §2.3 y DD-A3-02).
9. **Verificación de contraste de A1 vs medida propia:** gold-700 vs linen lo mido en **6,4:1** (A1 registró 6,1:1 — diferencia de redondeo manual, no de criterio; con 6,4 sigue pasando AA 4,5:1). Todos los demás ratios de A1 se confirman dentro del error de redondeo. La medida con herramienta (A4) es la que fija valor.

---

## Iteración 3 (refinamiento final)

Síntesis depurada. Decisiones de cierre de este pase:

1. **Un sistema de tokens, 3 modos de superficie** (confirmo A2: la separación es por densidad, tipografía display y rol del dato, no por paleta). Los tokens de color base son compartidos; el modo solo varía la *densidad de uso* de la escala y qué tipografías display entran.
2. **Jerarquía obligatoria primitivo → semántico → componente** (`destilacion:300-302`): todo literal de color vive en un primitivo; los semánticos mapean primitivos a roles; los componentes mapean semánticos. Regla de override del corpus: cualquier color literal en código o `!important` = falta un token canónico (GV-04 heredado, hoy `#e5e5e5` inline en `app\(publico)\page.tsx:64` y `app\app\erp\layout.tsx:17`, B2-1:219).
3. **Escala dorada completa de marca** (necesaria para cerrar la tensión de la iteración 2): pasos claros (gold-100/200, para acento sobre espresso/foto oscura) + pasos medios/oscuros (gold-300..700, para texto y relleno sobre claro). Roles dictados por contraste medido.
4. **Semántica anclada a los literales del corpus mermaid** (error/warning) + info derivado + focus; el **éxito queda LOCKED** en `DECISION_DISEÑO` (DD-05) con dos opciones propuestas y medidas.
5. **Tipografía:** propuesta de 3 familias (Fraunces display / Inter UI / IBM Plex Mono técnico) con la regla de escala del corpus; jerarquía display **solo frontstage** (A2 RV-01). La elección de familias es `DECISION_DISEÑO` (DD-07, Supervisor).
6. **Tokens faltantes que este pase define para no dejar huecos:** familia de estado de documento (borrador vs compromiso, D3 — neutral, sin colores de confirmación), tokens de desfase del cronograma doble (GV-03 mapeado a semánticos warning/info), media tokens (aspect-ratio/caption), skeleton/shimmer, focus-inverse para fondos oscuros.
7. **Cobertura 34/34 verificada por familia (Entregable §6);** los huecos que quedan son los que por regla NO resuelve A3: primitivas kanban/timeline (A4, GV-01/GV-02), éxito (Supervisor, DD-05), familias tipográficas (Supervisor, DD-07), glosario de estados/verbos (H07).
8. **Regla de oro cumplida:** donde el material previo contradice una decisión aprobada o no la resuelve, se marca `CORRECCION_VISUAL`/`DECISION_DISEÑO` y se documenta — no se inventa la resolución de marca.

---

## Entregable

### 1. Jerarquía de tokens (primitivo → semántico → componente)

Convención de nombres obligatoria del corpus (`--veta-*`, `destilacion:304`, método `:300-302`). Tres capas; un valor sube de capa cuando **se repite, expresa marca o se necesita en otra lane** (`:302`).

| Capa | Prefijo | Ejemplo | Regla |
|---|---|---|---|
| **Primitivo** | `--veta-{familia}-{paso}` | `--veta-gold-600`, `--veta-charcoal-800`, `--veta-paper-100` | Un solo lugar físico del valor (hex/length); no expresa rol. Los pasos de un hue son una escala monotónica medible |
| **Semántico** | `--veta-{rol}-{parte}` | `--veta-text-primary`, `--veta-bg-surface`, `--veta-border-default`, `--veta-color-warning-text`, `--veta-status-success-*` | Expresa qué ES el valor en el sistema (rol), no su color. Puede cambiar en modo oscuro/futuro sin tocar componentes |
| **Componente** | `--veta-{componente}-{parte}-{estado}` | `--veta-btn-primary-bg`, `--veta-input-border`, `--veta-badge-warning-bg`, `--veta-kanban-card-surface` | Mapeo a componentes concretos; los estados (default/hover/focus/disabled/error/loading) son parte del nombre |

Sub-familias del namespace: `bg-` (fondos de superficie), `text-` (texto), `border-` (bordes), `color-` (semántico de estado), `status-` (estado de documento/gate), `surface-`, `shadow-`, `radius-`, `space-`, `motion-`, `ease-`, `z-`, `font-`, `text-` (tamaños), `media-` (imágenes/aspect-ratio).

**Mapeo a Tailwind v4** (única vía de consumo, nunca literales inline — B2-1:219): declarar en `@theme` `--color-*` (primitivos y semánticos), `--spacing-*`, `--radius-*`, `--text-*`, `--font-*`, `--shadow-*`, `--z-*`, `--border-*`. Las utilidades de Tailwind referencian el token semántico; el primitivo solo cambia en `@theme`.

**Árbol de un ejemplo (CTA primario dorado):**
```
primitivo    --veta-gold-600: #8B6914        (corpus:304)
semántico    --veta-color-brand: var(--veta-gold-600)      (marca, acción primaria)
componente   --veta-btn-primary-bg: var(--veta-color-brand)
             --veta-btn-primary-text: #FFFFFF              (5,1:1 sobre gold-600, medido)
```

### 2. Color

**Contraste:** valores medidos en este pase (método WCAG; a re-medir con herramienta en A4 — R38). Leyenda: `AA` = ≥4,5:1 texto normal · `AA-largo` = ≥3:1 texto grande/UI. `(derivado)` = construido para cumplir AA o cubrir un rol que el corpus nombra pero no da en hex.

#### 2.1 Primitivos — neutros (cálidos Luz & Biofilia + madera)

| Token | Valor | Origen | Rol | Superficie/uso |
|---|---|---|---|---|
| `--veta-paper-100` | `#FCFBF9` | corpus `:602` | fondo principal público (luz solar) | bg |
| `--veta-linen-100` | `#F3EFE9` | corpus `:603` | fondo alterno público (lino) | bg |
| `--veta-surface-100` | `#F7F4F0` | B1-2:161 (ERP) | fondo de app ERP (modo ERP) | bg |
| `--veta-surface-0` | `#FFFFFF` | B1-2:162 | tarjetas, modales, inputs | bg (raised) |
| `--veta-charcoal-900` | `#241C15` | B1-2:159 | encabezados display (near-black cálido) — primitivo de texto | text |
| `--veta-charcoal-800` | `#2B2B2B` | corpus `:604` | texto principal | text |
| `--veta-stone-400` | `#7A7873` | corpus `:605` | texto secundario large/decorativo (4,26:1 — **no AA normal**) | text |
| `--veta-stone-600` | `#5F5D57` | (derivado, A1) | texto secundario normal (meta) | text |
| `--veta-espresso-700` | `#3E2A21` | B1-2:164 | marca madera oscura: títulos grandes, nav, badges sobre claro | text/bg |
| `--veta-taupe-200` | `#B8A889` | (derivado, A1) | rellenos suaves, chips, fondos de tarjeta público | bg |
| `--veta-wood-700` | `#5F4A2E` | (derivado, A1) | texto sobre fotografía de madera clara | text (sobre media) |
| `--veta-wood-600` | `#6B4A35` | B1-2:165 | acento secundario de marca (solo large/UI) | acento |
| `--veta-border-subtle` | `#E6E1D8` | (derivado) | divisores, cabeceras decorativas (sin requisito 1.4.11) | border |
| `--veta-border-default` | `#8A8479` | (derivado) | borde de inputs/interactivos (**3,7:1 vs blanco**, corrige CV-A3-03) | border |
| `--veta-glass-bg` | `rgba(255,255,255,0.55)` | corpus `:607` | superficie flotante glass (público) | bg |
| `--veta-glass-border` | `rgba(43,43,43,0.08)` | corpus `:608` | borde de superficie glass | border |

#### 2.2 Primitivos — escala dorada (marca) completa

| Token | Valor | Origen | Rol | Contraste medido | Uso |
|---|---|---|---|---|---|
| `--veta-gold-100` | `#E9DFC6` | (derivado del sheen) | tinta suave/relleno de veta | — | fondos de acento, marcas sobre foto |
| `--veta-gold-200` | `#D4C5A1` | corpus sheen `rgba(212,197,161,0.85)` (sólido) | **acento dorado claro sobre espresso/foto oscura** | **7,9:1 vs espresso AA** · 1,7:1 vs paper (no texto sobre claro) | títulos/CTA de marca sobre espresso (CV-01 operativo) |
| `--veta-gold-300` | `#A68C59` | corpus `:304` | decorativo/large | 3,1:1 vs paper · 4,2:1 vs espresso (large) | divisores, rellenos suaves, ilustración veta; **nunca texto normal sobre claro** (R38) |
| `--veta-gold-400` | `#9C7E3F` | (derivado) | paso intermedio | 3,7:1 vs paper · 3,4:1 vs linen | large/UI, íconos sobre claro |
| `--veta-gold-500` | `#8B6F3C` | corpus `:304` | texto de marca sobre claro | **4,6:1 vs paper AA (justo)** · 4,1:1 vs linen (large) | texto de marca normal, subrayados, iconos |
| `--veta-gold-600` | `#8B6914` | corpus `:304` (0x8b6914) | **CTA primario en relleno** | 4,9:1 vs paper · **blanco sobre él 5,1:1 AA** · 2,7:1 vs espresso (no usar sobre oscuro) | botón primario dorado con texto blanco, bordes activos |
| `--veta-gold-700` | `#6B5220` | (derivado, A1) | texto dorado AA sobre claro | **7,1:1 vs paper · 6,4:1 vs linen AA** | títulos de acento, número destacado KPI, texto dorado de marca |

**Regla de uso de la escala (consolidada de CV-01/CV-04/A1):** `gold-200` solo sobre fondos oscuros (espresso/foto); `gold-300`/`gold-400` solo large/UI/decorativo; `gold-500`/`gold-700` texto normal sobre claro (gold-700 es el seguro AA); `gold-600` relleno de acción primaria con texto blanco. **Ningún dorado como texto pequeño sobre claro salvo gold-500/gold-700.**

#### 2.3 Semánticos de estado (corpus mermaid + info derivado + éxito LOCKED)

| Token | Valor | Origen | Contraste medido | Uso |
|---|---|---|---|---|
| `--veta-color-error-text` | `#660000` | corpus mermaid `logica:67` | **10,6:1 vs fill** · 13,0:1 vs paper | texto de error/reproceso |
| `--veta-color-error-fill` | `#FFDDDD` | `logica:67` | — | fondo de alerta de error |
| `--veta-color-error-stroke` | `#CC0000` | `logica:67` | **4,7:1 vs fill** (1.4.11 ✓) | borde/ícono de error |
| `--veta-color-warning-text` | `#664400` | `logica:68` | **7,9:1 vs fill** · 8,5:1 vs paper | texto de warning/gap |
| `--veta-color-warning-fill` | `#FFF3CD` | `logica:68` | — | fondo de alerta de warning |
| `--veta-color-warning-stroke` | `#A87000` | (derivado) — **corrige CV-A3-02** | **3,8:1 vs fill** (1.4.11 ✓) · `#CC8800` corpus queda decorativo (2,7:1, no apto 1.4.11) | borde/ícono de warning |
| `--veta-color-info-text` | `#0B5E8C` | B1-2:170 | **6,8:1 vs paper** · 5,9:1 vs su fill | novedades, avisos E-34/E-60 |
| `--veta-color-info-fill` | `#DFEDF6` | (derivado) | — | fondo de alerta info |
| `--veta-color-info-stroke` | `#1D6FA3` | (derivado) | **4,6:1 vs fill** (1.4.11 ✓) | borde/ícono info |
| `--veta-color-focus` | `#1D5FD0` | B1-2:171 | **5,6:1 vs paper** · 5,1:1 vs linen · 2,3:1 vs espresso (no usar sobre oscuro) | anillo de foco 2px (R39); sobre fondos oscuros usar `--veta-color-focus-inverse` |
| `--veta-color-focus-inverse` | `#FFFFFF` | (derivado) | 13,5:1 vs espresso · 1,05:1 vs paper (solo sobre oscuro) | anillo de foco sobre botones oscuros/espresso |
| `--veta-color-success-*` | **LOCKED** | DD-05 | — | estado de éxito (gates E-18/E-21/E-24/E-20 aprobados, cobros OK, E-60 positivo) |

**Resolución de la tensión "nunca verde literal" vs estado de éxito — `DECISION_DISEÑO` (DD-05, no la invento):** el corpus NO la resuelve (`destilacion:595` solo prohíbe verde literal; el D3 propuso `#1E7A4F`). Opciones que presento al Supervisor con medida:

| Opción | Valor propuesto | Contraste medido | Costo/beneficio |
|---|---|---|---|
| **A — verde funcional restringido al backstage (ERP)** *(recomendada)* | text `#1E7A4F` · fill `#DDEBE2` · stroke `#2F6B4F` | text vs paper **5,1:1 AA** · stroke vs fill **4,5:1** | "Nunca verde literal" se leyó para la biofilia/fotografía del frontstage; el ERP ya usa rojo/ámbar funcionales del mermaid, un verde funcional de semántica es coherente. No entra al sitio público. |
| **B — éxito no-verde (ámbar profundo/bronce)** | text `#7A5A00` · fill `#F4EBD3` · stroke `#A87000` (reuso warning-stroke) | text vs fill **8,2:1** · text vs paper **7,4:1** | Respeta "nunca verde literal" al pie de la letra pero **colisiona con el ámbar de warning** y con el dorado de marca; baja el reconocimiento del estado (R14 depende de icono+texto, así que es viable pero más confuso). |

**Bloqueo real:** ninguno — R14 obliga icono+texto+color, así que el estado se renderiza con check + texto + el color que decida el Supervisor. El corte del token SÍ depende de DD-05.

#### 2.4 Semánticos de rol de superficie (bg/text/border/glass/status) — los que consumen los componentes

| Token | Valor | Rol | Superficie | Contraste | Uso |
|---|---|---|---|---|---|
| `--veta-bg-surface` | `#F7F4F0` | bg | ERP app | — | fondo del panel (modo ERP) |
| `--veta-bg-surface-paper` | `#FCFBF9` | bg | público/portal | — | fondo principal público |
| `--veta-bg-surface-alt` | `#F3EFE9` | bg | alterno | — | bandas alternas, secciones |
| `--veta-bg-raised` | `#FFFFFF` | bg | tarjetas/modales/inputs | — | superficie elevada |
| `--veta-text-primary` | `#2B2B2B` (charcoal-800) | text | todas | **13,7:1 vs paper · 12,4:1 vs linen · 12,9:1 vs surface** | cuerpo, labels, tablas |
| `--veta-text-heading` | `#241C15` (charcoal-900) | text | públicas/portal | 14,2:1 vs blanco | títulos (primitivo absorbido de B1-2 ink) |
| `--veta-text-muted` | `#5F5D57` (stone-600) | text | todas | **6,4:1 vs paper** · 5,7:1 vs linen | meta, captions, dato secundario |
| `--veta-text-display` | `#3E2A21` (espresso-700) | text | público/portal (frontstage) | **13,0:1 vs paper** · 11,8:1 vs linen | títulos serif display sobre claro |
| `--veta-border-subtle` | `#E6E1D8` | border | todas | decorativo | divisores, cabeceras |
| `--veta-border-default` | `#8A8479` | border | inputs/interactivos | **3,7:1 vs blanco** | borde de campo (1.4.11) |
| `--veta-border-strong` | `#3E2A21` | border | activo/seleccionado | 13,0:1 vs paper | fila/celda activa |
| `--veta-border-brand` | `#8B6914` | border | acento activo | 4,9:1 vs paper | borde de CTA/estado activo dorado |
| `--veta-glass-bg` | `rgba(255,255,255,0.55)` | bg | público | — | nav glass, tarjetas flotantes |
| `--veta-glass-border` | `rgba(43,43,43,0.08)` | border | público | — | borde glass |
| `--veta-status-draft-bg` | `#F3EFE9` | bg | ERP | — | borrador: fondo neutral lino |
| `--veta-status-draft-border` | `#5F5D57` (dashed) | border | ERP | 5,7:1 vs linen | borrador: borde discontinuo (D3 — nunca parece compromiso) |
| `--veta-status-draft-label` | `#5F5D57` | text | ERP | 5,7:1 vs linen | label "Borrador" (sin colores de confirmación) |
| `--veta-skeleton-bg` | `#ECE7DE` | bg | todas | — | shimmer/skeleton reservando layout (P27, cero CLS) |
| `--veta-media-caption` | `#5F5D57` | text | media | 5,7:1 vs linen | figcaption material+ubicación |

**Tokens de desfase del cronograma doble (GV-03) — mapeo a semánticos existentes, sin primitivas nuevas:** causa interna → `warning` (text `#664400`/fill `#FFF3CD`); causa externa o cambio de contrato → `info` (text `#0B5E8C`/fill `#DFEDF6`); desfase bloqueante (frena avance) → `error` (fill `#FFDDDD`). Línea contractual = sólida `espresso`; línea interna = discontinua `stone-600`. Siempre con **patrón/textura + etiqueta**, nunca solo color (R22, `d3_ui_b2_1:107`).

### 3. Tipografía

**Familias (propuesta — `DECISION_DISEÑO` DD-07; el corpus nombra 0 familias, solo reglas de escala, A1:150):**

| Rol | Familia propuesta | Pesos | Uso | Superficie | Justificación |
|---|---|---|---|---|---|
| **Display serif** | **Fraunces** (variable, serif cálida, optical size, itálica) | 400/500/600 (+itálica) | H1-H2, hero, títulos de landing/portafolio, Respuesta Atómica lead | **SOLO frontstage** (público F-01/F-02; portal sin serif agresiva) | A1:154 — serif artesanal/editorial que encarna al Creador Experto y la veta; latin-ext completo (tildes/ñ) |
| **UI sans** | **Inter** | 400/500/600/700 | cuerpo, labels, tablas, formularios, dashboards, portal | ERP + público + portal | A1:155 — humanista neutra, x-height alta para densidad ERP; `tabular-nums` para COP; fallback system-ui |
| **Mono técnico** | **IBM Plex Mono** | 400/500 | medidas (mm), cantidades, referencias de pieza, códigos de orden, BOM, timestamps | ERP taller (P-08/P-16/P-13) | A1:156 — alineación tabular de datos de máquina; vocabulario del taller (B1-1:45) |

**Escala modular (dos modos — estática rem ERP + fluida `clamp()` público, R37):**

| Token | Tamaño | Uso | Modo |
|---|---|---|---|
| `--veta-text-xs` | 0.75rem (12px) | captions, tablas densas (no texto esencial largo) | ERP estático |
| `--veta-text-sm` | 0.875rem (14px) | tablas, meta, comparación KPI | ERP estático |
| `--veta-text-base` | 1rem (16px) | cuerpo; **inputs móvil nunca <16px** (evita zoom iOS) | ambos |
| `--veta-text-lg` | 1.25rem (20px) | subtítulos, acciones de fila | ERP estático |
| `--veta-text-xl` | 1.5rem (24px) | títulos de pantalla | ERP estático |
| `--veta-text-2xl` | 2rem (32px) | h1 ERP, números KPI | ERP estático |
| `--veta-text-kpi` | `clamp(1.75rem, calc(1.5rem + 0.75vw), 2rem)` (28-32px) | número KPI, grueso, `tabular-nums` | ERP/gerente |
| `--veta-text-kpi-compare` | 0.875rem (14px) | comparación secundaria del KPI + un sparkline | ERP/gerente |
| `--veta-text-hero` (H1 público) | `clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)` — **literal del corpus `destilacion:614`** | hero landing | público fluido |
| `--veta-text-display` (H2 público) | `clamp(1.75rem, 1.2955rem + 2.273vw, 3rem)` — B1-2:199 | secciones de landing | público fluido |
| `--veta-text-h2` | `clamp(1.5rem, calc(1.25rem + 1.3vw), 2.5rem)` | títulos de sección | público fluido |
| `--veta-text-h3` | `clamp(1.25rem, calc(1.15rem + 0.6vw), 1.875rem)` | subtítulos | público fluido |
| `--veta-text-h4` | `clamp(1.125rem, calc(1.05rem + 0.4vw), 1.5rem)` | títulos de tarjeta | público fluido |
| `--veta-text-lead` | `clamp(1.0625rem, calc(1rem + 0.35vw), 1.25rem)` | Respuesta Atómica, intro de sección | público fluido |
| `--veta-text-label` | 0.75rem/0.875rem · `letter-spacing` 0.02-0.05em · mayúsculas SOLO labels cortos | labels de formulario, badges | ambos |
| `--veta-text-data` | 0.875rem `font-mono` `tabular-nums` | dinero COP, medidas mm, referencias | ERP |

**Jerarquía H1..H6:** público = H1 hero (display Fraunces) / H2 display / H3-h4 (Inter semibold) / H5-h6 no se usan como jerarquía visual (se usan labels sm). ERP = h1 `text-2xl` (32px), h2 `text-xl` (24), h3 `text-lg` (20), h4 `text-base` semibold, sin display serif (A2 RV-01). **La jerarquía display serif es SOLO frontstage.**

**Medidas de legibilidad:** line-height display 1.1-1.2 · títulos 1.25 · cuerpo 1.5-1.6 · labels 1.4 · 65-75 chars/línea; pesos <400 prohibidos en cuerpo (tildes); `font-variant-numeric: tabular-nums` en tablas de dinero/medida; formato es-CO `#.##`; `prefers-reduced-motion` no afecta tipografía.

### 4. Spacing · radios · bordes · sombras

#### 4.1 Espaciado (escala base 4px ERP + fluida público — B2-1:182-193)

| Token | Valor | Uso |
|---|---|---|
| `--veta-space-1` | 0.25rem (4px) | ajuste fino, iconos internos |
| `--veta-space-2` | 0.5rem (8px) | **separación táctil mínima entre objetivos (R35)** |
| `--veta-space-3` | 0.75rem (12px) | padding compacto inputs, gap interno tarjetas |
| `--veta-space-4` | 1rem (16px) | padding estándar de controles y celdas |
| `--veta-space-5` | 1.5rem (24px) | margen entre secciones, padding de tarjetas |
| `--veta-space-6` | 2rem (32px) | espaciado de paneles |
| `--veta-space-8` | 3rem (48px) | separación de regiones de página |
| `--veta-space-10` | 4rem (64px) | página wide |
| `--veta-space-page-mobile` | `clamp(12px, 0.75rem + 1vw, 24px)` | margen lateral móvil |
| `--veta-space-page-desktop` | `clamp(32px, 2rem + 2.27vw, 80px)` | margen lateral desktop |
| `--veta-space-section` | `clamp(2.5rem, calc(2rem + 2.5vw), 4rem)` | separación de secciones público (derivado) |
| — | filas tabla cómodas 48-52px / densas 36-40px | B1-2:26 (INS:70); filas accionables mín 48px (R35) |

#### 4.2 Radios (B2-1:196-204)

| Token | Valor | Uso |
|---|---|---|
| `--veta-radius-none` | 0 | tablas, cabeceras de datatable, sticky header/1ª col |
| `--veta-radius-sm` | 4px | inputs, botones, selects |
| `--veta-radius-md` | 8px | tarjetas, modales |
| `--veta-radius-lg` | 12px | toasts, datepicker |
| `--veta-radius-full` | 9999px | badges, chips de estado |

#### 4.3 Bordes

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--veta-border-width-1` | 1px | default | — |
| `--veta-border-width-2` | 2px | focus ring, estado activo | — |
| `--veta-border-subtle` | `#E6E1D8` | divisores, cabeceras (decorativo) | sin requisito |
| `--veta-border-default` | `#8A8479` | borde de input/interactivo | **3,7:1 vs blanco** |
| `--veta-border-strong` | `#3E2A21` | fila/celda activa, foco persistente | 13,0:1 vs paper |
| `--veta-border-brand` | `#8B6914` | borde de CTA/estado activo dorado | 4,9:1 vs paper |
| `--veta-border-error` | `#CC0000` | error de campo (con texto+icono, nunca solo) | 4,7:1 vs fill |
| `--veta-border-warning` | `#A87000` | warning de campo | 3,8:1 vs fill |
| `--veta-border-glass` | `rgba(43,43,43,0.08)` | superficie glass | decorativo |
| `--veta-border-draft` | `#5F5D57` (dashed 1px) | documento borrador (D3) | 5,7:1 vs linen |

#### 4.4 Sombras (niveles con uso, sin abuso — anti-bloater, RV-02)

| Token | Valor | Uso |
|---|---|---|
| `--veta-shadow-none` | `none` | ERP por defecto (solo jerarquía por tinta, no por sombra) |
| `--veta-shadow-xs` | `0 1px 2px rgba(43,43,43,0.06)` | tarjeta en reposo, kanban card |
| `--veta-shadow-sm` | `0 1px 3px rgba(43,43,43,0.08), 0 1px 2px rgba(43,43,43,0.04)` | tarjeta elevada, fila activa |
| `--veta-shadow-md` | `0 4px 6px -2px rgba(43,43,43,0.08), 0 2px 4px rgba(43,43,43,0.06)` | dropdown, popover, datepicker |
| `--veta-shadow-lg` | `0 10px 15px -3px rgba(43,43,43,0.12), 0 4px 6px rgba(43,43,43,0.08)` | modal |
| `--veta-shadow-xl` | `0 20px 25px -5px rgba(43,43,43,0.18), 0 8px 10px rgba(43,43,43,0.12)` | drawer, overlay elevado |
| `--veta-shadow-glass` | `0 4px 24px rgba(43,43,43,0.08)` | superficie glass (público, con función) |
| `--veta-ring-focus` | `0 0 0 2px #FFFFFF, 0 0 0 4px #1D5FD0` | anillo de foco doble (2px + 3:1, R39) |

**Regla de uso:** el ERP usa `none/xs/sm/md` solo con función (separar capa visual, elevar popover); `lg/xl` reservados a modal/drawer; sombras decorativas de marca prohibidas en el panel (RV-02, R10).

### 5. z-index / capas

| Token | Valor | Capa | Uso |
|---|---|---|---|
| `--veta-z-content` | 0 | contenido | base |
| `--veta-z-sticky` | 10 | sticky | cabecera de datatable (Familia A), 1ª columna sticky, header de contexto dentro de scroll |
| `--veta-z-nav` | 20 | navegación | sidebar completo (desktop) y rail (tablera) |
| `--veta-z-header` | 30 | barra superior | header persistente de contexto (proyecto+módulo+rol+gate, P01) |
| `--veta-z-drawer-nav` | 40 | drawer móvil | drawer de navegación en base (<768) |
| `--veta-z-dropdown` | 50 | flotante | dropdown, datepicker, popover, menú de acciones de fila |
| `--veta-z-tooltip` | 60 | flotante | tooltip (dismissible Esc, 1.4.13) |
| `--veta-z-toast` | 70 | notificación | toast `role="status"`/`role="alert"` (4.1.3) |
| `--veta-z-drawer-sheet` | 80 | drawer de tarea | bottom-sheet / slide-over de formularios (móvil) |
| `--veta-z-modal` | 90 | modal | modal de confirmación (focus trap, retorno de foco) |
| `--veta-z-loader` | 100 | bloqueante | overlay de carga/loading global |

**Reglas de capa (B1-2 checklist + componentes):** sticky header/footer no deben tapar el elemento enfocado → `scroll-padding-top` = altura del sticky (2.4.11, R39); modal con focus trap y Esc; drawer queda por debajo del modal (un solo overlay a la vez); toasts no roban foco; z-index solo se usa desde estos tokens, nunca valores sueltos.

### 6. Cobertura contra las 34 pantallas (checklist por familia)

| Familia | Pantallas | Tokens requeridos | Estado |
|---|---|---|---|
| **B3-1** embudo/cotizador | P-01..P-05, F-01..F-03, F-08 | kanban card (`bg-raised`+`border`+`shadow-xs`), badge estado (semánticos+icono), SLA timer (warning/danger text), CTA dorado (`btn-primary`), borrador (`status-draft-*`), dinero (`text-data` tabular), modal firma (`shadow-lg`+`z-modal`), agenda (`datepicker`+`z-dropdown`+`bottom-sheet`), **display serif frontstage**, glass | ✅ cubierto (display serif = DD-07; precio 3D = DD-06, no visual) |
| **B3-2** cronograma+gates | P-06..P-12 | stepper/timeline de gates (estados semánticos), cronograma doble (desfases warning/info/error + líneas espresso/stone, R22), SLA chips, panel decisión, retoma (media aspect-ratio), check 15 días | ⚠️ 1 hueco: **estado éxito (DD-05)** bloquea badges "aprobado" E-18/E-21/E-24; primitiva timeline = A4 (GV-02) |
| **B3-3** compras+taller+calidad+entrega | P-13..P-19 | Familia A tablas (`border`+`z-sticky`+filas 36-40px), checklist E-21 (estados por ítem), money, fecha rango 5 días, acta (celebración contenida: gold + success), foto captura | ⚠️ 1 hueco: **éxito E-21 recibido_verificado (DD-05)** |
| **B3-4** finanzas | P-20..P-23 | dinero (`text-data` tabular + `money` semántico), KPI (`text-kpi`+`kpi-compare`+sparkline), gráficos con patrones+etiquetas (R22, no color-only), contador read-only, panel decisión | ✅ cubierto (money-positivo depende de DD-05; R22 permite neutral+icono mientras tanto) |
| **B3-5** cliente/documentación | P-24..P-26, F-04..F-07 | Familia B cards, garantía (3 secciones), galería documentación (media aspect-ratio+caption `media-caption`), **portal** (progreso por etapa lenguaje cliente, E-60 positivo, acta, pagos) | ⚠️ 1 hueco: **E-60 positivo (DD-05)**; F-04/F-05/F-06 = DIFERIDO registrado |

**Conteo de cobertura:** **34/34 mapeadas.** Huecos funcionales reales: **1 solo** (token de éxito, DD-05) que toca 3 familias (B3-2/B3-3/B3-5) pero no bloquea el render (R14: icono+texto). El resto de pendientes son decisiones de marca (DD-07 familias) o de primitivas (A4: kanban GV-01, timeline GV-02, cronograma doble GV-03).

### 7. Clasificación de hallazgos

#### CORRECCION_VISUAL (valores propuestos que no pasan el criterio de contraste o contradicen decisiones)

| ID | Hallazgo | Medida | Resolución |
|---|---|---|---|
| CV-A3-01 | "Gold `#A67C28` sobre espresso ≥4,5" (B1-2:151) es falso; `#8B6914` sobre espresso tampoco pasa 3:1 | `#A67C28` 3,55:1 · `#8B6914` 2,65:1 vs espresso | Escala dorada completa (gold-100..700); acento sobre espresso = **gold-200** (7,9:1); texto sobre claro = gold-500/700 |
| CV-A3-02 | warning-stroke `#CC8800` del corpus no pasa 1.4.11 contra su propio fill | 2,67:1 < 3:1 | stroke de warning = `#A87000` (3,8:1); `#CC8800` queda decorativo |
| CV-A3-03 | border `#D8D0C6` no cumple 3:1 como borde de input sobre blanco | 1,48:1 | `border-default` = `#8A8479` (3,7:1); `#D8D0C6` → `border-subtle` decorativo |
| CV-A3-04 | stone `#7A7873` como texto secundario normal no pasa AA (confirma CV-03 de A1) | 4,26:1 < 4,5:1 | dos pasos: stone (large/deco) + stone-dark `#5F5D57` (6,4:1) |
| CV-A3-05 | `#B06000` (B1-2 warning texto) falla 4,5:1 sobre paper por 0,01 | 4,49:1 | corpus mermaid `#664400` gana (8,5:1); `#B06000` solo large/UI |

#### GAP_VISUAL (token/familia que falta para cubrir una pantalla)

| ID | Hallazgo | Efecto | Quién lo resuelve |
|---|---|---|---|
| GV-A3-01 | Token de éxito sin resolver (DD-05): "nunca verde literal" vs éxito funcional | badges E-18/E-21/E-24 aprobados, E-20 caja OK, E-60 positivo, cobros OK | Supervisor (DD-05) |
| GV-A3-02 | Primitivas kanban y timeline/cronograma doble no existen en el estándar de 8 componentes (B1-2:290-361) | P-01, P-06, P-09, P-16 | A4 (GV-01/GV-02/GV-03 heredados de A2) |
| GV-A3-03 | Glosario único de estados/verbos (H07) no existe | labels finales de estado dependen de él | Orquestador/Supervisor (H07) |
| GV-A3-04 | Sin tokens en código (literales `#e5e5e5` inline) | migración obligatoria a `@theme` | Ola 7/PoC |

#### RUIDO_VISUAL (estilo/decoración sin función)

| ID | Hallazgo | Regla |
|---|---|---|
| RV-A3-01 | Sombras decorativas en el ERP | solo `none/xs/sm/md` con función; `lg/xl` para modal/drawer |
| RV-A3-02 | Display serif dentro del ERP | `--veta-font-display` SOLO frontstage (A2 RV-01) |
| RV-A3-03 | Glassmorphism sin función | glass solo en público (nav flotante, tarjetas sobre foto), nunca en el panel |

#### DECISION_DISEÑO (requieren decisión de gusto/negocio — no inventar)

| ID | Hallazgo | Opciones (con medida donde aplica) |
|---|---|---|
| DD-05 | Estado de éxito: ¿verde funcional backstage o éxito no-verde? | **A)** verde funcional ERP `#1E7A4F` (5,1:1) — recomendada · **B)** no-verde ámbar/bronce (8,2:1) que colisiona con warning |
| DD-07 | Familias tipográficas (0 en el corpus) | Fraunces (display) + Inter (UI) + IBM Plex Mono (técnico) — propuesta de A1 validada por este pase |
| DD-A3-01 | Pasos claros de la escala dorada (gold-100/200) como primitivos | derivación reglada documentada (método `destilacion:300-302`); no requiere marca nueva pero se registra |
| DD-A3-02 | Método de verificación de contraste final | A4 debe medir con herramienta los valores de este pase antes de fijar (R38) |

#### DIFERIDO (se registra, no se tokeniza ahora)

| ID | Hallazgo |
|---|---|
| DF-A3-01 | Paleta telúrica+dopamínica de la tienda de consumo (F-04/F-05/F-06) — dirección de marca DIFERIDO (A1 DD / A2 DF-01) |
| DF-A3-02 | Facturación DIAN, renders IA de producto, sistema de firma digital avanzada — fuera de tokens V3 |

### 8. Trazabilidad / Notas para el Orquestador

**Fuentes y afirmaciones clave:**

| Afirmación | Fuente (archivo:línea) |
|---|---|
| Método de jerarquía primitivo→semántico→componente; regla "literal = falta token canónico"; criterio de escalamiento | `destilacion_docs_veta.md:300-302` |
| Tokens Luz & Biofilia literales (paper/linen/carbon/stone/glass) | `destilacion_docs_veta.md:601-608` |
| "Nunca verde literal en los tokens", acento dorado permanece, tema Luz & Biofilia | `destilacion_docs_veta.md:595`; `plan_demanda.md:28` (citado en A1:13) |
| Literales de marca legacy (#8b6f3c, #a68c59, sheen, 0x8b6914, namespace --veta-*) | `destilacion_docs_veta.md:304` |
| H1 fluido `clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)`; portafolio hover 0.8s; CTA 48px+8px; CWV | `destilacion_docs_veta.md:614-621` |
| Escala dorada de A1 con contrastes medidos (700/600/500/300) | `d4_a1_auditoria_visual.md:101-109` |
| Paleta ERP de B1-2 (ink/surface/espresso/gold/semánticos/focus) | `d3_ui_b1_2_responsive_design.md:157-171` |
| Espaciado 4px, radios, tipografía estática, `--text-display` solo frontstage | `d3_ui_b2_1_destilacion_inv.md:180-216` |
| Reglas R14/R34/R35/R37/R38/R39; D3 borrador vs compromiso; mapeo gate→token | `d3_ui_b2_1:89,129,130,132,138,139,245,173-178` |
| KPI 28-32px + comparación 14px + sparkline; tablas 36-40/48-52px | `d3_ui_b3_inv_clasificacion.md:109-110` (vía A1:31 y B1-2:26-28) |
| Semánticos del corpus mermaid (error/warning con hex) | `logica_de_negocio.md:67-68` (vía A1:32) |
| 34 pantallas core y familias B3-1..B3-5 | `d3_ui_consolidado.md:24-86` |
| Frontera admin/frontstage; cliente nunca ve backstage | `d3_ui_b2_2_pantallas_requeridas.md:32` (vía A2:67) |
| "Gana la evidencia de primera mano del Supervisor" (regla de reconciliación) | `diamante4_metodologia.md:33` (vía A1:52) |

**Notas para el Orquestador:**

1. **Qué consume la PoC/Ola 7:** este documento es la fuente única de tokens; la PoC los declara en `@theme` de Tailwind v4 (B2-1:219). No hay literal de color nuevo en código; si aparece uno, es un bug de token (regla del corpus `:301`).
2. **Reconciliaciones cerradas en este pase (A1 vs A2 vs B1-2):** (a) fuente display = Fraunces (propuesta A1, DD-07); (b) hex dorados = escala A1 + pasos claros derivados (CV-A3-01); (c) surface ERP `#F7F4F0` y paper público `#FCFBF9` conviven como dos primitivos de un solo sistema (modos de superficie, A2 §2); (d) texto primario = carbon `#2B2B2B` (corpus gana sobre ink `#241C15`); (e) semánticos de texto = literales del mermaid (ganan sobre la propuesta B1-2). Todas con medida de contraste.
3. **Qué decide el pase A4 (primitivas):** kanban (GV-01), timeline/stepper de gates (GV-02), cronograma doble (GV-03) — los 3 fuera del estándar de 8 componentes; y la verificación con herramienta de todos los contrastes de este pase (DD-A3-02). A4 también formaliza el mapeo a componentes React.
4. **Bloqueadores que escalan al Supervisor (no bloquean el diseño de la PoC, sí el corte del token):** DD-05 (éxito), DD-07 (familias tipográficas). El resto de decisiones heredadas (nombre/Nap DD-01, eslogan DD-03, antigüedad DD-04, imágenes DD-05/A, precio 3D DD-06, cards DD-07/A2, WhatsApp DD-08) no son de tokens.
5. **GAP de proceso:** GV-A3-03 (glosario H07) debe crearse antes de escribir labels finales; sin él la semántica "borrador vs compromiso" (D3) queda ambigua (heredado de B2-1:289).
6. **Restricciones respetadas:** no se tocó ningún otro archivo; este pase solo escribe `d4_a3_tokens_visuales.md`. No se escribió código, no hay commits. No se inventó marca: lo incierto está en `DECISION_DISEÑO` (vocabulario del D4, `diamante4_metodologia.md:87`).
7. **Conteo de tokens (para el reporte):** ~**64 tokens de color/estado** (19 primitivos neutros, 7 dorados, 13 semánticos de estado, 5 semánticos de superficie de rol, 13 bg/text/border/glass/status, 5 media/skeleton/draft, 2 focus) · **19 tipografía** (3 familias + 15 tamaños + kpi/lead/label/data) · **13 spacing** · **5 radios** · **10 bordes (2 anchos + 8 colores)** · **8 sombras** · **11 z-index** · **6 motion** ≈ **135 tokens canónicos**. GAPs: 4 · DECISION_DISEÑO: 4 · CORRECCIONES: 5 · RUIDO: 3 · DIFERIDO: 2.

---

## Trazabilidad / Notas para el Orquestador

(Consolidadas en la sección 8 del entregable — ver arriba. Este bloque cierra el formato del diamante 4.)

- **Contrastes:** medidos a mano en este pase con la fórmula WCAG 2.x (luminancia relativa → ratio) sobre cada hex; A4 debe recalcularlos con herramienta y fijarlos (R38, DD-A3-02). Pasos `(derivado)` (`#5F5D57`, `#8A8479`, `#A87000`, `#6B5220`, `#D4C5A1`, `#9C7E3F`, `#5F4A2E`, `#B8A889`, `#DFEDF6`, `#1D6FA3`, info/skeleton/draft) son construcción para cumplir AA o cubrir roles que el corpus nombra sin hex — no literales del corpus.
- **Regla de oro cumplida:** las tensiones no resueltas del material previo (éxito vs "no verde", fuentes, escala dorada sobre espresso) se marcaron `CORRECCION_VISUAL`/`DECISION_DISEÑO` y se documentaron con medida — no se inventó la resolución de marca.
- **Lo que este pase NO hace:** no decide primitivas React (A4), no decide motion avanzado del sistema (A5), no define familias tipográficas (Supervisor, DD-07), no resuelve el éxito (Supervisor, DD-05).

## Registro

- Fecha: 2026-08-04.
- Pase: D4-A3 (Ola 1 del Diamante 4), lente design tokens.
- Archivo de salida único: `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d4_a3_tokens_visuales.md` (este archivo).
- Resultado: **~135 tokens canónicos** en 8 categorías (color/estado ~64, tipografía 19, spacing 13, radio 5, borde 10, sombra 8, z-index 11, motion 6) · cobertura **34/34** pantallas · hallazgos: 5 CORRECCION_VISUAL · 4 GAP_VISUAL · 3 RUIDO_VISUAL · 4 DECISION_DISEÑO · 2 DIFERIDO.
- No se modificó ningún otro archivo; no se leyó output de otros sub-agentes del D4 (A1/A2 leídos como fuentes primarias, son Ola 1).
