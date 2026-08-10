'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore, type EstadoRecepcionMaterial, type ItemOrdenCompra } from '@/lib/data'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const ESTADO_OC_LABELS: Record<string, string> = {
  solicitada: 'Solicitada',
  aprobada: 'Aprobada',
  en_pago: 'En pago',
  pagada: 'Pagada',
  recibida_verificada: 'Recibida verificada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
}

const ESTADO_RECEPCION_LABELS: Record<EstadoRecepcionMaterial, string> = {
  pendiente: 'Pendiente',
  recibido_verificado: 'Recibido verificado',
  recibido_defectuoso: 'Recibido con defecto',
}

function getRecepcionBadgeTone(estado: EstadoRecepcionMaterial): 'neutral' | 'warning' | 'info' | 'danger' {
  switch (estado) {
    case 'pendiente': return 'neutral'
    case 'recibido_verificado': return 'info'
    case 'recibido_defectuoso': return 'danger'
    default: return 'neutral'
  }
}

export default function RecepcionMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const ordenCompraId = params.ordenCompraId as string
  const store = useDataStore()

  const orden = store.ordenesCompra.listar().find(o => o.id === ordenCompraId)
  const recepciones = store.recepcionesMaterial.porOrdenCompra(ordenCompraId)
  const recepcion = recepciones.length > 0 ? recepciones[recepciones.length - 1] : undefined
  const items = store.itemsOrdenCompra.porOrdenCompra(ordenCompraId)
  const productos = store.catalogo.listar()

  const productoMap = (() => {
    const m = new Map<string, { id: string; descripcion: string; sku: string; unidadMedida: string }>()
    productos.forEach(p => m.set(p.id, p))
    return m
  })()

  const [checks, setChecks] = useState({ pedido: false, despacho: false, material: false })
  const [descripcionDefecto, setDescripcionDefecto] = useState('')
  const [errorDefecto, setErrorDefecto] = useState<string | null>(null)
  const [reprocesoCreado, setReprocesoCreado] = useState(false)

  useEffect(() => {
    if (recepcion) {
      setChecks({
        pedido: recepcion.checkPedidoBien,
        despacho: recepcion.checkDespachoBien,
        material: recepcion.checkMaterial,
      })
      setDescripcionDefecto(recepcion.descripcionDefecto ?? '')
      setErrorDefecto(null)
      setReprocesoCreado(false)
    }
  }, [recepcion])

  const handleRegistrarRecepcion = useCallback(() => {
    if (!orden) return
    store.recepcionesMaterial.crear({ ordenCompraId: orden.id, proyectoId: orden.proyectoId })
  }, [orden, store])

  const algunCheckFallido = !checks.pedido || !checks.despacho || !checks.material

  const handleEnviarChecks = useCallback(() => {
    if (!recepcion) return
    const completo = checks.pedido && checks.despacho && checks.material
    if (!completo && !descripcionDefecto.trim()) {
      setErrorDefecto('Debe describir el defecto antes de registrar la recepción.')
      return
    }
    setErrorDefecto(null)
    store.recepcionesMaterial.actualizarChecks(recepcion.id, {
      checkPedidoBien: checks.pedido,
      checkDespachoBien: checks.despacho,
      checkMaterial: checks.material,
      descripcionDefecto: completo ? null : descripcionDefecto.trim(),
    })
  }, [recepcion, checks, descripcionDefecto, store])

  const handleCrearReproceso = useCallback(() => {
    if (!orden || !orden.proyectoId) return
    store.reprocesos.crear({
      proyectoId: orden.proyectoId,
      origen: 'recepcion',
      descripcion: descripcionDefecto.trim() || (recepcion?.descripcionDefecto ?? 'Defecto detectado en recepción de material'),
    })
    setReprocesoCreado(true)
  }, [orden, descripcionDefecto, recepcion, store])

  const esProyecto = orden?.proyectoId != null

  if (!orden) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-6">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-text-heading">Recibo de material</h1>
        </header>
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6 text-center space-y-4">
          <p className="text-sm text-text-muted">Orden de compra no encontrada.</p>
          <Button variant="secondary" size="md" onClick={() => router.push('/erp/compras')}>
            ← Volver a órdenes de compra
          </Button>
        </div>
      </div>
    )
  }

  if (orden.estado !== 'pagada' && orden.estado !== 'recibida_verificada') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-6">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-text-heading">Recibo de material</h1>
          <p className="text-sm text-text-muted mt-1">Orden de compra {orden.codigoOrden}</p>
        </header>
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6 text-center space-y-4">
          <p className="text-sm text-text-muted">
            La orden de compra {orden.codigoOrden} está en estado {ESTADO_OC_LABELS[orden.estado] ?? orden.estado}. La
            recepción de material solo se puede registrar cuando la orden de compra está pagada.
          </p>
          <Button variant="secondary" size="md" onClick={() => router.push('/erp/compras')}>
            ← Volver a órdenes de compra
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Recibo de material</h1>
          <p className="text-sm text-text-muted mt-1">
            Orden de compra {orden.codigoOrden} · {formatDate(orden.createdAt)}
          </p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border-subtle">
          <h2 className="font-semibold text-text-heading">Recepción de material</h2>
          {recepcion && (
            <Badge tone={getRecepcionBadgeTone(recepcion.estado)} dot>
              {ESTADO_RECEPCION_LABELS[recepcion.estado]}
            </Badge>
          )}
        </div>

        <div className="px-4 py-4 space-y-4">
          {orden.estado === 'recibida_verificada' && recepcion && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                Esta orden de compra ya fue verificada en recepción. Los tres controles fueron correctos:
              </p>
              <div className="flex flex-col gap-1 text-sm">
                <span>✓ Pedido correcto</span>
                <span>✓ Despacho correcto</span>
                <span>✓ Material correcto</span>
              </div>
            </div>
          )}

          {orden.estado === 'pagada' && !recepcion && (
            <div className="text-center py-2">
              <p className="text-sm text-text-muted mb-3">
                El pedido llegó al taller. Registre la recepción para activar la triple verificación (pedido, despacho y material).
              </p>
              <Button variant="primary" size="md" onClick={handleRegistrarRecepcion}>
                Registrar recepción
              </Button>
            </div>
          )}

          {orden.estado === 'pagada' && recepcion && (
            <div className="space-y-4">
              {recepcion.estado === 'recibido_defectuoso' && (
                <div role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  La recepción quedó registrada con defecto. La orden de compra permanece en estado Pagada.
                </div>
              )}

              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checks.pedido}
                    onChange={(e) => setChecks(prev => ({ ...prev, pedido: e.target.checked }))}
                    className="accent-gold-600"
                  />
                  <span className="text-text-heading">Pedido correcto</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checks.despacho}
                    onChange={(e) => setChecks(prev => ({ ...prev, despacho: e.target.checked }))}
                    className="accent-gold-600"
                  />
                  <span className="text-text-heading">Despacho correcto</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checks.material}
                    onChange={(e) => setChecks(prev => ({ ...prev, material: e.target.checked }))}
                    className="accent-gold-600"
                  />
                  <span className="text-text-heading">Material correcto</span>
                </label>
              </div>

              {algunCheckFallido && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Descripción del defecto*</span>
                  <textarea
                    value={descripcionDefecto}
                    onChange={(e) => setDescripcionDefecto(e.target.value)}
                    rows={3}
                    placeholder="Describa qué llegó mal: faltantes, daños, material equivocado..."
                    className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                  />
                  {errorDefecto && (
                    <p role="alert" className="text-xs text-red-600">{errorDefecto}</p>
                  )}
                </label>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="primary" size="md" onClick={handleEnviarChecks}>
                  {algunCheckFallido ? 'Registrar con defecto' : 'Confirmar recepción'}
                </Button>
              </div>

              {recepcion.estado === 'recibido_defectuoso' && esProyecto && (
                <div className="rounded border border-border-subtle bg-bg-paper p-3 space-y-2">
                  <p className="text-sm text-text-muted">
                    La orden de compra está vinculada a un proyecto. Puede abrir un reproceso de recepción para el material defectuoso.
                  </p>
                  {reprocesoCreado ? (
                    <Badge tone="info" dot>Reproceso de recepción creado</Badge>
                  ) : (
                    <Button variant="secondary" size="md" onClick={handleCrearReproceso}>
                      Crear reproceso
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <h2 className="font-semibold text-text-heading">Ítems esperados</h2>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted text-center">Sin ítems registrados para esta orden de compra.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-border-subtle text-left px-3 py-2 font-semibold text-text-heading">Producto</th>
                  <th className="border-b border-border-subtle text-center px-3 py-2 font-semibold text-text-heading">Cantidad esperada</th>
                  <th className="border-b border-border-subtle text-center px-3 py-2 font-semibold text-text-heading">Recibido</th>
                  <th className="border-b border-border-subtle text-center px-3 py-2 font-semibold text-text-heading">Sin defectos</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: ItemOrdenCompra) => {
                  const prod = productoMap.get(item.productoCatalogoId)
                  return (
                    <tr key={item.id} className="border-b border-border-subtle/50">
                      <td className="px-3 py-2">
                        <span className="text-text-heading">{prod?.descripcion ?? item.productoCatalogoId}</span>
                        {prod && (
                          <span className="block text-xs text-text-muted">{prod.sku} · {prod.unidadMedida}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">{item.cantidadEsperada}</td>
                      <td className="px-3 py-2 text-center font-mono">{item.recibidoCantidad}</td>
                      <td className="px-3 py-2 text-center">
                        {item.sinDefectos ? (
                          <span className="text-emerald-600">Sí</span>
                        ) : (
                          <span className="text-text-muted">No</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
