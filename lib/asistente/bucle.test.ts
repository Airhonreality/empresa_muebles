import assert from 'node:assert/strict'
import { MockLanguageModelV4 } from 'ai/test'
import type { SesionEmpleado } from '../auth/session'
import type { ClaveRegistro, RepositorioClaves } from './claves'
import type { Propuesta, RepositorioPropuestas } from './propuestas'
import { ErrorSinClavesDisponibles } from './claves'
import {
  ejecutarTurno,
  ErrorTopesNoConfigurados,
  MENSAJE_TOPES_NO_CONFIGURADOS,
  type ConfiguracionTurno,
  type DepsTurno,
  type LlamadaRegistro,
} from './bucle'
import { mundoFalso, registroFalso } from './prueba-registro'
import { conPermisosRestringidos } from './prueba-permisos'

const PASOS_MAXIMOS = 8

const AHORA = new Date('2026-11-25T15:00:00.000Z')

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

const CONFIG: ConfiguracionTurno = {
  modelo: { proveedor: 'openrouter', modelo: 'modelo-prueba' },
  temperatura: 0.2,
  maxTokensRespuesta: 1024,
  pasosMaximos: PASOS_MAXIMOS,
  herramientasHabilitadas: ['clientes.buscar', 'cotizacion.buscar', 'finanzas.cuentas', 'cotizacion.crear_completa'],
  topes: { usuarioDiaUsd: 5, globalDiaUsd: 50, alertaFraccion: 0.8 },
  precios: { entradaPorMillon: 1, salidaPorMillon: 2 },
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

/** Almacén de propuestas en memoria para los tests del bucle. */
function propuestasMemoria(): RepositorioPropuestas & { filas: Map<string, Propuesta> } {
  const filas = new Map<string, Propuesta>()
  let n = 0
  return {
    filas,
    insertar: async (p) => {
      const id = `prop-${++n}`
      filas.set(id, { ...p, id, estado: 'pendiente' })
      return id
    },
    obtener: async (id) => (filas.has(id) ? { ...filas.get(id)! } : null),
    reabrir: async () => false,
    listarDeUsuario: async () => [],
    cambiarEstado: async (id, desde, nuevo) => {
      const f = filas.get(id)
      if (!f || f.estado !== desde) return false
      f.estado = nuevo
      return true
    },
  }
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
  const propuestas = propuestasMemoria()
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
    herramientas: opts.herramientas ?? registroFalso(),
    propuestas: propuestas,
    asegurarConversacion: async () => 'conv-test',
    ahora: () => AHORA,
    esperar: async () => {},
  }
  return { deps, enfriadas, invalidadas, rotaciones, llamadas, propuestas }
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
      doGenerate: [respuestaHerramienta('ejecutar', { dominio: 'cotizacion', operacion: 'buscar', argumentos: { texto: 'juan' } }), respuestaTexto('Encontré una cotización de Juan.')],
    })
    const { deps, llamadas } = entorno({ modelos: { a: modelo } })
    const r = await ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'busca a Juan', configuracion: CONFIG }, deps)
    assert.equal(r.respuesta, 'Encontré una cotización de Juan.')
    assert.equal(modelo.doGenerateCalls.length, 2)
    assert.ok(llamadas.some((l) => l.tipo === 'herramienta' && l.herramienta === 'cotizacion.buscar'))
  }],
  ['8 pasos sin parar devuelve un resumen, no un error', async () => {
    const modelo = new MockLanguageModelV4({
      doGenerate: async () => respuestaHerramienta('ejecutar', { dominio: 'cotizacion', operacion: 'buscar', argumentos: { texto: 'juan' } }),
    })
    const { deps } = entorno({ modelos: { a: modelo } })
    const r = await ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'bucle', configuracion: CONFIG }, deps)
    assert.equal(modelo.doGenerateCalls.length, PASOS_MAXIMOS)
    assert.ok(r.respuesta.startsWith(`Alcancé el límite de ${PASOS_MAXIMOS} pasos`))
  }],
  ['usuario sin permiso: la herramienta no aparece en tools del modelo', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('ok')] })
    const { deps } = entorno({ modelos: { a: modelo } })
    await conPermisosRestringidos('comercial', ['clientes:leer'], () =>
      ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'saldo', configuracion: CONFIG }, deps),
    )
    const nombres = (modelo.doGenerateCalls[0].tools ?? []).map((t) => t.name)
    assert.deepEqual(nombres.sort(), ['dominio_operaciones', 'ejecutar'])
    const sistema = JSON.stringify(modelo.doGenerateCalls[0].prompt.find((m) => m.role === 'system'))
    assert.ok(!sistema.includes('- finanzas'))
    assert.ok(sistema.includes('- clientes'))
  }],
  ['temperatura y tokens de respuesta del panel llegan al modelo; las reglas base siguen en el sistema', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('ok')] })
    const { deps } = entorno({ modelos: { a: modelo } })
    await ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: CONFIG }, deps)
    const llamada = modelo.doGenerateCalls[0] as unknown as { temperature?: number; maxOutputTokens?: number }
    assert.equal(llamada.temperature, 0.2)
    assert.equal(llamada.maxOutputTokens, 1024)
    const texto = JSON.stringify(modelo.doGenerateCalls[0].prompt.find((m) => m.role === 'system'))
    assert.ok(texto.includes('Usa las herramientas disponibles ANTES'))
  }],
  ['herramientas habilitadas vacías: el modelo no recibe ninguna herramienta', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('ok')] })
    const { deps } = entorno({ modelos: { a: modelo } })
    await ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: { ...CONFIG, herramientasHabilitadas: [] } }, deps)
    const herramientas = (modelo.doGenerateCalls[0] as unknown as { tools?: unknown[] }).tools ?? []
    assert.equal(herramientas.length, 0)
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
  ['sin topes en configuración -> error claro y modelo no llamado', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('no debe salir')] })
    const { deps } = entorno({ modelos: { a: modelo }, gasto: { usuario: 0, global: 0 } })
    const sinTopes: ConfiguracionTurno = { ...CONFIG, topes: undefined }
    await assert.rejects(
      ejecutarTurno({ usuario: sesionCon('admin'), historial: [], mensaje: 'x', configuracion: sinTopes }, deps),
      (err: unknown) => err instanceof ErrorTopesNoConfigurados && (err as Error).message === MENSAJE_TOPES_NO_CONFIGURADOS,
    )
    assert.equal(modelo.doGenerateCalls.length, 0)
  }],
  ['cotización por el asistente: queda como propuesta pendiente y ninguna escritura real', async () => {
    const CLIENTE = '22222222-2222-4222-8222-222222222222'
    const PRODUCTO = '33333333-3333-4333-8333-333333333333'
    const mundo = mundoFalso({
      clientes: [{ id: CLIENTE, nombre: 'Juan Pérez', documento: null, telefono: null }],
      productos: [{ id: PRODUCTO, descripcion: 'Gabinete', sku: 'G-1', categoria: null, precioPublico: '100000.00', unidad: 'ud' }],
    })
    const herramientas = registroFalso(mundo)
    const modelo = new MockLanguageModelV4({
      doGenerate: [
        respuestaHerramienta('ejecutar', {
          dominio: 'cotizacion',
          operacion: 'crear_completa',
          argumentos: {
            cliente: { id: CLIENTE },
            nombreProyecto: 'Cocina',
            espacios: [{ nombre: 'Cocina', items: [{ catalogoId: PRODUCTO, cantidad: '2' }] }],
          },
        }),
        respuestaTexto('Preparé la cotización; revísala y confírmala.'),
      ],
    })
    const { deps, propuestas, llamadas } = entorno({ modelos: { a: modelo }, herramientas })
    const r = await ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'cotiza a Juan', configuracion: CONFIG }, deps)
    assert.equal(mundo.escrituras.length, 0)
    assert.ok(r.propuestas && r.propuestas.length === 1)
    const id = r.propuestas[0].id
    assert.equal(propuestas.filas.get(id)?.estado, 'pendiente')
    assert.equal(propuestas.filas.get(id)?.herramienta, 'cotizacion.crear_completa')
    assert.equal(propuestas.filas.get(id)?.conversacionId, 'conv-test')
    assert.match(r.propuestas[0].resumen, /Juan Pérez/)
    // El modelo recibe el texto de propuesta pendiente, no un éxito.
    const resultadoDelModelo = JSON.stringify(modelo.doGenerateCalls[1].prompt)
    assert.ok(resultadoDelModelo.includes('pendiente de confirmación'))
    assert.ok(llamadas.some((l) => l.herramienta === 'cotizacion.crear_completa'))
  }],
  ['procedimientos: el índice va al prompt y procedimiento_consultar solo si hay docs permitidos', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('ok'), respuestaTexto('ok')] })
    const { deps } = entorno({ modelos: { a: modelo } })
    deps.documentos = [
      { ruta: 'cotizaciones/iva.md', titulo: 'IVA en una cotización', dueno: 'area-cotizaciones', revisado: '2026-11-26', permiso: 'cotizador:leer', cuerpo: 'El IVA es 19.' },
      { ruta: 'finanzas/cierre.md', titulo: 'Cierre', dueno: 'area-finanzas', revisado: '2026-11-26', permiso: 'finanzas:escribir', cuerpo: 'secreto' },
    ]
    await conPermisosRestringidos('comercial', ['cotizador:leer', 'proyectos:leer'], () =>
      ejecutarTurno({ usuario: sesionCon('comercial'), historial: [], mensaje: 'iva', configuracion: CONFIG }, deps),
    )
    const sistema = JSON.stringify(modelo.doGenerateCalls[0].prompt.find((m) => m.role === 'system'))
    assert.ok(sistema.includes('cotizaciones/iva.md: IVA en una cotización'))
    assert.ok(!sistema.includes('cierre.md'))
    const nombres = (modelo.doGenerateCalls[0].tools ?? []).map((t) => t.name)
    assert.ok(nombres.includes('procedimiento_consultar'))
    await conPermisosRestringidos('taller', ['proyectos:leer'], () =>
      ejecutarTurno({ usuario: sesionCon('taller'), historial: [], mensaje: 'iva', configuracion: CONFIG }, deps),
    )
    const nombresTaller = (modelo.doGenerateCalls[1].tools ?? []).map((t) => t.name)
    assert.ok(!nombresTaller.includes('procedimiento_consultar'))
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
