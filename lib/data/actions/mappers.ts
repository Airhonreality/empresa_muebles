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
