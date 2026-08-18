// Registro de auditoría para mutaciones de Equipo (F10 2026-08-17, item 6 del
// lote "mejoras Equipo"). `audit_logs` ya existía en el schema pero nunca se
// escribía — este helper es el primer punto real de escritura. Solo aplica en
// DATA_IMPL=drizzle: en mock no hay tabla real detrás, y no vale la pena
// mantener un log en memoria que se pierde al recargar.
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from './session'

export async function registrarAuditLog(input: {
  accion: string
  entidadTipo: string
  entidadId?: string | null
  cambios?: Record<string, unknown>
}): Promise<void> {
  if ((process.env.DATA_IMPL ?? 'mock') !== 'drizzle') return
  try {
    const sesion = await requireSesionEmpleado()
    await db.insert(s.auditLogs).values({
      actorId: sesion?.usuarioId ?? null,
      actorRol: sesion?.rol ?? null,
      accion: input.accion,
      entidadTipo: input.entidadTipo,
      entidadId: input.entidadId ?? null,
      cambiosJson: input.cambios ?? null,
    })
  } catch (err) {
    // Nunca debe tumbar la mutación real por un fallo de logging.
    console.error(`[registrarAuditLog] error de sistema (${input.accion}):`, err)
  }
}
