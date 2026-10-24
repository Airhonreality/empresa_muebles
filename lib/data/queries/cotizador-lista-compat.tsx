'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  actualizarProyectoAction,
  crearClienteAction,
  crearProyectoAction,
  eliminarProyectoAction,
} from '../actions/core'
import { obtenerSnapshotCotizadorListaAction } from '../actions/lecturas-cotizador-lista'
import type { Cliente, DataStore, Proyecto } from '../contracts'
import { upsertPorId, useMutationOptGenerico } from './factory'
import { COTIZADOR_LISTA_VACIO, type CotizadorListaSnapshot } from './cotizador-lista-types'

export const cotizadorListaKeys = { all: ['cotizador-lista'] as const } as const

export interface CotizadorListaCompatStore {
  proyectos: {
    listar(): Proyecto[]
    crear: DataStore['proyectos']['crear']
    actualizar: DataStore['proyectos']['actualizar']
    eliminar: DataStore['proyectos']['eliminar']
  }
  clientes: {
    listar(): Cliente[]
    crear: DataStore['clientes']['crear']
  }
  getVersion(): number
}

interface CotizadorListaCompatContexto {
  store: CotizadorListaCompatStore
  cargando: boolean
}

const CotizadorListaCompatContext = createContext<CotizadorListaCompatContexto | null>(null)

export function useCotizadorListaSnapshot() {
  return useQuery<CotizadorListaSnapshot>({
    queryKey: cotizadorListaKeys.all,
    queryFn: obtenerSnapshotCotizadorListaAction,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}

export function useCrearProyectoListaMutation() {
  return useMutationOptGenerico<
    CotizadorListaSnapshot,
    Parameters<typeof crearProyectoAction>[0],
    Proyecto
  >(
    cotizadorListaKeys.all,
    (data) => crearProyectoAction(data),
    (snap) => snap,
    (snap, row) => ({ ...snap, proyectos: upsertPorId(snap.proyectos, row) }),
  )
}

export function useActualizarProyectoListaMutation() {
  return useMutationOptGenerico<
    CotizadorListaSnapshot,
    { id: string; partial: Parameters<typeof actualizarProyectoAction>[1] },
    Proyecto | null
  >(
    cotizadorListaKeys.all,
    ({ id, partial }) => actualizarProyectoAction(id, partial),
    (snap, { id, partial }) => ({
      ...snap,
      proyectos: snap.proyectos.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }),
    (snap, row) => (row ? { ...snap, proyectos: upsertPorId(snap.proyectos, row) } : snap),
    {
      revertirOptimista: (actual, { id }, previo) => {
        const anterior = previo.proyectos.find((p) => p.id === id)
        return anterior ? { ...actual, proyectos: upsertPorId(actual.proyectos, anterior) } : actual
      },
    },
  )
}

export function useEliminarProyectoListaMutation() {
  return useMutationOptGenerico<CotizadorListaSnapshot, string, boolean>(
    cotizadorListaKeys.all,
    (id) => eliminarProyectoAction(id),
    (snap, id) => ({ ...snap, proyectos: snap.proyectos.filter((p) => p.id !== id) }),
    undefined,
    {
      invalidarSiempre: true,
      revertirOptimista: (actual, id, previo) => {
        const anterior = previo.proyectos.find((p) => p.id === id)
        return anterior ? { ...actual, proyectos: upsertPorId(actual.proyectos, anterior) } : actual
      },
    },
  )
}

export function useCrearClienteListaMutation() {
  return useMutationOptGenerico<
    CotizadorListaSnapshot,
    Parameters<typeof crearClienteAction>[0],
    Cliente
  >(
    cotizadorListaKeys.all,
    (data) => crearClienteAction(data),
    (snap) => snap,
    (snap, row) => ({ ...snap, clientes: upsertPorId(snap.clientes, row) }),
  )
}

export function CotizadorListaCompatProvider({ children }: { children: ReactNode }) {
  const snapshot = useCotizadorListaSnapshot()
  const crearProyecto = useCrearProyectoListaMutation()
  const actualizarProyecto = useActualizarProyectoListaMutation()
  const eliminarProyecto = useEliminarProyectoListaMutation()
  const crearCliente = useCrearClienteListaMutation()
  const version = snapshot.dataUpdatedAt

  const value = useMemo<CotizadorListaCompatContexto>(() => {
    const data = snapshot.data ?? COTIZADOR_LISTA_VACIO
    return {
      cargando: snapshot.isLoading && !snapshot.data,
      store: {
        proyectos: {
          listar: () => data.proyectos,
          crear: (values) => crearProyecto.mutateAsync(values),
          actualizar: (id, partial) => actualizarProyecto.mutateAsync({ id, partial }),
          eliminar: (id) => eliminarProyecto.mutateAsync(id),
        },
        clientes: {
          listar: () => data.clientes,
          crear: (values) => crearCliente.mutateAsync(values),
        },
        getVersion: () => version,
      },
    }
  }, [snapshot.data, snapshot.isLoading, crearProyecto, actualizarProyecto, eliminarProyecto, crearCliente, version])

  return <CotizadorListaCompatContext.Provider value={value}>{children}</CotizadorListaCompatContext.Provider>
}

export function useCotizadorListaCompat(): CotizadorListaCompatContexto {
  const ctx = useContext(CotizadorListaCompatContext)
  if (!ctx) throw new Error('useCotizadorListaCompat debe usarse dentro de <CotizadorListaCompatProvider>')
  return ctx
}
