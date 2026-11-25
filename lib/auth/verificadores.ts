// lib/auth/verificadores.ts
// Quién puede ser el verificador único de un proyecto (verificadorId -> personas.id).
// Regla (D3 / I-035, arnes/nucleo/logica_de_negocio.md): el verificador único es el COMERCIAL
// vendedor del proyecto. Si el Supervisor cambia la regla, se cambia ROLES_VERIFICADORES aquí.
// Sin verificador válido, las acciones que guardan verificadorId deben fallar (fail closed).
import type { RolCanonico } from '@/lib/data/contracts'

export const ROLES_VERIFICADORES: readonly RolCanonico[] = ['comercial']

/** Forma mínima de un usuario empleado para decidir si su persona puede verificar. */
export interface EmpleadoVerificable {
  personaId: string | null
  activo: boolean
  rol: RolCanonico | null
}

/** Pura: true si alguna cuenta de empleado activa, con rol de verificador, pertenece a esa persona. */
export function esVerificadorValido(empleados: readonly EmpleadoVerificable[], verificadorId: string): boolean {
  return empleados.some(
    (e) => e.personaId === verificadorId && e.activo && e.rol !== null && ROLES_VERIFICADORES.includes(e.rol),
  )
}

/**
 * Lanza si verificadorId no corresponde a un empleado activo con rol de verificador.
 * Consulta `usuarios` en DATA_IMPL=drizzle. En mock no hay empleados con persona asociada, así que
 * falla cerrado: la regla no se puede comprobar sin base de datos.
 */
export async function exigirVerificadorValido(verificadorId: string): Promise<void> {
  if ((process.env.DATA_IMPL ?? 'mock') !== 'drizzle') {
    throw new Error(`verificadorId ${verificadorId}: no se puede validar sin base de datos (DATA_IMPL=mock)`)
  }
  const { db } = await import('@/lib/db/client')
  const s = await import('@/lib/db/schema')
  const { and, eq, inArray } = await import('drizzle-orm')
  const filas = await db
    .select({ personaId: s.usuarios.personaId, activo: s.usuarios.activo, rol: s.usuarios.rolEmpleado })
    .from(s.usuarios)
    .where(and(
      eq(s.usuarios.personaId, verificadorId),
      eq(s.usuarios.tipo, 'empleado'),
      eq(s.usuarios.activo, true),
      inArray(s.usuarios.rolEmpleado, [...ROLES_VERIFICADORES]),
    ))
    .limit(1)
  if (!esVerificadorValido(filas as EmpleadoVerificable[], verificadorId)) {
    throw new Error(`verificadorId ${verificadorId} no es un empleado activo con rol de verificador`)
  }
}
