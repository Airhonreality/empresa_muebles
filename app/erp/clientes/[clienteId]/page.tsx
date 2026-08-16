'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { LinkButton } from '@/components/veta/button'
import { useDataStore, type EstadoProyecto, type ObligacionPendiente, type PedidoWeb, type Proyecto } from '@/lib/data'
import { formatCurrency } from '@/lib/utils/format'

type TabActiva = 'proyectos' | 'pedidos' | 'obligaciones'

const ESTADO_PROYECTO_LABELS: Partial<Record<EstadoProyecto, string>> = {
  activa: 'Lead',
  enviada: 'Propuesta',
  negociacion: 'En Negociación',
  en_contrato: 'En Contrato',
  retoma: 'Retoma de Medidas',
  pre_produccion: 'Pre-Producción',
  produccion: 'Producción',
  entregado: 'Entregado',
  perdida: 'Perdida',
  cancelada: 'Cancelada',
}

const PROYECTO_BADGE_TONE: Partial<Record<EstadoProyecto, 'neutral' | 'info' | 'warning' | 'danger'>> = {
  activa: 'info',
  enviada: 'info',
  negociacion: 'warning',
  en_contrato: 'info',
  retoma: 'warning',
  pre_produccion: 'warning',
  produccion: 'danger',
  entregado: 'neutral',
  perdida: 'neutral',
  cancelada: 'neutral',
}

const TIPO_PROYECTO_LABELS: Record<string, string> = {
  producto_fijo: 'Producto fijo',
  proyecto_a_medida: 'Proyecto a medida',
  personalizado: 'Proyecto a medida',
  servicio_tecnico: 'Servicio técnico',
}

const PEDIDO_ESTADO_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  enganchado: 'Enganchado',
  cancelado: 'Cancelado',
}

const PEDIDO_BADGE_TONE: Record<string, 'warning' | 'info' | 'neutral'> = {
  nuevo: 'warning',
  enganchado: 'info',
  cancelado: 'neutral',
}

const OBLIGACION_ORIGEN_LABELS: Record<string, string> = {
  contrato_hito: 'Cobro cliente',
  proveedor: 'Pago proveedor',
  comision: 'Comisión',
  nomina: 'Nómina',
  diseno_3d: 'Diseño 3D',
  arriendo: 'Arriendo',
}

const OBLIGACION_ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
  atrasada: 'Atrasada',
}

const OBLIGACION_BADGE_TONE: Record<string, 'warning' | 'info' | 'danger'> = {
  pendiente: 'warning',
  parcial: 'warning',
  pagado: 'info',
  atrasada: 'danger',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const TABS: { key: TabActiva; label: string }[] = [
  { key: 'proyectos', label: 'Proyectos' },
  { key: 'pedidos', label: 'Pedidos web' },
  { key: 'obligaciones', label: 'Obligaciones' },
]

export default function ClienteDetallePage() {
  const params = useParams()
  const store = useDataStore()
  const version = store.getVersion()

  const clienteId = params.clienteId as string
  const [tabActiva, setTabActiva] = useState<TabActiva>('proyectos')

  const cliente = useMemo(() => store.clientes.obtenerPorId(clienteId), [store, clienteId])

  const proyectos = useMemo<Proyecto[]>(
    () => store.proyectos.listar().filter((p) => p.clienteId === clienteId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, clienteId, version]
  )

  const pedidos = useMemo<PedidoWeb[]>(
    () => store.pedidosWeb.porCliente(clienteId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, clienteId, version]
  )

  const obligaciones = useMemo<ObligacionPendiente[]>(() => {
    const porId = new Map<string, ObligacionPendiente>()
    proyectos.forEach((p) => {
      store.obligacionesPendientes.porProyecto(p.id).forEach((o) => {
        if (!porId.has(o.id)) porId.set(o.id, o)
      })
    })
    return Array.from(porId.values())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, proyectos, version])

  if (!cliente) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="rounded-lg border border-border-subtle bg-bg-paper p-8 text-center">
          <p className="text-text-muted mb-4">Cliente no encontrado</p>
          <LinkButton href="/erp/clientes" variant="ghost" size="md">Volver a Clientes</LinkButton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-8">
        <LinkButton href="/erp/clientes" variant="ghost" size="md">← Volver</LinkButton>
        <h1 className="font-display text-3xl font-semibold text-text-heading mt-4">{cliente.nombre}</h1>
        <div className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted mb-1">Teléfono</p>
            <p className="text-text-heading">{cliente.telefono || '(no registrado)'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted mb-1">Correo electrónico</p>
            <p className="text-text-heading">{cliente.email || '(no registrado)'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted mb-1">Documento</p>
            <p className="text-text-heading">{cliente.documento || '(no registrado)'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted mb-1">Domicilio</p>
            <p className="text-text-heading">{cliente.domicilio || '(no registrado)'}</p>
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Secciones del cliente" className="mb-4 flex gap-1 border-b border-border-subtle">
        {TABS.map((tab) => {
          const activa = tabActiva === tab.key
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={activa}
              onClick={() => setTabActiva(tab.key)}
              className={`rounded-t px-4 py-2 text-sm font-medium transition-colors duration-fast ${
                activa
                  ? 'border-b-2 border-gold-500 text-text-heading'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-alt'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {tabActiva === 'proyectos' && (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
          {proyectos.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">Sin proyectos</p>
          ) : (
            <div className="space-y-2">
              {proyectos.map((proyecto) => (
                <div
                  key={proyecto.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-paper p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-heading">{proyecto.nombreProyecto}</p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {TIPO_PROYECTO_LABELS[proyecto.tipoProyecto] ?? proyecto.tipoProyecto}
                      {proyecto.direccionObra ? ` · ${proyecto.direccionObra}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={PROYECTO_BADGE_TONE[proyecto.estado] ?? 'neutral'}>
                      {ESTADO_PROYECTO_LABELS[proyecto.estado] ?? proyecto.estado}
                    </Badge>
                    <LinkButton href={`/erp/cotizador/${proyecto.id}`} variant="secondary" size="md">
                      Abrir en Cotizador
                    </LinkButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tabActiva === 'pedidos' && (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
          {pedidos.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">Sin pedidos web</p>
          ) : (
            <div className="space-y-2">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-paper p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-heading">{formatCurrency(pedido.totalPedido)}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{formatDate(pedido.createdAt)}</p>
                  </div>
                  <Badge tone={PEDIDO_BADGE_TONE[pedido.estado] ?? 'neutral'}>
                    {PEDIDO_ESTADO_LABELS[pedido.estado] ?? pedido.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tabActiva === 'obligaciones' && (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
          {obligaciones.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">Sin obligaciones</p>
          ) : (
            <div className="space-y-2">
              {obligaciones.map((obligacion) => (
                <div
                  key={obligacion.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-paper p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-heading">{obligacion.descripcion}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {OBLIGACION_ORIGEN_LABELS[obligacion.origen] ?? obligacion.origen}
                      {obligacion.fechaVencimiento ? ` · Vence ${formatDate(obligacion.fechaVencimiento)}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-sm text-text-heading">
                      Total: {formatCurrency(obligacion.montoTotal)} · Pagado: {formatCurrency(obligacion.montoPagado)}
                    </p>
                    <Badge tone={OBLIGACION_BADGE_TONE[obligacion.estado] ?? 'neutral'}>
                      {OBLIGACION_ESTADO_LABELS[obligacion.estado] ?? obligacion.estado}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
