// lib/asistente/operaciones/cotizacion-completa.ts
// Operación cotizacion.crear_completa (t-200 paso 4). Crea proyecto, espacios e ítems en UNA transacción.
// Este módulo es puro: toda lectura y escritura entra por puertos (LecturaCotizacion / EscrituraCotizacion).
// La implementación Drizzle está en cotizacion-produccion.ts.
//
// Reglas que impone el SERVIDOR, no el modelo:
// - Cliente: existente, con id obtenido de clientes.buscar en el turno. No hay cliente nuevo aquí (S-6).
// - Productos: id obtenido de catalogo.productos_buscar en el turno. El precio sale del catálogo al
//   confirmar; cualquier precio que envíe el modelo se descarta (el esquema no lo conoce).
// - Código COT-AAAA-MM-DD-NN generado aquí (cuenta las del día dentro de la transacción).
// - Totales: calcularTotalesCotizacion. Mano de obra, costos e imprevistos = 0 (ver nota en el informe de t-200).
// - Revalidación: si el total recalculado al confirmar no coincide con el del resumen, no se escribe y se
//   lanza ErrorRevalidacion con el total nuevo.
import { z } from 'zod'
import { calcularTotalLinea, calcularTotalesCotizacion, type TotalesCotizacion } from '../../dinero/calculo'
import { generarCodigoCotizacion, prefijoCodigoFecha } from '../../data/codigos-cotizacion'
import { TIPOS_ESPACIO } from '../../catalogos/tipos-espacio'
import { codigoPg, ErrorRevalidacion } from '../errores'
import type { DefinicionEscritura } from '../herramientas'
import { ETIQUETA_SUBTOTAL_MATERIALES } from '../etiquetas'

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

/** Cantidad positiva con hasta 2 decimales, como texto (lo que guarda la base). */
const cantidad = z
  .string()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, 'cantidad inválida (número con hasta 2 decimales)')
  .refine((v) => Number(v) > 0, 'la cantidad debe ser mayor que cero')

const esquemaItem = z.object({
  productoId: z.uuid('productoId debe ser un identificador válido'),
  cantidad,
})

const esquemaEspacio = z.object({
  tipoEspacio: z.enum(TIPOS_ESPACIO.map((t) => t.codigo) as [string, ...string[]], { error: 'tipoEspacio no es un tipo de espacio válido' }),
  nombre: z.string().trim().min(1, 'el nombre del espacio no puede estar vacío').max(80),
  items: z.array(esquemaItem).min(1, 'cada espacio necesita al menos un ítem').max(60),
})

/**
 * Entrada del modelo. z.object sin `strict`: un campo de precio que envíe el modelo se DESCARTA
 * (no llega a la base). No hay descuento ni precio libre.
 */
export const esquemaCotizacionCompleta = z.object({
  clienteId: z.uuid('clienteId debe ser un identificador válido'),
  nombreProyecto: z.string().trim().min(1, 'el nombre del proyecto no puede estar vacío').max(120),
  direccionObra: z.string().trim().min(1).max(300).optional(),
  espacios: z.array(esquemaEspacio).min(1, 'la cotización necesita al menos un espacio').max(20),
  aplicaIva: z.boolean().optional(),
})

export type EntradaCotizacionCompleta = z.infer<typeof esquemaCotizacionCompleta>

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
  tipoEspacio: string
  orden: number
}

export interface FilaItem {
  varianteId: string
  catalogoId: string
  cantidad: string
  precioUnitario: string
  totalLinea: string
}

/** Operaciones dentro de la transacción. Todas usan la MISMA conexión (tx). */
export interface EscrituraCotizacion extends LecturaCotizacion {
  /** Cotizaciones cuyo código empieza por el prefijo (para la secuencia del día). */
  cotizacionesDelDia(prefijo: string): Promise<number>
  proyectoInsertar(fila: FilaProyecto): Promise<string>
  espacioInsertar(fila: FilaEspacio): Promise<string>
  itemInsertar(fila: FilaItem): Promise<string>
}

/** Ejecuta `fn` dentro de UNA transacción: si `fn` lanza, no queda ninguna escritura. */
export type EjecutorTransaccion = <T>(fn: (tx: EscrituraCotizacion) => Promise<T>) => Promise<T>

// ── Plan (lectura + cálculo, sin escrituras) ───────────────────────

export interface ItemPlan {
  catalogoId: string
  cantidad: string
  precioUnitario: string
  totalLinea: number
}

export interface PlanCotizacion {
  cliente: { id: string; nombre: string }
  proyecto: Omit<FilaProyecto, 'codigo' | 'clienteId'>
  espacios: Array<{ tipoEspacio: string; nombre: string; items: ItemPlan[] }>
  totales: TotalesCotizacion
  resumen: string
}

export function formatoPesos(n: number): string {
  return `$ ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

/**
 * Valida el cliente y los productos, resuelve precios y calcula totales. Solo LEE (usa `lectura`).
 * Se usa al preparar (resumen) y, dentro de la transacción, al confirmar (precios vigentes).
 */
export async function planificarCotizacion(entrada: EntradaCotizacionCompleta, lectura: LecturaCotizacion): Promise<PlanCotizacion> {
  const nombreCliente = await lectura.clienteNombre(entrada.clienteId)
  if (nombreCliente === null) throw new ErrorCotizacion('El cliente indicado no existe.')
  const cliente = { id: entrada.clienteId, nombre: nombreCliente }

  let materiales = 0
  const espacios: PlanCotizacion['espacios'] = []
  for (const esp of entrada.espacios) {
    const items: ItemPlan[] = []
    for (const it of esp.items) {
      // El precio manda el catálogo. No hay otra fuente de precio en este módulo.
      const producto = await lectura.productoCatalogo(it.productoId)
      if (!producto || producto.anulado) throw new ErrorCotizacion(`Producto de catálogo no disponible: ${it.productoId}`)
      if (producto.precioPublico === null) throw new ErrorCotizacion(`El producto ${it.productoId} no tiene precio público.`)
      const precioUnitario = producto.precioPublico
      const totalLinea = calcularTotalLinea(it.cantidad, precioUnitario)
      materiales += totalLinea
      items.push({ catalogoId: it.productoId, cantidad: it.cantidad, precioUnitario, totalLinea })
    }
    espacios.push({ tipoEspacio: esp.tipoEspacio, nombre: esp.nombre, items })
  }

  const aplicaIva = entrada.aplicaIva === true
  const totales = calcularTotalesCotizacion({
    materiales,
    manoObra: 0,
    costosOperativos: 0,
    imprevistos: 0,
    descuento: 0,
    ajuste: 0,
    aplicaIva,
    porcentajeIva: PORCENTAJE_IVA,
  })

  const numItems = espacios.reduce((n, e) => n + e.items.length, 0)
  const partes = [
    `Cotización "${entrada.nombreProyecto}" para ${cliente.nombre}.`,
    `Espacios (${espacios.length}): ${espacios.map((e) => e.nombre).join(', ')}.`,
    `Ítems: ${numItems}.`,
    aplicaIva
      ? `${ETIQUETA_SUBTOTAL_MATERIALES} ${formatoPesos(totales.subtotal)}, IVA ${PORCENTAJE_IVA}% ${formatoPesos(totales.iva)}, valor con IVA ${formatoPesos(totales.total)}.`
      : `${ETIQUETA_SUBTOTAL_MATERIALES} ${formatoPesos(totales.subtotal)} (sin IVA).`,
    'No incluye mano de obra: el total final lo calcula el cotizador.',
  ]

  return {
    cliente,
    proyecto: {
      nombreProyecto: entrada.nombreProyecto,
      direccionObra: entrada.direccionObra ?? null,
      descuentoComercial: '0',
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
  const existentes = await tx.cotizacionesDelDia(prefijoCodigoFecha(ahora))
  const codigo = generarCodigoCotizacion(ahora, existentes + 1)
  const proyectoId = await tx.proyectoInsertar({ codigo, clienteId: plan.cliente.id, ...plan.proyecto })

  const espacioIds: string[] = []
  let totalItems = 0
  for (const [orden, esp] of plan.espacios.entries()) {
    const espacioId = await tx.espacioInsertar({ proyectoId, nombreEspacio: esp.nombre, tipoEspacio: esp.tipoEspacio, orden })
    espacioIds.push(espacioId)
    for (const it of esp.items) {
      await tx.itemInsertar({
        varianteId: espacioId,
        catalogoId: it.catalogoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        totalLinea: String(it.totalLinea),
      })
      totalItems++
    }
  }
  return { proyectoId, codigo, clienteId: plan.cliente.id, espacioIds, totalItems, totales: plan.totales }
}

export interface DepsCotizacion {
  lectura: LecturaCotizacion
  transaccion: EjecutorTransaccion
  ahora: () => Date
}

/**
 * Crea la cotización completa en UNA transacción. Si algo lanza, la transacción revierte todo.
 * Si `totalEsperado` no coincide con el recalculado, lanza ErrorRevalidacion ANTES de escribir.
 * Reintenta toda la transacción solo ante un código repetido (23505).
 */
export async function crearCotizacionCompleta(
  entrada: EntradaCotizacionCompleta,
  deps: DepsCotizacion,
  totalEsperado?: number,
): Promise<ResultadoCotizacionCreada> {
  for (let intento = 1; ; intento++) {
    try {
      return await deps.transaccion(async (tx) => {
        const plan = await planificarCotizacion(entrada, tx)
        if (totalEsperado !== undefined && plan.totales.total !== totalEsperado) {
          throw new ErrorRevalidacion(
            `El total de la cotización cambió de ${formatoPesos(totalEsperado)} a ${formatoPesos(plan.totales.total)}. Revisa la propuesta y vuelve a confirmar.`,
            { entrada, totalEsperado: plan.totales.total },
            plan.resumen,
          )
        }
        return persistirCotizacion(plan, tx, deps.ahora())
      })
    } catch (err) {
      if (codigoPg(err) === '23505' && intento < MAX_INTENTOS_CODIGO) continue
      throw err
    }
  }
}

/**
 * Definición de la operación para el registro. Escritura en dos fases: preparar valida y calcula
 * (resumen); confirmar revalida y escribe.
 */
export function operacionCotizacionCrearCompleta(deps: DepsCotizacion): DefinicionEscritura<typeof esquemaCotizacionCompleta> {
  return {
    nombre: 'cotizacion.crear_completa',
    dominio: 'cotizacion',
    operacion: 'crear_completa',
    descripcion:
      'Crea una cotización para un cliente existente (clienteId de clientes.buscar) con espacios e ítems de catálogo (productoId de catalogo.productos_buscar). ' +
      'Requiere confirmación del empleado. No envíes precios ni totales: los pone el sistema.',
    permiso: 'cotizador:escribir',
    canales: ['chat'],
    esEscritura: true,
    esquema: esquemaCotizacionCompleta,
    preparar: async (entrada, _usuario, ctx) => {
      ctx.procedencia.exigir('cliente', entrada.clienteId, 'cliente')
      for (const esp of entrada.espacios) {
        for (const it of esp.items) ctx.procedencia.exigir('producto', it.productoId, 'producto')
      }
      const plan = await planificarCotizacion(entrada, deps.lectura)
      return { resumen: plan.resumen, datos: { entrada, totalEsperado: plan.totales.total } }
    },
    confirmar: async (datos) => {
      const { entrada, totalEsperado } = datos as { entrada: unknown; totalEsperado: number }
      return crearCotizacionCompleta(esquemaCotizacionCompleta.parse(entrada), deps, totalEsperado)
    },
  }
}
