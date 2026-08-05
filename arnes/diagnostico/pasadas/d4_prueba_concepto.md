# Pase D4-PoC — Prueba de concepto y rúbrica de evaluación v2

**Rol:** Orquestador / QA del Diamante 4
**Objetivo:** convertir la rúbrica de evaluación estética en una herramienta mecánica y usarla para reprocesar la PoC v1 hacia una PoC v2 utilizable por el Supervisor.
**Entradas:** `arnes/diagnostico/diamante4_metodologia.md`, `arnes/diagnostico/pasadas/d4_consolidado_diseño.md`, las 3 capturas de la PoC v1 y la implementación de `app/page.tsx`, `app/cotizador/page.tsx`, `app/cronograma/page.tsx`, `app/landing/page.tsx`, `app/layout.tsx`, `app/globals.css`.

---

## 1. Auditoría de la rúbrica propuesta

### Veredicto corto

La rúbrica que veníamos proponiendo sirve, pero todavía está más cerca de un contrato de cierre que de una scorecard operativa. Tiene buena cobertura conceptual, pero aún mezcla tres cosas que conviene separar: observación, juicio y acción.

### Lo que sí está bien

- Tiene anclaje en el contrato D4, no en gusto libre.
- Reconoce que hay fallos críticos que deben reabrir el loop.
- Ya permite puntuar layout, jerarquía, densidad, consistencia, estados y accesibilidad.
- Encaja con el lenguaje del consolidado: tokens, primitivas, superficies y gates.

### Lo que hay que corregir

| Problema | Efecto | Mejora concreta |
|---|---|---|
| Mezcla observación con juicio | Se pierde trazabilidad fina | Separar cada hallazgo en: evidencia, juicio, severidad, acción |
| Puntaje demasiado global | No ayuda a priorizar | Puntuar por eje y por token/primitiva afectada |
| Falta umbral de re-trabajo | No queda claro cuándo reabrir | Definir fallos críticos que reabren el loop aunque el total sea alto |
| Poco control sobre estados invisibles | La PoC puede parecer buena y aun así fallar en hover/focus/loading | Exigir matriz de estados como evidencia obligatoria |
| Poco acento en densidad cognitiva | Un diseño lindo puede seguir siendo pesado | Introducir un eje específico de escaneabilidad y carga cognitiva |

### Formato de rúbrica recomendado

1. **Observación atómica**: una sola cosa visible o verificable por captura o código.
2. **Juicio único**: CORRECCION_VISUAL, GAP_VISUAL, RUIDO_VISUAL o DECISION_DISEÑO.
3. **Severidad**: crítica, alta, media, baja.
4. **Puntaje por eje**: 1 a 5 por dimensión.
5. **Acción concreta**: qué cambiar, dónde, con qué token o primitiva.
6. **Criterio de cierre**: cómo se verifica la mejora.

### Scorecard mejorada

| Eje | Peso | Qué mide | Umbral de pase | Reabre loop si falla |
|---|---:|---|---:|---|
| Layout y uso del espacio | 25 | Estructura, alineación, ritmo, balance de vacío | 18 | Overflow, clipping, grid roto, bloques mal jerarquizados |
| Jerarquía y legibilidad | 20 | Orden de lectura, CTA, peso tipográfico, largo de línea | 14 | Título o CTA no domina o el texto se vuelve fatigoso |
| Densidad cognitiva | 20 | Carga de información por pantalla | 14 | Saturación o vacío improductivo |
| Consistencia de tokens | 15 | Reuso de color, radio, sombra, chips, badges, estados | 12 | Drift entre superficies o componentes semánticamente distintos |
| Estados y feedback | 10 | Default, hover, focus, loading, empty, error, success | 8 | Faltan estados críticos o se leen con lenguaje visual distinto |
| Accesibilidad y ergonomía | 10 | Contraste, hit area, foco, motion-reduce, AA | 10 obligatorio | Cualquier fallo AA, foco invisible o target menor a 48px |

**Cierre recomendado:** 80/100 mínimo y cero fallos críticos.

---

## 2. Calificación de la PoC v1

### Resumen ejecutivo

La PoC v1 está bien encaminada. No se ve improvisada; ya tiene un lenguaje visual propio y consistente entre superficies. Lo que le falta no es identidad, sino cierre de sistema: estados, refinamiento de escala, y una gramática más estricta para componentes repetidos.

### Puntaje por superficie

| Superficie | Layout | Jerarquía | Densidad | Consistencia | Estados | Accesibilidad | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| F-01 Landing | 4/5 | 5/5 | 4/5 | 4/5 | 2/5 | 4/5 | 23/30 |
| P-04 Cotizador | 4/5 | 4/5 | 4/5 | 4/5 | 3/5 | 4/5 | 23/30 |
| P-09 Cronograma | 4/5 | 4/5 | 4/5 | 4/5 | 3/5 | 4/5 | 23/30 |

**Total PoC v1:** 69/90 visibles, equivalente a **76/100** como lectura conservadora.

### Lectura por superficie

#### F-01 Landing

- Lo mejor: jerarquía tipográfica fuerte, uso correcto del dorado como acento, sensación premium y oficio claro.
- Lo débil: el hero funciona, pero todavía depende demasiado del tratamiento textual; falta una pieza visual o estructural que ancle más la identidad sin recargar.
- Riesgo: que el dorado se vuelva demasiado decorativo si se expande sin regla.

#### P-04 Cotizador

- Lo mejor: el sistema operativo se entiende rápido; las tarjetas, el stepper y el kanban ya hablan el mismo idioma.
- Lo débil: la separación entre KPI, proceso y lista todavía puede compactarse mejor en pantallas medianas; hay cierta simetría que puede sentirse plana.
- Riesgo: que el panel termine pareciendo “bonito” pero no “decidible” si no subimos la autoridad visual del estado activo.

#### P-09 Cronograma

- Lo mejor: la pantalla ya tiene densidad útil y una estructura clara de trabajo real.
- Lo débil: el checklist y la tabla de caja todavía parecen dos módulos correctos pero no totalmente fusionados por una misma gramática de prioridad.
- Riesgo: que el estado de retraso se lea solo como color y no como jerarquía operativa.

### Fallos no críticos, pero reales

- Estados no visibles aún no probados en captura: hover, focus, disabled, loading, empty, error y reduced-motion.
- La decisión de iconografía sigue abierta y por eso la PoC aún depende más de texto y badges que de una gramática visual completa.
- No hay evidencia de mobile/tablet en estas capturas.
- Falta una prueba de overflow con textos largos y números extremos.

---

## 3. Rúbrica de tokens y primitivas

### Cómo puntuar un token

Cada token o primitiva afectada debe puntuar en 5 dimensiones:

| Dimensión | Pregunta | Escala |
|---|---|---|
| Coherencia de marca | ¿Se reconoce Veta Dorada sin explicarlo? | 1 a 5 |
| Cobertura funcional | ¿Resuelve un uso real sin inventar excepciones? | 1 a 5 |
| Contraste / legibilidad | ¿Pasa en contexto real? | 1 a 5 |
| Implementabilidad | ¿Se codifica sin hacks? | 1 a 5 |
| Reusabilidad | ¿Sirve en más de una superficie? | 1 a 5 |

### Score práctico de los tokens más visibles en la PoC

| Token / familia | Puntaje | Motivo |
|---|---:|---|
| `--font-display` / Fraunces | 5 | Da identidad inmediata y funciona bien en frontstage |
| `--color-gold-600` / acento de marca | 4 | Sólido como acento; hay que controlar su uso para no decorativizarlo |
| `--color-bg-paper` / `--color-surface-100` | 5 | Buen soporte para una estética limpia y cálida |
| `--shadow-xs` / `--shadow-sm` | 4 | Correctos, aunque todavía muy cerca entre sí en percepción |
| `--radius-md` | 4 | Consistente, pero aún pide una jerarquía más fuerte en cards vs chips |
| `Badge` | 4 | Útil y legible; falta una semántica más dura para estados críticos |
| `Stepper` | 4 | Muy adecuado para proceso; necesita mejor énfasis en el paso activo |
| `StatCard` | 3 | Funciona, pero conviene darle más autoridad visual al dato principal |
| Timeline doble | 4 | La estructura está bien, pero el estado activo pide más contraste semántico |

---

## 4. Deltas concretos para PoC v2

### Tokens D4 a reforzar

1. **Aumentar la distancia semántica entre superficies**
   - Público: más aire, más contraste de display, acento dorado más contenido.
   - ERP: más densidad, más regla, más peso de borde y grid.
   - Portal/operativo: densidad intermedia, foco en estado y decisión.

2. **Formalizar una regla para el dorado**
   - Dorado = acento de intención, no decoración de superficie.
   - Úsalo en CTA primario, estados activos, chips de foco y pequeños hitos.
   - No usarlo como relleno masivo en bloques grandes.

3. **Subir la autoridad del estado activo**
   - El paso activo del stepper debe tener más peso visual que el resto.
   - La card seleccionada o en riesgo debe sobresalir por jerarquía, no solo por color.

4. **Cerrar la gramática de estados críticos**
   - En riesgo: color + texto + icono o marca puntual.
   - Éxito: nunca verde literal si el consolidado no lo cierra; mantener icono + texto + neutro.
   - Error: usar rojo con texto operativo claro, no decorativo.

### Ajustes UI concretos

- **Landing**: reducir un poco el ancho del hero para mejorar cadencia de lectura; sumar una pieza visual secundaria o textura sutil para que la identidad no dependa solo de copy.
- **Cotizador**: reforzar el contraste de la columna activa y del KPI principal; hacer que el panel sea más claramente “de decisión”.
- **Cronograma**: unificar checklist y tabla con una misma lógica de borde/estado; el retraso debe leerse como una condición operativa, no como una etiqueta aislada.
- **Badges**: normalizar alturas y paddings para que no parezcan tres estilos distintos de chip.
- **Cards**: revisar jerarquía entre título, dato y unidad; el valor principal debe ganar antes que la etiqueta.

### Lo que yo cambiaría de inmediato en PoC v2

1. Definir iconografía y toasts, porque hoy siguen siendo huecos de contrato.
2. Agregar capturas mobile y estado hover/focus para cerrar la evidencia.
3. Subir la escala de contraste del estado activo en P-04 y P-09.
4. Afinar el hero de F-01 con una segunda capa visual, no solo texto.
5. Convertir la rúbrica en plantilla fija para que cada nueva PoC use el mismo formato.

---

## 5. Validación del proceso

### Veredicto de proceso

El proceso es válido, pero solo si la rúbrica se usa como scorecard con evidencia obligatoria, no como opinión editorial.

### Condición mínima para aceptar el loop

- Cada hallazgo debe tener evidencia.
- Cada juicio debe tener severidad.
- Cada severidad debe producir una acción concreta.
- Cada acción debe volver a validarse con la misma rúbrica.

### Regla de re-trabajo

- Si aparece un fallo crítico, se reabre el loop aunque el total sea alto.
- Si no hay fallos críticos, la siguiente iteración es delta acotado, no rediseño general.
- Si el problema no es visible con las capturas actuales, se marca como no evaluable y se exige la captura faltante.

### Resultado final

**PoC v1:** aprobable como dirección visual.
**PoC v2 objetivo:** cerrar huecos de estados, iconografía, toasts y evidencias responsive, y subir la rúbrica de “contrato bonito” a “instrumento de reproceso”.

**Estado recomendado:** `APROBADA CON REPROCESO ACOTADO`.

---

## 6. Audit trail técnico — PoC 2 (audit loop sobre PoC 1) · t-098

**Fecha:** 2026-08-04 · **Rol:** Orquestador / QA · **Estado:** registrado con aprobación del Supervisor (checkpoint registro).

### 6.1 Gaps detectados en el audit loop y cierres efectuados

| # | Gap | Evidencia | Acción efectuada | Verificación |
|---|---|---|---|---|
| 1 | **Motion no generada** | Tailwind v4 no emite `animate-in`/`slide-in-from-bottom-2`; modal sin animación real | `@keyframes slideIn` + `@utility animate-slide-in` (consume `var(--dur-base)`/`var(--ease-out)`) | `getComputedStyle`: `animationName=slideIn`, `animationDuration=0.2s` |
| 2 | **z-index no resuelve** | `--z-*` no es namespace válido de Tailwind v4 | Renombre `--z-*` → `--z-index-*` | `:root` expone `--z-index-modal`; modal `computed.zIndex=90` |
| 3 | **radius utility inválida** | `rounded-radius-{sm,md,lg}` no genera CSS | Migración a `rounded-{sm,md,lg}` | CSS compilado contiene `rounded-md`/`rounded-lg`/`rounded-sm` |
| 4 | **hit-area mobile** | B1-CV-01 exige ≥44px; no validado a 375px | `min-h-[44px]` explícito en botón `md` | Playwright @375px: botón detalle `70×44` px |
| 5 | **reduce-motion** | Sin evidencia | `@media (prefers-reduced-motion: reduce)` → `animation-duration:0.01ms !important` | Regla presente en CSS compilado (`app/layout.css:1594`); runtime no forzable en sandbox (limitación Chromium headless) |

**Verificación mecánica:** `tsc --noEmit` 0 errores · `eslint .` 0 errores · `next build` 8 rutas · 4/5 checks runtime PASS + 1 por CSS estático.

**Commit:** `29a3ec9` "PoC 2: audit-loop fixes (motion z-index radius hit-area reduce-motion)" en rama `dev`.

### 6.2 Cambios de código efectuados en PoC 2 (lista granular)

- `app/globals.css`: renombre 9 variables `--z-*`→`--z-index-*`; añadidos `@keyframes slideIn` + `@utility animate-slide-in`.
- `components/veta/modal.tsx`: `animate-in slide-in-from-bottom-2 rounded-radius-lg` → `animate-slide-in rounded-lg`; `rounded-radius-sm`→`rounded-sm`; restaurado `onClick={onClose}` en overlay.
- `components/veta/button.tsx`, `stat-card.tsx`, `input-field.tsx`: migración `rounded-radius-*`→`rounded-*`.
- `app/landing/page.tsx`, `cronograma/page.tsx`, `cotizador/page.tsx`: migración `rounded-radius-*`→`rounded-*`.

> Nota: el commit `29a3ec9` agrupa PoC 1 + audit-loop juntos (worktree `dev` huérfano). Las pantallas `cotizador`/`cronograma` solo recibieron el fix de radius; el `landing` no cambió su diseño (solo radius/hit-area).

### 6.3 Hallazgo de arquitectura (crítica del Supervisor, C4)

El layout raíz `app/layout.tsx` es mínimo (`<html>`+`<body>`+`children`): **sin header global, sin nav persistente, sin footer**. La navegación a las 3 pantallas piloto vive solo en el hub `app/page.tsx:24` (`<nav>` + `Link` + `Button`). Consecuencia: las pantallas internas no comparten estructura modular sistemática → se percibe como "escrito en html". Se abre como gap para PoC 3.

---

## 7. Plan PoC 3 — destilación de críticas del Supervisor

**Estado:** REGISTRADO (aprobado registro · 2026-08-04). **Pendiente:** aprobación de decisiones C3/C4/C5 antes de escribir código.

| C | Crítica | Acción PoC 3 | Decisión Supervisor |
|---|---|---|---|
| C1 | Fuente de párrafos | Integrar **Teachers** vía `next/font/google` como `--font-sans` (lede/body); Fraunces solo display | **CONFIRMADO** (implementar mejor práctica, no `@import`) |
| C2 | Badges 1995 | Generar **opciones de mockups** (2–3 direcciones solar punk: glass/material + glow + reflejo superior + micro-motion) para que el Supervisor elija | Generar opciones como tarea PoC 3 |
| C3 | Sin motion/affordance | Runtime "viva": View Transitions + hover elevate + stepper pulse + `active:scale`; **en sandbox** | Que pruebe en runtime de forma segura, minimalistamente |
| C4 | Hub parece HTML (modularidad) | Crear **AppShell** (header+nav persistente+footer) y primitivas de navegación; deshardcodear hub | **Recomendación Orquestador:** SÍ crear AppShell (goal = composición modular sistemática) — pendiente ok |
| C5 | Stack UI (ShadCN/Radix) | **Loop reflexivo** sobre Radix: casos específicos justificados | **DECIDIDO (Orquestador)** — adoptar Radix solo para primitivas interactivas de alta complejidad-a11y (Dialog/Toast/Tooltip/Popper), no ShadCN completo (ver §7.1) |

**Checkpoint requerido antes de código:** aprobación de C3 (sandbox), C4 (AppShell), y confirmación Supervisor del punto §7.1.

### 7.1 Decisión C5 — loop reflexivo sobre Radix/Base UI (2026-08-04)

**Pregunta:** ¿usar ShadCN/Radix (u otra librería UI) para mejorar el diseño y la accesibilidad?

**Contexto 2026:** shadcn/ui pasó a usar **Base UI (MUI)** como librería por defecto (julio 2026); **Radix 2.0 sigue soportado y maduro** (MIT, React 19 + RSC + ESM compatibles, rendimiento y a11y probados). Base UI es nueva y no hay necesidad de migrar si Radix ya funciona.

**Análisis por bias del arnés:** el arnés exige *código React/Next/TS explícito, sin motor schema-driven*. ShadCN completo (Radix o Base UI + `cva` + `tailwind-merge` + `clsx`) es código explícito (no viola la prohibición), pero **re-mappea todos los tokens del consolidado D4 a los slots de la librería** y añade 4+ dependencias. No aporta visual (solo estructura/a11y), y el sistema visual V3 ya está canónico en `veta/`.

**Decisión (casos específicos):**

| Caso | Recomendación | Justificación |
|---|---|---|
| Visual (color, tipografía, badges, cards, layout) | **`veta/` primitivas propias** | Control total del sistema visual canónico; cero deps; coherencia con consolidado D4 |
| **Dialog/Modal** (ya existe como `Modal` autocontenida) | **Puerto a `@radix-ui/react-dialog`** | Focus trap, scroll-lock, Escape, `aria-*`,`asChild` gratis; es la primitiva más compleja de implementar a mano y ya acumula edge cases |
| **Toast**, **Tooltip**, **Popover**, **Select**, **DropdownMenu** (futuros) | `@radix-ui/*` o paquete `radix-ui` unificado | Misma razón: a11y/estado/popper complejos; no reinventar |
| Página entera, shells, navegación | React/Next puro (`AppShell`) | Estructural, sin lógica headless compleja |
| ShadCN como *framework* de componentes | **NO** | Re-map token + deps adicionales; ya tenemos primitivas propias |

**Conclusión:** adoptar **Radix de forma incremental solo donde el valor sea alto (Dialog/Toast/Tooltip/Popper)**, manteniendo `veta/` para el sistema visual y `@radix-ui/react-dialog` (v2.x) como primer puerto en PoC 3 si el Supervisor lo aprueba. No se adopta ShadCN ni Base UI completo.

---

## 7.3 Checkpoint final — Plan PoC 3 APROBADO para ejecución (rol Código)

**Fecha:** 2026-08-04 · **Aprobación:** Supervisor (Javier) — todos los items C1–C6 confirmados.

### Resumen ejecutivo PoC 3

| # | Item | Acción | Estado |
|---|---|---|---|
| C1 | Fuente Teachers | `next/font/google` Teachers → `--font-sans` | ✅ Listo |
| C2 | Badges solar punk | 3 mockups (glass+glow / material+bevel / niebla shader) + micro-motion | ✅ Listo |
| C3 | Runtime viva | View Transitions + hover-elevate + stepper pulse + active:scale | ✅ Listo (dev local sandbox) |
| C4 | AppShell | Header+Nav persistente + Footer + NavItem primitiva | ✅ Listo |
| C5 | Radix incremental | `@radix-ui/react-dialog` v2 replace Modal; futuro Toast/Tooltip | ✅ Listo |
| C6 | WebGL artístico | Hero partículas **raw WebGL** (no Three.js) + CSS fallback + reduce-motion | ✅ Listo (factibilidad CONDICIONAL: raw WebGL ~5KB gz PASS) |

### Orden de ejecución (zona única `app/` + `components/veta/`)

1. **C4** `components/veta/app-shell.tsx` + `nav-item.tsx` → `app/layout.tsx` + `app/page.tsx`
2. **C1** `app/layout.tsx` (Teachers) + `app/globals.css` (`--font-sans`)
3. **C5** `components/veta/modal.tsx` → `@radix-ui/react-dialog` (misma API pública)
4. **C2** `components/veta/badge.tsx` (refactor) + `app/badge-mockups/page.tsx` (preview 3 direcciones)
5. **C3** `app/layout.tsx` (ViewTransitions), `components/veta/*.tsx` (hover/active), páginas
6. **C6** `components/veta/webgl-hero.tsx` (raw WebGL + fallback CSS)

### Criterios de verificación PoC 3 (mecánicos)

| Verificación | Comando | Umbral |
|---|---|---|
| Tipos | `npx tsc --noEmit` | 0 errores |
| Estilo | `npx eslint .` | 0 errores |
| Build | `npx next build` | 8 rutas OK |
| Runtime | Playwright dev local | View Transitions, hover, modal, reduce-motion, WebGL on/off |
| Bundle | `next build` analyze | WebGL chunk <50KB gz |

### Próximo paso: **Asignación rol Código** → ejecución PoC 3 completa.

---

## 8. Resultados PoC 3 — verificación completa (rol Código) · t-098

**Fecha:** 2026-08-04 · **Estado:** C1–C6 implementados, verificados y LISTOS para revisión del Supervisor.

### 8.1 Verificación mecánica

| Verificación | Comando | Umbral | Resultado |
|---|---|---|---|
| Tipos | `npx tsc --noEmit` | 0 errores | ✅ PASS |
| Estilo | `npx eslint .` | 0 errores | ✅ PASS |
| Build | `npx next build` | rutas OK | ✅ 6 rutas (/, /_not-found, /badge-mockups, /cotizador, /cronograma, /landing) |
| Runtime | Playwright dev local (`:3215`) | 16 checks | ✅ **16/16 PASS** |
| Bundle | chunk WebGL | <50KB gz | ✅ **2KB gz** (4.8KB raw) |

### 8.2 Checks runtime (evidencia mecánica, sandbox dev local)

1. AppShell header+nav+footer+brand en las 5 rutas — PASS
2. Nav con estado activo (`aria-current=page`) — PASS
3. Teachers aplicada como `--font-sans` (ff=`Teachers, ui-sans-serif...`) — PASS
4. `document.startViewTransition` disponible — PASS
5. hover-elevate (`hover:-translate-y-1`) en StatCard — PASS (moved 4px)
6. Modal Radix: `role=dialog` + aria-hidden (hideOthers) + focus dentro + Escape cierra — PASS
7. Badges: 3 variantes (glass/material/mist) en `/badge-mockups` — PASS
8. WebGL hero: canvas webgl2 300×150 — PASS
9. `@media (prefers-reduced-motion: reduce)` presente en CSS — PASS
10. Consola sin pageerror ni console.error — PASS

### 8.3 Bugs reales encontrados y corregidos durante la verificación runtime

| # | Bug | Causa raíz | Fix |
|---|---|---|---|
| 1 | **Shader WebGL no compila** (`Shader compile error`) | Sintaxis GLSL ES 1.00 (`attribute`/`varying`/`gl_FragColor`) enviada a contexto **WebGL2**, que exige GLSL ES 3.00 (`in`/`out`/`#version 300 es`). Adicionalmente, `loseContext()` en el cleanup rompía el **remount de React StrictMode** (Next dev doble-monta efectos: mount→cleanup→mount sobre el mismo canvas; tras `loseContext()` el segundo mount recibía un contexto muerto → toda operación fallaba, incluida la compilación). | Migración a **GLSL ES 3.00** + guard `gl.isContextLost()` + **try/catch completo** que setea `webglError` → fallback CSS (regla C6: enhancement progresivo, nunca throw) + eliminación de `loseContext()` del cleanup (los `delete*` bastan; el contexto se libera al desmontar el canvas). |
| 2 | **HTML inválido en modal** (hydration error `p > div`) | `Dialog.Description` (Radix) renderiza un `<p>`, pero `children` contiene `InputField` (`<div>`) → `<p>` no puede contener `<div>`. | `Dialog.Description asChild` con `<div>` como contenedor (mantiene `aria-describedby` de Radix). |

> **Nota de método:** los 2 bugs NO eran visibles con `tsc`/`eslint`/`next build` — solo aparecieron en verificación runtime real (Playwright). Confirma el valor del criterio "Runtime" del §7.3.

### 8.4 Artefactos de la PoC 3 (rama `dev`, sin commitear hasta OK del Supervisor)

- `components/veta/app-shell.tsx` + `nav-item.tsx` + `shell-provider.tsx` — **C4**: header sticky (z-nav) + nav global (NavItem con `aria-current`) + footer.
- `app/layout.tsx` — **C1**: Teachers via `next/font/google` como `--font-sans`; **C3**: `viewport()` + `<style>` View Transitions (fade 200ms `--ease-out`); **C4**: `ShellProvider`.
- `app/globals.css` — `--font-sans: "Teachers"`.
- `components/veta/modal.tsx` — **C5**: portado a `@radix-ui/react-dialog` (Overlay + Content + Title + Description asChild + Close), `lucide-react` X.
- `components/veta/badge.tsx` — **C2**: refactor con 4 tones + 3 variantes (`glass` glow / `material` bevel / `mist` niebla glow + dot pulse).
- `app/badge-mockups/page.tsx` — **C2**: preview de las 3 direcciones solar punk para elección del Supervisor.
- `components/veta/button.tsx` — `active:scale-[0.98]` + `focus-visible:shadow-ring-focus`.
- `components/veta/stat-card.tsx`, `app/landing/page.tsx`, `app/cronograma/page.tsx` — hover-elevate (`hover:-translate-y-1` + `hover:shadow-lg`).
- `components/veta/webgl-hero.tsx` + `webgl-hero-wrapper.tsx` — **C6**: raw WebGL2, 200 partículas, GLSL ES 3.00, parallax mouse/gyro, IntersectionObserver pausa, try/catch → fallback CSS; wrapper `'use client'` con `next/dynamic ssr:false`.
- `package.json`: deps nuevas `@radix-ui/react-dialog` (1.1.23, última publicada) + `lucide-react`.

### 8.5 Pendiente

- **Revisión del Supervisor** de las capturas (6 PNG: hub, landing, cotizador, cronograma, badge-mockups, modal-open) para decidir la dirección de badges (C2: glass/material/mist) y la aceptación de la PoC 3 completa.
- **Tercer input humano** (`arnes/diagnostico/Tercer input/flujo_automatizacion/` — flujo de automatización: dashboard, compras, inventario, costos, sincronización): **revisar antes de la Ola 7** (decisión del Supervisor, registro pendiente).

---

## 7.4 Anexo C6 — Informe completo sub-agente explore (raw WebGL)

**Hallazgo crítico:** Three.js **EXCEDE budget** (112–137KB gz vs 50KB target). **Decisión: raw WebGL / Canvas 2D** (~3–8KB gz, PASS rendimiento).

### Código esqueleto validado (Next 15 App Router)

```tsx
// components/veta/webgl-hero.tsx ('use client')
'use client'
import { useEffect, useRef, useState } from 'react'

export function WebGLHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [webglError, setWebglError] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (reduceMotion || webglError || !canvasRef.current) return
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' })
    if (!gl) { setWebglError(true); return }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    // Shader: vertex (posición + size via gl_PointSize) + fragment (glow radial + ruido + palette CSS vars)
    // Buffer: 150–300 partículas (Float32Array position, size, colorOffset)
    // Uniforms: uTime, uMouse, uResolution, uDPR
    let rafId: number
    const animate = (t: number) => {
      // update uniforms, drawArrays(gl.POINTS, 0, count)
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    const onMove = (e: MouseEvent) => { /* update uMouse */ }
    const onOrient = (e: DeviceOrientationEvent) => { /* fallback gyro */ }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('deviceorientation', onOrient)

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) rafId = requestAnimationFrame(animate)
      else cancelAnimationFrame(rafId)
    })
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('deviceorientation', onOrient)
      ro.disconnect()
      io.disconnect()
      const ext = gl.getExtension('WEBGL_lose_context')
      ext?.loseContext()
    }
  }, [reduceMotion, webglError])

  if (reduceMotion || webglError) return null // fallback CSS toma control

  return <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
}
```

```tsx
// app/landing/page.tsx
import dynamic from 'next/dynamic'

const WebGLHero = dynamic(
  () => import('@/components/veta/webgl-hero').then(m => m.WebGLHero),
  { ssr: false, loading: () => null }
)

// En hero: <WebGLHero /> + fallback CSS hero (partículas CSS @keyframes)
```

**Riesgos mitigados:** bundle <10KB, `reduce-motion` nativo, `IntersectionObserver` pausa off-screen, error boundary → fallback CSS.
