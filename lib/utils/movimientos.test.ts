// Test de ordenamiento del libro financiero (t-181). Sin DB ni React.
// Ejecutar: npx tsx lib/utils/movimientos.test.ts
import assert from 'node:assert/strict'
import type { MovimientoFinanciero } from '@/lib/data/contracts'
import { ordenarMovimientos } from './movimientos'

const base = {
  descripcion: 'x', tipo: 'debito', estado: 'asentado', monto: '1',
  cuentaOrigenId: 'c1', cuentaDestinoId: null, obligacionId: null, ordenCompraId: null,
  proyectoId: null, contratoId: null, socioId: null, proveedorId: null,
  medioPago: null, comprobanteUrl: null, prioridadPago: null,
} satisfies Omit<MovimientoFinanciero, 'id' | 'fecha' | 'createdAt'>

const movimientos: MovimientoFinanciero[] = [
  { ...base, id: 'a', fecha: '2026-10-01', createdAt: '2026-10-17T10:00:00Z' },
  { ...base, id: 'b', fecha: '2026-10-10', createdAt: '2026-10-12T10:00:00Z' },
  { ...base, id: 'c', fecha: '2026-09-20', createdAt: '2026-10-15T10:00:00Z' },
]

let pasadas = 0
function test(nombre: string, fn: () => void): void {
  fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

test('movimiento-desc ordena por fecha del movimiento, no por createdAt', () => {
  assert.deepEqual(ordenarMovimientos(movimientos, 'movimiento-desc').map(m => m.id), ['b', 'a', 'c'])
})

test('movimiento-asc ordena del más antiguo al más reciente', () => {
  assert.deepEqual(ordenarMovimientos(movimientos, 'movimiento-asc').map(m => m.id), ['c', 'a', 'b'])
})

test('registro-desc ordena por fecha de registro', () => {
  assert.deepEqual(ordenarMovimientos(movimientos, 'registro-desc').map(m => m.id), ['a', 'c', 'b'])
})

test('registro-asc ordena por registro más antiguo', () => {
  assert.deepEqual(ordenarMovimientos(movimientos, 'registro-asc').map(m => m.id), ['b', 'c', 'a'])
})

console.log(`\n${pasadas} tests de ordenamiento de movimientos OK`)
