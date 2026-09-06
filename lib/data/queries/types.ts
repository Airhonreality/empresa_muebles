// Tipos del server-state del cotizador (A5/A6, plan_cotizador_tanstack_query.md).
// Módulo de SOLO tipos: importable desde Server Components, client components y
// server actions sin efectos secundarios (no 'use client' ni 'use server').
import type {
  Proyecto, Cliente, EspacioVariante, ItemVariante, EspacioArtefacto,
  ProductoCatalogo, Parametro, Contrato, HitoPago, CatalogoAcabado,
} from '../contracts'

/** Snapshot escopado del cotizador: NADA de las ~64 tablas del fetchSnapshotAction()
 * completo — solo las 10 colecciones que consume la pantalla [proyectoId]. Es el
 * payload de `obtenerSnapshotCotizadorAction()` (A5) y da forma a la queryKey
 * `['cotizador', proyectoId]` (A6). */
export interface CotizadorSnapshot {
  proyecto: Proyecto | null
  clientes: Cliente[]
  parametros: Parametro[]
  espacios: EspacioVariante[]
  items: ItemVariante[]
  artefactos: EspacioArtefacto[]
  catalogo: ProductoCatalogo[]
  catalogoAcabados: CatalogoAcabado[]
  contrato: Contrato | null
  hitos: HitoPago[]
}