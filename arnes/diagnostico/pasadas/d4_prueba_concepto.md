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
