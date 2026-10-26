'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { obtenerSnapshotClientesAction } from '../actions/lecturas-clientes'
import { actualizarClienteAction } from '../actions/core'
import { asociarLeadAClienteAction, convertirLeadEnClienteAction } from '../actions/leads'
import type {
  Cliente,
  Contrato,
  EventoConversionOffline,
  Lead,
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
  proyectos: { listar(): Proyecto[]; porCliente(id: string): Proyecto[] }
  pedidosWeb: { listar(): PedidoWeb[]; porCliente(id: string): PedidoWeb[] }
  obligacionesPendientes: {
    listar(): ObligacionPendiente[]
    porProyecto(id: string): ObligacionPendiente[]
  }
  contratos: { porProyecto(id: string): Contrato | undefined; listar(): Contrato[] }
  /** t-188: conversiones captadas por el sitio. */
  leads: {
    listar(): Lead[]
    porCliente(id: string): Lead[]
    asociarACliente(leadId: string, clienteId: string, proyectoId?: string | null): Promise<Lead | null>
    convertirEnCliente(leadId: string): Promise<Cliente | null>
  }
  eventosConversion: { listar(): EventoConversionOffline[] }
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

/** t-188/t-189: asociar un lead a un cliente (y opcionalmente a un proyecto) existente. */
export function useAsociarLeadMutation() {
  return useMutationOptGenerico<
    ClientesSnapshot,
    { leadId: string; clienteId: string; proyectoId?: string | null },
    Lead | null
  >(
    clientesKeys.all,
    ({ leadId, clienteId, proyectoId }) => asociarLeadAClienteAction({ leadId, clienteId, proyectoId }),
    (snap, { leadId, clienteId, proyectoId }) => ({
      ...snap,
      leads: snap.leads.map((l) =>
        l.id === leadId ? { ...l, clienteId, proyectoId: proyectoId ?? l.proyectoId } : l
      ),
    }),
    (snap, row) => (row ? { ...snap, leads: upsertPorId(snap.leads, row) } : snap),
    {
      revertirOptimista: (actual, { leadId }, previo) => {
        const anterior = previo.leads.find((l) => l.id === leadId)
        return anterior ? { ...actual, leads: upsertPorId(actual.leads, anterior) } : actual
      },
      // t-189: la asociación puede encolar una conversión offline (si el proyecto ya tiene
      // contrato). El lead reconciliado no trae ese evento, así que se refresca el snapshot
      // para que la cola y la etapa se vean sin recargar la página.
      invalidarSiempre: true,
    },
  )
}

/** t-188: crear el cliente a partir del lead y dejarlos asociados (sin optimismo: el id nace en el server). */
export function useConvertirLeadEnClienteMutation() {
  const qc = useQueryClient()
  return useMutation<Cliente | null, Error, { leadId: string }>({
    mutationFn: async ({ leadId }) => convertirLeadEnClienteAction({ leadId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clientesKeys.all })
    },
  })
}

export function ClientesCompatProvider({ children }: { children: ReactNode }) {
  const snapshot = useClientesSnapshot()
  const actualizarCliente = useActualizarClienteMutation()
  const asociarLead = useAsociarLeadMutation()
  const convertirLead = useConvertirLeadEnClienteMutation()
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
        proyectos: {
          listar: () => data.proyectos,
          porCliente: (id) => data.proyectos.filter((p) => p.clienteId === id),
        },
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
          listar: () => data.contratos,
        },
        leads: {
          listar: () => data.leads,
          porCliente: (id) => data.leads.filter((l) => l.clienteId === id),
          asociarACliente: (leadId, clienteId, proyectoId) =>
            asociarLead.mutateAsync({ leadId, clienteId, proyectoId }),
          convertirEnCliente: (leadId) => convertirLead.mutateAsync({ leadId }),
        },
        eventosConversion: { listar: () => data.eventosConversion },
        getVersion: () => version,
      },
    }
  }, [snapshot.data, snapshot.isLoading, actualizarCliente, asociarLead, convertirLead, version])

  return <ClientesCompatContext.Provider value={value}>{children}</ClientesCompatContext.Provider>
}

export function useClientesCompat(): ClientesCompatContexto {
  const ctx = useContext(ClientesCompatContext)
  if (!ctx) throw new Error('useClientesCompat debe usarse dentro de <ClientesCompatProvider>')
  return ctx
}
