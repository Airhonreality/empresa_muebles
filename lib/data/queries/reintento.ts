// Política de reintento automático de las mutaciones del ERP (sin botón para el usuario).
//
// Regla: un fallo de RED (sin señal, conexión cortada, timeout) NO es un rechazo del negocio;
// la escritura todavía puede llegar al servidor. Por eso se reintenta sola, con espera creciente,
// y el cambio optimista se queda en pantalla mientras tanto.
//
// Un rechazo del servidor (validación, regla de negocio, "la escritura no aplicó") SÍ es
// definitivo: reintentar no cambia nada, así que no se reintenta y la pantalla revierte.
//
// Sin conexión, TanStack Query pausa la mutación (networkMode 'online') sin consumir reintentos
// y la reanuda sola al volver la red.

/** Máximo de reintentos ante un fallo de red (~3 min de espera acumulada con el backoff de abajo). */
export const MAX_REINTENTOS_RED = 10

/** Heurística de error de red. Los Server Actions de Next fallan con TypeError ("Failed to fetch")
 *  cuando no hay conexión; los mensajes de red en otros navegadores también se cubren acá. */
export function esErrorDeRed(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (!(error instanceof Error)) return false
  return /failed to fetch|networkerror|network request failed|load failed|err_internet_disconnected|err_network|timeout/i.test(
    error.message,
  )
}

/** `retry` de TanStack: reintenta solo fallos de red, hasta MAX_REINTENTOS_RED. */
export function reintentarSoloRed(intentosHechos: number, error: unknown): boolean {
  return esErrorDeRed(error) && intentosHechos < MAX_REINTENTOS_RED
}

/** Espera antes del reintento n (0-based): 1 s, 2 s, 4 s... topada en 30 s. */
export function esperaReintento(intento: number): number {
  return Math.min(1000 * 2 ** intento, 30_000)
}
