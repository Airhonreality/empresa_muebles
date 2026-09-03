// hidratador.ts
// Helper puro (fuera de React) que mapea el slice del cotizador desde el DataStore
// hacia la forma de `CotizadorState`. Es la única pieza que sabe cómo traducir el
// DataStore monolítico a los campos que consume el store Zustand (Fase 1, ZN-002).
//
// Razón de ser: mantener este mapeo como función plana permite testearlo con tsx
// (patrón node:assert del repo) sin renderer de React, y deja el puente
// (CotizadorSincronizador) como un componente `'use client'` delgado.

import type { DataStore, EspacioVariante, ItemVariante, ProductoCatalogo, Parametro } from '../contracts'

/** Estructura de jornadas por espacio (dev/ens/inst) — espejo de buildJornadasMap del page. */
export type JornadasTuple = { dev: string; ens: string; inst: string }

/** Slice del cotizador que el hidratador puede producir desde un DataStore. */
export interface SliceCotizador {
  items: ItemVariante[]
  espacios: EspacioVariante[]
  jornadasMap: Record<string, JornadasTuple>
  catalogo: ProductoCatalogo[]
  parametros: Parametro[]
}

/** Construye el mapa de jornadas desde los espacios (dev/ens/inst). */
export function construirJornadasMap(espacios: EspacioVariante[]): Record<string, JornadasTuple> {
  const map: Record<string, JornadasTuple> = {}
  espacios.forEach((e) => {
    map[e.id] = {
      dev: e.jornadasDesarrolloTecnico,
      ens: e.jornadasEnsamblajeTaller,
      inst: e.jornadasInstalacionObra,
    }
  })
  return map
}

/**
 * Extrae el slice del cotizador para un proyecto concreto.
 * - `espacios`: los del proyecto.
 * - `items`: los de todas las variantes del proyecto (el store Zustand los indexa por variante).
 * - `jornadasMap`: derivado de los espacios.
 */
export function hidratarSliceCotizador(store: DataStore, proyectoId: string): SliceCotizador {
  const espacios = store.espacios.porProyecto(proyectoId)
  const items: ItemVariante[] = []
  const espaciosDeEsteProyecto = espacios as EspacioVariante[]
  for (const esp of espaciosDeEsteProyecto) {
    const porVariante = store.items.porVariante(esp.id)
    if (porVariante.length > 0) {
      items.push(...porVariante)
    }
  }
  return {
    espacios,
    items,
    jornadasMap: construirJornadasMap(espacios),
    catalogo: store.catalogo.listar(),
    parametros: store.parametros.listar(),
  }
}
