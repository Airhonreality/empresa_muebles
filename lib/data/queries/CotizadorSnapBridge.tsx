// CotizadorSnapBridge (DEC-3, plan_cotizador_tanstack_query.md): reemplaza a
// CotizadorSincronizador en el cotizador. Componente 'use client' 'delgado' que:
//  1) Seed: en el 1er montaje siembra la cache TanStack con el snapshot que ya trajo el
//     DataStore del layout SSR (cero flash, sin fetching extra).
//  2) Reactividad multi-usuario: en cada version++ global (store.subscribe vía
//     useDataStore) agenda una invalidación de la query escopada ['cotizador', proyectoId] (~10
//     SELECTs) con coalescencia trailing ~500ms + gate que NO invalida si hay mutations de esta
//     pantalla en vuelo. Es lo único que queda del long-poll en esta pantalla. Reactividad
//     cross-usuario ≤4s preservada (T5).
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

  // Cada versión global agenda una invalidación de la query escopada, con dos guardas:
  // (1) coalescencia trailing ~500ms — una ráfaga de version++ dispara un solo refetch;
  // (2) gate: si hay mutations de ESTA pantalla en vuelo (por mutationKey), NO invalida —
  // el propio onSuccess/reconciliar de la mutation ya mantiene la cache correcta, e invalidar
  // acá arriesga pisar una fila optimista con una foto vieja del servidor. Se re-chequea el
  // gate JUSTO al disparar (no solo al agendar) porque una mutation puede empezar/terminar
  // durante la ventana del debounce.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (qc.isMutating({ mutationKey: queryKey }) > 0) return
      void qc.invalidateQueries({ queryKey })
    }, 500)
    return () => clearTimeout(timer)
  }, [qc, queryKey, version, proyectoId])

  return null
}