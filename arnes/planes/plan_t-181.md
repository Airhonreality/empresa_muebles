# Plan t-181 — Finanzas simple: libro de entradas/salidas

## Objetivo
Registrar entradas y salidas de una sola caja ("Caja principal") con comprobante opcional
en R2, proyecto opcional en ambos tipos y proveedor opcional solo en salidas. Sin medio de
pago en la UI. La base no se limpia: solo se agrega `movimientos_financieros.proveedor_id`
(nullable, FK a `proveedores`) porque la relación no existe.

## Decisiones de Supervisor (2026-10-17)
- Una sola cuenta por defecto; si no existe, botón "Crear caja principal".
- Sin selector de cuenta cuando hay una sola; selector como fallback si hay varias.
- Sin `medio_pago` visible (se guarda `null`).
- Comprobante opcional: imagen o PDF vía `FilePicker` → R2 `finanzas/comprobantes/`.
- Proyecto opcional en entradas y salidas.
- Proveedor opcional solo en salidas.
- Saldo negativo permitido.
- No se borran columnas ni tablas; la auditoría de huérfanos es t-182.

## Cambios

### 1. Schema / migración
- `lib/db/schema.ts`: `proveedorId: uuid("proveedor_id")` en `movimientosFinancieros` +
  FK `movimientosFinancierosProveedorIdFk`.
- `drizzle/v3/0032_movimientos_financieros_proveedor.sql`:
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS proveedor_id uuid`
  - FK idempotente con `DO $$ ... EXCEPTION WHEN duplicate_object`.
- `drizzle/v3/meta/_journal.json`: entrada idx 32.
- **Orden de despliegue:** aplicar 0032 en la base real que lee Vercel antes del push.

### 2. Contratos y validación
- `lib/data/contracts.ts`:
  - `CuentaFinanciera.saldoInicial`.
  - `MovimientoFinanciero.proveedorId`.
  - `MovimientoManualInput` y `movimientosFinancieros.crear(...)`.
  - `cuentasFinancieras.crear` acepta `saldoInicial`.
- `lib/validacion/finanzas.ts` + test: movimiento manual y cuenta.
  - `proveedorId` solo válido cuando `tipo === 'salida'`.

### 3. Server Actions
- `crearMovimientoManualAction`: transacción; inserta movimiento + actualiza saldo con
  aritmética SQL atómica; permite saldo negativo.
- `crearCuentaFinancieraAction`: guarda `saldoInicial` y `saldoActual`.

### 4. Stores
- `mock-store.ts` y `drizzle-impl.ts`: `movimientosFinancieros.crear` con actualización
  inmediata de saldo y lista de movimientos.
- Corregir caché inmediata de `registrarPago`/`autorizarPago` donde aplique.
- `coverage-manifest.ts`: registrar `crearMovimientoManualAction`.

### 5. UI
- `components/veta/movimiento-financiero-modal.tsx`: Entrada/Salida, fecha, descripción,
  monto, comprobante; "Más opciones" con proyecto (ambos) y proveedor (solo salida).
- `components/veta/cuenta-financiera-modal.tsx`: nombre, tipo, saldo inicial.
- `/erp/finanzas`: botones de acción, KPIs de mes, últimos movimientos, accesos.
- `/erp/finanzas/caja`: mismos botones y libro con comprobante/proyecto/proveedor.

## Verificación
- `npx tsc --noEmit`
- `npx eslint .`
- `npx tsx lib/validacion/finanzas.test.ts`
- `DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx lib/data/mock-store.test.ts`
- `DATABASE_URL='...' npx tsx lib/data/queries/coverage.test.ts`
- QA manual mínimo en dev.

## Rollback
- Código: revert del commit.
- Migración: `ALTER TABLE movimientos_financieros DROP COLUMN proveedor_id` (pierde solo
  asociaciones nuevas de proveedor).

## Seguimiento 2026-10-17 — edición, anulación y modales anidados

Casos reales detectados al usar el libro:
- Fecha equivocada: se puede corregir editando el movimiento (el modal precarga todos los campos).
- Salida creada sin proveedor: se puede completar después con "Editar".
- Tipo equivocado o duplicado: se anula el movimiento (soft delete) y se crea uno nuevo.
- Faltaba crear entidades desde los desplegables: proveedor y proyecto se crean en un modal
  anidado desde el movimiento; cuenta desde obligaciones; proveedor desde cuentas de cobro.

Cambios de datos:
- `movimientosFinancieros.actualizar(id, data)`: ajusta saldo por diferencia de monto.
- `movimientosFinancieros.anular(id)`: revierte saldo y deja `estado='anulado'`; idempotente.
- `MovimientoFinanciero.estado` tipado como `'asentado' | 'anulado'`.
- El libro muestra anulados con badge y los excluye de KPIs; filtros por mes, estado y búsqueda.

## Seguimiento — tabla agnóstica y orden por clic en encabezado

- Se descartó el desplegable "Ordenar por" (parche local): el patrón correcto es clic en el
  encabezado de la columna, ascendente/descendente, con indicador y `aria-sort`.
- Nueva primitiva `components/veta/data-table.tsx` (`DataTable<T>` + `DataTableColumn<T>`):
  recibe filas y columnas, ordena con `sortValue`, no agrega dependencias y se puede
  instanciar en cualquier listado. Usada en `/erp/finanzas` (libro resumen) y
  `/erp/finanzas/caja` (libro mayor).
- Columnas ordenables: fecha del movimiento, fecha de registro, descripción, proyecto/proveedor,
  tipo, monto y cuenta. Comprobante/acciones quedan como columnas no ordenables.
- Ambas fechas visibles: "Fecha mov." y "Registro".

## Seguimiento — migración de tablas ERP al DataTable

Migradas a `components/veta/data-table.tsx` (orden por clic en encabezado):
- clientes, proveedores, pedidos web
- compras: lista de OC, ítems de OC, recepción, perfil de proveedor (OC y cuentas de cobro)
- equipo: saldos pendientes por comisiones
- finanzas: obligaciones, cuentas de cobro, libros resumen/mayor y bloqueos de caja E-20
- catálogos: espacios arquitectónicos

Excepciones deliberadas:
- Contrato y propuesta imprimibles: son documentos de impresión/PDF con CSS propio, no tablas interactivas.
- Cronograma del proyecto: encabezado agrupado de dos filas con `colSpan`, que la primitiva plana no representa.
- `item-descriptor-modal`: tabla clave/valor sin encabezado, no es un listado de entidades.
