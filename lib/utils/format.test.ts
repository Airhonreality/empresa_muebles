// t-196: regresión del formateador compartido con strings numeric de Postgres (×100).
// Ejecutar: npx tsx lib/utils/format.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatCurrency } from './format'

const norm = (s: string) => s.replace(/ /g, ' ')

test('formatCurrency: "250000.00" se muestra como 250.000, no como 25.000.000', () => {
  assert.equal(norm(formatCurrency('250000.00')), norm('$ 250.000'))
  assert.equal(norm(formatCurrency('300000.00')), norm('$ 300.000'))
})

test('formatCurrency: número y entero en texto no cambian', () => {
  assert.equal(norm(formatCurrency(250000)), norm('$ 250.000'))
  assert.equal(norm(formatCurrency('250000')), norm('$ 250.000'))
})
