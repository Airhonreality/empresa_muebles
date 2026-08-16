// Test del predicado de gate F4 (disenio_P13_orden_compra.md).
// Ejecutar: npx tsx lib/modules/f4/gates.test.ts
import assert from 'node:assert/strict'
import { derivarListaCompraSugerida, puedeCrearOrdenCompra } from './gates'
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

test('derivarListaCompraSugerida: sin schema aprobado_compras, no sugiere nada', () => {
  assert.deepEqual(derivarListaCompraSugerida(null, [{ id: 'b1', productoId: 'p01', cantidad: '10', unidad: 'm2' }]), [])
  assert.deepEqual(derivarListaCompraSugerida({ estado: 'para_revision' }, [{ id: 'b1', productoId: 'p01', cantidad: '10', unidad: 'm2' }]), [])
})

test('derivarListaCompraSugerida: con schema aprobado, sugiere ítems con productoId; excluye null (vía 2) y cantidades inválidas', () => {
  const sugeridos = derivarListaCompraSugerida({ estado: 'aprobado_compras' }, [
    { id: 'b1', productoId: 'p01', cantidad: '10', unidad: 'm2' },
    { id: 'b2', productoId: null, cantidad: '5', unidad: 'ud' },
    { id: 'b3', productoId: 'p02', cantidad: 'no-numerico', unidad: 'ud' },
    { id: 'b4', productoId: 'p03', cantidad: '0', unidad: 'ud' },
  ])
  assert.equal(sugeridos.length, 1)
  assert.deepEqual(sugeridos[0], { productoCatalogoId: 'p01', cantidad: 10, unidad: 'm2', bomMaterialId: 'b1' })
})

console.log(`\n${pasadas} pruebas OK.`)
