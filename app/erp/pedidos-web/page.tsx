'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { Modal } from '@/components/veta/modal'
import { SmartSearch } from '@/components/veta/smart-search'
import { useDataStore, type PedidoWeb, type Proyecto } from '@/lib/data'

const ESTADOS_PEDIDO = ['nuevo', 'enganchado', 'cancelado'] as const
type EstadoPedido = typeof ESTADOS_PEDIDO[number]

const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  nuevo: 'Nuevo',
  enganchado: 'Enganchado',
  cancelado: 'Cancelado',
}

const BADGE_TONE: Record<EstadoPedido, 'warning' | 'info' | 'neutral'> = {
  nuevo: 'warning',
  enganchado: 'info',
  cancelado: 'neutral',
}

function formatMoney(value: string): string {
  const num = parseInt(value.replace(/[^\d]/g, ''), 10)
  return isNaN(num) ? '$0' : `$${num.toLocaleString('es-CO')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function PedidosWebPage() {
  const store = useDataStore()
  const version = store.getVersion()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pedidos = useMemo(() => store.pedidosWeb.listar(), [store, version])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clientes = useMemo(() => store.clientes.listar(), [store, version])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const proyectos = useMemo(() => store.proyectos.listar(), [store, version])

  const clienteMap = useMemo(() => {
    const map = new Map<string, string>()
    clientes.forEach(c => map.set(c.id, c.nombre))
    return map
  }, [clientes])

  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | ''>('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroTotal, setFiltroTotal] = useState('')

  const pedidosFiltrados = useMemo(() => {
    let resultado = pedidos
    if (filtroEstado) resultado = resultado.filter(p => p.estado === filtroEstado)
    if (filtroCliente) {
      const q = filtroCliente.toLowerCase()
      resultado = resultado.filter(p => {
        const nombre = clienteMap.get(p.clienteId) ?? ''
        return nombre.toLowerCase().includes(q)
      })
    }
    if (filtroTotal) {
      const q = filtroTotal.toLowerCase()
      resultado = resultado.filter(p => p.totalPedido.includes(q) || formatMoney(p.totalPedido).toLowerCase().includes(q))
    }
    return resultado.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [pedidos, filtroEstado, filtroCliente, filtroTotal, clienteMap])

  // --- Enganchar ---
  const [modalEnganchar, setModalEnganchar] = useState<PedidoWeb | null>(null)
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null)
  const [crearNuevoProyecto, setCrearNuevoProyecto] = useState(false)
  const [nuevoProyectoNombre, setNuevoProyectoNombre] = useState('')

  const resetModalEnganchar = () => {
    setModalEnganchar(null)
    setProyectoSeleccionado(null)
    setCrearNuevoProyecto(false)
    setNuevoProyectoNombre('')
  }

  const handleEnganchar = () => {
    if (!modalEnganchar) return

    if (proyectoSeleccionado) {
      store.pedidosWeb.enganchar(modalEnganchar.id, proyectoSeleccionado.id)
    } else if (crearNuevoProyecto && nuevoProyectoNombre.trim()) {
      const nuevo = store.proyectos.crear({
        nombreProyecto: nuevoProyectoNombre.trim(),
        clienteId: modalEnganchar.clienteId,
      })
      store.pedidosWeb.enganchar(modalEnganchar.id, nuevo.id)
    }

    resetModalEnganchar()
  }

  // --- Cancelar ---
  const [modalCancelar, setModalCancelar] = useState<PedidoWeb | null>(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')

  const resetModalCancelar = () => {
    setModalCancelar(null)
    setMotivoCancelacion('')
  }

  const handleCancelar = () => {
    if (!modalCancelar || !motivoCancelacion.trim()) return
    store.pedidosWeb.actualizarEstado(modalCancelar.id, 'cancelado')
    resetModalCancelar()
  }

  const proyectosSmartSearch = proyectos.map(p => ({
    id: p.id,
    sku: p.estado,
    descripcion: p.nombreProyecto,
    categoriaComercial: 'Proyecto',
  }))

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-heading">Pedidos web — Admin</h1>
        <p className="text-sm text-text-muted mt-2">
          Pedidos entrantes desde la tienda. Enganchá los pedidos nuevos a producción o cancelalos si es spam/duplicado.
        </p>
      </header>

      {/* --- Filtros --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="font-semibold text-text-heading text-sm">Filtros</h2>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Estado</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoPedido | '')}
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            >
              <option value="">Todos</option>
              {ESTADOS_PEDIDO.map(estado => (
                <option key={estado} value={estado}>{ETIQUETA_ESTADO[estado]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Cliente</span>
            <input
              type="text"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Buscar cliente..."
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Total</span>
            <input
              type="text"
              value={filtroTotal}
              onChange={(e) => setFiltroTotal(e.target.value)}
              placeholder="Ej. 950"
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {/* --- Tabla --- */}
      <section className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="font-semibold text-text-heading text-sm">
            Pedidos <span className="text-text-muted font-normal">({pedidosFiltrados.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-alt/40">
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-heading">ID</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-heading">Cliente</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-heading">Total</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-heading">Estado</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-heading">Fecha</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-heading">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted italic">
                    No hay pedidos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map(pedido => (
                  <tr key={pedido.id} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-alt/30">
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{pedido.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-text-heading">{clienteMap.get(pedido.clienteId) ?? pedido.clienteId}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-heading">{formatMoney(pedido.totalPedido)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={BADGE_TONE[pedido.estado as EstadoPedido] ?? 'neutral'} dot>
                        {ETIQUETA_ESTADO[pedido.estado as EstadoPedido] ?? pedido.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{formatDate(pedido.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {pedido.estado === 'nuevo' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => {
                              resetModalEnganchar()
                              setModalEnganchar(pedido)
                            }}
                          >
                            Enganchar
                          </Button>
                          <Button
                            variant="destructive"
                            size="md"
                            onClick={() => {
                              resetModalCancelar()
                              setModalCancelar(pedido)
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                      {pedido.estado === 'enganchado' && pedido.proyectoId && (
                        <span className="text-xs text-text-muted">
                          Proyecto: {proyectos.find(p => p.id === pedido.proyectoId)?.nombreProyecto ?? pedido.proyectoId}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Modal Enganchar --- */}
      <Modal
        open={!!modalEnganchar}
        onClose={resetModalEnganchar}
        title="Enganchar pedido a producción"
      >
        <div className="space-y-4">
          {modalEnganchar && (
            <div className="rounded border border-border-subtle bg-bg-alt/40 p-3 text-sm">
              <p className="text-text-heading font-medium">
                Pedido #{modalEnganchar.id.slice(0, 8)} — {formatMoney(modalEnganchar.totalPedido)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Cliente: {clienteMap.get(modalEnganchar.clienteId) ?? modalEnganchar.clienteId}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-heading">Seleccioná un proyecto existente</label>
            {proyectoSeleccionado ? (
              <div className="rounded border border-border-subtle bg-bg-raised p-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-text-heading text-sm">{proyectoSeleccionado.nombreProyecto}</p>
                  <p className="text-xs text-text-muted">Estado: {proyectoSeleccionado.estado}</p>
                </div>
                <Button variant="ghost" size="md" onClick={() => setProyectoSeleccionado(null)}>
                  Quitar
                </Button>
              </div>
            ) : (
              <SmartSearch
                items={proyectosSmartSearch}
                onSelect={(item) => {
                  const proj = proyectos.find(p => p.id === item.id)
                  if (proj) setProyectoSeleccionado(proj)
                }}
                placeholder="Buscar proyecto..."
                label="Proyecto"
                allowCreate={false}
              />
            )}
          </div>

          {!proyectoSeleccionado && (
            <div className="border-t border-border-subtle pt-3 space-y-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setCrearNuevoProyecto(v => !v)}
              >
                {crearNuevoProyecto ? 'Cancelar creación' : 'Crear proyecto nuevo'}
              </Button>
              {crearNuevoProyecto && (
                <div className="space-y-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-text-muted">Nombre del proyecto*</span>
                    <input
                      type="text"
                      value={nuevoProyectoNombre}
                      onChange={(e) => setNuevoProyectoNombre(e.target.value)}
                      placeholder="Ej. Cocina integral López"
                      className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                    />
                  </label>
                  <p className="text-xs text-text-muted">
                    El cliente se asigna automáticamente del pedido.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={resetModalEnganchar}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!proyectoSeleccionado && !(crearNuevoProyecto && nuevoProyectoNombre.trim())}
              onClick={handleEnganchar}
            >
              Enganchar a producción
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- Modal Cancelar --- */}
      <Modal
        open={!!modalCancelar}
        onClose={resetModalCancelar}
        title="Cancelar pedido"
      >
        <div className="space-y-4">
          {modalCancelar && (
            <div className="rounded border border-border-subtle bg-bg-alt/40 p-3 text-sm">
              <p className="text-text-heading font-medium">
                Pedido #{modalCancelar.id.slice(0, 8)} — {formatMoney(modalCancelar.totalPedido)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Cliente: {clienteMap.get(modalCancelar.clienteId) ?? modalCancelar.clienteId}
              </p>
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Motivo de cancelación*</span>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              rows={3}
              placeholder="Ej. Pedido duplicado, spam, cliente solicitó cancelación..."
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={resetModalCancelar}>
              Volver
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={!motivoCancelacion.trim()}
              onClick={handleCancelar}
            >
              Cancelar pedido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
