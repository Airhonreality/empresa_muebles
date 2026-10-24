# Plan t-186 — Cotizador y ficha de proyecto con lecturas escopadas

## Objetivo
Sacar del snapshot global las dos rutas más pesadas del ciclo núcleo: el detalle del
cotizador (`/erp/cotizador/[proyectoId]` + contrato) y la ficha de proyecto
(`/erp/proyectos/[proyectoId]`). Ambas pasan al route group `(modern)` con su propio
snapshot escopado, prefetch SSR e invalidación por tablas.

## Cambios
1. Cotizador:
   - `CotizadorSnapshot` incluye `proveedores` (necesario para el alta rápida de producto).
   - El layout del proyecto migra a `(modern)` con prefetch de `obtenerSnapshotCotizadorAction`
     y un `CotizadorProyectoChrome` cliente para bridge/banner/historial.
   - `useCotizadorSnapshot` baja de `staleTime 0` a 30 s; el bridge sigue invalidando por tabla.
   - Se agregan mutations de catálogo (crear/actualizar/eliminar) y proveedor al compat del
     cotizador, y `ProductoFormModal` acepta callbacks opcionales para no depender del DataStore.
   - `/erp/cotizador/new` espera la creación antes de navegar (la ficha ya no lee el store
     global del DataStore).
2. Ficha de proyecto:
   - `obtenerSnapshotProyectoAction(proyectoId)`: proyecto, cliente, espacios, items,
     artefactos, módulos, cronograma+etapas, desfases, verificaciones, recepciones,
     citaciones, reprocesos, instalaciones, actas, obligaciones (global para caja),
     órdenes de compra, notas, artefactos de módulo, catálogo y cuentas.
   - `ProyectoCompatProvider` expone solo lecturas (la página no escribe) y
     `ProyectoSnapBridge` invalida por tablas del ciclo de producción.
   - El layout moderno prefetcha el snapshot y la página deja de usar `useDataStore`.
3. Las subrutas legacy de proyecto (calidad, cronograma, desarrollo, documentos, entrega,
   instalación, portafolio) permanecen en `(datastore)` y siguen funcionando.

## Verificación
`tsc`, eslint de archivos tocados, tests de reactividad/optimismo/coverage y `next build`.
En producción: abrir un proyecto desde el cotizador y desde el listado; confirmar que el
detalle y la ficha cargan sin el snapshot de 76 tablas y que las escrituras siguen
actualizando la pantalla.
