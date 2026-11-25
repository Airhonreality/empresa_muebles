import assert from 'node:assert/strict'
import { getDataStore } from './store'
import { obtenerPortafolioPorSlugAction, obtenerBitacoraPorSlugAction, listarBitacoraAction } from './actions/portafolio'

// Rama mock (DATA_IMPL=mock): el store en memoria permite sembrar borradores y publicados.
// La rama drizzle usa `and(..., publicado = true)` en la consulta; aquí solo se verifica por lectura.
process.env.DATA_IMPL = 'mock'

async function run(): Promise<void> {
  const store = getDataStore()

  const casos: [string, () => Promise<void>][] = [
    ['portafolio: un borrador no se sirve por slug', async () => {
      const borrador = await store.portafolio.crear({ titulo: 'Borrador de prueba', categoriaEspacio: 'cocina', publicado: false })
      assert.equal(borrador.publicado, false)
      assert.equal(await obtenerPortafolioPorSlugAction(borrador.slug), null)
    }],
    ['portafolio: una entrada publicada sí se sirve por slug', async () => {
      const publicado = await store.portafolio.crear({ titulo: 'Publicado de prueba', categoriaEspacio: 'closet', publicado: true })
      const res = await obtenerPortafolioPorSlugAction(publicado.slug)
      assert.ok(res, 'la entrada publicada debería devolverse')
      assert.equal(res.id, publicado.id)
    }],
    ['bitácora: un borrador no se sirve por slug', async () => {
      const borrador = await store.bitacoraArticulos.crear({ slug: 'borrador-bitacora-prueba', titulo: 'Borrador', contenidoLargo: 'x', publicado: false })
      assert.equal(borrador.publicado, false)
      assert.equal(await obtenerBitacoraPorSlugAction(borrador.slug), null)
    }],
    ['bitácora: un artículo publicado sí se sirve por slug', async () => {
      const publicado = await store.bitacoraArticulos.crear({ slug: 'publicado-bitacora-prueba', titulo: 'Publicado', contenidoLargo: 'x', publicado: true })
      const res = await obtenerBitacoraPorSlugAction(publicado.slug)
      assert.ok(res, 'el artículo publicado debería devolverse')
      assert.equal(res.id, publicado.id)
    }],
    ['bitácora: listarBitacoraAction no devuelve filas no publicadas', async () => {
      const lista = await listarBitacoraAction()
      assert.ok(lista.length > 0, 'debería haber al menos un artículo publicado del seed o de la prueba')
      assert.ok(lista.every((a) => a.publicado === true), 'apareció un artículo no publicado')
      assert.ok(!lista.some((a) => a.slug === 'borrador-bitacora-prueba'), 'el borrador de prueba se listó')
      assert.ok(lista.some((a) => a.slug === 'publicado-bitacora-prueba'), 'el publicado de prueba debería listarse')
    }],
  ]

  let fallos = 0
  for (const [nombre, prueba] of casos) {
    try {
      await prueba()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.error(`FAIL - ${nombre}: ${(err as Error).message}`)
    }
  }
  if (fallos > 0) process.exitCode = 1
  else console.log(`portafolio-publicado.test.ts: ${casos.length} casos ok`)
}

void run()
