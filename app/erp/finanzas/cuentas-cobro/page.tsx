'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { MoneyInput } from '@/components/veta/money-input'
import { Modal } from '@/components/veta/modal'
import { useDataStore, type CuentaCobroProveedor, type EstadoCuentaCobro, type Proveedor, type OrdenCompra } from '@/lib/data'

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

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const ESTADO_LABELS: Record<EstadoCuentaCobro, string> = {
  emitida: 'Emitida',
  vinculada: 'Vinculada',
  pagada: 'Pagada',
  anulada: 'Anulada',
}

function getEstadoBadgeTone(estado: EstadoCuentaCobro): 'neutral' | 'warning' | 'info' | 'danger' {
  switch (estado) {
    case 'vinculada': return 'info'
    case 'pagada': return 'info'
    case 'anulada': return 'danger'
    case 'emitida':
    default: return 'neutral'
  }
}

export default function CuentasCobroPage() {
  const router = useRouter()
  const store = useDataStore()

  const cuentasRaw = store.cuentasCobroProveedor.listar()
  const proveedores = store.proveedores.listar()
  const ordenesCompra = store.ordenesCompra.listar()
  const obligaciones = store.obligacionesPendientes.listar()

  const proveedorMap = (() => {
    const m = new Map<string, Proveedor>()
    proveedores.forEach(p => m.set(p.id, p))
    return m
  })()

  const ocsPorProveedor = (() => {
    const m = new Map<string, OrdenCompra[]>()
    ordenesCompra.forEach(oc => {
      if (!m.has(oc.proveedorId)) m.set(oc.proveedorId, [])
      m.get(oc.proveedorId)!.push(oc)
    })
    return m
  })()

  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<EstadoCuentaCobro | 'todos'>('todos')

  const cuentasFiltradas = cuentasRaw
    .filter(c => {
      if (filtroProveedor !== 'todos' && c.proveedorId !== filtroProveedor) return false
      if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [cuentaAVincular, setCuentaAVincular] = useState<CuentaCobroProveedor | null>(null)
  const [cuentaAFactura, setCuentaAFactura] = useState<CuentaCobroProveedor | null>(null)
  const [urlFactura, setUrlFactura] = useState('')
  const [cuentaAAnular, setCuentaAAnular] = useState<CuentaCobroProveedor | null>(null)

  const [formCrear, setFormCrear] = useState({
    proveedorId: '',
    concepto: '',
    valor: '',
    firmaDigital: '',
    fechaEmision: new Date().toISOString().slice(0, 10),
    fechaVencimiento: '',
  })

  const tieneObligacionPagada = useCallback((cuenta: CuentaCobroProveedor): boolean => {
    return obligaciones.some(o => o.proveedorId === cuenta.proveedorId && o.estado === 'pagado')
  }, [obligaciones])

  const handleCrearCuenta = useCallback(() => {
    const result = store.cuentasCobroProveedor.crear({
      proveedorId: formCrear.proveedorId,
      concepto: formCrear.concepto,
      valor: formCrear.valor,
      firmaDigital: formCrear.firmaDigital,
      fechaEmision: formCrear.fechaEmision,
      fechaVencimiento: formCrear.fechaVencimiento || null,
    })

    if (result) {
      setMostrarCrear(false)
      setFormCrear({
        proveedorId: '',
        concepto: '',
        valor: '',
        firmaDigital: '',
        fechaEmision: new Date().toISOString().slice(0, 10),
        fechaVencimiento: '',
      })
    }
  }, [formCrear, store])

  const handleVincularOC = useCallback((cuentaId: string, ocId: string) => {
    store.cuentasCobroProveedor.vincularOC(cuentaId, ocId)
    setCuentaAVincular(null)
  }, [store])

  const handleAdjuntarFactura = useCallback(() => {
    if (!cuentaAFactura || !urlFactura.trim()) return
    store.cuentasCobroProveedor.adjuntarFactura(cuentaAFactura.id, urlFactura.trim())
    setCuentaAFactura(null)
    setUrlFactura('')
  }, [cuentaAFactura, urlFactura, store])

  const handleMarcarPagada = useCallback((id: string) => {
    store.cuentasCobroProveedor.marcarPagada(id)
  }, [store])

  const handleAnular = useCallback(() => {
    if (!cuentaAAnular) return
    store.cuentasCobroProveedor.anular(cuentaAAnular.id)
    setCuentaAAnular(null)
  }, [cuentaAAnular, store])

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Cuentas de cobro</h1>
          <p className="text-sm text-text-muted mt-1">Facturas y cuentas de cobro a proveedores</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-semibold text-text-heading">Cuentas de cobro</h2>
        <Button variant="primary" size="md" onClick={() => setMostrarCrear(true)}>
          + Crear cuenta de cobro
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
        {cuentasFiltradas.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-muted">Sin cuentas de cobro registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-border-subtle text-left px-2 py-2 font-semibold text-text-heading">Proveedor</th>
                  <th className="border-b border-border-subtle text-left px-2 py-2 font-semibold text-text-heading">Concepto</th>
                  <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Valor</th>
                  <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Estado</th>
                  <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Emisión</th>
                  <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Vencimiento</th>
                  <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">OC</th>
                  <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuentasFiltradas.map((cuenta: CuentaCobroProveedor) => {
                  const prov = proveedorMap.get(cuenta.proveedorId)
                  const oc = cuenta.ordenCompraId ? ordenesCompra.find(o => o.id === cuenta.ordenCompraId) : null
                  const puedeMarcarPagada = cuenta.estado === 'vinculada' && tieneObligacionPagada(cuenta)

                  return (
                    <tr key={cuenta.id} className="border-b border-border-subtle/50">
                      <td className="px-2 py-2 text-sm">{prov ? prov.nombre : cuenta.proveedorId}</td>
                      <td className="px-2 py-2 text-text-heading">{cuenta.concepto}</td>
                      <td className="px-2 py-2 text-center font-mono">{formatCOP(numDe(cuenta.valor))}</td>
                      <td className="px-2 py-2 text-center">
                        <Badge tone={getEstadoBadgeTone(cuenta.estado)} dot>
                          {ESTADO_LABELS[cuenta.estado]}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-text-muted">{formatDate(cuenta.fechaEmision)}</td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-text-muted">
                        {cuenta.fechaVencimiento ? formatDate(cuenta.fechaVencimiento) : '—'}
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-mono text-text-muted">
                        {oc ? oc.codigoOrden : '—'}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          {cuenta.estado !== 'anulada' && (
                            <>
                              {!cuenta.ordenCompraId && (
                                <Button
                                  variant="ghost"
                                  size="md"
                                  className="text-xs"
                                  onClick={() => setCuentaAVincular(cuenta)}
                                >
                                  Vincular OC
                                </Button>
                              )}
                              {!cuenta.urlDocumento && (
                                <Button
                                  variant="ghost"
                                  size="md"
                                  className="text-xs"
                                  onClick={() => { setCuentaAFactura(cuenta); setUrlFactura('') }}
                                >
                                  Factura
                                </Button>
                              )}
                              {puedeMarcarPagada && (
                                <Button
                                  variant="secondary"
                                  size="md"
                                  className="text-xs"
                                  onClick={() => handleMarcarPagada(cuenta.id)}
                                >
                                  Marcar pagada
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="md"
                                className="text-xs text-red-600"
                                onClick={() => setCuentaAAnular(cuenta)}
                              >
                                Anular
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={mostrarCrear}
        onClose={() => setMostrarCrear(false)}
        title="Crear cuenta de cobro"
      >
        <div className="space-y-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Proveedor*</span>
            <select
              value={formCrear.proveedorId}
              onChange={(e) => setFormCrear(prev => ({ ...prev, proveedorId: e.target.value }))}
              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            >
              <option value="">Seleccionar proveedor</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Concepto*</span>
            <input
              type="text"
              value={formCrear.concepto}
              onChange={(e) => setFormCrear(prev => ({ ...prev, concepto: e.target.value }))}
              placeholder="Ej. Materiales para cocina"
              className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            />
          </label>
          <MoneyInput
            label="Valor*"
            value={formCrear.valor}
            onChange={(v) => setFormCrear(prev => ({ ...prev, valor: v }))}
            placeholder="0"
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Firma digital*</span>
            <input
              type="text"
              value={formCrear.firmaDigital}
              onChange={(e) => setFormCrear(prev => ({ ...prev, firmaDigital: e.target.value }))}
              placeholder="Firma o hash de autorización"
              className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Fecha emisión*</span>
              <input
                type="date"
                value={formCrear.fechaEmision}
                onChange={(e) => setFormCrear(prev => ({ ...prev, fechaEmision: e.target.value }))}
                className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Fecha vencimiento</span>
              <input
                type="date"
                value={formCrear.fechaVencimiento}
                onChange={(e) => setFormCrear(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" size="md" onClick={handleCrearCuenta}>
              Crear cuenta
            </Button>
            <Button variant="ghost" size="md" onClick={() => setMostrarCrear(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!cuentaAVincular}
        onClose={() => setCuentaAVincular(null)}
        title="Vincular orden de compra"
      >
        {cuentaAVincular && (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-text-muted">
              Cuenta de cobro para: {proveedorMap.get(cuentaAVincular.proveedorId)?.nombre || '—'}
            </p>
            <p className="text-xs text-text-muted">
              Concepto: {cuentaAVincular.concepto}
            </p>
            <div className="space-y-2">
              <span className="text-xs text-text-muted">Órdenes de compra del mismo proveedor:</span>
              {(ocsPorProveedor.get(cuentaAVincular.proveedorId) ?? []).map((oc: OrdenCompra) => (
                <div key={oc.id} className="rounded border border-border-subtle bg-bg-paper p-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-heading">{oc.codigoOrden}</p>
                    <p className="text-xs text-text-muted">
                      {formatCOP(numDe(oc.montoTotal))} · {formatDate(oc.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleVincularOC(cuentaAVincular.id, oc.id)}
                  >
                    Vincular
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="md" onClick={() => setCuentaAVincular(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!cuentaAFactura}
        onClose={() => setCuentaAFactura(null)}
        title="Adjuntar factura electrónica"
      >
        {cuentaAFactura && (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-text-muted">
              La factura se recibe por correo o la emite el contador en Aliado. Pegue la URL del documento.
            </p>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">URL del documento*</span>
              <input
                type="url"
                value={urlFactura}
                onChange={(e) => setUrlFactura(e.target.value)}
                placeholder="https://..."
                className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="md" onClick={handleAdjuntarFactura} disabled={!urlFactura.trim()}>
                Adjuntar
              </Button>
              <Button variant="ghost" size="md" onClick={() => setCuentaAFactura(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!cuentaAAnular}
        onClose={() => setCuentaAAnular(null)}
        title="Anular cuenta de cobro"
      >
        {cuentaAAnular && (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-text-muted">
              ¿Anular la cuenta de cobro &quot;{cuentaAAnular.concepto}&quot; por {formatCOP(numDe(cuentaAAnular.valor))}? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" size="md" onClick={handleAnular}>
                Anular
              </Button>
              <Button variant="ghost" size="md" onClick={() => setCuentaAAnular(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
