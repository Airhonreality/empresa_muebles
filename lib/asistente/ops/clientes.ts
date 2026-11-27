// lib/asistente/ops/clientes.ts
// Operaciones de clientes del asistente (t-200 paso 3: búsqueda; el alta llega en el paso 4).
import { z } from 'zod'
import type { DefinicionAsistente } from '../herramientas'
import { buscarEnLista } from './busqueda'
import { esquemaLimite, limiteDe } from './limites'

export interface FilaCliente {
  id: string
  nombre: string
  documento: string | null
  telefono: string | null
}

/** Datos de un cliente nuevo (paso 4). */
export interface DatosClienteNuevo {
  nombre: string
  documento?: string
  telefono?: string
  email?: string
  domicilio?: string
}

/** Puerto de clientes. La implementación Drizzle está en operaciones/clientes-produccion.ts. */
export interface PuertoClientes {
  listar(): Promise<FilaCliente[]>
  porDocumento(documento: string): Promise<{ id: string } | null>
  crear(datos: DatosClienteNuevo): Promise<string>
}

export function operacionesClientes(puerto: PuertoClientes): DefinicionAsistente[] {
  const esquemaBuscar = z.strictObject({
    texto: z.string().trim().min(1, 'Escribe el nombre o el documento del cliente').max(80),
    limite: esquemaLimite.optional(),
  })

  return [
    {
      nombre: 'clientes.buscar',
      dominio: 'clientes',
      operacion: 'buscar',
      descripcion:
        'Busca clientes por nombre o documento. Devuelve id y etiqueta. Usa el id en cotizacion.crear_completa; no lo inventes.',
      permiso: 'clientes:leer',
      canales: ['chat'],
      esEscritura: false,
      esquema: esquemaBuscar,
      ejecutar: async ({ texto, limite }, _usuario, ctx) => {
        const clientes = await puerto.listar()
        const { total, resultados } = buscarEnLista(clientes, texto, (c) => [c.nombre, c.documento ?? ''], limiteDe(limite))
        ctx.procedencia.registrar('cliente', resultados.map((c) => c.id))
        return {
          total,
          resultados: resultados.map((c) => ({
            id: c.id,
            etiqueta: c.documento ? `${c.nombre} (${c.documento})` : c.nombre,
            documento: c.documento,
            telefono: c.telefono,
          })),
        }
      },
    },
  ]
}
