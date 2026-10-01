/**
 * Parser agnóstico de separador decimal (t-175, diagnóstico de UI del cotizador 2026-09-30):
 * `NumberInput` es un `<input type="number">` nativo cuyo manejo de "," vs "." depende del
 * navegador/SO del usuario — la fuente real de la inconsistencia reportada ("trolea" según el
 * separador). Esta función es la única fuente de verdad para convertir lo que un humano escribe
 * en un string numérico limpio, listo para `Number()`/guardar en un campo `numeric` de Postgres.
 *
 * Reglas (pensadas para cantidades/jornadas, nunca para dinero — ver `parseMoney` en
 * `components/veta/money-input.tsx` para COP, que no maneja decimales a propósito):
 * - Si aparecen "." y "," a la vez: el que está más a la derecha es el decimal; el otro se
 *   descarta (separador de miles) — cubre tanto "1.234,5" (es-CO) como "1,234.5" (en-US).
 * - Si aparece solo uno de los dos, repetido más de una vez ("1.234.567" / "1,234,567"): se trata
 *   como separador de miles, se descarta por completo.
 *   repetido una sola vez: se trata como separador decimal, se normaliza a ".".
 * - Nunca lanza: texto vacío o sin dígitos devuelve "".
 */
export function normalizarNumeroTexto(texto: string): string {
  const limpio = texto.replace(/[^\d.,]/g, '')
  if (!limpio) return ''

  const puntos = limpio.split('.').length - 1
  const comas = limpio.split(',').length - 1

  let separadorDecimal: '.' | ',' | null = null
  if (puntos > 0 && comas > 0) {
    separadorDecimal = limpio.lastIndexOf('.') > limpio.lastIndexOf(',') ? '.' : ','
  } else if (puntos === 1) {
    separadorDecimal = '.'
  } else if (comas === 1) {
    separadorDecimal = ','
  }
  // puntos > 1 (sin comas) o comas > 1 (sin puntos): separadorDecimal queda null -> todo es miles.

  if (!separadorDecimal) return limpio.replace(/[.,]/g, '')

  const posicion = limpio.lastIndexOf(separadorDecimal)
  const entero = limpio.slice(0, posicion).replace(/[.,]/g, '')
  const decimales = limpio.slice(posicion + 1).replace(/[.,]/g, '')

  if (!entero && !decimales) return ''
  return decimales ? `${entero || '0'}.${decimales}` : entero
}

/** Convierte a `number` usando `normalizarNumeroTexto`; texto vacío o sin dígitos -> 0. */
export function parseNumeroFlexible(texto: string): number {
  const normalizado = normalizarNumeroTexto(texto)
  const n = normalizado ? Number(normalizado) : 0
  return Number.isFinite(n) ? n : 0
}
