// lib/asistente/ops/limites.ts
// Límites de búsqueda compartidos (t-200 paso 3). Enum cerrado: el modelo elige 5, 10 o 20; nada más.
import { z } from 'zod'

export const LIMITES_BUSQUEDA = [5, 10, 20] as const
export const LIMITE_POR_DEFECTO = 10

export const esquemaLimite = z.union(
  LIMITES_BUSQUEDA.map((v) => z.literal(v)) as unknown as [z.ZodLiteral<5>, z.ZodLiteral<10>, z.ZodLiteral<20>],
)

/** Valor del límite o el por defecto si el modelo no lo envió. */
export function limiteDe(valor: number | undefined): number {
  return valor ?? LIMITE_POR_DEFECTO
}
