// lib/asistente/operaciones/cotizacion-completa.ts
// Operación cotizacion.crear_completa (T2). Crea cliente (opcional), proyecto, espacios e ítems en
// UNA transacción. Este módulo es puro: toda lectura y escritura entra por puertos
// (LecturaCotizacion / EscrituraCotizacion). La implementación Drizzle está en cotizacion-produccion.ts.
//
// Reglas que impone el SERVIDOR, no el modelo:
// - Código COT-AAAA-MM-DD-NN generado aquí (cuenta las del día dentro de la transacción).
// - Precio de ítems de catálogo = precioPublico de la base (lo que usa el cotizador). Lo que envíe el modelo se ignora.
// - Ítem sin catálogo: exige cotizador:precio_libre y precio explícito.
// - descuentoComercial: exige cotizador:descuento (la presencia del campo basta para pedirlo).
// - Totales: calcularTotalesCotizacion (cálculo único). Mano de obra, costos e imprevistos = 0 (ver informe).
import { z } from 'zod'
import type { SesionEmpleado } from '../../auth/session'
import { NoAutorizadoError, PERMISOS_POR_ROL, type Permiso } from '../permisos'
import { aNumero, calcularTotalLinea, calcularTotalesCotizacion, type TotalesCotizacion } from '../../dinero/calculo'
import { generarCodigoCotizacion, prefijoCodigoFecha } from '../../data/codigos-cotizacion'
import { clienteCrearSchema } from '../../validacion/cotizador'
import { codigoPg } from '../errores'
import type { DefinicionAsistente } from '../herramientas'

/** Mismo default que la columna proyectos.porcentaje_iva. */
export const PORCENTAJE_IVA = 19
/** Reintentos de la transacción completa si Postgres rechaza un código repetido (23505). */
export const MAX_INTENTOS_CODIGO = 5

export class ErrorCotizacion extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorCotizacion'
  }
}

// ── Entrada ────────────────────────────────────────────────────────

const montoPesos = z.string().regex(/^\d{1,12}(\.0{1,2})?$/, 'debe ser un monto en pesos enteros (sin decimales)')
const cantidad = z
  .string()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, 'cantidad inválida (número con hasta 2 decimales)')
  .refine((v) => Number(v) > 0, 'la cantidad debe ser mayor que cero')

const esquemaItem = z
  .object({
    catalogoId: z.uuid().nullable(),
    nombrePersonalizado: z.string().trim().min(1).max(200).optional(),
    cantidad,
    precioUnitario: montoPesos.optional(),
  })
  .refine((i) => i.catalogoId !== null || (i.nombrePersonalizado ?? '').length > 0, {
    message: 'un ítem sin catálogo necesita nombrePersonalizado',
  })

const esquemaEspacio = z.object({
  nombre: z.string().trim().min(1, 'el nombre del espacio no puede estar vacío').max(120),
  items: z.array(esquemaItem).min(1, 'cada espacio necesita al menos un ítem'),
})

const clienteNuevo = clienteCrearSchema.omit({ id: true })

export const esquemaCotizacionCompleta = z.object({
  cliente: z.union([z.object({ id: z.uuid() }), clienteNuevo]),
  nombreProyecto: z.string().trim().min(1, 'el nombre del proyecto no puede estar vacío').max(200),
  direccionObra: z.string().trim().min(1).max(300).optional(),
  espacios: z.array(esquemaEspacio).min(1, 'la cotización necesita al menos un espacio'),
  descuentoComercial: montoPesos.optional(),
  aplicaIva: z.boolean().optional(),
})

export type EntradaCotizacionCompleta = z.infer<typeof esquemaCotizacionCompleta>
export type ClienteNuevo = z.infer<typeof clienteNuevo>

// ── Puertos ────────────────────────────────────────────────────────

export interface LecturaCotizacion {
  /** Nombre del cliente existente, o null si no existe. */
  clienteNombre(id: string): Promise<string | null>
  /** Producto de catálogo, o null si no existe. */
  productoCatalogo(id: string): Promise<{ precioPublico: string | null; anulado: boolean } | null>
}

export interface FilaProyecto {
  codigo: string
  clienteId: string
  nombreProyecto: string
  direccionObra: string | null
  descuentoComercial: string
  aplicaIva: boolean
  porcentajeIva: string
}

export interface FilaEspacio {
  proyectoId: string
  nombreEspacio: string
  orden: number
}

export interface FilaItem {
  varianteId: string
  catalogoId: string | null
  nombrePersonalizado: string | null
  cantidad: string
  precioUnitario: string
  totalLinea: string
}

/** Operaciones dentro de la transacción. Todas usan la MISMA conexión (tx). */
export interface EscrituraCotizacion extends LecturaCotizacion {
  /** Cotizaciones cuyo código empieza por el prefijo (para la secuencia del día). */
  cotizacionesDelDia(prefijo: string): Promise<number>
  clienteCrear(datos: ClienteNuevo): Promise<string>
  proyectoInsertar(fila: FilaProyecto): Promise<string>
  espacioInsertar(fila: FilaEspacio): Promise<string>
  itemInsertar(fila: FilaItem): Promise<string>
}

/** Ejecuta `fn` dentro de UNA transacción: si `fn` lanza, no queda ninguna escritura. */
export type EjecutorTransaccion = <T>(fn: (tx: EscrituraCotizacion) => Promise<T>) => Promise<T>

// ── Plan (lectura + cálculo, sin escrituras) ───────────────────────

export interface ItemPlan {
  catalogoId: string | null
  nombrePersonalizado: string | null
  cantidad: string
  precioUnitario: string
  totalLinea: number
}

export interface PlanCotizacion {
  cliente: { tipo: 'existente'; id: string; nombre: string } | { tipo: 'nuevo'; datos: ClienteNuevo }
  proyecto: Omit<FilaProyecto, 'codigo' | 'clienteId'>
  espacios: Array<{ nombre: string; items: ItemPlan[] }>
  totales: TotalesCotizacion
  resumen: string
}

function formatoPesos(n: number): string {
  return `$ ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

/**
 * Valida permisos, resuelve precios y calcula totales. Solo LEE (usa `lectura`).
 * Se usa dos veces: al preparar la propuesta (resumen) y, dentro de la transacción, al confirmar
 * (precios vigentes en ese momento).
 */
export async function planificarCotizacion(
  entrada: EntradaCotizacionCompleta,
  usuario: SesionEmpleado,
  lectura: LecturaCotizacion,
): Promise<PlanCotizacion> {
  const permisos: readonly Permiso[] = PERMISOS_POR_ROL[usuario.rol] ?? []
  const tiene = (p: Permiso) => permisos.includes(p)

  if (entrada.descuentoComercial !== undefined && !tiene('cotizador:descuento')) {
    throw new NoAutorizadoError('cotizador:descuento')
  }

  let cliente: PlanCotizacion['cliente']
  if ('id' in entrada.cliente) {
    const nombre = await lectura.clienteNombre(entrada.cliente.id)
    if (nombre === null) throw new ErrorCotizacion('El cliente indicado no existe.')
    cliente = { tipo: 'existente', id: entrada.cliente.id, nombre }
  } else {
    cliente = { tipo: 'nuevo', datos: entrada.cliente }
  }

  let materiales = 0
  const espacios: PlanCotizacion['espacios'] = []
  for (const esp of entrada.espacios) {
    const items: ItemPlan[] = []
    for (const it of esp.items) {
      let precioUnitario: string
      if (it.catalogoId !== null) {
        // El precio enviado por el modelo se IGNORA: manda el del catálogo.
        const producto = await lectura.productoCatalogo(it.catalogoId)
        if (!producto || producto.anulado) throw new ErrorCotizacion(`Producto de catálogo no disponible: ${it.catalogoId}`)
        if (producto.precioPublico === null) throw new ErrorCotizacion(`El producto ${it.catalogoId} no tiene precio público.`)
        precioUnitario = producto.precioPublico
      } else {
        if (!tiene('cotizador:precio_libre')) throw new NoAutorizadoError('cotizador:precio_libre')
        if (it.precioUnitario === undefined) {
          throw new ErrorCotizacion(`El ítem "${it.nombrePersonalizado}" necesita precio unitario.`)
        }
        precioUnitario = it.precioUnitario
      }
      const totalLinea = calcularTotalLinea(it.cantidad, precioUnitario)
      materiales += totalLinea
      items.push({
        catalogoId: it.catalogoId,
        nombrePersonalizado: it.nombrePersonalizado ?? null,
        cantidad: it.cantidad,
        precioUnitario,
        totalLinea,
      })
    }
    espacios.push({ nombre: esp.nombre, items })
  }

  const descuento = entrada.descuentoComercial !== undefined ? aNumero(entrada.descuentoComercial) : 0
  const aplicaIva = entrada.aplicaIva === true
  const totales = calcularTotalesCotizacion({
    materiales,
    manoObra: 0,
    costosOperativos: 0,
    imprevistos: 0,
    descuento,
    ajuste: 0,
    aplicaIva,
    porcentajeIva: PORCENTAJE_IVA,
  })
  if (totales.subtotal < 0) throw new ErrorCotizacion('El descuento supera el total de materiales de la cotización.')

  const etiquetaCliente = cliente.tipo === 'existente' ? cliente.nombre : `${cliente.datos.nombre} (cliente nuevo)`
  const numItems = espacios.reduce((n, e) => n + e.items.length, 0)
  const partes = [
    `Cotización "${entrada.nombreProyecto}" para ${etiquetaCliente}.`,
    `Espacios (${espacios.length}): ${espacios.map((e) => e.nombre).join(', ')}.`,
    `Ítems: ${numItems}.`,
    aplicaIva
      ? `Subtotal ${formatoPesos(totales.subtotal)}, IVA ${PORCENTAJE_IVA}% ${formatoPesos(totales.iva)}.`
      : `Subtotal ${formatoPesos(totales.subtotal)} (sin IVA).`,
    descuento > 0 ? `Descuento comercial ${formatoPesos(descuento)}.` : '',
    `Total ${formatoPesos(totales.total)}.`,
  ].filter((p) => p !== '')

  return {
    cliente,
    proyecto: {
      nombreProyecto: entrada.nombreProyecto,
      direccionObra: entrada.direccionObra ?? null,
      descuentoComercial: String(descuento),
      aplicaIva,
      porcentajeIva: String(PORCENTAJE_IVA),
    },
    espacios,
    totales,
    resumen: partes.join(' '),
  }
}

// ── Escritura (dentro de la transacción) ───────────────────────────

export interface ResultadoCotizacionCreada {
  proyectoId: string
  codigo: string
  clienteId: string
  espacioIds: string[]
  totalItems: number
  totales: TotalesCotizacion
}

/** Escribe un plan ya calculado. Debe llamarse con el `tx` de la misma transacción. */
export async function persistirCotizacion(plan: PlanCotizacion, tx: EscrituraCotizacion, ahora: Date): Promise<ResultadoCotizacionCreada> {
  const clienteId = plan.cliente.tipo === 'nuevo' ? await tx.clienteCrear(plan.cliente.datos) : plan.cliente.id
  const existentes = await tx.cotizacionesDelDia(prefijoCodigoFecha(ahora))
  const codigo = generarCodigoCotizacion(ahora, existentes + 1)
  const proyectoId = await tx.proyectoInsertar({ codigo, clienteId, ...plan.proyecto })

  const espacioIds: string[] = []
  let totalItems = 0
  for (const [orden, esp] of plan.espacios.entries()) {
    const espacioId = await tx.espacioInsertar({ proyectoId, nombreEspacio: esp.nombre, orden })
    espacioIds.push(espacioId)
    for (const it of esp.items) {
      await tx.itemInsertar({
        varianteId: espacioId,
        catalogoId: it.catalogoId,
        nombrePersonalizado: it.nombrePersonalizado,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        totalLinea: String(it.totalLinea),
      })
      totalItems++
    }
  }
  return { proyectoId, codigo, clienteId, espacioIds, totalItems, totales: plan.totales }
}

export interface DepsCotizacion {
  lectura: LecturaCotizacion
  transaccion: EjecutorTransaccion
  ahora: () => Date
}

/**
 * Crea la cotización completa en UNA transacción. Si algo lanza, la transacción revierte todo.
 * Solo reintenta toda la transacción ante un código repetido (23505): dentro de una transacción de
 * Postgres un error deja la transacción abortada, así que no se puede reintentar el INSERT suelto.
 */
export async function crearCotizacionCompleta(
  entrada: EntradaCotizacionCompleta,
  usuario: SesionEmpleado,
  deps: DepsCotizacion,
): Promise<ResultadoCotizacionCreada> {
  for (let intento = 1; ; intento++) {
    try {
      return await deps.transaccion(async (tx) => {
        const plan = await planificarCotizacion(entrada, usuario, tx)
        return persistirCotizacion(plan, tx, deps.ahora())
      })
    } catch (err) {
      if (codigoPg(err) === '23505' && intento < MAX_INTENTOS_CODIGO) continue
      throw err
    }
  }
}

/** Definición de la operación para el registro. Escritura: el bucle solo crea propuestas con ella. */
export function operacionCotizacionCrearCompleta(deps: DepsCotizacion): DefinicionAsistente {
  return {
    nombre: 'cotizacion.crear_completa',
    dominio: 'cotizacion',
    operacion: 'crear_completa',
    descripcion:
      'Crea una cotización completa: cliente (existente por id, o nuevo con nombre), proyecto, espacios y ítems. ' +
      'Requiere confirmación del empleado. No envíes totales: los calcula el sistema. Los precios de catálogo los pone el sistema.',
    permiso: 'cotizador:escribir',
    esEscritura: true,
    esquema: esquemaCotizacionCompleta,
    resumir: async (entrada, usuario) => (await planificarCotizacion(entrada, usuario, deps.lectura)).resumen,
    ejecutar: async (entrada, usuario) => crearCotizacionCompleta(entrada, usuario, deps),
  }
}
