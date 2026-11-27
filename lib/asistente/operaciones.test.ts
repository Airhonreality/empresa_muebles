import assert from 'node:assert/strict'
import { z } from 'zod'
import type { SesionEmpleado } from '../auth/session'
import { lecturasErpTemporales as crearHerramientas, type AccionesLectura } from './ops/erp'
import { Procedencia, type DefinicionAsistente } from './herramientas'
import { dominioOperaciones, ejecutarOperacion, MENSAJE_NO_DISPONIBLE, type DepsOperaciones } from './operaciones'
import type { Propuesta, RepositorioPropuestas } from './propuestas'
import { conPermisosRestringidos } from './prueba-permisos'

const AHORA = new Date('2026-11-25T15:00:00.000Z')

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

function accionesFalsas() {
  const llamadas = { cotizadorLista: 0, finanzas: 0 }
  const acciones: AccionesLectura = {
    cotizadorLista: async () => {
      llamadas.cotizadorLista++
      return { proyectos: [], clientes: [] } as never
    },
    proyecto: async () => ({ proyecto: null, cliente: null, espacios: [] }) as never,
    finanzas: async () => {
      llamadas.finanzas++
      return { cuentas: [] } as never
    },
  }
  return { acciones, llamadas }
}

/** Operación de escritura de prueba: cuenta ejecuciones directas (no deben ocurrir). */
function escrituraFalsa(ejecuciones: unknown[]): DefinicionAsistente {
  return {
    nombre: 'cotizacion.crear_prueba',
    dominio: 'cotizacion',
    operacion: 'crear_prueba',
    descripcion: 'crea algo (prueba)',
    permiso: 'cotizador:escribir',
    canales: ['chat'],
    esEscritura: true,
    esquema: z.object({ nombre: z.string().min(1) }),
    preparar: async (e) => ({ resumen: `Crear ${e.nombre}`, datos: { entrada: e } }),
    confirmar: async (datos) => {
      ejecuciones.push(datos)
      return { ok: true }
    },
  }
}

function repoMemoria(): RepositorioPropuestas & { filas: Map<string, Propuesta> } {
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
}

function deps(registro: DefinicionAsistente[]) {
  const repo = repoMemoria()
  const d: DepsOperaciones = {
    registro,
    propuestas: { repo, ahora: () => AHORA, registro },
    conversacionId: async () => 'conv-1',
    procedencia: new Procedencia(),
  }
  return { d, repo }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['dominio_operaciones no lista operaciones que el permiso no cubre', async () => {
    const { acciones } = accionesFalsas()
    const reg = crearHerramientas(acciones)
    const comercial = await conPermisosRestringidos('comercial', ['cotizador:leer'], () => dominioOperaciones('finanzas', sesionCon('comercial'), reg))
    assert.deepEqual(comercial.operaciones, [])
    const admin = dominioOperaciones('finanzas', sesionCon('admin'), reg)
    assert.deepEqual(admin.operaciones.map((o) => o.operacion), ['saldo_caja'])
    assert.equal(typeof admin.operaciones[0].esquema, 'object')
  }],
  ['dominio inexistente responde lista vacía (igual que uno sin permiso)', async () => {
    const { acciones } = accionesFalsas()
    const r = dominioOperaciones('nada', sesionCon('admin'), crearHerramientas(acciones))
    assert.deepEqual(r.operaciones, [])
  }],
  ['operación no permitida se rechaza aunque se pida por nombre, sin tocar la acción', async () => {
    const { acciones, llamadas } = accionesFalsas()
    const { d } = deps(crearHerramientas(acciones))
    await conPermisosRestringidos('comercial', ['cotizador:leer'], () =>
      assert.rejects(
        ejecutarOperacion({ dominio: 'finanzas', operacion: 'saldo_caja', argumentos: {} }, sesionCon('comercial'), d),
        (e: unknown) => e instanceof Error && e.message === MENSAJE_NO_DISPONIBLE,
      ),
    )
    assert.equal(llamadas.finanzas, 0)
  }],
  ['operación inexistente y no permitida dan el mismo mensaje', async () => {
    const { acciones } = accionesFalsas()
    const { d } = deps(crearHerramientas(acciones))
    const msg = async (op: { dominio: string; operacion: string }) => {
      try {
        await ejecutarOperacion({ ...op, argumentos: {} }, sesionCon('comercial'), d)
        return 'sin error'
      } catch (e) {
        return (e as Error).message
      }
    }
    await conPermisosRestringidos('comercial', ['cotizador:leer'], async () =>
      assert.equal(await msg({ dominio: 'finanzas', operacion: 'saldo_caja' }), await msg({ dominio: 'x', operacion: 'y' })),
    )
  }],
  ['argumentos inválidos no ejecutan la operación de lectura', async () => {
    const { acciones, llamadas } = accionesFalsas()
    const { d } = deps(crearHerramientas(acciones))
    await assert.rejects(
      ejecutarOperacion({ dominio: 'cotizacion', operacion: 'buscar', argumentos: { texto: 'a' } }, sesionCon('admin'), d),
      /Entrada inválida/,
    )
    assert.equal(llamadas.cotizadorLista, 0)
  }],
  ['envelope inválido (sin operación) se rechaza', async () => {
    const { acciones } = accionesFalsas()
    const { d } = deps(crearHerramientas(acciones))
    await assert.rejects(ejecutarOperacion({ dominio: 'cotizacion' }, sesionCon('admin'), d), /Entrada inválida para ejecutar/)
  }],
  ['escritura crea propuesta pendiente y NO llama a la función de ejecución', async () => {
    const ejecuciones: unknown[] = []
    const { d, repo } = deps([escrituraFalsa(ejecuciones)])
    const r = await ejecutarOperacion({ dominio: 'cotizacion', operacion: 'crear_prueba', argumentos: { nombre: 'Cocina' } }, sesionCon('admin'), d)
    assert.equal(ejecuciones.length, 0)
    assert.ok(r.propuesta)
    assert.equal(r.propuesta.resumen, 'Crear Cocina')
    assert.equal(repo.filas.get(r.propuesta.id)?.estado, 'pendiente')
    assert.equal(repo.filas.get(r.propuesta.id)?.conversacionId, 'conv-1')
    assert.match(r.texto, /pendiente de confirmación/)
  }],
  ['escritura con argumentos inválidos no crea propuesta', async () => {
    const ejecuciones: unknown[] = []
    const { d, repo } = deps([escrituraFalsa(ejecuciones)])
    await assert.rejects(
      ejecutarOperacion({ dominio: 'cotizacion', operacion: 'crear_prueba', argumentos: { nombre: '' } }, sesionCon('admin'), d),
      /Argumentos inválidos/,
    )
    assert.equal(repo.filas.size, 0)
    assert.equal(ejecuciones.length, 0)
  }],
  ['escritura sin permiso de escritura se rechaza sin propuesta', async () => {
    const ejecuciones: unknown[] = []
    const { d, repo } = deps([escrituraFalsa(ejecuciones)])
    await conPermisosRestringidos('taller', ['proyectos:leer'], () =>
      assert.rejects(
        ejecutarOperacion({ dominio: 'cotizacion', operacion: 'crear_prueba', argumentos: { nombre: 'x' } }, sesionCon('taller'), d),
        (e: unknown) => e instanceof Error && e.message === MENSAJE_NO_DISPONIBLE,
      ),
    )
    assert.equal(repo.filas.size, 0)
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
