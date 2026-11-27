import assert from 'node:assert/strict'
import {
  crearCatalogo,
  ErrorCatalogoNoDisponible,
  esGratis,
  parsearModelosOpenRouter,
  precioPor1M,
} from './catalogo-modelos'
import { catalogoModelosHttp } from './ruta'
import type { SesionEmpleado } from '../auth/session'

// Fixture pequeño con la forma verificada de OpenRouter (sin llamar a la red).
const FIXTURE = {
  data: [
    {
      id: 'proveedor/con-tools',
      name: 'Con herramientas',
      pricing: { prompt: '0.0000005', completion: '0.0000015' },
      context_length: 128000,
      supported_parameters: ['tools', 'temperature'],
    },
    {
      id: 'proveedor/gratis:free',
      name: 'Gratis con sufijo',
      pricing: { prompt: '0.0000001', completion: '0.0000002' },
      context_length: 32000,
      supported_parameters: ['tools'],
    },
    {
      id: 'proveedor/gratis-cero',
      pricing: { prompt: '0', completion: '0' },
      context_length: 8000,
      supported_parameters: ['tools'],
    },
    {
      id: 'proveedor/sin-tools',
      name: 'Sin herramientas',
      pricing: { prompt: '0.000001', completion: '0.000002' },
      context_length: 64000,
      supported_parameters: ['temperature'],
    },
    { id: 'proveedor/precio-roto', pricing: { prompt: 'abc', completion: '0' }, supported_parameters: ['tools'] },
    { pricing: { prompt: '0', completion: '0' }, supported_parameters: ['tools'] },
  ],
}

const ADMIN: SesionEmpleado = { usuarioId: 'u-1', personaId: null, nombre: 'A', email: 'a@prueba.test', rol: 'admin' }
const COMERCIAL: SesionEmpleado = { ...ADMIN, usuarioId: 'u-2', rol: 'comercial' }

const casos: Array<[string, () => Promise<void>]> = [
  ['parseo: solo modelos con tools y con precio legible', async () => {
    const modelos = parsearModelosOpenRouter(FIXTURE)
    assert.deepEqual(modelos.map((m) => m.id), ['proveedor/con-tools', 'proveedor/gratis:free', 'proveedor/gratis-cero'])
  }],
  ['parseo: campos de la entrada', async () => {
    const m = parsearModelosOpenRouter(FIXTURE)[0]
    assert.deepEqual(m, {
      id: 'proveedor/con-tools',
      nombre: 'Con herramientas',
      gratis: false,
      precioPor1MEntradaUsd: 0.5,
      precioPor1MSalidaUsd: 1.5,
      contexto: 128000,
    })
  }],
  ['parseo: nombre ausente cae al id', async () => {
    assert.equal(parsearModelosOpenRouter(FIXTURE)[2].nombre, 'proveedor/gratis-cero')
  }],
  ['gratis: precios ambos "0" o sufijo :free', async () => {
    const modelos = parsearModelosOpenRouter(FIXTURE)
    assert.deepEqual(modelos.map((m) => m.gratis), [false, true, true])
    assert.equal(esGratis('x/y', '0', '0.0000001'), false)
    assert.equal(esGratis('x/y:free', '0.1', '0.1'), true)
  }],
  ['filtro por tools: sin "tools" en supported_parameters queda fuera', async () => {
    assert.equal(parsearModelosOpenRouter({ data: [FIXTURE.data[3]] }).length, 0)
  }],
  ['conversión: precio por token a USD por 1M con 4 decimales', async () => {
    assert.equal(precioPor1M('0.0000005'), 0.5)
    assert.equal(precioPor1M('0.00000012345'), 0.1235)
    assert.equal(precioPor1M(0), 0)
    assert.equal(precioPor1M('abc'), null)
    assert.equal(precioPor1M('-1'), null)
  }],
  ['respuesta sin data[] -> lista vacía', async () => {
    assert.deepEqual(parsearModelosOpenRouter({}), [])
    assert.deepEqual(parsearModelosOpenRouter(null), [])
  }],
  ['caché: segunda lectura dentro de 1 hora no llama a la red', async () => {
    let llamadas = 0
    let ahora = 0
    const c = crearCatalogo({ obtener: async () => { llamadas++; return FIXTURE }, ahora: () => new Date(ahora), ttlMs: 3_600_000 })
    await c.listar()
    ahora = 3_599_000
    await c.listar()
    assert.equal(llamadas, 1)
    ahora = 3_600_001
    await c.listar()
    assert.equal(llamadas, 2)
  }],
  ['caché: si la red falla, ErrorCatalogoNoDisponible y se conserva el último resultado', async () => {
    let fallar = false
    let ahora = 0
    const c = crearCatalogo({
      obtener: async () => { if (fallar) throw new Error('red caída'); return FIXTURE },
      ahora: () => new Date(ahora),
      ttlMs: 1000,
    })
    await c.listar()
    fallar = true
    ahora = 5000
    await assert.rejects(c.listar(), ErrorCatalogoNoDisponible)
    assert.equal(c.ultimoConocido()?.length, 3)
  }],
  ['caché: sin resultado previo, ultimoConocido es null', async () => {
    const c = crearCatalogo({ obtener: async () => { throw new Error('x') }, ahora: () => new Date(0) })
    await assert.rejects(c.listar(), ErrorCatalogoNoDisponible)
    assert.equal(c.ultimoConocido(), null)
  }],
  ['HTTP: sin admin -> 403 y no consulta el catálogo', async () => {
    let tocado = false
    const r = await catalogoModelosHttp(COMERCIAL, 'openrouter', { catalogo: () => { tocado = true; return crearCatalogo({ obtener: async () => FIXTURE, ahora: () => new Date(0) }) } })
    assert.equal(r.status, 403)
    assert.equal(tocado, false)
  }],
  ['HTTP: sin sesión -> 401', async () => {
    const r = await catalogoModelosHttp(null, 'openrouter', { catalogo: () => crearCatalogo({ obtener: async () => FIXTURE, ahora: () => new Date(0) }) })
    assert.equal(r.status, 401)
  }],
  ['HTTP: proveedor inválido (incluidos anthropic y google) -> 400', async () => {
    for (const p of ['anthropic', 'google', 'otro', '']) {
      const r = await catalogoModelosHttp(ADMIN, p, { catalogo: () => crearCatalogo({ obtener: async () => FIXTURE, ahora: () => new Date(0) }) })
      assert.equal(r.status, 400, p)
    }
  }],
  ['HTTP: admin con openrouter -> 200 con la lista filtrada', async () => {
    const r = await catalogoModelosHttp(ADMIN, 'openrouter', { catalogo: () => crearCatalogo({ obtener: async () => FIXTURE, ahora: () => new Date(0) }) })
    assert.equal(r.status, 200)
    assert.equal((r.body.modelos as unknown[]).length, 3)
  }],
  ['HTTP: caída del proveedor -> 503 con mensaje y último resultado en caché', async () => {
    let fallar = false
    const c = crearCatalogo({ obtener: async () => { if (fallar) throw new Error('caído'); return FIXTURE }, ahora: () => new Date(0), ttlMs: 0 })
    await c.listar()
    fallar = true
    const r = await catalogoModelosHttp(ADMIN, 'openrouter', { catalogo: () => c })
    assert.equal(r.status, 503)
    assert.match(String(r.body.error), /catálogo de modelos/)
    assert.equal((r.body.modelos as unknown[]).length, 3)
  }],
  ['HTTP: caída sin caché previa -> 503 con lista vacía, sin detalles internos', async () => {
    const c = crearCatalogo({ obtener: async () => { throw new Error('secreto-interno') }, ahora: () => new Date(0) })
    const r = await catalogoModelosHttp(ADMIN, 'openrouter', { catalogo: () => c })
    assert.equal(r.status, 503)
    assert.deepEqual(r.body.modelos, [])
    assert.ok(!JSON.stringify(r.body).includes('secreto-interno'))
  }],
]

async function principal(): Promise<void> {
  let fallos = 0
  for (const [nombre, fn] of casos) {
    try {
      await fn()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.error(`FALLA - ${nombre}\n${(err as Error).stack ?? err}`)
    }
  }
  if (fallos > 0) {
    console.error(`${fallos} caso(s) fallaron`)
    process.exitCode = 1
  }
}

void principal()
