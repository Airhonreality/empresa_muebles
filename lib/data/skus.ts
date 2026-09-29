// t-165 (2026-09-23): SKU autogenerado del catálogo.
// Esquema: abreviatura de la descripción (hasta 3 tokens significativos) + guion + fecha
// YYMMDD del día de guardado (o del createdAt en productos existentes) + sufijo "-N" solo
// si colisiona. Aprobado por el Supervisor en sesión: SKU no editable, generado
// siempre y **inmutable** tras la creación (es una identidad persistente; cambiarlo rompería
// referencias históricas de items_variante / propuestas).
// Módulo puro (sin DB) para que sea testeable; la unicidad contra la tabla real la garantiza
// el server action / store consultando los skus existentes y llamando a generarSkuUnico.

/** Palabras de relleno que se omiten al abreviar ("Tablero de Roble 18mm" -> TAB-ROB). */
const STOPWORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'u', 'e', 'con', 'sin', 'para', 'por', 'en', 'a', 'al', 'se', 'su', 'sus', 'que',
])

const MAX_TOKENS = 3
const TOKEN_MAX_LEN = 3

/** Normaliza una descripción a tokens [a-z0-9] sin tildes ni ñ (NFD + strip combining marks). */
export function normalizarTokens(descripcion: string): string[] {
  return descripcion
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

/**
 * Abreviatura de la descripción: hasta 3 tokens significativos (sin stopwords), cada uno
 * con máximo 3 caracteres en mayúsculas. Tokens cortos (acrónimos/dimensiones ≤3 letras,
 * ej. "TV", "18m") pasan completos. Vacío -> "PRD" (fallback, no debería ocurrir: la
 * descripción es obligatoria).
 *
 * El fallback tiene 3 letras a propósito, no 4: `esSkuAutogenerado` exige tokens de 1-3, así
 * que un "PROD" produciría un SKU que el propio módulo declara inválido. Se alcanza igual con
 * descripciones que solo contienen stopwords ("de la"), que es el caso que el mockStore y el
 * formulario no filtran.
 */
export function abreviarDescripcion(descripcion: string): string {
  const tokens = normalizarTokens(descripcion).filter((t) => !STOPWORDS.has(t))
  const abreviados = tokens.slice(0, MAX_TOKENS).map((t) =>
    t.length <= TOKEN_MAX_LEN ? t.toUpperCase() : t.slice(0, TOKEN_MAX_LEN).toUpperCase()
  )
  return abreviados.length > 0 ? abreviados.join('-') : 'PRD'
}

/** Fecha en formato SKU `YYMMDD` (trazable y colapsable). Se usa UTC igual que el resto del repo. */
export function formatearFechaSku(fecha: Date): string {
  const aa = String(fecha.getUTCFullYear()).slice(-2)
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getUTCDate()).padStart(2, '0')
  return `${aa}${mm}${dd}`
}

/** SKU base (sin sufijo de colisión): `ABREV-YYMMDD`. */
export function generarSkuBase(descripcion: string, fecha: Date): string {
  return `${abreviarDescripcion(descripcion)}-${formatearFechaSku(fecha)}`
}

/**
 * SKU único: base y, si ya existe, sufijo secuencial `-2`, `-3`... sobre el conjunto de
 * skus existentes pasado por el llamador (transacción / store) — nunca repite.
 */
export function generarSkuUnico(descripcion: string, fecha: Date, existentes: Iterable<string>): string {
  const tomados = new Set(existentes)
  const base = generarSkuBase(descripcion, fecha)
  if (!tomados.has(base)) return base
  let n = 2
  while (tomados.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/** Valida el formato autogenerado: `ABREV[-ABREV]{0,2}-YYMMDD[-N]`. */
export function esSkuAutogenerado(sku: string): boolean {
  return /^[A-Z0-9]{1,3}(-[A-Z0-9]{1,3}){0,2}-\d{6}(-\d+)?$/.test(sku)
}