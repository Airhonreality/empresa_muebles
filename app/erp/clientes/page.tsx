'use client'

import { useMemo, useState } from 'react'
import { LinkButton } from '@/components/veta/button'
import { useDataStore, type Cliente } from '@/lib/data'

interface ClienteFila {
  cliente: Cliente
  proyectosCount: number
  obligacionesCount: number
  pedidosCount: number
}

export default function ClientesTableroPage() {
  const store = useDataStore()
  const version = store.getVersion()

  const [busqueda, setBusqueda] = useState('')
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

  const filasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return filas.filter((fila) => {
      if (soloConObligaciones && fila.obligacionesCount === 0) return false
      if (!q) return true
      const c = fila.cliente
      return (
        (c.nombre ?? '').toLowerCase().includes(q) ||
        (c.telefono ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
      )
    })
  }, [filas, busqueda, soloConObligaciones])

  return (
    <div className="mx-auto max-w-full px-6 py-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Clientes</h1>
          <p className="text-sm text-text-muted">{filas.length} clientes</p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, teléfono o correo..."
          aria-label="Buscar cliente"
          className="w-full max-w-sm rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
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

      {filasFiltradas.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-bg-paper p-8 text-center">
          <p className="text-text-muted mb-4">No hay clientes con estos filtros</p>
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
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-raised">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-alt/60">
                <th className="px-4 py-3 text-left font-semibold text-text-heading" scope="col">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-text-heading" scope="col">Teléfono</th>
                <th className="px-4 py-3 text-left font-semibold text-text-heading" scope="col">Correo</th>
                <th className="px-4 py-3 text-left font-semibold text-text-heading" scope="col">Documento</th>
                <th className="px-4 py-3 text-left font-semibold text-text-heading" scope="col">Domicilio</th>
                <th className="px-4 py-3 text-left font-semibold text-text-heading" scope="col">Actividad</th>
                <th className="px-4 py-3 text-right font-semibold text-text-heading" scope="col">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map((fila) => (
                <tr key={fila.cliente.id} className="border-b border-border-subtle hover:bg-bg-alt">
                  <td className="px-4 py-3 font-medium text-text-heading">{fila.cliente.nombre}</td>
                  <td className="px-4 py-3 text-text-muted">{fila.cliente.telefono || '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{fila.cliente.email || '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{fila.cliente.documento || '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{fila.cliente.domicilio || '—'}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {fila.proyectosCount} proyecto{fila.proyectosCount === 1 ? '' : 's'} ·{' '}
                    {fila.obligacionesCount} obligación{fila.obligacionesCount === 1 ? '' : 'es'} pendiente{fila.obligacionesCount === 1 ? '' : 's'} ·{' '}
                    {fila.pedidosCount} pedido{fila.pedidosCount === 1 ? '' : 's'} web
                  </td>
                  <td className="px-4 py-3 text-right">
                    <LinkButton
                      href={`/erp/clientes/${fila.cliente.id}`}
                      variant="secondary"
                      size="md"
                    >
                      Ver detalle
                    </LinkButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
