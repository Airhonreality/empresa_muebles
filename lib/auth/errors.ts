// lib/auth/errors.ts
// Errores de autenticación/autorización del protocolo de Server Actions (lib/auth/accion.ts).
// Sin 'use server': importables desde servidor, cliente y tests (mismo patrón que lib/data/errors.ts).

/** Llamada a una acción protegida sin sesión de empleado válida. */
export class NoAutenticadoError extends Error {
  constructor(mensaje = 'No autenticado: se requiere sesión de empleado') {
    super(mensaje)
    this.name = 'NoAutenticadoError'
  }
}

/** Sesión válida, pero el rol no tiene el permiso que la acción declara. */
export class NoAutorizadoError extends Error {
  constructor(permiso: string) {
    super(`No autorizado: el rol de la sesión no tiene el permiso "${permiso}"`)
    this.name = 'NoAutorizadoError'
  }
}
