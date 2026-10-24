'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { calcularCajaDisponible } from '@/lib/modules/f4f5f6/gates'
import { obtenerSnapshotProyectoAction } from '../actions/lecturas-proyecto'
import type {
  ActaEntrega,
  CitacionCalidad,
  Cliente,
  Cronograma,
  CronogramaEtapa,
  DesfaseCronograma,
  EspacioArtefacto,
  EspacioVariante,
  Instalacion,
  ItemVariante,
  Modulo,
  ModuloArtefacto,
  NotaReunion,
  ObligacionPendiente,
  OrdenCompra,
  ProductoCatalogo,
  Proyecto,
  RecepcionMaterial,
  Reproceso,
  Verificacion,
} from '../contracts'
import { PROYECTO_VACIO, type ProyectoSnapshot } from './proyecto-types'
import { proyectoKeys } from './queryKeys'

export interface ProyectoCompatStore {
  proyectos: { obtenerPorId(id: string): Proyecto | undefined }
  clientes: { obtenerPorId(id: string): Cliente | undefined }
  verificaciones: { porProyecto(id: string): Verificacion[] }
  recepcionesMaterial: { porProyecto(id: string): RecepcionMaterial[] }
  desfases: { porProyecto(id: string): DesfaseCronograma[] }
  citacionesCalidad: { porProyecto(id: string): CitacionCalidad[] }
  reprocesos: { porProyecto(id: string): Reproceso[] }
  instalaciones: { porProyecto(id: string): Instalacion[] }
  actasEntrega: { porProyecto(id: string): ActaEntrega | undefined }
  espacios: { porProyecto(id: string): EspacioVariante[] }
  modulos: { porProyecto(id: string): Modulo[] }
  cronogramas: { porProyecto(id: string): Cronograma | undefined }
  obligacionesPendientes: { porProyecto(id: string): ObligacionPendiente[] }
  ordenesCompra: { listar(): OrdenCompra[] }
  cuentasFinancieras: { disponible(): number }
  cronogramaEtapas: { porCronograma(id: string): CronogramaEtapa[] }
  notasReunion: { porProyecto(id: string): NotaReunion[] }
  catalogo: { listar(): ProductoCatalogo[] }
  modulosArtefactos: { porModulo(id: string): ModuloArtefacto[] }
  items: { porVariante(id: string): ItemVariante[] }
  artefactos: { porEspacio(id: string): EspacioArtefacto[] }
  getVersion(): number
}

interface ProyectoCompatContexto {
  store: ProyectoCompatStore
  cargando: boolean
}

const ProyectoCompatContext = createContext<ProyectoCompatContexto | null>(null)

export function useProyectoSnapshot(proyectoId: string) {
  return useQuery<ProyectoSnapshot>({
    queryKey: proyectoKeys.detalle(proyectoId),
    queryFn: () => obtenerSnapshotProyectoAction(proyectoId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}

export function ProyectoCompatProvider({
  proyectoId,
  children,
}: {
  proyectoId: string
  children: ReactNode
}) {
  const snapshot = useProyectoSnapshot(proyectoId)
  const version = snapshot.dataUpdatedAt

  const value = useMemo<ProyectoCompatContexto>(() => {
    const data = snapshot.data ?? PROYECTO_VACIO
    const delProyecto = (id: string) => id === proyectoId
    return {
      cargando: snapshot.isLoading && !snapshot.data,
      store: {
        proyectos: { obtenerPorId: (id) => (data.proyecto?.id === id ? data.proyecto : undefined) },
        clientes: { obtenerPorId: (id) => (data.cliente?.id === id ? data.cliente : undefined) },
        verificaciones: { porProyecto: (id) => (delProyecto(id) ? data.verificaciones : []) },
        recepcionesMaterial: { porProyecto: (id) => (delProyecto(id) ? data.recepciones : []) },
        desfases: { porProyecto: (id) => (delProyecto(id) ? data.desfases : []) },
        citacionesCalidad: { porProyecto: (id) => (delProyecto(id) ? data.citaciones : []) },
        reprocesos: { porProyecto: (id) => (delProyecto(id) ? data.reprocesos : []) },
        instalaciones: { porProyecto: (id) => (delProyecto(id) ? data.instalaciones : []) },
        actasEntrega: { porProyecto: (id) => (delProyecto(id) ? data.acta ?? undefined : undefined) },
        espacios: { porProyecto: (id) => (delProyecto(id) ? data.espacios : []) },
        modulos: { porProyecto: (id) => (delProyecto(id) ? data.modulos : []) },
        cronogramas: { porProyecto: (id) => (delProyecto(id) ? data.cronograma ?? undefined : undefined) },
        obligacionesPendientes: {
          porProyecto: (id) => data.obligaciones.filter((o) => o.proyectoId === id),
        },
        ordenesCompra: { listar: () => data.ordenesCompra },
        cuentasFinancieras: {
          disponible: () => calcularCajaDisponible(data.cuentas, data.obligaciones),
        },
        cronogramaEtapas: {
          porCronograma: (id) => data.cronogramaEtapas.filter((e) => e.cronogramaId === id),
        },
        notasReunion: { porProyecto: (id) => (delProyecto(id) ? data.notas : []) },
        catalogo: { listar: () => data.catalogo },
        modulosArtefactos: {
          porModulo: (id) => data.modulosArtefactos.filter((a) => a.moduloId === id),
        },
        items: { porVariante: (id) => data.items.filter((i) => i.varianteId === id) },
        artefactos: {
          porEspacio: (id) => data.artefactos.filter((a) => a.espacioVarianteId === id),
        },
        getVersion: () => version,
      },
    }
  }, [snapshot.data, snapshot.isLoading, proyectoId, version])

  return <ProyectoCompatContext.Provider value={value}>{children}</ProyectoCompatContext.Provider>
}

export function useProyectoCompat(): ProyectoCompatContexto {
  const ctx = useContext(ProyectoCompatContext)
  if (!ctx) throw new Error('useProyectoCompat debe usarse dentro de <ProyectoCompatProvider>')
  return ctx
}
