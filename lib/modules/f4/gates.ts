// Predicados de F4 (Compras). Funciones puras: no dependen del store ni del tiempo real,
// se testean en aislamiento. Fuente: disenio_P13_orden_compra.md.
import { P18 } from '../f3/gates'
import type { Proyecto, Verificacion } from '../../data/contracts'

/** P-13 R1/R2 (guard E-18): una OC de proyecto exige schema aprobado (reutiliza P18, no lo reinventa).
 * Una OC operativa (proyectoId=null, ej. reposición de herramientas P-15) nunca pasa por este guard. */
export function puedeCrearOrdenCompra(
  proyecto: {
    estado: Proyecto['estado']
    verificadorId: string | null
    fechaEntradaDesarrollo: string | null
  } | null,
  verificaciones: Verificacion[]
): boolean {
  if (proyecto === null) return true
  return P18(proyecto, verificaciones)
}
