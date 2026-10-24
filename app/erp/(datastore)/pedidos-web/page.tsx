'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { Busqueda } from '@/components/veta/busqueda'
import { DataTable, type DataTableColumn } from '@/components/veta/data-table'
import { Modal } from '@/components/veta/modal'
import { SmartSearch } from '@/components/veta/smart-search'
import { useDataStore, type PedidoWeb, type Proyecto } from '@/lib/data'
import { coincide } from '@/lib/search/normalizar'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

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
      resultado = resultado.filter(p => {
        const nombre = clienteMap.get(p.clienteId) ?? ''
        return coincide(filtroCliente, [nombre, p.id])
      })
    }
    if (filtroTotal) {
      resultado = resultado.filter(p =>
        coincide(filtroTotal, [p.totalPedido, formatMoney(p.totalPedido)])
      )
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

  const { guard: guardEnganchar, isPending: enganchando } = usePendingGuard()

  const handleEnganchar = async () => {
    if (!modalEnganchar) return

    if (proyectoSeleccionado) {
      await store.pedidosWeb.enganchar(modalEnganchar.id, proyectoSeleccionado.id)
    } else if (crearNuevoProyecto && nuevoProyectoNombre.trim()) {
      const nuevo = await store.proyectos.crear({
        nombreProyecto: nuevoProyectoNombre.trim(),
        clienteId: modalEnganchar.clienteId,
      })
      await store.pedidosWeb.enganchar(modalEnganchar.id, nuevo.id)
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

  const handleCancelar = async () => {
    if (!modalCancelar || !motivoCancelacion.trim()) return
    await store.pedidosWeb.actualizarEstado(modalCancelar.id, 'cancelado')
    resetModalCancelar()
  }

  const proyectosSmartSearch = proyectos.map(p => ({
    id: p.id,
    sku: p.estado,
    descripcion: p.nombreProyecto,
    categoriaComercial: 'Proyecto',
  }))

  const columnas: DataTableColumn<PedidoWeb>[] = [
    {
      key: 'id',
      header: 'ID',
      sortValue: (p) => p.id,
      render: (p) => <span className="font-mono text-xs text-text-muted">{p.id.slice(0, 8)}</span>,
    },
    {
      key: 'cliente',
      header: 'Cliente',
      sortValue: (p) => clienteMap.get(p.clienteId) ?? p.clienteId,
      render: (p) => <span className="text-text-heading">{clienteMap.get(p.clienteId) ?? p.clienteId}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortValue: (p) => parseInt(p.totalPedido.replace(/[^\d]/g, ''), 10) || 0,
      render: (p) => <span className="font-mono text-text-heading">{formatMoney(p.totalPedido)}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      sortValue: (p) => ETIQUETA_ESTADO[p.estado as EstadoPedido] ?? p.estado,
      render: (p) => (
        <Badge tone={BADGE_TONE[p.estado as EstadoPedido] ?? 'neutral'} dot>
          {ETIQUETA_ESTADO[p.estado as EstadoPedido] ?? p.estado}
        </Badge>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      sortValue: (p) => p.createdAt,
      render: (p) => <span className="text-xs text-text-muted">{formatDate(p.createdAt)}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          {p.estado === 'nuevo' && (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  resetModalEnganchar()
                  setModalEnganchar(p)
                }}
              >
                Enganchar
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={() => {
                  resetModalCancelar()
                  setModalCancelar(p)
                }}
              >
                Cancelar
              </Button>
            </>
          )}
          {p.estado === 'enganchado' && p.proyectoId && (
            <span className="text-xs text-text-muted">
              Proyecto: {proyectos.find(pr => pr.id === p.proyectoId)?.nombreProyecto ?? p.proyectoId}
            </span>
          )}
        </div>
      ),
    },
  ]

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
          <Busqueda
            valor={filtroCliente}
            onChange={setFiltroCliente}
            placeholder="Buscar cliente..."
            label="Buscar por cliente"
            className="w-56"
          />
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
        <DataTable
          rows={pedidosFiltrados}
          columns={columnas}
          rowKey={(p) => p.id}
          initialSort={{ key: 'fecha', direction: 'desc' }}
          density="spacious"
          caption="Pedidos web"
          empty="No hay pedidos con los filtros seleccionados."
        />
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
              disabled={(!proyectoSeleccionado && !(crearNuevoProyecto && nuevoProyectoNombre.trim())) || enganchando}
              loading={enganchando}
              onClick={() => guardEnganchar(handleEnganchar)}
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
