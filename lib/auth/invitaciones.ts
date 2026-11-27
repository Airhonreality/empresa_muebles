// lib/auth/invitaciones.ts
// Regla de negocio de las invitaciones de empleado, pura y testeable (sin cookies ni DB).
// La usa crearInvitacionEmpleadoAction (lib/auth/actions.ts) DESPUÉS de que protegerAccion
// ya comprobó el permiso equipo:escribir. Aquí solo va la restricción propia del rol destino.
import { NoAutorizadoError } from './errors'
import type { RolCanonico } from '@/lib/data/contracts'

/** Solo un admin puede invitar a otro admin. Cualquier otro rol lanza NoAutorizadoError. */
export function exigirPuedeAsignarRol(rolSesion: RolCanonico, rolDestino: RolCanonico): void {
  if (rolDestino === 'admin' && rolSesion !== 'admin') {
    throw new NoAutorizadoError('equipo:escribir (asignar rol admin)')
  }
}
