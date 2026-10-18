// Matriz de transiciones del ciclo de vida de un proyecto/cotización.
// Es la misma que trae el fixture `transiciones_proyecto` (par08) y la que valida
// `actualizarEstadoProyectoAction`. El parámetro sigue siendo la fuente configurable:
// esta matriz es solo el fallback cuando en la base no existe el parámetro o su JSON
// quedó vacío/roto — sin este fallback el proyecto quedaba congelado en `activa`
// (Lead) para siempre porque el header no tenía ningún destino que ofrecer.
export const TRANSICIONES_PROYECTO_DEFAULT: Record<string, string[]> = {
  activa: ['enviada', 'perdida', 'cancelada'],
  enviada: ['activa', 'negociacion', 'en_contrato', 'perdida', 'cancelada'],
  negociacion: ['en_contrato', 'enviada', 'perdida', 'cancelada'],
  en_contrato: ['pre_produccion', 'retoma', 'negociacion', 'perdida', 'cancelada'],
  retoma: ['en_contrato', 'pre_produccion', 'perdida', 'cancelada'],
  pre_produccion: ['produccion', 'retoma', 'cancelada'],
  produccion: ['entregado', 'retoma', 'pre_produccion', 'cancelada'],
  entregado: ['produccion', 'perdida', 'cancelada'],
  perdida: [],
  cancelada: [],
}

function esMatrizValida(valor: unknown): valor is Record<string, string[]> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return false
  const entradas = Object.entries(valor as Record<string, unknown>)
  if (entradas.length === 0) return false
  return entradas.every(
    ([, destinos]) => Array.isArray(destinos) && destinos.every((d) => typeof d === 'string')
  )
}

/**
 * Normaliza el valor del parámetro `transiciones_proyecto` (JSON string u objeto).
 * Devuelve `null` si no es una matriz usable, para que el llamador caiga en la
 * matriz por defecto en vez de dejar el proyecto sin ninguna transición.
 */
export function normalizarMatrizTransicionesProyecto(valor: unknown): Record<string, string[]> | null {
  if (typeof valor === 'string') {
    if (!valor.trim()) return null
    try {
      return normalizarMatrizTransicionesProyecto(JSON.parse(valor))
    } catch {
      return null
    }
  }
  return esMatrizValida(valor) ? valor : null
}

/** Destinos válidos desde `estadoActual`: parámetro si define ese estado, default si no.
 *  Un `[]` explícito en el parámetro se respeta (estado terminal); solo se cae al default
 *  cuando el parámetro no trae NINGUNA regla para ese estado (matriz ausente o incompleta). */
export function destinosProyectoValidos(estadoActual: string, valorParametro: unknown): string[] {
  const matriz = normalizarMatrizTransicionesProyecto(valorParametro)
  const propios = matriz?.[estadoActual]
  if (propios !== undefined) return propios
  return TRANSICIONES_PROYECTO_DEFAULT[estadoActual] ?? []
}
