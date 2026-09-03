# ZU_02: Acuerdos Innegociables

Estos son los puntos de consenso entre ambas propuestas que deben garantizarse en la migración a la nueva arquitectura:

## 1. Long-poll + BroadcastChannel (M-07b)

- **Qué se preserva:** El mecanismo de reactividad multi-usuario con navigator.locks + BroadcastChannel para elegir al líder de long-poll.
- **Por qué:** Fue una decisión auditada y aprobada. Permite que varios vendedores trabajen simultáneamente sin conflictos de datos.
- **Cómo se mantiene:** El new provider subscribirá a los stores por dominio, pero el long-poll continúa trayendo snapshots del sistema completo.

## 2. Drizzle + Server Actions como capa de escritura

- **Qué se preserva:** Todas las escrituras siguen pasando por Server Actions reales (Postgres con transacciones Drizzle).
- **Por qué:** Es el patrón vigente desde t-130 y el único forma confiable de garantizar consistencia en Escrituras.
- **Cómo se mantiene:** Las acciones optimistic updates llaman al Server Action en background, esperan confirmación y luego actualizan la cache.

## 3. Gates y reglas de negocio

- **Qué se preserva:** Los 5 gates (B-1, B, etc.) y todas las validaciones de reglas de negocio puro (sin dependencia de UI).
- **Por qué:** Son la fuente de verdad del negocio, aprobadas por el Supervisor.
- **Cómo se mantiene:** Se conservan los validadores puros en los módulos correspondientes (f3, f4, f5, etc.).

## 4. 73 tests de mock-store (adaptados)

- **Qué se preserva:** Los 73 tests existentes de mock-store.
- **Por qué:** Proporcionan seguridad de que los cambios no rompen la lógica de negocio establecida.
- **Cómo se adaptan:** Se reescriben los imports de `useDataStore()` a los nuevos hooks por dominio, y se verifican que sigan pasando.

## 5. Migración incremental por fases

- **Qué se preserva:** El cotizador en `dev` nunca se detiene. Las mejoras se hacen fase por fase.
- **Por qué:** El negocio no puede permitirse que el cotizador esté fuera de servicio.
- **Cómo se ejecuta:** Empezar por la Fase 0 (estructurar stores), verificar que todo funcione, y luego expandir gradualmente.

## Qué NO se toca (fuera de alcance)

- ❌ No se elimina el schema de 65 tablas
- ❌ No se migran los datos "as-is" sin adaptación
- ❌ No se cambian los 5 gates de aprobación
- ❌ No se elimina long-poll ni BroadcastChannel