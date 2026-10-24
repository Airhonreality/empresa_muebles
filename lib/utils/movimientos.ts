import type { MovimientoFinanciero } from '@/lib/data/contracts'

/** t-181: el libro puede ordenarse por la fecha del movimiento (la que el usuario eligió)
 *  o por la fecha de registro (createdAt). Antes ambas estaban mezcladas: listar() ordena
 *  por createdAt, mientras el libro de Caja ordenaba por fecha del movimiento. */
export type OrdenMovimientos =
  | 'movimiento-desc'
  | 'movimiento-asc'
  | 'registro-desc'
  | 'registro-asc'

export function ordenarMovimientos(
  movimientos: MovimientoFinanciero[],
  orden: OrdenMovimientos,
): MovimientoFinanciero[] {
  const [campo, direccion] = orden.split('-') as ['movimiento' | 'registro', 'asc' | 'desc']
  const signo = direccion === 'asc' ? 1 : -1

  return [...movimientos].sort((a, b) => {
    const primario = campo === 'movimiento'
      ? a.fecha.localeCompare(b.fecha)
      : a.createdAt.localeCompare(b.createdAt)
    if (primario !== 0) return primario * signo

    const secundario = campo === 'movimiento'
      ? a.createdAt.localeCompare(b.createdAt)
      : a.fecha.localeCompare(b.fecha)
    if (secundario !== 0) return secundario * signo

    return a.id.localeCompare(b.id)
  })
}
