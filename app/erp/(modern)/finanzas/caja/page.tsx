'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { CuentaFinancieraModal } from '@/components/veta/cuenta-financiera-modal'
import { DataTable, type DataTableColumn } from '@/components/veta/data-table'
import { MovimientoFinancieroModal, type TipoMovimientoManual } from '@/components/veta/movimiento-financiero-modal'
import { useToast } from '@/components/veta/toast-provider'
import { type CuentaFinanciera, type MovimientoFinanciero, type OrdenCompra, type RegistroGateCaja } from '@/lib/data'
import { useFinanzasCompat } from '@/lib/data/queries/finanzas-compat'
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
  const { store } = useFinanzasCompat()
  const { mostrarError, mostrarInfo } = useToast()

  const cuentas = store.cuentasFinancieras.listar()
  const movimientos = store.movimientosFinancieros.listar()
  const obligaciones = store.obligacionesPendientes.listar()
  const ordenesCompra = store.ordenesCompra.listar()
  const proveedores = store.proveedores.listar()
  const proyectos = store.proyectos.listar()
  const registrosGate = store.registrosGateCaja.listar()

  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimientoManual | null>(null)
  const [movimientoEditando, setMovimientoEditando] = useState<MovimientoFinanciero | null>(null)
  const [mostrarCuenta, setMostrarCuenta] = useState(false)

  const cajaDisponible = calcularCajaDisponible(cuentas, obligaciones)

  const ocEnPago = ordenesCompra
    .filter(o => o.estado === 'en_pago')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const proveedorMap = (() => {
    const m = new Map<string, { nombre: string }>()
    proveedores.forEach(p => m.set(p.id, p))
    return m
  })()

  const proyectoMap = (() => {
    const m = new Map<string, { nombreProyecto: string }>()
    proyectos.forEach(p => m.set(p.id, p))
    return m
  })()

  // --- Libro mayor filters ---
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'debito' | 'credito'>('todos')
  const [filtroCuenta, setFiltroCuenta] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'asentado' | 'anulado'>('todos')
  const [filtroMes, setFiltroMes] = useState<string>('')
  const [busqueda, setBusqueda] = useState<string>('')

  let movimientosFiltrados = movimientos
  if (filtroTipo !== 'todos') movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === filtroTipo)
  if (filtroCuenta !== 'todos') movimientosFiltrados = movimientosFiltrados.filter(m => m.cuentaOrigenId === filtroCuenta || m.cuentaDestinoId === filtroCuenta)
  if (filtroEstado !== 'todos') movimientosFiltrados = movimientosFiltrados.filter(m => m.estado === filtroEstado)
  if (filtroMes) movimientosFiltrados = movimientosFiltrados.filter(m => m.fecha.startsWith(filtroMes))
  if (busqueda.trim()) {
    const q = busqueda.trim().toLowerCase()
    movimientosFiltrados = movimientosFiltrados.filter(m => {
      const proyecto = m.proyectoId ? proyectoMap.get(m.proyectoId) : null
      const proveedor = m.proveedorId ? proveedorMap.get(m.proveedorId) : null
      return m.descripcion.toLowerCase().includes(q)
        || (proyecto?.nombreProyecto.toLowerCase().includes(q) ?? false)
        || (proveedor?.nombre.toLowerCase().includes(q) ?? false)
    })
  }

  const handleAnular = useCallback(async (mov: MovimientoFinanciero) => {
    if (!window.confirm(`¿Anular el movimiento "${mov.descripcion}"? Se revertirá el saldo y quedará en el libro como anulado.`)) return
    try {
      await store.movimientosFinancieros.anular(mov.id)
      mostrarInfo('Movimiento anulado. El saldo fue revertido.')
    } catch (e) {
      mostrarError(e instanceof Error ? e.message : 'No se pudo anular el movimiento.')
    }
  }, [store, mostrarError, mostrarInfo])

  const columnasLibro: DataTableColumn<MovimientoFinanciero>[] = [
    {
      key: 'fecha',
      header: 'Fecha mov.',
      sortValue: (mov) => mov.fecha,
      render: (mov) => <span className="font-mono text-xs text-text-muted">{formatDate(mov.fecha)}</span>,
    },
    {
      key: 'registro',
      header: 'Registro',
      sortValue: (mov) => mov.createdAt,
      render: (mov) => <span className="font-mono text-xs text-text-muted">{formatDate(mov.createdAt)}</span>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      sortValue: (mov) => mov.descripcion,
      render: (mov) => <span className="text-sm text-text-heading">{mov.descripcion}</span>,
    },
    {
      key: 'proyecto',
      header: 'Proyecto / proveedor',
      sortValue: (mov) => {
        const proyecto = mov.proyectoId ? proyectoMap.get(mov.proyectoId) : null
        const proveedor = mov.proveedorId ? proveedorMap.get(mov.proveedorId) : null
        return `${proyecto?.nombreProyecto ?? ''} ${proveedor?.nombre ?? ''}`.trim()
      },
      render: (mov) => {
        const proyecto = mov.proyectoId ? proyectoMap.get(mov.proyectoId) : null
        const proveedor = mov.proveedorId ? proveedorMap.get(mov.proveedorId) : null
        return (
          <span className="text-xs text-text-muted">
            {proyecto ? proyecto.nombreProyecto : '—'}
            {proveedor ? ` · ${proveedor.nombre}` : ''}
          </span>
        )
      },
    },
    {
      key: 'tipo',
      header: 'Tipo',
      align: 'center',
      sortValue: (mov) => origenLabel(mov.tipo),
      render: (mov) => (
        <div className="flex flex-col items-center gap-1">
          <Badge tone={mov.tipo === 'debito' ? 'danger' : 'info'} dot>
            {origenLabel(mov.tipo)}
          </Badge>
          {mov.estado === 'anulado' && <Badge tone="neutral" dot>Anulado</Badge>}
        </div>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      sortValue: (mov) => numDe(mov.monto),
      render: (mov) => (
        <span className={`font-mono ${mov.tipo === 'debito' ? 'text-red-600' : 'text-emerald-600'} ${mov.estado === 'anulado' ? 'line-through' : ''}`}>
          {mov.tipo === 'debito' ? '−' : '+'}{formatCOP(numDe(mov.monto))}
        </span>
      ),
    },
    {
      key: 'cuenta',
      header: 'Cuenta',
      align: 'center',
      sortValue: (mov) => {
        const cuentaId = mov.cuentaDestinoId ?? mov.cuentaOrigenId
        return cuentas.find((c) => c.id === cuentaId)?.nombre ?? ''
      },
      render: (mov) => {
        const cuentaId = mov.cuentaDestinoId ?? mov.cuentaOrigenId
        const cuenta = cuentas.find((c) => c.id === cuentaId)
        return <span className="text-xs text-text-muted">{cuenta?.nombre ?? '—'}</span>
      },
    },
    {
      key: 'comprobante',
      header: 'Comprobante',
      align: 'center',
      render: (mov) => mov.comprobanteUrl ? (
        <a
          href={mov.comprobanteUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gold-700 underline hover:text-gold-800"
        >
          Ver
        </a>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (mov) => mov.estado === 'anulado' ? (
        <span className="text-xs text-text-muted">—</span>
      ) : (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setMovimientoEditando(mov)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { void handleAnular(mov) }}>
            Anular
          </Button>
        </div>
      ),
    },
  ]

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
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Caja</h1>
          <p className="text-sm text-text-muted mt-1">Control de caja, autorización de pagos y libro mayor</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md" onClick={() => { setMovimientoEditando(null); setTipoMovimiento('entrada') }}>
            Registrar entrada
          </Button>
          <Button variant="primary" size="md" onClick={() => { setMovimientoEditando(null); setTipoMovimiento('salida') }}>
            Registrar salida
          </Button>
          <Button variant="outline" size="md" onClick={() => setMostrarCuenta(true)}>
            Nueva cuenta
          </Button>
          <Button variant="ghost" size="md" onClick={() => router.back()}>
            ← Volver
          </Button>
        </div>
      </header>

      {cuentas.length === 0 && (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-900">Todavía no hay una caja.</p>
            <p className="text-xs text-amber-800">
              Crea “Caja principal” para empezar a registrar entradas y salidas.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setMostrarCuenta(true)}>
            Crear caja principal
          </Button>
        </section>
      )}

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
              {cuentas.length === 0 ? (
                <p className="text-sm text-text-muted">Sin cuentas registradas.</p>
              ) : (
                cuentas.map((cuenta: CuentaFinanciera) => (
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
                ))
              )}
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
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-1">
                <span className="text-xs text-text-muted">Buscar:</span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Descripción, proyecto o proveedor"
                  className="min-h-[32px] w-56 rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs text-text-muted">Mes:</span>
                <input
                  type="month"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                />
              </label>
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
                <span className="text-xs text-text-muted">Estado:</span>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
                  className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="asentado">Asentados</option>
                  <option value="anulado">Anulados</option>
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

            <p className="text-xs text-text-muted">
              Hacé clic en el encabezado de una columna para ordenar ascendente o descendente.
            </p>

            <DataTable
              rows={movimientosFiltrados}
              columns={columnasLibro}
              rowKey={(mov) => mov.id}
              initialSort={{ key: 'fecha', direction: 'desc' }}
              density="compact"
              maxHeightClassName="max-h-[36rem]"
              caption="Libro mayor de movimientos financieros"
              rowClassName={(mov) => mov.estado === 'anulado' ? 'opacity-60' : ''}
              empty="Sin movimientos registrados."
            />
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

      <MovimientoFinancieroModal
        open={tipoMovimiento !== null || movimientoEditando !== null}
        onClose={() => { setTipoMovimiento(null); setMovimientoEditando(null) }}
        tipoInicial={movimientoEditando ? (movimientoEditando.tipo === 'credito' ? 'entrada' : 'salida') : (tipoMovimiento ?? 'salida')}
        movimiento={movimientoEditando}
      />
      <CuentaFinancieraModal open={mostrarCuenta} onClose={() => setMostrarCuenta(false)} crearCuenta={store.cuentasFinancieras.crear} />
    </div>
  )
}
