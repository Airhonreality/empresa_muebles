import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { SesionEmpleado } from '../auth/session'
import type { DefinicionAsistente } from '../asistente/herramientas'
import { operacionesPropuestas } from '../asistente/ops/propuestas'
import type { FilaTokenMcp, RepositorioTokensMcp } from './tokens'
import { crearTokenMcp, generarToken, revocarTokenMcp } from './tokens'
import { manejarMcp, tituloSolicitudMcp, type DepsMcp } from './servidor'
import { acotarElementos, MAX_LLAMADAS_POR_PETICION } from './limites'
import type { Propuesta, RepositorioPropuestas, EstadoPropuesta } from '../asistente/propuestas'
import type { FilaProcedencia, RepositorioProcedencia } from '../asistente/procedencia'

const AHORA = new Date('2026-11-27T10:00:00.000Z')
const COMERCIAL = '11111111-1111-4111-8111-111111111111'
const OTRO_COMERCIAL = '22222222-2222-4222-8222-222222222222'
const ACEPTA = 'application/json, text/event-stream'

function sesionDe(usuarioId: string, rol: SesionEmpleado['rol'] = 'comercial'): SesionEmpleado {
  return { usuarioId, personaId: null, nombre: 'Prueba', email: `${usuarioId}@prueba.test`, rol }
}

/** Entorno de prueba: tokens en memoria, propuestas en memoria y un registro con lecturas y escrituras falsas. */
function entorno() {
  const filasTokens: FilaTokenMcp[] = []
  let nTok = 0
  const tokens: RepositorioTokensMcp = {
    insertar: async (f) => {
      const fila: FilaTokenMcp = { ...f, id: `tok-${++nTok}`, ultimoUsoEn: null, revocadoEn: null }
      filasTokens.push(fila)
      return { ...fila }
    },
    buscarPorHash: async (h) => {
      const f = filasTokens.find((x) => x.hash === h)
      return f ? { ...f } : null
    },
    marcarUso: async () => {},
    revocar: async (id, usuarioId, cuando) => {
      const f = filasTokens.find((x) => x.id === id && x.usuarioId === usuarioId && x.revocadoEn === null)
      if (!f) return false
      f.revocadoEn = cuando
      return true
    },
    listarDeUsuario: async (u) => filasTokens.filter((x) => x.usuarioId === u),
  }

  const filasProp = new Map<string, Propuesta>()
  const propuestas: RepositorioPropuestas = {
    insertar: async (p) => {
      const id = randomUUID()
      filasProp.set(id, { ...p, id, estado: 'pendiente' })
      return id
    },
    obtener: async (id) => (filasProp.has(id) ? { ...filasProp.get(id)! } : null),
    cambiarEstado: async (id, desde, nuevo) => {
      const f = filasProp.get(id)
      if (!f || f.estado !== desde) return false
      f.estado = nuevo as EstadoPropuesta
      return true
    },
    reabrir: async () => false,
    listarDeUsuario: async (u, estados) => [...filasProp.values()].filter((p) => p.usuarioId === u && estados.includes(p.estado)),
  }

  const procedencia: Array<FilaProcedencia & { usuarioId: string; creadaEn: Date }> = []
  const procedenciaPersistente: RepositorioProcedencia = {
    registrar: async (usuarioId, filas, creadaEn) => {
      for (const f of filas) procedencia.push({ ...f, usuarioId, creadaEn })
    },
    vigentes: async (usuarioId, desde) =>
      procedencia.filter((f) => f.usuarioId === usuarioId && f.creadaEn >= desde).map(({ herramienta, id }) => ({ herramienta, id })),
  }
  const titulos: string[] = []

  const contadores = { lecturas: 0, confirmaciones: 0 }
  const escrituras: unknown[] = []
  const lectura: DefinicionAsistente = {
    nombre: 'clientes.buscar',
    dominio: 'clientes',
    operacion: 'buscar',
    descripcion: 'Busca clientes.',
    permiso: 'clientes:leer',
    canales: ['chat', 'mcp'],
    esEscritura: false,
    esquema: z.object({ texto: z.string().min(1) }),
    ejecutar: async () => {
      contadores.lecturas++
      return { resultados: [{ id: 'c1', etiqueta: 'Cliente de prueba' }] }
    },
  } as DefinicionAsistente
  const escritura: DefinicionAsistente = {
    nombre: 'finanzas.movimiento_registrar',
    dominio: 'finanzas',
    operacion: 'movimiento_registrar',
    descripcion: 'Registra un movimiento.',
    permiso: 'finanzas:escribir',
    canales: ['chat', 'mcp'],
    esEscritura: true,
    esquema: z.object({ monto: z.number().positive() }),
    preparar: async (e) => ({ resumen: `Movimiento por ${e.monto}`, datos: e }),
    confirmar: async (datos) => {
      contadores.confirmaciones++
      escrituras.push(datos)
      return { ok: true }
    },
  } as DefinicionAsistente

  // Registro: lecturas y escrituras de prueba más las operaciones reales de propuestas.
  const registro: DefinicionAsistente[] = [lectura, escritura]
  const propDefs = operacionesPropuestas({ repo: propuestas, ahora: () => AHORA, registro: () => registro })
  registro.push(...propDefs)

  const deps: DepsMcp = {
    tokens: {
      repo: tokens,
      ahora: () => AHORA,
      cargarUsuario: async (id) => (id === COMERCIAL || id === OTRO_COMERCIAL ? sesionDe(id) : null),
    },
    registro,
    propuestas,
    procedenciaPersistente,
    crearConversacion: async (_usuarioId, titulo) => {
      titulos.push(titulo)
      return 'conv-prueba'
    },
    ahora: () => AHORA,
  }
  return { deps, contadores, escrituras, filasProp, titulos }
}

function peticion(token: string | null, cuerpo: unknown): Request {
  const cabeceras: Record<string, string> = {
    'content-type': 'application/json',
    accept: ACEPTA,
    'mcp-protocol-version': '2025-06-18',
  }
  if (token !== null) cabeceras.authorization = `Bearer ${token}`
  return new Request('http://localhost/api/mcp', { method: 'POST', headers: cabeceras, body: JSON.stringify(cuerpo) })
}

async function llamar(token: string | null, nombre: string, args: Record<string, unknown>, deps: DepsMcp, id = 1) {
  const r = await manejarMcp(
    peticion(token, { jsonrpc: '2.0', id, method: 'tools/call', params: { name: nombre, arguments: args } }),
    deps,
  )
  return { status: r.status, cuerpo: (await r.json()) as { result?: { isError?: boolean; content: Array<{ text: string }> }; error?: unknown } }
}

const textoDe = (r: { cuerpo: { result?: { content: Array<{ text: string }> } } }) => r.cuerpo.result?.content[0]?.text ?? ''

const casos: Array<[string, () => Promise<void>]> = [
  ['401 sin cabecera Authorization, sin ejecutar ninguna operación', async () => {
    const { deps, contadores } = entorno()
    const r = await manejarMcp(peticion(null, { jsonrpc: '2.0', id: 1, method: 'tools/list' }), deps)
    assert.equal(r.status, 401)
    assert.equal(r.headers.get('www-authenticate'), 'Bearer')
    const r2 = await llamar(null, 'ejecutar', { dominio: 'clientes', operacion: 'buscar', argumentos: { texto: 'x' } }, deps)
    assert.equal(r2.status, 401)
    assert.equal(contadores.lecturas, 0)
  }],
  ['401 con token inventado, sin ejecutar', async () => {
    const { deps, contadores } = entorno()
    const r = await llamar(generarToken().token, 'ejecutar', { dominio: 'clientes', operacion: 'buscar', argumentos: { texto: 'x' } }, deps)
    assert.equal(r.status, 401)
    assert.equal(contadores.lecturas, 0)
  }],
  ['401 con token revocado en la siguiente llamada', async () => {
    const { deps } = entorno()
    const { token, vista } = await crearTokenMcp(COMERCIAL, 'Prueba', deps.tokens)
    assert.equal((await llamar(token, 'dominios', {}, deps)).status, 200)
    await revocarTokenMcp(COMERCIAL, vista.id, deps.tokens)
    assert.equal((await llamar(token, 'dominios', {}, deps)).status, 401)
  }],
  ['401 con cabecera Authorization mal formada', async () => {
    const { deps } = entorno()
    const r = await manejarMcp(new Request('http://localhost/api/mcp', { method: 'POST', headers: { authorization: 'Basic abc' } }), deps)
    assert.equal(r.status, 401)
  }],
  ['tools/list expone solo las tres herramientas fijas', async () => {
    const { deps } = entorno()
    const { token } = await crearTokenMcp(COMERCIAL, 'Prueba', deps.tokens)
    const r = await manejarMcp(peticion(token, { jsonrpc: '2.0', id: 1, method: 'tools/list' }), deps)
    const cuerpo = (await r.json()) as { result: { tools: Array<{ name: string }> } }
    assert.deepEqual(cuerpo.result.tools.map((t) => t.name).sort(), ['dominios', 'ejecutar', 'operaciones'])
  }],
  ['dominios devuelve solo los dominios permitidos al rol', async () => {
    const { deps } = entorno()
    const { token } = await crearTokenMcp(COMERCIAL, 'Prueba', deps.tokens)
    const texto = textoDe(await llamar(token, 'dominios', {}, deps))
    assert.ok(texto.includes('clientes'))
    assert.equal(texto.includes('finanzas'), false)
  }],
  ['llamada fuera de permiso → error, sin ejecutar', async () => {
    const { deps, contadores } = entorno()
    const { token } = await crearTokenMcp(COMERCIAL, 'Prueba', deps.tokens)
    const r = await llamar(token, 'ejecutar', { dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { monto: 10 } }, deps)
    assert.equal(r.cuerpo.result?.isError, true)
    assert.match(textoDe(r), /no está disponible/)
    assert.equal(contadores.lecturas, 0)
  }],
  ['escritura sin confirmación → solo propuesta, nada se escribe', async () => {
    const { deps, contadores, escrituras, filasProp } = entorno()
    // El comercial no tiene finanzas:escribir; se usa un rol que sí, para probar el flujo de propuesta.
    const admin = { ...deps, tokens: { ...deps.tokens, cargarUsuario: async (id: string) => sesionDe(id, 'finanzas') } }
    const { token } = await crearTokenMcp(COMERCIAL, 'Finanzas', admin.tokens)
    const r = await llamar(token, 'ejecutar', { dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { monto: 10 } }, admin)
    assert.equal(r.cuerpo.result?.isError, false)
    assert.match(textoDe(r), /Propuesta creada/)
    assert.equal(contadores.confirmaciones, 0)
    assert.equal(escrituras.length, 0)
    assert.equal(filasProp.size, 1)
  }],
  ['propuestas.confirmar: otro usuario recibe error y no se ejecuta', async () => {
    const { deps, contadores, filasProp } = entorno()
    const admin = { ...deps, tokens: { ...deps.tokens, cargarUsuario: async (id: string) => sesionDe(id, 'finanzas') } }
    const { token: tokenDueno } = await crearTokenMcp(COMERCIAL, 'Dueño', admin.tokens)
    const r1 = await llamar(tokenDueno, 'ejecutar', { dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { monto: 5 } }, admin)
    const id = [...filasProp.keys()][0]
    assert.ok(id)
    assert.match(textoDe(r1), /Propuesta creada/)
    const otro = await crearTokenMcp(OTRO_COMERCIAL, 'Otro', admin.tokens)
    const r2 = await llamar(otro.token, 'ejecutar', { dominio: 'propuestas', operacion: 'confirmar', argumentos: { id } }, admin)
    assert.equal(r2.cuerpo.result?.isError, true)
    assert.match(textoDe(r2), /pertenece a otro usuario/)
    assert.equal(contadores.confirmaciones, 0)
  }],
  ['propuestas.confirmar por el dueño ejecuta la escritura una sola vez', async () => {
    const { deps, contadores, filasProp } = entorno()
    const admin = { ...deps, tokens: { ...deps.tokens, cargarUsuario: async (id: string) => sesionDe(id, 'finanzas') } }
    const { token } = await crearTokenMcp(COMERCIAL, 'Dueño', admin.tokens)
    await llamar(token, 'ejecutar', { dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { monto: 5 } }, admin)
    const id = [...filasProp.keys()][0]
    await llamar(token, 'ejecutar', { dominio: 'propuestas', operacion: 'confirmar', argumentos: { id } }, admin)
    const segunda = await llamar(token, 'ejecutar', { dominio: 'propuestas', operacion: 'confirmar', argumentos: { id } }, admin)
    assert.equal(contadores.confirmaciones, 1)
    assert.match(textoDe(segunda), /"sinCambios":true/)
  }],
  ['entrada inválida en ejecutar → error sin ejecutar', async () => {
    const { deps, contadores } = entorno()
    const { token } = await crearTokenMcp(COMERCIAL, 'Prueba', deps.tokens)
    const r = await llamar(token, 'ejecutar', { dominio: 'clientes', operacion: 'buscar', argumentos: { texto: '' } }, deps)
    assert.equal(r.cuerpo.result?.isError, true)
    assert.equal(contadores.lecturas, 0)
  }],
  ['límite de llamadas por petición: la novena se rechaza', async () => {
    const { deps, contadores } = entorno()
    const { token } = await crearTokenMcp(COMERCIAL, 'Prueba', deps.tokens)
    const lote = Array.from({ length: MAX_LLAMADAS_POR_PETICION + 1 }, (_, i) => ({
      jsonrpc: '2.0',
      id: i + 1,
      method: 'tools/call',
      params: { name: 'ejecutar', arguments: { dominio: 'clientes', operacion: 'buscar', argumentos: { texto: 'x' } } },
    }))
    const r = await manejarMcp(peticion(token, lote), deps)
    const respuestas = (await r.json()) as Array<{ result: { isError: boolean; content: Array<{ text: string }> } }>
    assert.equal(contadores.lecturas, MAX_LLAMADAS_POR_PETICION)
    assert.equal(respuestas[MAX_LLAMADAS_POR_PETICION].result.isError, true)
    assert.match(respuestas[MAX_LLAMADAS_POR_PETICION].result.content[0].text, /Límite de 8/)
  }],
  ['conversación MCP: título fijo "Solicitud MCP — <fecha de Bogotá>" al crear la propuesta', async () => {
    assert.equal(tituloSolicitudMcp(new Date('2026-11-27T10:00:00.000Z')), 'Solicitud MCP — 2026-11-27')
    // 03:00 UTC del 28 es 22:00 del 27 en Bogotá: la fecha es la local.
    assert.equal(tituloSolicitudMcp(new Date('2026-11-28T03:00:00.000Z')), 'Solicitud MCP — 2026-11-27')
    const { deps, titulos } = entorno()
    // Como en el caso de la escritura sin confirmación: un rol con finanzas:escribir crea la propuesta.
    const conFinanzas = { ...deps, tokens: { ...deps.tokens, cargarUsuario: async (id: string) => sesionDe(id, 'finanzas') } }
    const { token } = await crearTokenMcp(COMERCIAL, 'Finanzas', conFinanzas.tokens)
    const r = await llamar(token, 'ejecutar', { dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { monto: 5 } }, conFinanzas)
    assert.equal(r.cuerpo.result?.isError, false, textoDe(r))
    assert.deepEqual(titulos, ['Solicitud MCP — 2026-11-27'])
  }],
  ['acotarElementos: recorta listas a 20 y deja texto no JSON', async () => {
    const grande = JSON.stringify({ resultados: Array.from({ length: 35 }, (_, i) => ({ i })) })
    const acotado = JSON.parse(acotarElementos(grande)) as { resultados: unknown[] }
    assert.equal(acotado.resultados.length, 20)
    assert.equal(acotarElementos('[RESULTADO TRUNCADO'), '[RESULTADO TRUNCADO')
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
