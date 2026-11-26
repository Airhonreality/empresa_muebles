import assert from 'node:assert/strict'
import type { SesionEmpleado } from '../auth/session'
import { ErrorTopesNoConfigurados, MENSAJE_TOPES_NO_CONFIGURADOS } from './bucle'
import { ErrorSinClavesDisponibles } from './claves'
import {
  agregarClaveHttp,
  guardarConfiguracionHttp,
  leerConfiguracionHttp,
  MENSAJE_SIN_BASE,
  turnoHttp,
  type DepsClaves,
} from './ruta'
import { ErrorConversacionNoEncontrada, type ResultadoAtencion } from './servicio'

const ADMIN: SesionEmpleado = { usuarioId: 'u-1', personaId: null, nombre: 'A', email: 'a@prueba.test', rol: 'admin' }
const COMERCIAL: SesionEmpleado = { ...ADMIN, usuarioId: 'u-2', rol: 'comercial' }
const UUID = '11111111-1111-4111-8111-111111111111'
const SECRETO = 'sk-or-v1-clave-de-prueba-1234567890'

function atenderFalso(resultado: ResultadoAtencion | Error) {
  const llamadas: unknown[] = []
  const fn = async (p: unknown) => {
    llamadas.push(p)
    if (resultado instanceof Error) throw resultado
    return resultado
  }
  return { fn, llamadas }
}

function errorDeTablaInexistente() {
  return Object.assign(new Error('Failed query: select from "conversaciones_asistente"'), { cause: { code: '42P01' } })
}

const DEPS_CLAVES: DepsClaves = {
  cifrar: (t) => `cifrado(${t.length})`,
  agregar: async () => ({ id: UUID, ultimos4: '1234', orden: 1 }),
  eliminar: async () => true,
}

const casos: Array<[string, () => Promise<void>]> = [
  ['sin sesión -> 401 y el modelo (atender) no se llama', async () => {
    const { fn, llamadas } = atenderFalso({ respuesta: 'x', conversacionId: UUID })
    const r = await turnoHttp(null, { mensaje: 'hola' }, fn)
    assert.equal(r.status, 401)
    assert.equal(llamadas.length, 0)
  }],
  ['cuerpo sin mensaje -> 400', async () => {
    const { fn, llamadas } = atenderFalso({ respuesta: 'x', conversacionId: UUID })
    const r = await turnoHttp(ADMIN, {}, fn)
    assert.equal(r.status, 400)
    assert.equal(llamadas.length, 0)
  }],
  ['mensaje de 4.001 caracteres -> 400 sin llamar', async () => {
    const { fn, llamadas } = atenderFalso({ respuesta: 'x', conversacionId: UUID })
    const r = await turnoHttp(ADMIN, { mensaje: 'a'.repeat(4001) }, fn)
    assert.equal(r.status, 400)
    assert.equal(llamadas.length, 0)
  }],
  ['conversacionId que no es uuid -> 400', async () => {
    const { fn } = atenderFalso({ respuesta: 'x', conversacionId: UUID })
    const r = await turnoHttp(ADMIN, { mensaje: 'hola', conversacionId: 'no-uuid' }, fn)
    assert.equal(r.status, 400)
  }],
  ['turno válido -> 200 con respuesta y conversacionId', async () => {
    const { fn, llamadas } = atenderFalso({ respuesta: 'listo', conversacionId: UUID })
    const r = await turnoHttp(ADMIN, { mensaje: ' hola ' }, fn)
    assert.equal(r.status, 200)
    assert.deepEqual(r.body, { respuesta: 'listo', conversacionId: UUID })
    assert.equal((llamadas[0] as { mensaje: string }).mensaje, 'hola')
  }],
  ['tablas inexistentes -> 503 con mensaje de activación, no 500', async () => {
    const { fn } = atenderFalso(errorDeTablaInexistente())
    const r = await turnoHttp(ADMIN, { mensaje: 'hola' }, fn)
    assert.equal(r.status, 503)
    assert.equal(r.body.error, MENSAJE_SIN_BASE)
  }],
  ['topes no configurados -> 409 con el mensaje exacto', async () => {
    const { fn } = atenderFalso(new ErrorTopesNoConfigurados())
    const r = await turnoHttp(ADMIN, { mensaje: 'hola' }, fn)
    assert.equal(r.status, 409)
    assert.equal(r.body.error, 'Configura los topes de gasto en Configuración del asistente')
    assert.equal(r.body.error, MENSAJE_TOPES_NO_CONFIGURADOS)
  }],
  ['sin claves disponibles -> 503 con hora de reactivación', async () => {
    const { fn } = atenderFalso(new ErrorSinClavesDisponibles(new Date('2026-11-25T20:00:00Z')))
    const r = await turnoHttp(ADMIN, { mensaje: 'hola' }, fn)
    assert.equal(r.status, 503)
    assert.match(String(r.body.error), /aprox\. a las/)
  }],
  ['conversación ajena o inexistente -> 404', async () => {
    const { fn } = atenderFalso(new ErrorConversacionNoEncontrada())
    const r = await turnoHttp(ADMIN, { mensaje: 'hola', conversacionId: UUID }, fn)
    assert.equal(r.status, 404)
  }],
  ['error inesperado -> 500 genérico sin filtrar el mensaje ni claves', async () => {
    const { fn } = atenderFalso(new Error(`fallo con ${SECRETO} y texto del prompt`))
    const r = await turnoHttp(ADMIN, { mensaje: 'hola' }, fn)
    assert.equal(r.status, 500)
    assert.ok(!JSON.stringify(r.body).includes('sk-or'))
    assert.ok(!JSON.stringify(r.body).includes('prompt'))
  }],
  ['configuración: no admin -> 403 y no lee ni guarda', async () => {
    let tocado = false
    const deps = { leer: async () => { tocado = true; return {} }, guardar: async () => { tocado = true } }
    assert.equal((await leerConfiguracionHttp(COMERCIAL, deps)).status, 403)
    assert.equal((await guardarConfiguracionHttp(COMERCIAL, { topes: { usuarioDiaUsd: 1, globalDiaUsd: 2, alertaFraccion: 0.8 } }, deps)).status, 403)
    assert.equal(tocado, false)
  }],
  ['configuración: admin guarda topes válidos', async () => {
    const guardados: string[] = []
    const deps = { leer: async () => ({}), guardar: async (clave: string) => { guardados.push(clave) } }
    const r = await guardarConfiguracionHttp(ADMIN, { topes: { usuarioDiaUsd: 5, globalDiaUsd: 50, alertaFraccion: 0.8 } }, deps)
    assert.equal(r.status, 200)
    assert.deepEqual(guardados, ['topes'])
  }],
  ['clave: no admin -> 403', async () => {
    const r = await agregarClaveHttp(COMERCIAL, { proveedor: 'openrouter', etiqueta: 'x', clave: SECRETO }, DEPS_CLAVES)
    assert.equal(r.status, 403)
  }],
  ['clave: admin agrega y la respuesta solo trae últimos 4, nunca la clave', async () => {
    const r = await agregarClaveHttp(ADMIN, { proveedor: 'openrouter', etiqueta: 'Principal', clave: SECRETO }, DEPS_CLAVES)
    assert.equal(r.status, 201)
    const texto = JSON.stringify(r.body)
    assert.ok(!texto.includes(SECRETO))
    assert.ok(!texto.includes('cifrado('))
    assert.match(texto, /"ultimos4":"1234"/)
  }],
  ['clave: sin etiqueta o demasiado corta -> 400', async () => {
    assert.equal((await agregarClaveHttp(ADMIN, { proveedor: 'openrouter', etiqueta: '', clave: SECRETO }, DEPS_CLAVES)).status, 400)
    assert.equal((await agregarClaveHttp(ADMIN, { proveedor: 'openrouter', etiqueta: 'x', clave: 'corta' }, DEPS_CLAVES)).status, 400)
  }],
  ['lectura de configuración de admin pasa el resultado sin claves en claro', async () => {
    const r = await leerConfiguracionHttp(ADMIN, { leer: async () => ({ claves: [{ ultimos4: '1234' }] }), guardar: async () => {} })
    assert.equal(r.status, 200)
    assert.ok(!JSON.stringify(r.body).includes(SECRETO))
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
