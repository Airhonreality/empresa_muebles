'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { LinkButton } from '@/components/veta/button'
import { useDataStore } from '@/lib/data'
import { formatCurrency } from '@/lib/utils/format'

type EstadoOrdenCompra = 'solicitada' | 'aprobada' | 'en_pago' | 'pagada' | 'recibida_verificada' | 'rechazada' | 'cancelada'
type EstadoCuentaCobro = 'emitida' | 'vinculada' | 'pagada' | 'anulada'
type EstadoObligacion = 'pendiente' | 'parcial' | 'pagado' | 'atrasada'

const ESTADOS_OC_TONE: Record<EstadoOrdenCompra, 'info' | 'warning' | 'danger' | 'neutral'> = {
  solicitada: 'info',
  aprobada: 'info',
  en_pago: 'warning',
  pagada: 'info',
  recibida_verificada: 'info',
  rechazada: 'danger',
  cancelada: 'danger',
}

const ESTADOS_CC_TONE: Record<EstadoCuentaCobro, 'info' | 'warning' | 'danger' | 'neutral'> = {
  emitida: 'warning',
  vinculada: 'warning',
  pagada: 'info',
  anulada: 'danger',
}

// D-08a (re-auditoría 2026-08-10): mismas etiquetas que compras/page.tsx, cuentas-cobro/page.tsx y
// obligaciones/page.tsx -- acá se mostraban estados crudos ("en_pago", "vinculada") y montos con
// `${...toLocaleString(..., {minimumFractionDigits: 2})}` a mano (2 decimales, inconsistente con
// formatCurrency() -- 0 decimales -- que usa el resto del ERP).
const ESTADO_OC_LABELS: Record<EstadoOrdenCompra, string> = {
  solicitada: 'Solicitada',
  aprobada: 'Aprobada',
  en_pago: 'En pago',
  pagada: 'Pagada',
  recibida_verificada: 'Recibida verificada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
}

const ESTADO_CC_LABELS: Record<EstadoCuentaCobro, string> = {
  emitida: 'Emitida',
  vinculada: 'Vinculada',
  pagada: 'Pagada',
  anulada: 'Anulada',
}

const ESTADO_OBLIGACION_LABELS: Record<EstadoObligacion, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
  atrasada: 'Atrasada',
}

export default function ProveedorPerfilPage() {
  const params = useParams()
  const store = useDataStore()
  store.getVersion()

  const proveedorId = params.proveedorId as string

  const proveedor = useMemo(() => store.proveedores.obtenerPorId(proveedorId), [store, proveedorId])
  const ordenesCompra = useMemo(
    () => store.ordenesCompra.porProveedor(proveedorId),
    [store, proveedorId]
  )
  const obligacionesPendientes = useMemo(
    () => store.obligacionesPendientes.porProveedor(proveedorId),
    [store, proveedorId]
  )
  const cuentasCobroProveedor = useMemo(
    () => store.cuentasCobroProveedor.porProveedor(proveedorId),
    [store, proveedorId]
  )

  if (!proveedor) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="rounded-lg border border-border-subtle bg-bg-paper p-8 text-center">
          <p className="text-text-muted mb-4">Proveedor no encontrado</p>
          <LinkButton href="/erp/compras" variant="ghost">Volver a Compras</LinkButton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <LinkButton href="/erp/compras" variant="ghost" size="md">← Volver</LinkButton>
          <h1 className="font-display text-3xl font-semibold text-text-heading mt-4">
            {proveedor.nombre}
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Perfil de proveedor
          </p>
        </div>
      </div>

      {/* Contenido en grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: datos de contacto y logística */}
        <div className="space-y-6 lg:col-span-1">
          {/* Datos de contacto */}
          <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
            <h2 className="font-semibold text-text-heading mb-4">Datos de contacto</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted mb-1">NIT</p>
                <p className="text-sm text-text-heading">
                  {proveedor.nit || '(no registrado)'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted mb-1">Teléfono Comercial</p>
                <p className="text-sm text-text-heading">
                  {proveedor.telefonoComercial || '(no registrado)'}
                </p>
              </div>
            </div>
          </div>

          {/* Datos de logística */}
          <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
            <h2 className="font-semibold text-text-heading mb-4">Logística</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted mb-1">Dirección de Despacho</p>
                <p className="text-sm text-text-heading">
                  {proveedor.direccionDespacho || '(no registrada)'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted mb-1">Ciudad</p>
                <p className="text-sm text-text-heading">
                  {proveedor.ciudad || '(no registrada)'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted mb-1">Medio de Pago</p>
                <p className="text-sm text-text-heading">
                  {proveedor.medioPago || '(no definido)'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted mb-1">Días Entrega (default)</p>
                <p className="text-sm text-text-heading">
                  {proveedor.diasEntregaDefault ? `${proveedor.diasEntregaDefault} días` : '(no definido)'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted mb-1">Transportadora</p>
                <p className="text-sm text-text-heading">
                  {proveedor.transportadora || '(no registrada)'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted mb-1">Tarifa Flete</p>
                <p className="text-sm text-text-heading">
                  {proveedor.tarifaFlete || '(no registrada)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: órdenes de compra y saldos */}
        <div className="space-y-6 lg:col-span-2">
          {/* Órdenes de compra */}
          <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
            <h2 className="font-semibold text-text-heading mb-4">
              Órdenes de compra ({ordenesCompra.length})
            </h2>
            {ordenesCompra.length === 0 ? (
              <p className="text-sm text-text-muted">Sin órdenes de compra</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="px-2 py-2 text-left font-semibold text-text-heading">Código</th>
                      <th className="px-2 py-2 text-right font-semibold text-text-heading">Monto</th>
                      <th className="px-2 py-2 text-left font-semibold text-text-heading">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesCompra.map((oc) => (
                      <tr key={oc.id} className="border-b border-border-subtle hover:bg-bg-alt">
                        <td className="px-2 py-2 text-text-heading">{oc.codigoOrden}</td>
                        <td className="px-2 py-2 text-right text-text-heading">
                          {formatCurrency(oc.montoTotal)}
                        </td>
                        <td className="px-2 py-2">
                          <Badge tone={ESTADOS_OC_TONE[oc.estado as EstadoOrdenCompra]}>
                            {ESTADO_OC_LABELS[oc.estado as EstadoOrdenCompra]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Obligaciones pendientes hacia el proveedor */}
          <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
            <h2 className="font-semibold text-text-heading mb-4">Deuda pendiente (obligaciones)</h2>
            {obligacionesPendientes.length === 0 ? (
              <p className="text-sm text-text-muted">Sin deudas pendientes</p>
            ) : (
              <div className="space-y-3">
                {obligacionesPendientes.map((oblig) => (
                  <div key={oblig.id} className="rounded border border-border-subtle p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-heading">{oblig.descripcion}</p>
                        <p className="text-xs text-text-muted mt-1">
                          Vencimiento: {new Date(oblig.fechaVencimiento).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <Badge
                        tone={
                          oblig.estado === 'pagado' ? 'info' :
                          oblig.estado === 'atrasada' ? 'danger' :
                          'warning'
                        }
                      >
                        {ESTADO_OBLIGACION_LABELS[oblig.estado]}
                      </Badge>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div>
                        <span className="text-text-muted">Monto total:</span>
                        <span className="ml-2 font-semibold text-text-heading">
                          {formatCurrency(oblig.montoTotal)}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">Pagado:</span>
                        <span className="ml-2 font-semibold text-text-heading">
                          {formatCurrency(oblig.montoPagado)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cuentas de cobro del proveedor */}
          <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
            <h2 className="font-semibold text-text-heading mb-4">Cuentas de cobro ({cuentasCobroProveedor.length})</h2>
            {cuentasCobroProveedor.length === 0 ? (
              <p className="text-sm text-text-muted">Sin cuentas de cobro</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="px-2 py-2 text-left font-semibold text-text-heading">Concepto</th>
                      <th className="px-2 py-2 text-right font-semibold text-text-heading">Valor</th>
                      <th className="px-2 py-2 text-left font-semibold text-text-heading">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuentasCobroProveedor.map((cc) => (
                      <tr key={cc.id} className="border-b border-border-subtle hover:bg-bg-alt">
                        <td className="px-2 py-2 text-text-heading">{cc.concepto}</td>
                        <td className="px-2 py-2 text-right text-text-heading">
                          {formatCurrency(cc.valor)}
                        </td>
                        <td className="px-2 py-2">
                          <Badge tone={ESTADOS_CC_TONE[cc.estado as EstadoCuentaCobro]}>
                            {ESTADO_CC_LABELS[cc.estado as EstadoCuentaCobro]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
