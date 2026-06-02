'use client'
/**
 * useProjectData — Data fetching hook for ProjectCanvas.
 *
 * Uses useRelationData (Zustand cache) instead of raw fetch.
 * Provides a manual refresh() that forces re-fetch from server.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMateriaStore } from '@/lib/agnostic/store'
import type {
  ApoyoTecnicoRecord,
  ContratosRecord,
  AbonosContratoRecord,
  OrdenesTrabajoRecord,
  TareasProduccionRecord,
  EspacioVariantesRecord,
} from '@/generated/agnostic-schemas'

export interface ProjectData {
  apoyo:    ApoyoTecnicoRecord[]
  contrato: ContratosRecord | null
  abonos:   AbonosContratoRecord[]
  ordenes:  OrdenesTrabajoRecord[]
  tareas:   TareasProduccionRecord[]
  espacios: EspacioVariantesRecord[]
}

export const EMPTY_DATA: ProjectData = {
  apoyo: [], contrato: null, abonos: [], ordenes: [], tareas: [], espacios: [],
}

const NAMESPACES = [
  'apoyo_tecnico', 'contratos', 'abonos_contrato',
  'ordenes_trabajo', 'tareas_produccion', 'espacio_variantes',
] as const

export function useProjectData(cotizacionId: string | undefined, isOpen: boolean) {
  // Leverage Zustand cache via useRelationData
  const { data: allApoyo,     isLoading: l1 } = useRelationData(isOpen ? 'apoyo_tecnico' : null)
  const { data: allContratos, isLoading: l2 } = useRelationData(isOpen ? 'contratos' : null)
  const { data: allAbonos,    isLoading: l3 } = useRelationData(isOpen ? 'abonos_contrato' : null)
  const { data: allOrdenes,   isLoading: l4 } = useRelationData(isOpen ? 'ordenes_trabajo' : null)
  const { data: allTareas,    isLoading: l5 } = useRelationData(isOpen ? 'tareas_produccion' : null)
  const { data: allEspacios,  isLoading: l6 } = useRelationData(isOpen ? 'espacio_variantes' : null)

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6

  // Client-side filter: only data belonging to this cotizacion
  const data = useMemo<ProjectData>(() => {
    if (!cotizacionId || !isOpen) return EMPTY_DATA

    const contratoRec = (allContratos as ContratosRecord[]).find(
      r => r.data.cotizacion_id === cotizacionId
    ) ?? null

    const projectOrdenes = (allOrdenes as OrdenesTrabajoRecord[]).filter(
      o => o.data.cotizacion_id === cotizacionId
    )
    const ordenIds = new Set(projectOrdenes.map(o => o.id))

    return {
      apoyo:    (allApoyo    as ApoyoTecnicoRecord[]).filter(r => r.data.cotizacion_id === cotizacionId),
      contrato: contratoRec,
      abonos:   contratoRec
        ? (allAbonos as AbonosContratoRecord[]).filter(r => r.data.contrato_id === contratoRec.id)
        : [],
      ordenes:  projectOrdenes,
      tareas:   (allTareas as TareasProduccionRecord[]).filter(r => ordenIds.has(r.data.orden_trabajo_id)),
      espacios: (allEspacios as EspacioVariantesRecord[]).filter(r => r.data.cotizacion_id === cotizacionId),
    }
  }, [cotizacionId, isOpen, allApoyo, allContratos, allAbonos, allOrdenes, allTareas, allEspacios])

  // Manual refresh: forces re-fetch from server by invalidating Zustand cache
  const [, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    if (!isOpen) return

    // Re-fetch all namespaces and update Zustand store
    const { setMateria } = useMateriaStore.getState()

    NAMESPACES.forEach(ns => {
      fetch(`/api/vault?namespace=${ns}`)
        .then(r => r.json())
        .then(result => {
          const records = result.data ?? result.records ?? []
          setMateria(ns, records)
        })
        .catch(() => { /* silent — useRelationData handles the fallback */ })
    })

    // Trigger re-render so useMemo recalculates
    setRefreshKey(k => k + 1)
  }, [isOpen])

  return { data, isLoading, refresh }
}
