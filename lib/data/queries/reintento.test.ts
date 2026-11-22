// Pruebas de la política de reintento (node:assert, patrón del proyecto). Correr con:
//   npx tsx lib/data/queries/reintento.test.ts
import assert from 'node:assert/strict'
import { esErrorDeRed, reintentarSoloRed, esperaReintento, MAX_REINTENTOS_RED } from './reintento'

// Clasificación red vs rechazo del negocio
assert.equal(esErrorDeRed(new TypeError('Failed to fetch')), true, 'fetch caído es red')
assert.equal(esErrorDeRed(new Error('Load failed')), true, 'Safari: Load failed es red')
assert.equal(esErrorDeRed(new Error('net::ERR_INTERNET_DISCONNECTED')), true, 'Chrome sin internet es red')
assert.equal(esErrorDeRed(new Error('Entrada inválida: precio — debe ser un número no negativo')), false, 'validación no es red')
assert.equal(esErrorDeRed(new Error('La escritura no aplicó')), false, 'rechazo de negocio no es red')
assert.equal(esErrorDeRed('texto suelto'), false, 'no-Error no es red')

// Reintenta solo red, y hasta el máximo
assert.equal(reintentarSoloRed(0, new TypeError('Failed to fetch')), true)
assert.equal(reintentarSoloRed(MAX_REINTENTOS_RED - 1, new TypeError('Failed to fetch')), true)
assert.equal(reintentarSoloRed(MAX_REINTENTOS_RED, new TypeError('Failed to fetch')), false, 'tope alcanzado')
assert.equal(reintentarSoloRed(0, new Error('Entrada inválida: x')), false, 'rechazo definitivo no se reintenta')

// Backoff creciente, topado en 30 s
assert.equal(esperaReintento(0), 1000)
assert.equal(esperaReintento(1), 2000)
assert.equal(esperaReintento(2), 4000)
assert.equal(esperaReintento(20), 30_000, 'topado en 30 s')

console.log('reintento.test.ts: OK')
