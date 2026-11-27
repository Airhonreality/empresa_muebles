// lib/asistente/errores.ts
// Utilidades de error del asistente. Sin imports de base de datos: las usan las rutas y los tests.

/** Código SQLSTATE de un error de Postgres, buscando también en la cadena `cause` (Drizzle lo envuelve). */
export function codigoPg(err: unknown): string | undefined {
  let actual: unknown = err
  for (let i = 0; i < 5 && actual && typeof actual === 'object'; i++) {
    const code = (actual as { code?: unknown }).code
    if (typeof code === 'string') return code
    actual = (actual as { cause?: unknown }).cause
  }
  return undefined
}

/** El modelo usó un id que no obtuvo de una búsqueda de esta conversación (ver Procedencia en herramientas.ts). */
export class ErrorProcedencia extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorProcedencia'
  }
}

/**
 * Al confirmar, el resultado recalculado no coincide con el del resumen (p. ej. cambió un precio).
 * La propuesta NO se ejecuta: vuelve a `pendiente` con `datosNuevos` y `resumenNuevo` para que el
 * empleado la vea de nuevo.
 */
export class ErrorRevalidacion extends Error {
  readonly datosNuevos: unknown
  readonly resumenNuevo: string
  constructor(mensaje: string, datosNuevos: unknown, resumenNuevo: string) {
    super(mensaje)
    this.name = 'ErrorRevalidacion'
    this.datosNuevos = datosNuevos
    this.resumenNuevo = resumenNuevo
  }
}

/** Ya existe una entidad con la misma clave única (p. ej. documento de cliente). Lleva el id existente. */
export class ErrorDuplicado extends Error {
  readonly idExistente: string
  constructor(mensaje: string, idExistente: string) {
    super(mensaje)
    this.name = 'ErrorDuplicado'
    this.idExistente = idExistente
  }
}
