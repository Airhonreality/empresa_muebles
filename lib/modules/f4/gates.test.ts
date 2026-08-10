// Test del predicado de gate F4 (disenio_P13_orden_compra.md).
// Ejecutar: npx tsx lib/modules/f4/gates.test.ts
import assert from 'node:assert/strict'
import { puedeCrearOrdenCompra } from './gates'
import type { Verificacion } from '../../data/contracts'

let pasadas = 0
function test(nombre: string, fn: () => void): void {
  fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

const proyectoDesarrollo = {
  estado: 'desarrollo' as const,
  verificadorId: 'p-comercial',
  fechaEntradaDesarrollo: '2026-08-01T00:00:00.000Z',
}

function verif(verificadorId: string, tipoGate = 'schema', veredicto = 'aprobado', creadoEn = '2026-08-02T00:00:00.000Z'): Verificacion {
  return { id: 'v', proyectoId: 'p', tipoGate: tipoGate as Verificacion['tipoGate'], veredicto: veredicto as Verificacion['veredicto'], verificadorId, creadoEn }
}

test('puedeCrearOrdenCompra: OC operativa (proyecto null) nunca exige guard E-18', () => {
  assert.equal(puedeCrearOrdenCompra(null, []), true)
})

test('puedeCrearOrdenCompra: OC de proyecto exige P18 (schema aprobado del verificador único)', () => {
  assert.equal(puedeCrearOrdenCompra(proyectoDesarrollo, [verif('p-comercial')]), true)
  assert.equal(puedeCrearOrdenCompra(proyectoDesarrollo, []), false)
  assert.equal(puedeCrearOrdenCompra(proyectoDesarrollo, [verif('p-otro')]), false)
})

test('puedeCrearOrdenCompra: rechaza si el proyecto no está en desarrollo', () => {
  assert.equal(puedeCrearOrdenCompra({ ...proyectoDesarrollo, estado: 'borrador' }, [verif('p-comercial')]), false)
})

console.log(`\n${pasadas} pruebas OK.`)
