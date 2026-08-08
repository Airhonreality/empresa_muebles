# Plan de Alineación del Arnés

**Axioma:** este documento es el doctor del arnés. Diagnostica referencias que divergen del proceso real y prescribe la corrección unívoca. Su salida es un arnés donde cada documento vivo refleja el mismo estado sin contradicciones. No registra "cómo era antes" — solo dice qué está desalineado y cómo se corrige.

**Fecha:** 2026-08-08 · **Estado:** Fase 1 EJECUTADA (2026-08-08, ver §8) · **Tipo:** mutacion_arnes · **Riesgo:** alto

---

## 1. Diagnóstico: estado real del proceso (fuente única)

Las fases F0–F9 pertenecen a **tres familias**, cada una con su propia plantilla de salida:

| Tipo | Fases | Plantilla | Output |
|---|---|---|---|
| Schema / Lógica | F0, F1 | Formato libre (entidades, migración, helpers, seed) | `plan_f0.md`, `plan_f1.md` |
| Pantallas | F2–F7 | `PLANTILLA_PANTALLA.md` | `disenio_PXX.md` |
| Hardening / QA | F8, F9 | `PLANTILLA_HARDENING.md`, `PLANTILLA_QA.md` | `plan_f8.md`, `plan_f9.md` |

**Contrato estratégico vigente (Supervisor, 2026-08-07):** entre F0 y F9 no se escribe código. La banda produce `aprobación → diseño → plan de código aprobado`. La codificación comienza al salir de F0–F9.

**Progreso real:** F0–F7 con planes aprobados. F8 (hardening) es la siguiente fase. F9 (QA + corte) cierra.

---

## 2. Inventario de desalineaciones

Cada archivo vivo del arnés se audita contra la fuente única (§1). Las discrepancias se clasifican en dos familias:

- **Desalineación estructural** (§2.1–§2.5): fase, plantilla, naming de documento, estado de progreso
- **Desalineación de símbolos** (§2.6): nombres de tabla/columna que divergen del canon del REGISTRO

### Mapa de renames canónicos

El `REGISTRO_DE_ENTIDADES.md` es la fuente única de nombres de schema. Estos renames ya están decididos pero los docs vivos no los reflejan:

| Nombre deprecado | Nombre canónico (REGISTRO) | Decisión de origen | Vive en |
|---|---|---|---|
| `check_15_dias` | `check_produccion` | plan_f6.md §4 — corrección de naming; el control no es quincenal, es por proyecto disparado por cronograma | `plan_ola7_maestro.md` F3, `disenio_f3_cronograma_gates.md`, `glosario_h07.md`, `plan_t-080.md` |
| `modulos_armado` | `modulos` | D-2026-08-07-C — módulo jerárquico por espacio; árbol recursivo con trazabilidad de proyecto entero | `plan_ola7_maestro.md` F5, `disenio_f3_cronograma_gates.md`, `plan_f5.md`, `glosario_h07.md` |
| `veredictos_calidad` | `verificaciones` | Tabla unificada `verificaciones.tipo_gate='calidad'`; no existe tabla separada | `disenio_P17_calidad_gate.md` (referencias indirectas) |
| `productos_acabados` | `catalogo_acabados` | FLAG-4 + D-2026-08-07-C — un solo master con familia, precio_diferencial, parámetros_extra | Planes de catálogo F1 |

**Nota sobre `audit_logs`:** la tabla `audit_logs` existe como entidad canónica en el REGISTRO y en `lib/db/schema.ts`. No es un rename — es una tabla válida. La agrupación modular F0 (`eventos` + `audit_logs` + `procedencia`) es un concepto de módulo de código, no de naming de schema. Las referencias a `audit_logs` en docs vivos son correctas.

### 2.1 `arnes/estado.md`

| # | Línea(s) | Referencia desalineada | Estado real | Corrección |
|---|---|---|---|---|
| A1 | 20 | "Plantilla de pantalla en `PLANTILLA_PANTALLA.md`" | Tres plantillas vigentes (PANTALLA, HARDENING, QA) | Ampliar a las tres |
| A2 | 24–38 | Tabla "Estado actual" con F7 y F8 duplicados (fila F0–F7 "aprobado" + fila F7 "sin plan" + fila F8 repetida) | F0–F7 aprobado; F8 siguiente; F9 pendiente | Consolidar en 3 filas limpias |
| A3 | 36–37 | "Próxima acción permitida: Ejecutar el bucle de diseño **F6**" | F6 ya tiene `plan_f6.md` aprobado | Cambiar a F8 (hardening) |
| A4 | 41–50 | "Artefactos canónicos" lista 7 ítems con `PLANTILLA_PANTALLA.md` como única plantilla | Existen 3 plantillas | Agregar `PLANTILLA_HARDENING.md` y `PLANTILLA_QA.md` |
| A5 | 77 | "la próxima fase del loop es **F4**" | F4–F7 completados; siguiente es F8 | Cambiar a F8 |

### 2.2 `arnes/INDEX.md`

| # | Línea(s) | Referencia desalineada | Estado real | Corrección |
|---|---|---|---|---|
| B1 | 27–28 | `1.e` lista solo `PLANTILLA_PANTALLA.md` | Tres plantillas vigentes | Agregar `1.e2 PLANTILLA_HARDENING.md` y `1.e3 PLANTILLA_QA.md` |
| B2 | 49 | "**Diamante 4 (sistema visual) ABIERTO — primera fase de la V3**" | D4 completado (PoC 3 verificada 2026-08-04) | Actualizar a estado real |
| B3 | 75 | "**Pendiente:** aprobación pantalla cotizador (P-04) → desbloquea F2" | P-04 aprobado (2026-08-05) | Remover o marcar resuelto |

### 2.3 `arnes/lineas/ola7/plan_ola7_maestro.md`

| # | Línea(s) | Referencia desalineada | Estado real | Corrección |
|---|---|---|---|---|
| C1 | 5–6 | "PROPUESTO — pendiente aprobación" + "codifica exactamente lo que Ola 6 especificó" | Estrategia vigente: planes primero, código después. F0–F9 no codifica. | Actualizar status y alcance |
| C2 | 17 | "el siguiente plan que escriba el Iniciador (F4)" | F4 tiene plan aprobado; siguiente es F8 | Cambiar a F8 |
| C3 | 35 | F8 = "Migración rompiente" | Nombre vigente: F8 = "Hardening / integraciones" (estado.md ya lo usa) | Renombrar + ampliar alcance (incluir Viewer 3D) |

### 2.4 Plantillas

| # | Archivo | Línea | Referencia desalineada | Corrección |
|---|---|---|---|---|
| D1 | `PLANTILLA_HARDENING.md` | 5 | Lista "migración rompiente" como término de alcance | Término huérfano: F8 ya no se llama así. Reemplazar por descripción técnica, no por nombre viejo. |
| D2 | `PLANTILLA_PANTALLA.md` | 1 | Sin nota de alcance (implícitamente "todas las fases") | Agregar "Aplica a fases tipo PANTALLA (F2–F7)" para consistencia con las otras dos plantillas |

### 2.5 Archivos de ley (requieren checkpoint del Supervisor)

| # | Archivo | Línea | Referencia desalineada | Nota |
|---|---|---|---|---|
| E1 | `AGENTS.md` (raíz) | §Ruta V3 | "Ola 7 (Execute) — codificación de las 34 pantallas + 65 tablas + 5 gates" | Contradice estrategia "planes primero". Requiere checkpoint de mutación. |
| E2 | `OLA_7_ENTRADA.md` | §Qué es Ola 7 | "Fase de codificación y ejecución… Ola 7 SOLO CODIFICA" | Registro histórico de entrada. Actualizar banner o dejar como está (decisión del Supervisor). |

### 2.6 Símbolos de schema deprecados en docs vivos (LIVE zone)

30 archivos del arnés contienen nombres de tabla/columna ya renombrados en el REGISTRO. De estos, los docs en zona LIVE (planes de diseño, glosario, maestro, tareas) deben corregirse; los FROZEN (diagnostico/pasadas, trazabilidad) son registro histórico y no se tocan.

**Archivos LIVE con símbolos deprecados:**

| # | Archivo | Símbolo deprecado | Canon | Contexto |
|---|---|---|---|---|
| F1 | `plan_ola7_maestro.md` L30 | `check_15_dias` | `check_produccion` | Schema de F3 |
| F2 | `plan_ola7_maestro.md` L32 | `modulos_armado` | `modulos` | Schema de F5 |
| F3 | `disenio_f3_cronograma_gates.md` L31 | `check_15_dias` | `check_produccion` | Entidad que consume P-11 |
| F4 | `disenio_f3_cronograma_gates.md` L82 | `modulos_armado` | `modulos` | Contenido P-11 "lee modulos" |
| F5 | `plan_f5.md` L15 | `modulos_armado` | `modulos` | Hallazgo H-B3-3-03 |
| F6 | `plan_t-080.md` L14 | `check_15_dias` | `check_produccion` | Archivos schema a crear |
| F7 | `glosario_h07.md` L37,50,59 | `modulos_armado` | `modulos` | Labels "Módulo", "Armado", "Fila del taller" |
| F8 | `glosario_h07.md` L60,223,443 | `check_15_dias` | `check_produccion` | Label "Check de los 15 días", estados, mapeo campo |
| F9 | `disenio_modulo_espacio.md` L32 | `modulos_armado` | `modulos` | Nota de transición "amplía/reemplaza" |
| F10 | `plan_f6.md` L47 | `check_15_dias` | `check_produccion` | La sección §4 CORRIGE el naming pero el título usa el viejo como referencia |

**Archivos FROZEN con símbolos deprecados (WARN, no corregir):**
- `diagnostico/pasadas/d3_*`, `diagnostico/trazabilidad_punto0/resultados/*`, `diagnostico/log_insights_fase2.md`, `diagnostico/diamante2_*` — contienen los nombres viejos como evidencia del linaje de decisiones. Se listan para trazabilidad, no se corrigen.

**Archivos EXENTOS (usan nombres deprecados deliberadamente):**
- `nucleo/REGISTRO_DE_ENTIDADES.md` — columnas "Renombrado desde" y §11 mapean explícitamente viejo → nuevo. El checker las excluye de error.

---

## 3. Plan de corrección

### Fase 1 — Correcciones automáticas (sin checkpoint)

Actualizar en este orden, un archivo por vez. Verificar con `git diff` tras cada bloque.

**Bloque A — `arnes/estado.md`:**
- A1: línea 20 → "Plantillas de diseño en `PLANTILLA_PANTALLA.md`, `PLANTILLA_HARDENING.md`, `PLANTILLA_QA.md`"
- A2: §PRÓXIMA ACCIÓN → tabla consolidada (F0–F7 aprobado | F8 SIGUIENTE | F9 pendiente)
- A3: línea 36–37 → próxima acción = "abrir bucle F8 (hardening)"
- A4: líneas 41–50 → lista de 8 artefactos (agregar plantillas HARDENING y QA)
- A5: línea 77 → F4 → F8

**Bloque B — `arnes/INDEX.md`:**
- B1: agregar `1.e2` y `1.e3` con las dos plantillas nuevas
- B2: línea 49 → actualizar estado del D4
- B3: línea 75 → remover "pendiente P-04"

**Bloque C — `arnes/lineas/ola7/plan_ola7_maestro.md`:**
- C1: header → alinear alcance con estrategia
- C2: línea 17 → F4 → F8
- C3: línea 35 → F8 renombrar + ampliar + citar `PLANTILLA_HARDENING.md`

**Bloque D — Plantillas:**
- D1: `PLANTILLA_HARDENING.md` línea 5 → eliminar término "migración rompiente"
- D2: `PLANTILLA_PANTALLA.md` header → agregar nota de alcance (F2–F7)

**Bloque E — Símbolos de schema en docs LIVE:**
- E-F1/F2: `plan_ola7_maestro.md` → `check_15_dias` → `check_produccion` en L30; `modulos_armado` → `modulos` en L32
- E-F3/F4: `disenio_f3_cronograma_gates.md` → `check_15_dias` → `check_produccion` en L31; `modulos_armado` → `modulos` en L82
- E-F5: `plan_f5.md` L15 → `modulos_armado` → `modulos`
- E-F6: `plan_t-080.md` L14 → `check_15_dias` → `check_produccion`
- E-F7/F8: `glosario_h07.md` → `modulos_armado` → `modulos` (L37,50,59); `check_15_dias` → `check_produccion` (L60,223,443)
- E-F9: `disenio_modulo_espacio.md` L32 → actualizar a "`modulos` (hereda la semántica de `modulos_armado`)" para que el canon vaya primero
- E-F10: `plan_f6.md` L47 → la sección ya documenta el rename; conservar el título como "Corrección de naming" y actualizar referencias internas

### Fase 2 — Correcciones con checkpoint (solo si el Supervisor decide)

| Archivo | Cambio | Riesgo |
|---|---|---|
| `AGENTS.md` | Reconciliar framing de Ola 7 con estrategia "planes primero" | Mutación del arnés |
| `OLA_7_ENTRADA.md` | Opción A: banner "Este documento pre-data la estrategia PLANES PRIMERO (2026-08-07)" · Opción B: dejar intacto como registro histórico | Opción A = reescritura; Opción B = conservador |

---

## 4. Verificación post-alineación

| # | Condición | Comando / verificación |
|---|---|---|
| V1 | `estado.md` — sin filas duplicadas en tabla de fases | `grep -c "Hardening / integraciones" arnes/estado.md` = 1 |
| V2 | `estado.md` — 8 artefactos canónicos listados | `grep -c "PLANTILLA" arnes/estado.md` ≥ 3 |
| V3 | `INDEX.md` — 3 plantillas referenciadas | `grep "PLANTILLA" arnes/INDEX.md` ≥ 3 |
| V4 | `INDEX.md` — D4 no dice "ABIERTO" | `grep "Diamante 4" arnes/INDEX.md` no contiene "ABIERTO" |
| V5 | `plan_ola7_maestro.md` — F8 no dice "Migración rompiente" | `grep "Migración rompiente" arnes/lineas/ola7/plan_ola7_maestro.md` = 0 |
| V6 | `plan_ola7_maestro.md` — F8 referencia PLANTILLA_HARDENING | `grep "PLANTILLA_HARDENING" arnes/lineas/ola7/plan_ola7_maestro.md` ≥ 1 |
| V7 | `PLANTILLA_HARDENING.md` — sin "migración rompiente" | `grep "migración rompiente" arnes/lineas/ola7/tecnico/PLANTILLA_HARDENING.md` = 0 |
| V8 | `PLANTILLA_PANTALLA.md` — nota de alcance (F2–F7) | `grep "F2.*F7" arnes/lineas/ola7/pantallas/PLANTILLA_PANTALLA.md` ≥ 1 |
| V9 | `plan_alineacion.md` — presente e indexado | `grep "plan_alineacion" arnes/INDEX.md` ≥ 1 |
| V10 | Cero referencias cruzadas a fase vieja (F4 como "próxima") | `grep -r "próxima fase.*F4" arnes/estado.md` = 0 |
| V11 | `plan_ola7_maestro.md` — sin símbolos deprecados en schema de fases | `grep "check_15_dias\|modulos_armado" arnes/lineas/ola7/plan_ola7_maestro.md` = 0 |
| V12 | `glosario_h07.md` — labels usan nombres canónicos | `grep -c "check_15_dias\|modulos_armado" arnes/nucleo/glosario_h07.md` = 0 |
| V13 | `disenio_f3_cronograma_gates.md` — entidades citan REGISTRO canónico | `grep "check_15_dias\|modulos_armado" arnes/lineas/ola7/pantallas/disenio_f3_cronograma_gates.md` = 0 |
| V14 | `plan_t-080.md` — schema a crear usa nombre canónico | `grep "check_15_dias" arnes/planes/plan_t-080.md` = 0 |
| V15 | `plan_f5.md` — sin referencia a `modulos_armado` | `grep "modulos_armado" arnes/lineas/ola7/plan_f5.md` = 0 |

---

## 5. Indexación de este documento

Para que el arnés reconozca al doctor:

### En `arnes/INDEX.md`

Agregar en §4 `arnes/planes/`:

```
**Plan de Alineación: `plan_alineacion.md`** — doctor del arnés: diagnóstico de referencias desalineadas y plan de corrección unívoco. Se actualiza al detectar divergencia entre el proceso real y los documentos vivos.
```

### En `arnes/ESTRUCTURA_OUTPUT_PRE_CODIGO.md`

Agregar en el árbol §2 bajo `planes/`:

```
├── plan_alineacion.md                ← Doctor del arnés (diagnóstico de alineación)
```

Y en la tabla §6 de contratos vivos:

```
| `plan_alineacion.md` | Contrato vivo | Al detectar nueva desalineación entre docs vivos y proceso real |
```

---

## 6. Regla de mantenimiento

Cuando cualquier documento vivo del arnés cambie y cree divergencia con otro:

1. **Detectar** — el Orquestador o QA nota la discrepancia al leer contexto.
2. **Registrar** — se agrega una fila en §2 de este documento (tipo: DETECTADO, archivo, referencia desalineada, estado real).
3. **Corregir** — se ejecuta la corrección según §3.
4. **Verificar** — checklist §4 se re-ejecuta.
5. **Cerrar** — la fila se marca como CORREGIDO con fecha.

Nunca se acumulan desalineaciones sin corregir. Nunca se corrige "de memoria" sin registrar en este documento. El doctor diagnostica antes de operar.

---

## 7. Principio de zonificación de referencias (para tooling futuro)

No toda referencia a un nombre deprecado es un error. La auditoría de alineación clasifica cada archivo según su zona:

| Zona | Archivos | Comportamiento | Fundamentos |
|---|---|---|---|
| **LIVE** | `lineas/ola7/pantallas/disenio_*`, `planes/plan_f*`, `planes/PLANTILLA_*`, `nucleo/glosario_h07.md`, `planes/plan_ola7_maestro.md`, `tareas/*.json`, `estado.md`, `INDEX.md`, `AGENTS.md`, `MODELOS.md` | **ERROR** si usa nombre deprecado. Estos docs son leídos por agentes para construir — no pueden contener nombres viejos. | Un agente Código que lea `plan_f5.md` y vea `modulos_armado` creará una tabla con nombre equivocado. |
| **FROZEN** | `diagnostico/pasadas/**`, `diagnostico/trazabilidad*/**`, `diagnostico/diamante*`, `diagnostico/log_insights*`, `diagnostico/inventario_legacy.md`, `diagnostico/destilacion_*` | **WARN** informativo. Contienen nombres deprecados como prueba del linaje de decisiones. Se listan pero no bloquean. | Borrar `check_15_dias` de una pasada D3 rompe la trazabilidad de "por qué se decidió renombrar". |
| **EXENTA** | `nucleo/REGISTRO_DE_ENTIDADES.md` | **EXCLUIDA** de error. Usa nombres deprecados en columnas "Renombrado desde" y §11 como fuente del mapeo canónico. El checker valida que las entradas del diccionario existan en el REGISTRO. | El REGISTRO es la fuente que define qué nombre es canónico y cuál es deprecado — no puede marcarse a sí mismo como error. |

**Regla de prioridad:** si un archivo está en zona LIVE y contiene un símbolo deprecado, se corrige. Si está en FROZEN, se registra en este plan pero no se toca. Si está en EXENTA, se usa como fuente de verdad del diccionario.

### Diccionario canónico de renames (semilla para tooling)

```
{
  "schemas": {
    "deprecated": {
      "check_15_dias":   { "canon": "check_produccion",  "source": "plan_f6.md §4" },
      "modulos_armado":  { "canon": "modulos",           "source": "D-2026-08-07-C" },
      "veredictos_calidad": { "canon": "verificaciones", "source": "REGISTRO — tabla unificada" },
      "productos_acabados": { "canon": "catalogo_acabados", "source": "FLAG-4 + D-2026-08-07-C" }
    }
  },
  "notas": {
    "audit_logs": "Tabla canónica válida en REGISTRO y schema.ts. No es rename. El módulo F0 agrupa eventos + audit_logs + procedencia."
  }
}
```

Este diccionario es la semilla de una herramienta `check_referencias` que automatice las verificaciones V1–V15. Hasta que exista, la verificación es manual con los comandos de §4.

---

## 8. Estado de ejecución (2026-08-08)

**Decisión de proceso:** se evaluó ejecutar esta corrección vía `plan_rediagnostico.md` (6 bucles + subagentes). El Supervisor la difirió — se solapaba con el diagnóstico ya cerrado de este documento, y las 7 dimensiones de auditoría que proponía (D1/D3/D4/D5/D6/D7/D8) son mecánicas (regex/`Test-Path`/parseo JSON), no tareas que un agente deba resolver. Se ejecutó directo, sin agentes. Ver nota de diferimiento en `plan_rediagnostico.md` §0.b.

### Fase 1 — CORREGIDO (todos los bloques A-E)

| Bloque | Ítems | Estado |
|---|---|---|
| A (`estado.md`) | A1-A5 | ✅ CORREGIDO — plantillas ampliadas, tabla de fases consolidada, próxima acción → F8, artefactos canónicos completos |
| B (`INDEX.md`) | B1 (ya estaba), B2 | ✅ CORREGIDO — Diamante 4 ABIERTO → CERRADO. B3 no encontrado en el archivo actual (ya no aplica) |
| C (`plan_ola7_maestro.md`) | C1-C3 | ✅ CORREGIDO — status VIGENTE, F4→F8, F8 renombrado a "Hardening / integraciones" citando `PLANTILLA_HARDENING.md` |
| D (Plantillas) | D1-D2 | ✅ CORREGIDO — "migración rompiente" eliminado de `PLANTILLA_HARDENING.md`; nota de alcance F2–F7 agregada a `PLANTILLA_PANTALLA.md` |
| E (símbolos deprecados) | F1-F10 | ✅ CORREGIDO — `check_15_dias`→`check_produccion` y `modulos_armado`→`modulos` en `plan_ola7_maestro.md`, `disenio_f3_cronograma_gates.md`, `plan_f5.md`, `plan_t-080.md`, `glosario_h07.md` (5 ocurrencias), `disenio_modulo_espacio.md`. F10 (`plan_f6.md`) no requería cambio — ya documentaba el rename correctamente |

### Fase 2 — parcialmente ejecutada

| Ítem | Estado |
|---|---|
| E1 (`AGENTS.md`) | ✅ CORREGIDO 2026-08-08 — punto 1 (Diamante 4) actualizado a CERRADO; punto 2 reencuadrado de "Ola 7 Execute codifica 34 pantallas" a "banda F0-F9 planes primero, código después" |
| E2 (`OLA_7_ENTRADA.md`) | Sin tocar — se deja como registro histórico (Opción B), no bloquea nada |

### Hallazgos nuevos de esta sesión (no estaban en el diagnóstico original de §2) — CORREGIDO 2026-08-08

| ID | Hallazgo | Corrección aplicada |
|---|---|---|
| G1 | `estado.md` (2 filas), `plan_f7.md`, `destilacion_f3_publico.md` afirmaban "F-01 Landing — Existente (PoC 3)". Falso: V3 no tiene código público real, solo demos de tokens D4. Las páginas reales citadas (`/proceso`, `/espacios`, 6 landings) existieron en el prototipo v2 descartado. | Las 4 referencias corregidas a "Por construir", citando `plan_estructura_sitio_publico.md` |
| G2 | Sin regla que impida usar código de PoC como evidencia de pantalla aprobada — causa raíz de G1. | Regla nueva en `AGENTS.md` §Prohibido y `estado.md` §Decisiones vigentes (2026-08-08) |
| G3 | Colisión de numeración "F-03" (Agendar en `glosario_h07.md`/`estado.md` D-04 vs. Portafolio en el canon vigente desde 2026-08-05) — la misma familia de problema que este documento diagnostica, no capturada en la Fase 1 original. | Resuelto asignando **F-12** a "Agendar" (numeración nueva de `plan_estructura_sitio_publico.md`, sin colisión). Corregido en `glosario_h07.md` (2 filas) y `estado.md` (fila D-04) |

**Verificación post-corrección:** `check_15_dias` y `modulos_armado` = 0 ocurrencias en los 6 archivos LIVE listados en Fase 1/E. F-03 ya no aparece referenciando "Agendar" en ningún archivo LIVE tocado hoy.

---

## 8. Vicios del diagnóstico y limitaciones

El doctor diagnosticó en dos pasadas con hipótesis acotadas. Esto deja un margen de error que debe declararse para no confundir "lo que se encontró" con "todo lo que hay".

### 8.1 Sesgos del proceso de diagnóstico

| Vicio | Descripción | Consecuencia | Evidencia concreta |
|---|---|---|---|
| **Búsqueda reactiva** | Ambas pasadas partieron de hipótesis específicas (alineación estructural, renames de schema). Se buscó lo que se sospechaba, no se inventarió todo. | Hallazgos fuera de las hipótesis quedaron fuera del diagnóstico. | Solo 2 patrones de búsqueda usados en ~250 archivos del arnés. |
| **Sesgo de confirmación** | Los grep buscaron patrones que confirmaran la hipótesis (`PLANTILLA_PANTALLA`, `Migración rompiente`, `check_15_dias`, `modulos_armado`). No se buscaron patrones alternativos que pudieran revelar nuevas categorías de desalineación. | Lo encontrado es un subconjunto de lo que existe. | Los 4 renames del diccionario (§7) vienen de 2 decisiones conocidas (plan_f6.md §4, D-2026-08-07-C). Renames de `nota_migracion_inteligente_campos.md` (precio_directo→valor_unitario, precio_publico→valor_tienda, stock_actual→inventario_disponible, publicado_web→visible_en_tienda, categoria_comercial→categoria_tienda) no se auditaron en docs LIVE. |
| **Monodimensionalidad** | 1ª pasada: dimensión estructural. 2ª pasada: dimensión símbolos de schema. Cada una ciega a la otra. | Dimensiones enteras sin auditar. | Ver §8.2. |
| **Sin verificación de espacio negativo** | Solo se buscó "qué nombre viejo sobrevive donde no debería". No se buscó "qué referencia apunta a algo que no existe". | Referencias huérfanas (archivos, entidades, tareas) no detectadas. | `plan_f0.md` y `plan_f1.md` listados en el árbol de `ESTRUCTURA_OUTPUT_PRE_CODIGO.md` §2 como outputs esperados — pero **no existen** en el repositorio. Ninguna auditoría los buscó. |
| **Muestreo por conveniencia** | Se auditó un subconjunto de archivos de alta visibilidad (estado.md, maestro, INDEX, plantillas, glosario, diseños). | El resto del arnés (~250 archivos) no se leyó completo. | 90 tareas JSON en ledger, 38 archivos en planes/, decenas en diagnostico/pasadas — la gran mayoría no se inspeccionó línea por línea. |
| **Sin cruce de referencias** | Un diseño dice "consume entidad X del REGISTRO §Y". ¿Existe X en esa sección? No se verificó. | Entidades inexistentes o mal referenciadas no se detectan. | No verificado para los 18 diseños. |
| **JSON corrupto no detectado** | El ledger tiene 90 archivos JSON. La verificación de formato nunca se ejecutó. | Tareas con JSON malformado pasan desapercibidas. | `t-008.json` tiene error de parseo (falta una coma o llave de cierre). Ninguna auditoría ejecutó `jq` o `ConvertFrom-Json` sobre el ledger. |

### 8.2 Dimensiones no cubiertas por el diagnóstico

Estas categorías de desalineación no se auditaron en ninguna de las dos pasadas. Pueden contener hallazgos adicionales:

| Dimensión | Qué verificaría | Cantidad estimada | Riesgo de hallazgos no detectados |
|---|---|---|---|
| **Consistencia tareas↔planes** | Cada `plan_ref` en tareas/*.json apunta a un archivo que existe. Cada plan de tarea referencia una tarea que existe en el ledger. | ~90 tareas × ~3 planes | Medio — tareas v2 sin plan son esperables; tareas v3 (t-074+) deberían tenerlo |
| **Consistencia diseños↔REGISTRO** | Cada entidad citada en "Entidades que consume" de un diseño existe en el REGISTRO_DE_ENTIDADES.md con los campos declarados. | 18 diseños × ~5–12 entidades | Alto — si un diseño declara una entidad o campo inexistente, el agente Código construirá sobre humo |
| **Consistencia código↔arnés** | Las rutas declaradas en diseños corresponden a páginas en `app/`. Las tablas referenciadas existen en `lib/db/schema.ts`. Los módulos citados existen en `lib/modules/`. | ~34 pantallas + ~65 tablas | Alto — el arnés y el código divergen sin que nadie lo sepa |
| **Renames adicionales** | El diccionario de §7 tiene 4 entradas. `nota_migracion_inteligente_campos.md` documenta ~14 renames más que no se auditaron en docs LIVE. | ~14 renames adicionales | Medio — algunos son de catálogo (F1, aún sin plan_f1.md); otros de tienda/portafolio (F7) |
| **Referencias a archivos inexistentes** | Cualquier `path/to/file.md` o `ruta/` en docs vivos que apunte a un archivo que no existe. | Desconocido | Bajo — principalmente molestia, no bloquea construcción |
| **Consistencia eventos↔diseños** | Cada evento E-XX referenciado en un diseño existe en `diamante2_define_eventos.md` con la semántica correcta. | ~61 eventos × referencias cruzadas | Medio — un diseño que cite E-99 (inexistente) pasaría desapercibido |
| **Consistencia parámetros↔diseños** | Cada clave de `parametros` citada en un diseño existe en el seed o en el REGISTRO. | ~26+6 claves de parámetros | Bajo — los parámetros están bien documentados en F0 |
| **Consistencia glosario↔diseños** | Cada label del glosario_h07.md se usa en al menos un diseño. Cada label de UI en diseños tiene entrada en el glosario. | ~73 verbos + ~50 mapeos | Medio — divergencia de vocabulario entre diseño y glosario |
| **Formato de archivos del ledger** | Los 90 JSON son parseables. Los campos obligatorios (id, estado, tipo, zona) están presentes. | 90 archivos | Bajo — tareas corruptas no bloquean pero ensucian el ledger |

### 8.3 Margen de error estimado

Basado en los vicios detectados y las dimensiones no cubiertas:

| Tipo de hallazgo | Cobertura actual | Hallazgos probables no detectados |
|---|---|---|
| Desalineación estructural (fases, plantillas, progreso) | **Alta** (~90%) — se auditó exhaustivamente en 5 archivos core | 1–2 referencias menores en secciones no leídas de estado.md |
| Símbolos de schema deprecados en LIVE | **Media** (~60%) — se auditaron 4 renames; hay ~14 más documentados en nota_migracion | 5–10 referencias adicionales en glosario, diseños F1/F7, planes de tarea |
| Entidades/eventos/parámetros inexistentes referenciados | **Cero** (0%) — no se auditó | Desconocido; primera pasada necesaria para estimar |
| Tareas↔planes huérfanos | **Cero** (0%) — no se auditó | ~32 tareas sin plan_ref; algunas pueden ser esperables (v2), otras no |
| Código↔arnés divergente | **Cero** (0%) — no se auditó | Potencialmente alto si el código v2 sobrevive con nombres viejos |

### 8.4 Regla de cobertura progresiva

El doctor no pretende ser exhaustivo en su primer diagnóstico. Reconoce sus límites y prescribe cómo cerrarlos:

1. **Cada nueva pasada de auditoría** agrega una dimensión a §8.2 y actualiza el margen de error en §8.3.
2. **Cuando se construya `check_referencias`** (§7), las dimensiones "Consistencia tareas↔planes", "Referencias a archivos inexistentes" y "Formato de archivos del ledger" se automatizan.
3. **La dimensión "Consistencia diseños↔REGISTRO"** es la de mayor riesgo no cubierto y la próxima prioridad de auditoría manual.
4. **Nunca se declara "diagnóstico completo"** — el doctor siempre lista qué dimensiones faltan por auditar.
