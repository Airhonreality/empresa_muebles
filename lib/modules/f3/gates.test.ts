// Test de los predicados de gates F3 (disenio_f3_cronograma_gates.md R1/R2/R9).
// Ejecutar: npx tsx lib/modules/f3/gates.test.ts
import assert from 'node:assert/strict'
import { P18, P33, derivarDesenlace, derivarReduccionComision } from './gates'
import type { Verificacion, DesfaseCronograma } from '../../data/contracts'

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

test('P18: pasa con verificación aprobada del verificador único posterior al ingreso a desarrollo', () => {
  assert.equal(P18(proyectoDesarrollo, [verif('p-comercial')]), true)
})

test('P18: rechaza si el proyecto no está en desarrollo', () => {
  assert.equal(P18({ ...proyectoDesarrollo, estado: 'borrador' }, [verif('p-comercial')]), false)
})

test('P18: rechaza si la verificación no es del verificador único', () => {
  assert.equal(P18(proyectoDesarrollo, [verif('p-otro')]), false)
})

test('P18: rechaza si la verificación no es de tipo schema o no está aprobada', () => {
  assert.equal(P18(proyectoDesarrollo, [verif('p-comercial', 'calidad')]), false)
  assert.equal(P18(proyectoDesarrollo, [verif('p-comercial', 'schema', 'rechazado')]), false)
})

test('P18: rechaza si la verificación ocurrió antes del ingreso a desarrollo', () => {
  assert.equal(P18(proyectoDesarrollo, [verif('p-comercial', 'schema', 'aprobado', '2026-07-20T00:00:00.000Z')]), false)
})

test('P18: rechaza sin verificador designado', () => {
  assert.equal(P18({ ...proyectoDesarrollo, verificadorId: null }, [verif('p-comercial')]), false)
})

function desfaseCausa(causa: DesfaseCronograma['causa']): Pick<DesfaseCronograma, 'causa' | 'motivo' | 'composicionCausal'> {
  return { causa, motivo: 'Retraso de proveedor', composicionCausal: [{ origen: 'Proveedor', aporteDias: 3 }] }
}

test('P33: pasa con causa válida + motivo + composición causal', () => {
  assert.equal(P33(desfaseCausa('externa')), true)
  assert.equal(P33(desfaseCausa('interna')), true)
  assert.equal(P33(desfaseCausa('cambio_contrato')), true)
})

test('P33: rechaza sin motivo', () => {
  assert.equal(P33({ ...desfaseCausa('externa'), motivo: '' }), false)
})

test('P33: rechaza sin composición causal', () => {
  assert.equal(P33({ ...desfaseCausa('externa'), composicionCausal: [] }), false)
})

test('P33: rechaza causa inválida', () => {
  assert.equal(P33({ ...desfaseCausa('externaxx' as DesfaseCronograma['causa']) }), false)
})

const umbrales = { umbralTodoBienPct: 0.95, umbralExtremoPct: 0.70 }

test('R9: ratios [0.80, 0.98, 0.98] → novedad', () => {
  assert.equal(derivarDesenlace({ ratioInsumos: 0.80, ratioPagos: 0.98, ratioProduccion: 0.98 }, umbrales), 'novedad')
})

test('R9: ratios [0.60, 0.98, 0.98] → extremo', () => {
  assert.equal(derivarDesenlace({ ratioInsumos: 0.60, ratioPagos: 0.98, ratioProduccion: 0.98 }, umbrales), 'extremo')
})

test('R9: ratios [0.97, 0.98, 0.98] → todo_bien', () => {
  assert.equal(derivarDesenlace({ ratioInsumos: 0.97, ratioPagos: 0.98, ratioProduccion: 0.98 }, umbrales), 'todo_bien')
})

test('R9: el mínimo domina (producción baja aunque insumos/pagos altos)', () => {
  assert.equal(derivarDesenlace({ ratioInsumos: 1, ratioPagos: 1, ratioProduccion: 0.50 }, umbrales), 'extremo')
})

const reduccion = { reduccionNovedadPct: 0.50, reduccionExtremoPct: 1.00 }

test('E-59: todo_bien sin reducción; novedad 50%; extremo 100%', () => {
  assert.equal(derivarReduccionComision('todo_bien', reduccion), 0)
  assert.equal(derivarReduccionComision('novedad', reduccion), 0.50)
  assert.equal(derivarReduccionComision('extremo', reduccion), 1.00)
})

console.log(`\n${pasadas} pruebas OK.`)