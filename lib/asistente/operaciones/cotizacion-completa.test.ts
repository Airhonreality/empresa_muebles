// Pruebas de cotizacion.crear_completa (t-200 paso 4): contrato de entrada, procedencia, precio del
// catálogo, revalidación del total, atomicidad e impacto cero de preparar.
import assert from 'node:assert/strict'
import type { SesionEmpleado } from '../../auth/session'
import { calcularTotalesCotizacion } from '../../dinero/calculo'
import { ErrorProcedencia, ErrorRevalidacion } from '../errores'
import { Procedencia } from '../herramientas'
import { cotizacionFalsa, mundoFalso, type MundoFalso } from '../__pruebas__/prueba-registro'
import {
  crearCotizacionCompleta,
  ErrorCotizacion,
  esquemaCotizacionCompleta,
  operacionCotizacionCrearCompleta,
  planificarCotizacion,
} from './cotizacion-completa'

const CLIENTE = '22222222-2222-4222-8222-222222222222'
const PRODUCTO = '33333333-3333-4333-8333-333333333333'
const OTRO_PRODUCTO = '44444444-4444-4444-8444-444444444444'

const sesion: SesionEmpleado = { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol: 'comercial' }

function mundo(extra: Partial<MundoFalso> = {}): MundoFalso {
  return mundoFalso({
    clientes: [{ id: CLIENTE, nombre: 'Juan Pérez', documento: null, telefono: null }],
    productos: [
      { id: PRODUCTO, descripcion: 'Gabinete base 60', sku: 'GB-60', categoria: 'Cocinas', precioPublico: '250000.00', unidad: 'ud' },
      { id: OTRO_PRODUCTO, descripcion: 'Tirador', sku: 'TI-1', categoria: null, precioPublico: '15000.00', unidad: 'ud' },
    ],
    ...extra,
  })
}

function entrada(sobre: Record<string, unknown> = {}) {
  return {
    clienteId: CLIENTE,
    nombreProyecto: 'Cocina Márquez',
    espacios: [{ tipoEspacio: 'cocina', nombre: 'Cocina', items: [{ productoId: PRODUCTO, cantidad: '2' }] }],
    ...sobre,
  }
}

/** Lo que el modelo tendría que haber buscado antes en el mismo turno. */
function conBusquedas(...pares: Array<['cliente' | 'producto', string]>): Procedencia {
  const p = new Procedencia()
  for (const [tipo, id] of pares) p.registrar(tipo, [id])
  return p
}

const TODO_BUSCADO = () => conBusquedas(['cliente', CLIENTE], ['producto', PRODUCTO], ['producto', OTRO_PRODUCTO])

const casos: Array<[string, () => Promise<void>]> = [
  ['preparar solo lee y calcula: cero escrituras', async () => {
    const m = mundo()
    const op = operacionCotizacionCrearCompleta(cotizacionFalsa(m))
    const datos = esquemaCotizacionCompleta.parse(entrada())
    const r = await op.preparar!(datos, sesion, { procedencia: TODO_BUSCADO() })
    assert.equal(m.escrituras.length, 0)
    assert.match(r.resumen, /Total \$ 500\.000/)
    assert.match(r.resumen, /No incluye mano de obra/)
  }],
  ['caso feliz: proyecto, espacio con tipo, ítems a precio de catálogo, código del servidor', async () => {
    const m = mundo()
    const r = await crearCotizacionCompleta(esquemaCotizacionCompleta.parse(entrada()), cotizacionFalsa(m))
    assert.equal(r.codigo, 'COT-2026-11-27-001')
    assert.equal(m.escrituras.filter((e) => e.tabla === 'proyectos').length, 1)
    const espacio = m.escrituras.find((e) => e.tabla === 'espacios')!.fila as { tipoEspacio: string }
    assert.equal(espacio.tipoEspacio, 'cocina')
    const item = m.escrituras.find((e) => e.tabla === 'items')!.fila as { catalogoId: string; precioUnitario: string; totalLinea: string }
    assert.equal(item.catalogoId, PRODUCTO)
    assert.equal(item.precioUnitario, '250000.00')
    assert.equal(item.totalLinea, '500000')
  }],
  ['los totales coinciden con calcularTotalesCotizacion sobre los mismos datos (con IVA)', async () => {
    const m = mundo()
    const r = await crearCotizacionCompleta(esquemaCotizacionCompleta.parse(entrada({ aplicaIva: true })), cotizacionFalsa(m))
    const esperado = calcularTotalesCotizacion({
      materiales: 500000, manoObra: 0, costosOperativos: 0, imprevistos: 0, descuento: 0, ajuste: 0, aplicaIva: true, porcentajeIva: 19,
    })
    assert.deepEqual(r.totales, esperado)
  }],
  ['precio enviado por el modelo se descarta: el total sale del catálogo', async () => {
    const datos = esquemaCotizacionCompleta.parse(entrada({
      espacios: [{ tipoEspacio: 'cocina', nombre: 'Cocina', items: [{ productoId: PRODUCTO, cantidad: '2', precioUnitario: '1' }] }],
    }))
    const plan = await planificarCotizacion(datos, cotizacionFalsa(mundo()).lectura)
    assert.equal(plan.espacios[0].items[0].precioUnitario, '250000.00')
    assert.equal(plan.totales.subtotal, 500000)
  }],
  ['descuento o cliente nuevo no existen en el contrato: se descartan o fallan la validación', async () => {
    assert.throws(() => esquemaCotizacionCompleta.parse(entrada({ clienteId: undefined, cliente: { nombre: 'Nuevo' } })))
    const parseado = esquemaCotizacionCompleta.parse(entrada({ descuentoComercial: '50000' }))
    assert.equal('descuentoComercial' in parseado, false)
  }],
  ['tipo de espacio fuera de la lista se rechaza', async () => {
    assert.throws(() => esquemaCotizacionCompleta.parse(entrada({ espacios: [{ tipoEspacio: 'garaje', nombre: 'X', items: [{ productoId: PRODUCTO, cantidad: '1' }] }] })))
  }],
  ['cantidad inválida, cero o sin ítems se rechazan', async () => {
    assert.throws(() => esquemaCotizacionCompleta.parse(entrada({ espacios: [{ tipoEspacio: 'cocina', nombre: 'X', items: [{ productoId: PRODUCTO, cantidad: '0' }] }] })))
    assert.throws(() => esquemaCotizacionCompleta.parse(entrada({ espacios: [{ tipoEspacio: 'cocina', nombre: 'X', items: [] }] })))
  }],
  ['cliente que no existe -> error claro, cero escrituras', async () => {
    const m = mundo()
    await assert.rejects(
      crearCotizacionCompleta(esquemaCotizacionCompleta.parse(entrada({ clienteId: '55555555-5555-4555-8555-555555555555' })), cotizacionFalsa(m)),
      /cliente indicado no existe/,
    )
    assert.equal(m.escrituras.length, 0)
  }],
  ['producto que no existe o está anulado -> error, cero escrituras', async () => {
    const m = mundo({ productos: [] })
    await assert.rejects(crearCotizacionCompleta(esquemaCotizacionCompleta.parse(entrada()), cotizacionFalsa(m)), ErrorCotizacion)
    assert.equal(m.escrituras.length, 0)
  }],
  ['procedencia: cliente sin búsqueda en el turno -> ErrorProcedencia al preparar', async () => {
    const op = operacionCotizacionCrearCompleta(cotizacionFalsa(mundo()))
    await assert.rejects(
      op.preparar!(esquemaCotizacionCompleta.parse(entrada()), sesion, { procedencia: conBusquedas(['producto', PRODUCTO]) }),
      ErrorProcedencia,
    )
  }],
  ['procedencia: producto no buscado -> ErrorProcedencia al preparar', async () => {
    const op = operacionCotizacionCrearCompleta(cotizacionFalsa(mundo()))
    await assert.rejects(
      op.preparar!(esquemaCotizacionCompleta.parse(entrada()), sesion, { procedencia: conBusquedas(['cliente', CLIENTE]) }),
      ErrorProcedencia,
    )
  }],
  ['revalidación: si el total cambió desde el resumen, no escribe y avisa con el total nuevo', async () => {
    const m = mundo()
    const op = operacionCotizacionCrearCompleta(cotizacionFalsa(m))
    const preparada = await op.preparar!(esquemaCotizacionCompleta.parse(entrada()), sesion, { procedencia: TODO_BUSCADO() })
    // Cambia el precio del catálogo entre preparar y confirmar.
    m.productos[0] = { ...m.productos[0], precioPublico: '300000.00' }
    await assert.rejects(op.confirmar(preparada.datos, sesion), (e: unknown) => {
      assert.ok(e instanceof ErrorRevalidacion)
      assert.match(e.message, /cambió de \$ 500\.000 a \$ 600\.000/)
      assert.match(e.resumenNuevo, /Total \$ 600\.000/)
      return true
    })
    assert.equal(m.escrituras.length, 0)
  }],
  ['sin cambios de precio, confirmar escribe la cotización', async () => {
    const m = mundo()
    const op = operacionCotizacionCrearCompleta(cotizacionFalsa(m))
    const preparada = await op.preparar!(esquemaCotizacionCompleta.parse(entrada()), sesion, { procedencia: TODO_BUSCADO() })
    const r = await op.confirmar(preparada.datos, sesion) as { codigo: string }
    assert.equal(r.codigo, 'COT-2026-11-27-001')
    assert.ok(m.escrituras.some((e) => e.tabla === 'proyectos'))
  }],
  ['atomicidad: fallo en el último ítem -> cero filas (proyecto y espacio incluidos)', async () => {
    const m = mundo({ fallaEnItem: 2 })
    const datos = esquemaCotizacionCompleta.parse(entrada({
      espacios: [{ tipoEspacio: 'cocina', nombre: 'Cocina', items: [{ productoId: PRODUCTO, cantidad: '1' }, { productoId: OTRO_PRODUCTO, cantidad: '1' }] }],
    }))
    await assert.rejects(crearCotizacionCompleta(datos, cotizacionFalsa(m)), /fallo simulado/)
    assert.equal(m.escrituras.length, 0)
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
