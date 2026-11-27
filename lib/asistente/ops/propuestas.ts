// lib/asistente/ops/propuestas.ts
// Operaciones sobre propuestas (t-200 paso 5). Son el único camino de escritura por MCP (paso 8):
// `propuestas.confirmar` y `propuestas.cancelar` tienen canal solo `mcp`, así que el chat interno
// NUNCA las ofrece al modelo (en el chat, confirmar y cancelar son botones de la UI).
// `propuestas.listar` sí está en el chat: solo lee las propuestas del propio usuario.
import { z } from 'zod'
import type { DefinicionAsistente, DefinicionLectura } from '../herramientas'
import { cancelarPropuesta, confirmarPropuesta, type DepsPropuestas, type EstadoPropuesta, type RepositorioPropuestas } from '../propuestas'

/** Estados que expone la operación (plan t-200 §3.6). `vencida` existe en el código pero no se lista. */
export const ESTADOS_LISTABLES = ['pendiente', 'ejecutada', 'cancelada', 'fallida'] as const
const LIMITE_LISTA = 20

export interface DepsOperacionesPropuestas {
  repo: RepositorioPropuestas
  ahora: () => Date
  /** El registro completo: `confirmarPropuesta` necesita sus definiciones de escritura. */
  registro: () => readonly DefinicionAsistente[]
}

export function operacionesPropuestas(deps: DepsOperacionesPropuestas): DefinicionAsistente[] {
  const depsPropuestas = (): DepsPropuestas => ({ repo: deps.repo, ahora: deps.ahora, registro: deps.registro() })
  const esquemaId = z.strictObject({ id: z.uuid('id debe ser un identificador válido') })

  const listar: DefinicionLectura<z.ZodObject<{ estado: z.ZodOptional<z.ZodEnum<{ pendiente: 'pendiente'; ejecutada: 'ejecutada'; cancelada: 'cancelada'; fallida: 'fallida' }>> }>> = {
    nombre: 'propuestas.listar',
    dominio: 'propuestas',
    operacion: 'listar',
    descripcion: 'Lista tus propuestas por estado (por defecto, las pendientes de confirmar). Solo muestra las tuyas.',
    permiso: 'erp:acceso',
    canales: ['chat', 'mcp'],
    esEscritura: false,
    esquema: z.strictObject({ estado: z.enum(ESTADOS_LISTABLES).optional() }),
    ejecutar: async ({ estado }, usuario) => {
      const filtro: EstadoPropuesta = (estado ?? 'pendiente') as EstadoPropuesta
      const filas = await deps.repo.listarDeUsuario(usuario.usuarioId, [filtro], LIMITE_LISTA)
      return {
        resultados: filas.map((p) => ({ id: p.id, herramienta: p.herramienta, resumen: p.resumen, estado: p.estado, venceEn: p.venceEn.toISOString() })),
      }
    },
  }

  const confirmar: DefinicionLectura<typeof esquemaId> = {
    nombre: 'propuestas.confirmar',
    dominio: 'propuestas',
    operacion: 'confirmar',
    descripcion: 'Confirma una propuesta tuya y ejecuta la escritura (revalida antes). Idempotente: confirmar dos veces no escribe dos veces.',
    permiso: 'erp:acceso',
    canales: ['mcp'],
    esEscritura: false,
    esquema: esquemaId,
    ejecutar: async ({ id }, usuario) => confirmarPropuesta(id, usuario, depsPropuestas()),
  }

  const cancelar: DefinicionLectura<typeof esquemaId> = {
    nombre: 'propuestas.cancelar',
    dominio: 'propuestas',
    operacion: 'cancelar',
    descripcion: 'Cancela una propuesta tuya pendiente. Idempotente.',
    permiso: 'erp:acceso',
    canales: ['mcp'],
    esEscritura: false,
    esquema: esquemaId,
    ejecutar: async ({ id }, usuario) => cancelarPropuesta(id, usuario, depsPropuestas()),
  }

  return [listar, confirmar, cancelar] as DefinicionAsistente[]
}
