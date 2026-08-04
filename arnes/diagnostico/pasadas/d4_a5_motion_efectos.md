# Pase D4-A5 — motion y efectos (subagente, loop de 3 iteraciones)

**Rol:** Motion/Interaction designer del Diamante 4 (t-094, D4-A5 "motion y efectos").
**Lente:** definir el sistema de movimiento y efectos de la V3 — transiciones, animaciones, micro-interacciones, estados de carga, focus, hover y el feedback de las transiciones de estado de los 5 gates — con a11y estricta (`prefers-reduced-motion`). **Investigación y análisis, cero código.**
**Fuentes leídas:** `d4_a1_auditoria_visual.md` (identidad), `d4_a2_concepto_superficies.md` (concepto por superficie), `d3_ui_b1_1_ux_ergonomia.md` (28 principios P01-P28), `d3_ui_b2_1_destilacion_inv.md` (reglas R01-R40, tokens, convenciones de interacción), `d3_ui_consolidado.md` (34 pantallas y 5 gates), `destilacion_docs_veta.md` (tokens de marca, hover `scale-103`/0,8s). Complemento de gobierno: `diamante4_metodologia.md`.
**Supuesto de serialización (registrado):** `D4-A3` (tokens) corre en paralelo con este pase en la Ola 2 (`diamante4_metodologia.md:109`). Este pase **define los valores de duración/easing** como propuesta para que A3 los formalice como tokens `--dur-*` / `--ease-*`; no los declara él mismo como tokens finales. Si A3 fija valores distintos, A4 reconcilia.
**Regla de trazabilidad:** cada afirmación lleva `archivo:línea`. Sin traza no es hallazgo. Vocabulario de hallazgos del diamante 4 (`diamante4_metodologia.md:83-89`).
**Regla de oro:** el estado NUNCA se comunica solo con color (R14, `d3_ui_b2_1:89`); los textos de estado vienen del vocabulario del taller/cliente (R02, `d3_ui_b2_1:72`); el motion jamás causa layout shift (P27/R37, CLS<0,1, `destilacion_docs_veta.md:619`).

---

## Iteración 1 (bruta)

Inventario crudo de todo lo que el corpus dice sobre movimiento, sin filtrar:

- **El único literal de motion de todo el corpus:** home, portafolio aspiracional 16:9 con **hover `scale-103` en 0.8s** (`destilacion_docs_veta.md:629`; ratificado por `d4_a2:135`). Es la única cifra de duración/transform escrita en las fuentes.
- **`prefers-reduced-motion` como práctica obligatoria:** "animaciones desactivables (práctica WCAG 2.3.3)" (`d3_ui_b2_1:220`, origen `d3_ui_b1_2:204`); registrado como GAP H11 (`d3_ui_b2_1:293`). Es regla dura: **todo el sistema respeta reduce-motion**.
- **Metas de Core Web Vitals que el motion debe respetar:** LCP<2,5s · **INP<200ms** · **CLS<0,1** (`destilacion_docs_veta.md:619`). El INP<200ms hace que el motion sea *interacción*, no espectáculo: toda animación que retrase la respuesta de una acción está fuera de presupuesto.
- **`hover` encapsulado en `@media not all and (hover: none)`** (`destilacion_docs_veta.md:618`); regla R36 "hover ≠ interacción": todo hover tiene equivalente `:focus-visible`, nunca solo hover (`d3_ui_b2_1:131`).
- **Carga:** P27 skeleton del layout final que reserva espacio, `aria-busy="true"`, no spinner genérico (`d3_ui_b1_1:98`); RV-04 de A2 refuerza "skeleton, no spinner de página" (`d4_a2:296`). Spinner queda reservado para progreso de acción puntual.
- **Feedback:** convenciones de interacción de B2-1 — toasts `role="status"` (info/éxito) vs `role="alert"` (error/SLA), timeout pausa en hover/focus (2.2.1), botón cerrar ≥48px, icono+texto nunca solo color (`d3_ui_b2_1:231`); undo+toast ventana ~5s con traza (`d3_ui_b2_1:226,233`); confirmación destructiva en 3 niveles (a/b/c) con botón rojo no auto-enfocado, nunca "¿Estás seguro?" (`d3_ui_b2_1:98`, `d3_ui_b1_1:99`).
- **Gates:** R16 guard visible "Falta veredicto de schema" (`d3_ui_b2_1:91`); **R19 las transiciones de gate NO se disparan por foco ni por cambio de input** (WCAG 3.2.1/3.2.2); el cronograma recalcula TRAS guardar la causa (`d3_ui_b2_1:99`). R17 SLA como temporizadores (E-50 5 min en tarjeta de lead; E-34 5-24 h en novedad) (`d3_ui_b2_1:92`).
- **Foco:** R39 anillo de foco visible 2px + 3:1, nunca `outline:none` sin reemplazo (`d3_ui_b2_1:139`); focus trap solo en modal con Esc como salida; `scroll-padding-top` = altura del sticky (`d3_ui_b2_1:232`).
- **Motion por superficie (A2):** ERP "mínimo, funcional (estados/loading)"; público "hover 0.8s en portafolio, transiciones suaves"; portal "sutil, orientado a feedback de avance" (`d4_a2:185`). Es el mandato de que **el motion difiere por superficie**.
- **Momentos de verdad:** la entrega es "como un segundo contrato" (`d3_ui_b1_2:42`, citado en A2); el acta E-26 en P-19/F-07 necesita "celebración contenida, tono de cierre" (`d4_a2:155`).
- **Kanban sin primitiva:** P-01 (embudo) y P-16 (fila del taller) son kanban Familia B, GAP GV-01 (`d4_a2:282`); drag&drop de P-16 con alternativa teclado 2.5.7 (`d4_a2:210`; `d3_ui_consolidado.md:59`).
- **Deshacer reversible:** P07 + convención 8 "undo deja traza de auditoría" (`d3_ui_b1_1:63`; `d3_ui_b2_1:233`).
- **Offline/resiliencia de campo:** R27/P16 toda mutación en móvil con estados loading/retry/offline explícitos ("sin conexión — se guardó localmente") (`d3_ui_b2_1:117`; `d3_ui_b1_1:77`).
- **Estándares de timing de la industria (conocimiento del diseñador, no del corpus):** la escala 100-400ms con ease-out de entrada / ease-in-out de estados es el estándar de Material/Lineal para UI densa; el movimiento fuera de esa escala es decoración y debe justificarse con marca (el 0.8s del portafolio es ese caso).

---

## Iteración 2 (autocrítica)

Qué se sostiene, qué cae, qué se me escapó en la bruta:

1. **Cae todo el "motion llamativo" que no expresa al Creador Experto:** parallax, partículas, botones magnéticos, marquees, títulos con desplazamiento infinito, "shake" en errores, "bounce" de notificaciones. Contradicen el arquetipo (honesto, meticuloso, con autoridad — `destilacion_docs_veta.md:267`), el tono directo-elegante (`:268`), el anti-esnob (`:269`) y el anti-bloater (RUIDO_VISUAL, `diamante4_metodologia.md:86`). El ERP los prohíbe por densidad (R34/R20); el público los prohíbe por sobriedad artesanal (A2: "lujo artesanal, no aspiracional frío").
2. **Cae el estándar uniforme "todo en 200ms".** El corpus fuerza DOS regímenes: el funcional (100-400ms, para interacción) y el de marca (el `scale-103`/0,8s del portafolio, único literal escrito — `destilacion:629`). El 0.8s NO es un error de la fuente: es un efecto de "respiración de la fotografía" (frontstage), distinto del feedback de interacción. Se registra como **única excepción de duración**.
3. **Cae usar transiciones de propiedad de layout.** Prohibido animar `width/height/margin/top/left` (causa CLS y rompe el presupuesto P27/R37). Solo `transform`, `opacity`, `filter`, `background-color`, `box-shadow`, `color` — propiedades del compositor. Esto es lo que hace que el motion pueda convivir con CLS<0,1 e INP<200ms (`destilacion:619`).
4. **Se sostiene y se vuelve restricción dura — R19 es el corazón de este pase:** el feedback de un gate es **post-commit** (el servidor confirma, luego se anima el cambio), NUNCA preemptivo por focus/cambio de input (`d3_ui_b2_1:99`). O sea: el "estado cambió" se anima sobre el DOM ya mutado, no se anticipa. Esto también prohíbe el "optimistic update" en gates y en dinero (R05 matemática en servidor, `d3_ui_b2_1:75`).
5. **Se me escapó en la bruta:** (a) el DnD de P-01/P-16 debe tener alternativa teclado (2.5.7, `d4_a2:210`) → la animación de arrastre es **mejora progresiva**, y el placeholder que reserva espacio es obligatorio (sin placeholder el drop causa CLS); (b) el **timer SLA comunica estado** → su número debe seguir contando bajo reduce-motion (no es decoración); solo se apaga el "pulso" de alerta; (c) el **autoguardado "Guardado"** (R26) no debe parpadear ni animarse — texto estático que aparece una sola vez; (d) los **skeletons** de las 2 familias de tabla (A densa / B cards, R34) tienen geometría distinta → el skeleton debe clonar la geometría de la pantalla final, no un esqueleto genérico; (e) el **"nudge" de una sola vez** en el CTA WhatsApp del frontstage (H8, canal de conversión real) es decorativo y toca gusto → `DECISION_DISEÑO`; (f) los gráficos KPI (máx 1 sparkline, R21/R22) no deben tener animación de conteo exagerada — el número salta a valor final (R05: la UI muestra el cálculo, no lo "cuenta").
6. **El motion por superficie NO es un sistema aparte** (lección de A2, `d4_a2:91-95`): mismo set de tokens `--dur-*`/`--ease-*`, misma regla compositor-only, misma a11y; cambia la **frecuencia**, la **amplitud** y el **carácter** (funcional vs. emocional vs. de avance).
7. **Lo incierto no se inventa:** confetti/celebración en cierre de venta, uso de View Transitions API, nudge de CTA, pulso de SLA "en riesgo", duración exacta del reflow del cronograma → `DECISION_DISEÑO` para el Supervisor; este pase da el default razonado.

---

## Iteración 3 (refinamiento final)

Set curado que estructura el entregable:

1. **Principios de motion de marca (6):** 1) el movimiento expresa *precisión*, no velocidad — nada de rebotes ni aceleraciones "juguetonas"; 2) el estado se confirma, no se anuncia (R19: post-commit); 3) cero layout shift siempre (compositor-only, CLS<0,1); 4) el foco y el hover van juntos (R36/R39); 5) un solo efecto de marca (el `scale-103`/0,8s de la fotografía) y el resto es funcional; 6) reduce-motion es el default de una superficie sin animaciones.
2. **Escala de timing/easing:** `instantáneo 0 · fast 100 · quick 150 · base 200 · slow 300 · soft 400 · foto 800` (excepción única). Easings: `ease-out` (entradas), `ease-in` (salidas), `ease-in-out` (estados bidireccionales), `emphasized` (momentos de verdad), `linear` (shimmer). Todo como propuesta de tokens para A3.
3. **Transiciones de estado:** tabla por gate (E-18/E-21/E-24/E-33/E-20) + UI general; cada cambio = icono+texto+color (R14) con textos de R02 ("Schema aprobado", "Recibido verificado", "Calidad aprobada", "Desfase aplicado", "Caja bloqueada").
4. **Micro-interacciones:** hover (link, botón, fila tabla, tarjeta kanban, portafolio 0,8s), focus visible, press, drag&drop de P-01/P-16 con placeholder + alternativa teclado.
5. **Estados de carga:** skeletons por geometría (Fam A vs Fam B), spinner solo en acciones, SPA fade 150ms, optimistic solo en borradores, offline banner.
6. **Feedback crítico:** sonner/toast con roles, destructivas R18 (sin shake), SLA como timer visible con texto siempre, notificaciones E-23/E-34/E-60.
7. **Reduced motion:** tabla de apagado con justificación.

---

## Entregable

### 1. Principios de motion de marca

**Cómo el movimiento expresa "El Creador Experto" (honesto, meticuloso, con autoridad — `destilacion_docs_veta.md:267`) vs. el ruido:**

| # | Principio | Traducción de marca | Lo que queda PROHIBIDO (ruido) |
|---|---|---|---|
| M-01 | **Precisión sobre velocidad.** El movimiento acompaña la decisión, no compite con ella; la respuesta de interacción es ≤200ms (INP<200ms, `destilacion:619`) | Metódico, de taller: cada pieza encaja, sin aspavientos | Rebotes, elastic, aceleraciones "juguetonas", marquees, parallax |
| M-02 | **El estado se confirma, no se anuncia.** Toda transición de gate es post-commit (R19, `d3_ui_b2_1:99`); nada se anima antes de la confirmación del servidor | Honestidad artesanal: no prometes lo que no está hecho | Transiciones disparadas por focus/input (3.2.1/3.2.2); "optimistic" en gates/dinero (R05) |
| M-03 | **Cero layout shift.** Solo `transform`/`opacity`/`color`/`box-shadow`/`filter`; nunca dimensiones ni posiciones de layout (P27/R37, CLS<0,1) | Meticulosidad: el documento nunca "salta" | Animaciones de `width/height/margin/top/left`; skeleton sin reservar espacio |
| M-04 | **El foco y el hover son la misma cosa.** Todo hover tiene `:focus-visible` equivalente (R36, `d3_ui_b2_1:131`; R39 `:139`) | Confianza técnica: el sistema es operable por teclado como por mouse | Hover sin foco; `outline:none` sin reemplazo |
| M-05 | **Un solo efecto de marca.** El `scale-103`/0,8s del portafolio es el único gesto "de autor" (fotografía que respira, `destilacion:629`); todo lo demás es funcional | La marca gasta su movimiento en la fotografía (frontstage), no en el panel (backstage) | Múltiples efectos decorativos; motion decorativo en el ERP |
| M-06 | **reduce-motion es la superficie sin animaciones.** `prefers-reduced-motion` apaga todo gesto y deja la información intacta (H11, `d3_ui_b2_1:220,293`) | Respeto por el usuario: el contenido nunca depende del movimiento | Efectos que solo existen en versión animada |

**El motion difiere POR SUPERFICIE (mismo sistema de tokens, distinto carácter — `d4_a2:185`):**

| Superficie | Carácter | Frecuencia/amplitud | Duración dominante | Efecto de marca | Prohibido acá |
|---|---|---|---|---|---|
| **ERP** — "El taller en el panel" | **Información**: funcional, sobrio, de confirmación | Mínima; solo estados, carga y gates; amplitud ≤6px | 100-200ms | Ninguno decorativo; la marca se gasta en jerarquía/estado (R10) | Cualquier slide de tablas (R34), pulso en CTA primario (R20/R10), stagger largo de filas |
| **Sitio público** — "Luz & Biofilia / El Creador Experto" | **Emoción**: storytelling, suave, de fotografía | Media-baja; gestos lentos, de "respiración" | 300-800ms (fotografía) + 150-300 (UI) | `scale-103`/0,8s del portafolio (`destilacion:629`) | Glamour frío, partículas, lujo aspiracional (A2: "anti-esnob") |
| **Portal cliente** — "Tu proyecto, en calma" | **Confianza**: feedback de avance, tranquilidad | Media; orientada al progreso y a momentos de verdad | 200-400ms | Check "pop" + línea de progreso del stepper (F-07) | Cualquier movimiento que sugiera urgencia o backstage (R03, nunca desfases internos) |

Regla de enlace entre superficies (heredada de A2, `d4_a2:187`): ninguna primitiva cambia su token de motion por superficie; cambia la **frecuencia/amplitud** con que se usa.

---

### 2. Timing / easing (escala de motion)

**Tokens propuestos (para que A3 los formalice como `--dur-*` / `--ease-*`):**

| Token | Valor | Uso |
|---|---|---|
| `--dur-instant` | 0ms | reduced-motion; confirmaciones de estado; foco visible |
| `--dur-fast` | 100ms | hover de controles, press, fila de tabla, anillo de foco |
| `--dur-quick` | 150ms | micro-interacciones: badges, menús, dropdown, ruta SPA, toasts salida |
| `--dur-base` | 200ms | default: modales entrada, toasts entrada, panel decisión-first, DnD snap |
| `--dur-slow` | 300ms | drawer/sidebar, hero público, sombras de tarjetas frontstage |
| `--dur-soft` | 400ms | estados "momento": highlight de gate, reflow cronograma, línea de progreso |
| `--dur-photo` | 800ms | **única excepción**: hover `scale-103` del portafolio (`destilacion:629`) |
| `--ease-out` | `cubic-bezier(0.00, 0.00, 0.20, 1.00)` | entradas (elementos que aparecen) |
| `--ease-in` | `cubic-bezier(0.40, 0.00, 1.00, 1.00)` | salidas (elementos que se van; poco uso, preferir fade+instant) |
| `--ease-in-out` | `cubic-bezier(0.40, 0.00, 0.20, 1.00)` | estados bidireccionales (acordeón, toggle, reflow, línea de progreso) |
| `--ease-emphasized` | `cubic-bezier(0.16, 1.00, 0.30, 1.00)` | momentos de verdad (check de gate, veredicto aprobado, acta E-26) |
| `--ease-linear` | `linear` | shimmer de skeleton (barrido de brillo) |
| Regla de propiedad | — | **solo `transform`, `opacity`, `color`, `background-color`, `box-shadow`, `filter`** (compositor-only) |

**Tabla de efectos (estándar 100-400ms; excepción única 800ms; todo desactivable bajo reduce-motion):**

| Efecto | Duración | Easing (cúbica) | Motivo | Superficie | reduce-motion |
|---|---|---|---|---|---|
| Hover link (subrayado reveal) | 150ms | `ease-out` | Feedback ligero; nunca mover el texto | público + portal + nav ERP | instante (color/opacity) |
| Hover botón (sombra+fondo) | 100ms | `ease-out` | Feedback inmediato sin competir con la acción (R10) | las 3 | instante |
| Hover fila tabla Familia A | 100ms | `ease-out` | Solo fondo; cero movimiento en tabla densa (R34, CLS) | ERP | instante |
| Hover tarjeta kanban | 150ms | `ease-out` | Elevación + `scale 1.02`; la tarjeta es acción | ERP P-01/P-16 | instante |
| **Hover tarjeta portafolio** | **800ms** | `ease-in-out` | **Literal corpus: `scale-103` en 0.8s**; fotografía "respira" (`destilacion:629`) | público F-01 | sin zoom (estática) |
| Hover CTA WhatsApp | 150ms | `ease-out` | Sombra + `scale 1.02`; sin pulso (R20/R10) | público F-01 | instante |
| Press botón | 100ms | `ease-out` | `scale 0.98`, solo `pointer:fine` | las 3 | instante |
| Anillo de foco | 0-100ms | `ease-out` | 2px + 3:1 inmediato (R39); nunca "respira" | las 3 | se mantiene (obligatorio) |
| Dropdown/menú abrir | 150ms | `ease-out` | fade + `translateY(4-6px)` | ERP | fade solo |
| Acordeón progressive disclosure (P10) | 200ms | `ease-in-out` | `grid-rows 0fr→1fr`, altura real, cero CLS | ERP | instante |
| Modal entrada | 200ms | `ease-out` | backdrop fade + `scale 0.98→1` | ERP + portal | fade solo |
| Modal salida | 150ms | `ease-in` | fade rápido (salir es inmediato) | ERP + portal | instante |
| Drawer/sidebar (R33, solo móvil) | 300ms | `ease-out` | slide 24px de la nav lateral | ERP | sin slide (crossfade) |
| Badge de gate morph | 150ms | `ease-out` | crossfade icono+texto+color como UNIDAD (R14) | ERP | instante |
| Highlight de panel post-gate | 400ms | `ease-out` | Resplandor suave único, sin repetición (R19 post-commit) | ERP P-08/P-14/P-17/P-09/P-20 | instante |
| Check "pop" de verificado | 200ms | `emphasized` | `scale 0.8→1` + opacity (momento de verdad) | ERP P-14 + portal F-07 | instante |
| Línea de progreso stepper | 400ms | `ease-in-out` | fill del tramo + avance del nodo (P-06/F-07) | ERP + portal | instante |
| Reflow cronograma (E-33) | 400ms | `ease-in-out` | Deslizamiento de la línea interna movible; la contractual NO se mueve (R03, `d3_ui_b2_1:73`) | ERP P-09 | instante (solo recálculo) |
| Ruta SPA del ERP | 150ms | `ease-out` | Crossfade de opacidad; NUNCA slide entre tablas | ERP | instante |
| Skeleton shimmer | 1200ms | `linear` | Barrido de brillo suave; geometría = layout final (P27) | las 3 | estático |
| Spinner en botón (acción en vuelo) | continuo | `linear` | Progreso indeterminado; SIEMPRE con label ("Guardando…") | ERP | label estático |
| Timer SLA (E-50/E-34) | — | — | Cuenta regresiva `tabular-nums`; el número es estado (R17), no decoración | ERP P-01/P-10 | el número sigue (sin pulso) |
| Entrada hero público | 300ms | `ease-out` | fade-up de contenido; **nunca antes del LCP** (`destilacion:619`) | público F-01 | instante |
| Toast entrada | 200ms | `ease-out` | fade + 8px (sonner) | las 3 | fade solo |
| Toast salida | 150ms | `ease-in` | fade | las 3 | instante |
| Panel "Requiere tu decisión" (R20) | 200ms | `ease-out` | fade + 8px al tope; no roba foco (`d3_ui_b2_1:231`) | ERP P-20 | instante |
| Empty state → primera acción (P26) | 200ms | `ease-out` | CTA entra sutilmente; el empty nunca "espera" | las 3 | instante |

---

### 3. Transiciones de estado (los 5 gates + UI general)

**Reglas de oro de toda transición de estado:** (a) es **post-commit** (R19 — el servidor confirma, luego se anima; `d3_ui_b2_1:99`); (b) siempre icono+texto+color (R14, `:89`); (c) los textos usan el vocabulario R02 ("Aprobar schema", "Recibir verificado", "Marcar verificado", "Registrar veredicto", "Reprocesar módulo X" — `d3_ui_b2_1:235`); (d) el guard visible antecede al cambio (R16, `:91`); (e) bajo reduce-motion todo cae a instante (el contenido cambia igual, sin gesto).

| Gate / Estado | Pantalla | Transición | Qué anima | Cómo se comunica el cambio (icono+texto+color, nunca solo color) | Timing | reduce-motion | Reglas |
|---|---|---|---|---|---|---|---|
| **E-18** schema → **aprobado** | P-08 | `pendiente` → `aprobado` | Badge crossfade + highlight del panel + toast success | check + "Schema aprobado" + `success`; el guard "Falta veredicto de schema" desaparece (R16) | badge 150ms · highlight 400ms | instante | R16, R19, R05, R14 |
| **E-18** schema → **rechazado/reproceso** | P-08 | `pendiente` → `negativo` | Badge crossfade + panel error + notificación; si hay reproceso, modal R18(b) | X + "Schema rechazado — ver motivo" + `danger`; reproceso E-54 con efecto nombrado ("Reprocesar módulo X recalcula…") | badge 150ms · modal 200ms | fade | R18, R16, R14 |
| **E-21** recepción → **recibido_verificado** | P-14 | `en espera` → `verificado` | Cascade de checkmarks por ítem (≤50ms entre ítems, máx 300ms total, solo si ≤8 ítems) + badge | check + "Recibido verificado" + `success`; el botón "Recibir verificado" se habilita al pasar el guard (R12 checklist) | cascade 50ms/ítem | instante | R12, R19, R14 |
| **E-21** ítem pendiente | P-14 | `—` (estado persistente) | Ninguna (badge estático) | alerta + "En espera de ítem" + `warning` | estático | estático | R14 |
| **E-24** calidad → **veredicto positivo** | P-17 | `citado` → `aprobado` | Badge crossfade + highlight + toast success; citación previa con CTA prominente (R10) | check + "Calidad aprobada" + `success` | 150/400ms | instante | R19, R10, R14 |
| **E-24** calidad → **negativo/reproceso** | P-17 | → `negativo` | Modal R18(b) con efecto nombrado + badge danger; la señal **E-23** entrante avisa con toast `role="alert"` | X + "Veredicto negativo — Reprocesar módulo X" + `danger` | modal 200ms | fade | R18, R14 |
| **E-33** desfase → **aplicado** | P-09 | `sin desfase` → `aplicado` | **Reflow de la línea interna movible** (400ms); la línea contractual permanece estática e inmutable (R03); panel de composición causal (P10) | reloj + "Desfase aplicado" + causa: interna `warning` / externa o cambio de contrato `info` (`d3_ui_b2_1:177`); el recálculo es SOLO línea interna (`d3_ui_consolidado.md:97`) | reflow 400ms | instante (solo recálculo) | R19, R40, R03, R14 |
| **E-20** caja → **bloqueante** | P-20 | `ok` → `bloqueada` | Panel "Requiere tu decisión" entra al TOPE (R20) + badge; es la única "animación de urgencia" permitida y es de entrada única | candado + "Caja bloqueada" + `danger` + la acción que resuelve a un clic (R20) | panel 200ms | instante | R20, R10, R05, R14 |
| **E-20** caja → **liberada** | P-20 | `bloqueada` → `liberada` | Panel colapsa (200ms) + badge success | check + "Pago liberado" + `success` | 200ms | instante | R20, R14 |
| **UI** — Mapa de gates (stepper) | P-06 | gate actual `en curso` | Nodo del gate actual con icono+texto "en curso"; los 5 con deep link; **sin animación de avance persistente** (el estado es informativo, no decorativo — P03) | círculo + "Schema en curso" + `info`; verificado con check + `success` | estático | estático | R14, P03 |
| **UI** — E-60 desenlace feliz → portal | F-07 | nueva comunicación frontstage | Badge + highlight suave del hito; el cliente SOLO ve cambio positivo (R03/I-034) | check + "Adelantamos tu entrega" + `success` | 400ms | instante | R03, R14 |
| **UI** — E-34 novedad crítica | P-10 | nueva novedad | Notificación `role="alert"` + fila nueva entra; timer SLA visible desde el primer segundo (R17) | alerta + "Novedad crítica — SLA 5-24 h" + `warning` + cuenta regresiva | entrada 200ms · timer continuo | instante | R17, R14 |
| **UI** — Borrador vs compromiso (D3) | P-04, P-07 | autoguardado | Indicador "Guardado" aparece UNA vez (estático, sin animación); el label "Borrador" visible sin colores de confirmación (`d3_ui_b2_1:245`) | texto + "Borrador" neutro (sin `success`) | estático | estático | D3, R26 |

**Regla transversal de badges:** el badge se anima como **unidad** (crossfade del conjunto icono+texto+color en 150ms), nunca por capas separadas — evita lecturas intermedias ilegibles y respeta R14.

---

### 4. Micro-interacciones

| Micro-interacción | Disparador | Qué pasa | Restricciones | Superficie/pantalla |
|---|---|---|---|---|
| **Hover link** | `(hover:hover)` | Subrayado reveal 150ms `ease-out`; el color cambia solo en presencia del texto | Equivalente `:focus-visible` (R36); nunca mover el texto (CLS) | público, portal, nav ERP |
| **Hover botón** | `(hover:hover)` | Fondo/sombra 100ms; `scale 1.02` solo en botones grandes (≥48px) | El botón primario dorado no "compite" (R10); target ≥48px+8px (R35) | las 3 |
| **Hover fila tabla (Fam A)** | `(hover:hover)` | Solo cambio de fondo 100ms; la fila es accionable → menú de acciones visible con `:focus-visible` equivalente (R36) | **Cero translate/scale** en tablas densas (R34); menú operable por teclado y tap (nunca solo hover) | ERP P-13/P-14/P-20/P-21/P-22 |
| **Hover tarjeta kanban** | `(hover:hover)` | Elevación de sombra + `scale 1.02` 150ms | La tarjeta muestra SLA timer siempre visible (R17); hover nunca oculta el estado | ERP P-01/P-16 |
| **Hover portafolio 16:9** | `(hover:hover)` + `pointer:fine` | **`scale 1.03` en 800ms `ease-in-out`** (`destilacion:629`); caption sube 300ms | Solo frontstage; `aspect-ratio` reservado (R37, cero CLS); `:focus-visible` sobre la tarjeta enlazada; reduce-motion = imagen estática | público F-01 |
| **Focus visible** | Teclado/tap | Anillo 2px + 3:1 (`d3_ui_b2_1:139`), aparece ≤100ms; modal con focus trap y Esc de salida; retorno al trigger al cerrar (`d3_ui_b2_1:232`) | Nunca `outline:none` sin reemplazo; `scroll-padding-top` = altura del sticky (2.4.11) | las 3 |
| **Press / click** | `pointer:fine` | `scale 0.98` 100ms en botones; feedback inmediato de avance del embudo (R29 "un solo toque") | Solo en puntero fino; en táctil, el estado se confirma por el cambio de contenido, no por escala | las 3; P-01/P-19 |
| **Drag & drop kanban (P-01/P-16)** | Arrastre | Tarjeta: `scale 1.03` + sombra elevada, sigue al puntero por `transform` (cero CLS); columna destino: borde + fondo sutil 150ms; **placeholder que reserva espacio** antes del drop (sin él, el drop causa CLS) | **Alternativa teclado obligatoria (2.5.7)**: mover con menú/flechas (`d3_ui_b2_1` R36 + `d4_a2:210`); `aria-grabbed`/`aria-live` anuncian el resultado; DnD es mejora progresiva, el teclado funciona sin él | ERP P-01/P-16 |
| **Columnas del kanban** | Colapsar/reordenar | Colapso de columna 200ms `ease-in-out` (grid-rows, cero CLS) | Nunca ocultar estado con `display:none` en móvil (R37); el estado de las tarjetas sigue visible | ERP P-01 |
| **Progressive disclosure (P10)** | Click en "detalle" | Acordeón 200ms `ease-in-out`; resumen de una línea arriba, detalle expandible (R08/R10) | Altura real (grid-rows), no `max-height` mágico; reduce-motion = instante | ERP P-02/P-09/P-21 |
| **Checkmark de checklist E-21** | Click en ítem | Check "pop" 200ms `emphasized` | Constraint de checkbox (R12); estado por ítem icono+texto | ERP P-14 |

---

### 5. Estados de carga

**Regla única: nunca layout shift (P27, CLS<0,1 — `d3_ui_b1_1:98`, `destilacion:619`).**

| Estado | Qué se muestra | Geometría | reduce-motion | Pantallas |
|---|---|---|---|---|
| **Primera carga de pantalla ERP** | Skeleton del layout FINAL con `aria-busy="true"` (P27); shimmer 1200ms `linear` muy suave | **Familia A**: filas de tabla densas (36-40px) con columnas reservadas (R34); **Familia B**: cards con `aspect-ratio` (R37) | shimmer estático (relleno neutro); la geometría se conserva (no hay "apagado" de skeleton) | P-13/P-14/P-20/P-21/P-22 (A); P-01/P-02/P-06/P-25 (B) |
| **Carga de fotos (E-41, P-26/P-07)** | Skeleton con `aspect-ratio` reservado + caption | Proporción exacta de la foto (R37, `destilacion:615`) | estático | P-26, P-07, P-19, F-07 |
| **Carga de landing público** | Hero sin animación de entrada ANTES del LCP (<2,5s, `destilacion:619`); después, fade-up 300ms del contenido | Imágenes WebP/AVIF con `fetchpriority="high"` en LCP | instante | F-01, F-02 |
| **Acción en vuelo (botón)** | Spinner pequeño (14-16px) DENTRO del botón + label ("Guardando…", "Procesando…") con `aria-busy`; **no es spinner de página** (RV-04, `d4_a2:296`) | Sustituye al icono del botón; el label se mantiene para no cambiar ancho (CLS) | label estático sin spinner | P-04 autosave, P-08 veredicto, P-20 pago |
| **Operación larga (recálculo E-33, caja)** | Barra de progreso sutil al tope del panel + mensaje; sin bloqueo de la tabla (decisión-first R20) | Barra 2px `transform` scaleX (compositor-only) | barra estática | P-09, P-20 |
| **SPA navigation entre rutas del ERP** | Crossfade de opacidad 150ms `ease-out` a nivel de página; **nunca slide entre tablas** (R34) | `View Transitions` opcional → `DECISION_DISEÑO` (DM-02) | instante | todo el ERP `/app/erp/*` |
| **Optimistic update** | SOLO en bucles reversibles de borrador (cotizador P-04, retoma P-07) y toggles triviales (filtros, expand): reflejo inmediato 150ms con "Deshacer" disponible (P07/R15) | **NUNCA** en gates, dinero, ni recálculo de cronograma (R05/R19 — la matemática es del servidor) | instante | P-04, P-07 |
| **Offline / red inestable (campo)** | Banner "Sin conexión — se guardó localmente" con icono + botón Reintentar; estático, sin animación (R27/P16) | Icono+texto (R14); no roba foco | estático | P-07, P-04, P-02 (comercial en campo) |

---

### 6. Feedback crítico (toasts, destructivas, SLA, notificaciones)

| Canal | Disparador | Comportamiento | a11y | Reglas |
|---|---|---|---|---|
| **Toast éxito/info** | Verdicto de gate aprobado, guardado, pago OK | sonner: entrada 200ms `ease-out` (fade+8px), salida 150ms; duración 4s; **timeout pausa en hover/focus (2.2.1)**; botón cerrar ≥48px; no roba foco (`d3_ui_b2_1:231`) | `role="status"`; icono+texto | R14, P07 |
| **Toast error/SLA** | Fallo de acción, E-34, E-23, E-20 | Igual que éxito pero **persistente hasta cerrar** (un error que desaparece solo pierde al operador) | `role="alert"`; icono+texto | R14, B2-1:231 |
| **Toast con Deshacer** | Captura en borrador (P04/P07), reasignación, cambios reversibles | acción "Deshacer" dentro del toast, ventana ~5s, **el undo deja traza de auditoría** (R06, `d3_ui_b2_1:226,233`) | Botón ≥48px; foco puede ir al botón con teclado | P07/R15 |
| **Confirmación destructiva (R18 nivel b)** | Reprocesar módulo E-54, rechazar gate E-24, reclasificar causa E-33, descartar lead | Modal `role="dialog"`+`aria-modal`: entrada 200ms (backdrop fade + scale), **sin shake**; efecto exacto nombrado ("Reprocesar módulo X recalcula el cronograma y las comisiones"); botón destructivo en rojo **no auto-enfocado**; nunca "¿Estás seguro?" (`d3_ui_b2_1:98`) | focus trap, Esc cierra, retorno al trigger (`d3_ui_b2_1:232`) | R18, P28 |
| **Type-to-confirm (nivel c)** | Firmar contrato E-13, anular cobro/compensación, cierre de contrato (`d3_ui_b2_1:243`) | Campo de confirmación aparece sin animación; el botón se habilita al coincidir el texto | El movimiento NO es el único feedback: el habilitado del botón + texto lo confirman | R18, D1 |
| **Timer SLA (R17)** | E-50 (5 min, tarjeta de lead P-01) y E-34 (5-24 h, novedad P-10) | Chip con **cuenta regresiva `tabular-nums`** (sin layout shift); al acercarse al límite: icono+texto+color warning (R14), **sin pulso**; al vencer el sistema escala SOLO y registra el incumplimiento (R04/R17, `d3_ui_b2_1:92`) | El número es estado → **sigue contando bajo reduce-motion**; solo el pulso decorativo se apaga | R17, R14, R04 |
| **Notificación push entrante** | E-23 señal de calidad, E-34 aviso, E-60 positivo | Aparición vía toast (`role="alert"` crítico / `status` info) + actualización del contador del centro de notificaciones (el contador cambia, no rebota) | Icono+texto; foco solo si el usuario invoca el centro | R14 |
| **Panel "Requiere tu decisión" (R20)** | E-20 bloqueante, E-33 desfase, E-29 atraso 12 días | Entra al tope 200ms (fade+8px); la acción que resuelve a un clic; no pulsa | `role="region"` con etiqueta; no roba foco (`d3_ui_b2_1:231`) | R20, R10 |

---

### 7. Reduced motion (`prefers-reduced-motion`)

**Regla obligatoria y de primer orden (H11, `d3_ui_b2_1:220,293`).** Implementación: utilitarios Tailwind v4 `motion-safe:` / `motion-reduce:` sobre los mismos tokens; un solo overrides global. Lo que sigue es la tabla de apagado con justificación:

| Aspecto | Estado normal | Bajo `prefers-reduced-motion` | Justificación |
|---|---|---|---|
| Todas las transformaciones (`scale`, `translate`, `rotate`) | animadas | **ninguna** (estado final sin transición) | Vestibular; el contenido no depende del gesto |
| Crossfades / fades de entrada | 100-400ms | **instante** (opacity 0→1 sin duración) | El cambio de contenido es información, no espectáculo |
| Hover `scale-103`/0,8s del portafolio | zoom lento (`destilacion:629`) | **imagen estática** (el caption sigue visible) | Es el efecto más intenso del sistema; se apaga entero |
| Shimmer de skeleton | barrido 1200ms | **relleno estático neutro** | El shimmer es decorativo; la geometría (sin CLS) se conserva |
| Spinner de acción en botón | girando + label | **solo label** ("Guardando…") | El estado de progreso se comunica por texto |
| Drag&drop kanban (P-01/P-16) | tarjeta sigue al puntero + placeholder | **snap directo** (sin transform animado); alternativa teclado intacta (2.5.7) | La acción se mantiene funcional sin el gesto |
| Reflow del cronograma (E-33) | deslizamiento de la línea interna | **recálculo instantáneo** + resaltado estático del desfase | La línea contractual jamás se mueve en ningún modo (R03) |
| Highlight de panel post-gate | resplandor 400ms | **badge/icono/texto cambian al instante** | El cambio de estado permanece (R14), sin el resplandor |
| Pulso / nudge decorativo (CTA, SLA) | (default sin pulso) | **no existe** (nada de esto se anima) | Evitamos "motion-for-motion" desde el diseño |
| Ruta SPA | crossfade 150ms | **instante** | Navegación sin gesto |
| **Lo que NO se apaga** | — | Timer SLA (el número sigue contando), anillo de foco visible, barra de progreso estática, sticky headers, scroll de página, entrada de imágenes lazy | Son información/estado/navegación, no decoración; apagarlos rompería la función |
| `prefers-contrast` (mejora) | — | Aplica como refuerzo de contraste, no como animación (H11 nota, `d3_ui_b2_1:220`) | Mejora opcional, no bloquea |

**Corolario de diseño:** ninguna superficie puede tener contenido cuyo único canal de comunicación sea la animación. Si al apagar el motion algo deja de entenderse, es un bug de diseño (viola R14).

---

### 8. Clasificación de hallazgos

#### CORRECCION_VISUAL (el diseño propuesto contradice identidad o principios aprobados)

| ID | Hallazgo | Fuente |
|---|---|---|
| CM-01 | **Slide/translate de tablas densas o de sus filas** (Familia A) viola R34 y el presupuesto CLS — prohibido: hover solo fondo | `d3_ui_b2_1:129` (R34); `destilacion:619` |
| CM-02 | **Color solo como feedback de estado** (ej. "el badge se puso verde") sin icono/texto — viola R14 y WCAG 1.4.1 | `d3_ui_b2_1:89` |
| CM-03 | **Transiciones de gate disparadas por focus/cambio de input** — viola R19 (3.2.1/3.2.2); el feedback es post-commit | `d3_ui_b2_1:99` |
| CM-04 | **Parallax, partículas, marquees, botones magnéticos, "shake" de error** — ruido que contradice al Creador Experto (sobriedad artesanal) y al anti-bloater | `destilacion:267-269`; `diamante4_metodologia.md:86` |
| CM-05 | **Pulso/re-brillo infinito en el CTA primario dorado** — compite con la acción primaria y con decision-first (R10/R20) | `d3_ui_b2_1:85,105` |
| CM-06 | **Hover sin equivalente `:focus-visible`** (menús de fila, tarjetas, portafolio) — viola R36 | `d3_ui_b2_1:131`; `destilacion:618` |

#### GAP_VISUAL (token/primitiva/familia que falta)

| ID | Hallazgo | Fuente |
|---|---|---|
| GM-01 | **No existe escala de duraciones/easings de motion** en el corpus (0 traza; el único literal es `scale-103`/0,8s) — este pase define los valores; A3 los formaliza como `--dur-*`/`--ease-*` | `destilacion:629`; `diamante4_metodologia.md:45,100` |
| GM-02 | **No existe token/estado visual para "SLA en riesgo"** ni para "señal push entrante" (E-23/E-34) — chip con icono+texto+countdown, entrada única | `d3_ui_b2_1:92` (R17) |
| GM-03 | **No existe primitiva de drag&drop de kanban** con estados visuales (P-01/P-16; hereda GV-01 de A2) — este pase define los estados del DnD; A4 formaliza la primitiva | `d4_a2:282`; `d3_ui_consolidado.md:30,59` |
| GM-04 | **Sin spec de feedback del recálculo del cronograma doble** (P-09) — reflow de la línea interna; primitiva timeline doble pendiente (GV-02/03 de A2) | `d4_a2:283-284`; `d3_ui_consolidado.md:47,97` |
| GM-05 | **Sin skeleton por geometría** (tabla Familia A vs cards Familia B) — este pase define la geometría; A4 la primitiva | `d3_ui_b2_1:129`; `d3_ui_b1_1:98` (P27) |
| GM-06 | **Sin token de "celebración contenida"** para momentos de verdad (E-26 acta, F-07) — default propuesto: check emphasized + glow dorado sutil | `d4_a2:155`; `d3_ui_b1_2:42` |

#### RUIDO_VISUAL (estilo/decoración sin función)

| ID | Hallazgo | Fuente |
|---|---|---|
| RM-01 | **Spinner genérico como carga de página** en vez de skeleton del layout final (refuerza RV-04 de A2) | `d4_a2:296`; `d3_ui_b1_1:98` (P27) |
| RM-02 | **"Shake"/"bounce" en errores y confirmaciones destructivas** — ruido vestibular; el modal nombra el efecto, no lo dramatiza | `d3_ui_b2_1:98` (R18) |
| RM-03 | **Stagger largo de filas de tabla** (entrada escalonada de muchas filas) — ruido y riesgo de leer filas a medias; se limita a ≤50ms/ítem, máx 300ms, solo ≤8 ítems (checklist E-21) | `d3_ui_b2_1:129` (R34); este pase |
| RM-04 | **Animación de conteo de KPIs** (números que "cuentan" hasta el valor) — la UI muestra el cálculo, no lo reproduce (R05); el número salta al valor final | `d3_ui_b2_1:75` (R05), `:106` (R21) |

#### DECISION_DISEÑO (requiere decisión de gusto/negocio del Supervisor — no inventar)

| ID | Hallazgo | Fuente |
|---|---|---|
| DM-01 | **¿Confetti/celebración en el cierre de venta o el acta E-26?** (misión explícita). Default propuesto: **celebración contenida** (check emphasized + glow dorado + texto de cierre), sin confetti — coherente con "lujo artesanal, anti-esnob" | `destilacion:267-269`; `d4_a2:155` |
| DM-02 | **Uso de View Transitions API** para el crossfade de rutas del ERP (afecta fallback de navegación y compatibilidad) — la PoC decide | `diamante4_metodologia.md:99` |
| DM-03 | **"Nudge" de atención de una sola vez** (400ms) en el CTA WhatsApp del frontstage (F-01) — decorativo; puede costar sobriedad; canal de conversión real (H8) | `d3_ui_b1_2:42`; `marco_estrategia_mercado.md:54` |
| DM-04 | **Duración del reflow del cronograma (400ms)** y si el movimiento de fechas debe animarse o solo recalcarse con resaltado — depende del peso que el negocio le dé al "ver el cronograma moverse" | `d3_ui_consolidado.md:97` (E-33) |
| DM-05 | **¿Pulso de SLA "en riesgo" permitido en el ERP?** Default: NO (badge estático icono+texto+countdown). Si el negocio quiere la urgencia visual, es excepción con 2.2.2 y reduce-motion obligatorio | `d3_ui_b2_1:92` (R17) |

#### DIFERIDO (se registra, no se diseña ahora)

| ID | Hallazgo | Fuente |
|---|---|---|
| DF-01 | **Motion de la tienda F-04/F-05/F-06** (frontera DIFERIDO) — incluye carrito, checkout y micro-interacciones de catálogo | `d3_ui_consolidado.md:80-82,86` |
| DF-02 | **Micro-interacciones de contenido de marca** (P-33 testimonios, reel/redes del Sistema de Proyectos) — canal único Reel, piezas en estado Idea | `d3_ui_consolidado.md:86`; `destilacion:731-732` |

**Conteo:** 6 `CORRECCION_VISUAL` · 6 `GAP_VISUAL` · 4 `RUIDO_VISUAL` · 5 `DECISION_DISEÑO` · 2 `DIFERIDO` = **23 hallazgos**.

---

### 9. Trazabilidad de afirmaciones clave

| Afirmación | Fuente (archivo:línea) |
|---|---|
| Único literal de motion: portafolio 16:9 hover `scale-103` en 0.8s | `destilacion_docs_veta.md:629`; `d4_a2:135` |
| `prefers-reduced-motion` obligatorio (WCAG 2.3.3) y GAP H11 | `d3_ui_b2_1:220,293`; `d3_ui_b1_2:204` |
| CWV: LCP<2,5s · INP<200ms · CLS<0,1 | `destilacion_docs_veta.md:619` |
| Hover solo bajo `(hover:hover)` | `destilacion_docs_veta.md:618`; R36 `d3_ui_b2_1:131` |
| R14 estado icono+texto+color, nunca solo color | `d3_ui_b2_1:89` |
| R16 guard visible; R17 SLA temporizadores | `d3_ui_b2_1:91,92` |
| R19 gates no disparan por foco/input; recálculo tras guardar | `d3_ui_b2_1:99` |
| R18 confirmación destructiva 3 niveles; botón rojo no auto-enfocado | `d3_ui_b2_1:98`; `d3_ui_b1_1:99` (P28) |
| R20 decisión-first; R34 dos familias de tablas | `d3_ui_b2_1:105,129` |
| R39 foco 2px+3:1; focus trap modal; scroll-padding-top | `d3_ui_b2_1:139,232` |
| R05 matemática en servidor (prohíbe optimistic en dinero/gates) | `d3_ui_b2_1:75` |
| P27 skeleton sin layout shift, `aria-busy`; RV-04 spinners→skeletons | `d3_ui_b1_1:98`; `d4_a2:296` |
| P07 deshacer reversible + undo con traza (~5s) | `d3_ui_b1_1:63`; `d3_ui_b2_1:226,233` |
| R27/P16 offline "sin conexión — se guardó localmente" | `d3_ui_b2_1:117`; `d3_ui_b1_1:77` |
| Convenciones de toast: `role=status` vs `role=alert`, pausa en hover/focus | `d3_ui_b2_1:231` |
| Glosario de verbos R02 ("Aprobar schema", "Recibir verificado"…) | `d3_ui_b2_1:72,235` |
| Mapeo de estado de gate → token (success/danger/warning/info) | `d3_ui_b2_1:173-178` |
| Concepto por superficie y motion por superficie | `d4_a2:106-160,185` |
| "Celebración contenida" en acta E-26; entrega = "segundo contrato" | `d4_a2:155`; `d3_ui_b1_2:42` |
| DnD con alternativa teclado 2.5.7 (P-16) | `d4_a2:210`; `d3_ui_consolidado.md:59` |
| Kanban P-01/P-16 como GAP GV-01 | `d4_a2:282`; `d3_ui_consolidado.md:30,59` |
| Gates E-18/E-21/E-24/E-33/E-20 con predicados y pantalla | `d3_ui_consolidado.md:92-98` |
| Contrato de salida de motion del D4-A5 | `diamante4_metodologia.md:100` |
| Vocabulario de hallazgos del diamante 4 | `diamante4_metodologia.md:83-89` |

---

## Trazabilidad / Notas para el Orquestador

1. **Serialización:** este pase corrió en la Ola 2 en paralelo con A3 (tokens). **A3 debe formalizar como tokens `--dur-*` (0/100/150/200/300/400/800ms) y `--ease-*` (out/in/in-out/emphasized/linear)** los valores propuestos en la sección 2, más la regla compositor-only (solo `transform`/`opacity`/`color`/`background-color`/`box-shadow`/`filter`). Si A3 fija valores distintos, A4 reconcilia.
2. **Qué decide A4 (primitivas):** GM-03 (estados visuales del drag&drop de kanban P-01/P-16), GM-04 (primitiva timeline doble de P-09 con su reflow), GM-05 (skeleton por geometría Fam A/B), GM-02 (chip de SLA en riesgo). Este pase les entrega el comportamiento; A4 los especifica como componentes.
3. **Qué decide la PoC** (`diamante4_metodologia.md:101`, pantallas P-04/P-09/F-01): (a) si el crossfade de rutas usa **View Transitions API** (DM-02); (b) la duración real del **reflow del cronograma** (DM-04) y si se anima o se recalcula con resaltado; (c) si el shimmer de skeleton se conserva o se baja a estático por defecto; (d) el comportamiento del `scale-103`/0,8s del portafolio en F-01 con reduce-motion (debe quedar estático y verificado en pantalla).
4. **Bloqueadores que escalan al Supervisor (DECISION_DISEÑO):** DM-01 (confetti vs celebración contenida en E-26/cierre de venta), DM-03 (nudge del CTA WhatsApp), DM-05 (pulso de SLA). No bloquean el diseño de A4/PoC (se aplica el default razonado), pero sí el corte.
5. **GAP de proceso heredado:** el glosario único de estados/verbos (H07, `d3_ui_b2_1:289`) debe existir antes de escribir los labels finales de los badges de gate; este pase usa los verbos ya listados en `d3_ui_b2_1:235` ("Aprobar schema", "Recibir verificado", "Marcar verificado", "Registrar veredicto", "Reprocesar módulo X").
6. **Restricciones respetadas:** a11y no negociable (`prefers-reduced-motion` siempre, focus visible siempre, R14 nunca solo color, textos de R02); el motion del ERP no interfiere con decision-first (R20) ni con tablas densas (R34); cada pantalla/gate citado con su ID (P-XX/E-XX). No se tocó ningún otro archivo; este pase solo escribe `d4_a5_motion_efectos.md`. No se inventó marca: lo incierto está en `DECISION_DISEÑO` (`diamante4_metodologia.md:32,87`).
7. **Verificación del goal A5** (`diamante4_metodologia.md:126`): motion definido con reduce-motion y sin ambigüedad de duración/easing — 27 efectos con duración/easing exactos, 13 transiciones de estado de gates/UI, 23 hallazgos clasificados.

## Registro

- Fecha: 2026-08-04 · Pase D4-A5 (Ola 2 del Diamante 4, paralelo con A3), lente motion e interacción.
- Archivo de salida único: `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d4_a5_motion_efectos.md` (este archivo).
- 27 efectos · 13 transiciones de estado (5 gates + UI) · 23 hallazgos (6 CV · 6 GAP · 4 RUIDO · 5 DD · 2 DIFERIDO).
- No se modificó ningún otro archivo; no se leyó el output de A3 (no existía al momento de la lectura — paralelo, fallback documentado).
