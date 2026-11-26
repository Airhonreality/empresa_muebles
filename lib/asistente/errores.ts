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
