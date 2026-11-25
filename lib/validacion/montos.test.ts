// Reglas de montos en el borde de escritura (t-195): pesos enteros, máximo 12 dígitos.
// Ejecutar: npx tsx lib/validacion/montos.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validarEntrada } from './validar'
import { parametrosFinancierosSchema, itemCrearSchema } from './cotizador'

const valida = (campo: string, valor: string) =>
  validarEntrada(parametrosFinancierosSchema, { [campo]: valor })

test('montos: pesos enteros y el formato numeric de Postgres ("250000.00") son válidos', () => {
  assert.equal(valida('costosOperativos', '250000').costosOperativos, '250000')
  assert.equal(valida('costosOperativos', '250000.00').costosOperativos, '250000.00')
  assert.equal(valida('imprevistosInstalacion', '0').imprevistosInstalacion, '0')
})

test('montos: decimales reales se rechazan (no se redondean en silencio)', () => {
  assert.throws(() => valida('descuentoComercial', '1000.5'), /pesos enteros/)
})

test('montos: negativos y texto se rechazan', () => {
  assert.throws(() => valida('ajusteArbitrario', '-5'), /pesos enteros/)
  assert.throws(() => valida('costosOperativos', '12abc'), /pesos enteros/)
})

test('montos: más de 12 dígitos se rechaza (desborde de numeric(14,2))', () => {
  assert.throws(() => valida('costosOperativos', '1234567890123'), /máximo 12 dígitos/)
})

test('precioUnitario de ítem: también entero en pesos', () => {
  const base = { varianteId: 'v1', catalogoId: null, cantidad: '2' }
  assert.doesNotThrow(() => validarEntrada(itemCrearSchema, { ...base, precioUnitario: '110000' }))
  assert.throws(() => validarEntrada(itemCrearSchema, { ...base, precioUnitario: '110000.75' }), /pesos enteros/)
})
