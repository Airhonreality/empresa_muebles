import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parteEnteraDb } from './dinero'

test('parteEnteraDb: valores numeric(14,2) de Postgres no se multiplican por 100', () => {
  assert.equal(parteEnteraDb('250000.00'), '250000')
  assert.equal(parteEnteraDb('300000.00'), '300000')
  assert.equal(parteEnteraDb('25000.00'), '25000')
  assert.equal(parteEnteraDb('1234.56'), '1234')
})

test('parteEnteraDb: enteros sin decimales pasan intactos', () => {
  assert.equal(parteEnteraDb('250000'), '250000')
  assert.equal(parteEnteraDb('0'), '0')
})

test('parteEnteraDb: vacío, nulo o sin dígitos -> ""', () => {
  assert.equal(parteEnteraDb(null), '')
  assert.equal(parteEnteraDb(undefined), '')
  assert.equal(parteEnteraDb(''), '')
  assert.equal(parteEnteraDb('abc'), '')
})
