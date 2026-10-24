'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  actualizarProductoCatalogoAction,
  crearProductoCatalogoAction,
  eliminarProductoCatalogoAction,
} from '../actions/core'
import { crearProveedorAction } from '../actions/f6'
import { obtenerSnapshotCatalogoAction } from '../actions/lecturas-catalogo'
import type { DataStore, ProductoCatalogo, ProductoTienda, ProductoTiendaComponente, Proveedor } from '../contracts'
import { upsertPorId, useMutationOptGenerico } from './factory'
import { CATALOGO_VACIO, type CatalogoSnapshot } from './catalogo-types'

export const catalogoKeys = { all: ['catalogo', 'snapshot'] as const } as const

export interface CatalogoCompatStore {
  catalogo: {
    listar(): ProductoCatalogo[]
    crear: DataStore['catalogo']['crear']
    actualizar: DataStore['catalogo']['actualizar']
    eliminar: DataStore['catalogo']['eliminar']
  }
  productosTienda: { listar(): ProductoTienda[] }
  productosTiendaComponentes: { porProductoTienda(id: string): ProductoTiendaComponente[] }
  proveedores: {
    listar(): Proveedor[]
    crear(data: Partial<Proveedor> & { nombre: string }): Promise<Proveedor>
  }
  getVersion(): number
}

interface CatalogoCompatContexto {
  store: CatalogoCompatStore
  cargando: boolean
}

const CatalogoCompatContext = createContext<CatalogoCompatContexto | null>(null)

export function useCatalogoSnapshot() {
  return useQuery<CatalogoSnapshot>({
    queryKey: catalogoKeys.all,
    queryFn: obtenerSnapshotCatalogoAction,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}

export function useCrearProductoCatalogoMutation() {
  return useMutationOptGenerico<
    CatalogoSnapshot,
    Parameters<typeof crearProductoCatalogoAction>[0],
    ProductoCatalogo | null
  >(
    catalogoKeys.all,
    (data) => crearProductoCatalogoAction(data),
    (snap) => snap,
    (snap, row) => (row ? { ...snap, catalogo: upsertPorId(snap.catalogo, row) } : snap),
  )
}

export function useActualizarProductoCatalogoMutation() {
  return useMutationOptGenerico<
    CatalogoSnapshot,
    { id: string; patch: Parameters<typeof actualizarProductoCatalogoAction>[1] },
    ProductoCatalogo | null
  >(
    catalogoKeys.all,
    ({ id, patch }) => actualizarProductoCatalogoAction(id, patch),
    (snap, { id, patch }) => ({
      ...snap,
      catalogo: snap.catalogo.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }),
    (snap, row) => (row ? { ...snap, catalogo: upsertPorId(snap.catalogo, row) } : snap),
    {
      revertirOptimista: (actual, { id }, previo) => {
        const anterior = previo.catalogo.find((p) => p.id === id)
        return anterior ? { ...actual, catalogo: upsertPorId(actual.catalogo, anterior) } : actual
      },
    },
  )
}

export function useEliminarProductoCatalogoMutation() {
  return useMutationOptGenerico<CatalogoSnapshot, string, boolean>(
    catalogoKeys.all,
    (id) => eliminarProductoCatalogoAction(id),
    (snap, id) => ({ ...snap, catalogo: snap.catalogo.filter((p) => p.id !== id) }),
    undefined,
    {
      invalidarSiempre: true,
      revertirOptimista: (actual, id, previo) => {
        const anterior = previo.catalogo.find((p) => p.id === id)
        return anterior ? { ...actual, catalogo: upsertPorId(actual.catalogo, anterior) } : actual
      },
    },
  )
}

export function useCrearProveedorCatalogoMutation() {
  return useMutationOptGenerico<
    CatalogoSnapshot,
    Parameters<typeof crearProveedorAction>[0],
    Proveedor
  >(
    catalogoKeys.all,
    (data) => crearProveedorAction(data),
    (snap) => snap,
    (snap, row) => ({ ...snap, proveedores: upsertPorId(snap.proveedores, row) }),
  )
}

export function CatalogoCompatProvider({ children }: { children: ReactNode }) {
  const snapshot = useCatalogoSnapshot()
  const crearProducto = useCrearProductoCatalogoMutation()
  const actualizarProducto = useActualizarProductoCatalogoMutation()
  const eliminarProducto = useEliminarProductoCatalogoMutation()
  const crearProveedor = useCrearProveedorCatalogoMutation()
  const version = snapshot.dataUpdatedAt

  const value = useMemo<CatalogoCompatContexto>(() => {
    const data = snapshot.data ?? CATALOGO_VACIO
    return {
      cargando: snapshot.isLoading && !snapshot.data,
      store: {
        catalogo: {
          listar: () => data.catalogo,
          crear: (values) => crearProducto.mutateAsync(values),
          actualizar: (id, patch) => actualizarProducto.mutateAsync({ id, patch }),
          eliminar: (id) => eliminarProducto.mutateAsync(id),
        },
        productosTienda: { listar: () => data.productosTienda },
        productosTiendaComponentes: {
          porProductoTienda: (id) => data.productosTiendaComponentes.filter((c) => c.productoTiendaId === id),
        },
        proveedores: {
          listar: () => data.proveedores,
          crear: (values) => crearProveedor.mutateAsync(values),
        },
        getVersion: () => version,
      },
    }
  }, [snapshot.data, snapshot.isLoading, crearProducto, actualizarProducto, eliminarProducto, crearProveedor, version])

  return <CatalogoCompatContext.Provider value={value}>{children}</CatalogoCompatContext.Provider>
}

export function useCatalogoCompat(): CatalogoCompatContexto {
  const ctx = useContext(CatalogoCompatContext)
  if (!ctx) throw new Error('useCatalogoCompat debe usarse dentro de <CatalogoCompatProvider>')
  return ctx
}
