# Plan t-187 — Clientes, catálogo y listado/alta de cotizador escopados

## Objetivo
Cerrar las rutas del ciclo núcleo que todavía hidrataban el snapshot global:
`/erp/clientes`, `/erp/clientes/[clienteId]`, `/erp/catalogo`, `/erp/cotizador` y
`/erp/cotizador/new`.

## Cambios
1. Clientes: `obtenerSnapshotClientesAction` (clientes, proyectos, pedidos, obligaciones,
   contratos), compat de lecturas + actualización optimista, bridge y layout con prefetch.
   `EditarClienteModal` acepta `actualizarCliente` y cierra al instante.
2. Catálogo: `obtenerSnapshotCatalogoAction` (catálogo, productos de tienda, componentes,
   proveedores), compat con mutations de catálogo/proveedor, bridge y layout. La página
   principal pasa los callbacks a `ProductoFormModal`; `/erp/catalogo/acabados` sigue legacy.
3. Cotizador: `obtenerSnapshotCotizadorListaAction` (proyectos, clientes) para el listado y
   el alta. `CotizadorListaCompatProvider` con crear/actualizar/eliminar proyecto y crear
   cliente. `EditarProyectoModal` acepta `actualizarProyecto`.
4. `obtenerSnapshotCotizadorAction` incluye proveedores; el detalle del cotizador usa
   `actualizarProyecto` del compat en `EditarProyectoModal`.

## Verificación
`tsc`, eslint de archivos tocados, coverage.test.ts, tests de reactividad/optimismo y
`next build`. En producción: navegar entre listado, alta, detalle, clientes y catálogo sin
el snapshot de 76 tablas; confirmar altas/ediciones.

## Rollback
Revert del commit. Sin migración de schema.
