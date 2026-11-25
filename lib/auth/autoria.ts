// lib/auth/autoria.ts
// Quién queda como autor de una decisión registrada en el ERP. Siempre sale de la sesión, nunca del
// input del cliente. Pura y testeable (sin cookies ni base de datos).
import { NoAutenticadoError } from './errors'
import type { SesionEmpleado } from './session'

/**
 * Devuelve el personaId de la sesión (FK a personas.id). Sin sesión lanza NoAutenticadoError.
 * Si la cuenta no tiene persona asociada lanza: no hay a quién atribuir la decisión.
 */
export function autorDeDecision(sesion: SesionEmpleado | null): string {
  if (!sesion) throw new NoAutenticadoError()
  if (!sesion.personaId) {
    throw new Error('la sesión no tiene persona asociada: no se puede registrar quién autoriza la decisión')
  }
  return sesion.personaId
}
