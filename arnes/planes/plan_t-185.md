# Plan t-185 — Finanzas con TanStack Query y rutas modernas sin snapshot global

## Objetivo
Que `/erp/finanzas` y `/erp/finanzas/caja` no hidraten las 76 tablas del ERP. Lecturas
escopadas (8 tablas), caché TanStack con persistencia, mutaciones optimistas e invalidación
por las tablas del NOTIFY. Las rutas legacy conservan su `DataStore` completo mediante un
route group separado.

## Diseño
1. `lib/data/actions/lecturas-finanzas.ts`: `obtenerSnapshotFinanzasAction` con cuentas,
   movimientos, obligaciones, cuentas de cobro, órdenes de compra, proveedores (id/nombre),
   proyectos (id/código/nombre) y registros de gate.
2. `lib/data/queries/finanzas-types.ts`, `finanzas-optimistic.ts` (+ test), `useFinanzasQueries.ts`,
   `finanzas-reactividad.ts`, `FinanzasSnapBridge.tsx` y `finanzas-compat.tsx`.
3. `useFinanzasSnapshot`: `staleTime 30 s`, `keepPreviousData`; persistencia de `['finanzas']`
   en `QueryProvider`.
4. Route groups:
   - `app/erp/(datastore)/`: todas las rutas legacy, con `DataStoreProvider` completo.
   - `app/erp/(modern)/finanzas`: layout con prefetch SSR, `HydrationBoundary`,
     `FinanzasCompatProvider` y bridge. `DataStoreProvider` event-only, sin snapshot inicial.
   - `app/erp/login` queda fuera de ambos grupos (no usa DataStore).
5. Las páginas y modales de finanzas consumen `useFinanzasCompat`; los modales anidados de
   proveedor/proyecto reciben un `crear` opcional para no depender del DataStore.
6. `DataStoreProvider eventOnly`: el líder del long-poll sigue trayendo deltas y
   retransmitiéndolos, para que pestañas legacy y modernas convivan; solo se omite el
   snapshot completo de arranque.

## Verificación
- `tsc --noEmit`, eslint de archivos tocados, tests puros de finanzas optimistas,
  `coverage.test.ts`, `next build`.
- En producción: `/erp/finanzas` debe responder con datos escopados, no con el snapshot de
  76 tablas; el libro y los KPIs deben actualizarse sin recarga; la navegación a
  `/erp/finanzas/obligaciones` debe montar el layout legacy con su snapshot.

## Rollback
Revert del commit. Los route groups no cambian URLs; no hay migración de schema.
