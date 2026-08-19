// Módulo de búsqueda resiliente (t-141, decisión del Supervisor 2026-08-19).
// Matcher en capas, funciones puras y componibles (Axioma de Independencia):
//   1. normalizarTexto — NFKD + diacríticos + lowercase + separadores -> texto canónico.
//   2. tokensDe — tokenización (AND de tokens, el orden de las palabras no importa).
//   3. coincide — AND de tokens + fallback fuzzy por token (Levenshtein acotado, Opción A).
//   4. scoreCoincidencia — ranking para ordenar resultados (exacto > prefijo > substring).
//
// Desviación documentada vs m06 §A.5: A.5 especifica Levenshtein como mecanismo principal;
// acá se eligió normalización+tokens como base y Levenshtein acotado como capa opcional
// (fuzzy default ON, Opción A: ≤1 edición para tokens ≥4, ≤2 para ≥6). Reversible por flag.

export interface OpcionesCoincidencia {
  /** Habilita el fallback fuzzy (Levenshtein acotado) por token. Default: true (Opción A). */
  fuzzy?: boolean
  /** Longitud mínima de token para aplicar fuzzy (evita ruido con "de"/"el"/"un"). Default: 4. */
  minLongitudTokenFuzzy?: number
}

/** Normaliza un texto: descompone diacríticos (NFD), los elimina (á->a, ñ->n, ü->u),
 *  pasa a lowercase y colapsa todo carácter no alfanumérico a un separador.
 *  "Cocina Integral García-López" -> "cocina integral garcia lopez". */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Tokens canónicos de un texto (o query). */
export function tokensDe(texto: string): string[] {
  return normalizarTexto(texto).split(/\s+/).filter(Boolean)
}

/** Distancia de Levenshtein (ediciones mínimas: insertar/borrar/reemplazar). */
export function distanciaLevenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array<number>(b.length + 1)
  const curr = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + costo)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

/** Límite de tolerancia fuzzy por longitud de token (Opción A: ≤1 para ≥4, ≤2 para ≥6). */
function limiteFuzzy(token: string, minLongitud: number): number {
  if (token.length < minLongitud) return 0
  if (token.length < 6) return 1
  return 2
}

/** ¿El token de búsqueda existe (con tolerancia de typo) entre los tokens del texto? */
function tokenCoincideFuzzy(token: string, tokensTexto: string[], minLongitud: number): boolean {
  const limite = limiteFuzzy(token, minLongitud)
  if (limite === 0) return false
  return tokensTexto.some(
    (t) => t.length >= minLongitud && distanciaLevenshtein(token, t) <= limite
  )
}

/** AND de tokens (orden independiente) sobre el texto concatenado de los campos.
 *  Opción A: si un token no está, prueba tolerancia fuzzy (typos) contra los tokens del texto. */
export function coincide(
  query: string,
  campos: string[],
  opciones: OpcionesCoincidencia = {}
): boolean {
  const { fuzzy = true, minLongitudTokenFuzzy = 4 } = opciones
  const qTokens = tokensDe(query)
  if (qTokens.length === 0) return true
  const texto = normalizarTexto(campos.join(' '))
  if (!texto) return false
  const tokensTexto = tokensDe(texto)
  return qTokens.every(
    (t) => texto.includes(t) || (fuzzy && tokenCoincideFuzzy(t, tokensTexto, minLongitudTokenFuzzy))
  )
}

/** Score de ranking (0 = sin coincidencia exacta/substring). Los campos anteriores pesan más
 *  (orden = prioridad declarada por el caller). El fuzzy NO suma acá: los matches por
 *  substring/exactitud siempre aparecen antes que los de typo. */
export function scoreCoincidencia(query: string, campos: string[]): number {
  const qTokens = tokensDe(query)
  if (qTokens.length === 0) return 0
  const normCampos = campos.map(normalizarTexto).filter(Boolean)
  let total = 0
  for (const qt of qTokens) {
    let mejor = 0
    normCampos.forEach((campo, i) => {
      const peso = Math.max(1, normCampos.length - i)
      const tokensCampo = tokensDe(campo)
      const hayIgual = tokensCampo.some((t) => t === qt)
      const hayPrefijo = tokensCampo.some((t) => t.startsWith(qt) && t !== qt)
      const haySubstring = campo.includes(qt)
      const pts = hayIgual ? 4 : hayPrefijo ? 3 : haySubstring ? 2 : 0
      if (pts > mejor) mejor = pts * peso
    })
    total += mejor
  }
  return total
}