import assert from 'node:assert/strict'
import { MockLanguageModelV4 } from 'ai/test'
import type { SesionEmpleado } from '../auth/session'
import type { ClaveRegistro, RepositorioClaves } from './claves'
import { ErrorSinClavesDisponibles } from './claves'
import { ejecutarTurno, PASOS_MAXIMOS, type ConfiguracionTurno, type DepsTurno, type LlamadaRegistro } from './bucle'
import { crearHerramientas, type AccionesLectura } from './herramientas'

const AHORA = new Date('2026-11-25T15:00:00.000Z')

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

const CONFIG: ConfiguracionTurno = {
  modelo: { proveedor: 'openrouter', modelo: 'modelo-prueba' },
  topes: { usuarioDiaUsd: 5, globalDiaUsd: 50, alertaFraccion: 0.8 },
  precios: { entradaPorMillon: 1, salidaPorMillon: 2 },
}

const ACCIONES: AccionesLectura = {
  cotizadorLista: async () => ({
    proyectos: [{ id: 'p-1', codigo: 'COT-1', nombreProyecto: 'Cocina', estado: 'borrador', tipoProyecto: 'personalizado', clienteId: 'c-1', createdAt: '2026-11-25' } as never],
    clientes: [{ id: 'c-1', nombre: 'Juan Pérez' } as never],
  }),
  proyecto: async () => ({ proyecto: null, cliente: null, espacios: [] }) as never,
  finanzas: async () => ({ cuentas: [] }) as never,
}

const USO = { input: 10, output: 5 }

function usage() {
  return {
    inputTokens: { total: USO.input, noCache: USO.input, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: USO.output, text: USO.output, reasoning: undefined },
  }
}

function respuestaTexto(texto: string) {
  return { content: [{ type: 'text' as const, text: texto }], finishReason: { unified: 'stop' as const, raw: undefined }, usage: usage(), warnings: [] }
}

function respuestaHerramienta(nombre: string, entrada: unknown, id = 'call-1') {
  return {
    content: [{ type: 'tool-call' as const, toolCallId: id, toolName: nombre, input: JSON.stringify(entrada) }],
    finishReason: { unified: 'tool-calls' as const, raw: undefined },
    usage: usage(),
    warnings: [],
  }
}

function errorConEstado(statusCode: number, responseHeaders?: Record<string, string>): Error {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode, responseHeaders })
}

function claveFalsa(id: string, orden: number, extra: Partial<ClaveRegistro> = {}): ClaveRegistro {
  return { id, proveedor: 'openrouter', etiqueta: id, claveCifrada: `c-${id}`, orden, estado: 'activa', enfriadaHasta: null, ...extra }
}

function entorno(opts: {
  claves?: ClaveRegistro[]
  modelos: Record<string, MockLanguageModelV4>
  gasto?: { usuario: number; global: number }
  herramientas?: DepsTurno['herramientas']
}) {
  const enfriadas: Array<[string, Date]> = []
  const invalidadas: string[] = []
  const rotaciones: unknown[] = []
  const llamadas: LlamadaRegistro[] = []
  const claves: RepositorioClaves = {
    listarClaves: async () => opts.claves ?? [claveFalsa('a', 1), claveFalsa('b', 2)],
    enfriar: async (id, hasta) => { enfriadas.push([id, hasta]) },
    invalidar: async (id) => { invalidadas.push(id) },
    registrarRotacion: async (ev) => { rotaciones.push(ev) },
  }
  const deps: DepsTurno = {
    claves,
    uso: {
      gastoDelDia: async (usuarioId) => (usuarioId === null ? opts.gasto?.global ?? 0 : opts.gasto?.usuario ?? 0),
      registrarLlamada: async (l) => { llamadas.push(l) },
    },
    descifrar: (c) => c.replace(/^c-/, 'CLAVE-'),
    construirModelo: (clave) => {
      const id = clave.replace(/^CLAVE-/, '')
      const modelo = opts.modelos[id]
      if (!modelo) throw new Error(`sin modelo para ${id}`)
      return modelo
    },
    herramientas: opts.herramientas ?? crearHerramientas(ACCIONES),
    ahora: () => AHORA,
    esperar: async () => {},
  }
  return { deps, enfriadas, invalidadas, rotaciones, llamadas }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['respuesta directa sin herramientas', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('Hola, en qué te ayudo.')] })
    const { deps, llamadas } = entorno({ modelos: { a: modelo } })
    const r = await ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'hola', configuracion: CONFIG }, deps)
    assert.equal(r.respuesta, 'Hola, en qué te ayudo.')
    assert.equal(modelo.doGenerateCalls.length, 1)
    assert.deepEqual(r.mensajesNuevos.map((m) => m.rol), ['usuario', 'asistente'])
    assert.ok(llamadas.some((l) => l.tipo === 'modelo' && l.proveedorClaveId === 'a' && l.costoEstimado !== undefined))
  }],
  ['una herramienta y respuesta final', async () => {
    const modelo = new MockLanguageModelV4({
      doGenerate: [respuestaHerramienta('cotizacion_buscar', { texto: 'juan' }), respuestaTexto('Encontré una cotización de Juan.')],
    })
    const { deps, llamadas } = entorno({ modelos: { a: modelo } })
    const r = await ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'busca a Juan', configuracion: CONFIG }, deps)
    assert.equal(r.respuesta, 'Encontré una cotización de Juan.')
    assert.equal(modelo.doGenerateCalls.length, 2)
    assert.ok(llamadas.some((l) => l.tipo === 'herramienta' && l.herramienta === 'cotizacion_buscar'))
  }],
  ['8 pasos sin parar devuelve un resumen, no un error', async () => {
    const modelo = new MockLanguageModelV4({
      doGenerate: async () => respuestaHerramienta('cotizacion_buscar', { texto: 'juan' }),
    })
    const { deps } = entorno({ modelos: { a: modelo } })
    const r = await ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'bucle', configuracion: CONFIG }, deps)
    assert.equal(modelo.doGenerateCalls.length, PASOS_MAXIMOS)
    assert.ok(r.respuesta.startsWith(`Alcancé el límite de ${PASOS_MAXIMOS} pasos`))
  }],
  ['usuario sin permiso: la herramienta no aparece en tools del modelo', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('ok')] })
    const { deps } = entorno({ modelos: { a: modelo } })
    await ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'saldo', configuracion: CONFIG }, deps)
    const nombres = (modelo.doGenerateCalls[0].tools ?? []).map((t) => t.name)
    assert.ok(!nombres.includes('caja_saldo'))
    assert.ok(nombres.includes('cotizacion_buscar'))
  }],
  ['instrucciones adicionales se añaden al sistema, no lo reemplazan', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('ok')] })
    const { deps } = entorno({ modelos: { a: modelo } })
    await ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: { ...CONFIG, instruccionesAdicionales: 'Responde corto.' } }, deps)
    const sistema = modelo.doGenerateCalls[0].prompt.find((m) => m.role === 'system')
    const texto = JSON.stringify(sistema)
    assert.ok(texto.includes('Responde corto.'))
    assert.ok(texto.includes('Usa las herramientas disponibles ANTES'))
  }],
  ['clave con 429 pasa a la siguiente y la primera queda enfriada', async () => {
    const malo = new MockLanguageModelV4({ doGenerate: async () => { throw errorConEstado(429) } })
    const bueno = new MockLanguageModelV4({ doGenerate: [respuestaTexto('desde b')] })
    const { deps, enfriadas } = entorno({ modelos: { a: malo, b: bueno } })
    const r = await ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: CONFIG }, deps)
    assert.equal(r.respuesta, 'desde b')
    assert.equal(enfriadas[0][0], 'a')
  }],
  ['401 marca la clave como inválida', async () => {
    const malo = new MockLanguageModelV4({ doGenerate: async () => { throw errorConEstado(401) } })
    const bueno = new MockLanguageModelV4({ doGenerate: [respuestaTexto('desde b')] })
    const { deps, invalidadas } = entorno({ modelos: { a: malo, b: bueno } })
    await ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: CONFIG }, deps)
    assert.deepEqual(invalidadas, ['a'])
  }],
  ['todas las claves fallan -> error con hora de reactivación', async () => {
    const malo = () => new MockLanguageModelV4({ doGenerate: async () => { throw errorConEstado(429) } })
    const { deps } = entorno({ modelos: { a: malo(), b: malo() } })
    await assert.rejects(
      ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: CONFIG }, deps),
      (err: unknown) => err instanceof ErrorSinClavesDisponibles && /aprox\. a las/.test((err as Error).message),
    )
  }],
  ['tope diario del usuario superado -> modelo no llamado', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('no debe salir')] })
    const { deps } = entorno({ modelos: { a: modelo }, gasto: { usuario: 5, global: 5 } })
    const r = await ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: CONFIG }, deps)
    assert.equal(modelo.doGenerateCalls.length, 0)
    assert.match(r.respuesta, /tope diario/)
  }],
  ['tope global superado -> modelo no llamado', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('no debe salir')] })
    const { deps } = entorno({ modelos: { a: modelo }, gasto: { usuario: 0, global: 50 } })
    await ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: CONFIG }, deps)
    assert.equal(modelo.doGenerateCalls.length, 0)
  }],
  ['gasto cerca del 80% devuelve alerta pero ejecuta el turno', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('ok')] })
    const { deps } = entorno({ modelos: { a: modelo }, gasto: { usuario: 4.2, global: 0 } })
    const r = await ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: CONFIG }, deps)
    assert.equal(modelo.doGenerateCalls.length, 1)
    assert.ok(r.alerta)
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
