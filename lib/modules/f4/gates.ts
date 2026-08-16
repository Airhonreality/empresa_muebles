// Predicados de F4 (Compras). Funciones puras: no dependen del store ni del tiempo real,
// se testean en aislamiento. Fuente: disenio_P13_orden_compra.md, diseno_compras_bom_diamante.md.
import { P18 } from '../f3/gates'
import type { BomMaterial, Proyecto, SchemaProyecto, Verificacion } from '../../data/contracts'

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

export interface ItemListaCompraSugerido {
  productoCatalogoId: string
  cantidad: number
  unidad: string
  bomMaterialId: string
}

/** D-04 vía 1: la lista de compra sugerida de un proyecto se deriva del BOM del schema
 * `aprobado_compras` — no se reinventa una lista de compra paralela a los ítems cotizados/aprobados.
 * Solo sugiere ítems con `productoId` (los `null` son candidatos a vía 2, "a pedido", y quedan
 * fuera de la sugerencia automática — el usuario los agrega a mano en la UI). Filas con
 * `cantidad` no numérica se excluyen (dato inconsistente, no se sugiere una compra sobre datos rotos). */
export function derivarListaCompraSugerida(
  schema: Pick<SchemaProyecto, 'estado'> | null,
  bomMateriales: Pick<BomMaterial, 'id' | 'productoId' | 'cantidad' | 'unidad'>[]
): ItemListaCompraSugerido[] {
  if (!schema || schema.estado !== 'aprobado_compras') return []
  return bomMateriales
    .filter((b): b is typeof b & { productoId: string } => b.productoId !== null)
    .map((b) => ({
      productoCatalogoId: b.productoId,
      cantidad: Number(b.cantidad),
      unidad: b.unidad,
      bomMaterialId: b.id,
    }))
    .filter((item) => Number.isFinite(item.cantidad) && item.cantidad > 0)
}
