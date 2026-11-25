// Pruebas del cálculo único de montos (t-195). Sin DB, sin React.
// Ejecutar: npx tsx lib/dinero/calculo.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  aNumero,
  calcularTotalLinea,
  calcularTotalesCotizacion,
  redondearPesos,
  repartirHitos,
} from './calculo'

test('redondearPesos: half-up simétrico y sin ruido flotante', () => {
  assert.equal(redondearPesos(2.5), 3)
  assert.equal(redondearPesos(2.4), 2)
  assert.equal(redondearPesos(-2.5), -3)
  assert.equal(redondearPesos(1.005 * 1000), 1005)
  assert.equal(redondearPesos(0.1 + 0.2), 0)
  assert.equal(redondearPesos(NaN), 0)
})

test('aNumero: texto de BD y vacíos', () => {
  assert.equal(aNumero('250000.00'), 250000)
  assert.equal(aNumero(''), 0)
  assert.equal(aNumero(null), 0)
  assert.equal(aNumero('abc'), 0)
})

test('calcularTotalLinea: cantidad fraccionaria se redondea a pesos', () => {
  assert.equal(calcularTotalLinea('4.50', '110000'), 495000)
  assert.equal(calcularTotalLinea('2.333', '110000'), 256630)
  assert.equal(calcularTotalLinea('3', '28000'), 84000)
})

test('calcularTotalesCotizacion: subtotal entero y IVA una sola vez sobre la base', () => {
  const t = calcularTotalesCotizacion({
    materiales: 1000000,
    manoObra: 250000,
    costosOperativos: 250000,
    imprevistos: 0,
    descuento: 50000,
    ajuste: 0,
    aplicaIva: true,
    porcentajeIva: 19,
  })
  assert.equal(t.subtotal, 1450000)
  assert.equal(t.iva, 275500)
  assert.equal(t.total, 1725500)
})

test('calcularTotalesCotizacion: sin IVA', () => {
  const t = calcularTotalesCotizacion({
    materiales: 100000, manoObra: 0, costosOperativos: 0, imprevistos: 0,
    descuento: 0, ajuste: 0, aplicaIva: false, porcentajeIva: 19,
  })
  assert.deepEqual(t, { subtotal: 100000, iva: 0, total: 100000 })
})

test('calcularTotalesCotizacion: 250mil de costos operativos suma 250mil (regresión ×100)', () => {
  const t = calcularTotalesCotizacion({
    materiales: 0, manoObra: 0, costosOperativos: 250000, imprevistos: 0,
    descuento: 0, ajuste: 0, aplicaIva: false, porcentajeIva: 0,
  })
  assert.equal(t.total, 250000)
})

test('repartirHitos: el error de redondeo se absorbe en el último porcentual', () => {
  // 1.000.001 x 33.33% = 333300.33 -> 333300 (x2); x 33.34% = 333400.33 -> 333400. Suma 1.000.000,
  // error de 1 peso -> el último hito queda en 333401 y la suma es exacta.
  const total = 1000001
  const montos = repartirHitos(total, [
    { tipo: 'percentage', valor: 33.33 },
    { tipo: 'percentage', valor: 33.33 },
    { tipo: 'percentage', valor: 33.34 },
  ])
  assert.deepEqual(montos, [333300, 333300, 333401])
  assert.equal(montos.reduce((s, m) => s + m, 0), total)
})

test('repartirHitos: 50/25/25 de 1.000.001 suma exactamente el total', () => {
  const total = 1000001
  const montos = repartirHitos(total, [
    { tipo: 'percentage', valor: 50 },
    { tipo: 'percentage', valor: 25 },
    { tipo: 'percentage', valor: 25 },
  ])
  assert.equal(montos.reduce((s, m) => s + m, 0), total)
})

test('repartirHitos: montos fijos no se alteran y un error grande no se fuerza', () => {
  // fijo 300000 + 100% = 1.300.000 frente a un total de 1.000.000: no es redondeo, no se toca.
  const montos = repartirHitos(1000000, [
    { tipo: 'fixed', valor: 300000 },
    { tipo: 'percentage', valor: 100 },
  ])
  assert.deepEqual(montos, [300000, 1000000])
})

test('repartirHitos: porcentajes que no suman 100 no se fuerzan', () => {
  const montos = repartirHitos(1000000, [{ tipo: 'percentage', valor: 40 }])
  assert.deepEqual(montos, [400000])
})
