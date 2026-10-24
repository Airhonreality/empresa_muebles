'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { obtenerSnapshotClientesAction } from '../actions/lecturas-clientes'
import { actualizarClienteAction } from '../actions/core'
import type {
  Cliente,
  Contrato,
  ObligacionPendiente,
  PedidoWeb,
  Proyecto,
} from '../contracts'
import { upsertPorId, useMutationOptGenerico } from './factory'
import { CLIENTES_VACIO, type ClientesSnapshot } from './clientes-types'

export const clientesKeys = { all: ['clientes', 'snapshot'] as const } as const

export interface ClientesCompatStore {
  clientes: {
    listar(): Cliente[]
    obtenerPorId(id: string): Cliente | undefined
    actualizar(id: string, partial: Partial<Pick<Cliente, 'nombre' | 'documento' | 'telefono' | 'email' | 'domicilio'>>): Promise<Cliente | null>
  }
  proyectos: { listar(): Proyecto[] }
  pedidosWeb: { listar(): PedidoWeb[]; porCliente(id: string): PedidoWeb[] }
  obligacionesPendientes: {
    listar(): ObligacionPendiente[]
    porProyecto(id: string): ObligacionPendiente[]
  }
  contratos: { porProyecto(id: string): Contrato | undefined }
  getVersion(): number
}

interface ClientesCompatContexto {
  store: ClientesCompatStore
  cargando: boolean
}

const ClientesCompatContext = createContext<ClientesCompatContexto | null>(null)

export function useClientesSnapshot() {
  return useQuery<ClientesSnapshot>({
    queryKey: clientesKeys.all,
    queryFn: obtenerSnapshotClientesAction,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}

export function useActualizarClienteMutation() {
  return useMutationOptGenerico<
    ClientesSnapshot,
    { id: string; patch: Partial<Pick<Cliente, 'nombre' | 'documento' | 'telefono' | 'email' | 'domicilio'>> },
    Cliente | null
  >(
    clientesKeys.all,
    ({ id, patch }) => actualizarClienteAction(id, patch),
    (snap, { id, patch }) => ({
      ...snap,
      clientes: snap.clientes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }),
    (snap, row) => (row ? { ...snap, clientes: upsertPorId(snap.clientes, row) } : snap),
    {
      revertirOptimista: (actual, { id }, previo) => {
        const anterior = previo.clientes.find((c) => c.id === id)
        return anterior ? { ...actual, clientes: upsertPorId(actual.clientes, anterior) } : actual
      },
    },
  )
}

export function ClientesCompatProvider({ children }: { children: ReactNode }) {
  const snapshot = useClientesSnapshot()
  const actualizarCliente = useActualizarClienteMutation()
  const version = snapshot.dataUpdatedAt

  const value = useMemo<ClientesCompatContexto>(() => {
    const data = snapshot.data ?? CLIENTES_VACIO
    return {
      cargando: snapshot.isLoading && !snapshot.data,
      store: {
        clientes: {
          listar: () => data.clientes,
          obtenerPorId: (id) => data.clientes.find((c) => c.id === id),
          actualizar: (id, patch) => actualizarCliente.mutateAsync({ id, patch }),
        },
        proyectos: { listar: () => data.proyectos },
        pedidosWeb: {
          listar: () => data.pedidos,
          porCliente: (id) => data.pedidos.filter((p) => p.clienteId === id),
        },
        obligacionesPendientes: {
          listar: () => data.obligaciones,
          porProyecto: (id) => data.obligaciones.filter((o) => o.proyectoId === id),
        },
        contratos: {
          porProyecto: (id) => data.contratos.find((c) => c.proyectoId === id),
        },
        getVersion: () => version,
      },
    }
  }, [snapshot.data, snapshot.isLoading, actualizarCliente, version])

  return <ClientesCompatContext.Provider value={value}>{children}</ClientesCompatContext.Provider>
}

export function useClientesCompat(): ClientesCompatContexto {
  const ctx = useContext(ClientesCompatContext)
  if (!ctx) throw new Error('useClientesCompat debe usarse dentro de <ClientesCompatProvider>')
  return ctx
}
