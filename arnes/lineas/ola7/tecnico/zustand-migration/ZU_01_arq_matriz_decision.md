# ZU_01: Matriz de Decisión Recalibrada para 100 Cotizadores

## Criterios (pesados para el objetivo de escala)

| Criterio | Peso | Definición |
|----------|------|------------|
| **C1: Rendimiento a escala (100 cotizadores)** | 35% | ¿La propuesta mantiene fluidez con cientos de items y decenas de cotizadores abiertos? |
| **C2: Resuelve los problemas funcionales (P3, P4)** | 20% | ¿Permite eliminar/renombrar variantes? |
| **C3: Arquitectura mantenible a largo plazo** | 20% | ¿Es estándar, documentado, sostenible por cualquier dev que llegue? |
| **C4: Preserva inversiones existentes (Drizzle, SA, long-poll, 73 tests, gates)** | 15% | ¿No se tira nada? |
| **C5: Riesgo de regresión** | 10% | ¿Qué tan probable romper lo que funciona? |

## Evaluación de Propuestas

| Criterio | Mi propuesta (Zustand) | Otro dev (useSyncExternalStore manual) |
|----------|------------------------|----------------------------------------|
| **C1: Rendimiento a 100 cotizadores** | **9/10** — selectors granulares + optimistic + useMemo reducen re-render a solo el item tocado | **6/10** — domain-level reduce algo, pero sin optimistic, la latencia de red sigue; y el boilerplate custom no escala tan limpio |
| **C2: P3/P4** | **9/10** — `eliminarVariante()` + rename inline diseñados | **3/10** — "add eliminar()" sin diseño; no toca rename |
| **C3: Mantenibilidad** | **9/10** — Zustand es estándar, documentado, 1kB, sin boilerplate | **5/10** — más código custom `useSyncExternalStore` que mantener; no es estándar |
| **C4: Preserva inversiones** | **8/10** — se preserva todo; solo cambia el motor de suscripción | **9/10** — preserva más literalmente (mantiene el mismo mecanismo) |
| **C5: Riesgo de regresión** | **7/10** — cambio de motor, migración incremental mitiga | **8/10** — menos cambio, menos riesgo |
| **TOTAL PONDERADO** | **8.55/10** | **6.10/10** |

## Por qué la brecha se amplía con el objetivo de 100 cotizadores

| | Sin el objetivo de escala | Con objetivo de 100 cotizadores |
|---|---|---|
| **Mi propuesta** | 8.35 | **8.55** (consistente, escala bien) |
| **Otro dev** | 7.55 | **6.10** (no resuelve P2/P3/P4 ni optimiza para escala) |

La brecha pasa de **0.8 puntos** a **2.45 puntos**. El objetivo "100 cotizadores" es exactamente lo que **distingue** la propuesta correcta de la incorrecta — y el otro dev no lo contempló en su diseño.