// lib/asistente/claves.ts
// Rotación de claves de proveedor (diseño §5.2). Lógica pura: el acceso a la base va por la
// interfaz RepositorioClaves (implementación Drizzle en repositorio.ts) para poder probarla con mocks.
//
// Reglas:
//  - Se usa la primera clave disponible del proveedor configurado, por `orden`.
//  - Cuota/límite (429, 402) -> enfriada (Retry-After si el proveedor lo indica; 60 min si no).
//  - 401/403 -> invalida (no se vuelve a usar hasta reemplazarla).
//  - 5xx / 408 / red -> hasta 2 reintentos con espera corta en la MISMA clave; luego la siguiente
//    clave SIN cambiar su estado.
//  - Si ninguna clave sirve -> ErrorSinClavesDisponibles con hora estimada de reactivación.
//  - Nunca se registra la clave ni el mensaje crudo del proveedor (puede traer datos sensibles).
import type { ProveedorAsistente } from './modelo'

export type EstadoClave = 'activa' | 'enfriada' | 'invalida' | 'desactivada'

export interface ClaveRegistro {
  id: string
  proveedor: ProveedorAsistente
  etiqueta: string
  claveCifrada: string
  orden: number
  estado: EstadoClave
  enfriadaHasta: Date | null
}

export interface EventoRotacion {
  usuarioId: string
  proveedorClaveId: string
  detalle: string
}

export interface RepositorioClaves {
  /** Todas las claves (cualquier estado), ordenadas por `orden` ascendente. */
  listarClaves(): Promise<ClaveRegistro[]>
  enfriar(id: string, hasta: Date): Promise<void>
  invalidar(id: string): Promise<void>
  registrarRotacion(evento: EventoRotacion): Promise<void>
}

export type TipoErrorProveedor = 'cuota' | 'invalida' | 'transitorio' | 'otro'

export interface DepsRotacion {
  repo: RepositorioClaves
  descifrar: (claveCifrada: string) => string
  ahora: () => Date
  esperar: (ms: number) => Promise<void>
  /** Espera antes de cada reintento transitorio. Longitud = reintentos permitidos. */
  esperasReintento?: number[]
}

export const ENFRIAMIENTO_POR_DEFECTO_MS = 60 * 60 * 1000

export class ErrorSinClavesDisponibles extends Error {
  readonly reactivacionEn: Date | null
  constructor(reactivacionEn: Date | null) {
    const cuando = reactivacionEn
      ? `Se reactiva aprox. a las ${reactivacionEn.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}.`
      : 'Ninguna clave respondió. Intenta de nuevo en unos minutos.'
    super(`El asistente no tiene claves disponibles en este momento. ${cuando}`)
    this.name = 'ErrorSinClavesDisponibles'
    this.reactivacionEn = reactivacionEn
  }
}

interface ErrorConEstado {
  statusCode?: unknown
  responseHeaders?: Record<string, string>
  message?: unknown
}

/** Clasifica un error del proveedor por código HTTP (los códigos de OpenRouter están verificados en su documentación). */
export function clasificarError(err: unknown): { tipo: TipoErrorProveedor; retryAfterMs: number | null } {
  const e = (err ?? {}) as ErrorConEstado
  const status = typeof e.statusCode === 'number' ? e.statusCode : undefined
  const retryAfterMs = leerRetryAfter(e.responseHeaders)
  if (status === 429 || status === 402) return { tipo: 'cuota', retryAfterMs }
  if (status === 401 || status === 403) return { tipo: 'invalida', retryAfterMs: null }
  if (status === 408 || (status !== undefined && status >= 500 && status <= 599)) {
    return { tipo: 'transitorio', retryAfterMs: null }
  }
  if (status === undefined && /fetch failed|ECONN|ETIMEDOUT|socket|network/i.test(String(e.message ?? ''))) {
    return { tipo: 'transitorio', retryAfterMs: null }
  }
  return { tipo: 'otro', retryAfterMs: null }
}

function leerRetryAfter(cabeceras: Record<string, string> | undefined): number | null {
  const valor = cabeceras?.['retry-after']
  if (!valor) return null
  const segundos = Number(valor)
  return Number.isFinite(segundos) && segundos > 0 ? segundos * 1000 : null
}

function disponible(c: ClaveRegistro, ahora: Date): boolean {
  if (c.estado === 'activa') return true
  return c.estado === 'enfriada' && c.enfriadaHasta !== null && c.enfriadaHasta <= ahora
}

/**
 * Ejecuta `operacion` con la primera clave disponible del proveedor, rotando según las reglas de arriba.
 * `operacion` recibe la clave YA descifrada (solo en memoria) y el id de la fila.
 */
export async function ejecutarConRotacion<T>(
  params: { proveedor: ProveedorAsistente; usuarioId: string },
  operacion: (clave: string, claveId: string) => Promise<T>,
  deps: DepsRotacion,
): Promise<{ resultado: T; claveId: string }> {
  const ahora = deps.ahora()
  const esperas = deps.esperasReintento ?? [500, 1500]
  const todas = (await deps.repo.listarClaves())
    .filter((c) => c.proveedor === params.proveedor)
    .sort((a, b) => a.orden - b.orden)
  const candidatas = todas.filter((c) => disponible(c, ahora))
  // Hora de reactivación de las claves que se enfriaron durante ESTA llamada (la lista inicial está desactualizada).
  const enfriadasEnEsteIntento: Date[] = []

  for (const clave of candidatas) {
    // Descifrar fuera del try: si falla la clave maestra, el error debe propagarse, no rotar.
    const textoClave = deps.descifrar(clave.claveCifrada)
    let reintentos = 0
    for (;;) {
      try {
        const resultado = await operacion(textoClave, clave.id)
        return { resultado, claveId: clave.id }
      } catch (err) {
        const { tipo, retryAfterMs } = clasificarError(err)
        if (tipo === 'otro') throw err
        if (tipo === 'cuota') {
          const hasta = new Date(deps.ahora().getTime() + (retryAfterMs ?? ENFRIAMIENTO_POR_DEFECTO_MS))
          await deps.repo.enfriar(clave.id, hasta)
          enfriadasEnEsteIntento.push(hasta)
          await deps.repo.registrarRotacion({
            usuarioId: params.usuarioId,
            proveedorClaveId: clave.id,
            detalle: `cuota o límite de tasa; enfriada hasta ${hasta.toISOString()}`,
          })
          break
        }
        if (tipo === 'invalida') {
          await deps.repo.invalidar(clave.id)
          await deps.repo.registrarRotacion({
            usuarioId: params.usuarioId,
            proveedorClaveId: clave.id,
            detalle: 'clave rechazada por el proveedor (401/403); marcada inválida',
          })
          break
        }
        // transitorio: reintenta la misma clave con espera corta, luego pasa a la siguiente sin cambiar su estado.
        if (reintentos < esperas.length) {
          await deps.esperar(esperas[reintentos])
          reintentos++
          continue
        }
        break
      }
    }
  }

  const enfriadas = [
    ...todas
      .filter((c) => c.estado === 'enfriada' && c.enfriadaHasta !== null && c.enfriadaHasta > ahora)
      .map((c) => c.enfriadaHasta as Date),
    ...enfriadasEnEsteIntento,
  ].sort((a, b) => a.getTime() - b.getTime())
  throw new ErrorSinClavesDisponibles(enfriadas[0] ?? null)
}
