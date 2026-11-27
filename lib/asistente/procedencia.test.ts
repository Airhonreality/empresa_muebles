// Pruebas de la procedencia persistente (t-200 §5.1): una búsqueda en una petición y una escritura en
// otra del mismo usuario; alcance por usuario; ventana de 60 minutos; id nunca buscado; búsqueda sin
// resultados. Cada "petición" tiene su propia Procedencia (como en MCP); el repositorio es simulado.
import assert from 'node:assert/strict'
import type { SesionEmpleado } from '../auth/session'
import { ErrorProcedencia } from './errores'
import { ejecutarOperacion, type DepsOperaciones } from './operaciones'
import { Procedencia, type DefinicionAsistente } from './herramientas'
import { filasDeDescubrimiento, VENTANA_PROCEDENCIA_MS, type FilaProcedencia, type RepositorioProcedencia } from './procedencia'
import { mundoFalso, registroFalso, repoPropuestasFalso } from './__pruebas__/prueba-registro'

const CUENTA = '66666666-6666-4666-8666-666666666666'
const T0 = new Date('2026-11-27T15:00:00.000Z')
const MIN = 60 * 1000

function sesionDe(usuarioId: string): SesionEmpleado {
  return { usuarioId, personaId: null, nombre: usuarioId, email: `${usuarioId}@prueba.test`, rol: 'admin' }
}
const A = sesionDe('usuario-a')
const B = sesionDe('usuario-b')

interface FilaGuardada extends FilaProcedencia {
  usuarioId: string
  creadaEn: Date
}

/** Repositorio de procedencia en memoria con el mismo filtro que producción (usuario, tipo de fila y fecha). */
function repoProcedenciaFalso(): RepositorioProcedencia & { filas: FilaGuardada[] } {
  const filas: FilaGuardada[] = []
  return {
    filas,
    async registrar(usuarioId, nuevas, creadaEn) {
      for (const f of nuevas) filas.push({ ...f, usuarioId, creadaEn })
    },
    async vigentes(usuarioId, desde) {
      return filas.filter((f) => f.usuarioId === usuarioId && f.creadaEn >= desde).map(({ herramienta, id }) => ({ herramienta, id }))
    },
  }
}

interface Entorno {
  registro: DefinicionAsistente[]
  repoProp: ReturnType<typeof repoPropuestasFalso>
  proc: ReturnType<typeof repoProcedenciaFalso>
  /** Dependencias de una petición, con su propia Procedencia y el reloj dado. */
  peticion(ahora: Date): DepsOperaciones
}

function entorno(cuentas = true): Entorno {
  const m = mundoFalso(
    cuentas ? { cuentas: [{ id: CUENTA, nombre: 'Caja menor', tipo: 'caja_menor', saldoActual: '150000' }] } : {},
  )
  const registro = registroFalso(m)
  const repoProp = repoPropuestasFalso()
  const proc = repoProcedenciaFalso()
  return {
    registro,
    repoProp,
    proc,
    peticion(ahora) {
      return {
        registro,
        propuestas: { repo: repoProp, ahora: () => ahora, registro },
        conversacionId: async () => 'conv-1',
        procedencia: new Procedencia(),
        procedenciaPersistente: { repo: proc, ahora: () => ahora },
        canal: 'mcp',
      }
    },
  }
}

const ENTRADA_MOVIMIENTO = { cuentaId: CUENTA, tipo: 'entrada', monto: '1000', fecha: '2026-11-27', descripcion: 'Prueba' }

function buscarCuentas(sesion: SesionEmpleado, deps: DepsOperaciones) {
  return ejecutarOperacion({ dominio: 'finanzas', operacion: 'cuentas', argumentos: {} }, sesion, deps)
}

function escribirMovimiento(sesion: SesionEmpleado, deps: DepsOperaciones, cuentaId = CUENTA) {
  return ejecutarOperacion(
    { dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { ...ENTRADA_MOVIMIENTO, cuentaId } },
    sesion,
    deps,
  )
}

const casos: Array<[string, () => Promise<void>]> = [
  ['búsqueda en una petición y escritura en otra del mismo usuario -> aceptada', async () => {
    const e = entorno()
    await buscarCuentas(A, e.peticion(T0))
    const r = await escribirMovimiento(A, e.peticion(new Date(T0.getTime() + 5 * MIN)))
    assert.ok(r.propuesta, 'debe crear propuesta')
  }],
  ['la búsqueda guarda una fila por id: herramienta, entrada_resumen = procedencia, id y hora', async () => {
    const e = entorno()
    await buscarCuentas(A, e.peticion(T0))
    assert.equal(e.proc.filas.length, 1)
    assert.deepEqual(e.proc.filas[0], {
      usuarioId: A.usuarioId,
      herramienta: 'finanzas.cuentas',
      id: CUENTA,
      creadaEn: T0,
    })
  }],
  ['id de otro usuario -> rechazado (ErrorProcedencia)', async () => {
    const e = entorno()
    await buscarCuentas(A, e.peticion(T0))
    await assert.rejects(escribirMovimiento(B, e.peticion(T0)), ErrorProcedencia)
    assert.equal(e.repoProp.filas.size, 0, 'no debe crearse propuesta')
  }],
  ['id vencido (más de 60 min) -> rechazado; dentro de la ventana -> aceptado', async () => {
    const e = entorno()
    await buscarCuentas(A, e.peticion(T0))
    await assert.rejects(
      escribirMovimiento(A, e.peticion(new Date(T0.getTime() + VENTANA_PROCEDENCIA_MS + MIN))),
      (err: Error) => err instanceof ErrorProcedencia && /Búscalo primero/.test(err.message),
    )
    const dentro = await escribirMovimiento(A, e.peticion(new Date(T0.getTime() + VENTANA_PROCEDENCIA_MS - MIN)))
    assert.ok(dentro.propuesta)
  }],
  ['id nunca buscado -> rechazado, sin propuesta', async () => {
    const e = entorno()
    await assert.rejects(escribirMovimiento(A, e.peticion(T0)), ErrorProcedencia)
    assert.equal(e.repoProp.filas.size, 0)
    assert.equal(e.proc.filas.length, 0)
  }],
  ['búsqueda sin resultados -> no registra nada', async () => {
    const e = entorno(false)
    const r = await buscarCuentas(A, e.peticion(T0))
    assert.match(r.texto, /"total":0/)
    assert.equal(e.proc.filas.length, 0)
  }],
  ['una fila de una operación solo habilita el tipo que devuelve (cuenta no vale como cliente)', async () => {
    const p = new Procedencia()
    p.cargarPersistidas([{ herramienta: 'clientes.buscar', id: CUENTA }])
    assert.equal(p.tiene('cliente', CUENTA), true)
    assert.equal(p.tiene('cuenta', CUENTA), false)
  }],
  ['filasDeDescubrimiento: sin ids repetidos y con la operación indicada', async () => {
    assert.deepEqual(filasDeDescubrimiento('clientes.buscar', [{ id: 'a' }, { id: 'a' }, { id: 'b' }]), [
      { herramienta: 'clientes.buscar', id: 'a' },
      { herramienta: 'clientes.buscar', id: 'b' },
    ])
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
