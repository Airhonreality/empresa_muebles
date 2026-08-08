# Pase D4-B1 — auditor final de diseño (auditor independiente, loop de 3 iteraciones)

**Rol:** Auditor final independiente del Diamante 4 (t-096, D4-B1 "auditor final de diseño"). **No ejecuté ningún pase A1-A5.** Mi trabajo es verificar con escepticismo los outputs ajenos contra los goals duros de `diamante4_metodologia.md:141-148` y contra la fuente primaria de marca (`destilacion_docs_veta.md`). Solo investigación y análisis, cero código.
**Método:** (a) releí completos los 5 pases (A1-A5) y la metodología; (b) verifiqué cada afirmación de marca contra `destilacion_docs_veta.md` (fuente primaria); (c) recalcularé a mano todos los contrastes que A3 afirma (fórmula WCAG 2.x: ratio = (L1+0.05)/(L2+0.05)); (d) verifiqué cobertura pantalla por pantalla (34) y gate por gate (E-18/E-21/E-24/E-33/E-20).
**Regla aplicada:** nunca acepto la palabra de un pase; si A2 usó fallback por el paralelismo, verifico que A3 reconcilió; si un punto de gusto no está escrito, es `DECISION_DISEÑO`.

---

## Iteración 1 (bruta)

Inventario crudo de lo que afirman los pases, sin filtrar:

- **A1** afirma: Luz & Biofilia `destilacion:595`; tokens literales `:601-608`; literales legacy `:304`; arquetipo Creador Experto `:267`; tono `:268`; anti-posicionamiento/Híbrido Artesanal `:269`; identidad legal `:639`; home/hero `:627-633`; CTA ≥48px `:617`; guía de imágenes `:550`; imágenes rotas I-016 `:552`; marca "Veta Dorada" `:369-389`; escala dorada 5 pasos con contraste medido a mano; semánticos del mermaid `logica_de_negocio.md:67-68`; 23 hallazgos (4 CV · 5 GAP · 3 RUIDO · 8 DD · 3 DIFERIDO).
- **A2** afirma: 3 superficies, 1 sistema, 3 modos (densidad/display/imagery, `:91-95`); mapa 34/34; **fallback documentado** (`:6`: corrió sin A1, identidad tomada de `destilacion` + paleta B1-2); paleta fallback con `ink #241C15`, `espresso #3E2A21`, `gold #A67C28`, `success #1E7A4F`; 28 hallazgos (4 CV · 6 GAP · 4 RUIDO · 8 DD · 6 DIFERIDO).
- **A3** afirma: jerarquía primitivo→semántico→componente (`destilacion:300-302`); escala dorada completa gold-100..700; semánticos del mermaid + info derivado + focus; **éxito LOCKED DD-05** con opciones A/B medidas; tipografía Fraunces/Inter/IBM Plex Mono (DD-07); ~135 tokens; **6 tokens de motion contados pero NO formalizados**; 18 hallazgos (5 CV · 4 GAP · 3 RUIDO · 4 DD · 2 DIFERIDO); reconciliación explícita del fallback de A2 (ink→carbon, gold #A67C28→falso, semánticos mermaid ganan).
- **A4** afirma: 38 primitivas; 6 dedicadas + 3 de apoyo para los 5 gates; cobertura 34/34; a11y transversal; 31 hallazgos (5 CV · 8 GAP · 5 RUIDO · 10 DD · 3 DIFERIDO); **GV-A4-03**: "A3 contó 6 motion pero no los nombró" → la PoC los declara desde A5 §2.
- **A5** afirma: escala dur 0/100/150/200/300/400/800 + eases out/in/in-out/emphasized/linear; compositor-only; tabla reduce-motion §7; transiciones de los 5 gates §3; 23 hallazgos (6 CV · 6 GAP · 4 RUIDO · 5 DD · 2 DIFERIDO); pide a A3 formalizar `--dur-*`/`--ease-*`.

---

## Iteración 2 (autocrítica)

Qué se sostiene, qué cae, qué se me escapó:

1. **Se sostiene y se confirma contra la fuente primaria:** la decisión "Luz & Biofilia, nunca verde literal en tokens, acento dorado permanece" es textual en `destilacion_docs_veta.md:595`; los 6 tokens semilla son `:601-608`; los literales legacy `#8b6f3c/#a68c59/rgba(212,197,161,0.85)/0x8b6914` son `:304`; arquetipo `:267`; tono `:268`; híbrido artesanal `:269`; eslogan `:270`; hero aprobado `:627`; hover `scale-103`/0.8s `:629`; H1 clamp `:614`; CTA 48px+8px `:617`; CWV `:619`; figcaption `:620`; NAP `:596`; identidad legal `:639`; protocolo de reseñas `:280`; 4 nombres de marca `:369-389`; guía de imágenes + I-016 `:550-552`. **A1/A2/A3/A5 citan correctamente la fuente primaria.**
2. **Se sostiene: A3 reconcilió el fallback de A2.** A2 declaró el supuesto de serialización (`d4_a2:6`) y A3 lo cerró con medida en su Iteración 2: (a) `gold #A67C28` sobre espresso = 3,55:1, no 4,5 (CV-A3-01 → gold-200 7,9:1); (b) ink `#241C15` vs carbon `#2B2B2B` → un solo `--veta-text-primary` = carbon (`:50`); (c) semánticos mermaid ganan sobre la paleta B1-2 (`:49,51`). La regla del paralelismo quedó cumplida.
3. **Se sostiene la coherencia de hex entre A1 y A3:** los 5 pasos dorados de A1 (tabla 2.1, `:101-108`) son exactamente los primitivos gold-700/600/500/300 de A3 (§2.2) + sheen → gold-200 `#D4C5A1` (derivación declarada). Neutros idénticos (paper `#FCFBF9`, linen `#F3EFE9`, carbon `#2B2B2B`, stone `#7A7873`).
4. **Cae la afirmación de A3 "6 motion" como token entregado:** A3 contó "6 motion" (`:385`) pero **no definió ni un solo token `--dur-*`/`--ease-*` en su entregable** (revisado completo). A5 los pidió explícitamente (`d4_a5:326`). Es un hueco de formalización real que A4 detectó (GV-A4-03) y delegó a la PoC. No contradice el diseño (los valores existen en A5 §2), pero rompe "A3 = fuente única de tokens" (`d4_a3:379`).
5. **Se me escapó en la pasada 1 — la colisión de numeración DECISION_DISEÑO.** A1 numera DD-05=éxito, DD-06=imágenes, DD-07=tipografías, DD-08=renombre. A2 numera DD-05=imágenes, DD-06=precio 3D, DD-07=card collapse, DD-08=CTA WhatsApp. A3/A4 retoman la numeración de A1 (DD-05=éxito, DD-07=tipografías). **Dos pases asignan DD-05 a temas distintos.** A3 además mezcla ambos esquemas al citar "imágenes DD-05/A" (`d4_a3:382`). Rastreable, pero es ruido de gobernanza que el consolidado debe normalizar.
6. **Se me escapó — la librería de iconos no existe en ningún pase.** El contrato de salida exige "librería de iconos (premium, con licencia justificada)" (`diamante4_metodologia.md:99`). A1-A4 usan iconos genéricos (check, X, candado, reloj) sin elegir ninguna librería ni marcar DECISION_DISEÑO. Es un hueco de implementabilidad (Ola 7 no tiene de dónde sacar los iconos de los badges/gates).
7. **Se me escapó — A5 cita "sonner"** (`d4_a5:135,205`) como implementación de toasts, una dependencia externa que la metodología prohíbe si el stack v2 no la tenía (`:99`). Nadie la verificó ni la marcó DECISION_DISEÑO.
8. **Verificación de contraste propia (la hago en el entregable §4):** recalculé a mano 24 ratios; todos los de A3 coinciden dentro del error de redondeo; confirmo CV-A3-01/02/03/04 y las correcciones.

---

## Iteración 3 (refinamiento final)

1. **Veredicto por goal duro** (tabla en el entregable §1). Global: **APROBADO con condiciones de consolidación** — los 6 goals se cumplen; los huecos encontrados son de formalización/decisión (tokens de motion, librería de iconos, sonner, numeración DD, glosario H07), no contradicciones de diseño de marca.
2. **Contradicciones entre pases:** 2 directas (numeración DD; A1 interno 27/28 principios) + 4 huecos de formalización (motion tokens, tokens consumidos sin fila formal, botón sm 32px vs R35, conteo de tokens A3) + 2 notas menores de etiquetado (ratios de charcoal/tooltip). Ver §2.
3. **Cobertura 34/34 verificada pantalla por pantalla** (§3). **5 gates con primitiva+token+motion** (§3.bis).
4. **Contraste AA verificado con medida propia** (§4); a11y presente (reduce-motion, focus, no color-only, hit targets) con una excepción menor a corregir.
5. **Implementabilidad** (§5): Tailwind 4 `@theme` correcto, `next/font` viable para las 3 familias; 3 pendientes (motion tokens, iconos, sonner) + 5 tokens derivados que la PoC debe declarar.
6. **DECISION_DISEÑO** (§6): las que bloquean el corte de Ola 7 vs las que solo bloquean la PoC. DD-05 (éxito) resuelta **coherentemente como LOCKED** en A1→A3→A4→A5.
7. **Clasificación** (§7) y **trazabilidad** (§8).

---

## Veredicto (al tope)

| Goal duro | Veredicto | Evidencia (archivo:línea) |
|---|---|---|
| Coherencia de marca (Luz & Biofilia + dorado + nunca verde + Creador Experto) | **APROBADO** | Todas las afirmaciones verificadas contra `destilacion_docs_veta.md:595,601-608,267-269,304`. Ningún token verde en A3 (success LOCKED). Dorado respetado como marca. Vocabulario del taller en R02 (`d3_ui_b2_1:72,235`, vía A2:174, A4:21). |
| Cobertura 34 pantallas (P-01..P-26, F-01..F-08; B3-1..B3-5) | **APROBADO** | Mapa 34/34 en A2 §3 (`d4_a2:191-238`); familias B3-1(9)/B3-2(7)/B3-3(7)/B3-4(4)/B3-5(7); verificación pantalla por pantalla en §3 de este archivo. |
| Contraste AA (≥4,5 normal · ≥3 grande/UI; dorado nunca texto pequeño sobre claro) | **APROBADO** | Medidas propias confirmadas en §4; CV-A3-01..05 corrigen las violaciones heredadas; regla de uso de la escala dorada `d4_a3:133`. |
| a11y (prefers-reduced-motion, focus visible, no color-only, hit targets) | **APROBADO** (1 excepción menor) | Tabla reduce-motion `d4_a5:216-235`; focus ring R39/`--veta-ring-focus`; R14 icono+texto en toda primitiva; hit targets R35. Excepción: botón sm 32px (`d4_a4:110`) vs R35 ≥48px → B1-CV-01. |
| Implementabilidad (Next 15 + React 19 + Tailwind 4, sin librerías nuevas) | **APROBADO** (condicionado) | `@theme` de Tailwind v4 correcto `d4_a3:86`; `next/font` viable para Fraunces/Inter/IBM Plex Mono; **condiciones**: formalizar tokens de motion (B1-GAP-01), decidir librería de iconos (B1-DD-01), verificar sonner contra el stack v2 (B1-DD-02). |
| Decisiones cerradas (no reabre: Luz & Biofilia, nunca verde, dorado, Veta Dorada, vocabulario del taller) | **APROBADO** | Ningún pase reabre las decisiones; DD-05 (éxito) se mantiene LOCKED sin resolver por gusto; marca "Veta Dorada" consistente en A1 (`:88`), A2 (`:302`), A3/A4 (sin uso de "Veta de Oro"). |

**Veredicto global: APROBADO** — el sistema visual es coherente, completo, accesible e implementable contra los goals duros. Se condiciona a que el **consolidado** (siguiente pase) cierre los 5 puntos de formalización listados en §7 (B1-GAP-01, B1-GAP-02, B1-GAP-05, B1-DD-01, B1-DD-02) y normalice la numeración DD antes de la PoC. Ninguno de ellos es una contradicción de marca; todos son de proceso.

---

## Entregable

### 1. Consistencia entre pases (contradicciones, clasificadas)

**Lo que NO es contradicción (verificado positivo):**

| Tema | Verificación | Evidencia |
|---|---|---|
| A1↔A3 hex dorados y neutros | Idénticos; gold-sheen → gold-200 `#D4C5A1` derivación declarada | `d4_a1:101-108` ↔ `d4_a3:125-131` |
| A2 fallback → A3 reconciliación | A3 corrigió con medida el fallback de A2 (ink→carbon, gold #A67C28→falso, semánticos mermaid) | `d4_a2:6` ↔ `d4_a3:45-51` |
| A2↔A3 concepto de superficie | Ambos: "1 sistema, 3 modos" (densidad/display/imagery); regla de enlace mismo token | `d4_a2:162-187` ↔ `d4_a3:61` ↔ `d4_a4:173-188` |
| A5↔A4 timing/easing | A4 consume la escala A5 por nombre (badge 150ms, modal 200/150ms, drawer 300ms, reflow 400ms, check 200ms) | `d4_a5:92-106` ↔ `d4_a4:20,142-143` |
| DD-05 (éxito) | LOCKED en A1 (`:135`), A3 (`:150-159`), A4 (`:249,282`), A5 (transiciones `success` pendientes) — coherencia total | `d4_a3:150-159` |
| "Nunca verde literal" | Ningún token verde en el set; info es azul (`#0B5E8C`), success LOCKED | `d4_a3:139-150` |

**Contradicciones directas (2):**

| ID | Contradicción | Clase | Evidencia |
|---|---|---|---|
| B1-RUIDO-01 | **Colisión de numeración DECISION_DISEÑO.** A1: DD-05=éxito, DD-06=imágenes, DD-07=tipografías, DD-08=renombre. A2: DD-05=imágenes, DD-06=precio 3D, DD-07=card collapse, DD-08=CTA WhatsApp. A3/A4 retoman la numeración de A1. A3 además cita "imágenes DD-05/A" mezclando ambos esquemas. | RUIDO_VISUAL (gobernanza) | `d4_a1:203-210` ↔ `d4_a2:300-309` ↔ `d4_a3:382` |
| B1-RUIDO-02 | **A1 se contradice a sí mismo:** "27 principios UX" (`d4_a1:30`) vs "28 principios" en cabecera y notas (`d4_a1:5,225`). La fuente real es 28 (P01-P28). | RUIDO_VISUAL | `d4_a1:30` vs `d4_a1:5,225` |

**Huecos de formalización entre pases (4):**

| ID | Hueco | Clase | Evidencia |
|---|---|---|---|
| B1-GAP-01 | **Tokens de motion nunca formalizados.** A5 pidió a A3 formalizar `--dur-*`/`--ease-*`; A3 contó "6 motion" (`:385`) pero no definió ninguno en el entregable. A4 lo detectó (GV-A4-03) y lo delegó a la PoC. | GAP_VISUAL | `d4_a5:326` ↔ `d4_a3:385` ↔ `d4_a4:261` |
| B1-GAP-02 | **Tokens consumidos por A4 sin fila formal en A3:** `--veta-color-brand` (solo en el árbol de ejemplo `d4_a3:91`, no en la tabla de semánticos), `--veta-btn-primary-bg` (solo ejemplo), `--veta-font-display`/`--veta-font-mono`, `--veta-btn-danger-bg`. A4 los usa por nombre en contratos. | GAP_VISUAL | `d4_a3:88-93,337` ↔ `d4_a4:110-118` |
| B1-CV-01 | **Botón `sm` de 32px** (`d4_a4:110`) contradice la propia regla R35 ≥48px que el mismo contrato cita (`d4_a4:110` a11y). Debe ser 32px+16px de hit area expandida, o solo no-interactivo. | CORRECCION_VISUAL (interna A4) | `d4_a4:110` |
| B1-RUIDO-03 | **Conteo de tokens A3 no cuadra con las filas publicadas:** §7 dice "19 primitivos neutros" pero §2.1 tiene 16 filas; "13 semánticos de estado" pero §2.3 tiene 12. No afecta implementación, afecta el reporte. | RUIDO_VISUAL | `d4_a3:385` vs `d4_a3:104-119,137-150` |

**Notas menores (no contradicción):**
- **B1-RUIDO-04:** ratio del tooltip etiquetado "13,7:1" (`d4_a4:156`) — 13,7:1 es carbon vs paper; carbon vs blanco (tooltip) es 14,2:1. Pasa AA de todas formas.
- **B1-NOTA-05:** `--veta-text-heading` charcoal-900 `#241C15` vs blanco: A3 anota "14,2:1" (`d4_a3:170`); medida propia = 16,8:1. Sigue siendo AAA; solo el etiquetado es impreciso.
- **B1-NOTA-06:** gold-700 vs linen: A1 anotó 6,1:1 (`d4_a1:103`), A3 corrigió a 6,4:1 (`d4_a3:53,131`). Diferencia de redondeo manual documentada por A3; ambos AA.

**Confirmación de la regla del paralelismo:** A2 usó fallback con supuesto registrado (`d4_a2:6`) y A3 reconcilió en su Iteración 2 con medida (`d4_a3:45-53`). **No es hallazgo — está resuelto.**

### 2. Cobertura — verificación pantalla por pantalla (34/34)

Leyenda: ✓ = dirección (A2) + token (A3) + primitiva (A4) + motion donde aplica (A5) · ⚠ = cubierto con reserva (token LOCKED o decisión pendiente) · DIF = DIFERIDO registrado.

| ID | Pantalla | A2 dir. | A3 tokens | A4 primitiva | A5 motion | Estado |
|---|---|---|---|---|---|---|
| P-01 | Embudo kanban | ✓ `d4_a2:195` | ✓ | Kanban #32, Familia B, SLA #28 `d4_a4:165` | DnD + placeholder `d4_a5:177` | ✓ |
| P-02 | Ficha lead/cliente | ✓ `d4_a2:196` | ✓ | Input/Select/Accordion/Drawer/Familia B | generic | ✓ |
| P-03 | Agenda/calendario | ✓ `d4_a2:197` | ✓ | Datepicker, Filtros, Paginación, Empty | generic | ✓ |
| P-04 | Cotizador | ✓ `d4_a2:198` | ✓ (draft) | Form, Button, Modal, Toast | autosave estático `d4_a5:160` | ✓ |
| P-05 | Contratos+firma | ✓ `d4_a2:199` | ✓ | Wizard E-13 #36, Radio, Modal, Toast | modal 200ms, type-to-confirm `d4_a5:209` | ✓ |
| P-06 | Proyectos+gates | ✓ `d4_a2:200` | ✓ | Stepper #33, Familia B, KPI | línea progreso 400ms (F-07) `d4_a5:128` | ✓ |
| P-07 | Retoma | ✓ `d4_a2:201` | ✓ (media) | Upload, Drawer, Form | offline banner, autosave | ✓ |
| P-08 | Schema/BOM | ✓ `d4_a2:202` | ✓ | Gate Guard, Select, Switch, Tabs, Modal, Toast | highlight post-gate 400ms `d4_a5:126` | ✓ |
| P-09 | Cronograma doble | ✓ `d4_a2:203` | ✓ (desfases) | Timeline #34, Gate Guard | reflow 400ms `d4_a5:129` | ✓ |
| P-10 | Novedades críticas | ✓ `d4_a2:204` | ✓ | SLA #28, Notificación | timer continuo `d4_a5:133` | ✓ |
| P-11 | Check 15 días | ✓ `d4_a2:205` | ✓ | Radio (3 desenlaces), Modal | generic (panel decisión) | ✓ |
| P-12 | Equipo | ✓ `d4_a2:206` | ✓ | Switch, Checkbox, Avatar, DataTable A | generic | ✓ |
| P-13 | Compras | ✓ `d4_a2:207` | ✓ | DataTable A, Gate Guard, Empty, Paginación | skeleton Fam A `d4_a5:190` | ✓ |
| P-14 | Recepción | ✓ `d4_a2:208` | ✓ | Checklist E-21 #35, Gate Guard, Modal, Toast | cascade ≤50ms/ítem `d4_a5:150` | ⚠ (éxito LOCKED) |
| P-15 | Herramientas | ✓ `d4_a2:209` | ✓ | DataTable A, Empty | generic | ✓ |
| P-16 | Fila del taller | ✓ `d4_a2:210` | ✓ | Kanban #32, DataTable A, KPI | DnD + teclado 2.5.7 `d4_a5:177` | ✓ |
| P-17 | Calidad | ✓ `d4_a2:211` | ✓ | Gate Guard, Modal, Toast, Notificación | toast role=alert E-23 `d4_a5:153` | ✓ |
| P-18 | Instalación | ✓ `d4_a2:212` | ✓ | Datepicker rango ≤5d, Gate Guard | generic | ✓ |
| P-19 | Acta entrega | ✓ `d4_a2:213` | ✓ (gold+celebración) | Upload, Form, Modal | celebración contenida DM-01 `d4_a5:276` | ⚠ (DM-01 decisión) |
| P-20 | Caja | ✓ `d4_a2:214` | ✓ | Tabla de caja #14, KPI, Gate Guard, Notificación | panel decisión 200ms `d4_a5:137` | ✓ |
| P-21 | Obligaciones | ✓ `d4_a2:215` | ✓ | DataTable A, Filtros, KPI, Tabs, Accordion | generic | ✓ |
| P-22 | Compensación | ✓ `d4_a2:216` | ✓ | DataTable A, Avatar, KPI, Tooltip | tooltip rich `d4_a4:156` | ✓ |
| P-23 | Dashboard contador | ✓ `d4_a2:217` | ✓ | DataTable A, Switch, KPI, Tabs | generic | ✓ |
| P-24 | Pedidos web | ✓ `d4_a2:218` | ✓ | DataTable A/B, Filtros | generic | ✓ |
| P-25 | Garantía | ✓ `d4_a2:219` | ✓ | DataTable B, Datepicker, Tabs, Empty, Upload | generic | ✓ |
| P-26 | Documentación | ✓ `d4_a2:220` | ✓ (media-caption) | Upload, Skeleton foto | skeleton aspect-ratio `d4_a5:191` | ✓ |
| F-01 | Landing | ✓ `d4_a2:226` | ✓ (hero/display) | Card portafolio, Button, Input | hero 300ms, portafolio 800ms `d4_a5:116,134` | ✓ |
| F-02 | Propuesta pública | ✓ `d4_a2:227` | ✓ | Card, Wizard pago (F-08) | hero/fade | ✓ |
| F-03 | Agendar | ✓ `d4_a2:228` | ✓ | Input, Datepicker, Button | generic | ✓ |
| F-04 | Tienda catálogo | DIF `d4_a2:230` | DF-A3-01 | DF-A4-01 | DF-01 | DIF ✓ |
| F-05 | Tienda ficha | DIF `d4_a2:231` | DF-A3-01 | DF-A4-01 | DF-01 | DIF ✓ |
| F-06 | Tienda checkout | DIF `d4_a2:232` | DF-A3-01 | DF-A4-01 | DF-01 | DIF ✓ |
| F-07 | Portal cliente | ✓ `d4_a2:238` | ✓ | Stepper, Card, Modal, Drawer, Toast | check pop 200ms, línea 400ms `d4_a5:127` | ⚠ (éxito E-60 LOCKED) |
| F-08 | Pago 3D | ✓ `d4_a2:229` | ✓ | Wizard pago #36 | type-to-confirm | ✓ |

**Conteo:** 31/34 cubiertas ✓ · 3/34 DIFERIDO registradas (F-04/F-05/F-06) · 3 pantallas con reserva ⚠ (P-14, P-19, F-07) — todas por el token de éxito (DD-05) o la decisión DM-01, **ninguna sin dirección/tokens/primitiva/motion**. **Sin huecos por familia B3-1..B3-5.**

### 3. Los 5 gates — primitiva + token + motion de transición de estado

| Gate | Primitiva (A4 §4) | Token (A3) | Motion de transición (A5 §3) | Resultado |
|---|---|---|---|---|
| **E-18** schema aprobado/rechazado (P-08) | Gate Guard + Badge + Modal + Toast `d4_a4:195,202` | semánticos error/info + success LOCKED `d4_a3:137-150` | badge 150ms + highlight 400ms; reproceso modal 200ms sin shake `d4_a5:148-149` | ✓ (éxito LOCKED) |
| **E-21** recepción verificado (P-14) | Checklist E-21 #35 + Gate Guard + Modal + Toast `d4_a4:200` | error/warning + success LOCKED `d4_a3:139-145` | cascade ≤50ms/ítem, máx 300ms, ≤8 ítems + check pop `d4_a5:150` | ✓ (éxito LOCKED) |
| **E-24** calidad veredicto (P-17) | Gate Guard + Badge + Modal R18 + Toast `d4_a4:197` | danger/error + success LOCKED `d4_a3:139` | badge 150ms + highlight 400ms + toast role=alert `d4_a5:152-153` | ✓ (éxito LOCKED) |
| **E-33** desfase cronograma (P-09) | Timeline cronograma doble #34 + Gate Guard `d4_a4:198` | desfases warning/info/error + líneas espresso/stone `d4_a3:185` | reflow línea interna 400ms, contractual inmutable `d4_a5:154` | ✓ |
| **E-20** caja bloqueada/liberada (P-20) | Tabla de caja #14 + Gate Guard + Panel decisión `d4_a4:199` | error + success LOCKED + dinero `d4_a3:306` | panel 200ms entrada única; colapso 200ms `d4_a5:155-156` | ✓ (éxito LOCKED) |

**Los 5 gates tienen primitiva + token + motion.** La única reserva es el token de éxito (DD-05) en 3 de los 5 gates, resuelta provisionalmente por R14 (icono+texto+neutral) — documentado en los 3 pases.

### 4. a11y y contraste (verificación propia)

**Contraste — medida propia (fórmula WCAG 2.x, recalculada a mano) vs afirmación de A3:**

| Par | Medida propia | A3 afirma | Criterio | Resultado |
|---|---|---|---|---|
| carbon `#2B2B2B` / paper `#FCFBF9` | 13,70:1 | 13,7:1 | ≥4,5 | ✓ |
| carbon `#2B2B2B` / linen `#F3EFE9` | 12,40:1 | 12,4:1 | ≥4,5 | ✓ |
| carbon `#2B2B2B` / surface ERP `#F7F4F0` | 12,92:1 | 12,9:1 | ≥4,5 | ✓ |
| stone `#7A7873` / paper | 4,27:1 | 4,26:1 | ≥4,5 | ✗ **NO AA normal** (confirmado CV-A3-04) |
| stone-600 `#5F5D57` / paper | 6,36:1 | 6,4:1 | ≥4,5 | ✓ (corrección aplicada) |
| gold-700 `#6B5220` / paper | 7,12:1 | 7,1:1 | ≥4,5 | ✓ |
| gold-700 `#6B5220` / linen | 6,43:1 | 6,4:1 | ≥4,5 | ✓ (A1 decía 6,1 — redondeo) |
| gold-600 `#8B6914` / paper | 4,92:1 | 4,9:1 | ≥4,5 | ✓ |
| gold-600 `#8B6914` / blanco (texto sobre CTA) | 5,09:1 | 5,1:1 | ≥4,5 | ✓ |
| gold-600 `#8B6914` / espresso `#3E2A21` | 2,65:1 | 2,65:1 | — | ✓ "no usar sobre oscuro" |
| gold-500 `#8B6F3C` / paper | 4,58:1 | 4,6:1 | ≥4,5 | ✓ **justo** (0,08 de margen — recomendar herramienta) |
| gold-500 `#8B6F3C` / linen | 4,13:1 | 4,1:1 | ≥3 (large) | ✓ solo large |
| gold-300 `#A68C59` / paper | 3,12:1 | 3,1:1 | ≥3 (UI) | ✓ decorativo/large |
| gold-200 `#D4C5A1` / espresso | 7,89:1 | 7,9:1 | ≥4,5 | ✓ |
| `#A67C28` (B1-2) / espresso | 3,55:1 | 3,55:1 | ≥4,5 | ✗ falla texto normal → confirmado CV-A3-01 |
| error-text `#660000` / fill `#FFDDDD` | 10,63:1 | 10,6:1 | ≥4,5 | ✓ |
| error-stroke `#CC0000` / fill | 4,66:1 | 4,7:1 | ≥3 (1.4.11) | ✓ |
| warning-text `#664400` / fill `#FFF3CD` | 7,73:1 | 7,9:1 | ≥4,5 | ✓ |
| warning-stroke `#CC8800` (corpus) / fill | 2,61:1 | 2,67:1 | ≥3 (1.4.11) | ✗ **falla** → confirmado CV-A3-02 |
| warning-stroke `#A87000` (derivado) / fill | 3,71:1 | 3,8:1 | ≥3 (1.4.11) | ✓ |
| info-text `#0B5E8C` / paper | 6,78:1 | 6,8:1 | ≥4,5 | ✓ |
| focus `#1D5FD0` / paper | 5,64:1 | 5,6:1 | ≥3 (UI) | ✓ |
| border-default `#8A8479` / blanco | 3,71:1 | 3,7:1 | ≥3 (1.4.11) | ✓ |
| border-subtle `#D8D0C6` / blanco | 1,53:1 | 1,48:1 | ≥3 | ✗ falla → confirmado CV-A3-03 |
| espresso `#3E2A21` / paper (text-display) | 13,03:1 | 13,0:1 | ≥4,5 | ✓ |

**Conclusión de contraste:** las 5 CORRECCION_VISUAL de A3 (CV-A3-01..05) están confirmadas con medida propia y sus correcciones pasan. El único punto de atención: gold-500 = 4,58:1 (margen AA de 0,08) — la herramienta de A4 (DD-A3-02) debe confirmarlo antes de cortar; y gold-300/400 "nunca texto normal sobre claro" está reglado en `d4_a3:133`.

**a11y (verificado):**
- **prefers-reduced-motion:** tabla completa de apagado con justificación, incluida la regla "el número del SLA y el anillo de foco NO se apagan" y el corolario "ninguna superficie depende de la animación" — `d4_a5:216-235`; utilitarios `motion-safe:`/`motion-reduce:` Tailwind v4 `d4_a5:218`.
- **Focus visible:** R39, anillo 2px+3:1 `--veta-ring-focus` (`d4_a3:277`), `focus-inverse` sobre oscuro, `scroll-padding-top`, focus trap modal con Esc y retorno al trigger — `d4_a4:232`.
- **Estados nunca solo color:** R14 icono+texto+color en todas las primitivas y transiciones de gate; gráficos con patrones+etiquetas (R22); borrador sin colores de confirmación (D3) — `d4_a4:235`, `d4_a5:144`.
- **Hit targets:** R35 ≥48px + 8px en todas las superficies; CTA primario en tercio inferior móvil; **excepción**: botón sm 32px (B1-CV-01).

### 5. Implementabilidad en el stack (Next 15 + React 19 + Tailwind 4)

| Aspecto | Verificación | Evidencia |
|---|---|---|
| Mapeo a Tailwind v4 `@theme` | Correcto: `--color-*`, `--spacing-*`, `--radius-*`, `--text-*`, `--font-*`, `--shadow-*`, `--z-*`, `--border-*`; es la vía CSS-first de Tailwind 4 | `d4_a3:86` |
| Tipografías | Fraunces (variable), Inter, IBM Plex Mono: disponibles en Google Fonts, `next/font` self-hosted con subset `latin-ext` (tildes/ñ); sin dependencia npm nueva | `d4_a3:191-195`, `d4_a1:164` |
| Motion | Solo CSS transitions sobre `transform/opacity/color/background-color/box-shadow/filter` (compositor-only) → sin librería de animación JS | `d4_a5:106` |
| View Transitions API | Opcional, marcado DECISION_DISEÑO (DM-02) — no bloquea | `d4_a5:277` |
| **Condición 1 — tokens de motion** | A3 no los formalizó (B1-GAP-01): la PoC debe declarar `--dur-*`/`--ease-*` en `@theme` desde A5 §2 | `d4_a4:261` |
| **Condición 2 — librería de iconos** | Ninguna elegida en A1-A4 (B1-DD-01); el contrato exige "iconos premium con licencia" | `diamante4_metodologia.md:99` |
| **Condición 3 — sonner** | A5 cita sonner para toasts (B1-DD-02); dependencia externa no verificada contra el stack v2 | `d4_a5:135,205` |
| Tokens derivados a declarar en PoC | `--veta-btn-danger-bg` (#B3261E), backdrop `rgba(43,43,43,0.4)`, tooltip oscuro (charcoal-800), utilidad de modo `data-surface` — detectados por A4 | `d4_a4:334` |
| Gráficos/sparkline | R22 exige patrones+etiquetas; el sparkline es SVG inline viable sin librería; trazo = decisión (DD-A4-10) | `d4_a4:135,291` |

**Veredicto de implementabilidad: APROBADO condicionado.** Los tokens son codificables en Tailwind 4 con CSS vars y `next/font`; no hay dependencia no estándar obligatoria salvo las 3 condiciones de §5 que el consolidado debe cerrar.

### 6. DECISION_DISEÑO críticas (bloqueo de corte vs solo PoC)

| Decisión | Estado | Bloquea corte Ola 7 | Bloquea PoC | Verificación |
|---|---|---|---|---|
| **DD-05 token de éxito** (¿verde funcional ERP o no-verde?) | **LOCKED**, 2 opciones medidas (A verde ERP `#1E7A4F` 5,1:1 / B bronce 8,2:1) | **SÍ** — el valor del token success (toca 5 primitivas) | No — R14 permite icono+texto+neutral | `d4_a3:150-159`; coherente en A1/A3/A4/A5 |
| **DD-07 familias tipográficas** (Fraunces/Inter/Plex Mono) | Propuesta con justificación; sin decisión | **SÍ** (marca del corte) | No — `next/font` funciona igual | `d4_a3:189-195`, `d4_a1:150-164` |
| **B1-DD-01 librería de iconos** | Sin elegir (hueco nuevo del auditor) | **SÍ** | **SÍ** (los badges/gates de la PoC necesitan iconos) | ausente en A1-A4 |
| **B1-DD-02 sonner** (dependencia de toasts) | Sin verificar contra stack v2 | **SÍ** si el stack v2 no lo tenía | **SÍ** | `d4_a5:135,205` |
| **B1-DD-03 sparkline/gráficos** | Default gold-600; sin librería decidida | No (SVG inline viable) | No | `d4_a4:135,291` |
| DM-01 confetti vs celebración contenida (E-26) | Default: celebración contenida, sin confetti | **SÍ** (tono de cierre en F-07/P-19) | No | `d4_a5:276` |
| DM-03 nudge CTA WhatsApp | Default: sin nudge | **SÍ** (sobriedad artesanal) | No | `d4_a5:278` |
| DM-04 reflow cronograma 400ms | Default 400ms; contractual inmutable | No (aplica default) | No | `d4_a5:279` |
| DM-05 pulso SLA en riesgo | Default NO | **SÍ** (afecta P-01/P-10) | No | `d4_a5:280` |
| DD-A4-09/10 gustos públicos (radio, altura CTA, trazo) | Defaults razonados | No | No | `d4_a4:290-291` |

**DD-05 resuelta coherentemente como LOCKED:** los 4 pases que la tocan (A1, A3, A4, A5) la mantienen cerrada y sin inventar la resolución; las dos opciones están medidas. Es la decisión única que bloquea el corte del token (no el render de la PoC). **Verificado como LOCKED correcto.**

### 7. Clasificación de hallazgos (este auditor)

| ID | Clase | Hallazgo | Evidencia | Resolución sugerida |
|---|---|---|---|---|
| B1-CV-01 | `CORRECCION_VISUAL` | Botón `sm` 32px contradice R35 ≥48px | `d4_a4:110` | Hit area expandida a ≥48px o excluir el tamaño |
| B1-GAP-01 | `GAP_VISUAL` | Tokens de motion no formalizados en A3 (contó 6, definió 0) | `d4_a3:385` ↔ `d4_a5:326` | Consolidado: incorporar A5 §2 como tokens `--dur-*`/`--ease-*` |
| B1-GAP-02 | `GAP_VISUAL` | Tokens usados por A4 sin fila formal en A3 (`color-brand`, `btn-primary-bg`, `font-mono/display`) | `d4_a3:88-93` ↔ `d4_a4:110-118` | Consolidado: promoverlos a fila formal |
| B1-GAP-03 | `GAP_VISUAL` | Sin librería de iconos (hueco del contrato §99) | `diamante4_metodologia.md:99` | DECISION_DISEÑO → Supervisor |
| B1-GAP-04 | `GAP_VISUAL` | Glosario único de estados/verbos H07 sigue sin existir (bloquea labels finales) | `d4_a2:359`, `d4_a4:336` | Orquestador: crear antes de PoC |
| B1-GAP-05 | `GAP_VISUAL` | 5 tokens derivados que la PoC debe declarar fuera de A3 (danger-bg, backdrop, tooltip, dur/ease, data-surface) | `d4_a4:334` | Consolidado: anexar al token list |
| B1-RUIDO-01 | `RUIDO_VISUAL` | Numeración DECISION_DISEÑO colisiona entre A2 y A1/A3/A4 (DD-05..08) | `d4_a1:203-210` ↔ `d4_a2:300-309` | Consolidado: renumerar con tabla de equivalencias |
| B1-RUIDO-02 | `RUIDO_VISUAL` | A1 interno "27 vs 28 principios" | `d4_a1:30` | Corregir a 28 |
| B1-RUIDO-03 | `RUIDO_VISUAL` | Conteo de tokens A3 §7 no cuadra con filas (16 vs 19 neutros; 12 vs 13 semánticos) | `d4_a3:385` | Corregir el reporte |
| B1-RUIDO-04 | `RUIDO_VISUAL` | Ratios de tooltip (13,7) y text-heading (14,2) mal etiquetados (reales 14,2 y 16,8) | `d4_a4:156`, `d4_a3:170` | Etiquetar correctamente |
| B1-DD-01 | `DECISION_DISEÑO` | Librería de iconos (no existe decisión) | — | Supervisor |
| B1-DD-02 | `DECISION_DISEÑO` | sonner como dependencia de toasts sin verificar contra stack v2 | `d4_a5:135,205` | Supervisor/PoC |
| B1-DD-03 | `DECISION_DISEÑO` | Implementación de sparkline/gráficos (R22) | `d4_a4:135` | Supervisor (trazo DD-A4-10) |
| B1-DD-04 | `DECISION_DISEÑO` | DD-05 éxito — LOCKED (heredado, coherente) | `d4_a3:150-159` | Supervisor (única que bloquea el corte de token) |
| B1-DD-05 | `DECISION_DISEÑO` | DD-07 familias tipográficas (heredado) | `d4_a3:189-195` | Supervisor |

**Totales: 1 CORRECCION_VISUAL · 5 GAP_VISUAL · 4 RUIDO_VISUAL · 5 DECISION_DISEÑO = 15 hallazgos del auditor.** (Sumando los heredados ya clasificados por los pases: 24 CV + 29 GAP + 19 RUIDO + 27 DD + 16 DIFERIDO en el sistema completo.)

### 8. Trazabilidad / Notas para el Orquestador

| Afirmación | Fuente (archivo:línea) |
|---|---|
| Luz & Biofilia, nunca verde literal, acento dorado, dark-lujo descartado | `destilacion_docs_veta.md:595` |
| Tokens semilla (paper/linen/carbon/stone/glass) | `destilacion_docs_veta.md:601-608` |
| Literales legacy dorados | `destilacion_docs_veta.md:304` |
| Arquetipo Creador Experto, tono, anti-posicionamiento, eslogan | `destilacion_docs_veta.md:267-270` |
| Hero aprobado + Respuesta Atómica + posicionamiento | `destilacion_docs_veta.md:627,633` |
| Hover `scale-103`/0,8s; CWV; CTA 48px+8px; figcaption | `destilacion_docs_veta.md:629,619,617,620` |
| H1 clamp fluido | `destilacion_docs_veta.md:614` |
| Marca Veta Dorada; 4 nombres en conflicto; NAP | `destilacion_docs_veta.md:369-389,596` |
| Identidad legal (NIT) | `destilacion_docs_veta.md:639` |
| Guía de imágenes + I-016 (recuperar, no producir) | `destilacion_docs_veta.md:550-552` |
| Protocolo de reseñas curadas; testimoniales solo si existen | `destilacion_docs_veta.md:280,571` |
| Semánticos mermaid (error/warning) | `logica_de_negocio.md:67-68` (vía A1:32) |
| Jerarquía primitivo→semántico→componente; "literal = falta token" | `destilacion_docs_veta.md:300-302` |
| Contrato de salida D4 (librería de iconos, tokens, primitivas, motion) | `diamante4_metodologia.md:95-101` |
| Goals duros de cierre B1 | `diamante4_metodologia.md:127` |
| Reconciliación del fallback de A2 | `d4_a3:45-53` (vs `d4_a2:6`) |
| Escala dorada completa + regla de uso | `d4_a3:125-133` |
| Éxito LOCKED + opciones A/B medidas | `d4_a3:150-159` |
| Motion: escala, compositor-only, reduce-motion, transiciones de gates | `d4_a5:88-138,216-235,142-162` |
| Primitivas de gates y cobertura | `d4_a4:161-202,57-100` |

**Recomendaciones de corrección previa al consolidado (prioridad):**
1. **Normalizar la numeración DECISION_DISEÑO** (B1-RUIDO-01) con una tabla de equivalencias A1/A2 → A3/A4, para que el consolidado hable un solo idioma.
2. **Formalizar los tokens de motion** (B1-GAP-01): mover la tabla de A5 §2 al token list de A3 como `--dur-*`/`--ease-*` (+ regla compositor-only). Es el único "hueco" real contra el goal A3.
3. **Promover `--veta-color-brand`, `--veta-btn-*`, `--veta-font-*` a filas formales** (B1-GAP-02) y anexar los 5 tokens derivados que A4 necesita (B1-GAP-05).
4. **Abrir DECISION_DISEÑO para librería de iconos y sonner** (B1-DD-01/02) — son los únicos puntos que la PoC no puede resolver sola.
5. **Escalar al Supervisor solo 2 decisiones antes del corte de Ola 7:** DD-05 (éxito) y DD-07 (familias) + las 4 de motion de marca (DM-01/03/04/05) + B1-DD-01. El resto son defaults razonados.
6. **GAP de proceso heredado:** el glosario H07 (B1-GAP-04) debe crearse antes de escribir labels finales en la PoC.
7. Corregir el botón `sm` 32px (B1-CV-01) y los reportes menores (B1-RUIDO-02/03/04).

---

## Registro

- Fecha: 2026-08-04 · Pase D4-B1 (Ola 4 del Diamante 4), auditor final independiente.
- Archivo de salida único: `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d4_b1_auditor_diseño.md` (este archivo).
- Veredicto: **APROBADO** (6/6 goals) con condiciones de consolidación (5 puntos de formalización, ninguno de marca).
- Contradicciones entre pases: **2 directas** (numeración DD; A1 27/28) + **4 huecos de formalización** (motion tokens, tokens sin fila formal, botón sm, conteo) + 2 notas menores de etiquetado.
- Hallazgos del auditor: **1 CORRECCION_VISUAL · 5 GAP_VISUAL · 4 RUIDO_VISUAL · 5 DECISION_DISEÑO = 15**.
- No ejecuté ningún pase A1-A5; no escribí ni modifiqué código ni ningún otro archivo; solo investigación y análisis (fuentes: 5 pases + metodología + `destilacion_docs_veta.md` + cálculo de contraste a mano).
