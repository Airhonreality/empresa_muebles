import assert from 'node:assert/strict'
import { MockLanguageModelV4 } from 'ai/test'
import type { SesionEmpleado } from '../auth/session'
import type { Mensaje, ConfiguracionTurno, DepsTurno } from './bucle'
import { ErrorTopesNoConfigurados } from './bucle'
import type { ClaveRegistro, RepositorioClaves } from './claves'
import { atenderMensaje, ErrorConversacionNoEncontrada, tituloDe, type RepositorioConversaciones } from './servicio'

const CONFIG: ConfiguracionTurno = {
  modelo: { proveedor: 'openrouter', modelo: 'modelo-prueba' },
  topes: { usuarioDiaUsd: 5, globalDiaUsd: 50, alertaFraccion: 0.8 },
  precios: { entradaPorMillon: 1, salidaPorMillon: 2 },
}

function sesionDe(usuarioId: string): SesionEmpleado {
  return { usuarioId, personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol: 'admin' }
}

function respuestaTexto(texto: string) {
  return {
    content: [{ type: 'text' as const, text: texto }],
    finishReason: { unified: 'stop' as const, raw: undefined },
    usage: {
      inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
      outputTokens: { total: 1, text: 1, reasoning: undefined },
    },
    warnings: [],
  }
}

/** Repositorio de conversaciones en memoria. Cada conversación tiene dueño. */
function repoEnMemoria() {
  const porId = new Map<string, { usuarioId: string; mensajes: Mensaje[] }>()
  let n = 0
  const repo: RepositorioConversaciones = {
    async historial(id, usuarioId) {
      const c = porId.get(id)
      if (!c || c.usuarioId !== usuarioId) return null
      return [...c.mensajes]
    },
    async crear(usuarioId) {
      const id = `conv-${++n}`
      porId.set(id, { usuarioId, mensajes: [] })
      return id
    },
    async guardarMensajes(id, mensajes) {
      porId.get(id)?.mensajes.push(...mensajes)
    },
    async listar() {
      return []
    },
  }
  return { repo, porId }
}

function turnoFalso(modelo: MockLanguageModelV4): DepsTurno {
  const claves: RepositorioClaves = {
    listarClaves: async (): Promise<ClaveRegistro[]> => [
      { id: 'k1', proveedor: 'openrouter', etiqueta: 'k1', claveCifrada: 'c', orden: 1, estado: 'activa', enfriadaHasta: null },
    ],
    enfriar: async () => {},
    invalidar: async () => {},
    registrarRotacion: async () => {},
  }
  return {
    claves,
    uso: { gastoDelDia: async () => 0, registrarLlamada: async () => {} },
    descifrar: () => 'clave-prueba',
    construirModelo: () => modelo,
    herramientas: [],
    propuestas: { insertar: async () => 'p-x', obtener: async () => null, cambiarEstado: async () => false },
    ahora: () => new Date('2026-11-25T15:00:00.000Z'),
    esperar: async () => {},
  }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['primer turno crea la conversación y guarda usuario y asistente', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('hola')] })
    const { repo, porId } = repoEnMemoria()
    const r = await atenderMensaje(
      { usuario: sesionDe('u-1'), mensaje: 'buenas' },
      { conversaciones: repo, cargarConfiguracion: async () => CONFIG, turno: turnoFalso(modelo) },
    )
    assert.equal(r.respuesta, 'hola')
    assert.equal(porId.get(r.conversacionId)?.mensajes.length, 2)
    assert.equal(porId.get(r.conversacionId)?.usuarioId, 'u-1')
  }],
  ['segundo turno usa el historial propio y agrega a la misma conversación', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('uno'), respuestaTexto('dos')] })
    const { repo, porId } = repoEnMemoria()
    const deps = { conversaciones: repo, cargarConfiguracion: async () => CONFIG, turno: turnoFalso(modelo) }
    const primero = await atenderMensaje({ usuario: sesionDe('u-1'), mensaje: 'a' }, deps)
    await atenderMensaje({ usuario: sesionDe('u-1'), conversacionId: primero.conversacionId, mensaje: 'b' }, deps)
    assert.equal(porId.get(primero.conversacionId)?.mensajes.length, 4)
  }],
  ['conversación de otro usuario -> no encontrada, modelo no llamado', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('no debe salir')] })
    const { repo } = repoEnMemoria()
    const deps = { conversaciones: repo, cargarConfiguracion: async () => CONFIG, turno: turnoFalso(modelo) }
    const propia = await atenderMensaje({ usuario: sesionDe('u-1'), mensaje: 'secreto' }, deps)
    await assert.rejects(
      atenderMensaje({ usuario: sesionDe('u-2'), conversacionId: propia.conversacionId, mensaje: 'husmear' }, deps),
      ErrorConversacionNoEncontrada,
    )
    assert.equal(modelo.doGenerateCalls.length, 1)
  }],
  ['sin topes -> error y no se crea conversación vacía', async () => {
    const modelo = new MockLanguageModelV4({ doGenerate: [respuestaTexto('no debe salir')] })
    const { repo, porId } = repoEnMemoria()
    await assert.rejects(
      atenderMensaje(
        { usuario: sesionDe('u-1'), mensaje: 'x' },
        { conversaciones: repo, cargarConfiguracion: async () => ({ ...CONFIG, topes: undefined }), turno: turnoFalso(modelo) },
      ),
      ErrorTopesNoConfigurados,
    )
    assert.equal(modelo.doGenerateCalls.length, 0)
    assert.equal(porId.size, 0)
  }],
  ['tituloDe toma las primeras palabras y recorta a 60 caracteres', async () => {
    assert.equal(tituloDe('  cotización   de Juan Pérez para la cocina del apartamento nuevo  '), 'cotización de Juan Pérez para la cocina del')
    assert.ok(tituloDe('x'.repeat(200)).length <= 60)
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
