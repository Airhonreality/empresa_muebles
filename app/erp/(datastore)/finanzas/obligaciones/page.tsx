'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { DataTable, type DataTableColumn } from '@/components/veta/data-table'
import { CuentaFinancieraModal } from '@/components/veta/cuenta-financiera-modal'
import { MoneyInput, parseMoney } from '@/components/veta/money-input'
import { Modal } from '@/components/veta/modal'
import { useDataStore, type ObligacionPendiente, type OrigenObligacion, type EstadoObligacion, type CuentaFinanciera, type Proveedor, type Cliente, type Proyecto, type Persona } from '@/lib/data'

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const ORIGEN_LABELS: Record<OrigenObligacion, string> = {
  contrato_hito: 'Cobro cliente',
  proveedor: 'Pago proveedor',
  comision: 'Comisión',
  nomina: 'Nómina',
  diseno_3d: 'Diseño 3D',
  arriendo: 'Arriendo',
}

const ESTADO_LABELS: Record<EstadoObligacion, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
  atrasada: 'Atrasada',
}

function getEstadoBadgeTone(estado: EstadoObligacion): 'neutral' | 'warning' | 'info' | 'danger' {
  switch (estado) {
    case 'pagado': return 'info'
    case 'parcial': return 'warning'
    case 'atrasada': return 'danger'
    case 'pendiente':
    default: return 'neutral'
  }
}

const ALERTA_DIAS = 3
const MS_DIA = 24 * 60 * 60 * 1000

export default function ObligacionesPage() {
  const router = useRouter()
  const store = useDataStore()

  const obligacionesRaw = store.obligacionesPendientes.listar()
  const cuentas = store.cuentasFinancieras.listar()
  const proveedores = store.proveedores.listar()
  const clientes = store.clientes.listar()
  const proyectos = store.proyectos.listar()
  const personas = store.personas.listar()

  // Derivados: calcular estado derivado de vencimiento
  const now = Date.now()
  const obligaciones = obligacionesRaw.map(o => {
    const vence = new Date(o.fechaVencimiento).getTime()
    if (o.estado !== 'pagado' && !isNaN(vence) && vence < now) {
      return { ...o, estado: 'atrasada' as EstadoObligacion }
    }
    return o
  })

  const proveedorMap = (() => {
    const m = new Map<string, Proveedor>()
    proveedores.forEach(p => m.set(p.id, p))
    return m
  })()

  const clienteMap = (() => {
    const m = new Map<string, Cliente>()
    clientes.forEach(c => m.set(c.id, c))
    return m
  })()

  const proyectoMap = (() => {
    const m = new Map<string, Proyecto>()
    proyectos.forEach(p => m.set(p.id, p))
    return m
  })()

  const personaMap = (() => {
    const m = new Map<string, Persona>()
    personas.forEach(p => m.set(p.id, p))
    return m
  })()

  // --- Filtros ---
  const [filtroOrigen, setFiltroOrigen] = useState<OrigenObligacion | 'todos'>('todos')
  const [filtroEstado, setFiltroEstado] = useState<EstadoObligacion | 'todos'>('todos')
  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos')

  const obligacionesFiltradas = obligaciones
    .filter(o => {
      if (filtroOrigen !== 'todos' && o.origen !== filtroOrigen) return false
      if (filtroEstado !== 'todos' && o.estado !== filtroEstado) return false
      if (filtroProyecto !== 'todos' && o.proyectoId !== filtroProyecto) return false
      return true
    })
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())

  // --- Registrar pago modal ---
  const [obligacionAPagar, setObligacionAPagar] = useState<ObligacionPendiente | null>(null)
  const [montoPago, setMontoPago] = useState('')
  const [cuentaPago, setCuentaPago] = useState<string>('')
  const [cuentaModalAbierto, setCuentaModalAbierto] = useState(false)

  const handleAbrirPago = (obligacion: ObligacionPendiente) => {
    setObligacionAPagar(obligacion)
    setMontoPago('')
    setCuentaPago(cuentas[0]?.id ?? '')
  }

  const handleRegistrarPago = useCallback(async () => {
    if (!obligacionAPagar || !montoPago.trim()) return
    const montoNum = parseMoney(montoPago)
    if (montoNum <= 0) return

    await store.obligacionesPendientes.registrarPago(obligacionAPagar.id, {
      monto: montoPago,
      cuentaId: cuentaPago,
      medioPago: 'transferencia',
    })
    setObligacionAPagar(null)
    setMontoPago('')
  }, [obligacionAPagar, montoPago, cuentaPago, store])

  const saldoPendiente = (o: ObligacionPendiente): number => {
    return Math.max(0, numDe(o.montoTotal) - numDe(o.montoPagado))
  }

  const columnas: DataTableColumn<ObligacionPendiente>[] = [
    {
      key: 'origen',
      header: 'Origen',
      sortValue: (o) => ORIGEN_LABELS[o.origen],
      render: (o) => (
        <Badge tone="neutral" dot>
          {ORIGEN_LABELS[o.origen]}
        </Badge>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      sortValue: (o) => o.descripcion,
      render: (o) => {
        const prov = o.proveedorId ? proveedorMap.get(o.proveedorId) : null
        const cli = o.clienteId ? clienteMap.get(o.clienteId) : null
        const pers = o.personaId ? personaMap.get(o.personaId) : null
        const proy = o.proyectoId ? proyectoMap.get(o.proyectoId) : null
        return (
          <div>
            <p className="text-text-heading">{o.descripcion}</p>
            {proy && (
              <p className="text-xs text-text-muted">
                {proy.nombreProyecto}
                {prov && ` · ${prov.nombre}`}
                {cli && ` · ${cli.nombre}`}
                {pers && ` · ${pers.nombre}`}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'monto',
      header: 'Monto total',
      align: 'center',
      sortValue: (o) => numDe(o.montoTotal),
      render: (o) => <span className="font-mono">{formatCOP(numDe(o.montoTotal))}</span>,
    },
    {
      key: 'pagado',
      header: 'Pagado',
      align: 'center',
      sortValue: (o) => numDe(o.montoPagado),
      render: (o) => <span className="font-mono">{formatCOP(numDe(o.montoPagado))}</span>,
    },
    {
      key: 'saldo',
      header: 'Saldo',
      align: 'center',
      sortValue: (o) => saldoPendiente(o),
      render: (o) => <span className="font-mono text-text-heading">{formatCOP(saldoPendiente(o))}</span>,
    },
    {
      key: 'vencimiento',
      header: 'Vencimiento',
      align: 'center',
      sortValue: (o) => o.fechaVencimiento,
      render: (o) => (
        <div className="text-xs font-mono text-text-muted">
          {formatDate(o.fechaVencimiento)}
          {venceEnDias(o) <= ALERTA_DIAS && venceEnDias(o) > 0 && (
            <span className="ml-1"><Badge tone="warning" dot>Próxima</Badge></span>
          )}
          {venceEnDias(o) < 0 && o.estado !== 'pagado' && (
            <span className="ml-1"><Badge tone="danger" dot>Vencida</Badge></span>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      sortValue: (o) => ESTADO_LABELS[o.estado],
      render: (o) => (
        <Badge tone={getEstadoBadgeTone(o.estado)} dot>
          {ESTADO_LABELS[o.estado]}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (o) => {
        const puedePagar = o.estado !== 'pagado' && saldoPendiente(o) > 0
        return puedePagar ? (
          <Button variant="secondary" size="md" onClick={() => handleAbrirPago(o)}>
            Registrar pago
          </Button>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        )
      },
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Obligaciones</h1>
          <p className="text-sm text-text-muted mt-1">Cobros, pagos, comisiones y nómina pendientes</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      {/* --- Filtros --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-paper p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Origen</span>
            <select
              value={filtroOrigen}
              onChange={(e) => setFiltroOrigen(e.target.value as typeof filtroOrigen)}
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            >
              <option value="todos">Todos los orígenes</option>
              {Object.entries(ORIGEN_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Estado</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            >
              <option value="todos">Todos los estados</option>
              {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Proyecto</span>
            <select
              value={filtroProyecto}
              onChange={(e) => setFiltroProyecto(e.target.value)}
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            >
              <option value="todos">Todos los proyectos</option>
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>{p.nombreProyecto}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* --- Lista de obligaciones --- */}
      <section className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <DataTable
          rows={obligacionesFiltradas}
          columns={columnas}
          rowKey={(o) => o.id}
          density="compact"
          caption="Obligaciones pendientes"
          empty="Sin obligaciones que coincidan con los filtros."
        />
      </section>

      {/* --- RegistrarPagoModal --- */}
      <Modal
        open={!!obligacionAPagar}
        onClose={() => setObligacionAPagar(null)}
        title="Registrar pago"
      >
        {obligacionAPagar && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-text-heading">{obligacionAPagar.descripcion}</p>
              <p className="text-xs text-text-muted mt-1">
                Origen: {ORIGEN_LABELS[obligacionAPagar.origen]} · Saldo pendiente: {formatCOP(saldoPendiente(obligacionAPagar))}
              </p>
            </div>
            <MoneyInput
              label="Monto a pagar"
              value={montoPago}
              onChange={setMontoPago}
              placeholder="0"
            />
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs text-text-muted">Cuenta*</span>
                <select
                  value={cuentaPago}
                  onChange={(e) => setCuentaPago(e.target.value)}
                  className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                >
                  {cuentas.map((c: CuentaFinanciera) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} — {formatCOP(numDe(c.saldoActual))}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="secondary" size="md" onClick={() => setCuentaModalAbierto(true)}>
                + Nueva
              </Button>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="md" onClick={handleRegistrarPago}>
                Confirmar pago
              </Button>
              <Button variant="ghost" size="md" onClick={() => setObligacionAPagar(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <CuentaFinancieraModal
        open={cuentaModalAbierto}
        onClose={() => setCuentaModalAbierto(false)}
        onSaved={(cuenta) => setCuentaPago(cuenta.id)}
      />
    </div>
  )
}

function numDe(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function venceEnDias(o: ObligacionPendiente): number {
  const hoy = Date.now()
  const vence = new Date(o.fechaVencimiento).getTime()
  if (isNaN(vence)) return Infinity
  return Math.ceil((vence - hoy) / MS_DIA)
}
