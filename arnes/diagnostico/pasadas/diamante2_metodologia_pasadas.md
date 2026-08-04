# Diamante 2 · Metodología de las 6 pasadas sistémicas (orquestadas con subagentes)

**Qué es esto:** la especificación del ciclo de pasadas de auditoría sistémica sobre el inventario de eventos (`diamante2_discover_eventos.md`, 47 eventos). El Orquestador descompone, reparte a 6 subagentes, y audita los outputs. Cada pasada usa un **lente de análisis distinto** (unidad de análisis diferente), porque el lente del evento ya está agotado tras el loop 1.

**Cómo se ejecuta:** cada pasada es un subagente independiente (`opencode` general). Cada subagente ejecuta su pasada como **loop interno de 3 pasadas** (iteración bruta → autocrítica → refinamiento) y escribe UN archivo de salida. El Orquestador audita los 6 outputs, consolida y aplica al inventario tras checkpoint.

**Por qué subagentes:** preservar el contexto del Orquestador. Cada subagente carga su propio contexto (lee el mapa y el inventario), itera 3 veces y devuelve un output auditable con trazabilidad. El Orquestador solo lee los outputs, no re-lee las fuentes.

---

## Reglas de serialización (no pueden solaparse)

| Pasada | Archivo de salida (único que escribe el subagente) |
|---|---|
| P2 | `arnes/diagnostico/pasadas/pasada2_invariantes.md` |
| P3 | `arnes/diagnostico/pasadas/pasada3_flujo_datos.md` |
| P4 | `arnes/diagnostico/pasadas/pasada4_carga_rol.md` |
| P5 | `arnes/diagnostico/pasadas/pasada5_tiempo.md` |
| P6 | `arnes/diagnostico/pasadas/pasada6_tesis_eventos.md` |
| P7 | `arnes/diagnostico/pasadas/pasada7_arquetipos.md` |

Cada subagente **SOLO lee** las fuentes y **SOLO escribe** su archivo de salida. Nadie modifica el inventario ni el mapa: eso lo hace el Orquestador después de auditar.

**Fuentes que lee cualquier pasada (rutas absolutas):**
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\diamante2_discover_eventos.md` — el inventario de 47 eventos (la unidad a auditar).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\diamante2_loop_apertura.md` — resultado del loop 1 (para NO repetir hallazgos).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\logica_de_negocio.md` — el mapa maestro (Parte I: negocio, Parte II: implicaciones).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\cierre_diamante.md` — tesis, invariantes, bounded contexts.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\log_insights_fase2.md` — I-001..I-010.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\marco_estrategia_mercado.md` — H1-H8, palanca de demanda.

---

## Formato de output (idéntico en las 6 pasadas, para que el Orquestador audite igual)

Cada archivo de salida DEBE tener exactamente esta estructura:

```
# Pasada P{N} — {nombre del lente} (subagente, loop de 3 pasadas)

## Iteración 1 (bruta)
{hallazgos crudos, sin filtrar, con la unidad de análisis del lente}

## Iteración 2 (autocrítica)
{qué hallazgos de la iteración 1 sobreviven, cuáles caen y por qué; qué se me escapó en la pasada 1}

## Iteración 3 (refinamiento final)
{hallazgos finales depurados}

## Hallazgos finales (tabla)
| ID | Tipo | Descripción | Evento(s) afectado(s) | Fuente (archivo:línea) |
(…)

## Notas para el Define
{qué implica cada hallazgo para la convergencia, sin decidir todavía}
```

**Clasificación de hallazgos (mismo vocabulario que el loop 1):**
- `ADICIÓN` — evento nuevo que falta en el inventario.
- `REFUERZO` — evento existente que necesita una nota, regla o enlace adicional.
- `DIFERIDO` — se registra pero no se modela.
- `VACÍO` — dato que no existe (no solo evento que falta).

**Regla anti-duplicación:** si un hallazgo ya está en `diamante2_loop_apertura.md` (A-1..A-7, B-1..B-5, D-1..D-4, V-1..V-6), NO se repite: se marca `YA LOOP 1` y se descarta. La pasada debe aportar hallazgos nuevos, no re-reportar.

**Regla de trazabilidad:** todo hallazgo cita su fuente con `archivo:línea` o `archivo §sección`. Sin traza no es un hallazgo, es una opinión.

**Regla de escepticismo:** si un hallazgo depende de interpretar intención del negocio y no está escrito en el mapa, se marca como `VACÍO` (dato que no existe) o se descarta — NO se inventa una regla de negocio.

---

## Las 6 pasadas (lente por pasada)

### P2 — Invariantes y su enforcement (la REGLA como unidad)

No preguntar "¿qué evento falta?" sino "¿qué regla debe cumplirse SIEMPRE?". Los invariantes del sistema (del `cierre_diamante.md` y del mapa): inmutabilidad del cronograma, separación ejecutor-verificador, restricción de dinero, no acumular deuda, "el log es la acción". Por cada invariante: ¿hay un evento que lo haga cumplir (enforcement)? ¿quién lo vigila? ¿qué pasa cuando se viola?

Entradas extra: `cierre_diamante.md` (invariantes/tesis), `diamante2_loop_apertura.md` D-1..D-4.

### P3 — Flujo de datos transversal (el DATO como unidad)

Los eventos dicen qué pasa; esta pasada rastrea qué viaja. Seguir cada dato clave (cliente, proyecto, dinero, material, documento, medición, hito, lead) por su ciclo de vida: dónde nace, dónde muere, quién lo toca, dónde se transforma. Detectar datos muertos (nacen y no se consumen, ej. `score_conversion`), datos duplicados (se recrean en varios contextos → inconsistencia), datos sin dueño (cada contexto cree que es suyo).

Entradas extra: `logica_de_negocio.md` Parte I + Parte II (schema), `diamante2_loop_apertura.md` (ya detectó parcialmente datos muertos: no repetir).

### P4 — Carga por rol (el ACTOR como unidad)

Matriz rol × eventos: cada rol dispara X eventos, valida Y, recibe Z. Detectar cuellos de botella humanos (un rol que hace casi todo), roles con responsabilidad sin autoridad (deben validar algo que no controlan), y la estructura de poder real vs. la de diseño. Conecta con la tesis de capacidad (1 proyecto/semana: ¿qué rol se satura primero?).

Entradas extra: `logica_de_negocio.md` (roles: comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente; capacidad 4:1), `segunda_ronda_preguntas.md` si hace falta contexto de roles.

### P5 — Tiempo y dependencias ocultas (la SECUENCIA como unidad)

Grafo de precedencias entre los 47 eventos + dónde se gasta el tiempo (el ciclo promete 15-20 días — ¿dónde están esos días? ¿cuánto es espera?). Detectar esperas silenciosas (el cliente sin evento de comunicación mientras "desarrollo"), eventos que podrían ser paralelos y hoy son secuenciales, dependencias que el inventario no declara (ej. E-08 ↔ E-30).

Entradas extra: `logica_de_negocio.md` (cronograma, holgura máx 5 días, rango instalación 5 días, garantía 8-12 días, capacidad), `segunda_ronda_preguntas.md` (respuestas de tiempos).

### P6 — Tesis ↔ eventos (la FINALIDAD como unidad)

Cruce inverso: cada tesis/invariante del cierre → ¿qué evento lo materializa? Detectar agujeros de finalidad (elementos de la tesis sin evento que lo respalde) y ruido (eventos sin ancla en la tesis). Valida que el inventario sirve a lo aprobado.

Entradas extra: `cierre_diamante.md` (tesis, invariantes, bounded contexts), `marco_estrategia_mercado.md` (H1-H8 como requisitos de la palanca de demanda).

### P7 — Arquetipos sistémicos / bucles de retroalimentación (la CAUSALIDAD como unidad)

Modelar los ciclos causales del sistema: cronograma → comisiones → cumplimiento → calidad → garantía → reputación → demanda. Identificar bucles de refuerzo (crecimiento) y bucles de equilibrio (frenos). Detectar dónde el software debe intervenir (quebrar un bucle negativo, potenciar uno positivo) y límites al crecimiento (capacidad 1 proy/semana, restricción de dinero).

Entradas extra: `logica_de_negocio.md` (política financiera, capacidad, compensación), `cierre_diamante.md` (tesis).

### P8 — Excepciones y fricción (el FALLO como unidad) — 7ª pasada, agregada 2026-08-03

La pregunta rectora NO es "¿qué evento existe?" sino "**¿qué pasa cuando este evento NO ocurre, falla, o se sale del camino feliz?**". Es el ataque directo al punto débil que detectaron P2-P7: el inventario es fuerte en eventos de ESTADO y débil en eventos de NEGACIÓN/ENFORCEMENT (bloqueos, rechazos, consecuencias de violación).

Por cada evento del inventario (E-01..E-47), preguntar: ¿qué pasa si falla? ¿Hay un evento negativo? ¿Hay una consecuencia definida? ¿Quién se entera? Distinguir el camino feliz (happy path) del camino de falla (failure path), y señalar dónde la falla NO tiene respuesta en el inventario.

**Decisiones del Supervisor (2026-08-03) que ESTA pasada debe auditar como reglas nuevas (no inventadas):**
- Promesa contractual de **7 semanas**, entregable antes (resuelve la cadencia).
- **Check de los 15 días:** log real de producción (insumos en taller / comprados-pagados / proyectos en fila) → decide "insinuar instalación en 15 días" (cliente feliz) o "posponer + comisiones reducen + entrega 3 semanas tarde dentro de la promesa". Máximo estrés sin entrega → negociar con el cliente.
- **Cuestionario de viajes/situaciones externas del cliente** al cerrar contrato (anticipa cambios del flow por parte del cliente).
- Calidad la puede revisar **el comercial que vendió o el gerente** (resuelve el pool de verificadores).
- **Flow organizado de cambios de contrato:** adicional = módulo con especificación y tiempo propio; cambio = protocolo con impacto medible (¿homologable en compras?); reprocesos/afectaciones = costo que asume el cliente (en el contrato). Un tercer origen de causa para E-33: "cambio de contrato".

Si la pasada detecta que alguna de estas reglas nuevas NO está cubierta por ningún evento del inventario, es ADICIÓN. Si requiere evento negativo para un evento existente, es ADICIÓN o REFUERZO. NO se inventa nada más allá de estas decisiones.

Entradas extra: `log_insights_fase2.md` (I-024..I-027, decisiones del Supervisor), `diamante2_panorama_consolidado.md` (lo que las 6 pasadas ya detectaron, para no duplicar).

---

## Reglas del ciclo (gobernanza del Orquestador)

1. Las pasadas corren en paralelo (no comparten archivos de salida); la 7ª (P8) se lanza tras las primeras 6 y consume sus hallazgos como anti-duplicación.
2. El Orquestador audita cada output contra las reglas de formato, trazabilidad y anti-duplicación; descarta lo que no cumpla.
3. El Orquestador consolida en `diamante2_panorama_consolidado.md`: hallazgos únicos deduplicados entre todas las pasadas, clasificados, con conteo.
4. Se aplican adiciones/refuerzos aprobados al inventario SOLO tras checkpoint del Supervisor.
5. **Criterio de parada:** si una pasada entera no arroja adiciones ni vacíos nuevos, el inventario se declara saturado para ese lente. Si TODAS vuelven sin hallazgos nuevos, el inventario está saturado y se abre el Define.
6. Ningún hallazgo que cambie bounded contexts o gates puede aplicarse sin parar: es loop focalizado (regla de reapertura vigente). Las decisiones del Supervisor (I-024..I-027) SÍ cambian contrato vivo (Parte I) — requieren loop focalizado o integración explícita en el Define, no se aplican en silencio.
