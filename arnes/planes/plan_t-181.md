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
