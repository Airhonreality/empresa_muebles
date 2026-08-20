'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { Modal } from '@/components/veta/modal'
import { useDataStore, type EstadoOrdenCompra, type ItemOrdenCompra, type ProductoCatalogo } from '@/lib/data'
import { derivarListaCompraSugerida } from '@/lib/modules/f4/gates'
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

interface FormNuevoItemAPedido {
  especificacion: string
  cantidad: string
}

const FORM_ITEM_INICIAL: FormNuevoItemAPedido = {
  especificacion: '',
  cantidad: '',
}

export default function DetalleOrdenCompraPage() {
  const router = useRouter()
  const params = useParams()
  const ordenCompraId = params.ordenCompraId as string
  const store = useDataStore()

  const orden = store.ordenesCompra.listar().find(o => o.id === ordenCompraId)
  const proveedor = orden ? store.proveedores.obtenerPorId(orden.proveedorId) : undefined
  const proyecto = orden?.proyectoId ? store.proyectos.obtenerPorId(orden.proyectoId) : undefined
  const items = orden ? store.itemsOrdenCompra.porOrdenCompra(ordenCompraId) : []
  const productos = store.catalogo.listar()

  const productoMap = (() => {
    const m = new Map<string, ProductoCatalogo>()
    productos.forEach(p => m.set(p.id, p))
    return m
  })()

  const [mostrarSugerir, setMostrarSugerir] = useState(false)
  const [sugerenciasListadas, setSugerenciasListadas] = useState(false)
  const [sugeridos, setSugeridos] = useState<Array<{ productoCatalogoId: string; cantidad: number; unidad: string; bomMaterialId: string }>>([])
  const [sugeridosEditables, setSugeridosEditables] = useState<Array<{ productoCatalogoId: string; cantidad: number; unidad: string; bomMaterialId: string }>>([])

  const [mostrarAgregarItem, setMostrarAgregarItem] = useState(false)
  const [formNuevoItem, setFormNuevoItem] = useState<FormNuevoItemAPedido>(FORM_ITEM_INICIAL)
  const [errorAgregarItem, setErrorAgregarItem] = useState<string | null>(null)

  const { guard: guardAgregarItem, isPending: agregandoItem } = usePendingGuard()

  const handleSugerirItems = useCallback(() => {
    if (!orden?.proyectoId) return

    const schemas = store.schemas.porProyecto(orden.proyectoId)
    const schemaAprobado = schemas.find(s => s.estado === 'aprobado_compras')

    if (!schemaAprobado) {
      setMostrarSugerir(false)
      return
    }

    const bom = store.bom.porSchema(schemaAprobado.id)
    const sugerencias = derivarListaCompraSugerida(schemaAprobado, bom)

    setSugeridos(sugerencias)
    setSugeridosEditables(sugerencias.map(s => ({ ...s })))
    setSugerenciasListadas(true)
  }, [orden, store])

  const handleConfirmarSugeridos = useCallback(async () => {
    if (!orden || sugeridosEditables.length === 0) return

    const conCantidadPositiva = sugeridosEditables.filter(s => Number(s.cantidad) > 0)
    if (conCantidadPositiva.length === 0) return

    await store.itemsOrdenCompra.crearDesdeSugeridos(
      orden.id,
      conCantidadPositiva
    )

    setMostrarSugerir(false)
    setSugerenciasListadas(false)
    setSugeridos([])
    setSugeridosEditables([])
  }, [orden, sugeridosEditables, store])

  const handleAgregarItemAPedido = useCallback(async () => {
    setErrorAgregarItem(null)

    if (!formNuevoItem.especificacion.trim()) {
      setErrorAgregarItem('La especificación es obligatoria.')
      return
    }

    const cantidadNum = Number(formNuevoItem.cantidad)
    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
      setErrorAgregarItem('La cantidad debe ser un número positivo.')
      return
    }

    if (!orden) return

    const resultado = await store.itemsOrdenCompra.crear({
      ordenCompraId: orden.id,
      especificacion: formNuevoItem.especificacion.trim(),
      cantidadEsperada: cantidadNum,
    })

    if (resultado) {
      setMostrarAgregarItem(false)
      setFormNuevoItem(FORM_ITEM_INICIAL)
    }
  }, [formNuevoItem, orden, store])

  if (!orden) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-6">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-text-heading">Detalle de orden de compra</h1>
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Orden de compra</h1>
          <p className="text-sm text-text-muted mt-1">{orden.codigoOrden}</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-text-muted mb-1">Estado</p>
            <Badge tone={getEstadoBadgeTone(orden.estado)} dot>
              {ESTADO_LABELS[orden.estado]}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Proveedor</p>
            <p className="font-medium text-text-heading">{proveedor?.nombre ?? orden.proveedorId}</p>
          </div>
          {proyecto && (
            <div>
              <p className="text-xs text-text-muted mb-1">Proyecto</p>
              <p className="font-medium text-text-heading">{proyecto.nombreProyecto}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-text-muted mb-1">Monto total</p>
            <p className="font-mono font-medium text-text-heading">{formatCOP(numDe(orden.montoTotal))}</p>
          </div>
          {orden.anticipoMonto && (
            <div>
              <p className="text-xs text-text-muted mb-1">Anticipo</p>
              <p className="font-mono font-medium text-text-heading">{formatCOP(numDe(orden.anticipoMonto))}</p>
            </div>
          )}
          {orden.fechaRecepcionEsperada && (
            <div>
              <p className="text-xs text-text-muted mb-1">Recepción esperada</p>
              <p className="text-text-heading">
                {new Date(orden.fechaRecepcionEsperada).toLocaleDateString('es-CO')}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-3">
          <h2 className="font-semibold text-text-heading">Ítems de la orden de compra</h2>
          {orden.proyectoId && (
            <Button
              variant="secondary"
              size="md"
              className="text-xs"
              onClick={() => {
                setMostrarSugerir(true)
                setSugerenciasListadas(false)
                handleSugerirItems()
              }}
            >
              Sugerir ítems del schema
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-muted">Sin ítems registrados en esta orden de compra.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-border-subtle text-left px-3 py-2 font-semibold text-text-heading">Producto / Especificación</th>
                  <th className="border-b border-border-subtle text-center px-3 py-2 font-semibold text-text-heading">Cantidad esperada</th>
                  <th className="border-b border-border-subtle text-center px-3 py-2 font-semibold text-text-heading">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: ItemOrdenCompra) => {
                  const prod = item.productoCatalogoId ? productoMap.get(item.productoCatalogoId) : undefined
                  return (
                    <tr key={item.id} className="border-b border-border-subtle/50">
                      <td className="px-3 py-2">
                        {prod ? (
                          <>
                            <span className="text-text-heading font-medium">{prod.descripcion}</span>
                            <span className="block text-xs text-text-muted">{prod.sku}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-text-heading">{item.especificacion}</span>
                            <span className="block text-xs text-text-muted">A pedido</span>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">{item.cantidadEsperada}</td>
                      <td className="px-3 py-2 text-center text-xs text-text-muted">{prod?.unidadMedida ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-border-subtle">
          <Button
            variant="secondary"
            size="md"
            className="text-xs"
            onClick={() => setMostrarAgregarItem(true)}
          >
            + Agregar ítem a pedido
          </Button>
        </div>
      </section>

      <Modal
        open={mostrarSugerir}
        onClose={() => {
          setMostrarSugerir(false)
          setSugerenciasListadas(false)
          setSugeridos([])
          setSugeridosEditables([])
        }}
        title="Sugerir ítems del schema aprobado"
      >
        <div className="space-y-3 text-sm">
          {!sugerenciasListadas ? (
            <div className="text-center space-y-4">
              <p className="text-xs text-text-muted">
                Buscando schema aprobado para compras...
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleSugerirItems()}
                disabled={sugeridos.length > 0}
              >
                Cargar sugerencias
              </Button>
            </div>
          ) : sugeridos.length === 0 ? (
            <div className="text-center space-y-4">
              <p className="text-xs text-text-muted">
                No se encontró un schema aprobado para compras en este proyecto, o no contiene ítems con producto asignado.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-muted">
                Se encontraron {sugeridos.length} ítems en el schema aprobado. Ajuste las cantidades según sea necesario:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sugeridosEditables.map((item, idx) => {
                  const prod = productoMap.get(item.productoCatalogoId)
                  return (
                    <div key={item.bomMaterialId} className="flex items-center gap-2 rounded border border-border-subtle bg-bg-paper p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-heading truncate">
                          {prod?.descripcion ?? item.productoCatalogoId}
                        </p>
                        {prod && (
                          <p className="text-xs text-text-muted">{prod.sku}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.cantidad}
                          onChange={(e) => {
                            const nuevos = [...sugeridosEditables]
                            nuevos[idx] = { ...nuevos[idx], cantidad: Number(e.target.value) }
                            setSugeridosEditables(nuevos)
                          }}
                          className="w-16 rounded border border-border-subtle bg-bg-raised px-1 py-1 text-xs text-text-heading text-center focus:border-gold-400 focus:outline-none"
                        />
                        <span className="text-xs text-text-muted whitespace-nowrap">{item.unidad}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="primary" size="md" onClick={handleConfirmarSugeridos}>
                  Confirmar y agregar ítems
                </Button>
                <Button variant="ghost" size="md" onClick={() => {
                  setMostrarSugerir(false)
                  setSugerenciasListadas(false)
                  setSugeridos([])
                  setSugeridosEditables([])
                }}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={mostrarAgregarItem}
        onClose={() => {
          setMostrarAgregarItem(false)
          setFormNuevoItem(FORM_ITEM_INICIAL)
          setErrorAgregarItem(null)
        }}
        title="Agregar ítem a pedido"
      >
        <div className="space-y-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Especificación del ítem*</span>
            <textarea
              value={formNuevoItem.especificacion}
              onChange={(e) => setFormNuevoItem(prev => ({ ...prev, especificacion: e.target.value }))}
              rows={4}
              placeholder="Describa el ítem: medidas, acabado, material, proveedor sugerido, etc."
              className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Cantidad esperada*</span>
            <input
              type="number"
              min="1"
              step="1"
              value={formNuevoItem.cantidad}
              onChange={(e) => setFormNuevoItem(prev => ({ ...prev, cantidad: e.target.value }))}
              placeholder="0"
              className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            />
          </label>
          {errorAgregarItem && (
            <p role="alert" className="text-xs text-red-600">{errorAgregarItem}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => guardAgregarItem(handleAgregarItemAPedido)}
              disabled={agregandoItem}
              loading={agregandoItem}
            >
              Agregar ítem
            </Button>
            <Button variant="ghost" size="md" onClick={() => {
              setMostrarAgregarItem(false)
              setFormNuevoItem(FORM_ITEM_INICIAL)
              setErrorAgregarItem(null)
            }}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
