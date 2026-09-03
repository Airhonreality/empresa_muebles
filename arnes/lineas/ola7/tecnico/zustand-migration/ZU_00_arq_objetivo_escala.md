# ZU_00: Objetivo de Arquitectura para 100 Cotizadores

## Criterio Definitivo

**100 cotizadores simultáneos** es el criterio que define la arquitectura. El store monolítico con `getVersion()` global es el cuello de botella a esta escala.

## Por qué este objetivo cambia todo

Actualmente, el store monolítico con `useSyncExternalStore` global tiene estos problemas a escala:

| Problema | Comportamiento a 1 cotizador | Comportamiento a 100 cotizadores |
|----------|------------------------------|----------------------------------|
| Re-renders globales | Lento, not noticeable | **Bloquea toda la UI** - cada click en cualquier cotizador re-renderiza todos |
| Polling de snapshot | Trae 64 tablas completas | **Saturación de memoria** - el browser del vendedor tiene que mantener 100 proyectos en memoria |
| Server Actions por campo | ~2 round-trips por item | **Timeouts y freezes** - la red no aguanta 200+ escrituras simultáneas |

Este es exactamente el caso que el arnés anticipó: *"Si el árbol de componentes crece lo suficiente para que el re-render global importe, se particiona entonces"* (M-07 §3). Ese "entonces" es **ahora**.

## Matriz Recalibrada (peso 35% a rendimiento a escala)

| Criterio | Peso | Mi propuesta (Zustand) | Otro dev | Ganador |
|----------|------|------------------------|----------|---------|
| **C1: Rendimiento a 100 cotizadores** | 35% | **9/10** | 6/10 | **Zustand** |
| **C2: P3/P4 (eliminar/renombrar)** | 20% | **9/10** | 3/10 | **Zustand** |
| **C3: Mantenibilidad** | 20% | **9/10** | 5/10 | **Zustand** |
| **C4: Preservar inversiones** | 15% | 8/10 | **9/10** | Empate (ambas preservan) |
| **C5: Riesgo regresión** | 10% | 7/10 | **8/10** | Otro dev |
| **TOTAL** | **100%** | **8.55/10** | **6.10/10** | **Zustand por 2.45 pts** |

## Acuerdos Innegociables (ambas propuestas)

1. ✅ Preservar long-poll + BroadcastChannel (reactividad multi-usuario M-07b)
2. ✅ Preservar Drizzle + Server Actions como capa de escritura
3. ✅ Preservar gates y reglas de negocio existentes
4. ✅ Preservar 73 tests de mock-store (adaptados)
5. ✅ Migración incremental por fases (nunca detener cotizador)