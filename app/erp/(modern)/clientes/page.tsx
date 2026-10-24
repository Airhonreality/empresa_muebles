'use client'

import { useMemo, useState } from 'react'
import { LinkButton } from '@/components/veta/button'
import { Busqueda } from '@/components/veta/busqueda'
import { DataTable, type DataTableColumn } from '@/components/veta/data-table'
import { type Cliente } from '@/lib/data'
import { useClientesCompat } from '@/lib/data/queries/clientes-compat'
import { useSmartSearch } from '@/lib/hooks/useSmartSearch'

interface ClienteFila {
  cliente: Cliente
  proyectosCount: number
  obligacionesCount: number
  pedidosCount: number
}

export default function ClientesTableroPage() {
  const { store } = useClientesCompat()
  const version = store.getVersion()

  const [soloConObligaciones, setSoloConObligaciones] = useState(false)

  const filas = useMemo(() => {
    const clientes = store.clientes.listar()
    const proyectos = store.proyectos.listar()
    const obligacionesPorProyecto = new Map<string, number>()
    store.obligacionesPendientes.listar().forEach((o) => {
      if (o.proyectoId) obligacionesPorProyecto.set(o.proyectoId, (obligacionesPorProyecto.get(o.proyectoId) ?? 0) + 1)
    })

    const pedidosPorCliente = new Map<string, number>()
    store.pedidosWeb.listar().forEach((p) => {
      pedidosPorCliente.set(p.clienteId, (pedidosPorCliente.get(p.clienteId) ?? 0) + 1)
    })

    return clientes.map((cliente): ClienteFila => {
      const proyectosCliente = proyectos.filter((p) => p.clienteId === cliente.id)
      const obligacionesCount = proyectosCliente.reduce(
        (acc, p) => acc + (obligacionesPorProyecto.get(p.id) ?? 0),
        0
      )
      return {
        cliente,
        proyectosCount: proyectosCliente.length,
        obligacionesCount,
        pedidosCount: pedidosPorCliente.get(cliente.id) ?? 0,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, version])

  const filasConId = useMemo(() => filas.map((f) => ({ ...f, id: f.cliente.id })), [filas])

  const { query: busqueda, setQuery: setBusqueda, resultado: filasBuscadas } = useSmartSearch({
    items: filasConId,
    getCampos: (f) => [
      f.cliente.nombre ?? '',
      f.cliente.telefono ?? '',
      f.cliente.email ?? '',
      f.cliente.documento ?? '',
      f.cliente.domicilio ?? '',
    ],
    contexto: 'clientes',
    fuzzy: true,
    limite: 500,
  })

  const filasFiltradas = useMemo(() => {
    return filasBuscadas.filter((fila) => {
      if (soloConObligaciones && fila.obligacionesCount === 0) return false
      return true
    })
  }, [filasBuscadas, soloConObligaciones])

  type FilaCliente = (typeof filasFiltradas)[number]

  const columnas: DataTableColumn<FilaCliente>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortValue: (f) => f.cliente.nombre,
      render: (f) => <span className="font-medium text-text-heading">{f.cliente.nombre}</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      sortValue: (f) => f.cliente.telefono,
      render: (f) => <span className="text-text-muted">{f.cliente.telefono || '—'}</span>,
    },
    {
      key: 'email',
      header: 'Correo',
      sortValue: (f) => f.cliente.email,
      render: (f) => <span className="text-text-muted">{f.cliente.email || '—'}</span>,
    },
    {
      key: 'documento',
      header: 'Documento',
      sortValue: (f) => f.cliente.documento,
      render: (f) => <span className="text-text-muted">{f.cliente.documento || '—'}</span>,
    },
    {
      key: 'domicilio',
      header: 'Domicilio',
      sortValue: (f) => f.cliente.domicilio,
      render: (f) => <span className="text-text-muted">{f.cliente.domicilio || '—'}</span>,
    },
    {
      key: 'actividad',
      header: 'Actividad',
      sortValue: (f) => f.proyectosCount,
      render: (f) => (
        <span className="text-xs text-text-muted">
          {f.proyectosCount} proyecto{f.proyectosCount === 1 ? '' : 's'} ·{' '}
          {f.obligacionesCount} obligación{f.obligacionesCount === 1 ? '' : 'es'} pendiente{f.obligacionesCount === 1 ? '' : 's'} ·{' '}
          {f.pedidosCount} pedido{f.pedidosCount === 1 ? '' : 's'} web
        </span>
      ),
    },
    {
      key: 'detalle',
      header: 'Detalle',
      align: 'right',
      render: (f) => (
        <LinkButton href={`/erp/clientes/${f.cliente.id}`} variant="secondary" size="md">
          Ver detalle
        </LinkButton>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-full px-6 py-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Clientes</h1>
          <p className="text-sm text-text-muted">{filas.length} clientes</p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Busqueda
          valor={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre, teléfono o correo..."
          label="Buscar cliente"
          className="w-full max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={soloConObligaciones}
            onChange={(e) => setSoloConObligaciones(e.target.checked)}
            className="h-4 w-4 accent-gold-600"
          />
          Solo con obligaciones pendientes
        </label>
      </div>

      <DataTable
        rows={filasFiltradas}
        columns={columnas}
        rowKey={(f) => f.cliente.id}
        initialSort={{ key: 'nombre', direction: 'asc' }}
        density="spacious"
        caption="Clientes"
        empty={
          <div className="p-4">
            <p className="mb-4 text-text-muted">No hay clientes con estos filtros</p>
            <LinkButton
              href="/erp/clientes"
              variant="ghost"
              size="md"
              onClick={() => {
                setBusqueda('')
                setSoloConObligaciones(false)
              }}
            >
              Limpiar filtros
            </LinkButton>
          </div>
        }
      />
    </div>
  )
}
