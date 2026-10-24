'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { SmartSearch } from '@/components/veta/smart-search'
import { ProductoFormModal } from '@/components/veta/producto-form-modal'
import { type ProductoCatalogo } from '@/lib/data'
import { useCatalogoCompat } from '@/lib/data/queries/catalogo-compat'
import { formatRelativeDate } from '@/lib/utils/format'

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function CatalogoPageContent() {
  const { store } = useCatalogoCompat()
  const searchParams = useSearchParams()
  const productos = store.catalogo.listar()

  // Universo compras/cotización (≥200 componentes) vs. universo tienda (diseños
  // consolidados) son conceptualmente distintos — ver disenio_p27 §6.2. Un
  // componente "está en la tienda" si es el representativo (catalogoId) de un
  // ProductoTienda o si integra la composición real (ProductoTiendaComponente)
  // de alguno — nunca el flag productos_catalogo.publicadoWeb (no alimenta
  // /colecciones — ver F-02, store.productosTienda.visibles()).
  const productosTiendaTodos = store.productosTienda.listar()
  const catalogoIdsEnTienda = new Set(
    productosTiendaTodos.flatMap((pt) => [
      pt.catalogoId,
      ...store.productosTiendaComponentes.porProductoTienda(pt.id).map((c) => c.catalogoId),
    ])
  )

  const [filtroId, setFiltroId] = useState<string | null>(null)
  const [soloTienda, setSoloTienda] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<ProductoCatalogo | null>(null)
  const [proyectoOrigenId, setProyectoOrigenId] = useState<string | null>(null)
  const [yaAbiertoDesdeLaURL, setYaAbiertoDesdeLaURL] = useState(false)

  const productosVisibles = (filtroId ? productos.filter((p) => p.id === filtroId) : productos)
    .filter((p) => !soloTienda || catalogoIdsEnTienda.has(p.id))

  const abrirNuevo = useCallback(() => {
    setEditando(null)
    setProyectoOrigenId(null)
    setModalAbierto(true)
  }, [])

  // Detectar si venimos desde cotizador y abrir automáticamente el modal
  useEffect(() => {
    if (!yaAbiertoDesdeLaURL) {
      const source = searchParams.get('source')
      const proyectoId = searchParams.get('proyectoId')

      if (source === 'cotizador' && proyectoId) {
        setEditando(null)
        setProyectoOrigenId(proyectoId)
        setModalAbierto(true)
        setYaAbiertoDesdeLaURL(true)
      }
    }
  }, [searchParams, yaAbiertoDesdeLaURL])

  const abrirEdicion = useCallback((producto: ProductoCatalogo) => {
    setEditando(producto)
    setProyectoOrigenId(null)
    setModalAbierto(true)
  }, [])

  const cerrarModal = useCallback(() => {
    setModalAbierto(false)
    setEditando(null)
    setProyectoOrigenId(null)
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Catálogo</h1>
          <p className="text-sm text-text-muted mt-1">Productos de diseño y desarrollo — CLASE de todo el sistema</p>
        </div>
        <Button variant="primary" size="md" onClick={abrirNuevo}>
          + Nuevo producto
        </Button>
      </header>

      {/* Filtro (diseño §6 #2): SmartSearch filtra por descripción/SKU/tipo + toggle universo tienda */}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[240px] max-w-md">
          <SmartSearch
            items={productos.map((p) => ({
              id: p.id,
              sku: p.sku,
              descripcion: p.descripcion,
              tipo: p.tipo,
              precioPublico: p.precioPublico,
              precioDirecto: p.precioDirecto,
              categoriaComercial: p.categoriaComercial,
            }))}
            onSelect={(item) => setFiltroId(item.id)}
            placeholder="Filtrar catálogo..."
            label="Producto"
            allowCreate={false}
          />
        </div>
        {filtroId && (
          <Button variant="ghost" size="md" onClick={() => setFiltroId(null)}>
            Limpiar
          </Button>
        )}
        <label className="flex items-center gap-1.5 mb-2.5 shrink-0">
          <input
            type="checkbox"
            checked={soloTienda}
            onChange={(e) => setSoloTienda(e.target.checked)}
            className="rounded border border-border-subtle cursor-pointer"
          />
          <span className="text-sm text-text-heading">Solo productos de tienda</span>
        </label>
        <span className="text-xs text-text-muted mb-2.5">{productosVisibles.length} de {productos.length}</span>
      </div>

      {/* Grid ultra compacto (≥200 componentes en el universo compras/cotización — disenio_p27 §6.2).
          Sin "Publicado en web" en la tarjeta: ese flag no alimenta /colecciones (lo hace
          ProductoTienda), mostrarlo acá confundía dos universos distintos. */}
      <section>
        {productosVisibles.length === 0 ? (
          <p className="px-3 py-6 text-sm text-text-muted italic">
            {filtroId || soloTienda ? 'Sin resultados para el filtro actual.' : 'Sin productos en el catálogo.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {productosVisibles.map((p) => {
              const enTienda = catalogoIdsEnTienda.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !p.anulado && abrirEdicion(p)}
                  disabled={p.anulado}
                  className={`group flex items-center gap-2 rounded-md border border-border-subtle bg-bg-raised p-1.5 text-left transition-colors duration-fast hover:border-gold-400 disabled:cursor-not-allowed ${
                    p.anulado ? 'opacity-50' : ''
                  }`}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-border-subtle bg-bg-alt">
                    {p.imagenUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs mock/blob temporales
                      <img src={p.imagenUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-text-muted">
                        {p.sku.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-text-heading" title={p.descripcion}>{p.descripcion}</p>
                    <p className="truncate font-mono text-[10px] text-text-muted">{p.sku}</p>
                    <p className="font-mono text-[11px] text-text-heading">
                      {p.precioPublico ? formatCOP(parseNum(p.precioPublico)) : '—'}
                    </p>
                    {/* t-165: metadata "última actualización" visible en la tarjeta. */}
                    <p className="text-[9px] text-text-muted">act. {formatRelativeDate(p.updatedAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    {p.anulado && <Badge tone="danger" dot>Anulado</Badge>}
                    {enTienda && !p.anulado && (
                      <span title="Vinculado a un producto de tienda" className="text-[9px] uppercase tracking-wide text-gold-600 font-medium">
                        Tienda
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Form completo de producto (t-139/t-165): el mismo modal se reutiliza desde el
          cotizador — crear y editar son exactamente el mismo formulario. */}
      {modalAbierto && (
        <ProductoFormModal
          catalogo={store.catalogo.listar()}
          proveedores={store.proveedores.listar()}
          crearProducto={store.catalogo.crear}
          actualizarProducto={store.catalogo.actualizar}
          eliminarProducto={store.catalogo.eliminar}
          crearProveedor={store.proveedores.crear}
          open={true}
          producto={editando}
          proyectoOrigenId={proyectoOrigenId}
          onClose={cerrarModal}
        />
      )}
    </div>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-6"><p className="text-text-muted">Cargando catálogo...</p></div>}>
      <CatalogoPageContent />
    </Suspense>
  )
}
