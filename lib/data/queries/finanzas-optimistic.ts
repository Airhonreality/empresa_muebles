import type {
  CuentaFinanciera,
  MovimientoFinanciero,
  MovimientoManualEdicionInput,
  MovimientoManualInput,
} from '../contracts'
import type { FinanzasSnapshot } from './finanzas-types'

export interface VarsMovimientoNuevo {
  id: string
  values: MovimientoManualInput
}

export interface VarsMovimientoEdicion {
  id: string
  values: MovimientoManualEdicionInput
}

export interface VarsCuentaNueva {
  id: string
  values: { nombre: string; tipo: string; saldoInicial?: string; saldoActual?: string }
}

function upsert<T extends { id: string }>(lista: T[], item: T): T[] {
  const existe = lista.some((x) => x.id === item.id)
  return existe ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item]
}

function ajustarSaldo(
  cuentas: CuentaFinanciera[],
  cuentaId: string | null,
  delta: number,
): CuentaFinanciera[] {
  if (!cuentaId || delta === 0) return cuentas
  return cuentas.map((c) =>
    c.id === cuentaId
      ? { ...c, saldoActual: String((Number(c.saldoActual) || 0) + delta) }
      : c,
  )
}

export function construirMovimientoOptimista(
  values: MovimientoManualInput,
  id: string,
): MovimientoFinanciero {
  const esEntrada = values.tipo === 'entrada'
  return {
    id,
    fecha: values.fecha,
    descripcion: values.descripcion,
    tipo: esEntrada ? 'credito' : 'debito',
    estado: 'asentado',
    monto: values.monto,
    cuentaOrigenId: esEntrada ? null : values.cuentaId,
    cuentaDestinoId: esEntrada ? values.cuentaId : null,
    obligacionId: null,
    ordenCompraId: null,
    proyectoId: values.proyectoId ?? null,
    contratoId: null,
    socioId: null,
    proveedorId: values.proveedorId ?? null,
    medioPago: null,
    comprobanteUrl: values.comprobanteUrl ?? null,
    prioridadPago: null,
    createdAt: new Date().toISOString(),
  }
}

export function construirCuentaOptimista(values: VarsCuentaNueva['values'], id: string): CuentaFinanciera {
  const saldo = values.saldoInicial ?? values.saldoActual ?? '0'
  return {
    id,
    nombre: values.nombre,
    tipo: values.tipo,
    saldoInicial: saldo,
    saldoActual: saldo,
    createdAt: new Date().toISOString(),
  }
}

export function agregarMovimiento(snap: FinanzasSnapshot, vars: VarsMovimientoNuevo): FinanzasSnapshot {
  const movimiento = construirMovimientoOptimista(vars.values, vars.id)
  const monto = Number(vars.values.monto) || 0
  const delta = vars.values.tipo === 'entrada' ? monto : -monto
  return {
    ...snap,
    movimientos: upsert(snap.movimientos, movimiento),
    cuentas: ajustarSaldo(snap.cuentas, vars.values.cuentaId, delta),
  }
}

export function revertirAgregarMovimiento(snap: FinanzasSnapshot, vars: VarsMovimientoNuevo): FinanzasSnapshot {
  const monto = Number(vars.values.monto) || 0
  const delta = vars.values.tipo === 'entrada' ? monto : -monto
  return {
    ...snap,
    movimientos: snap.movimientos.filter((m) => m.id !== vars.id),
    cuentas: ajustarSaldo(snap.cuentas, vars.values.cuentaId, -delta),
  }
}

export function actualizarMovimiento(snap: FinanzasSnapshot, vars: VarsMovimientoEdicion): FinanzasSnapshot {
  const existente = snap.movimientos.find((m) => m.id === vars.id)
  if (!existente) return snap
  const cuentaId = existente.cuentaOrigenId ?? existente.cuentaDestinoId
  const delta = ((Number(vars.values.monto) || 0) - (Number(existente.monto) || 0)) *
    (existente.tipo === 'credito' ? 1 : -1)
  const actualizado: MovimientoFinanciero = {
    ...existente,
    fecha: vars.values.fecha,
    descripcion: vars.values.descripcion,
    monto: vars.values.monto,
    proyectoId: vars.values.proyectoId ?? null,
    proveedorId: vars.values.proveedorId ?? null,
    comprobanteUrl: vars.values.comprobanteUrl ?? null,
  }
  return {
    ...snap,
    movimientos: upsert(snap.movimientos, actualizado),
    cuentas: ajustarSaldo(snap.cuentas, cuentaId, delta),
  }
}

export function revertirActualizarMovimiento(
  actual: FinanzasSnapshot,
  vars: VarsMovimientoEdicion,
  previo: FinanzasSnapshot,
): FinanzasSnapshot {
  const anterior = previo.movimientos.find((m) => m.id === vars.id)
  if (!anterior) return actual
  const cuentaId = anterior.cuentaOrigenId ?? anterior.cuentaDestinoId
  const delta = ((Number(vars.values.monto) || 0) - (Number(anterior.monto) || 0)) *
    (anterior.tipo === 'credito' ? 1 : -1)
  return {
    ...actual,
    movimientos: upsert(actual.movimientos, anterior),
    cuentas: ajustarSaldo(actual.cuentas, cuentaId, -delta),
  }
}

export function anularMovimiento(snap: FinanzasSnapshot, id: string): FinanzasSnapshot {
  const existente = snap.movimientos.find((m) => m.id === id)
  if (!existente || existente.estado === 'anulado') return snap
  const cuentaId = existente.cuentaOrigenId ?? existente.cuentaDestinoId
  const reverso = (Number(existente.monto) || 0) * (existente.tipo === 'credito' ? -1 : 1)
  return {
    ...snap,
    movimientos: upsert(snap.movimientos, { ...existente, estado: 'anulado' }),
    cuentas: ajustarSaldo(snap.cuentas, cuentaId, reverso),
  }
}

export function revertirAnularMovimiento(
  actual: FinanzasSnapshot,
  id: string,
  previo: FinanzasSnapshot,
): FinanzasSnapshot {
  const anterior = previo.movimientos.find((m) => m.id === id)
  if (!anterior) return actual
  const cuentaId = anterior.cuentaOrigenId ?? anterior.cuentaDestinoId
  const reverso = (Number(anterior.monto) || 0) * (anterior.tipo === 'credito' ? -1 : 1)
  return {
    ...actual,
    movimientos: upsert(actual.movimientos, anterior),
    cuentas: ajustarSaldo(actual.cuentas, cuentaId, -reverso),
  }
}

export function agregarCuenta(snap: FinanzasSnapshot, vars: VarsCuentaNueva): FinanzasSnapshot {
  return {
    ...snap,
    cuentas: upsert(snap.cuentas, construirCuentaOptimista(vars.values, vars.id)),
  }
}

export function revertirAgregarCuenta(snap: FinanzasSnapshot, id: string): FinanzasSnapshot {
  return { ...snap, cuentas: snap.cuentas.filter((c) => c.id !== id) }
}

export function reconciliarMovimiento(snap: FinanzasSnapshot, row: MovimientoFinanciero): FinanzasSnapshot {
  return { ...snap, movimientos: upsert(snap.movimientos, row) }
}

export function reconciliarCuenta(snap: FinanzasSnapshot, row: CuentaFinanciera): FinanzasSnapshot {
  return { ...snap, cuentas: upsert(snap.cuentas, row) }
}
