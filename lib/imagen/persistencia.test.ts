// Pruebas de la forma persistida (t-200). Correr con: npx tsx lib/imagen/persistencia.test.ts
import assert from 'node:assert/strict'
import { aGuardadas, aItems, leerImagenes, sanitizarGuardadas, urlsDe, LIMITES } from './persistencia'

let casos = 0
const caso = (nombre: string, fn: () => void) => { fn(); casos++; console.log(`✓ ${nombre}`) }

caso('lee la forma vieja (lista de URLs) como objetos sin alt ni pie', () => {
  assert.deepEqual(leerImagenes(['https://a/1.webp', '  ', 'https://a/2.webp']), [{ url: 'https://a/1.webp' }, { url: 'https://a/2.webp' }])
})

caso('lee la forma nueva con alt, pie y valores', () => {
  const raw = [{ url: 'https://a/1.webp', alt: ' Frente ', pie: 'Vista', valores: { descripcion: 'Texto', nuevo: true, vacio: '' } }]
  assert.deepEqual(leerImagenes(raw), [{ url: 'https://a/1.webp', alt: 'Frente', pie: 'Vista', valores: { descripcion: 'Texto', nuevo: true } }])
})

caso('descarta entradas inválidas sin romper el resto', () => {
  assert.deepEqual(urlsDe([null, 42, {}, { url: '' }, 'https://a/ok.webp']), ['https://a/ok.webp'])
  assert.deepEqual(leerImagenes('no es lista'), [])
})

caso('aGuardadas omite atributos vacíos y guarda solo lo que tiene valor', () => {
  const items = [{ url: 'u1', base: { alt: 'Hola', pie: '   ' }, valores: { descripcion: 'x', vacio: '' } }, { url: 'u2', base: {}, valores: {} }]
  assert.deepEqual(aGuardadas(items), [{ url: 'u1', alt: 'Hola', valores: { descripcion: 'x' } }, { url: 'u2' }])
})

caso('ida y vuelta: guardar y releer conserva los atributos', () => {
  const guardadas = [{ url: 'u1', alt: 'A', pie: 'P', valores: { descripcion: 'D' } }]
  const items = aItems(guardadas, () => 'id')
  assert.deepEqual(aGuardadas(items), guardadas)
})

caso('sanitizarGuardadas descarta URLs que el sanitizador rechaza y recorta textos', () => {
  const raw = [
    { url: 'https://ok/1', alt: 'x'.repeat(500), pie: 'y'.repeat(500), valores: { descripcion: 'z'.repeat(5000) } },
    { url: 'https://malo/2', alt: 'no' },
    'https://ok/3',
  ]
  const res = sanitizarGuardadas(raw, (u) => (u.startsWith('https://ok') ? u : null))
  assert.equal(res.length, 2)
  assert.equal(res[0].alt?.length, LIMITES.alt)
  assert.equal(res[0].pie?.length, LIMITES.pie)
  assert.equal((res[0].valores?.descripcion as string).length, LIMITES.valorTexto)
  assert.equal(res[1].url, 'https://ok/3')
})

console.log(`\n${casos} casos OK`)
