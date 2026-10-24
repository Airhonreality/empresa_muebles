'use client'

import { useCallback, useState } from 'react'
import { Modal } from '@/components/veta/modal'
import { Button } from '@/components/veta/button'
import { EntityFields, type EntityFieldSpec } from '@/components/veta/entity-fields'
import { ImagePicker } from '@/components/veta/image-picker'
import { FilePicker } from '@/components/veta/file-picker'
import { ProductoFicha, type ProductoFichaData } from '@/components/veta/producto-ficha'
import { ProveedorFormModal } from '@/components/veta/proveedor-form-modal'
import {
  useDataStore,
  type CampoPersonalizadoProducto,
  type DataStore,
  type ProductoCatalogo,
  type Proveedor,
} from '@/lib/data'
import { generarSkuUnico } from '@/lib/data/skus'
import { formatRelativeDate } from '@/lib/utils/format'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

// Vocabulario H07 (glosario_h07.md): "Producto fijo"; el resto de tipos del catálogo
// (insumo/herraje/servicio) se muestran con su código tal cual vive en
// `productos_catalogo.tipo` — mismos valores de los fixtures.
const TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: 'producto_fijo', label: 'Producto fijo' },
  { value: 'insumo', label: 'insumo' },
  { value: 'herraje', label: 'herraje' },
  { value: 'servicio', label: 'servicio' },
]

export interface ProductoForm {
  sku: string
  descripcion: string
  tipo: string
  unidadMedida: string
  precioDirecto: string
  precioPublico: string
  stockActual: string
  imagenes: string[]
  fichaTecnicaUrls: string[]
  camposPersonalizados: CampoPersonalizadoProducto[]
  categoriaComercial: string
  proveedorId: string
  publicadoWeb: boolean
  proyectoOrigenId: string | null
  error: string | null
}

export const PRODUCTO_EMPTY_FORM: ProductoForm = {
  sku: '',
  descripcion: '',
  tipo: '',
  unidadMedida: '',
  precioDirecto: '',
  precioPublico: '',
  stockActual: '0',
  imagenes: [],
  fichaTecnicaUrls: [],
  camposPersonalizados: [],
  categoriaComercial: '',
  proveedorId: '',
  publicadoWeb: false,
  proyectoOrigenId: null,
  error: null,
}

const PRODUCTO_DESCRIPCION_FIELD: EntityFieldSpec<Omit<ProductoForm, 'error'>>[] = [
  { key: 'descripcion', label: 'Descripción', placeholder: 'Ej. Tablero Roble 18mm' },
]
const PRODUCTO_UNIDAD_STOCK_FIELDS: EntityFieldSpec<Omit<ProductoForm, 'error'>>[] = [
  { key: 'unidadMedida', label: 'Unidad', placeholder: 'Ej. m², ud, jornada' },
  { key: 'stockActual', label: 'Stock', kind: 'number', min: 0 },
]
const PRODUCTO_PRECIOS_FIELDS: EntityFieldSpec<Omit<ProductoForm, 'error'>>[] = [
  { key: 'precioDirecto', label: 'Precio directo', kind: 'money' },
  { key: 'precioPublico', label: 'Precio público', kind: 'money' },
]
const PRODUCTO_CATEGORIA_FIELD: EntityFieldSpec<Omit<ProductoForm, 'error'>>[] = [
  { key: 'categoriaComercial', label: 'Categoría comercial', placeholder: 'Ej. Maderas, Herrajes...' },
]

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
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
    fichaTecnicaUrls: p.fichaTecnicaUrls ?? [],
    camposPersonalizados: p.camposPersonalizados ?? [],
    categoriaComercial: p.categoriaComercial ?? '',
    proveedorId: p.proveedorId ?? '',
    publicadoWeb: p.publicadoWeb,
    proyectoOrigenId: p.proyectoOrigenId ?? null,
    error: null,
  }
}

// t-139: la ficha en vivo se alimenta del form (portada = imagenes[0], galería = resto).
function fichaDesdeForm(form: ProductoForm, sku: string, actualizadoEn?: string): ProductoFichaData {
  return {
    descripcion: form.descripcion,
    sku,
    unidadMedida: form.unidadMedida,
    precioPublico: form.precioPublico,
    precioDirecto: form.precioDirecto,
    stockActual: parseNum(form.stockActual),
    categoriaComercial: form.categoriaComercial,
    tipo: form.tipo,
    publicadoWeb: form.publicadoWeb,
    imagenUrl: form.imagenes[0] ?? null,
    galeriaImagenesUrl: form.imagenes.slice(1),
    fichaTecnicaUrls: form.fichaTecnicaUrls,
    camposPersonalizados: form.camposPersonalizados,
    actualizadoEn,
  }
}

export interface ProductoFormModalProps {
  open: boolean
  onClose: () => void
  /** Si viene, el mismo modal edita; si no, crea. */
  producto?: ProductoCatalogo | null
  /** Se conserva al crear desde el cotizador (trazabilidad del producto creado en contexto). */
  proyectoOrigenId?: string | null
  /** Precarga la descripción al crear desde la búsqueda del cotizador. */
  initialDescripcion?: string
  onSaved?: (producto: ProductoCatalogo) => void
  catalogo?: ProductoCatalogo[]
  proveedores?: Proveedor[]
  crearProducto?: DataStore['catalogo']['crear']
  actualizarProducto?: DataStore['catalogo']['actualizar']
  eliminarProducto?: DataStore['catalogo']['eliminar']
  crearProveedor?: (payload: Partial<Proveedor> & { nombre: string }) => Promise<Proveedor>
}

export function ProductoFormModal({
  open,
  onClose,
  producto,
  proyectoOrigenId,
  initialDescripcion,
  onSaved,
  catalogo,
  proveedores,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  crearProveedor,
}: ProductoFormModalProps) {
  const store = useDataStore()
  const productos = catalogo ?? store.catalogo.listar()
  const listaProveedores = proveedores ?? store.proveedores.listar()
  const crear = crearProducto ?? store.catalogo.crear
  const actualizar = actualizarProducto ?? store.catalogo.actualizar
  const eliminar = eliminarProducto ?? store.catalogo.eliminar

  const [form, setForm] = useState<ProductoForm>(() =>
    producto
      ? formFromProducto(producto)
      : {
          ...PRODUCTO_EMPTY_FORM,
          descripcion: initialDescripcion ?? '',
          proyectoOrigenId: proyectoOrigenId ?? null,
        }
  )
  const [proveedorModalAbierto, setProveedorModalAbierto] = useState(false)
  const { guard, isPending } = usePendingGuard()

  // t-165 (SKU autogenerado): en edición se muestra el SKU congelado del producto real;
  // en creación, un preview read-only que se recalcula al escribir la descripción.
  const skuVisible = producto
    ? producto.sku
    : form.descripcion.trim()
      ? generarSkuUnico(form.descripcion, new Date(), productos.map((p) => p.sku))
      : ''

  const setCampo = useCallback(
    <K extends keyof Omit<ProductoForm, 'error'>>(campo: K, valor: ProductoForm[K]) => {
      setForm((prev) => ({ ...prev, [campo]: valor }))
    },
    []
  )

  const setCampoPersonalizado = (idx: number, patch: Partial<CampoPersonalizadoProducto>) => {
    setForm((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }))
  }

  const agregarCampoPersonalizado = () => {
    setForm((prev) => ({ ...prev, camposPersonalizados: [...prev.camposPersonalizados, { clave: '', valor: '' }] }))
  }

  const quitarCampoPersonalizado = (idx: number) => {
    setForm((prev) => ({ ...prev, camposPersonalizados: prev.camposPersonalizados.filter((_, i) => i !== idx) }))
  }

  const validarForm = (): string | null => {
    if (!form.descripcion.trim()) return 'La descripción es obligatoria'
    if (!form.unidadMedida.trim()) return 'La unidad es obligatoria'
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
      // t-165: el SKU no se envía — lo genera el server/store en la creación y queda
      // inmutable en la edición.
      descripcion: form.descripcion.trim(),
      tipo: form.tipo || null,
      unidadMedida: form.unidadMedida.trim(),
      precioDirecto: form.precioDirecto.trim() || null,
      precioPublico: form.precioPublico.trim() || null,
      stockActual: parseNum(form.stockActual),
      proveedorId: form.proveedorId || null,
      imagenUrl: form.imagenes[0] ?? null,
      galeriaImagenesUrl: form.imagenes.slice(1),
      fichaTecnicaUrls: form.fichaTecnicaUrls,
      camposPersonalizados: form.camposPersonalizados,
      categoriaComercial: form.categoriaComercial.trim() || null,
      publicadoWeb: form.publicadoWeb,
      proyectoOrigenId: form.proyectoOrigenId || null,
    }
    const resultado = producto
      ? await actualizar(producto.id, payload)
      : await crear(payload)

    if (!resultado) {
      setForm((prev) => ({ ...prev, error: 'No se pudo guardar el producto: alguna regla de validación falló' }))
      return
    }
    onSaved?.(resultado)
    onClose()
  }

  const anularProducto = async () => {
    if (!producto) return
    await eliminar(producto.id)
    onClose()
  }

  const onProveedorCreado = (proveedor: Proveedor) => {
    setCampo('proveedorId', proveedor.id)
    setProveedorModalAbierto(false)
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={producto ? 'Editar producto' : 'Nuevo producto'}
        maxWidthClassName="max-w-6xl"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_5fr]">
          {/* Columna 1 — Formulario */}
          <div className="order-2 space-y-3 lg:order-1">
            <div className="grid grid-cols-2 gap-3">
              {/* t-165: SKU autogenerado e inmutable — nunca es un campo editable. */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">SKU (autogenerado)</span>
                <div
                  className={`min-h-[44px] rounded-sm border border-dashed border-border-subtle bg-bg-alt/40 px-3 py-2.5 font-mono text-sm text-text-heading ${
                    skuVisible ? '' : 'text-text-muted'
                  }`}
                >
                  {skuVisible || 'Se genera al escribir la descripción'}
                </div>
              </div>
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
            <EntityFields<Omit<ProductoForm, 'error'>> fields={PRODUCTO_DESCRIPCION_FIELD} values={form} onChange={(campo, valor) => setCampo(campo, valor)} />
            <EntityFields<Omit<ProductoForm, 'error'>>
              className="grid grid-cols-2 gap-3"
              fields={PRODUCTO_UNIDAD_STOCK_FIELDS}
              values={form}
              onChange={(campo, valor) => setCampo(campo, valor)}
            />
            <EntityFields<Omit<ProductoForm, 'error'>>
              className="grid grid-cols-2 gap-3"
              fields={PRODUCTO_PRECIOS_FIELDS}
              values={form}
              onChange={(campo, valor) => setCampo(campo, valor)}
            />
            <div className="grid grid-cols-2 gap-3">
              <EntityFields<Omit<ProductoForm, 'error'>> fields={PRODUCTO_CATEGORIA_FIELD} values={form} onChange={(campo, valor) => setCampo(campo, valor)} />
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Proveedor</span>
                <select
                  value={form.proveedorId}
                  onChange={(e) => {
                    if (e.target.value === '__crear_proveedor__') {
                      setProveedorModalAbierto(true)
                      return
                    }
                    setCampo('proveedorId', e.target.value)
                  }}
                  className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
                >
                  <option value="">Sin proveedor</option>
                  {listaProveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                  <option value="__crear_proveedor__">+ Crear proveedor…</option>
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

            {/* 2026-09-17: ficha técnica del producto — imagenes y/o documentos PDF/DWG
                (las sube el FilePicker a R2; el server action valida R2-only). */}
            <FilePicker
              label="Ficha técnica (imagen o archivo PDF/DWG...)"
              value={form.fichaTecnicaUrls}
              onChange={(v) => setCampo('fichaTecnicaUrls', v)}
              multiple={true}
              r2Prefix="catalogo/ficha-tecnica/"
            />

            {/* Campos personalizados libres clave+valor (2026-09-17). */}
            <div className="space-y-2 rounded-sm border border-border-subtle bg-bg-alt/30 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">Campos personalizados</span>
                <button
                  type="button"
                  onClick={agregarCampoPersonalizado}
                  className="text-xs text-gold-700 transition-colors duration-fast hover:underline"
                >
                  + Agregar campo
                </button>
              </div>
              {form.camposPersonalizados.length === 0 && (
                <p className="text-xs text-text-muted italic">
                  Sin campos. Ej. &quot;número de aperturas&quot; {'\u2192'} &quot;60000&quot;, &quot;módulo elástico&quot; {'\u2192'} &quot;0.42&quot;.
                </p>
              )}
              {form.camposPersonalizados.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={c.clave}
                    onChange={(e) => setCampoPersonalizado(i, { clave: e.target.value })}
                    placeholder="Clave (ej. Número de aperturas)"
                    className="min-w-0 flex-[3] min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
                  />
                  <input
                    value={c.valor}
                    onChange={(e) => setCampoPersonalizado(i, { valor: e.target.value })}
                    placeholder="Valor (ej. 60000)"
                    className="min-w-0 flex-[2] min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => quitarCampoPersonalizado(i)}
                    aria-label="Quitar campo"
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs leading-none text-text-muted transition-colors duration-fast hover:bg-red-600 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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
              {producto ? (
                <button
                  type="button"
                  onClick={anularProducto}
                  className="text-xs text-red-600 hover:underline"
                >
                  Anular producto
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="md" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => guard(guardarProducto)}
                  disabled={isPending}
                  loading={isPending}
                >
                  {producto ? 'Guardar cambios' : 'Crear producto'}
                </Button>
              </div>
            </div>
          </div>

          {/* Columna 2 — Ficha de presentación (sticky en desktop, arriba en móvil).
              Preview en vivo: se actualiza con el estado del form. */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-0">
            <ProductoFicha
              data={fichaDesdeForm(
                form,
                skuVisible,
                producto ? formatRelativeDate(producto.updatedAt) : undefined
              )}
            />
          </div>
        </div>
      </Modal>

      {proveedorModalAbierto && (
        <ProveedorFormModal
          open={true}
          onClose={() => setProveedorModalAbierto(false)}
          crearProveedor={crearProveedor}
          onSaved={onProveedorCreado}
        />
      )}
    </>
  )
}
