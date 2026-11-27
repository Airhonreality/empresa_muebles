// lib/asistente/ops/cotizacion.ts
// Operaciones de cotización del asistente, solo lectura (t-200 paso 3). La escritura
// (cotizacion.crear_completa) vive en operaciones/cotizacion-completa.ts.
//
// Importante: los montos que devuelven aquí son el SUBTOTAL DE MATERIALES (suma de ítems activos y no
// referenciales). No incluyen mano de obra (jornadas × tarifas), costos ni imprevistos, que el cotizador
// calcula con los parámetros del panel de finanzas. Por eso no se devuelve un "total" de cotización.
import { z } from 'zod'
import type { DefinicionAsistente } from '../herramientas'
import { buscarEnLista } from './busqueda'
import { esquemaLimite, limiteDe } from './limites'

/** Estados de proyectos.estado (enum estado_proyecto en lib/db/schema.ts). Verificado por ops/cotizacion.test.ts. */
export const ESTADOS_PROYECTO = [
  'borrador', 'en_revision', 'cotizado', 'negociacion', 'en_contrato',
  'desarrollo', 'aprobado_compras', 'armado', 'verificado', 'en_instalacion', 'instalado',
  'entregado', 'perdida', 'cancelada',
  'activa', 'enviada', 'pre_produccion', 'produccion', 'retoma',
] as const

export interface FilaProyectoBusqueda {
  id: string
  codigo: string
  nombreProyecto: string
  estado: string
  clienteId: string | null
  clienteNombre: string | null
  creadoEn: string
}

export interface DetalleProyecto {
  id: string
  codigo: string
  nombreProyecto: string
  estado: string
  direccionObra: string | null
  aplicaIva: boolean | null
  porcentajeIva: string | null
  cliente: { id: string; nombre: string } | null
  espacios: Array<{
    id: string
    nombre: string
    tipoEspacio: string | null
    items: Array<{
      productoId: string | null
      nombre: string | null
      cantidad: string
      precioUnitario: string
      totalLinea: string | null
    }>
  }>
}

/** Puerto de lectura de cotizaciones. Implementación Drizzle: operaciones/cotizaciones-produccion.ts. */
export interface PuertoCotizaciones {
  proyectos(): Promise<FilaProyectoBusqueda[]>
  /** Subtotal de materiales por proyecto (ítems activos y no referenciales, espacios activos). */
  materialesPorProyecto(): Promise<Map<string, number>>
  detalle(proyectoId: string): Promise<DetalleProyecto | null>
}

const NOTA_MATERIALES =
  'Montos = subtotal de materiales (sin mano de obra, costos ni imprevistos). El total del cotizador puede ser mayor.'

export function operacionesCotizacion(puerto: PuertoCotizaciones): DefinicionAsistente[] {
  const esquemaBuscar = z.strictObject({
    texto: z.string().trim().min(1, 'Escribe el código, el nombre del proyecto o del cliente').max(80).optional(),
    estado: z.enum(ESTADOS_PROYECTO).optional(),
    limite: esquemaLimite.optional(),
  })

  return [
    {
      nombre: 'cotizacion.buscar',
      dominio: 'cotizacion',
      operacion: 'buscar',
      descripcion:
        'Busca cotizaciones por código (COT-…), nombre del proyecto o cliente, y opcionalmente por estado. Devuelve id, código, cliente y subtotal de materiales.',
      permiso: 'proyectos:leer',
      canales: ['chat'],
      esEscritura: false,
      esquema: esquemaBuscar,
      ejecutar: async ({ texto, estado, limite }, _usuario, ctx) => {
        const [proyectos, materiales] = await Promise.all([puerto.proyectos(), puerto.materialesPorProyecto()])
        const filtrados = estado ? proyectos.filter((p) => p.estado === estado) : proyectos
        // Sin texto, las más recientes primero.
        const ordenados = texto ? filtrados : [...filtrados].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
        const { total, resultados } = buscarEnLista(
          ordenados,
          texto,
          (p) => [p.codigo, p.nombreProyecto, p.clienteNombre ?? ''],
          limiteDe(limite),
        )
        ctx.procedencia.registrar('cotizacion', resultados.map((p) => p.id))
        return {
          total,
          nota: NOTA_MATERIALES,
          resultados: resultados.map((p) => ({
            id: p.id,
            codigo: p.codigo,
            nombreProyecto: p.nombreProyecto,
            cliente: p.clienteNombre,
            estado: p.estado,
            subtotalMateriales: String(materiales.get(p.id) ?? 0),
          })),
        }
      },
    },
    {
      nombre: 'cotizacion.consultar',
      dominio: 'cotizacion',
      operacion: 'consultar',
      descripcion:
        'Consulta una cotización por su id (obtenido con cotizacion.buscar): cliente, espacios activos con sus ítems (productoId de catálogo) y subtotal de materiales.',
      permiso: 'proyectos:leer',
      canales: ['chat'],
      esEscritura: false,
      esquema: z.strictObject({ id: z.uuid('id debe ser un identificador válido') }),
      ejecutar: async ({ id }, _usuario, ctx) => {
        const detalle = await puerto.detalle(id)
        if (!detalle) return { encontrado: false }
        ctx.procedencia.registrar('cotizacion', [detalle.id])
        if (detalle.cliente) ctx.procedencia.registrar('cliente', [detalle.cliente.id])
        const productoIds = detalle.espacios.flatMap((e) => e.items.map((i) => i.productoId)).filter((x): x is string => x !== null)
        ctx.procedencia.registrar('producto', productoIds)
        const subtotal = detalle.espacios.reduce(
          (suma, e) => suma + e.items.reduce((s2, i) => s2 + Number(i.totalLinea ?? 0), 0),
          0,
        )
        return {
          encontrado: true,
          nota: NOTA_MATERIALES,
          proyecto: {
            id: detalle.id,
            codigo: detalle.codigo,
            nombreProyecto: detalle.nombreProyecto,
            estado: detalle.estado,
            direccionObra: detalle.direccionObra,
            aplicaIva: detalle.aplicaIva,
            porcentajeIva: detalle.porcentajeIva,
            cliente: detalle.cliente,
          },
          espacios: detalle.espacios,
          subtotalMateriales: String(subtotal),
        }
      },
    },
  ]
}
