'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { InputField } from '@/components/veta/input-field'
import { MoneyInput } from '@/components/veta/money-input'
import { NumberInput } from '@/components/veta/number-input'
import { SmartSearch } from '@/components/veta/smart-search'
import { ImagePicker } from '@/components/veta/image-picker'
import { ProductoFicha, type ProductoFichaData } from '@/components/veta/producto-ficha'
import { useDataStore, type ProductoCatalogo } from '@/lib/data'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

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

// Vocabulario H07 (glosario_h07.md): "Producto fijo"; el resto de tipos del
// catálogo (insumo/herraje/servicio) se muestran con su código tal cual vive
// en `productos_catalogo.tipo` — mismos valores de los fixtures.
const TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: 'producto_fijo', label: 'Producto fijo' },
  { value: 'insumo', label: 'insumo' },
  { value: 'herraje', label: 'herraje' },
  { value: 'servicio', label: 'servicio' },
]

interface ProductoForm {
  sku: string
  descripcion: string
  tipo: string
  unidadMedida: string
  precioDirecto: string
  precioPublico: string
  stockActual: string
  imagenes: string[]
  categoriaComercial: string
  proveedorId: string
  publicadoWeb: boolean
  proyectoOrigenId: string | null
  error: string | null
}

const EMPTY_FORM: ProductoForm = {
  sku: '',
  descripcion: '',
  tipo: '',
  unidadMedida: '',
  precioDirecto: '',
  precioPublico: '',
  stockActual: '0',
  imagenes: [],
  categoriaComercial: '',
  proveedorId: '',
  publicadoWeb: false,
  proyectoOrigenId: null,
  error: null,
}

function formFromProducto(p: ProductoCatalogo): ProductoForm {
  return {
    sku: p.sku,
    descripcion: p.descripcion,
    tipo: p.tipo ?? '',
    unidadMedida: p.unidadMedida,
    precioDirecto: p.precioDirecto ?? '',
    precioPublico: p.precioPublico ?? '',
    stockActual: String(p.stockActual),
    imagenes: [p.imagenUrl, ...(p.galeriaImagenesUrl ?? [])].filter(Boolean) as string[],
    categoriaComercial: p.categoriaComercial ?? '',
    proveedorId: p.proveedorId ?? '',
    publicadoWeb: p.publicadoWeb,
    proyectoOrigenId: p.proyectoOrigenId ?? null,
    error: null,
  }
}

// t-139: la ficha en vivo se alimenta del form (portada = imagenes[0], galería = resto).
function fichaDesdeForm(form: ProductoForm): ProductoFichaData {
  return {
    descripcion: form.descripcion,
    sku: form.sku,
    unidadMedida: form.unidadMedida,
    precioPublico: form.precioPublico,
    precioDirecto: form.precioDirecto,
    stockActual: parseNum(form.stockActual),
    categoriaComercial: form.categoriaComercial,
    tipo: form.tipo,
    publicadoWeb: form.publicadoWeb,
    imagenUrl: form.imagenes[0] ?? null,
    galeriaImagenesUrl: form.imagenes.slice(1),
  }
}

function CatalogoPageContent() {
  const store = useDataStore()
  const searchParams = useSearchParams()
  const productos = store.catalogo.listar()
  const proveedores = store.proveedores.listar()

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
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductoForm>(EMPTY_FORM)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [yaAbiertoDesdeLaURL, setYaAbiertoDesdeLaURL] = useState(false)
  const { guard: guardGuardarProducto, isPending: guardandoProducto } = usePendingGuard()

  const productosVisibles = (filtroId ? productos.filter((p) => p.id === filtroId) : productos)
    .filter((p) => !soloTienda || catalogoIdsEnTienda.has(p.id))

  const abrirNuevo = useCallback(() => {
    setEditandoId(null)
    setForm(EMPTY_FORM)
    setModalAbierto(true)
  }, [])

  // Detectar si venimos desde cotizador y abrir automáticamente el modal
  useEffect(() => {
    if (!yaAbiertoDesdeLaURL) {
      const source = searchParams.get('source')
      const proyectoId = searchParams.get('proyectoId')

      if (source === 'cotizador' && proyectoId) {
        // Abrir el modal de nuevo producto automáticamente
        setEditandoId(null)
        setForm({
          ...EMPTY_FORM,
          proyectoOrigenId: proyectoId,
        })
        setModalAbierto(true)
        setYaAbiertoDesdeLaURL(true)
      }
    }
  }, [searchParams, yaAbiertoDesdeLaURL])

  const abrirEdicion = useCallback((producto: ProductoCatalogo) => {
    setEditandoId(producto.id)
    setForm(formFromProducto(producto))
    setModalAbierto(true)
  }, [])

  const setCampo = useCallback(<K extends keyof Omit<ProductoForm, 'error'>>(campo: K, valor: ProductoForm[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }, [])

  const validarForm = (): string | null => {
    if (!form.descripcion.trim()) return 'La descripción es obligatoria'
    if (!form.sku.trim()) return 'El SKU es obligatorio'
    if (!form.unidadMedida.trim()) return 'La unidad es obligatoria'
    // R1: sku único (excluyendo el producto en edición).
    const skuExiste = productos.some((p) => p.sku === form.sku.trim() && p.id !== editandoId)
    if (skuExiste) return 'El SKU ya existe'
    const precioDirecto = parseNum(form.precioDirecto)
    const precioPublico = parseNum(form.precioPublico)
    // R3: precio directo ≤ precio público (si ambos presentes).
    if (form.precioDirecto.trim() && form.precioPublico.trim() && precioDirecto > precioPublico) {
      return 'El precio directo no puede superar el precio público'
    }
    // R6: stock ≥ 0.
    if (parseNum(form.stockActual) < 0) return 'El stock no puede ser negativo'
    // R5: publicar exige precio público e imagen o galería.
    if (form.publicadoWeb) {
      if (!form.precioPublico.trim()) return 'El precio público es obligatorio para publicar'
      if (form.imagenes.length === 0) return 'La imagen o galería es obligatoria para publicar'
    }
    return null
  }

  const guardarProducto = async () => {
    const errorValidacion = validarForm()
    if (errorValidacion) {
      setForm((prev) => ({ ...prev, error: errorValidacion }))
      return
    }
    const payload = {
      sku: form.sku.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo || null,
      unidadMedida: form.unidadMedida.trim(),
      precioDirecto: form.precioDirecto.trim() || null,
      precioPublico: form.precioPublico.trim() || null,
      stockActual: parseNum(form.stockActual),
      proveedorId: form.proveedorId || null,
      imagenUrl: form.imagenes[0] ?? null,
      galeriaImagenesUrl: form.imagenes.slice(1),
      categoriaComercial: form.categoriaComercial.trim() || null,
      publicadoWeb: form.publicadoWeb,
      proyectoOrigenId: form.proyectoOrigenId || null,
    }
    const resultado = editandoId
      ? await store.catalogo.actualizar(editandoId, payload)
      : await store.catalogo.crear(payload)

    if (!resultado) {
      setForm((prev) => ({ ...prev, error: 'No se pudo guardar el producto: alguna regla de validación falló' }))
      return
    }
    setModalAbierto(false)
    setBannerError(null)
  }

  const anularProducto = async (producto: ProductoCatalogo) => {
    setBannerError(null)
    await store.catalogo.eliminar(producto.id)
    setModalAbierto(false)
  }

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

      {bannerError && (
        <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {bannerError}
        </div>
      )}

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

      {/* Panel full-screen (t-139): formulario (col 1) + ficha de presentación (col 2).
          Preserva el deep-link ?source=cotizador&proyectoId= de R9 sin cambiar rutas. */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg-paper">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-paper px-6 py-3">
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="rounded-sm px-2 py-1 text-sm font-medium text-text-heading transition-colors hover:bg-bg-raised"
            >
              ← Volver
            </button>
            <h2 className="font-display text-lg font-semibold text-text-heading">
              {editandoId ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="md" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => guardGuardarProducto(guardarProducto)}
                disabled={guardandoProducto}
                loading={guardandoProducto}
              >
                {editandoId ? 'Guardar cambios' : 'Crear producto'}
              </Button>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_5fr]">
              {/* Columna 1 — Formulario */}
              <div className="order-2 space-y-3 lg:order-1">
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="SKU"
                    value={form.sku}
                    onChange={(e) => setCampo('sku', e.target.value)}
                    placeholder="Ej. TAB-ROB-18"
                  />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-text-muted">Tipo</span>
                    <select
                      value={form.tipo}
                      onChange={(e) => setCampo('tipo', e.target.value)}
                      className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
                    >
                      <option value="">Sin tipo</option>
                      {TIPO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <InputField
                  label="Descripción"
                  value={form.descripcion}
                  onChange={(e) => setCampo('descripcion', e.target.value)}
                  placeholder="Ej. Tablero Roble 18mm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Unidad"
                    value={form.unidadMedida}
                    onChange={(e) => setCampo('unidadMedida', e.target.value)}
                    placeholder="Ej. m², ud, jornada"
                  />
                  <NumberInput
                    label="Stock"
                    value={form.stockActual}
                    onChange={(v) => setCampo('stockActual', v)}
                    min={0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MoneyInput
                    label="Precio directo"
                    value={form.precioDirecto}
                    onChange={(v) => setCampo('precioDirecto', v)}
                    aria-label="Precio directo"
                  />
                  <MoneyInput
                    label="Precio público"
                    value={form.precioPublico}
                    onChange={(v) => setCampo('precioPublico', v)}
                    aria-label="Precio público"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Categoría comercial"
                    value={form.categoriaComercial}
                    onChange={(e) => setCampo('categoriaComercial', e.target.value)}
                    placeholder="Ej. Maderas, Herrajes..."
                  />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-text-muted">Proveedor</span>
                    <select
                      value={form.proveedorId}
                      onChange={(e) => setCampo('proveedorId', e.target.value)}
                      className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
                    >
                      <option value="">Sin proveedor</option>
                      {proveedores.map((prov) => (
                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <ImagePicker
                  label="Imágenes (la primera es la portada)"
                  value={form.imagenes}
                  onChange={(v) => setCampo('imagenes', v)}
                  multiple={true}
                  uploadToR2
                  r2Prefix="catalogo/"
                />
                <label className="flex items-center justify-between rounded-sm border border-border-subtle bg-bg-alt/30 px-3 py-2">
                  <span className="text-sm font-medium text-text-muted">Publicado en web</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.publicadoWeb}
                    aria-label="Publicado en web"
                    onClick={() => setCampo('publicadoWeb', !form.publicadoWeb)}
                    className={`relative h-5 w-9 rounded-full transition-colors duration-fast ${
                      form.publicadoWeb ? 'bg-gold-500' : 'bg-bg-paper border border-border-subtle'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-fast ${
                        form.publicadoWeb ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </label>
                <span className="block text-xs text-text-muted">
                  Publicar exige precio público e imagen o galería (regla R5 del diseño P-27).
                </span>

                {form.error && (
                  <p role="alert" className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {form.error}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-2">
                  {editandoId ? (
                    <button
                      type="button"
                      onClick={() => {
                        const producto = productos.find((p) => p.id === editandoId)
                        if (producto) anularProducto(producto)
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Anular producto
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              </div>

              {/* Columna 2 — Ficha de presentación (sticky en desktop, arriba en móvil).
                  Preview en vivo: se actualiza con el estado del form. */}
              <div className="order-1 lg:order-2 lg:sticky lg:top-20">
                <ProductoFicha data={fichaDesdeForm(form)} />
              </div>
            </div>
          </div>
        </div>
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