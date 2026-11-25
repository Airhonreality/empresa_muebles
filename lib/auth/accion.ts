// lib/auth/accion.ts
// Único punto de entrada para cualquier Server Action que toque datos.
// Default-deny: sin permiso declarado o sin marca pública, no compila.
//
// Uso:
//   export const crearX = protegerAccion({ permiso: 'proyectos:escribir' }, async function crearX(...) {...})
//   export const listarY = protegerAccion({ publica: true, motivo: 'sitio público' }, async function listarY(...) {...})
//
// Orden de decisión (no cambiar):
//   1. Pública: ejecuta fn. El motivo es obligatorio y no puede ser vacío.
//   2. Si no: sesión de empleado. Sin sesión -> NoAutenticadoError (nunca null).
//   3. Permiso: PERMISOS_POR_ROL[rol] debe incluir el permiso -> si no, NoAutorizadoError.
//   4. Ejecuta fn.
//
// La identidad que actúa NUNCA viene del cliente: fn lee la sesión si la necesita.
import { requireSesionEmpleado, type SesionEmpleado } from './session'
import { PERMISOS_POR_ROL, type Permiso } from './permisos'
import { NoAutenticadoError, NoAutorizadoError } from './errors'

export type ReglaAccion = { permiso: Permiso } | { publica: true; motivo: string }

/** Marca interna no enumerable: la usa la prueba de cobertura para detectar acciones sin proteger. */
export const MARCA_ACCION_PROTEGIDA = Symbol.for('veta.accion.protegida')

export type ObtenerSesion = () => Promise<SesionEmpleado | null>

/**
 * Núcleo del protocolo con la fuente de sesión inyectada. protegerAccion lo usa con la sesión
 * real (cookie); los tests lo usan con una sesión falsa para no depender de cookies.
 */
export function ejecutarAccion<A extends unknown[], R>(
  obtenerSesion: ObtenerSesion,
  regla: ReglaAccion,
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  const esPublica = 'publica' in regla
  if ('publica' in regla && (regla.publica !== true || typeof regla.motivo !== 'string' || regla.motivo.trim() === '')) {
    throw new Error(`protegerAccion(${fn.name || 'anonima'}): una acción pública exige un motivo no vacío.`)
  }
  const permiso = 'permiso' in regla ? regla.permiso : undefined

  const envuelta = async (...args: A): Promise<R> => {
    if (esPublica) return fn(...args)
    const sesion = await obtenerSesion()
    if (!sesion) throw new NoAutenticadoError()
    if (!permiso || !PERMISOS_POR_ROL[sesion.rol]?.includes(permiso)) {
      throw new NoAutorizadoError(permiso ?? '(sin permiso declarado)')
    }
    return fn(...args)
  }
  Object.defineProperty(envuelta, MARCA_ACCION_PROTEGIDA, { value: true, enumerable: false })
  return envuelta
}

/** Envuelve una Server Action con el protocolo único. Ver comentario del archivo. */
export function protegerAccion<A extends unknown[], R>(
  regla: ReglaAccion,
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return ejecutarAccion(requireSesionEmpleado, regla, fn)
}

/** true si la función fue producida por protegerAccion. */
export function esAccionProtegida(fn: unknown): boolean {
  return typeof fn === 'function' && (fn as unknown as Record<symbol, unknown>)[MARCA_ACCION_PROTEGIDA] === true
}
