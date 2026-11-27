// lib/asistente/catalogo-modelos.ts
// Catálogo de modelos del proveedor para el selector de configuración (S1).
// Solo OpenRouter por ahora: su listado público (GET /api/v1/models) está verificado. Anthropic y
// Google NO tienen listado aquí; la UI los muestra deshabilitados. No se inventan modelos.
// Lógica pura + caché en memoria. La llamada de red entra por `obtener` (inyectable para tests).

export const PROVEEDORES_CON_CATALOGO = ['openrouter'] as const
export type ProveedorConCatalogo = (typeof PROVEEDORES_CON_CATALOGO)[number]

export const URL_CATALOGO_OPENROUTER = 'https://openrouter.ai/api/v1/models'
export const TTL_CATALOGO_MS = 60 * 60 * 1000
const TIMEOUT_CATALOGO_MS = 8000

export interface ModeloCatalogo {
  id: string
  nombre: string
  gratis: boolean
  precioPor1MEntradaUsd: number
  precioPor1MSalidaUsd: number
  contexto: number
}

export class ErrorCatalogoNoDisponible extends Error {
  constructor() {
    super('No se pudo consultar el catálogo de modelos del proveedor. Intenta de nuevo en unos minutos.')
    this.name = 'ErrorCatalogoNoDisponible'
  }
}

/** Precio por token (texto, p. ej. "0.0000005") a USD por 1M tokens, redondeado a 4 decimales. */
export function precioPor1M(porToken: unknown): number | null {
  if (typeof porToken !== 'string' && typeof porToken !== 'number') return null
  const n = Number(porToken)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 1_000_000 * 10_000) / 10_000
}

/** Gratis: precio de entrada y salida exactamente "0", o id que termina en ":free". */
export function esGratis(id: string, precioEntrada: unknown, precioSalida: unknown): boolean {
  if (id.endsWith(':free')) return true
  return String(precioEntrada) === '0' && String(precioSalida) === '0'
}

/**
 * Parsea la respuesta de OpenRouter. Conserva solo modelos que soportan herramientas ("tools")
 * y cuyo precio se puede leer. Entradas malformadas se descartan sin romper el resto.
 */
export function parsearModelosOpenRouter(json: unknown): ModeloCatalogo[] {
  const data = (json as { data?: unknown } | null)?.data
  if (!Array.isArray(data)) return []
  const modelos: ModeloCatalogo[] = []
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue
    const m = raw as Record<string, unknown>
    const id = typeof m.id === 'string' ? m.id : ''
    if (!id) continue
    const soporta = Array.isArray(m.supported_parameters) && m.supported_parameters.includes('tools')
    if (!soporta) continue
    const pricing = (m.pricing ?? {}) as Record<string, unknown>
    const entrada = precioPor1M(pricing.prompt)
    const salida = precioPor1M(pricing.completion)
    if (entrada === null || salida === null) continue
    modelos.push({
      id,
      nombre: typeof m.name === 'string' && m.name.trim() ? m.name : id,
      gratis: esGratis(id, pricing.prompt, pricing.completion),
      precioPor1MEntradaUsd: entrada,
      precioPor1MSalidaUsd: salida,
      contexto: typeof m.context_length === 'number' ? m.context_length : 0,
    })
  }
  return modelos
}

export interface DepsCatalogo {
  obtener: () => Promise<unknown>
  ahora: () => Date
  ttlMs?: number
}

export interface CatalogoModelos {
  /** Lista vigente. Si la consulta falla, lanza ErrorCatalogoNoDisponible (ver `ultimoConocido`). */
  listar(): Promise<ModeloCatalogo[]>
  /** Último resultado correcto, aunque esté vencido. null si nunca se consultó con éxito. */
  ultimoConocido(): ModeloCatalogo[] | null
}

/** Caché en memoria de 1 hora. Solo se guardan respuestas correctas. */
export function crearCatalogo(deps: DepsCatalogo): CatalogoModelos {
  const ttl = deps.ttlMs ?? TTL_CATALOGO_MS
  let cache: { modelos: ModeloCatalogo[]; expira: number } | null = null
  return {
    async listar() {
      const ahora = deps.ahora().getTime()
      if (cache && cache.expira > ahora) return cache.modelos
      try {
        const modelos = parsearModelosOpenRouter(await deps.obtener())
        cache = { modelos, expira: ahora + ttl }
        return modelos
      } catch {
        throw new ErrorCatalogoNoDisponible()
      }
    },
    ultimoConocido() {
      return cache ? cache.modelos : null
    },
  }
}

/** Llamada real al endpoint público de OpenRouter (sin clave: el listado es público). */
export async function obtenerCatalogoOpenRouter(): Promise<unknown> {
  const res = await fetch(URL_CATALOGO_OPENROUTER, {
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_CATALOGO_MS),
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`catálogo HTTP ${res.status}`)
  return res.json()
}
