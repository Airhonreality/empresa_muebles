# Plan — Ciclo H "Higiene y Canonización" (metodología documentada)

> **Nota (2026-08-07):** el archivo referenciado en este documento como `DESTINO_SCHEMA_AUTORITATIVO.md` fue renombrado a `REGISTRO_DE_ENTIDADES.md` por corrección axiomática (el nombre original describía el proceso que lo creó, no lo que el archivo ES). Las referencias internas de este plan histórico se conservan sin modificar (§2.C Living Documentation: registro histórico no se actualiza).

**Estado:** APROBADO por el Supervisor (2026-08-07) como metodología propuesta, PENDIENTE de ponderación contra `ARNES_AGENTICO.md` (§5 de este documento).
**Propósito:** generar `arnes/diagnostico/DESTINO_SCHEMA_AUTORITATIVO.md` — el destino único, fiable y verificable de los schemas del negocio — partiendo del estado fragmentado detectado por la auditoría (Bloque 1 Fase 1), y limpiar la basura del arnés sin perder la memoria de origen.

---

## 0. Por qué existe este ciclo

La auditoría de dispersión (reporte Bloque 1 Fase 1) concluyó **FRAGMENTADO**:
- El registro de schemas vive en 12+ archivos sin jerarquía explícita (`d3_schema_consolidado.md`, `a2_1`, `OLA_6_SCHEMAS_APROBADOS`, `FLAG4`, `METODOLOGIA_GRAFOS`, `plan_f4`, `disenio_modulo_espacio`, `plan_t-075`, `schema.ts`…).
- Existen **3 canones paralelos** (núcleo transaccional 65 tablas / catálogos OLA_6+FLAG4 / decisiones nuevas D-2026-08-07*) sin nodo acordado.
- Colisiones de naming reales (recepción, estados de proyecto ×3, acabados ×3, taxonomía catálogo doble, SLA ×3).
- `schema.ts` (27 tablas) no contiene las 47 diseñadas (esperado: no codificado aún) → verificabilidad solo del subconjunto F0/legacy.

**Regla de oro del ciclo:** nunca borrar el rastro de una decisión. Archivar, nunca eliminar la memoria de origen (transcripciones de Javier, decisiones históricas).

---

## 1. Fases (cada una con gate de Supervisor)

### Fase 0 — Congelar el estado (agente A, solo lectura)
- Bloquear la banda: **nada nuevo se decide durante C-H** (salvo urgencia con aprobación explícita).
- Snapshot del arnés: fecha + commit de `arnes/` (si hay git) o hash del árbol.
- **Gate 0:** Supervisor confirma congelamiento.

### Fase 1 — Inventario de activos y de basura (agente A → B)
- **Agente A (explore):** inventario maestro del arnés — archivo × {qué es, vigente/obsoleto/sin propietario}.
- Clasificación:
  - **Archivos-historio** (transcripciones de Javier, decisiones pasadas, rondas de preguntas) → **conservar SIEMPRE**, marcar `historico`, no se tocan.
  - **Basura** (nombres puggidos, versiones superadas, duplicados) → marcar `a_archivar`.
- Output: `arnes/diagnostico/higiene/_INDICE_HIGIENE.md`.
- **Gate 1:** Supervisor revisa clasificación (qué se archiva vs conserva).

### Fase 2 — Reconciliación semántica con el humano (agente C, máximo valor)
- Tabla de **decisiones de canon** por cada colisión: {conflicto, fuentes enfrentadas, decisión, cita, estado: resuelta/requiere_aprobacion_humana}.
- Las dudas reales (ej. "¿`recepciones` u `recepciones_material`?") se escriben en **decisiones pendientes de canonización** para el Supervisor.
- NADA se resuelve unilateralmente por el subagente: cada decisión de canon es `resuelta` o `requiere_aprobacion_humana`.
- Output: `arnes/diagnostico/higiene/resoluciones_canonizacion.md`.
- **Gate 2:** Supervisor aprueba el set de resoluciones (por lotes si es grande).

### Fase 3 — Redacción del destino autoritativo (agente D)
- Con las resoluciones aprobadas, redacta **`arnes/diagnostico/DESTINO_SCHEMA_AUTORITATIVO.md`**:
  - Tabla compacta: `schema | nombre natural | razón de existir / función en el sistema | relaciones`.
  - Regla declarada: **"si este documento difiere de cualquier otra fuente, gana este"**.
  - Es el checklist de alto nivel humano (65+ tablas en una vista).
- Draft N — no toca el canon hasta aprobación.
- **Gate 3:** Supervisor aprueba el draft.

### Fase 4 — Verificación mecánica del destino (agente E, QA independiente)
- Contra `lib/db/schema.ts` + fuentes aprobadas:
  - Toda tabla nombrada existe en ≥1 fuente de diseño.
  - 0 contradicciones internas (names únicos, FKs coherentes, sin campos huérfanos).
  - Marca `viva`/`post-lanzamiento` por tabla.
- Output: `arnes/diagnostico/higiene/reporte_verificacion_destino.md`.
- **Gate 4:** Supervisor aprueba con evidencia (output crudo, no resumen).

### Fase 5 — Promoción y archivado
- `DESTINO_SCHEMA_AUTORITATIVO.md` se promueve como **canon raíz** (apuntado desde `INDEX.md` y `_INDICE_MAESTRO.md`).
- Archivos obsoletos → `arnes/diagnostico/archivo/` (con rastro; nunca borrado del historial de decisiones).
- Actualizar `INDEX.md`/`_INDICE_MAESTRO.md` (regla de oro: borrar lo obsoleto, no acumularlo).
- **Gate 5:** Supervisor confirma promoción.

---

## 2. Roles por fase (más de un agente)

| Fase | Agente | Rol ARNES_AGENTICO | Independencia |
|------|--------|---------------------|---------------|
| F0 | A | Orquestador (no escribe) | — |
| F1 | A (explore) → B | Exploración (andamiaje) | A inventa, B cruza |
| F2 | C | Código/QA documental | ejcuta ↔ verifica separados |
| F3 | D | Código (redactor) | no se auto-aprueba |
| F4 | E | **QA independiente** | ≠ ejecutor D (regla §3.4) |
| F5 | Supervisor + Orquestador | Supervisión | humano |

**Regla de independencia sin excepción:** D (redactor) y E (verificador) nunca son la misma identidad.

---

## 3. Verificabilidad del proceso

- Cada fase produce un archivo en `arnes/` versionado (rastro).
- QA (F4) pega **output crudo** (contra `schema.ts`/fuentes), nunca paráfrasis.
- El `DESTINO_SCHEMA_AUTORITATIVO.md` se valida con verificación mecánica replicable.
- "No se puede aprobar algo no verificable" (ARNES §3.4).

---

## 4. Qué NO hace este ciclo (límites)

- No decide el schema futuro: solo **canoniza lo ya aprobado** (resolviendo naming, no inventando estructura).
- No borra historial: archiva.
- No codifica: `schema.ts` sigue intacto (los 47 diseños se codifican al salir de F0-F9).
- No reabre decisiones de negocio ya cerradas: las registra y traza.

---

## 5. Ponderación contra ARNES_AGENTICO.md (mejores prácticas cruzadas)

---

## 5. Ponderación contra ARNES_AGENTICO.md (mejores prácticas cruzadas)

Este ciclo es una **mutación del arnés** en el sentido de `ARNES_AGENTICO.md` §4 (riesgo `maximo`, frena siempre) y §8 (HarnessMutation): reordena `arnes/`, cambia el destino del registro y —en el límite— toca `AGENTS.md`. Por eso se apoya en las dos referencias cruzadas y esta sección explicita cómo cumple cada principio. Todo lo siguiente se ha verificado contra el texto real de `arnes/ARNES_AGENTICO.md`:

| Principio ARNES_AGENTICO | Cómo lo cumple / ajusta el Ciclo H |
|---|---|
| §1 "generalizar antes de repetir es el paradigma viejo" | C-H no inventa estructura: **canoniza lo que ya fue aprobado**, no generaliza ni propone schema nuevo. Fase 2 solo resuelve naming entre fuentes existentes. |
| §2.B Diagnóstico inicial solo lectura | Fase 0 (congelar) y Fase 1 (inventario) no tocan nada; el diagnóstico precede a cualquier escritura. |
| §2.C Living Documentation — `registro histórico` vs `contrato vivo` | La distinción es la columna vertebral del Ciclo H. Fase 1 marca cada archivo del inventario: `historico` (nunca se actualiza; decreta de decisión, espíritu ADR de Nygard) o `a_archivar`. El `DESTINO_SCHEMA_AUTORITATIVO.md` es el **contrato vivo**: "si difiere de cualquier otra fuente, gana este" (§3 de este plan) — y por la regla del §2.C debe actualizarse en el MISMO commit que el código que lo toque. C-H entrega la infraestructura para decidir caso por caso, no por regla general. |
| §2.C Event Storming (Item 44-62) | El Ciclo H no hace Event Storming nuevo: Reconciliación de canon parte de la lógica de negocio ya trazada en `proceso_trazabilidad.md` (punto-0 → planes → outputs), no del código existente, para no heredar supuestos erróneos. El punto-0 garantiza que cada tabla canonizada tenga su origen en la conversación de negocio, no en un nombre puggido. |
| §2.D Modo consultor crítico | En Fase 2 (agente C) el agente **no se conforma con la primera fuente que encuentre**: para cada colisión cruza las múltiples fuentes enfrentadas, busca destruir la hipótesis floja (ej. "¿`recepciones` es distinto de `recepciones_material`?") con evidencia de `file:line`, y la deja como `requiere_aprobacion_humana` — nunca como consenso falso. Es exactamente el modo consultor crítico aplicado a la canonización. |
| §3 roles separados (ejecutor ≠ verificador) | Fases asignan identidades distintas: C (reconciliación) ≠ D (redactor) ≠ E (QA). §2 del Ciclo H lo fija sin excepción. |
| §3.4 QA independiente, output crudo | Fase 4 (E) es un agente **distinto de D** presentador; pega **output crudo** contra `schema.ts` y fuentes aprobadas, nunca paráfrasis. Fase 0/III prohÍben auto-aprobación. |
| §3.4 Presupuesto de reintentos (2) | Si QA rechaza 2 veces, no hay tercer intento automático: se escala al Supervisor con ambos diffs. Se adopta en Fase 4. |
| §4 Clasificación de riesgo / "listo" significá | Tabla central: riesgo se deriva, no se elige. Cada fase de C-H se clasifica: F0/F11 bajo (andamiaje-inventario), F2-F4 alto (reconciliación de datos/schema → "listo" = validación de contrato + round-trip contra `schema.ts`), F5 mutación de estructura → riesgo `máximo`, frena siempre con checkpoint humano. |
| §5 El ledger | Cada tarea de C-H se registra en `arnes/tareas/` con `zona: arnes`, `tipo: mutacion_arnes`, `riesgo: maximo`, `archivos_afectados`, QA con `salida_cruda`, checkpoint bloqueante. Un registro nunca se borra ni reescribe para ocultar un error (misma regla de oro que §3 de C-H: archivar, no borrar). |
| §6 Loop operativo | Cada fase sigue plan-as-archivo → ejecución acotada → autorrevisión → QA crudo → checkpoint humano → cierre transaccional. |
| §7 Subagentes (proceso-por-tarea, invariante humano) | Fases asignan identidades distintas; el **Supervisor sigue estructuralmente humano** en cada gate (0–5). Si se delega, el orquestador audita cada output contra `AGENTS.md`/`INDEX`, no de memoria, y señala si fue por paralelismo (A/B barridos F11/2) o por costo. |
| §8 HarnessMutation — plan→dry→confirmación→backup | **El cruce más importante.** Este ciclo y su resultado (`DESTINO_SCHEMA_AUTORITATIVO.md`) y el mover/archivar archivos del `arnes/` son mutaciones de arnés / renombrar esq. Por tanto antes de aplicar se hace dry-run (simulación sin escribir sobre `arnes/`), confirmación explícita del Supervisor, y **backup automático** de `arnes/` (el "congelamiento" de Fase 0 ya arranca el snapshot). |
| §9 Reinicio de contexto | El Ciclo H produce documentación canonada que **reduce la deriva de contexto**: el DESTINO es un manifiesto sintético que un reinicio puede leer en un archivo. La regla de Fase 0 (no decidir nada nuevo durante C-H) protege contra atajos bajo presión de contexto. |
| §3.5 / §6.1 Regla de parada | Fase 1 no se inventa trabajo: barre hasta agotar el inventario y para; no genera tareas vacías. |
| §11 Plantillas | Las fases producen archivos con las plantillas del arnés (ledger t-XXX, `estado.md` actualizado, `INDEX.md` en Fase 5, `plan_hygiene_ciclo_h.md` como plan del Iniciador). |
| §2.C.6 Notification: "contrato y esquemas" es data | Al canonizar el DESTINO como contrato vivo de schema (datos/contrato, tablón riesgo alto), se detiene el sistema si no hay verificación declarada (§3.4 `no_verificable`). El DESTINO se comparará contra `schema.ts` (F0) y contra el próximo diseño codificado. |

**Conclusión del cruce:** el Ciclo H no es un artefacto nuevo sino una **instancia de la propia metodología del arnés** aplicada a la canonización de schemas. No contrapide ningún §; donde plsa, lo activa explícitamente: clasifica riesgo por tabla (§4), usa QA independiente con salida cruda (§3.4), aplica HarnessMutation completa (§8) por ser mutación de estructura, distingue histórico vs contrato vivo (§2.C), y conserva el checkpoint humano (§3.5). **Único ajuste solicitado al aplicar:** dado que Fase 5 mueve y archiva archivos en `arnes/`, y el `DESTINO` aspirA a ser raíz del índice, se aplica el ciclo de mutación completo (§8) — nunca edición directa de `AGENTS.md` o reestructuración de `arnes/` sin backup + dry-run + confirmación.

---

## 6. Referencias

- Auditoría de dispersión (Bloque 1 Fase 1): `arnes/diagnostico/trazabilidad_punto0/proceso_trazabilidad.md`
- Arquitectura ideal: `arnes/ARNES_AGENTICO.md`
- Estado actual consolidado: `arnes/estado.md` (§ Bucle F4/F5, D-2026-08-07*)