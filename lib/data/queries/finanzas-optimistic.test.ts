import assert from 'node:assert/strict'
import type { CuentaFinanciera } from '../contracts'
import type { FinanzasSnapshot } from './finanzas-types'
import {
  actualizarMovimiento,
  agregarCuenta,
  agregarMovimiento,
  anularMovimiento,
  reconciliarCuenta,
  reconciliarMovimiento,
  revertirActualizarMovimiento,
  revertirAgregarCuenta,
  revertirAgregarMovimiento,
  revertirAnularMovimiento,
  type VarsCuentaNueva,
  type VarsMovimientoEdicion,
  type VarsMovimientoNuevo,
} from './finanzas-optimistic'

const cuenta: CuentaFinanciera = {
  id: 'cta1',
  nombre: 'Caja principal',
  tipo: 'caja',
  saldoInicial: '1000',
  saldoActual: '1000',
  createdAt: '2026-10-24T00:00:00.000Z',
}

const base: FinanzasSnapshot = {
  cuentas: [cuenta],
  movimientos: [],
  obligaciones: [],
  cuentasCobro: [],
  ordenesCompra: [],
  proveedores: [],
  proyectos: [],
  registrosGate: [],
}

const saldo = (snap: FinanzasSnapshot): number => Number(snap.cuentas[0].saldoActual)

const entrada: VarsMovimientoNuevo = {
  id: 'mov-entrada',
  values: { tipo: 'entrada', fecha: '2026-10-24', descripcion: 'Anticipo', monto: '200', cuentaId: 'cta1' },
}

const conEntrada = agregarMovimiento(base, entrada)
assert.equal(saldo(conEntrada), 1200)
assert.equal(conEntrada.movimientos.length, 1)
assert.equal(conEntrada.movimientos[0].tipo, 'credito')
assert.equal(conEntrada.movimientos[0].cuentaDestinoId, 'cta1')
assert.equal(saldo(base), 1000)

const sinEntrada = revertirAgregarMovimiento(conEntrada, entrada)
assert.equal(saldo(sinEntrada), 1000)
assert.equal(sinEntrada.movimientos.length, 0)

const salida: VarsMovimientoNuevo = {
  id: 'mov-salida',
  values: { tipo: 'salida', fecha: '2026-10-24', descripcion: 'Compra', monto: '300', cuentaId: 'cta1', proveedorId: 'prov1' },
}
const conSalida = agregarMovimiento(base, salida)
assert.equal(saldo(conSalida), 700)
assert.equal(conSalida.movimientos[0].tipo, 'debito')
assert.equal(conSalida.movimientos[0].cuentaOrigenId, 'cta1')

const edicion: VarsMovimientoEdicion = {
  id: 'mov-salida',
  values: { fecha: '2026-10-24', descripcion: 'Compra corregida', monto: '500', proveedorId: null, comprobanteUrl: null },
}
const conEdicion = actualizarMovimiento(conSalida, edicion)
assert.equal(saldo(conEdicion), 500)
assert.equal(conEdicion.movimientos[0].monto, '500')

const sinEdicion = revertirActualizarMovimiento(conEdicion, edicion, conSalida)
assert.equal(saldo(sinEdicion), 700)
assert.equal(sinEdicion.movimientos[0].monto, '300')

const anulada = anularMovimiento(conSalida, 'mov-salida')
assert.equal(saldo(anulada), 1000)
assert.equal(anulada.movimientos[0].estado, 'anulado')

const desanulada = revertirAnularMovimiento(anulada, 'mov-salida', conSalida)
assert.equal(saldo(desanulada), 700)
assert.equal(desanulada.movimientos[0].estado, 'asentado')

const cuentaNueva: VarsCuentaNueva = {
  id: 'cta2',
  values: { nombre: 'Banco', tipo: 'banco', saldoInicial: '500' },
}
const conCuenta = agregarCuenta(base, cuentaNueva)
assert.equal(conCuenta.cuentas.length, 2)
assert.equal(conCuenta.cuentas[1].saldoActual, '500')
assert.equal(revertirAgregarCuenta(conCuenta, 'cta2').cuentas.length, 1)

const reconciliada = reconciliarMovimiento(
  conSalida,
  { ...conSalida.movimientos[0], descripcion: 'Confirmada por el servidor' },
)
assert.equal(reconciliada.movimientos[0].descripcion, 'Confirmada por el servidor')

const cuentaReconciliada = reconciliarCuenta(
  base,
  { ...cuenta, saldoActual: '1234' },
)
assert.equal(cuentaReconciliada.cuentas[0].saldoActual, '1234')
assert.equal(base.cuentas[0].saldoActual, '1000')

console.log('finanzas-optimistic: OK')
