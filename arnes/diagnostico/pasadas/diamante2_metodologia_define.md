# Diamante 2 · Metodología de las 6 pasadas del Define (C1-C6, orquestadas con subagentes)

**Qué es esto:** la especificación del ciclo de pasadas de auditoría sobre la **convergencia** del segundo diamante (`diamante2_define_eventos.md`, 61 eventos agrupados en 15 bounded contexts). La apertura audité *eventos*; este ciclo audita *contextos y fronteras* — las decisiones que más se multiplican en schema/UI. El Orquestador descompone, reparte a 6 subagentes, y audita los outputs.

**Cómo se ejecuta:** cada pasada es un subagente independiente (`opencode` general). Cada subagente ejecuta su pasada como **loop interno de 3 pasadas** (iteración bruta → autocrítica → refinamiento) y escribe UN archivo de salida. El Orquestador audita los 6 outputs, consolida y decide si la convergencia es estable (se abre el loop 2 de diseño) o requiere loop focalizado con checkpoint del Supervisor.

**Por qué subagentes:** preservar el contexto del Orquestador. Cada subagente carga su propio contexto (lee el Define, el inventario, el mapa, el panorama), itera 3 veces y devuelve un output auditable con trazabilidad. El Orquestador solo lee los outputs.

---

## Reglas de serialización (no pueden solaparse)

| Pasada | Archivo de salida (único que escribe el subagente) |
|---|---|
| C1 | `arnes/diagnostico/pasadas/define_c1_cohesion.md` |
| C2 | `arnes/diagnostico/pasadas/define_c2_fronteras.md` |
| C3 | `arnes/diagnostico/pasadas/define_c3_trazabilidad.md` |
| C4 | `arnes/diagnostico/pasadas/define_c4_ejecutabilidad.md` |
| C5 | `arnes/diagnostico/pasadas/define_c5_contrato_vivo.md` |
| C6 | `arnes/diagnostico/pasadas/define_c6_restriccion.md` |

Cada subagente **SOLO lee** las fuentes y **SOLO escribe** su archivo de salida. Nadie modifica el Define, el inventario, el mapa ni el cierre: eso lo hace el Orquestador después de auditar y solo con checkpoint.

**Fuentes que lee cualquier pasada (rutas absolutas):**
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\diamante2_define_eventos.md` — LA UNIDAD A AUDITAR (convergencia).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\diamante2_discover_eventos.md` — inventario de 61 eventos (la materia prima de la convergencia).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\pasadas\diamante2_panorama_consolidado.md` — los 45+ hallazgos P2-P8 que el Define resolvió (para validar resoluciones, no re-reportar problemas).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\log_insights_fase2.md` — I-001..I-043, decisiones del Supervisor (I-024..I-043) que el Define asume.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\cierre_diamante.md` — tesis, invariantes, bounded contexts del diamante 1 (contrato a no romper).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\logica_de_negocio.md` — el mapa maestro (Parte I: negocio, Parte II: implicaciones).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\loop2_y_retroalimentacion.md` — A1-A12, las 4 rutinas clave (A10), separación ejecutor-verificador (A2).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\diamante2_loop_apertura.md` — loop 1 del inventario (para anti-duplicación histórica).

---

## Formato de output (idéntico en las 6 pasadas, para que el Orquestador audite igual)

```
# Pasada C{N} — {nombre del lente} (subagente, loop de 3 pasadas)

## Iteración 1 (bruta)
{hallazgos crudos, sin filtrar, con la unidad de análisis del lente}

## Iteración 2 (autocrítica)
{qué hallazgos de la iteración 1 sobreviven, cuáles caen y por qué; qué se me escapó en la pasada 1}

## Iteración 3 (refinamiento final)
{hallazgos finales depurados}

## Hallazgos finales (tabla)
| ID | Tipo | Descripción | Contexto(s)/frontera(s) afectado(s) | Fuente (archivo:línea) |
(…)

## Notas para el Orquestador / Define
{qué implica cada hallazgo para la convergencia, sin decidir todavía}
```

**Clasificación de hallazgos (vocabulario del ciclo Define):**
- `MOVER_CONTEXTO` — un evento está en el contexto equivocado.
- `PARTIR_CONTEXTO` — un contexto es cajón de sastre y pide subdivisión.
- `REFORZAR_FRONTERA` — una interfaz entre contextos es ambigua, incompleta o sin dueño.
- `NUEVO_CONTRATO` — dos contextos se hablan sin evento de frontera tipado.
- `DECISION_PENDIENTE` — requiere decisión de negocio del Supervisor (no bloquea la convergencia, se lista).
- `CORRECCION` — el Define contradice el mapa/cierre sin declararlo (como P5-09).
- `OK_CON_DOC` — resolución correcta pero mal documentada (se marca, no se reabre).
- `DIFERIDO` — se registra para el loop 2 de diseño, no se decide ahora.

**Regla anti-duplicación:** si un hallazgo levanta un problema que P2-P8 ya señalaron Y el Define ya resolvió, se descarta como `YA RESUELTO` (validar resoluciones, no re-reportar problemas). Si levanta un problema del diamante 1 ya cerrado (bounded contexts del cierre §4, tesis, invariantes), se marca `YA DIAMANTE 1`.

**Regla de trazabilidad:** todo hallazgo cita su fuente con `archivo:línea`. Sin traza no es un hallazgo, es una opinión.

**Regla de escepticismo:** si un hallazgo depende de interpretar intención del negocio y no está escrito en el mapa, se marca `DECISION_PENDIENTE` o se descarta — NO se inventa una regla de negocio.

---

## Las 6 pasadas (lente por pasada)

### C1 — Cohesión de contextos (el CONTEXTO como unidad)
La unidad de análisis es cada bounded context de la tabla §2 del Define. Para cada uno: ¿es internamente cohesivo (lenguaje ubicuo único, modelo de datos propio, un motivo de cambio)? ¿Es un cajón de sastre? Comercial/Cotizador (15 eventos) y Finanzas/Compensación (12) son los más grandes: ¿se sostienen como un solo contexto o piden subdivisión (ej. separar embudo/lead del cotizador, o cobros de compensación)? ¿Algún evento usa lenguaje de otro contexto?

### C2 — Fronteras y contratos (el PAR de contextos como unidad)
La unidad es cada interfaz entre dos contextos (la tabla §5 del Define + los 9 contratos + las fronteras P3-02 dinero Contratos↔Finanzas y E-08). Para cada par: ¿la interfaz es explícita, mínima, estable y tipada? ¿Hay acoplamiento oculto (un contexto lee las tripas de otro)? ¿Dos contextos se hablan sin evento de frontera (conversación por teléfono sin contrato)? ¿Los contratos tienen dueño?

### C3 — Trazabilidad inversa (el HALLAZGO/DECISIÓN como unidad)
La unidad es cada decisión que debió materializarse en la convergencia: los 61 eventos (¿todos con contexto? ¿alguno se perdió?), los 45+ hallazgos P2-P8 (¿resueltos o abandonados?), I-024..I-043 (¿reflejados en §1, §2, §4?), A1-A12, y los 10 VACÍO de §6 (¿están todos? ¿alguno en realidad bloquea la convergencia?). El output debe incluir una **matriz de trazabilidad** evento→contexto y hallazgo→resolución.

### C4 — Ejecutabilidad del enforcement (la TRANSICIÓN/GUARD como unidad)
La unidad es cada gate de §4 y cada transición de estado. Para cada uno: ¿estado de entrada, guard, disparador (rol) y rama negativa definidos y deterministas? ¿El modelo rol-vs-persona (§3) es suficiente para implementar los guards? ¿Faltan guards que el negocio exige? ¿La corrección P5-09 (§4.2) es consistente con el resto del Define y el mapa? ¿El "gerente hace todo" (P4-F3) queda resuelto en la práctica o solo declarado?

### C5 — Contrato vivo (la CONSISTENCIA como unidad)
La unidad es la coherencia del Define contra `cierre_diamante.md` y `logica_de_negocio.md`. Preguntas: ¿los 15 contextos son compatibles con los 12 del cierre §4 (los 3 nuevos no rompen el esqueleto)? ¿P5-09 es la única contradicción o hay más **silenciosas**? ¿La capa 1 vs capa 2 (§8) respeta las 4 rutinas clave (A10)? ¿Las decisiones I-024..I-043 del Define §1 contradicen algo del mapa? ¿Hay tesis/invariantes del cierre que la convergencia dejó sin respaldo?

### C6 — Restricción y flujo (el FLUJO del proyecto como unidad)
La unidad es el camino crítico de un proyecto a través de los 15 contextos (lead → … → garantía). Preguntas: ¿el grafo de contextos soporta la tesis de capacidad (demanda 1.25/mes < fábrica 5/mes)? ¿Dónde está la restricción (dinero → leads → cronograma)? ¿Los contextos diferidos (Marketing/Demanda, Tienda web, Gobierno/Medición) bloquean el core o son backlog limpio? ¿Las precondiciones de capa 1 (firma virtual, pasarela, P4-F7) están todas identificadas? ¿Hay cuellos de botella que la convergencia no declara?

---

## Reglas del ciclo (gobernanza del Orquestador)

1. Las 6 pasadas corren en paralelo (no comparten archivos de salida).
2. El Orquestador audita cada output contra las reglas de formato, trazabilidad y anti-duplicación; descarta lo que no cumpla.
3. El Orquestador consolida en `pasadas/diamante2_define_consolidado.md`: hallazgos únicos deduplicados, clasificados, con conteo.
4. **Criterio de parada:** si las 6 pasadas NO mueven fronteras ni contextos, la convergencia es estable → se abre el loop 2 de diseño con confianza. Si mueven → loop focalizado con checkpoint del Supervisor.
5. **Regla de reapertura:** un hallazgo que cambie un contexto o una frontera NO se aplica en silencio — se lleva a checkpoint del Supervisor (los bounded contexts del cierre §4 son contrato del diamante 1).
6. El Orquestador decide, con evidencia, si abre el loop 2 o requiere otra vuelta de pasadas.

---

## Registro

- Fecha: 2026-08-03
- Estado: ciclo lanzado (6 subagentes en paralelo). Pendiente: auditoría de outputs, consolidación y veredicto.
- Ledger: t-042 a t-047, `ejecucion`.
