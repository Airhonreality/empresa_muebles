# Plan t-183 — Latencia de producción: delta sync por tabla

## Objetivo
Dejar de traer el snapshot completo (76 tablas, ~2,56 MB) en cada NOTIFY. El long-poll
seguirá avisando qué tablas cambiaron y el cliente pedirá solo esas tablas, con merge
parcial y un único `notify()` por batch. El snapshot completo queda como fallback.

## Decisiones de Supervisor (2026-10-24)
- Solo producción web; no se trabaja ni se prueba en la PC local.
- Se autoriza tocar el núcleo compartido (`DataStoreProvider`, `longpoll`, `drizzle-impl`).
- Se autoriza la migración 0033 de triggers faltantes en Neon producción.
- El primer deploy es solo esta fase.

## Diseño
1. `lib/data/snapshot-tables.ts` (puro, testeable): mapa tabla→campo del snapshot,
   allowlist de tablas conocidas, tablas ignoradas (no forman parte del snapshot) y
   `aplicarTablasSnapshot()` para merge parcial.
2. `lib/data/actions/hydrate.ts`: `fetchSnapshotTablesAction(tablas)` con cargadores
   tipados `Record<SnapshotTable, ...>`, mappers existentes y resultado por tabla
   (`ok`, `campo`, `filas`, `motivo`). Tabla desconocida → `unmapped`; tabla conocida
   sin campo en el snapshot → `ignorada`; error de query → `error`.
3. `lib/data/actions/longpoll.ts`: debounce de 100 ms acumulando tablas en `Set` antes
   de resolver; el timeout de 20 s no puede devolver `changed:false` si ya hay tablas.
4. `lib/data/drizzle-impl.ts`: `applyTables(updates, version)` reemplaza solo los campos
   afectados, preserva proyectos optimistas pendientes y emite un único `notify()`.
5. `lib/data/DataStoreProvider.tsx`: delta con retry único de 500 ms; si falla, hay una
   tabla desconocida o `tablas=[]` (catch-up por versión), cae al snapshot completo.
   BroadcastChannel replica deltas (`type: 'tables'`) a las pestañas hermanas.
6. `drizzle/v3/0033_notify_triggers_faltantes.sql`: triggers para las 8 tablas sin
   trigger (`DROP TRIGGER IF EXISTS` + `CREATE TRIGGER`, idempotente).
7. `lib/data/queries/coverage-manifest.ts`: registrar `fetchSnapshotTablesAction`.
8. `lib/data/snapshot-tables.test.ts`: cobertura del mapa, merge y allowlist.

## Orden de despliegue
La migración 0033 se aplica **después** de que el código de delta esté en producción.
Al revés, los NOTIFY nuevos seguirían disparando el snapshot completo con el código
viejo. Verificación: `select tgname from pg_trigger where not tgisinternal` antes/después.

## Verificación
- `npx tsc --noEmit`
- `npx eslint` sobre los archivos tocados
- `npx tsx lib/data/snapshot-tables.test.ts`
- `npx tsx lib/data/queries/coverage.test.ts` con `DATABASE_URL` placeholder
- En producción: una escritura de finanzas no debe devolver el snapshot completo;
  el payload del delta debe ser de pocas tablas; sync entre pestañas <1 s.

## Rollback
Revert del commit. La migración 0033 solo agrega triggers; si se revierte el código,
los triggers nuevos siguen siendo inofensivos (solo emiten NOTIFY).
