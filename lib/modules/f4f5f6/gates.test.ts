// Test de los predicados de gates F5/F6 (disenio_P16/P17/P18/P20/P21).
// Ejecutar: npx tsx lib/modules/f4f5f6/gates.test.ts
import assert from 'node:assert/strict'
import {
  transicionModuloValida, puedeEmitirVeredictoCalidad, P24, rangoInstalacionValido,
  dentroGarantiaContractual, calcularCajaDisponible,
} from './gates'
import type { CitacionCalidad, Verificacion } from '../../data/contracts'

let pasadas = 0
function test(nombre: string, fn: () => void): void {
  fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

test('transicionModuloValida: por_armar -> en_armado -> armado -> en_calidad, un paso a la vez', () => {
  assert.equal(transicionModuloValida('por_armar', 'en_armado'), true)
  assert.equal(transicionModuloValida('en_armado', 'armado'), true)
  assert.equal(transicionModuloValida('armado', 'en_calidad'), true)
})

test('transicionModuloValida: rechaza saltos de estado', () => {
  assert.equal(transicionModuloValida('por_armar', 'armado'), false)
  assert.equal(transicionModuloValida('por_armar', 'en_calidad'), false)
})

test('transicionModuloValida: rechaza retrocesos y estados desconocidos', () => {
  assert.equal(transicionModuloValida('armado', 'en_armado'), false)
  assert.equal(transicionModuloValida('en_calidad', 'aprobado'), false)
})

test('puedeEmitirVeredictoCalidad: exige verificador único + citación citada (R1/R2)', () => {
  const citaciones: Pick<CitacionCalidad, 'estado'>[] = [{ estado: 'citada' }]
  assert.equal(puedeEmitirVeredictoCalidad({ verificadorId: 'p02' }, citaciones, 'p02'), true)
  assert.equal(puedeEmitirVeredictoCalidad({ verificadorId: 'p02' }, citaciones, 'p99'), false)
  assert.equal(puedeEmitirVeredictoCalidad({ verificadorId: null }, citaciones, 'p02'), false)
  assert.equal(puedeEmitirVeredictoCalidad({ verificadorId: 'p02' }, [], 'p02'), false)
})

function verifCalidad(overrides: Partial<Pick<Verificacion, 'tipoGate' | 'veredicto' | 'verificadorId' | 'creadoEn'>> = {}) {
  return {
    tipoGate: 'calidad' as const,
    veredicto: 'aprobado' as const,
    verificadorId: 'p02',
    creadoEn: '2026-08-10T00:00:00.000Z',
    ...overrides,
  }
}

test('P24: pasa con proyecto armado + citación citada + veredicto calidad aprobado posterior', () => {
  const citaciones = [{ estado: 'citada', fecha: '2026-08-09T00:00:00.000Z' }]
  assert.equal(P24({ estado: 'armado', verificadorId: 'p02' }, citaciones, [verifCalidad()]), true)
})

test('P24: rechaza si el proyecto no está armado', () => {
  const citaciones = [{ estado: 'citada', fecha: '2026-08-09T00:00:00.000Z' }]
  assert.equal(P24({ estado: 'verificado', verificadorId: 'p02' }, citaciones, [verifCalidad()]), false)
})

test('P24: rechaza sin citación citada', () => {
  assert.equal(P24({ estado: 'armado', verificadorId: 'p02' }, [], [verifCalidad()]), false)
})

test('P24: rechaza si la verificación es anterior a la citación', () => {
  const citaciones = [{ estado: 'citada', fecha: '2026-08-09T00:00:00.000Z' }]
  assert.equal(P24({ estado: 'armado', verificadorId: 'p02' }, citaciones, [verifCalidad({ creadoEn: '2026-08-01T00:00:00.000Z' })]), false)
})

test('rangoInstalacionValido: acepta rangos de hasta 5 días', () => {
  assert.equal(rangoInstalacionValido('2026-08-10', '2026-08-15'), true)
  assert.equal(rangoInstalacionValido('2026-08-10', '2026-08-10'), true)
})

test('rangoInstalacionValido: rechaza rangos mayores a 5 días o invertidos', () => {
  assert.equal(rangoInstalacionValido('2026-08-10', '2026-08-16'), false)
  assert.equal(rangoInstalacionValido('2026-08-15', '2026-08-10'), false)
})

test('dentroGarantiaContractual: true dentro de la ventana, false fuera', () => {
  assert.equal(dentroGarantiaContractual('2026-01-01', '2027-06-01', 2), true)
  assert.equal(dentroGarantiaContractual('2020-01-01', '2026-06-01', 2), false)
})

test('calcularCajaDisponible: resta obligaciones pendientes de la suma de cuentas', () => {
  const cuentas = [{ saldoActual: '1000000' }, { saldoActual: '500000' }]
  const obligaciones = [{ montoTotal: '300000', montoPagado: '100000' }, { montoTotal: '200000', montoPagado: '200000' }]
  // 1.500.000 - (200.000 + 0) = 1.300.000
  assert.equal(calcularCajaDisponible(cuentas, obligaciones), 1300000)
})

console.log(`\n${pasadas} pruebas OK.`)
