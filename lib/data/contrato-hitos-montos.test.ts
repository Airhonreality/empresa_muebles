// t-195: invariante en pesos de los hitos del contrato (suma = valor total con montos fijos).
// Ejecutar: npx tsx lib/data/contrato-hitos-montos.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requisitosPendientes, type EntradaValidacionContrato } from './contrato-validacion'

const base: EntradaValidacionContrato = {
  tieneCliente: true, nombreCliente: 'Cliente', valorTotal: '1000000', cantidadHitos: 2,
  todosPorcentaje: false, sumaHitos: 0, plazoSemanas: '6', fechaEntregaMaxima: '2026-12-01',
  anexoPropuestaIdentificacion: 'ok',
}

test('hitos mixtos: suma en pesos que no cuadra se reporta con "faltan"', () => {
  const r = requisitosPendientes({ ...base, diferenciaMontosHitosCOP: 150000 })
  assert.ok(r.some((x) => x.campo === 'hitos' && /faltan \$150\.000 COP/.test(x.mensaje)))
})

test('hitos mixtos: sobrante se reporta con "sobran"', () => {
  const r = requisitosPendientes({ ...base, diferenciaMontosHitosCOP: -20000 })
  assert.ok(r.some((x) => x.campo === 'hitos' && /sobran \$20\.000 COP/.test(x.mensaje)))
})

test('hitos mixtos que cuadran: sin requisito en pesos', () => {
  const r = requisitosPendientes({ ...base, diferenciaMontosHitosCOP: 0 })
  assert.equal(r.filter((x) => x.campo === 'hitos').length, 0)
})

test('sin diferencia informada: la regla en pesos no se evalúa (compatibilidad)', () => {
  const r = requisitosPendientes({ ...base })
  assert.equal(r.filter((x) => x.campo === 'hitos').length, 0)
})
