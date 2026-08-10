# Mini-diamante — rediseño axiomático de `check_produccion`

**Fecha:** 2026-08-08 · **Estado:** propuesta, checkpoint del Supervisor aprobado para ejecutar (2026-08-08) · **Tipo:** mutacion_arnes (schema) · **Riesgo:** alto

**Reemplaza a:** `nucleo/plan_actualizacion_diagrama.md` — ese documento partió de "hay que poner al día un diagrama" y encontró en el camino que el problema no era el diagrama, era el diseño de `check_produccion` mismo. Este documento es la resolución completa; el anterior queda como registro histórico de cómo se llegó hasta acá (no se borra, se referencia).

---

## 1. Diagnóstico (Suh, *Axiomatic Design*, 1990/2001)

**Evidencia del schema actual** (`disenio_f3_cronograma_gates.md`, tabla `check_produccion`): `proyecto_id, fecha_check, desenlace(enum), insumos_en_taller, comisiones_reducidas`.

- **Violación del Axioma 1 (Independencia):** la prosa de `logica_de_negocio.md:251` declara 3 dimensiones evaluadas (insumos en taller, pagos realizados, fila de producción), pero el schema solo tiene **1 campo de las 3** (`insumos_en_taller`). Pagos realizados y fila de producción no están capturados — se evalúan sin dejar dato, y un solo `desenlace` (enum, no derivado) gobierna las consecuencias de las 3 dimensiones a la vez. No hay forma de que "pagos van mal pero insumos van bien" se distinga de "insumos van mal" en el registro.
- **Violación del Axioma 2 (Información):** `parametros.umbral_novedad_check15` es un umbral en **días absolutos**. 3 días de atraso en un proyecto de 1 módulo no es la misma señal que 3 días en uno de 12 — el sistema ya reconoce esto en otro lado (C1: "el cronograma ACORDADO se estima por factores de tamaño"), pero `check_produccion` no lo consume. Un umbral absoluto pierde información que el propio sistema ya calculó en otra tabla.
- **Consecuencia medida, no hipotética:** esta falta de estructura es la causa raíz de la inconsistencia real encontrada hoy — `REGISTRO_DE_ENTIDADES.md` dice que `extremo` reduce comisiones, `logica_de_negocio.md` y `glosario_h07.md` dicen que es `novedad`. Sin una función que derive el desenlace, cada documento tuvo que *afirmarlo* por separado, y las afirmaciones divergieron.

---

## 2. Verificación de computabilidad (antes de diseñar, no después)

Las 3 brechas son computables **con tablas que ya existen en `REGISTRO_DE_ENTIDADES.md`** — no hace falta capturar datos nuevos, hace falta usar los que ya están:

| Dimensión | De dónde sale "lo planeado" | De dónde sale "lo real" |
|---|---|---|
| Insumos en taller | `bom_materiales` (qué se necesita, por `schemas_proyecto`) | `recepciones_material` (qué se verificó recibido) |
| Pagos realizados | `ordenes_compra` esperadas a esta altura del cronograma | `ordenes_compra.estado` en `pagada`/`recibida_verificada` |
| Fila de producción | `cronograma_etapas` (etapa=`ensamblaje`, `fecha_ideal`) | `modulos.estado` (cuántos en `armado`+ ya) |
| Factor de tamaño | — | `estimaciones.factor_crecimiento` (ya existe, atado a cantidad de módulos + valor, decisión C1) |

---

## 3. Descomposición FR-DP

```
FR0: Evaluar producción real a ~15 días y derivar consecuencias (cronograma, comisiones, cliente)

├─ FR1: Medir la brecha plan-vs-real, por dimensión (mecánico, independiente, snapshot al momento del check)
│   ├─ FR1a → DP1a: ratio_insumos = (bom_materiales verificados en recepciones_material) / (bom_materiales esperados a la fecha)
│   ├─ FR1b → DP1b: ratio_pagos = (ordenes_compra en pagada+) / (ordenes_compra esperadas pagadas a la fecha)
│   └─ FR1c → DP1c: ratio_produccion = (modulos en armado+) / (modulos esperados en armado+ según cronograma_etapas)
│
├─ FR2: Clasificar severidad, ajustada por tamaño (resuelve Axioma 2)
│   └─ DP2: severidad = MIN(ratio_insumos, ratio_pagos, ratio_produccion)
│          — el eslabón más débil gobierna (mismo principio ya usado en el gate de caja: "la penalización
│            cae en el eslabón con el origen del desfase", D2). factor_crecimiento de `estimaciones` ya
│            ajustó el cronograma esperado por tamaño ANTES de este cálculo — por eso un ratio (no un
│            conteo de días) es comparable entre proyectos de 1 módulo y de 12: ambos comparan contra
│            SU PROPIO esperado, ya ajustado.
│          — clasificación: `todo_bien` si severidad ≥ `parametros.umbral_todo_bien_pct` (v1: 0.95);
│            `extremo` si severidad < `parametros.umbral_extremo_pct` (v1: 0.70); `novedad` en el medio.
│
└─ FR3: Verificador único revisa y confirma/anula (juicio humano SOBRE la medición, no en lugar de ella)
    └─ DP3: `desenlace_final` — igual a `desenlace_sugerido` salvo que el verificador lo anule con
           `override_justificacion` obligatoria (mismo patrón que `desfases_cronograma.decision_manual`
           ya usa para causalidad — no es un patrón nuevo en el sistema, es el mismo aplicado acá).
```

**Por qué "guía, no camisa de fuerza" (D1/C1) se mantiene:** FR1/FR2 son 100% mecánicos y auditable — el sistema SIEMPRE computa la sugerencia. FR3 es donde el verificador puede anular, con justificación registrada (append-only, mismo principio que `parametros_historial`/`eventos`). El sistema guía; el humano decide; ninguna decisión de anulación se pierde.

---

## 4. Resolución de la inconsistencia novedad/extremo — comisiones reducidas

**Propuesta (2/3 fuentes coincidían en que `novedad` ya reduce comisiones; `extremo` es estrictamente peor que `novedad`, así que debería reducir igual o más, no ser la única categoría que reduce):**

| Desenlace | Consecuencia en comisión | Consecuencia adicional |
|---|---|---|
| `todo_bien` | Sin reducción — posible adelanto (E-60) | Cliente ve entrega antes |
| `novedad` | Reducción parcial (v1: **-50%** de la comisión del período, `parametros.reduccion_comision_novedad_pct`) | Pospone línea interna; cliente NO se entera |
| `extremo` | Reducción total (v1: **-100%**, `parametros.reduccion_comision_extremo_pct`) | Escala; se negocia con el cliente |

**Esto reconcilia las 3 fuentes en vez de declarar una "ganadora":** `REGISTRO_DE_ENTIDADES.md` tenía razón en que `extremo` reduce comisiones (sigue siendo cierto, al 100%); `logica_de_negocio.md`/`glosario_h07.md` tenían razón en que `novedad` también las reduce (al 50%). Ninguno estaba completamente equivocado — cada uno describía una parte verdadera de una regla que nunca se escribió completa en ningún lado.

**Los 2 porcentajes (-50%/-100%) son estimados v1, mismo criterio que el resto de `parametros` del sistema (comisión 5%, tarifa carpintero 15k, etc.) — ajustables por `UPDATE`, no tocan schema. Quedan explícitamente marcados como pendientes de confirmación de magnitud exacta por el Supervisor, no como decisión cerrada de negocio.**

---

## 5. Cambios de schema (`nucleo/REGISTRO_DE_ENTIDADES.md`)

**Tabla `check_produccion` — reemplaza la versión actual:**

| Campo | Tipo | Función |
|---|---|---|
| `id` | — | — |
| `proyecto_id` | FK→proyectos | — |
| `fecha_check` | timestamp | — |
| `ratio_insumos` | numeric | DP1a, snapshot al momento del check |
| `ratio_pagos` | numeric | DP1b, snapshot |
| `ratio_produccion` | numeric | DP1c, snapshot |
| `factor_tamano_aplicado` | numeric | snapshot de `estimaciones.factor_crecimiento` en ese momento (auditable si el factor cambia después) |
| `desenlace_sugerido` | enum(todo_bien/novedad/extremo) | DP2, computado — nunca editado a mano |
| `desenlace_final` | enum(todo_bien/novedad/extremo) | DP3 — igual a sugerido salvo override |
| `override_justificacion` | text, nullable | obligatorio si `desenlace_final ≠ desenlace_sugerido` |
| `verificador_id` | FK→personas | el comercial vendedor (D3) |
| `comisiones_reducidas_pct` | numeric | derivado de `desenlace_final` vía `parametros`, no asertado suelto |

**Nuevos parámetros en `parametros`** (reemplazan `umbral_novedad_check15`):
- `umbral_todo_bien_pct` = 0.95
- `umbral_extremo_pct` = 0.70
- `reduccion_comision_novedad_pct` = 0.50
- `reduccion_comision_extremo_pct` = 1.00

**`umbral_novedad_check15` queda deprecado** (mismo tratamiento que `check_15_dias`→`check_produccion`: se documenta el rename/split, no se borra la referencia histórica).

---

## 6. Checklist de propagación

- [ ] `nucleo/REGISTRO_DE_ENTIDADES.md` §5 — tabla `check_produccion` + 4 parámetros nuevos + deprecar `umbral_novedad_check15`
- [ ] `nucleo/glosario_h07.md` — B.16 con la regla derivada (no 2 afirmaciones sueltas)
- [ ] `lineas/ola7/pantallas/disenio_f3_cronograma_gates.md` — P-11 con los 3 ratios visibles + el override
- [ ] `nucleo/logica_de_negocio.md` — prosa del check de 15 días + diagrama mermaid, ambos coherentes con esta regla
- [ ] Ledger (`arnes/tareas/`) — registrar como mutación de schema con checkpoint del Supervisor
