# Plan t-184 — Finanzas optimista (crear, editar y anular)

## Objetivo
Que registrar una entrada/salida, editar un movimiento o anularlo se refleje en la pantalla
antes de que responda el servidor. El servidor sigue siendo la fuente de verdad: si falla,
la UI revierte y muestra un toast.

## Decisiones de Supervisor (2026-10-24)
- Aprobación total para ejecutar el plan completo sin detenerse.
- Sin migración de schema: `movimientos_financieros.id` ya es UUID con default.
- `id` del movimiento se genera en el cliente (`crypto.randomUUID`) para idempotencia.

## Cambios
1. `lib/data/contracts.ts`: `MovimientoManualInput.id?` y `cuentasFinancieras.crear` acepta `id?`.
2. `lib/validacion/finanzas.ts`: `id` opcional con `z.uuid()` en movimiento y cuenta.
3. `lib/data/actions/f6.ts`:
   - `crearMovimientoManualAction`: si viene id, inserta con `onConflictDoNothing({ target: id })`.
     Si no insertó, devuelve la fila existente sin volver a mover el saldo.
   - `crearCuentaFinancieraAction`: mismo patrón.
4. `lib/data/drizzle-impl.ts`: `crear`, `actualizar` y `anular` aplican el estado optimista
   (movimiento + saldo) y `notify()` antes del await; reconciliación con la fila del servidor
   y reversión dirigida ante error. `cuentasFinancieras.crear` también es optimista.
5. `components/veta/movimiento-financiero-modal.tsx` y `cuenta-financiera-modal.tsx`: generan
   el id, aplican el cambio, cierran de inmediato y muestran un toast si el servidor falla.

## Verificación
- `npx tsc --noEmit`
- `npx eslint` archivos tocados
- `lib/validacion/finanzas.test.ts`
- `lib/data/mock-store.test.ts` (con `DATABASE_URL` y `SESSION_SECRET` placeholder)
- `next build`
- QA en producción: el modal cierra al instante y el libro/saldo se actualizan antes de la red.

## Rollback
Revert del commit. Sin cambios de schema ni de datos.
