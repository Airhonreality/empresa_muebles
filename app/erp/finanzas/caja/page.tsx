'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore, type CuentaFinanciera, type MovimientoFinanciero, type Proveedor, type OrdenCompra, type RegistroGateCaja } from '@/lib/data'
import { calcularCajaDisponible } from '@/lib/modules/f4f5f6/gates'

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

function numDe(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function getEstadoOcBadge(estado: OrdenCompra['estado']): 'neutral' | 'warning' | 'info' | 'danger' {
  switch (estado) {
    case 'en_pago': return 'warning'
    case 'pagada': return 'info'
    case 'aprobada': return 'info'
    case 'recibida_verificada': return 'info'
    case 'rechazada': return 'danger'
    case 'cancelada': return 'danger'
    case 'solicitada': return 'neutral'
    default: return 'neutral'
  }
}

function getEstadoOcLabel(estado: OrdenCompra['estado']): string {
  const map: Record<OrdenCompra['estado'], string> = {
    solicitada: 'Solicitada',
    aprobada: 'Aprobada',
    en_pago: 'En pago',
    pagada: 'Pagada',
    recibida_verificada: 'Recibida',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
  }
  return map[estado] ?? estado
}

function origenLabel(origen: MovimientoFinanciero['tipo']): string {
  return origen === 'debito' ? 'Egreso' : 'Ingreso'
}

export default function CajaPage() {
  const router = useRouter()
  const store = useDataStore()

  const cuentas = store.cuentasFinancieras.listar()
  const movimientos = store.movimientosFinancieros.listar()
  const obligaciones = store.obligacionesPendientes.listar()
  const ordenesCompra = store.ordenesCompra.listar()
  const proveedores = store.proveedores.listar()
  const registrosGate = store.registrosGateCaja.listar()

  const cajaDisponible = calcularCajaDisponible(cuentas, obligaciones)

  const ocEnPago = ordenesCompra
    .filter(o => o.estado === 'en_pago')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const proveedorMap = (() => {
    const m = new Map<string, Proveedor>()
    proveedores.forEach(p => m.set(p.id, p))
    return m
  })()

  // --- Libro mayor filters ---
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'debito' | 'credito'>('todos')
  const [filtroCuenta, setFiltroCuenta] = useState<string>('todos')

  let movimientosFiltrados = movimientos
  if (filtroTipo !== 'todos') movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === filtroTipo)
  if (filtroCuenta !== 'todos') movimientosFiltrados = movimientosFiltrados.filter(m => m.cuentaOrigenId === filtroCuenta || m.cuentaDestinoId === filtroCuenta)
  movimientosFiltrados = [...movimientosFiltrados].sort((a, b) => b.fecha.localeCompare(a.fecha))

  // --- Autorizar pago ---
  const [autorizandoOc, setAutorizandoOc] = useState<string | null>(null)

  const handleAutorizarPago = useCallback(async (ocId: string, cuentaId: string) => {
    setAutorizandoOc(ocId)
    const movimiento = await store.caja.autorizarPago({ ordenCompraId: ocId, cuentaId, medioPago: 'transferencia' })
    if (movimiento) {
      setAutorizandoOc(null)
    } else {
      setAutorizandoOc(null)
    }
  }, [store])

  // Collapsible sections
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    dashboard: true,
    colaPagos: true,
    libroMayor: true,
    gateLog: true,
  })

  const toggleSeccion = useCallback((seccion: keyof typeof seccionesExpandidas) => {
    setSeccionesExpandidas(prev => ({ ...prev, [seccion]: !prev[seccion] }))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Caja</h1>
          <p className="text-sm text-text-muted mt-1">Control de caja, autorización de pagos y libro mayor</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      {/* --- Dashboard: Saldo disponible + cuentas --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSeccion('dashboard')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors"
        >
          <h2 className="font-semibold text-text-heading">Caja</h2>
          <span className={`text-sm transition-transform duration-fast ${seccionesExpandidas.dashboard ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {seccionesExpandidas.dashboard && (
          <div className="border-t border-border-subtle px-4 py-4 space-y-4">
            <div className="rounded border border-gold-300 bg-bg-alt/50 p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Saldo disponible</p>
              <p className="font-mono text-3xl font-semibold text-brand">
                {formatCOP(cajaDisponible)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                E-20: Σ cuentas − Σ obligaciones pendientes
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cuentas.map((cuenta: CuentaFinanciera) => (
                <div key={cuenta.id} className="rounded border border-border-subtle bg-bg-paper p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-heading">{cuenta.nombre}</p>
                      <p className="text-xs text-text-muted">{cuenta.tipo}</p>
                    </div>
                    <p className="font-mono text-lg font-semibold text-text-heading">
                      {formatCOP(numDe(cuenta.saldoActual))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* --- Cola de pagos (OC en_pago) --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSeccion('colaPagos')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors"
        >
          <h2 className="font-semibold text-text-heading">Cola de pagos (En pago)</h2>
          <span className={`text-sm transition-transform duration-fast ${seccionesExpandidas.colaPagos ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {seccionesExpandidas.colaPagos && (
          <div className="border-t border-border-subtle px-4 py-4 space-y-3">
            {ocEnPago.length === 0 ? (
              <p className="text-sm text-text-muted">Sin órdenes de compra en pago.</p>
            ) : (
              ocEnPago.map((oc: OrdenCompra) => {
                const prov = proveedorMap.get(oc.proveedorId)
                const monto = numDe(oc.montoTotal)
                const puedePagar = monto <= cajaDisponible
                const cuentaOrigen = cuentas.find(c => numDe(c.saldoActual) > 0)

                return (
                  <div key={oc.id} className="rounded border border-border-subtle bg-bg-paper p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-text-heading">{oc.codigoOrden}</p>
                        <p className="text-xs text-text-muted">
                          {prov ? prov.nombre : '—'} · {formatDate(oc.createdAt)}
                        </p>
                      </div>
                      <Badge tone={getEstadoOcBadge(oc.estado)} dot>
                        {getEstadoOcLabel(oc.estado)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Monto:</span>
                        <span className="font-mono text-text-heading">{formatCOP(monto)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Disponible:</span>
                        <span className="font-mono text-text-heading">{formatCOP(cajaDisponible)}</span>
                      </div>
                    </div>

                    {/* PagoAccion: Autorizar pago */}
                    <div className="flex items-center gap-2 pt-1">
                      {puedePagar ? (
                        <Button
                          variant="primary"
                          size="md"
                          disabled={autorizandoOc === oc.id}
                          onClick={() => {
                            if (cuentaOrigen) {
                              handleAutorizarPago(oc.id, cuentaOrigen.id)
                            }
                          }}
                        >
                          {autorizandoOc === oc.id ? 'Procesando...' : 'Autorizar pago'}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="md" disabled>
                          Autorizar pago
                        </Button>
                      )}
                      {!puedePagar && (
                        <Badge tone="danger" dot>
                          Caja insuficiente (E-20)
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </section>

      {/* --- Libro mayor --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSeccion('libroMayor')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors"
        >
          <h2 className="font-semibold text-text-heading">Libro mayor</h2>
          <span className={`text-sm transition-transform duration-fast ${seccionesExpandidas.libroMayor ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {seccionesExpandidas.libroMayor && (
          <div className="border-t border-border-subtle px-4 py-4 space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-1">
                <span className="text-xs text-text-muted">Tipo:</span>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)}
                  className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="debito">Egresos</option>
                  <option value="credito">Ingresos</option>
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs text-text-muted">Cuenta:</span>
                <select
                  value={filtroCuenta}
                  onChange={(e) => setFiltroCuenta(e.target.value)}
                  className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                >
                  <option value="todos">Todas</option>
                  {cuentas.map((c: CuentaFinanciera) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </label>
            </div>

            {movimientosFiltrados.length === 0 ? (
              <p className="text-sm text-text-muted">Sin movimientos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-border-subtle text-left px-2 py-2 font-semibold text-text-heading">Fecha</th>
                      <th className="border-b border-border-subtle text-left px-2 py-2 font-semibold text-text-heading">Descripción</th>
                      <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Tipo</th>
                      <th className="border-b border-border-subtle text-right px-2 py-2 font-semibold text-text-heading">Monto</th>
                      <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Cuenta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosFiltrados.map((mov: MovimientoFinanciero) => {
                      const cuentaDestino = mov.cuentaDestinoId ? cuentas.find(c => c.id === mov.cuentaDestinoId) : null
                      const cuentaOrigen = mov.cuentaOrigenId ? cuentas.find(c => c.id === mov.cuentaOrigenId) : null
                      const cuentaNombre = cuentaDestino || cuentaOrigen
                      return (
                        <tr key={mov.id} className="border-b border-border-subtle/50">
                          <td className="px-2 py-2 text-xs font-mono text-text-muted">{formatDate(mov.fecha)}</td>
                          <td className="px-2 py-2 text-sm text-text-heading">{mov.descripcion}</td>
                          <td className="px-2 py-2 text-center">
                            <Badge tone={mov.tipo === 'debito' ? 'danger' : 'info'} dot>
                              {origenLabel(mov.tipo)}
                            </Badge>
                          </td>
                          <td className={`px-2 py-2 text-right font-mono ${mov.tipo === 'debito' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {formatCOP(numDe(mov.monto))}
                          </td>
                          <td className="px-2 py-2 text-center text-xs text-text-muted">
                            {cuentaNombre ? cuentaNombre.nombre : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- Gate caja log --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSeccion('gateLog')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors"
        >
          <h2 className="font-semibold text-text-heading">Bloqueos de caja (E-20)</h2>
          <span className={`text-sm transition-transform duration-fast ${seccionesExpandidas.gateLog ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {seccionesExpandidas.gateLog && (
          <div className="border-t border-border-subtle px-4 py-4 space-y-3">
            {registrosGate.length === 0 ? (
              <p className="text-sm text-text-muted">Sin bloqueos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-border-subtle text-left px-2 py-2 font-semibold text-text-heading">Orden</th>
                      <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Solicitado</th>
                      <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Disponible</th>
                      <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Estado</th>
                      <th className="border-b border-border-subtle text-left px-2 py-2 font-semibold text-text-heading">Resolución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosGate.map((reg: RegistroGateCaja) => {
                      const oc = ordenesCompra.find(o => o.id === reg.ordenCompraId)
                      return (
                        <tr key={reg.id} className="border-b border-border-subtle/50">
                          <td className="px-2 py-2 text-xs font-mono text-text-muted">
                            {oc ? oc.codigoOrden : reg.ordenCompraId}
                          </td>
                          <td className="px-2 py-2 text-right font-mono">{formatCOP(numDe(reg.montoSolicitado))}</td>
                          <td className="px-2 py-2 text-right font-mono">{formatCOP(numDe(reg.saldoDisponible))}</td>
                          <td className="px-2 py-2 text-center">
                            {reg.bloqueado ? (
                              <Badge tone="danger" dot>Bloqueado</Badge>
                            ) : (
                              <Badge tone="info" dot>Desbloqueado</Badge>
                            )}
                          </td>
                          <td className="px-2 py-2 text-xs text-text-muted">
                            {reg.resolucion ? reg.resolucion : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
