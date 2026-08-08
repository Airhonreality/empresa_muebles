# Diamante 4 · Metodología del sistema visual (diseño de la V3 "Veta Dorada Real")

**Qué es esto:** la especificación del diamante que define el **sistema visual** de la V3 ANTES de que Ola 7 escriba código. El Diamante 3 especificó **qué** se ve (34 pantallas, estructura, UX, responsividad); el Diamante 4 define **cómo se ve** (arte, estilo, tipografías, iconos, bordes, efectos, animaciones) — el nivel que Ola 7 consumirá como tokens y primitivas.

**Por qué va antes de Ola 7 (checkpoint del Supervisor, 2026-08-04):** el prototipo v2 se descartó y su "estilo simple" era deliberado, no un diseño. Codificar las 34 pantallas sin sistema visual sería rehacerlas después. Orden aprobado: **D4 → Ola 7 (F0-F9)**.

**El checkpoint humano** es el entregable final del D4. **No hay checkpoints intermedios**: cada loop cierra por su **goal**, verificado por un **auditor final independiente** (que no ejecutó el loop).

---

## Objetivo / alcance

Producir un sistema de diseño operativo y verificable en código:

1. **Design tokens** (color, tipografía, spacing, radios, bordes, sombras, z-index, motion) — la fuente única de estilo.
2. **Primitivas UI** (botón, input, tabla, tarjeta, modal, kanban, stepper, badge, tooltip…) con especificación visual por estado.
3. **Selección de librerías/artes** (tipografías, iconos premium, efectos/animaciones) con justificación y contraste contra el tono de marca real (`destilacion_docs_veta.md`, `marco_estrategia_mercado.md` §5).
4. **Concepto visual por superficie:** ERP (denso, operativo) vs sitio público (emocional, de venta) vs portal cliente (claro, de confianza).
5. **Prueba de concepto codificada** (2-3 pantallas representativas) para validar que el sistema se implementa bien — la verificación mecánica del diamante.

**No es rediseño funcional:** no se tocan pantallas, gates, rutas ni datos del Diamante 3. Solo su piel.

---

## Gobernanza global (heredada del método D3)

- Cada sub-agente es `opencode` **general** con **loop interno de 3 iteraciones** (bruta → autocrítica → refinamiento).
- Cada sub-agente **SOLO lee** sus fuentes y **SOLO escribe** su archivo de salida (serialización).
- El Orquestador audita formato/trazabilidad entre olas, consolida, y aplica correcciones SOLO con el veredicto del auditor final.
- **Reapertura:** si el auditor rechaza, se reabre solo el pase afectado (loop focalizado, máx 2 veces).
- Trazabilidad obligatoria: `archivo:línea` en TODO hallazgo. Sin traza no es hallazgo.
- Escepticismo: no se inventa estilo de marca; si un punto depende del gusto del negocio no escrito, se marca `DECISION_DISEÑO` y se documenta para el Supervisor.
- **Regla de marca permanente** (heredada de t-034): cuando el material previo (`DOCS VETA DORADA`) contradiga al comportamiento/datos, **gana la evidencia de primera mano del Supervisor**.

---

## Reglas de serialización (archivos de salida únicos)

| Pase | Archivo de salida | Fuentes de entrada |
|---|---|---|
| D4-A1 | `arnes/diagnostico/pasadas/d4_a1_auditoria_visual.md` | `destilacion_docs_veta.md`, `marco_estrategia_mercado.md` §5, `d3_ui_b1_1_ux_ergonomia.md`, `d3_ui_b1_3_inv_clasificacion.md`, `logica_de_negocio.md` (identidad) |
| D4-A2 | `arnes/diagnostico/pasadas/d4_a2_concepto_superficies.md` | D4-A1 + `d3_ui_consolidado.md` (34 pantallas), `d3_ui_b2_1_destilacion_inv.md` |
| D4-A3 | `arnes/diagnostico/pasadas/d4_a3_tokens_visuales.md` | D4-A2 + `d3_ui_b1_2_responsive_design.md` (breakpoints) |
| D4-A4 | `arnes/diagnostico/pasadas/d4_a4_primitivas_ui.md` | D4-A3 + reglas R01-R40 de `d3_ui_b2_1_destilacion_inv.md` |
| D4-A5 | `arnes/diagnostico/pasadas/d4_a5_motion_efectos.md` | D4-A3 + principios a11y de `d3_ui_b1_1_ux_ergonomia.md` |
| D4-B1 | `arnes/diagnostico/pasadas/d4_b1_auditor_diseño.md` (auditor final) | D4-A1..A5 |
| Consolidado | `arnes/diagnostico/pasadas/d4_consolidado_diseño.md` | D4-B1 + D4-A1..A5 |
| Prueba | `arnes/diagnostico/pasadas/d4_prueba_concepto.md` (resultado de la PoC) | Consolidado + pantallas piloto |

**Fuentes maestras (rutas absolutas):**
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\destilacion_docs_veta.md` — marca, tono, tokens, NAP. **Fuente primaria de identidad.**
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\marco_estrategia_mercado.md` — sistema de marca (H1-H8, §5).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d3_ui_consolidado.md` — 34 pantallas, familias B3-1..B3-5, rutas.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d3_ui_b1_1_ux_ergonomia.md` — 28 principios.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d3_ui_b1_2_responsive_design.md` — 3 breakpoints.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d3_ui_b1_3_inv_clasificacion.md` — Familia A/B, inventario.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\pasadas\d3_ui_b2_1_destilacion_inv.md` — reglas R01-R40.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone_v3\arnes\diagnostico\logica_de_negocio.md` — identidad/posicionamiento.

---

## Formato de output (idéntico en cada pase)

```
# Pase D4-{X} — {nombre del lente} (subagente, loop de 3 iteraciones)

## Iteración 1 (bruta)
{resultado crudo del lente}

## Iteración 2 (autocrítica)
{qué sobrevive, qué cae y por qué; qué se escapó en la pasada 1}

## Iteración 3 (refinamiento final)
{resultado final depurado}

## Entregable (tabla o secciones, según el pase)
{...}

## Trazabilidad / Notas para el Orquestador
{archivo:línea de cada afirmación; qué decide el siguiente pase}
```

**Clasificación de hallazgos (vocabulario del diamante 4):**
- `CORRECCION_VISUAL` — el diseño propuesto contradice la identidad de marca o los principios UX aprobados.
- `GAP_VISUAL` — token/primitiva/familia que falta para cubrir una pantalla o estado de un gate.
- `RUIDO_VISUAL` — estilo/decoración sin función (anti-bloater: cada detalle visual justificado).
- `DECISION_DISEÑO` — requiere decisión de gusto/negocio del Supervisor (no inventar).
- `DIFERIDO` — se registra, no se diseña ahora (capa 2, tienda F-04/F-05/F-06).
- `IMPLEMENTABLE_OK` / `IMPLEMENTABLE_ROTO` — auditoría de la PoC contra el stack.

---

## Contrato de salida (el out que Ola 7 consumirá y el Supervisor revisará)

Cada entregable DEBE especificar, en tablas:

1. **Tokens (D4-A3):** `token | valor | escala | uso | contraste | pantalla donde se aplica`. Colores con contraste WCAG AA, tipografía con escala modular, radios/bordes/sombras con uso, spacing con escala de 4px.
2. **Primitivas (D4-A4):** `primitiva | estados (default/hover/active/disabled/error/loading) | variantes | medidas | token que usa | pantalla donde se aplica`. Cero ambigüedad: un desarrollador codifica el componente sin releer otra fuente.
3. **Librerías (D4-A2/A3):** tipografías (con peso/familia), librería de iconos (premium, con licencia justificada), estrategia de imágenes/madera (arte del negocio), sin depender de librerías que el stack v2 no tenga — se valida compatibilidad con Tailwind 4 / React 19 / Next 15.
4. **Motion (D4-A5):** `efecto | disparador | duración | easing | reduce-motion | pantalla donde se aplica`. Respeta `prefers-reduced-motion`.
5. **Prueba de concepto (D4-PoC):** 3 pantallas piloto codificadas — una por superficie: **P-04 (cotizador, ERP/comercial)** · **P-09 (cronograma doble, ERP/operativo)** · **F-01 (landing, sitio público)**. Verificación: `tsc` + `eslint` + `next build` limpios y screenshot visible.

---

## El grafo (orden de ejecución)

```
Ola 1 (paralelo):  A1 (auditoría visual) ‖ A2 (concepto por superficies)
Ola 2 (paralelo):  A3 (tokens) ‖ A5 (motion)          ← necesita A1+A2
Ola 3:             A4 (primitivas UI)                 ← necesita A3
Ola 4:             B1 (auditor final diseño) + consolidado  ← necesita A1..A5
Ola 5:             PoC (3 pantallas piloto) + verificación mecánica
Ola 6:             checkpoint humano del Supervisor
```

---

## Goals de cierre (definen los límites de cada loop)

| Loop | Goal de cierre (verificado por auditor independiente) |
|---|---|
| A1 | Auditoría visual: identidad de marca destilada (colores/tono/tipografía del corpus real), 0 invención sin traza |
| A2 | Concepto por superficie cerrado: ERP vs público vs cliente, con direcciones de diseño coherentes entre sí |
| A3 | Tokens completos y escalables: color+tipografía+spacing+radio+borde+sombra+z+motion, contraste AA, sin huecos para las 34 pantallas |
| A4 | Primitivas cubriendo toda la biblioteca UI de las 34 pantallas, por estado y variante, con token por propiedad |
| A5 | Motion definido con reduce-motion y sin ambigüedad de duración/easing |
| B1 | Veredicto APROBADO contra goals duros (coherencia de marca · cobertura 34 pantallas · contraste AA · a11y · implementabilidad en el stack) |
| PoC | 3 pantallas piloto con tokens reales, `tsc`/`eslint`/`next build` limpios |

---

## Checkpoints y registro

- **Checkpoint de apertura:** aprobado por el Supervisor (2026-08-04): el D4 se inserta ANTES de la Ola 7; ninguna pantalla se codifica sin consumir sus tokens.
- Ledger: t-091 en adelante (una tarea por pase + auditor + PoC).
- Registro de cierre: actualizar `arnes/estado.md` y `arnes/INDEX.md` con la ruta del consolidado D4.
