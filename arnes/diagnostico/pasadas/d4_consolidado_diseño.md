# Pase D4-CONSOLIDADO — sistema visual canónico de la V3 (orquestador)

**Rol:** Orquestador del Diamante 4 (t-097, D4-CONSOLIDADO "consolidado de diseño").
**Qué es:** el **contrato de salida del D4** que la PoC y la Ola 7 consumen. Aplica las **5 condiciones de formalización** del auditor B1 (veredicto APROBADO, `d4_b1_auditor_diseño.md:59`) y normaliza la gobernanza del sistema visual. **No rediseña nada:** hereda las decisiones de A1-A5 y del B1; solo formaliza, corrige conteos y declara el mapa de consumo.
**Fuentes leídas (todas completas):** `d4_b1_auditor_diseño.md` (veredicto + 5 condiciones + 15 hallazgos), `d4_a1_auditoria_visual.md`, `d4_a2_concepto_superficies.md`, `d4_a3_tokens_visuales.md`, `d4_a4_primitivas_ui.md`, `d4_a5_motion_efectos.md`, `diamante4_metodologia.md`.
**Regla de trazabilidad:** `archivo:línea` en toda afirmación. Este pase solo escribe su archivo de salida.

---

## Veredicto de entrada (B1, `d4_b1:291`)

**APROBADO** (6/6 goals) con **5 condiciones de consolidación** — todas de proceso, ninguna de marca:

| # | Condición (B1) | Dónde se resuelve en este consolidado |
|---|---|---|
| 1 | Colisión de numeración DECISION_DISEÑO entre A2 y A1/A3/A4 (DD-05..08) — `d4_b1:82` | §1 — Registro canónico CC-DD-01..25 + tabla de equivalencias |
| 2 | Tokens de motion contados pero NO formalizados en A3 (`--dur-*`/`--ease-*`) — `d4_b1:234` | §3.1 — tokens de motion formales |
| 3 | Tokens consumidos por A4 sin fila formal en A3 (`--veta-color-brand`, `--veta-btn-*`, `--veta-font-*`) — `d4_b1:235` | §3.2 — tokens de componente promovidos |
| 4 | Botón `sm` 32px contradice R35 ≥48px — `d4_b1:233` | §2 — corrección B1-CV-01 |
| 5 | Conteo de tokens de A3 inexacto (16 vs 19 neutros; 12 vs 13 semánticos) — `d4_b1:241` | §3.4 — conteo canónico |

Además se corrigen los reportes menores del B1 (RUIDO-02/03/04) y se anexan los 5 tokens derivados que la PoC debe declarar (B1-GAP-05).

---

## §1 Registro canónico de DECISION_DISEÑO (normaliza B1-RUIDO-01)

Un solo idioma para todo el D4 y la Ola 7. Prefijo **`CC-DD-XX`**. Todas las decisiones de los 6 pases se re-mapean aquí; ninguna se pierde.

| CC-DD | Tema | A1 | A2 | A3 | A4 | A5 | B1 | Bloquea corte | Bloquea PoC |
|---|---|---|---|---|---|---|---|---|---|
| CC-DD-01 | Nombre de marca / NAP | `DD-08` | `DD-01` | — | — | — | — | **SÍ** (frontstage) | No |
| CC-DD-02 | Eslogan | `DD-01` | `DD-03` | — | — | — | — | **SÍ** (copy F-01) | No |
| CC-DD-03 | Audiencia/posicionamiento | `DD-02` | — | — | — | — | — | **SÍ** (tono público) | No |
| CC-DD-04 | Tagline / ángulo fábrica-autor | `DD-03` | — | — | — | — | — | **SÍ** (hero F-01) | No |
| CC-DD-05 | Peso telúrico en la paleta | `DD-04` | — | — | — | — | — | No | No |
| CC-DD-06 | Antigüedad de señales de confianza | — | `DD-04` | — | — | — | — | **SÍ** (badges/footer) | No |
| **CC-DD-07** | **Token de éxito** ("nunca verde literal" vs éxito funcional) | `DD-05` | — | `DD-05` | `DD-A4-01` | transiciones `success` | `B1-DD-04` | **SÍ — valor del token** (toca 5 primitivas) | No — R14 icono+texto+neutral |
| **CC-DD-08** | **Familias tipográficas** | `DD-07` | — | `DD-07` | `DD-A4-02` | — | `B1-DD-05` | **SÍ** (marca del corte) | No — `next/font` igual |
| CC-DD-09 | Estrategia de imágenes (I-016) | `DD-06` | `DD-05` | nota `:382` | — | — | — | **SÍ** (dirección de arte) | No |
| CC-DD-10 | Renombre del Perfil de Empresa | `DD-08` | — | — | — | — | — | No (post-corte, con medición) | No |
| CC-DD-11 | Precio del diseño 3D | — | `DD-06` | `DD-06` | — | — | — | **SÍ** (F-08 copy) | No |
| CC-DD-12 | Card collapse Familia B (D6/H05) | — | `DD-07` | — | `DD-A4-03` | — | — | No | No |
| CC-DD-13 | Peso visual CTA WhatsApp | — | `DD-08` | `DD-08` | — | — | — | **SÍ** (F-01) | No |
| CC-DD-14 | Hex exactos + fuente display | — | `DD-02` | **resuelto en A3** (`:100-195`) | — | — | — | resuelto | resuelto |
| **CC-DD-15** | **Librería de iconos** (hueco del contrato) | — | — | — | — | — | `B1-DD-01` | **SÍ** | **SÍ** (badges/gates) |
| **CC-DD-16** | **sonner** (dependencia de toasts) | — | — | — | — | cita `:135,205` | `B1-DD-02` | **SÍ** si el stack v2 no lo tenía | **SÍ** |
| CC-DD-17 | Implementación de sparkline/gráficos (R22) | — | — | — | `DD-A4-10` (trazo) | — | `B1-DD-03` | No (SVG inline viable) | No |
| CC-DD-18 | Celebración E-26 / cierre de venta | — | — | — | `DD-A4-06` | `DM-01` | — | **SÍ** (tono F-07/P-19) | No |
| CC-DD-19 | View Transitions API (rutas ERP) | — | — | — | `DD-A4-08` | `DM-02` | — | No | **SÍ** (decide PoC) |
| CC-DD-20 | Nudge CTA WhatsApp (una vez) | — | — | — | `DD-A4-07` | `DM-03` | — | **SÍ** (sobriedad F-01) | No |
| CC-DD-21 | Reflow cronograma 400ms | — | — | — | `DD-A4-05` | `DM-04` | — | No (default aplicable) | No |
| CC-DD-22 | Pulso SLA "en riesgo" | — | — | — | `DD-A4-04` | `DM-05` | — | **SÍ** (P-01/P-10) | No |
| CC-DD-23 | Radio inputs/altura CTA en público | — | — | — | `DD-A4-09` | — | — | No | No |
| CC-DD-24 | Verificación de contraste con herramienta | — | — | `DD-A3-02` | — | — | confirmado `:188` | No (fija gold-500 en PoC) | No |
| CC-DD-25 | Pasos claros de la escala dorada (gold-100/200) | — | — | `DD-A3-01` | — | — | — | No (derivación reglada) | No |

**Regla de uso:** en adelante, todo hallazgo/contrato de la Ola 7 cita `CC-DD-XX` (no los IDs de los pases). La PoC solo necesita resolver **CC-DD-15, CC-DD-16 y CC-DD-19**; el resto son defaults razonados o pendientes del Supervisor (ver §8).

---

## §2 Correcciones aplicadas del B1 (formales, no de marca)

| ID B1 | Corrección | Resolución canónica | Referencia |
|---|---|---|---|
| **B1-CV-01** | Botón `sm` 32px contradice R35 ≥48px | **Se excluye `sm` (32px) como tamaño de botón interactivo estándar.** La variante mínima interactiva es `md` 40px con **hit area expandida a ≥48px** (padding externo transparente/border-box). `sm` queda reservado a controles **no interactivos** (chips de filtro compactos, label con badge) donde R35 no aplica. Cualquier control a 32px con acción = bug de diseño. | `d4_a4:110` → este §2 |
| **B1-RUIDO-02** | A1 dice "27 vs 28 principios" | Se corrige: el corpus tiene **28 principios** (`d3_ui_b1_1`). | `d4_a1:30` |
| **B1-RUIDO-03** | Conteo de tokens A3 §7 no cuadra con filas | Neutros = **16** (no 19) · semánticos de estado = **12** (no 13). Conteo canónico completo en §3.4. | `d4_a3:385` |
| **B1-RUIDO-04** | Ratios mal etiquetados | Tooltip bg charcoal-800 / blanco = **14,2:1** (no 13,7) · text-heading charcoal-900 / blanco = **16,8:1** (no 14,2). Ambos pasan AA; es etiquetado, no valor. | `d4_a4:156`, `d4_a3:170` |

**Nota de contraste vigente (B1 §4, `d4_b1:188`):** gold-500 `#8B6F3C` = 4,58:1 vs paper (margen AA de 0,08). La PoC lo confirma con herramienta (CC-DD-24) antes de cortar tokens; gold-300/400 "nunca texto normal sobre claro" queda reglado en `d4_a3:133`.

---

## §3 Registro canónico de tokens (fuente única para PoC/Ola 7)

### 3.1 Tokens de motion formales (cierra B1-GAP-01, `d4_b1:234`)

Promovidos de A5 §2 (`d4_a5:90-107`) a fila formal de token. **La PoC los declara en `@theme` de Tailwind v4 como `--dur-*` y `--ease-*`.**

| Token | Valor | Uso |
|---|---|---|
| `--veta-dur-instant` | 0ms | reduced-motion; confirmaciones de estado; foco visible |
| `--veta-dur-fast` | 100ms | hover de controles, press, fila de tabla, anillo de foco |
| `--veta-dur-quick` | 150ms | badges, menús, dropdown, ruta SPA, toasts salida |
| `--veta-dur-base` | 200ms | modales entrada, toasts entrada, panel decisión, DnD snap |
| `--veta-dur-slow` | 300ms | drawer/sidebar, hero público |
| `--veta-dur-soft` | 400ms | highlight de gate, reflow cronograma, línea de progreso |
| `--veta-dur-photo` | 800ms | **única excepción de marca**: hover `scale-103` portafolio (`destilacion:629`) |
| `--veta-ease-out` | `cubic-bezier(0.00, 0.00, 0.20, 1.00)` | entradas |
| `--veta-ease-in` | `cubic-bezier(0.40, 0.00, 1.00, 1.00)` | salidas |
| `--veta-ease-in-out` | `cubic-bezier(0.40, 0.00, 0.20, 1.00)` | estados bidireccionales |
| `--veta-ease-emphasized` | `cubic-bezier(0.16, 1.00, 0.30, 1.00)` | momentos de verdad (check de gate, acta E-26) |
| `--veta-ease-linear` | `linear` | shimmer de skeleton |

**Regla compositor-only (obligatoria):** solo `transform`, `opacity`, `color`, `background-color`, `box-shadow`, `filter`. Nunca dimensiones/posiciones de layout (M-03, CLS<0,1, `d4_a5:106`).

### 3.2 Tokens de componente promovidos a fila formal (cierra B1-GAP-02, `d4_b1:235`)

A4 los consumió pero A3 no los declaró. Quedan canónicos (jerarquía primitivo→semántico→componente, `d4_a3:74-94`):

| Token | Valor | Capa | Contraste medido |
|---|---|---|---|
| `--veta-color-brand` | `var(--veta-gold-600)` (#8B6914) | semántico | 4,9:1 vs paper (relleno) |
| `--veta-btn-primary-bg` | `var(--veta-color-brand)` | componente | — |
| `--veta-btn-primary-text` | `#FFFFFF` | componente | 5,1:1 sobre gold-600 (AA) |
| `--veta-btn-danger-bg` | `#B3261E` (primitivo danger, `d4_a3:51`) | componente | — |
| `--veta-btn-danger-text` | `#FFFFFF` | componente | 6,5:1 (AA) |
| `--veta-font-display` | `"Fraunces", serif` | componente | CC-DD-08 |
| `--veta-font-sans` | `"Inter", system-ui, sans-serif` | componente | CC-DD-08 |
| `--veta-font-mono` | `"IBM Plex Mono", monospace` | componente | CC-DD-08 |

### 3.3 Tokens derivados que la PoC declara en `@theme` (cierra B1-GAP-05, `d4_a4:334`)

| Token | Valor | Origen | Uso |
|---|---|---|---|
| `--veta-overlay-backdrop` | `rgba(43,43,43,0.4)` | `d4_a4:142` (derivado) | backdrop de modal |
| `--veta-tooltip-bg` | `var(--veta-charcoal-800)` #2B2B2B | `d4_a4:156` | tooltip oscuro (14,2:1 con blanco) |
| `--veta-tooltip-text` | `#FFFFFF` | `d4_a4:156` | texto de tooltip |
| utilidad `data-surface` | `erp` / `publico` / `portal` | `d4_a4:266` (GV-A4-08) | switch de modo de superficie sobre los mismos tokens |

### 3.4 Conteo canónico de tokens (corrige B1-RUIDO-03)

| Categoría | Conteo | Corregido de A3 |
|---|---|---|
| Color/estado | **54** (16 neutros + 7 dorados + 12 semánticos estado + 19 superficie/rol) | A3 decía "~64" y "19 neutros/13 semánticos" (RUIDO-03) |
| Tipografía | 19 | igual |
| Spacing | 13 | igual |
| Radio | 5 | igual |
| Borde | 10 (2 anchos + 8 colores) | igual |
| Sombra | 8 | igual |
| z-index | 11 | igual |
| Motion | **12** (7 dur + 5 ease) | A3 contó 6 sin formalizar (B1-GAP-01) |
| Componente (nuevo §3.2) | **8** | — |
| Derivados (nuevo §3.3) | **3 + 1 utilidad** | — |
| **Total canónico** | **≈143 tokens + utilidad `data-surface`** | A3 decía "~135" |

**GAPs del sistema tras consolidar:** ninguno nuevo. Siguen vivos solo los que por regla NO resuelve el D4: token de éxito (CC-DD-07), familias (CC-DD-08), glosario H07 (acción Orquestador antes de labels finales — ver §7) y las decisiones de §8.

---

## §4 Mapa de consumo de la PoC (qué se declara en `@theme`)

La PoC (3 pantallas: **P-04 cotizador ERP**, **P-09 cronograma ERP**, **F-01 landing público**) declara en `@theme` de Tailwind v4 (`d4_a3:86`, B2-1:219):

1. Todos los tokens de color/estado de A3 §2 (`d4_a3:100-185`) como `--color-*`.
2. Tipografía de A3 §3 (`--font-display/sans/mono`, escala `--text-*`) — con `next/font` self-hosted (Fraunces + Inter + IBM Plex Mono, subset `latin-ext`).
3. Tokens de motion de §3.1 (`--dur-*`, `--ease-*`).
4. Tokens de componente de §3.2 y derivados de §3.3.
5. Spacing/radius/border/shadow/z de A3 §4-5 (`d4_a3:222-297`).
6. Utilidad de modo de superficie (`data-surface`).

**Regla de oro:** ningún literal de color en código; si aparece uno, es bug de token (`d4_a3:62`). Los estados "éxito/verificado" de la PoC se renderizan con **icono + texto + neutro** (R14) hasta que el Supervisor cierre CC-DD-07.

---

## §5 Primitivas canónicas (referencia A4 + corrección)

La biblioteca completa es **A4** (`d4_a4_primitivas_ui.md`): **38 primitivas en 8 categorías**, con contrato por primitiva (estados/variantes/medidas/tokens/pantallas/a11y). Este consolidado no la duplica; fija:

- **Conteo:** 38 primitivas · 6 dedicadas a gates (SLA Timer, Gate Guard, Stepper, Timeline doble, Checklist E-21, Tabla de caja) + 3 de apoyo (Badge, Modal, Toast) · cobertura 34/34 pantallas (`d4_a4:100`).
- **Corrección de B1-CV-01 aplicada** (§2): botones interactivos mínimos `md` 40px con hit area ≥48px; `sm` 32px solo no interactivo.
- **Las 3 primitivas del estándar faltante** (kanban #32, stepper #33, timeline doble #34) y las 2 composiciones (tabla de caja #14, checklist E-21 #35) son las que la PoC valida en pantalla (`d4_a4:334`).
- **Sistema de gates:** 5/5 con primitiva + token + motion de transición (`d4_b1:154`) — la única reserva es el éxito (CC-DD-07).

---

## §6 Librerías y arte (contrato de salida, `diamante4_metodologia.md:99`)

| Librería | Decisión | Estado | Fuente |
|---|---|---|---|
| **Tipografías** | Fraunces (display, SOLO frontstage) + Inter (UI) + IBM Plex Mono (técnico); `next/font` self-hosted, subset `latin-ext`, sin dependencia npm nueva | Propuesta → **CC-DD-08** (Supervisor) | `d4_a3:189-195`, `d4_b1:201` |
| **Iconos** | **Ninguna elegida en A1-A4** | **CC-DD-15** — decisión del Supervisor; la PoC no puede resolverla sola (badges/gates la necesitan) | `d4_b1:30,218` |
| **Toasts** | A5 cita **sonner**; dependencia externa no verificada contra el stack v2 | **CC-DD-16** — verificar si el stack v2 lo tenía; si no, decidir (sonner vs componente propio) | `d4_a5:135,205`, `d4_b1:31,219` |
| **Gráficos/sparkline** | SVG inline viable; trazo gold-600 | **CC-DD-17** — no bloquea; R22 patrones+etiquetas, nunca color-only | `d4_a4:135`, `d4_b1:208` |
| **Imágenes/madera** | Recuperar del sitio actual, no producir (I-016) | **CC-DD-09** (Supervisor); fuera del D4 | `destilacion:550-552` |
| **Estrategia de imágenes** | Guía de imágenes del corpus; captions `--veta-media-caption` | Integrada en A3 `:183` | `d4_a3:183` |

---

## §7 Decisiones de proceso pendientes (no de marca)

| Pendiente | Quién | Cuándo | Fuente |
|---|---|---|---|
| **Glosario único de estados/verbos (H07)** | Orquestador | **antes de escribir labels finales en la PoC** — la PoC usa los verbos de `d3_ui_b2_1:235` mientras tanto | `d4_b1:237` (B1-GAP-04) |
| Verificación de contraste con herramienta (gold-500 4,58:1) | PoC | antes de cortar tokens | CC-DD-24, `d4_b1:188` |
| View Transitions API (crossfade rutas ERP) | PoC | decide en P-04/P-09 | CC-DD-19 |
| Confirmación A-01 (contador) | Supervisor | **obligatoria antes de F8** de la Ola 7 (no bloquea D4) | `plan_ola7_maestro.md` |

---

## §8 Decisiones que escalan al Supervisor (resumen ejecutivo)

**Bloquean el corte de la Ola 7 (no la PoC):**

| CC-DD | Decisión | Nota |
|---|---|---|
| **CC-DD-07** | Token de éxito (verde funcional ERP A `#1E7A4F` 5,1:1 vs no-verde bronce B 8,2:1) — **única que bloquea el valor del token** | `d4_a3:150-159`; R14 permite render mientras tanto |
| **CC-DD-08** | Familias tipográficas (Fraunces/Inter/Plex Mono) | `d4_a3:189-195` |
| **CC-DD-15** | Librería de iconos | bloquea PoC y corte |
| **CC-DD-16** | sonner (toasts) | bloquea PoC y corte si el stack v2 no lo tenía |
| **CC-DD-18** | Celebración E-26 (default: contenida, sin confetti) | `d4_a5:276` |
| **CC-DD-20** | Nudge CTA WhatsApp (default: sin nudge) | `d4_a5:278` |
| **CC-DD-22** | Pulso SLA en riesgo (default: NO) | `d4_a5:280` |
| CC-DD-01/02/03/04/06/09/11/13 | Nombre/NAP, eslogan, audiencia, tagline, antigüedad, imágenes, precio 3D, CTA WhatsApp | decisiones de marca/copy heredadas |

**El resto (CC-DD-05/10/12/17/21/23/24/25) son defaults razonados aplicables o no bloquean.**

---

## §9 Contrato de salida para la PoC (Ola 5 del D4)

La PoC codifica **3 pantallas piloto** (`diamante4_metodologia.md:101`): **P-04 cotizador (ERP/comercial)** · **P-09 cronograma doble (ERP/operativo)** · **F-01 landing (público)**.

**Requisitos de entrada (lo que este consolidado garantiza):** tokens canónicos (§3) declarables en `@theme`, primitivas de A4 (§5), motion formal (§3.1), correcciones del B1 aplicadas (§2).

**Requisitos de salida (verificación mecánica, `diamante4_metodologia.md:128`):** `tsc --noEmit` + `eslint .` + `next build` limpios y screenshot visible de cada pantalla. Resultado documentado en `d4_prueba_concepto.md`.

**Resoluciones que la PoC hace por default (no requieren Supervisor):** CC-DD-19 (View Transitions — decide la PoC), CC-DD-24 (contraste con herramienta), H07 glosario (Orquestador antes de labels). **Las que la PoC NO puede resolver sola: CC-DD-15 (iconos) y CC-DD-16 (sonner)** — van al Supervisor junto con el checkpoint de la Ola 5/6.

---

## Registro

- Fecha: 2026-08-04 · Pase D4-CONSOLIDADO (Ola 4 del Diamante 4, después de B1), ejecutado por el **Orquestador**.
- Archivo de salida único: `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d4_consolidado_diseño.md` (este archivo).
- Aplica las 5 condiciones del B1: numeración CC-DD (normalizada), tokens de motion formales, tokens de componente promovidos, botón sm corregido, conteo canónico ~143 tokens.
- Correcciones de reporte: RUIDO-02 (28 principios), RUIDO-03 (16 neutros/12 semánticos), RUIDO-04 (tooltip 14,2 / heading 16,8).
- **Siguiente acción del diamante: PoC (t-098)** — 3 pantallas piloto, verificación `tsc`/`eslint`/`next build` + screenshot; luego checkpoint humano del Supervisor (Ola 6).
- No se modificó ningún otro archivo; no se tocó código vivo.
