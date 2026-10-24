'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { DataTable, type DataTableColumn } from '@/components/veta/data-table'
import { Modal } from '@/components/veta/modal'
import { MoneyInput } from '@/components/veta/money-input'
import { SmartSearch } from '@/components/veta/smart-search'
import { ProveedorFormModal } from '@/components/veta/proveedor-form-modal'
import { useDataStore, type EstadoOrdenCompra, type MecanicaPagoOC, type OrdenCompra, type Proyecto, type Proveedor } from '@/lib/data'
import { puedeCrearOrdenCompra } from '@/lib/modules/f4/gates'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function numDe(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const ESTADO_LABELS: Record<EstadoOrdenCompra, string> = {
  solicitada: 'Solicitada',
  aprobada: 'Aprobada',
  en_pago: 'En pago',
  pagada: 'Pagada',
  recibida_verificada: 'Recibida verificada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
}

const MECANICA_LABELS: Record<MecanicaPagoOC, string> = {
  anticipo_saldo: 'Anticipo + saldo',
  unico: 'Pago único',
  subcontratacion: 'Subcontratación',
}

function getEstadoBadgeTone(estado: EstadoOrdenCompra): 'neutral' | 'warning' | 'info' | 'danger' {
  switch (estado) {
    case 'solicitada': return 'neutral'
    case 'aprobada': return 'info'
    case 'en_pago': return 'warning'
    case 'pagada': return 'info'
    case 'recibida_verificada': return 'info'
    case 'rechazada': return 'danger'
    case 'cancelada': return 'danger'
    default: return 'neutral'
  }
}

const ROLES_FLUJO_APROBACION = ['admin', 'finanzas']

interface FormNuevaOrden {
  proyectoId: string
  proveedorId: string
  montoTotal: string
  anticipoMonto: string
  mecanicaPago: MecanicaPagoOC
  fechaEsperada: string
}

const FORM_INICIAL: FormNuevaOrden = {
  proyectoId: '',
  proveedorId: '',
  montoTotal: '',
  anticipoMonto: '',
  mecanicaPago: 'unico',
  fechaEsperada: '',
}

export default function ComprasPage() {
  const router = useRouter()
  const store = useDataStore()

  const ordenes = store.ordenesCompra.listar()
  const proveedores = store.proveedores.listar()
  const proyectos = store.proyectos.listar()
  const registrosGate = store.registrosGateCaja.listar()
  const usuario = store.auth.usuarioActual()

  const proveedorMap = (() => {
    const m = new Map<string, Proveedor>()
    proveedores.forEach(p => m.set(p.id, p))
    return m
  })()

  const proyectoMap = (() => {
    const m = new Map<string, Proyecto>()
    proyectos.forEach(p => m.set(p.id, p))
    return m
  })()

  const bloqueosPorOrden = (() => {
    const m = new Map<string, boolean>()
    registrosGate.forEach(r => {
      if (r.bloqueado) m.set(r.ordenCompraId, true)
    })
    return m
  })()

  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<EstadoOrdenCompra | 'todos'>('todos')

  const ordenesFiltradas = ordenes
    .filter(o => {
      if (filtroProveedor !== 'todos' && o.proveedorId !== filtroProveedor) return false
      if (filtroEstado !== 'todos' && o.estado !== filtroEstado) return false
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [formNueva, setFormNueva] = useState<FormNuevaOrden>(FORM_INICIAL)

  const [mostrarNuevoProveedor, setMostrarNuevoProveedor] = useState(false)

  const [ordenARechazar, setOrdenARechazar] = useState<OrdenCompra | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [ordenACancelar, setOrdenACancelar] = useState<OrdenCompra | null>(null)

  const proyectoSel = formNueva.proyectoId ? proyectoMap.get(formNueva.proyectoId) ?? null : null
  const verificacionesProyecto = formNueva.proyectoId ? store.verificaciones.porProyecto(formNueva.proyectoId) : []
  const guardCrearOk = puedeCrearOrdenCompra(proyectoSel, verificacionesProyecto)

  const montoNum = numDe(formNueva.montoTotal)
  const anticipoNum = numDe(formNueva.anticipoMonto)
  const anticipoValido =
    formNueva.mecanicaPago !== 'anticipo_saldo' ||
    (anticipoNum > 0 && anticipoNum <= montoNum)

  const puedeCrear =
    formNueva.proveedorId !== '' &&
    montoNum > 0 &&
    guardCrearOk &&
    anticipoValido

  const { guard: guardCrearOrden, isPending: creandoOrden } = usePendingGuard()

  const handleCrearOrden = useCallback(async () => {
    if (!puedeCrear) return
    const result = await store.ordenesCompra.crear({
      proveedorId: formNueva.proveedorId,
      proyectoId: formNueva.proyectoId || null,
      montoTotal: formNueva.montoTotal,
      anticipoMonto: formNueva.mecanicaPago === 'anticipo_saldo' ? formNueva.anticipoMonto : null,
      mecanicaPago: formNueva.mecanicaPago,
      fechaRecepcionEsperada: formNueva.fechaEsperada || null,
    })
    if (result) {
      setMostrarCrear(false)
      setFormNueva(FORM_INICIAL)
    }
  }, [formNueva, puedeCrear, store])

  const handleAprobar = useCallback(async (orden: OrdenCompra) => {
    await store.ordenesCompra.actualizarEstado(orden.id, 'aprobada')
  }, [store])

  const handleEnviarAPago = useCallback(async (orden: OrdenCompra) => {
    await store.ordenesCompra.actualizarEstado(orden.id, 'en_pago')
  }, [store])

  const handleRechazar = useCallback(async () => {
    if (!ordenARechazar || !motivoRechazo.trim()) return
    await store.ordenesCompra.actualizarEstado(ordenARechazar.id, 'rechazada')
    setOrdenARechazar(null)
    setMotivoRechazo('')
  }, [ordenARechazar, motivoRechazo, store])

  const handleCancelar = useCallback(async () => {
    if (!ordenACancelar) return
    await store.ordenesCompra.actualizarEstado(ordenACancelar.id, 'cancelada')
    setOrdenACancelar(null)
  }, [ordenACancelar, store])

  const usuarioPuedeFlujo = ROLES_FLUJO_APROBACION.includes(usuario.rol)

  const columnas: DataTableColumn<OrdenCompra>[] = [
    {
      key: 'codigo',
      header: 'Código',
      sortValue: (o) => o.codigoOrden,
      render: (o) => <span className="font-mono text-xs text-text-muted">{o.codigoOrden}</span>,
    },
    {
      key: 'proveedor',
      header: 'Proveedor',
      sortValue: (o) => proveedorMap.get(o.proveedorId)?.nombre ?? o.proveedorId,
      render: (o) => {
        const prov = proveedorMap.get(o.proveedorId)
        return prov ? (
          <Link href={`/erp/compras/proveedores/${prov.id}`} className="text-brand hover:underline">
            {prov.nombre}
          </Link>
        ) : o.proveedorId
      },
    },
    {
      key: 'proyecto',
      header: 'Proyecto',
      sortValue: (o) => (o.proyectoId ? proyectoMap.get(o.proyectoId)?.nombreProyecto ?? '' : ''),
      render: (o) => {
        const proy = o.proyectoId ? proyectoMap.get(o.proyectoId) : undefined
        return proy ? proy.nombreProyecto : <span className="text-text-muted">Operativa</span>
      },
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'center',
      sortValue: (o) => numDe(o.montoTotal),
      render: (o) => <span className="font-mono">{formatCOP(numDe(o.montoTotal))}</span>,
    },
    {
      key: 'mecanica',
      header: 'Mecánica de pago',
      align: 'center',
      sortValue: (o) => MECANICA_LABELS[o.mecanicaPago],
      render: (o) => <span className="text-xs text-text-muted">{MECANICA_LABELS[o.mecanicaPago]}</span>,
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
      key: 'caja',
      header: 'Caja',
      align: 'center',
      sortValue: (o) => (bloqueosPorOrden.get(o.id) ? 1 : 0),
      render: (o) => bloqueosPorOrden.get(o.id) ? (
        <Badge tone="warning" dot>Bloqueada por caja</Badge>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (o) => {
        const estadoAvanzado = o.estado === 'pagada' || o.estado === 'recibida_verificada'
        return (
          <div className="flex items-center gap-1 justify-center flex-wrap">
            {o.estado === 'solicitada' && (
              <>
                {usuarioPuedeFlujo && (
                  <Button variant="secondary" size="md" className="text-xs" onClick={() => handleAprobar(o)}>
                    Aprobar
                  </Button>
                )}
                <Button variant="ghost" size="md" className="text-xs" onClick={() => { setOrdenARechazar(o); setMotivoRechazo('') }}>
                  Rechazar
                </Button>
                <Button variant="ghost" size="md" className="text-xs text-red-600" onClick={() => setOrdenACancelar(o)}>
                  Cancelar
                </Button>
              </>
            )}
            {o.estado === 'aprobada' && (
              <>
                {usuarioPuedeFlujo && (
                  <Button variant="secondary" size="md" className="text-xs" onClick={() => handleEnviarAPago(o)}>
                    Enviar a pago
                  </Button>
                )}
                <Button variant="ghost" size="md" className="text-xs" onClick={() => { setOrdenARechazar(o); setMotivoRechazo('') }}>
                  Rechazar
                </Button>
                <Button variant="ghost" size="md" className="text-xs text-red-600" onClick={() => setOrdenACancelar(o)}>
                  Cancelar
                </Button>
              </>
            )}
            {o.estado === 'en_pago' && (
              <Button variant="ghost" size="md" className="text-xs text-red-600" onClick={() => setOrdenACancelar(o)}>
                Cancelar
              </Button>
            )}
            {estadoAvanzado && (
              <Button variant="secondary" size="md" className="text-xs" onClick={() => router.push(`/erp/compras/${o.id}/recepcion`)}>
                {o.estado === 'pagada' ? 'Registrar recepción' : 'Ver recepción'}
              </Button>
            )}
            <Button variant="ghost" size="md" className="text-xs" onClick={() => router.push(`/erp/compras/${o.id}`)}>
              Ver detalle
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Compras</h1>
          <p className="text-sm text-text-muted mt-1">Órdenes de compra y recepción de material</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-semibold text-text-heading">Órdenes de compra</h2>
        <Button variant="primary" size="md" onClick={() => setMostrarCrear(true)}>
          + Nueva orden de compra
        </Button>
      </div>

      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-paper p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Proveedor</span>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            >
              <option value="todos">Todos los proveedores</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
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
        </div>
      </section>

      <section className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <DataTable
          rows={ordenesFiltradas}
          columns={columnas}
          rowKey={(o) => o.id}
          density="compact"
          caption="Órdenes de compra"
          empty="Sin órdenes de compra registradas."
        />
      </section>

      <Modal
        open={mostrarCrear}
        onClose={() => setMostrarCrear(false)}
        title="Nueva orden de compra"
      >
        <div className="space-y-3 text-sm">
          <div className="space-y-2">
            <span className="text-xs text-text-muted">Proyecto (opcional)</span>
            {formNueva.proyectoId ? (
              <div className="rounded border border-border-subtle bg-bg-paper p-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-text-heading">{proyectoSel?.nombreProyecto ?? formNueva.proyectoId}</p>
                  <p className="text-xs text-text-muted">Orden de compra de proyecto</p>
                </div>
                <Button variant="ghost" size="md" onClick={() => setFormNueva(prev => ({ ...prev, proyectoId: '' }))}>
                  Quitar
                </Button>
              </div>
            ) : (
              <>
                <SmartSearch
                  items={proyectos.map(p => ({
                    id: p.id,
                    sku: p.estado,
                    descripcion: p.nombreProyecto,
                    categoriaComercial: 'Proyecto',
                  }))}
                  onSelect={(item) => setFormNueva(prev => ({ ...prev, proyectoId: item.id }))}
                  placeholder="Buscar proyecto..."
                  label="Proyecto"
                  allowCreate={false}
                />
                <p className="text-xs text-text-muted">Compra operativa si no se selecciona proyecto.</p>
              </>
            )}
          </div>

          {formNueva.proyectoId && !guardCrearOk && (
            <div role="alert" className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Este proyecto no tiene el schema aprobado (guard E-18). Una orden de compra de proyecto requiere la
              verificación aprobada del verificador único antes de poder crearse.
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs text-text-muted">Proveedor*</span>
            {formNueva.proveedorId ? (
              <div className="rounded border border-border-subtle bg-bg-paper p-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-text-heading">{proveedorMap.get(formNueva.proveedorId)?.nombre ?? formNueva.proveedorId}</p>
                  <p className="text-xs text-text-muted">Proveedor seleccionado</p>
                </div>
                <Button variant="ghost" size="md" onClick={() => setFormNueva(prev => ({ ...prev, proveedorId: '' }))}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <SmartSearch
                items={proveedores.map(p => ({
                  id: p.id,
                  sku: p.nit ?? p.nombre,
                  descripcion: p.nombre,
                  categoriaComercial: p.ciudad ?? 'Proveedor',
                }))}
                onSelect={(item) => setFormNueva(prev => ({ ...prev, proveedorId: item.id }))}
                placeholder="Buscar proveedor..."
                label="Proveedor"
                allowCreate={false}
              />
            )}
            <Button variant="ghost" size="md" className="text-xs" onClick={() => setMostrarNuevoProveedor(true)}>
              + Nuevo proveedor
            </Button>
          </div>

          <MoneyInput
            label="Monto total*"
            value={formNueva.montoTotal}
            onChange={(v) => setFormNueva(prev => ({ ...prev, montoTotal: v }))}
            placeholder="0"
          />

          <div className="space-y-1">
            <span className="text-xs text-text-muted">Mecánica de pago*</span>
            <div className="flex flex-col gap-1 text-sm">
              {(Object.keys(MECANICA_LABELS) as MecanicaPagoOC[]).map((clave) => (
                <label key={clave} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mecanicaPago"
                    checked={formNueva.mecanicaPago === clave}
                    onChange={() => setFormNueva(prev => ({ ...prev, mecanicaPago: clave }))}
                    className="accent-gold-600"
                  />
                  <span className="text-text-heading">{MECANICA_LABELS[clave]}</span>
                </label>
              ))}
            </div>
          </div>

          {formNueva.mecanicaPago === 'anticipo_saldo' && (
            <>
              <MoneyInput
                label="Anticipo*"
                value={formNueva.anticipoMonto}
                onChange={(v) => setFormNueva(prev => ({ ...prev, anticipoMonto: v }))}
                placeholder="0"
              />
              {formNueva.mecanicaPago === 'anticipo_saldo' && anticipoNum > 0 && anticipoNum > montoNum && (
                <p role="alert" className="text-xs text-red-600">
                  El anticipo no puede superar el monto total.
                </p>
              )}
            </>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Fecha esperada de recepción</span>
            <input
              type="date"
              value={formNueva.fechaEsperada}
              onChange={(e) => setFormNueva(prev => ({ ...prev, fechaEsperada: e.target.value }))}
              className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            />
          </label>

          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => guardCrearOrden(handleCrearOrden)}
              disabled={!puedeCrear || creandoOrden}
              loading={creandoOrden}
            >
              Crear orden de compra
            </Button>
            <Button variant="ghost" size="md" onClick={() => setMostrarCrear(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {mostrarNuevoProveedor && (
        <ProveedorFormModal
          open={true}
          onClose={() => setMostrarNuevoProveedor(false)}
          onSaved={(nuevo) => setFormNueva(prev => ({ ...prev, proveedorId: nuevo.id }))}
        />
      )}

      <Modal
        open={!!ordenARechazar}
        onClose={() => setOrdenARechazar(null)}
        title="Rechazar orden de compra"
      >
        {ordenARechazar && (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-text-muted">
              ¿Rechazar la orden de compra &quot;{ordenARechazar.codigoOrden}&quot; de{' '}
              {proveedorMap.get(ordenARechazar.proveedorId)?.nombre ?? '—'}?
            </p>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Motivo del rechazo*</span>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={3}
                placeholder="Explique por qué se rechaza esta orden de compra"
                className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" size="md" onClick={handleRechazar} disabled={!motivoRechazo.trim()}>
                Rechazar
              </Button>
              <Button variant="ghost" size="md" onClick={() => setOrdenARechazar(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!ordenACancelar}
        onClose={() => setOrdenACancelar(null)}
        title="Cancelar orden de compra"
      >
        {ordenACancelar && (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-text-muted">
              ¿Cancelar la orden de compra &quot;{ordenACancelar.codigoOrden}&quot; por{' '}
              {formatCOP(numDe(ordenACancelar.montoTotal))}? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" size="md" onClick={handleCancelar}>
                Cancelar orden de compra
              </Button>
              <Button variant="ghost" size="md" onClick={() => setOrdenACancelar(null)}>
                Volver
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
