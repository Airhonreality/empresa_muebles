/**
 * Helpers de montos (t-194, Fase A).
 *
 * Postgres devuelve columnas `numeric(14,2)` como strings con punto decimal y dos decimales
 * (`"250000.00"`). Los inputs de COP trabajan con pesos enteros. Quitar todo lo que no sea
 * dígito (`"250000.00"` -> `"25000000"`) multiplica el valor por 100: ese fue el bug de
 * "250mil se ve como 25mil / 300mil se ve como 3000000".
 */

/**
 * Parte entera de un string numérico de Postgres, sin multiplicar.
 * `"250000.00"` -> `"250000"`. `null`/`undefined`/sin dígitos -> `""`.
 */
export function parteEnteraDb(valor: string | null | undefined): string {
  if (!valor) return ''
  const entera = valor.trim().split('.')[0] ?? ''
  return entera.replace(/\D/g, '')
}
