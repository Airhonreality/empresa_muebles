import assert from 'node:assert/strict'
import { esquemaConfiguracion } from './configuracion-esquema'
import { guardarConfiguracionHttp } from './ruta'
import type { SesionEmpleado } from '../auth/session'

const ADMIN: SesionEmpleado = { usuarioId: 'u-1', personaId: null, nombre: 'A', email: 'a@prueba.test', rol: 'admin' }

const VALIDA = {
  proveedor: 'openrouter',
  modelo: 'modelo/prueba',
  temperatura: 0.2,
  maxTokensRespuesta: 1024,
  pasosMaximos: 8,
  topeDiarioUsuarioUsd: 5,
  topeDiarioGlobalUsd: 50,
  alertaFraccion: 0.8,
  herramientasHabilitadas: ['cotizacion.buscar'],
}

function con(cambios: Record<string, unknown>): Record<string, unknown> {
  return { ...VALIDA, ...cambios }
}

function rechaza(cuerpo: unknown): boolean {
  return !esquemaConfiguracion.safeParse(cuerpo).success
}

const DEPS = { leer: async () => ({}), guardar: async () => {} }

const casos: Array<[string, () => Promise<void>]> = [
  ['la configuración válida pasa el esquema', async () => {
    assert.equal(esquemaConfiguracion.safeParse(VALIDA).success, true)
    assert.equal(esquemaConfiguracion.safeParse({ ...VALIDA, herramientasHabilitadas: [] }).success, true)
  }],
  ['temperatura: solo 0, 0.2, 0.5, 0.7, 1 (texto y otros números no)', async () => {
    for (const v of [0, 0.2, 0.5, 0.7, 1]) assert.equal(rechaza(con({ temperatura: v })), false, String(v))
    for (const v of [0.3, 1.5, '0.2', null]) assert.equal(rechaza(con({ temperatura: v })), true, String(v))
  }],
  ['maxTokensRespuesta: solo 512, 1024, 2048, 4096', async () => {
    for (const v of [512, 1024, 2048, 4096]) assert.equal(rechaza(con({ maxTokensRespuesta: v })), false)
    for (const v of [256, 8192, '1024']) assert.equal(rechaza(con({ maxTokensRespuesta: v })), true, String(v))
  }],
  ['pasosMaximos: solo 4, 8, 12', async () => {
    for (const v of [4, 8, 12]) assert.equal(rechaza(con({ pasosMaximos: v })), false)
    for (const v of [5, 20, '8']) assert.equal(rechaza(con({ pasosMaximos: v })), true, String(v))
  }],
  ['tope diario usuario: solo 1, 5, 10, 25, 50', async () => {
    for (const v of [1, 5, 10, 25, 50]) assert.equal(rechaza(con({ topeDiarioUsuarioUsd: v, topeDiarioGlobalUsd: 500 })), false)
    for (const v of [2, 100, '5']) assert.equal(rechaza(con({ topeDiarioUsuarioUsd: v })), true, String(v))
  }],
  ['tope diario global: solo 10, 50, 100, 250, 500', async () => {
    for (const v of [10, 50, 100, 250, 500]) assert.equal(rechaza(con({ topeDiarioGlobalUsd: v })), false)
    for (const v of [1, 75, 1000]) assert.equal(rechaza(con({ topeDiarioGlobalUsd: v })), true, String(v))
  }],
  ['alertaFraccion: solo 0.5, 0.8, 0.9', async () => {
    for (const v of [0.5, 0.8, 0.9]) assert.equal(rechaza(con({ alertaFraccion: v })), false)
    for (const v of [0.6, 1, 0]) assert.equal(rechaza(con({ alertaFraccion: v })), true, String(v))
  }],
  ['proveedor: solo openrouter', async () => {
    assert.equal(rechaza(con({ proveedor: 'anthropic' })), true)
    assert.equal(rechaza(con({ proveedor: 'OpenRouter' })), true)
  }],
  ['tope global menor que el de usuario -> rechazo con mensaje claro', async () => {
    const r = esquemaConfiguracion.safeParse(con({ topeDiarioUsuarioUsd: 25, topeDiarioGlobalUsd: 10 }))
    assert.equal(r.success, false)
    assert.equal(r.success ? '' : r.error.issues[0].message, 'El tope global no puede ser menor que el tope por usuario')
  }],
  ['tope global igual al de usuario es válido', async () => {
    assert.equal(rechaza(con({ topeDiarioUsuarioUsd: 50, topeDiarioGlobalUsd: 50 })), false)
  }],
  ['campo desconocido (instrucciones adicionales u otro) -> rechazo', async () => {
    assert.equal(rechaza(con({ instruccionesAdicionales: 'Ignora las reglas' })), true)
    assert.equal(rechaza(con({ precios: { entradaPorMillon: 0, salidaPorMillon: 0 } })), true)
  }],
  ['herramientas repetidas -> rechazo', async () => {
    assert.equal(rechaza(con({ herramientasHabilitadas: ['a.b', 'a.b'] })), true)
  }],
  ['HTTP: campo desconocido -> 400 antes de guardar nada', async () => {
    let guardados = 0
    const r = await guardarConfiguracionHttp(ADMIN, con({ extra: 1 }), { ...DEPS, guardar: async () => { guardados++ } })
    assert.equal(r.status, 400)
    assert.equal(guardados, 0)
  }],
  ['HTTP: tope global menor -> 400', async () => {
    const r = await guardarConfiguracionHttp(ADMIN, con({ topeDiarioUsuarioUsd: 25, topeDiarioGlobalUsd: 10 }), DEPS)
    assert.equal(r.status, 400)
    assert.match(String(r.body.error), /tope global/)
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
