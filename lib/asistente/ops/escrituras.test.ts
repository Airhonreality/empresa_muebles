// Pruebas de las escrituras del asistente (t-200 paso 4): preparar no escribe, confirmar revalida,
// procedencia obligatoria, tope de movimientos, documento duplicado y idempotencia de la confirmación.
import assert from 'node:assert/strict'
import type { SesionEmpleado } from '../../auth/session'
import { ErrorDuplicado, ErrorProcedencia, ErrorRevalidacion } from '../errores'
import { ejecutarOperacion, type DepsOperaciones } from '../operaciones'
import { Procedencia, type DefinicionAsistente } from '../herramientas'
import { confirmarPropuesta, type EstadoPropuesta, type Propuesta, type RepositorioPropuestas } from '../propuestas'
import { mundoFalso, registroFalso, type MundoFalso } from '../prueba-registro'
import { topeMovimientoPesos, TOPE_MOVIMIENTO_POR_DEFECTO, VARIABLE_TOPE_MOVIMIENTO } from './finanzas'

/** Entorno de prueba: solo la variable del tope. */
function entorno(valor: string | undefined): Record<string, string | undefined> {
  return valor === undefined ? {} : { [VARIABLE_TOPE_MOVIMIENTO]: valor }
}

const CLIENTE = '22222222-2222-4222-8222-222222222222'
const PRODUCTO = '33333333-3333-4333-8333-333333333333'
const CUENTA = '66666666-6666-4666-8666-666666666666'
const AHORA = new Date('2026-11-27T15:00:00.000Z')

const sesion: SesionEmpleado = { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol: 'admin' }

function repoMemoria() {
  const filas = new Map<string, Propuesta>()
  let n = 0
  const repo: RepositorioPropuestas = {
    async insertar(p) {
      const id = `prop-${++n}`
      filas.set(id, { ...p, id, estado: 'pendiente' })
      return id
    },
    async obtener(id) {
      const f = filas.get(id)
      return f ? { ...f } : null
    },
    async cambiarEstado(id, desde: EstadoPropuesta, nuevo: EstadoPropuesta) {
      const f = filas.get(id)
      if (!f || f.estado !== desde) return false
      f.estado = nuevo
      return true
    },
    async reabrir(id, datos, resumen) {
      const f = filas.get(id)
      if (!f || f.estado !== 'ejecutada') return false
      Object.assign(f, { estado: 'pendiente', entrada: datos, resumen })
      return true
    },
    async listarDeUsuario(usuarioId, estados) {
      return [...filas.values()].filter((f) => f.usuarioId === usuarioId && estados.includes(f.estado))
    },
  }
  return { repo, filas }
}

function mundo(extra: Partial<MundoFalso> = {}): MundoFalso {
  return mundoFalso({
    clientes: [{ id: CLIENTE, nombre: 'Juan Pérez', documento: '1020304050', telefono: null }],
    productos: [{ id: PRODUCTO, descripcion: 'Gabinete base 60', sku: 'GB-60', categoria: null, precioPublico: '250000.00', unidad: 'ud' }],
    cuentas: [{ id: CUENTA, nombre: 'Caja menor', tipo: 'caja_menor', saldoActual: '150000' }],
    ...extra,
  })
}

function procedenciaCon(...pares: Array<['cliente' | 'producto' | 'cuenta', string]>): Procedencia {
  const p = new Procedencia()
  for (const [tipo, id] of pares) p.registrar(tipo, [id])
  return p
}

function depsTurno(registro: DefinicionAsistente[], repo: RepositorioPropuestas, procedencia: Procedencia): DepsOperaciones {
  return {
    registro,
    propuestas: { repo, ahora: () => AHORA, registro },
    conversacionId: async () => 'conv-1',
    procedencia,
  }
}

const ENTRADA_COTIZACION = {
  clienteId: CLIENTE,
  nombreProyecto: 'Cocina Márquez',
  espacios: [{ tipoEspacio: 'cocina', nombre: 'Cocina', items: [{ productoId: PRODUCTO, cantidad: '2' }] }],
}

function op(registro: DefinicionAsistente[], nombre: string): DefinicionAsistente {
  const def = registro.find((h) => h.nombre === nombre)
  assert.ok(def, `falta ${nombre}`)
  return def
}

const casos: Array<[string, () => Promise<void>]> = [
  ['clientes.crear: preparar no escribe y deja un resumen', async () => {
    const m = mundo()
    const reg = registroFalso(m)
    const r = await ejecutarOperacion(
      { dominio: 'clientes', operacion: 'crear', argumentos: { nombre: 'Ana Ruiz' } }, sesion,
      depsTurno(reg, repoMemoria().repo, new Procedencia()),
    )
    assert.ok(r.propuesta)
    assert.match(r.propuesta.resumen, /Crear cliente "Ana Ruiz"/)
    assert.equal(m.escrituras.length, 0)
  }],
  ['clientes.crear con documento existente -> ErrorDuplicado con el id, y el id queda conocido en el turno', async () => {
    const m = mundo()
    const procedencia = new Procedencia()
    const reg = registroFalso(m)
    await assert.rejects(
      ejecutarOperacion({ dominio: 'clientes', operacion: 'crear', argumentos: { nombre: 'Otro', documento: '1020304050' } }, sesion, depsTurno(reg, repoMemoria().repo, procedencia)),
      (e: unknown) => e instanceof ErrorDuplicado && e.idExistente === CLIENTE,
    )
    assert.ok(procedencia.tiene('cliente', CLIENTE))
    assert.equal(m.escrituras.length, 0)
  }],
  ['clientes.crear: confirmar revalida el documento y escribe una vez', async () => {
    const m = mundo()
    const reg = registroFalso(m)
    const { repo } = repoMemoria()
    const r = await ejecutarOperacion({ dominio: 'clientes', operacion: 'crear', argumentos: { nombre: 'Ana Ruiz', documento: '99' } }, sesion, depsTurno(reg, repo, new Procedencia()))
    const conf = await confirmarPropuesta(r.propuesta!.id, sesion, { repo, ahora: () => AHORA, registro: reg })
    assert.equal(conf.estado, 'ejecutada')
    assert.equal(m.clientes.filter((c) => c.documento === '99').length, 1)
  }],
  ['clientes.crear: correo inválido y nombre vacío se rechazan', async () => {
    const reg = registroFalso(mundo())
    const d = depsTurno(reg, repoMemoria().repo, new Procedencia())
    await assert.rejects(ejecutarOperacion({ dominio: 'clientes', operacion: 'crear', argumentos: { nombre: 'A', email: 'no-es-correo' } }, sesion, d), /Argumentos inválidos/)
    await assert.rejects(ejecutarOperacion({ dominio: 'clientes', operacion: 'crear', argumentos: { nombre: '  ' } }, sesion, d), /Argumentos inválidos/)
  }],
  ['movimiento: tipo fuera del enum, monto con decimales o cero, y fecha inexistente se rechazan', async () => {
    const reg = registroFalso(mundo())
    const d = depsTurno(reg, repoMemoria().repo, procedenciaCon(['cuenta', CUENTA]))
    const base = { cuentaId: CUENTA, tipo: 'entrada', monto: '150000', fecha: '2026-11-27', descripcion: 'Pago' }
    for (const malo of [{ tipo: 'transferencia' }, { monto: '150000.50' }, { monto: '0' }, { fecha: '2026-02-30' }]) {
      await assert.rejects(ejecutarOperacion({ dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { ...base, ...malo } }, sesion, d), /Argumentos inválidos/)
    }
  }],
  ['movimiento: cuenta sin búsqueda en el turno -> ErrorProcedencia', async () => {
    const reg = registroFalso(mundo())
    const d = depsTurno(reg, repoMemoria().repo, new Procedencia())
    await assert.rejects(
      ejecutarOperacion({ dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { cuentaId: CUENTA, tipo: 'entrada', monto: '1000', fecha: '2026-11-27', descripcion: 'x' } }, sesion, d),
      ErrorProcedencia,
    )
  }],
  ['movimiento: por encima del tope configurable se rechaza al preparar', async () => {
    const previo = process.env[VARIABLE_TOPE_MOVIMIENTO]
    process.env[VARIABLE_TOPE_MOVIMIENTO] = '200000'
    try {
      const reg = registroFalso(mundo())
      const d = depsTurno(reg, repoMemoria().repo, procedenciaCon(['cuenta', CUENTA]))
      await assert.rejects(
        ejecutarOperacion({ dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { cuentaId: CUENTA, tipo: 'salida', monto: '300000', fecha: '2026-11-27', descripcion: 'x' } }, sesion, d),
        /supera el tope/,
      )
    } finally {
      if (previo === undefined) delete process.env[VARIABLE_TOPE_MOVIMIENTO]
      else process.env[VARIABLE_TOPE_MOVIMIENTO] = previo
    }
  }],
  ['tope: sin variable usa el defecto; valor inválido falla cerrado', async () => {
    assert.equal(topeMovimientoPesos(entorno(undefined)), TOPE_MOVIMIENTO_POR_DEFECTO)
    assert.equal(topeMovimientoPesos(entorno('500000')), 500000)
    assert.throws(() => topeMovimientoPesos(entorno('-5')), /entero positivo/)
    assert.throws(() => topeMovimientoPesos(entorno('mil')), /entero positivo/)
  }],
  ['movimiento: confirmar escribe el movimiento y ajusta el saldo de la cuenta', async () => {
    const m = mundo()
    const reg = registroFalso(m)
    const { repo } = repoMemoria()
    const r = await ejecutarOperacion(
      { dominio: 'finanzas', operacion: 'movimiento_registrar', argumentos: { cuentaId: CUENTA, tipo: 'salida', monto: '50000', fecha: '2026-11-27', descripcion: 'Compra de tornillos' } },
      sesion, depsTurno(reg, repo, procedenciaCon(['cuenta', CUENTA])),
    )
    assert.equal(m.escrituras.length, 0, 'preparar no escribe')
    await confirmarPropuesta(r.propuesta!.id, sesion, { repo, ahora: () => AHORA, registro: reg })
    assert.equal(m.cuentas[0].saldoActual, '100000')
    assert.equal(m.escrituras.filter((e) => e.tabla === 'movimientos').length, 1)
  }],
  ['cotización: preparar sin búsqueda del cliente -> ErrorProcedencia, sin propuesta', async () => {
    const reg = registroFalso(mundo())
    const { repo, filas } = repoMemoria()
    await assert.rejects(
      ejecutarOperacion({ dominio: 'cotizacion', operacion: 'crear_completa', argumentos: ENTRADA_COTIZACION }, sesion, depsTurno(reg, repo, procedenciaCon(['producto', PRODUCTO]))),
      ErrorProcedencia,
    )
    assert.equal(filas.size, 0)
  }],
  ['cotización: ciclo completo. Cambio de precio -> rechazo, propuesta pendiente con el total nuevo; luego confirma una vez', async () => {
    const m = mundo()
    const reg = registroFalso(m)
    const { repo, filas } = repoMemoria()
    const deps = { repo, ahora: () => AHORA, registro: reg }
    const r = await ejecutarOperacion(
      { dominio: 'cotizacion', operacion: 'crear_completa', argumentos: ENTRADA_COTIZACION }, sesion,
      depsTurno(reg, repo, procedenciaCon(['cliente', CLIENTE], ['producto', PRODUCTO])),
    )
    const id = r.propuesta!.id
    assert.equal(m.escrituras.length, 0)
    m.productos[0] = { ...m.productos[0], precioPublico: '300000.00' }
    await assert.rejects(confirmarPropuesta(id, sesion, deps), ErrorRevalidacion)
    assert.equal(filas.get(id)!.estado, 'pendiente')
    assert.match(filas.get(id)!.resumen, /Total \$ 600\.000/)
    assert.equal(m.escrituras.length, 0)
    // Segunda confirmación, ya con el resumen nuevo: escribe una sola vez.
    const ok = await confirmarPropuesta(id, sesion, deps)
    assert.equal(ok.estado, 'ejecutada')
    assert.equal(m.escrituras.filter((e) => e.tabla === 'proyectos').length, 1)
    // Idempotencia: confirmar otra vez no escribe.
    const otra = await confirmarPropuesta(id, sesion, deps)
    assert.equal(otra.sinCambios, true)
    assert.equal(m.escrituras.filter((e) => e.tabla === 'proyectos').length, 1)
  }],
  ['todas las escrituras están solo en el canal chat (MCP llega en el paso 8)', async () => {
    const reg = registroFalso(mundo())
    for (const h of reg.filter((x) => x.esEscritura)) assert.deepEqual([...h.canales], ['chat'])
  }],
  ['el registro tiene exactamente las escrituras previstas', async () => {
    const reg = registroFalso(mundo())
    assert.deepEqual(reg.filter((h) => h.esEscritura).map((h) => h.nombre).sort(), ['clientes.crear', 'cotizacion.crear_completa', 'finanzas.movimiento_registrar'])
    assert.ok(op(reg, 'cotizacion.crear_completa').esEscritura)
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
      console.log(`FALLA - ${nombre}\n${(err as Error).message}`)
    }
  }
  if (fallos > 0) process.exit(1)
}

void principal()
