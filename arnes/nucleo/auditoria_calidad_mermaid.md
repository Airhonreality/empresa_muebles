# Auditoría de calidad — diagrama mermaid de `logica_de_negocio.md`

**Fecha:** 2026-08-08 · **Tipo:** auditoría (no mutación de schema) · **Alcance:** el diagrama tal como quedó tras 3 rondas de edición hoy (versión base + mini-diamante check_produccion + 3 opcionales)

**Por qué esta auditoría es distinta de las anteriores:** las auditorías previas de hoy verificaron *exactitud factual* (¿el diagrama coincide con las decisiones registradas?). Esta verifica *calidad como artefacto* — ¿sigue cumpliendo su propósito declarado ("líneas rojas = reprocesos/gaps reales... flujo completo de punta a punta") después de 3 rondas de ediciones acumuladas en la misma sesión?

---

## 1. Parámetros de ponderación (rúbrica)

| # | Dimensión | Peso | Qué mide |
|---|---|---|---|
| D1 | Fidelidad al negocio real (voz de Javier) | 30% | ¿El diagrama usa el lenguaje y el énfasis que Javier realmente usa, no una traducción técnica que pierde matiz? |
| D2 | Legibilidad / carga cognitiva | 25% | ¿Se puede escanear en ~30 segundos, como prometía el propósito original del diagrama? |
| D3 | Corrección técnica de mermaid | 15% | ¿Renderiza sin errores? ¿IDs sin colisión, sin referencias huérfanas? |
| D4 | Completitud vs. alcance declarado | 15% | ¿Cubre lo que el título promete ("flujo completo... de punta a punta")? |
| D5 | Mantenibilidad futura | 15% | Dado que hoy mismo este diagrama se desincronizó una vez, ¿la versión actual es más o menos frágil que antes? |

**Por qué estos pesos:** D1 pesa más que el resto porque el propósito explícito del documento entero es "diseño de empresa, no auditoría de repositorio" (línea 3 del propio archivo) — si el diagrama es técnicamente perfecto pero no habla como Javier piensa el negocio, falla en su función central. D2 pesa casi igual porque un mapa que nadie puede leer rápido deja de ser un mapa. D3-D5 pesan menos porque son necesarios pero no son el propósito — son condiciones de piso, no de éxito.

---

## 2. Auditoría ejecutada

### D1 — Fidelidad al negocio real: 22/30 (73%)

**Lo que sí coincide (verificado contra `logica_de_negocio.md`, no supuesto):**
- La secuencia O→P→Q→R coincide exactamente con la cita textual de Javier (línea 159): *"diseño+contrato → desarrollo → aprobación → compras → armado, en ese orden, sin atajos"*.
- El nodo O ("el más bloqueante") captura la esencia de su cita (línea 164): *"si desarrollo no está completo, no se clava un tornillo"* — aunque no la cita literal (ver hallazgo H2).

**2 hallazgos reales, no cosméticos:**

- **H1 — Se perdió la voz de Javier sobre el riesgo de caja al reemplazar `RED3` por `RED5`.** El `RED3` original decía *"RIESGO: retraso en ventas retrasa TODO el proyecto"*, que es casi cita directa de la línea 165: *"el timing de compras depende del flujo de caja... si hay atraso en ventas o entregas, compras se retrasa, y por lo tanto el proyecto entero se retrasa. **No es una excepción al orden, es una restricción externa**"*. El nuevo `RED5` ("GATE DE CAJA: gerente decide, mueve cronograma") describe el *mecanismo* correctamente, pero perdió el énfasis de Javier de que esta es **la única variable externa real** en una cadena por lo demás rígida — un matiz que él marcó explícitamente como importante, no incidental.
- **H2 — El nodo `T` (Entrega + acta) no refleja cómo Javier describe ese momento.** Línea 562, cita directa: *"como un **segundo contrato**"* — un *momento de verdad* (Carlzon, 1987) donde el cliente juzga toda la relación. El diagrama lo trata como un paso operativo más (`T{Entrega + acta}`), al mismo nivel visual que "Cobro" o "Garantía" — subestima la importancia que el propio dueño del negocio le da.

### D2 — Legibilidad: 15/25 (60%) — la dimensión que más bajó hoy

- **Conteo de nodos: 36**, contra ~30 en la versión de esta mañana (antes de las 3 rondas de edición) — creció 20% en un solo día, sin que nadie evaluara si seguía siendo "escaneable".
- **Profundidad de ramificación nueva:** el segmento `R1→R2/R3/R4→S` agregó 3 ramas paralelas con etiquetas largas (`R3` tiene 3 líneas de texto) justo en el tramo medio del diagrama — es el punto de mayor densidad visual de todo el flujo.
- **Riesgo real, no hipotético:** un diagrama que "se escanea en 30 segundos" con 24 nodos y uno con 36 no cumplen la misma promesa. Nadie decidió explícitamente aceptar ese trade-off — pasó como efecto acumulado de 3 ediciones independientes, cada una razonable por separado.

### D3 — Corrección técnica: 12/15 (80%)

- **Hallazgo real (H3, severidad alta):** `class RED1,RED2,RED3,RED4,RED5 reproceso` (línea 81) **referencia `RED3`, que ya no existe como nodo en el diagrama** — se eliminó su definición al reemplazarlo por `Q1`/`RED5`, pero quedó huérfano en la lista de clases. Mermaid puede tolerar esto silenciosamente o generar un nodo fantasma vacío según el renderer — de cualquier forma, es un defecto real, no cosmético.
- El resto de IDs (36 nodos) no tiene colisiones verificadas.

### D4 — Completitud vs. alcance declarado: 12/15 (80%)

- El diagrama cubre el ciclo completo lead→garantía, consistente con su título.
- **Hallazgo (H4, menor):** el propio documento (línea 566) reconoce que el mapeo es *"casi enteramente backstage"* y que falta la capa de "qué ve/siente el cliente" (Service Blueprint). El diagrama no tiene ninguna nota que advierta esta limitación — alguien podría asumir que es un mapa completo del *customer journey*, y no lo es.

### D5 — Mantenibilidad futura: 13/15 (87%)

- La nota "Contrato vivo" + fecha de sincronización (agregada hoy) es una mejora real medible sobre la versión de esta mañana, que no tenía ninguna.
- **Riesgo residual:** con 36 nodos en un solo bloque mermaid monolítico, el costo de la próxima actualización ya es más alto que el de hoy — la propia razón por la que se desincronizó una vez tiende a repetirse más fácil cuanto más grande se pone el diagrama.

---

## 3. Puntaje total ponderado

| Dimensión | Peso | Puntaje | Contribución |
|---|---|---|---|
| D1 Fidelidad | 30% | 73% | 21.9 |
| D2 Legibilidad | 25% | 60% | 15.0 |
| D3 Técnico | 15% | 80% | 12.0 |
| D4 Completitud | 15% | 80% | 12.0 |
| D5 Mantenibilidad | 15% | 87% | 13.1 |
| **Total** | | | **74/100** |

---

## 4. Gaps anticipados frente al flow esperado por Javier — priorizados

| # | Hallazgo | Severidad | Acción propuesta |
|---|---|---|---|
| **H3** | `RED3` huérfano en `classDef` — defecto técnico real | **Alta** | ✅ Corregido |
| **H1** | Se perdió el énfasis de Javier sobre el riesgo de caja como "la única variable externa real" | Media-alta | ✅ Aplicado — `RED5` ahora dice "única variable EXTERNA real del flujo" |
| **H2** | Entrega no se distingue visualmente como "momento de verdad" / "segundo contrato" | Media | ✅ Aplicado — nodo `T` reescrito + `classDef hito` (azul) nueva, distinta de reproceso/gap/positivo |
| **H4** | Sin advertencia de que el mapa es backstage-only | Baja-media | ✅ Aplicado — nota de alcance arriba del diagrama |
| — | Densidad acumulada | Media | ✅ Resuelto por decomposición axiomática — `R1→R2/R3/R4` colapsó de etiquetas largas (%, SLA, montos) a referencias compactas hacia `mini_diamante_check_produccion.md`. **Nota honesta: el conteo de nodos sigue en 36** (no bajó) — lo que bajó es la densidad de texto por nodo en el tramo más cargado. Si 36 nodos en un solo diagrama sigue sin ser "escaneable en 30 segundos", la solución real sigue pendiente (partir en 2 diagramas), no se resolvió acá, solo se mitigó. |

**Todo aplicado 2026-08-08.** Verificación mecánica: comillas balanceadas dentro del bloque mermaid (20, número par) — el bug de sintaxis nuevo que casi introduzco (comillas sin envolver en el nodo `T`) se detectó y corrigió en el mismo pase.
