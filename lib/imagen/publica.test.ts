// Pruebas de la proyección pública (t-200). Correr con: npx tsx lib/imagen/publica.test.ts
import assert from 'node:assert/strict'
import { publicarImagenes } from './publica'
import { SLOT_ESPACIO_FOTOS } from './slots/cotizador'

const campos = SLOT_ESPACIO_FOTOS.campos

const guardadas = [
  {
    url: 'https://r2/1.webp',
    alt: 'Frente de cocina',
    pie: 'Vista general',
    valores: { descripcion: 'Roble natural, tirador en acero' },
  },
  { url: 'https://r2/2.webp' },
]

const pub = publicarImagenes(guardadas, campos)
assert.equal(pub.length, 2)
assert.deepEqual(pub[0], {
  url: 'https://r2/1.webp',
  alt: 'Frente de cocina',
  pie: 'Vista general',
  textos: [{ etiqueta: 'Descripción', valor: 'Roble natural, tirador en acero' }],
})
assert.deepEqual(pub[1], { url: 'https://r2/2.webp', alt: '', textos: [] })

// Un campo declarado como interno (publica: false) NUNCA sale, aunque tenga valor.
const camposInternos = { nota: { tipo: 'texto' as const, etiqueta: 'Nota interna', publica: false } }
const conInterno = publicarImagenes([{ url: 'u', valores: { nota: 'secreto de costos' } }], camposInternos)
assert.deepEqual(conInterno[0].textos, [])
assert.equal(JSON.stringify(conInterno).includes('secreto'), false)

// Un campo sin bandera `publica` tampoco sale (por defecto es interno).
const sinBandera = { nota: { tipo: 'texto' as const, etiqueta: 'Nota' } }
assert.deepEqual(publicarImagenes([{ url: 'u', valores: { nota: 'x' } }], sinBandera)[0].textos, [])

console.log('casos OK')
