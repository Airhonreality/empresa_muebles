// lib/asistente/ops/clientes.ts
// Operaciones de clientes del asistente (t-200 paso 3: búsqueda; el alta llega en el paso 4).
import { z } from 'zod'
import type { DefinicionAsistente } from '../herramientas'
import { ErrorDuplicado } from '../errores'
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

/** Alta de cliente. Sin precio ni identidad: el documento, si viene, no puede repetirse. */
export const esquemaClienteCrear = z.object({
  nombre: z.string().trim().min(1, 'El nombre del cliente no puede estar vacío').max(120),
  documento: z.string().trim().min(1).max(30).optional(),
  telefono: z.string().trim().min(1).max(40).optional(),
  email: z.email('El correo no es válido').max(120).optional(),
  domicilio: z.string().trim().min(1).max(200).optional(),
})

/** Si el documento ya existe, lanza ErrorDuplicado con el id existente y lo registra como conocido en el turno. */
async function exigirDocumentoLibre(puerto: PuertoClientes, documento: string | undefined, procedencia: { registrar(t: 'cliente', ids: string[]): void }) {
  if (!documento) return
  const existente = await puerto.porDocumento(documento)
  if (!existente) return
  procedencia.registrar('cliente', [existente.id])
  throw new ErrorDuplicado(
    `Ya existe un cliente con ese documento (id ${existente.id}). Úsalo en la cotización en lugar de crear otro.`,
    existente.id,
  )
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
    {
      nombre: 'clientes.crear',
      dominio: 'clientes',
      operacion: 'crear',
      descripcion:
        'Crea un cliente nuevo (nombre y, si hay, documento, teléfono, correo y domicilio). Requiere confirmación. ' +
        'Antes de crear, busca con clientes.buscar: si el cliente ya existe, úsalo.',
      permiso: 'clientes:escribir',
      canales: ['chat'],
      esEscritura: true,
      esquema: esquemaClienteCrear,
      preparar: async (entrada, _usuario, ctx) => {
        await exigirDocumentoLibre(puerto, entrada.documento, ctx.procedencia)
        const doc = entrada.documento ? ` (documento ${entrada.documento})` : ''
        return { resumen: `Crear cliente "${entrada.nombre}"${doc}.`, datos: { entrada } }
      },
      confirmar: async (datos) => {
        const entrada = esquemaClienteCrear.parse((datos as { entrada: unknown }).entrada)
        await exigirDocumentoLibre(puerto, entrada.documento, { registrar: () => {} })
        const id = await puerto.crear(entrada)
        return { clienteId: id }
      },
    },
  ]
}
