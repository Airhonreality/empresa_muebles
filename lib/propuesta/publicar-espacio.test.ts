// Prueba de extremo a extremo de la bandera `publica` (t-200).
// Cadena: fila cruda de contenedores_descriptivos → proyección del espacio → publicación.
// Correr con: npx tsx lib/propuesta/publicar-espacio.test.ts
import assert from 'node:assert/strict'
import { aplicarContenedoresAEspacios } from '@/lib/data/contenedores'
import { publicarEspacio } from './publicar-espacio'

const SECRETO = 'PRECIO_INTERNO_NO_PUBLICAR'

// Fila tal como queda en la base: forma vieja (string) mezclada con forma nueva (objeto).
const contenedor = {
  id: 'c1',
  espacioVarianteId: 'e1',
  grupoItemId: null,
  descripcion: '  Cocina   integral  ',
  fotosEspacio: ['https://r2/vieja.webp'],
  fotosDisenio: [
    {
      url: 'https://r2/nueva.webp',
      alt: 'Frente de cocina',
      pie: 'Vista general',
      valores: { descripcion: 'Roble natural con tirador de acero' },
    },
  ],
  fotosReferencia: [
    { url: 'https://r2/ref.webp', valores: { descripcion: 'Referencia pública' } },
  ],
  createdAt: '2026-11-01',
  updatedAt: '2026-11-01',
}

const espacio = { id: 'e1', nombreEspacio: 'Cocina', descripcion: null }
const proyectado = aplicarContenedoresAEspacios([espacio], [contenedor as never])
const publico = publicarEspacio(proyectado[0] as never) as Record<string, unknown>

// 1. Las URLs de siempre siguen disponibles para las pantallas que solo muestran imagen.
assert.deepEqual(publico.fotosEspacio, ['https://r2/vieja.webp'])

// 2. La forma completa (imagenesX) NO llega al público.
assert.equal('imagenesEspacio' in publico, false)
assert.equal('imagenesDisenio' in publico, false)

// 3. La descripción se publica y el pie/alt vienen con la imagen.
const disenio = (publico.imagenesPublicas as { disenio: unknown[] }).disenio
assert.deepEqual(disenio, [{
  url: 'https://r2/nueva.webp',
  alt: 'Frente de cocina',
  pie: 'Vista general',
  textos: [{ etiqueta: 'Descripción', valor: 'Roble natural con tirador de acero' }],
}])

// 4. La forma vieja (solo URL) se publica como imagen, sin texto inventado.
const espacioSec = (publico.imagenesPublicas as { espacio: unknown[] }).espacio
assert.deepEqual(espacioSec, [{ url: 'https://r2/vieja.webp', alt: '', textos: [] }])

// 5. Un valor interno nunca sale, aunque esté guardado en la base.
const conInterno = {
  ...contenedor,
  fotosDisenio: [{ url: 'https://r2/x.webp', valores: { descripcion: 'ok', costoInterno: SECRETO } }],
}
const pub2 = publicarEspacio(aplicarContenedoresAEspacios([espacio], [conInterno as never])[0] as never)
assert.equal(JSON.stringify(pub2).includes(SECRETO), false, 'el valor interno no debe serializarse')

// 6. Un campo que el slot no declara como público tampoco sale.
const conCampoNoPublico = {
  ...contenedor,
  fotosDisenio: [{ url: 'https://r2/y.webp', valores: { noDeclarado: 'secreto-2' } }],
}
const pub3 = publicarEspacio(aplicarContenedoresAEspacios([espacio], [conCampoNoPublico as never])[0] as never)
assert.equal(JSON.stringify(pub3).includes('secreto-2'), false)

console.log('casos OK')
