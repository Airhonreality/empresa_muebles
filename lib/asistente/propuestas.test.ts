import assert from 'node:assert/strict'
import { z } from 'zod'
import type { SesionEmpleado } from '../auth/session'
import type { DefinicionAsistente } from './herramientas'
import { conPermisosRestringidos } from './__pruebas__/prueba-permisos'
import {
  ErrorPropuesta,
  cancelarPropuesta,
  confirmarPropuesta,
  crearPropuesta,
  HORAS_VENCIMIENTO,
  type DepsPropuestas,
  type EstadoPropuesta,
  type Propuesta,
  type RepositorioPropuestas,
} from './propuestas'

const AHORA = new Date('2026-11-25T15:00:00.000Z')

function sesion(usuarioId: string, rol: SesionEmpleado['rol'] = 'finanzas'): SesionEmpleado {
  return { usuarioId, personaId: null, nombre: usuarioId, email: `${usuarioId}@prueba.test`, rol }
}

function repoMemoria() {
  const filas = new Map<string, Propuesta>()
  let n = 0
  const repo: RepositorioPropuestas = {
    insertar: async (p) => {
      const id = `prop-${++n}`
      filas.set(id, { ...p, id, estado: 'pendiente' })
      return id
    },
    obtener: async (id) => (filas.has(id) ? { ...filas.get(id)! } : null),
    reabrir: async (id, datos, resumen) => {
      const f = filas.get(id)
      if (!f || f.estado !== 'ejecutada') return false
      Object.assign(f, { estado: 'pendiente', entrada: datos, resumen })
      return true
    },
    listarDeUsuario: async () => [],
    cambiarEstado: async (id, desde, nuevo) => {
      const f = filas.get(id)
      if (!f || f.estado !== desde) return false
      f.estado = nuevo
      return true
    },
  }
  return { repo, filas }
}

/** Herramienta de escritura de prueba: cuenta ejecuciones. */
function escrituraFalsa(opciones: { falla?: boolean } = {}) {
  const ejecuciones: unknown[] = []
  const def: DefinicionAsistente = {
    nombre: 'finanzas.movimiento_registrar',
    dominio: 'finanzas',
    operacion: 'movimiento_registrar',
    descripcion: 'registra un movimiento (prueba)',
    permiso: 'finanzas:escribir',
    canales: ['chat'],
    esEscritura: true,
    esquema: z.object({ monto: z.number().positive() }),
    preparar: async (entrada) => ({ resumen: 'x', datos: entrada }),
    confirmar: async (entrada) => {
      ejecuciones.push(entrada)
      if (opciones.falla) throw new Error('fallo simulado')
      return { creado: true }
    },
  }
  return { def, ejecuciones }
}

function entorno(ahora: { valor: Date } = { valor: AHORA }, def = escrituraFalsa()) {
  const { repo, filas } = repoMemoria()
  const deps: DepsPropuestas = { repo, ahora: () => ahora.valor, registro: [def.def] }
  return { deps, filas, ahora, ejecuciones: def.ejecuciones }
}

async function creaPendiente(deps: DepsPropuestas, usuario: SesionEmpleado) {
  const { id } = await crearPropuesta(
    { usuario, conversacionId: 'conv-1', herramienta: 'finanzas.movimiento_registrar', datos: { monto: 500000 }, resumen: 'Ingreso $ 500.000' },
    deps,
  )
  return id
}

const casos: Array<[string, () => Promise<void>]> = [
  ['crear propuesta guarda exactamente los datos que devolvió preparar (la validación es de preparar)', async () => {
    const { deps, filas } = entorno()
    const { id } = await crearPropuesta({ usuario: sesion('u1'), conversacionId: 'c', herramienta: 'finanzas.movimiento_registrar', datos: { monto: 7 }, resumen: 'x' }, deps)
    assert.deepEqual(filas.get(id)!.entrada, { monto: 7 })
    assert.equal(filas.get(id)!.estado, 'pendiente')
  }],
  ['crear propuesta rechaza herramientas que no son de escritura', async () => {
    const { deps } = entorno()
    const lectura = { ...deps.registro[0], nombre: 'lectura', esEscritura: false } as DefinicionAsistente
    await assert.rejects(
      crearPropuesta({ usuario: sesion('u1'), conversacionId: 'c', herramienta: 'lectura', datos: {}, resumen: 'x' },
        { ...deps, registro: [lectura] }),
      (e: unknown) => e instanceof ErrorPropuesta && e.codigo === 'NO_ES_ESCRITURA',
    )
  }],
  ['confirmar por el mismo usuario ejecuta la herramienta una vez', async () => {
    const { deps, ejecuciones } = entorno()
    const id = await creaPendiente(deps, sesion('u1'))
    const r = await confirmarPropuesta(id, sesion('u1'), deps)
    assert.equal(r.estado, 'ejecutada')
    assert.equal(r.sinCambios, false)
    assert.deepEqual(ejecuciones, [{ monto: 500000 }])
  }],
  ['otra sesión recibe 403 y no ejecuta nada', async () => {
    const { deps, ejecuciones } = entorno()
    const id = await creaPendiente(deps, sesion('u1'))
    await assert.rejects(
      confirmarPropuesta(id, sesion('u2'), deps),
      (e: unknown) => e instanceof ErrorPropuesta && e.status === 403 && e.codigo === 'NO_PERTENECE',
    )
    await assert.rejects(cancelarPropuesta(id, sesion('u2'), deps), (e: unknown) => e instanceof ErrorPropuesta && e.status === 403)
    assert.equal(ejecuciones.length, 0)
  }],
  ['doble confirmación: la segunda es no-op', async () => {
    const { deps, ejecuciones } = entorno()
    const id = await creaPendiente(deps, sesion('u1'))
    await confirmarPropuesta(id, sesion('u1'), deps)
    const segunda = await confirmarPropuesta(id, sesion('u1'), deps)
    assert.equal(segunda.sinCambios, true)
    assert.equal(segunda.estado, 'ejecutada')
    assert.equal(ejecuciones.length, 1)
  }],
  ['confirmaciones simultáneas: solo una ejecuta', async () => {
    const { deps, ejecuciones } = entorno()
    const id = await creaPendiente(deps, sesion('u1'))
    await Promise.all([confirmarPropuesta(id, sesion('u1'), deps), confirmarPropuesta(id, sesion('u1'), deps)])
    assert.equal(ejecuciones.length, 1)
  }],
  ['propuesta vencida (48 h) no se ejecuta', async () => {
    const reloj = { valor: AHORA }
    const { deps, ejecuciones } = entorno(reloj)
    const id = await creaPendiente(deps, sesion('u1'))
    reloj.valor = new Date(AHORA.getTime() + (HORAS_VENCIMIENTO + 1) * 3600_000)
    const r = await confirmarPropuesta(id, sesion('u1'), deps)
    assert.equal(r.estado, 'vencida')
    assert.equal(ejecuciones.length, 0)
  }],
  ['propuesta cancelada no se ejecuta', async () => {
    const { deps, ejecuciones } = entorno()
    const id = await creaPendiente(deps, sesion('u1'))
    const c = await cancelarPropuesta(id, sesion('u1'), deps)
    assert.equal(c.estado, 'cancelada')
    const r = await confirmarPropuesta(id, sesion('u1'), deps)
    assert.equal(r.estado, 'cancelada')
    assert.equal(r.sinCambios, true)
    assert.equal(ejecuciones.length, 0)
  }],
  ['si la ejecución falla, la propuesta queda fallida y no se reintenta sola', async () => {
    const { deps, filas, ejecuciones } = entorno(undefined, escrituraFalsa({ falla: true }))
    const id = await creaPendiente(deps, sesion('u1'))
    await assert.rejects(confirmarPropuesta(id, sesion('u1'), deps), /fallo simulado/)
    assert.equal(filas.get(id)!.estado as EstadoPropuesta, 'fallida')
    const r = await confirmarPropuesta(id, sesion('u1'), deps)
    assert.equal(r.sinCambios, true)
    assert.equal(ejecuciones.length, 1)
  }],
  ['confirmar sin permiso de la herramienta no la marca como ejecutada', async () => {
    const { deps, filas, ejecuciones } = entorno()
    const id = await creaPendiente(deps, sesion('u1', 'finanzas'))
    await conPermisosRestringidos('comercial', ['cotizador:leer'], () =>
      assert.rejects(confirmarPropuesta(id, sesion('u1', 'comercial'), deps), (e: unknown) => e instanceof ErrorPropuesta && e.codigo === 'SIN_PERMISO'),
    )
    assert.equal(filas.get(id)!.estado, 'pendiente')
    assert.equal(ejecuciones.length, 0)
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
