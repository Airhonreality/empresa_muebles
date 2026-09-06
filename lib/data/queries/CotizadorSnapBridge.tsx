// CotizadorSnapBridge (DEC-3, plan_cotizador_tanstack_query.md): reemplaza a
// CotizadorSincronizador en el cotizador. Componente 'use client' 'delgado' que:
//  1) Seed: en el 1er montaje siembra la cache TanStack con el snapshot que ya trajo el
//     DataStore del layout SSR (cero flash, sin fetching extra).
//  2) Reactividad multi-usuario: en cada version++ global (store.subscribe vía
//     useDataStore) invalida SOLO la query escopada ['cotizador', proyectoId] (~10
//     SELECTs) — nunca el snapshot de 64 tablas. Es lo único que queda del long-poll en
//     esta pantalla. Reactividad cross-usuario ≤4s preservada (T5).
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDataStore } from '@/lib/data'
import { cotizadorKeys } from './queryKeys'
import type { CotizadorSnapshot } from './types'
import type { DataStore } from '../contracts'

/** Mapea el slice del cotizador desde el DataStore hacia el CotizadorSnapshot de la
 * cache TanStack (DEC-4: adapta hidratarSliceCotizador + cliente/contratos/hitos/
 * artefactos/acabados). Función plana testable con tsx. */
export function mapSnapshotCotizadorDesdeStore(store: DataStore, proyectoId: string): CotizadorSnapshot | null {
  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  if (!proyecto) return null
  const espacios = store.espacios.porProyecto(proyectoId)
  const contrato = store.contratos.porProyecto(proyectoId) ?? null
  return {
    proyecto,
    clientes: store.clientes.listar(),
    parametros: store.parametros.listar(),
    espacios,
    items: espacios.flatMap((e) => store.items.porVariante(e.id)),
    artefactos: espacios.flatMap((e) => store.artefactos.porEspacio(e.id)),
    catalogo: store.catalogo.listar(),
    catalogoAcabados: store.catalogoAcabados.listar(),
    contrato,
    hitos: contrato ? store.hitos.porContrato(contrato.id) : [],
  }
}

export function CotizadorSnapBridge({ proyectoId }: { proyectoId: string }) {
  const store = useDataStore()
  const qc = useQueryClient()
  const version = store.getVersion()
  const queryKey = cotizadorKeys.detalle(proyectoId)

  // Seed del primer montaje: la cache parte del snapshot SSR del DataStore (cero flash).
  useEffect(() => {
    const seed = mapSnapshotCotizadorDesdeStore(store, proyectoId)
    if (seed) qc.setQueryData<CotizadorSnapshot>(queryKey, seed)
  }, [qc, queryKey, store, proyectoId])

  // Cada versión global invalida la query escopada (identidad de datos deduplica renders).
  useEffect(() => {
    void qc.invalidateQueries({ queryKey })
  }, [qc, queryKey, version, proyectoId])

  return null
}