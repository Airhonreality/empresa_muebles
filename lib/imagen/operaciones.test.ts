// Pruebas del núcleo de imágenes (t-200, capa 0). Correr con:
//   npx tsx lib/imagen/operaciones.test.ts
import assert from 'node:assert/strict'
import {
  aUrls,
  actualizarBase,
  actualizarValores,
  desdeUrls,
  insertar,
  mover,
  moverRelativo,
  quitar,
  sinAlt,
} from './operaciones'
import type { ImagenItem } from './tipos'

// Generador determinista para que los tests no dependan de crypto ni del reloj.
function generadorIds() {
  let n = 0
  return () => `id-${++n}`
}

const slotMultiple = { multiple: true as const }
const campos = { ubicacion: { tipo: 'texto', etiqueta: 'Ubicación' }, nuevo: { tipo: 'booleano', etiqueta: 'Nuevo' } } as const

let casos = 0
function caso(nombre: string, fn: () => void) {
  fn()
  casos++
  console.log(`✓ ${nombre}`)
}

caso('desdeUrls y aUrls son inversas para URLs persistidas', () => {
  const urls = ['https://a/1.webp', 'https://a/2.webp']
  const col = desdeUrls(urls, generadorIds())
  assert.deepEqual(aUrls(col), urls)
  assert.equal(new Set(col.map((i) => i.clienteId)).size, 2)
})

caso('insertar agrega al final y descarta duplicadas por URL', () => {
  const col = desdeUrls(['https://a/1.webp'], generadorIds())
  const res = insertar(col, ['https://a/1.webp', 'https://a/2.webp', '  ', 'https://a/2.webp'], slotMultiple, generadorIds())
  assert.deepEqual(aUrls(res), ['https://a/1.webp', 'https://a/2.webp'])
})

caso('insertar respeta el tope max', () => {
  const col = desdeUrls(['https://a/1.webp'], generadorIds())
  const res = insertar(col, ['https://a/2.webp', 'https://a/3.webp', 'https://a/4.webp'], { multiple: true, max: 2 }, generadorIds())
  assert.deepEqual(aUrls(res), ['https://a/1.webp', 'https://a/2.webp'])
})

caso('insertar con multiple=false reemplaza por la primera URL', () => {
  const col = desdeUrls(['https://a/1.webp'], generadorIds())
  const res = insertar(col, ['https://a/9.webp', 'https://a/8.webp'], { multiple: false }, generadorIds())
  assert.deepEqual(aUrls(res), ['https://a/9.webp'])
})

caso('quitar elimina solo el id indicado y no muta la entrada', () => {
  const col = desdeUrls(['https://a/1.webp', 'https://a/2.webp'], generadorIds())
  const antes = JSON.stringify(col)
  const res = quitar(col, col[0].clienteId)
  assert.deepEqual(aUrls(res), ['https://a/2.webp'])
  assert.equal(JSON.stringify(col), antes)
})

caso('mover reubica por posición absoluta y valida límites', () => {
  const col = desdeUrls(['A', 'B', 'C'], generadorIds())
  const idA = col[0].clienteId
  assert.deepEqual(aUrls(mover(col, idA, 2)), ['B', 'C', 'A'])
  assert.deepEqual(aUrls(mover(col, idA, 5)), ['A', 'B', 'C'])
  assert.deepEqual(aUrls(mover(col, idA, -1)), ['A', 'B', 'C'])
  assert.deepEqual(aUrls(mover(col, 'no-existe', 0)), ['A', 'B', 'C'])
})

caso('moverRelativo en los bordes no cambia nada', () => {
  const col = desdeUrls(['A', 'B'], generadorIds())
  assert.deepEqual(aUrls(moverRelativo(col, col[0].clienteId, -1)), ['A', 'B'])
  assert.deepEqual(aUrls(moverRelativo(col, col[1].clienteId, 1)), ['A', 'B'])
  assert.deepEqual(aUrls(moverRelativo(col, col[1].clienteId, -1)), ['B', 'A'])
})

caso('actualizarValores ignora claves que el slot no declara', () => {
  const col: ImagenItem<typeof campos>[] = desdeUrls(['A'], generadorIds())
  const id = col[0].clienteId
  const res = actualizarValores(col, id, { ubicacion: 'Isla', inventada: 'x' } as never, campos)
  assert.deepEqual(res[0].valores, { ubicacion: 'Isla' })
})

caso('actualizarBase recorta pie al límite y deja alt intacto si no se pasa', () => {
  const col = desdeUrls(['A'], generadorIds())
  const id = col[0].clienteId
  const res = actualizarBase(col, id, { pie: 'x'.repeat(200) }, 160)
  assert.equal(res[0].base.pie?.length, 160)
  assert.equal(res[0].base.alt, undefined)
})

caso('sinAlt lista imágenes sin texto alternativo', () => {
  const col = desdeUrls(['A', 'B'], generadorIds())
  const conAlt = actualizarBase(col, col[0].clienteId, { alt: 'Frente de cocina' })
  assert.deepEqual(sinAlt(conAlt), [col[1].clienteId])
})

console.log(`\n${casos} casos OK`)
