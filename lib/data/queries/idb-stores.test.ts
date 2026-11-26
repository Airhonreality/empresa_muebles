// Guardas de regresión de IndexedDB (node:assert). Correr desde la raíz del repo con:
//   npx tsx lib/data/queries/idb-stores.test.ts
// Evita el bug de "One of the specified object stores was not found": dos stores en la misma base.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BASE_CACHE_IDB, BASE_OUTBOX_IDB } from './idb-stores'

// 1. Cada store vive en su propia base.
assert.notEqual(BASE_CACHE_IDB.nombre, BASE_OUTBOX_IDB.nombre, 'cache y outbox no pueden compartir base')
assert.notEqual(BASE_CACHE_IDB.almacen, BASE_OUTBOX_IDB.almacen, 'los nombres de store también deben diferir')

// 2. Ningún módulo abre una base con un nombre literal: todos usan las constantes de idb-stores.
const archivosConIdb = [
  'lib/data/queries/persister-idb.ts',
  'lib/data/queries/outbox-cotizador.ts',
]
for (const archivo of archivosConIdb) {
  const fuente = readFileSync(archivo, 'utf8')
  const llamadas = fuente.match(/createStore\([^)]*\)/g) ?? []
  assert.ok(llamadas.length > 0, `${archivo} debe crear al menos un store`)
  for (const llamada of llamadas) {
    assert.ok(llamada.includes('BASE_'), `${archivo}: createStore sin constante BASE_ -> ${llamada}`)
  }
  assert.ok(!/'veta-erp'/.test(fuente), `${archivo}: nombre de base literal 'veta-erp' (usar idb-stores.ts)`)
}

console.log('idb-stores.test.ts: OK')
