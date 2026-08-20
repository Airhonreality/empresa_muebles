// Ley uniforme de colecciones (t-142): toda colección del ERP se lista de más
// reciente a más antigua (createdAt DESC, fallback updatedAt). Se aplica en la
// capa de datos (listar() de mock-store y drizzle-impl), no en cada pantalla.
// Las colecciones con orden de negocio propio (portafolio por destacado/orden,
// obligaciones por vencimiento, parámetros/categorías, registros de gate) lo
// conservan y no pasan por este helper.
export function masRecientePrimero<T>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aT = (a as { createdAt?: string | null; updatedAt?: string | null }).createdAt
      ?? (a as { updatedAt?: string | null }).updatedAt
      ?? ''
    const bT = (b as { createdAt?: string | null; updatedAt?: string | null }).createdAt
      ?? (b as { updatedAt?: string | null }).updatedAt
      ?? ''
    return bT.localeCompare(aT)
  })
}