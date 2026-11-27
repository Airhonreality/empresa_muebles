// Capa 0 (t-200): forma persistida de las imágenes. Pura, sin dependencias de R2 ni de React.
// Acepta la forma vieja (lista de URLs) y la nueva (objetos con alt, pie y valores). Las filas
// viejas no se migran: se leen como { url } y se reescriben en la forma nueva al guardar.
import type { FotoRaw, ImagenGuardada, ImagenItem } from './tipos'

export const LIMITES = {
  alt: 200,
  pie: 160,
  valorTexto: 600,
} as const

/** Normaliza una entrada cruda. Devuelve null si no tiene una URL usable. */
function normalizarUna(raw: unknown): ImagenGuardada | null {
  if (typeof raw === 'string') {
    const url = raw.trim()
    return url ? { url } : null
  }
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const url = typeof obj.url === 'string' ? obj.url.trim() : ''
  if (!url) return null

  const out: ImagenGuardada = { url }
  const alt = typeof obj.alt === 'string' ? obj.alt.trim() : ''
  const pie = typeof obj.pie === 'string' ? obj.pie.trim() : ''
  if (alt) out.alt = alt
  if (pie) out.pie = pie

  if (obj.valores && typeof obj.valores === 'object') {
    const valores: Record<string, string | boolean> = {}
    for (const [clave, v] of Object.entries(obj.valores as Record<string, unknown>)) {
      if (typeof v === 'boolean') valores[clave] = v
      else if (typeof v === 'string' && v.trim()) valores[clave] = v.trim()
    }
    if (Object.keys(valores).length > 0) out.valores = valores
  }
  return out
}

/** Lee la columna jsonb en cualquiera de sus dos formas. Descarta entradas inválidas. */
export function leerImagenes(raw: unknown): ImagenGuardada[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizarUna).filter((x): x is ImagenGuardada => x !== null)
}

/** Lista de URLs para las pantallas y la presentación que solo necesitan la imagen. */
export function urlsDe(raw: unknown): string[] {
  return leerImagenes(raw).map((img) => img.url)
}

/** Convierte items en memoria a la forma persistida. Quita atributos vacíos. */
export function aGuardadas(items: ReadonlyArray<Pick<ImagenItem, 'url' | 'base' | 'valores'>>): ImagenGuardada[] {
  return items.map((it) => {
    const out: ImagenGuardada = { url: it.url }
    const alt = (it.base.alt ?? '').trim()
    const pie = (it.base.pie ?? '').trim()
    if (alt) out.alt = alt
    if (pie) out.pie = pie
    const valores: Record<string, string | boolean> = {}
    for (const [clave, v] of Object.entries(it.valores as Record<string, unknown>)) {
      if (typeof v === 'boolean') valores[clave] = v
      else if (typeof v === 'string' && v.trim()) valores[clave] = v.trim()
    }
    if (Object.keys(valores).length > 0) out.valores = valores
    return out
  })
}

/**
 * Sanea para escritura: aplica el sanitizador de URL (whitelist de R2 / clonado) y recorta los
 * textos a sus límites. Las URLs rechazadas se descartan en silencio.
 */
export function sanitizarGuardadas(
  raw: unknown,
  sanitizarUrl: (url: string) => string | null,
  limiteValorTexto: number = LIMITES.valorTexto,
): ImagenGuardada[] {
  const out: ImagenGuardada[] = []
  for (const img of leerImagenes(raw)) {
    const url = sanitizarUrl(img.url)
    if (!url) continue
    const limpia: ImagenGuardada = { url }
    if (img.alt) limpia.alt = img.alt.slice(0, LIMITES.alt)
    if (img.pie) limpia.pie = img.pie.slice(0, LIMITES.pie)
    if (img.valores) {
      const valores: Record<string, string | boolean> = {}
      for (const [clave, v] of Object.entries(img.valores)) {
        valores[clave] = typeof v === 'string' ? v.slice(0, limiteValorTexto) : v
      }
      limpia.valores = valores
    }
    out.push(limpia)
  }
  return out
}

/** Forma persistida a items en memoria, con ids locales estables que el llamador provee. */
export function aItems(guardadas: readonly ImagenGuardada[], generarId: () => string): ImagenItem[] {
  return guardadas.map((img) => ({
    clienteId: generarId(),
    url: img.url,
    base: { ...(img.alt ? { alt: img.alt } : {}), ...(img.pie ? { pie: img.pie } : {}) },
    valores: (img.valores ?? {}) as ImagenItem['valores'],
  }))
}

export type { FotoRaw }
