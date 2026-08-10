'use client'

import { useState, useCallback } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { InputField } from '@/components/veta/input-field'
import { MoneyInput } from '@/components/veta/money-input'
import { NumberInput } from '@/components/veta/number-input'
import { SmartSearch } from '@/components/veta/smart-search'
import { ImagePicker } from '@/components/veta/image-picker'
import { Modal } from '@/components/veta/modal'
import { useDataStore, type ProductoCatalogo } from '@/lib/data'

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

function tipoLabel(tipo: string | null): string {
  if (!tipo) return '—'
  const match = TIPO_OPTIONS.find((o) => o.value === tipo)
  return match ? match.label : tipo
}

interface ProductoForm {
  sku: string
  descripcion: string
  tipo: string
  unidadMedida: string
  precioDirecto: string
  precioPublico: string
  stockActual: string
  imagenUrl: string[]
  categoriaComercial: string
  proveedorId: string
  publicadoWeb: boolean
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
  imagenUrl: [],
  categoriaComercial: '',
  proveedorId: '',
  publicadoWeb: false,
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
    imagenUrl: p.imagenUrl ? [p.imagenUrl] : [],
    categoriaComercial: p.categoriaComercial ?? '',
    proveedorId: p.proveedorId ?? '',
    publicadoWeb: p.publicadoWeb,
    error: null,
  }
}

export default function CatalogoPage() {
  const store = useDataStore()
  const productos = store.catalogo.listar()
  const proveedores = store.proveedores.listar()
  const proveedorMap = new Map<string, string>(proveedores.map((p) => [p.id, p.nombre]))

  const [filtroId, setFiltroId] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductoForm>(EMPTY_FORM)
  const [bannerError, setBannerError] = useState<string | null>(null)

  const productosVisibles = filtroId
    ? productos.filter((p) => p.id === filtroId)
    : productos

  const abrirNuevo = useCallback(() => {
    setEditandoId(null)
    setForm(EMPTY_FORM)
    setModalAbierto(true)
  }, [])

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
    // R5: publicar exige precio público e imagen.
    if (form.publicadoWeb) {
      if (!form.precioPublico.trim()) return 'El precio público es obligatorio para publicar'
      if (form.imagenUrl.length === 0) return 'La imagen es obligatoria para publicar'
    }
    return null
  }

  const guardarProducto = () => {
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
      imagenUrl: form.imagenUrl[0] ?? null,
      categoriaComercial: form.categoriaComercial.trim() || null,
      publicadoWeb: form.publicadoWeb,
    }
    const resultado = editandoId
      ? store.catalogo.actualizar(editandoId, payload)
      : store.catalogo.crear(payload)

    if (!resultado) {
      setForm((prev) => ({ ...prev, error: 'No se pudo guardar el producto: alguna regla de validación falló' }))
      return
    }
    setModalAbierto(false)
    setBannerError(null)
  }

  const togglePublicado = (producto: ProductoCatalogo) => {
    setBannerError(null)
    if (!producto.publicadoWeb) {
      // R5: publicar exige precio público + imagen.
      if (!producto.precioPublico) {
        setBannerError(`"{producto.sku}" no se puede publicar: el precio público es obligatorio para publicar`)
        return
      }
      if (!producto.imagenUrl) {
        setBannerError(`El producto "${producto.sku}" no se puede publicar: la imagen es obligatoria para publicar`)
        return
      }
    }
    const resultado = store.catalogo.actualizar(producto.id, { publicadoWeb: !producto.publicadoWeb })
    if (!resultado) {
      setBannerError(`El producto "${producto.sku}" no se pudo publicar: alguna regla de validación falló`)
    }
  }

  const anularProducto = (producto: ProductoCatalogo) => {
    setBannerError(null)
    store.catalogo.eliminar(producto.id)
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

      {/* Filtro (diseño §6 #2): SmartSearch filtra la tabla por descripción/SKU/tipo */}
      <div className="mb-4 max-w-md">
        <div className="flex items-end gap-2">
          <div className="flex-1">
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
        </div>
      </div>

      {/* Tabla de productos — DataTable Familia A (densa), divs (no hay Table primitiva) */}
      <section className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[80px_minmax(220px,1.6fr)_100px_70px_150px_50px_100px_110px] border-b border-border-subtle bg-bg-alt/40 px-3 py-2 text-xs font-semibold text-text-muted">
              <span>SKU</span>
              <span>Descripción</span>
              <span>Tipo</span>
              <span>Unidad</span>
              <span>Precios</span>
              <span>Stock</span>
              <span>Publicado en web</span>
              <span className="text-right">Acciones</span>
            </div>

            {productosVisibles.length === 0 ? (
              <p className="px-3 py-6 text-sm text-text-muted italic">
                {filtroId ? 'Sin resultados para el filtro actual.' : 'Sin productos en el catálogo.'}
              </p>
            ) : (
              productosVisibles.map((p) => {
                const proveedorNombre = p.proveedorId ? proveedorMap.get(p.proveedorId) : null
                return (
                  <div
                    key={p.id}
                    className={`grid grid-cols-[80px_minmax(220px,1.6fr)_100px_70px_150px_50px_100px_110px] items-center border-b border-border-subtle/50 px-3 py-2 text-sm last:border-0 ${
                      p.anulado ? 'opacity-50' : ''
                    }`}
                  >
                    <span className="font-mono text-xs text-text-muted">{p.sku}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-text-heading">{p.descripcion}</span>
                      {(p.categoriaComercial || proveedorNombre) && (
                        <span className="block truncate text-xs text-text-muted">
                          {p.categoriaComercial}
                          {p.categoriaComercial && proveedorNombre ? ' · ' : ''}
                          {proveedorNombre}
                        </span>
                      )}
                    </span>
                    <span>
                      <Badge tone={p.tipo === 'producto_fijo' ? 'info' : 'neutral'}>{tipoLabel(p.tipo)}</Badge>
                    </span>
                    <span className="text-xs text-text-muted">{p.unidadMedida}</span>
                    <span className="font-mono text-xs">
                      <span className="block text-text-heading">{p.precioPublico ? formatCOP(parseNum(p.precioPublico)) : '—'}</span>
                      {p.precioDirecto && (
                        <span className="block text-text-muted">directo {formatCOP(parseNum(p.precioDirecto))}</span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-text-heading">{p.stockActual}</span>
                    <span>
                      {p.anulado ? (
                        <Badge tone="danger" dot>Anulado</Badge>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={p.publicadoWeb}
                          aria-label={`Publicado en web: ${p.descripcion}`}
                          onClick={() => togglePublicado(p)}
                          className={`relative h-5 w-9 rounded-full transition-colors duration-fast ${
                            p.publicadoWeb ? 'bg-gold-500' : 'bg-bg-alt border border-border-subtle'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-fast ${
                              p.publicadoWeb ? 'left-[18px]' : 'left-0.5'
                            }`}
                          />
                        </button>
                      )}
                    </span>
                    <span className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(p)}
                        disabled={p.anulado}
                        aria-label={`Editar ${p.descripcion}`}
                        title="Editar producto"
                        className="p-1.5 rounded text-text-muted hover:text-gold-600 hover:bg-bg-alt transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M11.5 2.5l2 2L5 13l-2.5.5.5-2.5 8.5-8.5z" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => anularProducto(p)}
                        disabled={p.anulado}
                        aria-label={`Anular ${p.descripcion}`}
                        title="Anular producto (no borra totales históricos)"
                        className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-bg-alt transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 4h12" strokeLinecap="round" />
                          <path d="M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12.5 4l-.6 9.2a1.5 1.5 0 0 1-1.5 1.3H5.6a1.5 1.5 0 0 1-1.5-1.3L3.5 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Modal Crear / Editar producto */}
      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editandoId ? 'Editar producto' : 'Nuevo producto'}
      >
        <div className="space-y-3">
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
            label="Imagen"
            value={form.imagenUrl}
            onChange={(v) => setCampo('imagenUrl', v)}
            multiple={false}
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
            Publicar exige precio público e imagen (regla R5 del diseño P-27).
          </span>

          {form.error && (
            <p role="alert" className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {form.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" onClick={guardarProducto}>
              {editandoId ? 'Guardar cambios' : 'Crear Producto'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}