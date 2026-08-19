// Test de round-trip de la búsqueda resiliente (t-141). Patrón node:assert manual del repo.
// Ejecutar: npx tsx lib/search/normalizar.test.ts
import assert from 'node:assert/strict'
import {
  normalizarTexto,
  tokensDe,
  coincide,
  scoreCoincidencia,
  distanciaLevenshtein,
} from './normalizar'

let pasadas = 0
async function test(nombre: string, fn: () => void | Promise<void>): Promise<void> {
  await fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

;(async () => {

await test('normalizarTexto: quita tildes, ñ/ü, mayúsculas y colapsa separadores', () => {
  assert.equal(normalizarTexto('Cocina Integral García-López'), 'cocina integral garcia lopez')
  assert.equal(normalizarTexto('Ñandú'), 'nandu')
  assert.equal(normalizarTexto('ÜNIVERS'), 'univers') // Ü -> u
  assert.equal(normalizarTexto('Mueble TV — Nogal 1.80m'), 'mueble tv nogal 1 80m')
  assert.equal(normalizarTexto('TAB-ROB-18'), 'tab rob 18')
})

await test('tokensDe: parte por separadores y descarta vacíos', () => {
  assert.deepEqual(tokensDe('Cocina Integral'), ['cocina', 'integral'])
  assert.deepEqual(tokensDe('  roble   18mm '), ['roble', '18mm'])
})

await test('distanciaLevenshtein: casos clásicos', () => {
  assert.equal(distanciaLevenshtein('garcia', 'garcia'), 0)
  assert.equal(distanciaLevenshtein('garcia', 'garsia'), 1)
  assert.equal(distanciaLevenshtein('kitten', 'sitting'), 3)
})

await test('coincide: query vacía matchea todo', () => {
  assert.equal(coincide('', ['cualquier cosa']), true)
  assert.equal(coincide('   ', ['cualquier cosa']), true)
})

await test('coincide: tokens AND, orden independiente', () => {
  const campos = ['Tablero de Roble 18mm']
  assert.equal(coincide('roble 18', campos), true)
  assert.equal(coincide('18 roble', campos), true)
  assert.equal(coincide('roble pino', campos), false, 'token faltante no matchea')
})

await test('coincide: tolerancia a tildes/mayúsculas/guiones (sin fuzzy)', () => {
  assert.equal(coincide('García', ['GARCIA & CIA'], { fuzzy: false }), true)
  assert.equal(coincide('cocina-lopez', ['Cocina López Integral'], { fuzzy: false }), true)
  assert.equal(coincide('ñandú', ['Ñandú'], { fuzzy: false }), true)
})

await test('coincide: fuzzy por typo (Opción A) — ≤1 para tokens ≥4', () => {
  assert.equal(coincide('mogal', ['Mueble de Nogal']), true, 'n->m (1 edición)')
  assert.equal(coincide('garcia', ['Garsia y asociados']), true, 'c->s (1 edición)')
})

await test('coincide: fuzzy por typo — ≤2 para tokens ≥6 (transposición)', () => {
  assert.equal(coincide('tbalero', ['Tablero de Roble 18mm']), true, 'ba->ab (2 ediciones)')
})

await test('coincide: tokens cortos no reciben fuzzy (evita ruido con "de"/"el")', () => {
  assert.equal(coincide('de', ['Mesas de comedor']), true, 'match por substring')
  assert.equal(coincide('de', ['Mesas del comedor']), true, 'match por substring')
  assert.equal(coincide('mesas', ['Mesas del comedor'], { fuzzy: true }), true)
  assert.equal(coincide('mesa', ['Mesas del comedor']), true, 'substring')
})

await test('coincide: minLongitudTokenFuzzy configura el umbral', () => {
  // "ds" (2 chars) vs "de": distancia 1, pero por default (< 4) no recibe fuzzy.
  assert.equal(coincide('ds', ['Mesa de roble']), false)
  assert.equal(coincide('ds', ['Mesa de roble'], { minLongitudTokenFuzzy: 2 }), true)
})

await test('coincide: fuzzy desactivado no perdona typos', () => {
  assert.equal(coincide('mogal', ['Mueble de Nogal'], { fuzzy: false }), false)
})

await test('scoreCoincidencia: exacto > prefijo > substring y campos anteriores pesan más', () => {
  assert.equal(scoreCoincidencia('', ['x']), 0)
  const exacto = scoreCoincidencia('roble', ['Tablero de Roble', 'Mesa'])
  const prefijo = scoreCoincidencia('robl', ['Tablero de Roble', 'Mesa'])
  const substring = scoreCoincidencia('ob', ['Tablero de Roble', 'Mesa'])
  assert.ok(exacto > prefijo, `exacto (${exacto}) debe superar al prefijo (${prefijo})`)
  assert.ok(prefijo > substring, `prefijo (${prefijo}) debe superar al substring (${substring})`)
  // Campo 1 (índice 0) pesa más que campo 2: "roble" en el primero supera a "roble" en el segundo.
  const primero = scoreCoincidencia('roble', ['Roble', 'Mesa'])
  const segundo = scoreCoincidencia('roble', ['Mesa', 'Roble'])
  assert.ok(primero > segundo, 'el campo anterior debe pesar más')
})

console.log(`\nPASS ${pasadas} tests`)

})().catch((err) => {
  console.error(err)
  process.exit(1)
})