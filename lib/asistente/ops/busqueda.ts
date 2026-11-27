// lib/asistente/ops/busqueda.ts
// Búsqueda común de las operaciones de lectura (t-200 paso 3). Reutiliza lib/search/normalizar.ts:
// sin acentos, sin orden de palabras y con tolerancia a erratas. Devuelve los mejores según el score.
import { coincide, scoreCoincidencia } from '../../search/normalizar'

export interface ResultadoBusqueda<T> {
  total: number
  resultados: T[]
}

/**
 * Filtra `items` por el texto (todas las palabras deben aparecer en alguno de los `campos`) y devuelve
 * como mucho `limite`, con los mejores primero. Sin texto, devuelve los primeros `limite` tal como vienen.
 */
export function buscarEnLista<T>(
  items: readonly T[],
  texto: string | undefined,
  campos: (item: T) => string[],
  limite: number,
): ResultadoBusqueda<T> {
  if (!texto || texto.trim() === '') {
    return { total: items.length, resultados: items.slice(0, limite) }
  }
  const coincidentes = items
    .filter((it) => coincide(texto, campos(it)))
    .map((it) => ({ it, score: scoreCoincidencia(texto, campos(it)) }))
    .sort((a, b) => b.score - a.score)
  return { total: coincidentes.length, resultados: coincidentes.slice(0, limite).map((c) => c.it) }
}
