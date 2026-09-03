// selectors.ts
// Selectores reactivos reutilizables para el store Zustand del cotizador.
// Cada hook consume del store usando el patrón selector con `useShallow`
// para evitar re-renders innecesarios. Tipado fuerte (sin `any`).

import { useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import type { ItemVariante } from '../contracts'
import type { ProductoCatalogo } from '../contracts'
import { useCotizadorStore } from './useCotizadorStore'

/**
 * Obtener todos los espacios del proyecto (slice del cotizador).
 * Requiere que el puente (CotizadorSincronizador) haya hidratado `espacios`.
 */
export const useSelectEspacios = () => {
  const espacios = useCotizadorStore(useShallow((state) => state.espacios))
  return useMemo(() => espacios, [espacios])
}

/**
 * Obtener el catálogo de productos (para productMap en la cotización).
 * Requiere que el puente haya hidratado `catalogo`.
 */
export const useSelectCatalogo = () => {
  const catalogo = useCotizadorStore(useShallow((state) => state.catalogo))
  return useMemo(() => catalogo, [catalogo])
}

/**
 * Obtener los parámetros del sistema (tarifas de jornadas, parámetros financieros, etc.).
 * Requiere que el puente haya hidratado `parametros`.
 */
export const useSelectParametros = () => {
  const parametros = useCotizadorStore(useShallow((state) => state.parametros))
  return useMemo(() => parametros, [parametros])
}


/**
 * Obtener los items de una variante específica, excluyendo anulados.
 * Solo re-renderiza cuando cambia la referencia de `items` del store.
 */
export const useSelectPorVariante = (varianteId: string) => {
  const items = useCotizadorStore(useShallow((state) => state.items))
  return useMemo(
    () => items.filter((i: ItemVariante) => i.varianteId === varianteId && !i.anulado),
    [items, varianteId]
  )
}

/**
 * Total calculado (cantidad × precioUnitario) de los items no anulados.
 * Solo recomputa cuando cambia `items`.
 */
export const useSelectTotales = () => {
  const items = useCotizadorStore(useShallow((state) => state.items))
  return useMemo(
    () =>
      items.reduce((acc: number, item: ItemVariante) => {
        if (item.anulado) {
          return acc
        }
        const cantidad = Number(item.cantidad || 0)
        const precio = Number(item.precioUnitario || 0)
        return acc + cantidad * precio
      }, 0),
    [items]
  )
}

/**
 * Mapa derivado del catálogo (id → { id, descripcion, precioPublico }).
 * No consume el store: es una derivación pura de `catalogo`, memoizada.
 */
export const useSelectProductoMap = (catalogo: ProductoCatalogo[]) =>
  useMemo(
    () =>
      new Map(
        catalogo.map((c) => [
          c.id,
          { id: c.id, descripcion: c.descripcion, precioPublico: c.precioPublico },
        ])
      ),
    [catalogo]
  )

/**
 * Obtener el mapa de jornadas del store. Read de `state.jornadasMap` (existe en CotizadorState).
 */
export const useSelectJornadasMap = () => {
  const jornadasMap = useCotizadorStore(useShallow((state) => state.jornadasMap))
  return useMemo(() => jornadasMap, [jornadasMap])
}

/**
 * Obtener los grupos expandidos del store. Read de `state.gruposExpandidos` (existe en CotizadorState).
 */
export const useSelectGruposExpandidos = () => {
  const gruposExpandidos = useCotizadorStore(useShallow((state) => state.gruposExpandidos))
  return useMemo(() => gruposExpandidos, [gruposExpandidos])
}
