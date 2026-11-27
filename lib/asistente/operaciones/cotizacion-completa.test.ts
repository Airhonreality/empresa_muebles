import assert from 'node:assert/strict'
import type { SesionEmpleado } from '../../auth/session'
import { calcularTotalesCotizacion } from '../../dinero/calculo'
import { confirmarPropuesta, type DepsPropuestas, type Propuesta, type RepositorioPropuestas } from '../propuestas'
import { ejecutarOperacion } from '../operaciones'
import {
  crearCotizacionCompleta,
  ErrorCotizacion,
  operacionCotizacionCrearCompleta,
  planificarCotizacion,
  type EjecutorTransaccion,
  type EntradaCotizacionCompleta,
  type EscrituraCotizacion,
  type LecturaCotizacion,
} from './cotizacion-completa'

const AHORA = new Date('2026-11-25T15:00:00.000Z')
const CLIENTE_ID = '22222222-2222-4222-8222-222222222222'
const PRODUCTO_ID = '33333333-3333-4333-8333-333333333333'
const PRODUCTO_2_ID = '44444444-4444-4444-8444-444444444444'

function sesionCon(rol: SesionEmpleado['rol'], usuarioId = 'u-1'): SesionEmpleado {
  return { usuarioId, personaId: null, nombre: usuarioId, email: `${usuarioId}@prueba.test`, rol }
}

/** Estado de la "base" simulada. Solo cambia si una transacción termina bien (commit). */
interface Mundo {
  clientes: Array<{ id: string; nombre: string }>
  productos: Map<string, { precioPublico: string | null; anulado: boolean }>
  proyectos: Array<{ id: string; codigo: string; clienteId: string }>
  espacios: Array<{ id: string; proyectoId: string; nombreEspacio: string }>
  items: Array<{ id: string; varianteId: string; precioUnitario: string; totalLinea: string; cantidad: string }>
  contador: number
}

function mundoInicial(): Mundo {
  return {
    clientes: [{ id: CLIENTE_ID, nombre: 'Juan Pérez' }],
    productos: new Map([
      [PRODUCTO_ID, { precioPublico: '250000.00', anulado: false }],
      [PRODUCTO_2_ID, { precioPublico: '100000.00', anulado: false }],
    ]),
    proyectos: [],
    espacios: [],
    items: [],
    contador: 0,
  }
}

function lecturaDe(m: Mundo): LecturaCotizacion {
  return {
    clienteNombre: async (id) => m.clientes.find((c) => c.id === id)?.nombre ?? null,
    productoCatalogo: async (id) => m.productos.get(id) ?? null,
  }
}

/**
 * Transacción simulada: trabaja sobre una COPIA del mundo y solo la publica si `fn` termina bien.
 * Si `fn` lanza, la copia se descarta (equivalente al ROLLBACK).
 */
function transaccionFalsa(
  m: Mundo,
  opciones: { fallaEnItemNumero?: number; colisionCodigoVeces?: number } = {},
): { transaccion: EjecutorTransaccion; intentos: { n: number } } {
  const intentos = { n: 0 }
  let colisiones = opciones.colisionCodigoVeces ?? 0
  const transaccion: EjecutorTransaccion = async (fn) => {
    intentos.n++
    const copia = structuredClone(m)
    const tx: EscrituraCotizacion = {
      ...lecturaDe(copia),
      cotizacionesDelDia: async () => copia.proyectos.length,
      clienteCrear: async (datos) => {
        const id = `cli-${copia.clientes.length + 1}`
        copia.clientes.push({ id, nombre: datos.nombre })
        return id
      },
      proyectoInsertar: async (f) => {
        if (colisiones > 0) {
          colisiones--
          throw Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' })
        }
        const id = `proy-${++copia.contador}`
        copia.proyectos.push({ id, codigo: f.codigo, clienteId: f.clienteId })
        return id
      },
      espacioInsertar: async (f) => {
        const id = `esp-${++copia.contador}`
        copia.espacios.push({ id, proyectoId: f.proyectoId, nombreEspacio: f.nombreEspacio })
        return id
      },
      itemInsertar: async (f) => {
        const numero = copia.items.length + 1
        if (opciones.fallaEnItemNumero === numero) throw new Error('fallo simulado al insertar ítem')
        const id = `it-${++copia.contador}`
        copia.items.push({ id, varianteId: f.varianteId, precioUnitario: f.precioUnitario, totalLinea: f.totalLinea, cantidad: f.cantidad })
        return id
      },
    }
    const resultado = await fn(tx)
    // Commit: se publica la copia.
    Object.assign(m, copia)
    return resultado
  }
  return { transaccion, intentos }
}

function entradaBase(overrides: Partial<EntradaCotizacionCompleta> = {}): EntradaCotizacionCompleta {
  return {
    cliente: { id: CLIENTE_ID },
    nombreProyecto: 'Cocina integral',
    espacios: [
      {
        nombre: 'Cocina',
        items: [
          { catalogoId: PRODUCTO_ID, cantidad: '2' },
          { catalogoId: PRODUCTO_2_ID, cantidad: '1' },
        ],
      },
    ],
    ...overrides,
  }
}

function depsDe(m: Mundo, opciones: Parameters<typeof transaccionFalsa>[1] = {}) {
  const { transaccion, intentos } = transaccionFalsa(m, opciones)
  return { deps: { lectura: lecturaDe(m), transaccion, ahora: () => AHORA }, intentos }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['fallo en el último ítem -> cero filas creadas (ni cliente nuevo, ni proyecto, ni espacio)', async () => {
    const m = mundoInicial()
    const { deps } = depsDe(m, { fallaEnItemNumero: 2 })
    const entrada = entradaBase({ cliente: { nombre: 'Ana Gómez' } })
    await assert.rejects(crearCotizacionCompleta(entrada, sesionCon('admin'), deps), /fallo simulado/)
    assert.equal(m.clientes.length, 1, 'el cliente nuevo no debe persistir')
    assert.equal(m.proyectos.length, 0)
    assert.equal(m.espacios.length, 0)
    assert.equal(m.items.length, 0)
  }],
  ['caso feliz: crea cliente existente, proyecto, espacio e ítems con código del servidor', async () => {
    const m = mundoInicial()
    const { deps } = depsDe(m)
    const r = await crearCotizacionCompleta(entradaBase(), sesionCon('admin'), deps)
    assert.equal(m.proyectos.length, 1)
    assert.equal(r.codigo, 'COT-2026-11-25-001')
    assert.equal(m.proyectos[0].clienteId, CLIENTE_ID)
    assert.equal(m.espacios.length, 1)
    assert.equal(m.items.length, 2)
    assert.equal(r.totalItems, 2)
  }],
  ['descuentoComercial -> rechazo explícito (sin permiso en la matriz única), sin escritura', async () => {
    const m = mundoInicial()
    const { deps, intentos } = depsDe(m)
    await assert.rejects(
      crearCotizacionCompleta(entradaBase({ descuentoComercial: '50000' }), sesionCon('comercial'), deps),
      ErrorCotizacion,
    )
    assert.equal(m.proyectos.length, 0)
    assert.equal(intentos.n, 1)
  }],
  ['precio enviado por el modelo distinto del catálogo -> se usa el del catálogo', async () => {
    const m = mundoInicial()
    const { deps } = depsDe(m)
    const entrada = entradaBase({
      espacios: [{ nombre: 'Cocina', items: [{ catalogoId: PRODUCTO_ID, cantidad: '2', precioUnitario: '1' }] }],
    })
    await crearCotizacionCompleta(entrada, sesionCon('comercial'), deps)
    assert.equal(m.items[0].precioUnitario, '250000.00')
    assert.equal(m.items[0].totalLinea, '500000')
  }],
  ['ítem sin catálogo -> rechazo (precio libre no disponible), sin escritura', async () => {
    const m = mundoInicial()
    const { deps } = depsDe(m)
    const entrada = entradaBase({
      espacios: [{ nombre: 'Baño', items: [{ catalogoId: null, nombrePersonalizado: 'Repisa', cantidad: '1', precioUnitario: '80000' }] }],
    })
    await assert.rejects(crearCotizacionCompleta(entrada, sesionCon('comercial'), deps), ErrorCotizacion)
    assert.equal(m.items.length, 0)
  }],
  ['producto de catálogo inexistente o anulado -> error, sin escritura', async () => {
    const m = mundoInicial()
    m.productos.set(PRODUCTO_ID, { precioPublico: '1', anulado: true })
    const { deps } = depsDe(m)
    await assert.rejects(crearCotizacionCompleta(entradaBase(), sesionCon('admin'), deps), ErrorCotizacion)
    assert.equal(m.proyectos.length, 0)
  }],
  ['cliente inexistente -> error claro, sin escritura', async () => {
    const m = mundoInicial()
    const { deps } = depsDe(m)
    await assert.rejects(
      crearCotizacionCompleta(entradaBase({ cliente: { id: '55555555-5555-4555-8555-555555555555' } }), sesionCon('admin'), deps),
      /cliente indicado no existe/,
    )
    assert.equal(m.proyectos.length, 0)
  }],
  ['los totales coinciden con calcularTotalesCotizacion sobre los mismos datos', async () => {
    const m = mundoInicial()
    const { deps } = depsDe(m)
    const r = await crearCotizacionCompleta(entradaBase({ aplicaIva: true }), sesionCon('admin'), deps)
    const esperado = calcularTotalesCotizacion({
      materiales: 500000 + 100000, manoObra: 0, costosOperativos: 0, imprevistos: 0,
      descuento: 0, ajuste: 0, aplicaIva: true, porcentajeIva: 19,
    })
    assert.deepEqual(r.totales, esperado)
  }],
  ['código repetido (23505) reintenta la transacción completa con otro código', async () => {
    const m = mundoInicial()
    const { deps, intentos } = depsDe(m, { colisionCodigoVeces: 1 })
    const r = await crearCotizacionCompleta(entradaBase(), sesionCon('admin'), deps)
    assert.equal(intentos.n, 2)
    assert.equal(m.proyectos.length, 1)
    assert.equal(r.codigo, 'COT-2026-11-25-001')
  }],
  ['escritura pasa por propuesta: el resumen trae cliente, espacios, ítems y total, sin escribir', async () => {
    const m = mundoInicial()
    const { deps } = depsDe(m)
    const reg = [operacionCotizacionCrearCompleta(deps)]
    const propuestas = new Map<string, Propuesta>()
    let n = 0
    const repo: RepositorioPropuestas = {
      insertar: async (p) => { const id = `p-${++n}`; propuestas.set(id, { ...p, id, estado: 'pendiente' }); return id },
      obtener: async (id) => (propuestas.has(id) ? { ...propuestas.get(id)! } : null),
      cambiarEstado: async (id, desde, nuevo) => { const f = propuestas.get(id); if (!f || f.estado !== desde) return false; f.estado = nuevo; return true },
    }
    const dp: DepsPropuestas = { repo, ahora: () => AHORA, registro: reg }
    const r = await ejecutarOperacion(
      { dominio: 'cotizacion', operacion: 'crear_completa', argumentos: entradaBase() },
      sesionCon('admin'),
      { registro: reg, propuestas: dp, conversacionId: async () => 'conv-1' },
    )
    assert.ok(r.propuesta)
    assert.match(r.propuesta.resumen, /Juan Pérez/)
    assert.match(r.propuesta.resumen, /Espacios \(1\): Cocina/)
    assert.match(r.propuesta.resumen, /Ítems: 2/)
    assert.match(r.propuesta.resumen, /Total \$ 600\.000/)
    assert.equal(m.proyectos.length, 0, 'preparar la propuesta no escribe')
    // Confirmar dos veces: la segunda no hace nada.
    const primera = await confirmarPropuesta(r.propuesta.id, sesionCon('admin'), dp)
    assert.equal(primera.estado, 'ejecutada')
    assert.equal(m.proyectos.length, 1)
    const segunda = await confirmarPropuesta(r.propuesta.id, sesionCon('admin'), dp)
    assert.equal(segunda.sinCambios, true)
    assert.equal(m.proyectos.length, 1, 'la segunda confirmación no crea otra cotización')
  }],
  ['planificar no escribe nada (solo lee y calcula)', async () => {
    const m = mundoInicial()
    const plan = await planificarCotizacion(entradaBase(), sesionCon('admin'), lecturaDe(m))
    assert.equal(plan.totales.total, 600000)
    assert.equal(m.proyectos.length, 0)
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
