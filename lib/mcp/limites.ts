// lib/mcp/limites.ts
// Límites del servidor MCP (t-200 §6.4). Constantes fijas: no son configurables desde la base.
import { MAX_CARACTERES_RESULTADO } from '../asistente/herramientas'

/** Llamadas a herramientas MCP por petición HTTP del cliente (la misma regla del bucle del chat). */
export const MAX_LLAMADAS_POR_PETICION = 8
/** Elementos máximos de cualquier lista de un resultado de lectura. */
export const MAX_ELEMENTOS_RESULTADO = 20
export { MAX_CARACTERES_RESULTADO }

/**
 * Recorta a MAX_ELEMENTOS_RESULTADO cada lista de primer nivel de un resultado JSON. Si el texto no
 * es JSON (p. ej. ya truncado por el registro), lo devuelve tal cual.
 */
export function acotarElementos(texto: string, max: number = MAX_ELEMENTOS_RESULTADO): string {
  let valor: unknown
  try {
    valor = JSON.parse(texto)
  } catch {
    return texto
  }
  let recortado = false
  const recortar = (lista: unknown[]) => {
    if (lista.length <= max) return lista
    recortado = true
    return lista.slice(0, max)
  }
  if (Array.isArray(valor)) {
    valor = recortar(valor)
  } else if (valor && typeof valor === 'object') {
    for (const clave of Object.keys(valor)) {
      const v = (valor as Record<string, unknown>)[clave]
      if (Array.isArray(v)) (valor as Record<string, unknown>)[clave] = recortar(v)
    }
  }
  return recortado ? JSON.stringify(valor) : texto
}
