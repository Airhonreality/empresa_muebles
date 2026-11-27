// lib/asistente/ops/catalogo.ts
// Operaciones de catálogo del asistente (t-200 paso 3): tipos de espacio (enum cerrado) y productos.
import { z } from 'zod'
import { TIPOS_ESPACIO } from '../../catalogos/tipos-espacio'
import type { DefinicionAsistente } from '../herramientas'
import { buscarEnLista } from './busqueda'
import { esquemaLimite, limiteDe } from './limites'

export interface FilaProducto {
  id: string
  descripcion: string
  sku: string
  categoria: string | null
  precioPublico: string
  unidad: string | null
}

/** Puerto de catálogo. La implementación Drizzle está en operaciones/catalogo-produccion.ts. */
export interface PuertoCatalogo {
  productosVigentes(): Promise<FilaProducto[]>
}

/** Valores válidos de tipo de espacio: exactamente los códigos de lib/catalogos/tipos-espacio.ts. */
export const CODIGOS_TIPO_ESPACIO = TIPOS_ESPACIO.map((t) => t.codigo) as [string, ...string[]]

export function operacionesCatalogo(puerto: PuertoCatalogo): DefinicionAsistente[] {
  return [
    {
      nombre: 'catalogo.espacios',
      dominio: 'catalogo',
      operacion: 'espacios',
      descripcion: 'Lista los tipos de espacio válidos (valor y nombre). Usa el valor en tipoEspacio al crear una cotización.',
      permiso: 'catalogo:leer',
      canales: ['chat', 'mcp'],
      esEscritura: false,
      esquema: z.strictObject({}),
      ejecutar: async () => ({
        espacios: TIPOS_ESPACIO.map((t) => ({ valor: t.codigo, etiqueta: t.label })),
      }),
    },
    {
      nombre: 'catalogo.productos_buscar',
      dominio: 'catalogo',
      operacion: 'productos_buscar',
      descripcion:
        'Busca productos del catálogo por nombre, referencia o categoría. Devuelve id, nombre, categoría, precio público y unidad. Usa el id como productoId; el precio lo pone el sistema.',
      permiso: 'catalogo:leer',
      canales: ['chat', 'mcp'],
      esEscritura: false,
      esquema: z.strictObject({
        texto: z.string().trim().min(1, 'Escribe el nombre del producto').max(80),
        limite: esquemaLimite.optional(),
      }),
      ejecutar: async ({ texto, limite }, _usuario, ctx) => {
        const productos = await puerto.productosVigentes()
        const { total, resultados } = buscarEnLista(
          productos,
          texto,
          (p) => [p.descripcion, p.sku, p.categoria ?? ''],
          limiteDe(limite),
        )
        ctx.procedencia.registrar('producto', resultados.map((p) => p.id))
        return {
          total,
          resultados: resultados.map((p) => ({
            id: p.id,
            etiqueta: p.descripcion,
            categoria: p.categoria,
            precioPublico: p.precioPublico,
            unidad: p.unidad,
          })),
        }
      },
    },
  ]
}
