// Helpers compartidos por las Server Actions de lib/data/actions/*.
// No lleva 'use server' — es un módulo plano de servidor, nunca importado desde el cliente.
export function num(v: string | number | null | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function numOrNull(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Limpia los campos personalizados libres clave+valor del catálogo (V3, 2026-09-18):
 * solo entradas con clave no vacía (string), trims, descarta basura. Vive acá (no 'use server'),
 * como num()/numOrNull(), porque core.ts es 'use server' y Next exige exports async en esos módulos. */
export function sanitizarCamposPersonalizados(campos?: { clave: string; valor: string }[] | null): { clave: string; valor: string }[] {
  if (!Array.isArray(campos)) return []
  return campos
    .filter((c) => c && typeof c.clave === 'string' && c.clave.trim() !== '' && typeof c.valor === 'string')
    .map((c) => ({ clave: c.clave.trim(), valor: c.valor.trim() }))
}
