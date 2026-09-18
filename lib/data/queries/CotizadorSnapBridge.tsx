// CotizadorSnapBridge (DEC-3, plan_cotizador_tanstack_query.md): reemplaza a
// CotizadorSincronizador en el cotizador. Componente 'use client' 'delgado' que:
//  1) Seed: en el 1er montaje siembra la cache TanStack con el snapshot que ya trajo el
//     DataStore del layout SSR (cero flash, sin fetching extra).
//  2) Reactividad multi-usuario: el long-poll avisa QUÉ tablas cambiaron (F1, payload
//     "tabla:op" del trigger 0004). Solo agenda invalidación del query escopado
//     ['cotizador', proyectoId] (~10 SELECTs) cuando el cambio tocó tablas del cotizador:
//       - Tablas ajenas (testimonios, casos_garantia, finanzas...) → NO invalidar: antes
//         cada NOTIFY de cualquier módulo refetcheaba el cotizador completo (patrón lastre P0).
//       - Tabla del cotizador + mutación propia de ESTA pestaña asentada hace poco (eco de
//         nuestra propia escritura, ya reconciliada por setQueryData o refetch de
//         invalidarSiempre) → NO invalidar: el refetch sería redundante (patrón lastre P1).
//       - Cualquier otra combinación → invalida (reactividad cross-usuario ≤4s preservada).
//  3) Coalescencia trailing ~500ms + gate de mutations en vuelo (t-149) se mantienen:
//     se re-chequea JUSTO al disparar para no pisar una fila optimista con foto vieja.
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDataStore, useStoreChange } from '@/lib/data'
import { cotizadorKeys } from './queryKeys'
import { esCambioDelCotizador, hayMutacionPropiaReciente, type MutacionObservada } from './cotizador-reactividad'
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
    // t-157 (2026-09-10): grupos de ítems de cotización (árbol Espacio → Grupo → Subgrupo → Ítems).
    gruposItem: espacios.flatMap((e) => store.gruposItem.porEspacio(e.id)),
  }
}

export function CotizadorSnapBridge({ proyectoId }: { proyectoId: string }) {
  const store = useDataStore()
  const qc = useQueryClient()
  const version = store.getVersion()
  const storeChange = useStoreChange()
  const queryKey = cotizadorKeys.detalle(proyectoId)

  // Seed del primer montaje: la cache parte del snapshot SSR del DataStore (cero flash).
  useEffect(() => {
    const seed = mapSnapshotCotizadorDesdeStore(store, proyectoId)
    if (seed) qc.setQueryData<CotizadorSnapshot>(queryKey, seed)
  }, [qc, queryKey, store, proyectoId])

  // F1 (invalidación escopada por tabla): cada señal del bus global agenda UNA invalidación
  // del query del cotizador, pero solo cuando el NOTIFY tocó tablas que este snapshot lee.
  // Tres guardas, re-chequeadas JUSTO al disparar (no al agendar):
  //  (1) filtro por tabla: un cambio en testimonios/finanzas/garantías NO refetchea el
  //      cotizador (~10 SELECTs) — fin del refetch global (P0).
  //  (2) coalescencia trailing ~500ms — una ráfaga de version++ dispara un solo refetch;
  //  (3) eco propio: si ESTA pestaña asentó una mutación del cotizador dentro de la ventana
  //      (mutationCache por-tab), el NOTIFY reciente es casi seguro el eco de esa escritura
  //      ya reconciliada — el refetch sería redundante (P1). Un cambio de OTRO usuario no
  //      está en nuestro cache, así que su NOTIFY sí invalida.
  useEffect(() => {
    if (!esCambioDelCotizador(storeChange.tablas)) return
    const timer = setTimeout(() => {
      if (qc.isMutating({ mutationKey: queryKey }) > 0) return
      const mutations: MutacionObservada[] = qc.getMutationCache().getAll().map((m) => ({
        mutationKey: m.options.mutationKey,
        status: m.state.status,
        submittedAt: m.state.submittedAt,
      }))
      if (hayMutacionPropiaReciente(mutations, queryKey, Date.now())) return
      void qc.invalidateQueries({ queryKey })
    }, 500)
    return () => clearTimeout(timer)
  }, [qc, queryKey, version, storeChange, proyectoId])

  return null
}