// lib/auth/accion.ts
// Único punto de entrada para cualquier Server Action que toque datos.
// Default-deny: sin permiso declarado o sin marca pública, no compila.
//
// Uso:
//   export const crearX = protegerAccion({ permiso: 'proyectos:escribir' }, async function crearX(...) {...})
//   export const listarY = protegerAccion({ publica: true, motivo: 'sitio público' }, async function listarY(...) {...})
//   export const leerMio = protegerAccion({ cliente: true }, async function leerMio(clienteId: string, ...) {...})
//
// Orden de decisión (no cambiar):
//   1. Pública: ejecuta fn. El motivo es obligatorio y no puede ser vacío.
//   2. Cliente ({ cliente: true }): exige sesión de cliente (requireSesionCliente). Sin sesión ->
//      NoAutenticadoError. Luego ejecuta fn con el clienteId de la sesión como PRIMER argumento; el
//      llamador no lo pasa (la firma pública no lo incluye). Si un llamador manda uno de más, nunca
//      llega como clienteId: el de la sesión siempre va primero.
//   3. Si no: sesión de empleado. Sin sesión -> NoAutenticadoError (nunca null).
//   4. Permiso: PERMISOS_POR_ROL[rol] debe incluir el permiso -> si no, NoAutorizadoError.
//   5. Ejecuta fn.
//
// La identidad que actúa NUNCA viene del cliente: fn lee la sesión si la necesita.
import { requireSesionEmpleado, requireSesionCliente, type SesionEmpleado } from './session'
import { PERMISOS_POR_ROL, type Permiso } from './permisos'
import { NoAutenticadoError, NoAutorizadoError } from './errors'

export type ReglaEmpleadoOPublica = { permiso: Permiso } | { publica: true; motivo: string }
/** Acción de portal cliente: el clienteId sale de la sesión de cliente, nunca del llamador. */
export type ReglaCliente = { cliente: true }
export type ReglaAccion = ReglaEmpleadoOPublica | ReglaCliente

/** Marca interna no enumerable: la usa la prueba de cobertura para detectar acciones sin proteger. */
export const MARCA_ACCION_PROTEGIDA = Symbol.for('veta.accion.protegida')

export type ObtenerSesion = () => Promise<SesionEmpleado | null>
export type ObtenerClienteId = () => Promise<string | null>

/**
 * Núcleo del protocolo con las fuentes de sesión inyectadas. protegerAccion las usa con la sesión
 * real (cookie); los tests las usan con sesiones falsas para no depender de cookies.
 */
export function ejecutarAccion<A extends unknown[], R>(
  obtenerSesion: ObtenerSesion,
  regla: ReglaEmpleadoOPublica,
  fn: (...args: A) => Promise<R>,
  obtenerClienteId?: ObtenerClienteId,
): (...args: A) => Promise<R>
export function ejecutarAccion<T extends unknown[], R>(
  obtenerSesion: ObtenerSesion,
  regla: ReglaCliente,
  fn: (clienteId: string, ...args: T) => Promise<R>,
  obtenerClienteId?: ObtenerClienteId,
): (...args: T) => Promise<R>
// Implementación amplia (any): las firmas tipadas son los overloads de arriba.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function ejecutarAccion(
  obtenerSesion: ObtenerSesion,
  regla: ReglaAccion,
  fn: (...args: any[]) => Promise<any>,
  obtenerClienteId: ObtenerClienteId = requireSesionCliente,
): (...args: any[]) => Promise<any> {
  if ('cliente' in regla) {
    if (regla.cliente !== true) {
      throw new Error(`protegerAccion(${fn.name || 'anonima'}): la regla cliente exige cliente: true.`)
    }
    const envueltaCliente = async (...args: unknown[]): Promise<unknown> => {
      const clienteId = await obtenerClienteId()
      if (!clienteId) throw new NoAutenticadoError('No autenticado: se requiere sesión de cliente')
      return fn(clienteId, ...args)
    }
    Object.defineProperty(envueltaCliente, MARCA_ACCION_PROTEGIDA, { value: true, enumerable: false })
    return envueltaCliente
  }

  const esPublica = 'publica' in regla
  if ('publica' in regla && (regla.publica !== true || typeof regla.motivo !== 'string' || regla.motivo.trim() === '')) {
    throw new Error(`protegerAccion(${fn.name || 'anonima'}): una acción pública exige un motivo no vacío.`)
  }
  const permiso = 'permiso' in regla ? regla.permiso : undefined

  const envuelta = async (...args: unknown[]): Promise<unknown> => {
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
export function protegerAccion<T extends unknown[], R>(
  regla: ReglaCliente,
  fn: (clienteId: string, ...args: T) => Promise<R>,
): (...args: T) => Promise<R>
export function protegerAccion<A extends unknown[], R>(
  regla: ReglaEmpleadoOPublica,
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R>
/* eslint-disable @typescript-eslint/no-explicit-any */
export function protegerAccion(regla: ReglaAccion, fn: (...args: any[]) => Promise<any>): (...args: any[]) => Promise<any> {
  return ejecutarAccion(requireSesionEmpleado, regla as ReglaEmpleadoOPublica, fn)
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** true si la función fue producida por protegerAccion. */
export function esAccionProtegida(fn: unknown): boolean {
  return typeof fn === 'function' && (fn as unknown as Record<symbol, unknown>)[MARCA_ACCION_PROTEGIDA] === true
}
