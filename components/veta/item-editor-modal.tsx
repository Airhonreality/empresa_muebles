'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Modal } from '@/components/veta/modal'
import { Button } from '@/components/veta/button'
import { SmartSearch } from '@/components/veta/smart-search'
import { MoneyInput } from '@/components/veta/money-input'
import { ImagePicker } from '@/components/veta/image-picker'
import type { GrupoItem, ItemVariante, ProductoCatalogo } from '@/lib/data'

interface ItemEditorModalProps {
  item: ItemVariante
  producto: ProductoCatalogo | undefined
  catalogo: ProductoCatalogo[]
  /** t-157 (2026-09-10): grupos/subgrupos disponibles en el espacio de este ítem, para asignarlo. */
  grupos: GrupoItem[]
  onClose: () => void
  onSave: (cambios: Partial<ItemVariante>) => Promise<void>
  onReemplazarProducto: (nuevoProducto: ProductoCatalogo, mantenerPrecioActual: boolean) => Promise<void>
  onEliminar: () => Promise<void>
}

/** Nombre "Grupo › Subgrupo" para que el select se lea sin ambigüedad cuando hay anidamiento. */
function rutaGrupo(grupo: GrupoItem, porId: Map<string, GrupoItem>): string {
  const partes: string[] = [grupo.nombre]
  let actual = grupo
  while (actual.padreId) {
    const padre = porId.get(actual.padreId)
    if (!padre) break
    partes.unshift(padre.nombre)
    actual = padre
  }
  return partes.join(' › ')
}

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/* Iconos SVG hardcodeados (patrón del proyecto: sin librería de iconos, inline y stroke=currentColor). */
function IconoEditar() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function IconoReemplazo() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" />
      <path d="M21 21v-5h-5" />
    </svg>
  )
}

function IconoEliminar() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

const FUENTES_REFERENCIALES = [
  { valor: 'electrodomestico', etiqueta: 'Electrodoméstico' },
  { valor: 'obra_civil', etiqueta: 'Obra civil' },
  { valor: 'servicio_tercero', etiqueta: 'Servicio de tercero' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const

export function ItemEditorModal({
  item,
  producto,
  catalogo,
  grupos,
  onClose,
  onSave,
  onReemplazarProducto,
  onEliminar,
}: ItemEditorModalProps) {
  const [modo, setModo] = useState<'edicion' | 'reemplazo'>('edicion')
  
  // Campos editables
  const [nombrePersonalizado, setNombrePersonalizado] = useState(
    item.nombrePersonalizado ?? producto?.descripcion ?? ''
  )
  const [cantidad, setCantidad] = useState(item.cantidad)
  const [precioUnitario, setPrecioUnitario] = useState(item.precioUnitario)
  const [esReferencial, setEsReferencial] = useState(item.esReferencial)
  // Referencial: fuente + grupo (schema items_variante.fuente_referencial / grupo_referencial).
  const [fuenteReferencial, setFuenteReferencial] = useState<ItemVariante['fuenteReferencial']>(
    item.fuenteReferencial ?? null
  )
  const [grupoReferencial, setGrupoReferencial] = useState(item.grupoReferencial ?? '')
  // Requerimiento Supervisor 2026-09-10: comentario libre por ítem, visible en la propuesta pública.
  const [comentario, setComentario] = useState(item.comentario ?? '')
  // t-157 (2026-09-10): grupo/subgrupo al que pertenece este ítem dentro de su espacio.
  const [grupoItemId, setGrupoItemId] = useState(item.grupoItemId ?? '')
  // Reinicio modal 2026-09-18: foto propia del ítem (precedencia sobre imagen de catálogo).
  const [fotoUrl, setFotoUrl] = useState(item.fotoUrl ?? '')
  const gruposPorId = new Map(grupos.map((g) => [g.id, g]))

  // Reemplazo
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCatalogo | null>(null)
  const [mantenerPrecioActual, setMantenerPrecioActual] = useState(true)

  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const totalCalculado = parseNum(cantidad) * parseNum(precioUnitario)

  const handleGuardarCambios = async () => {
    setGuardando(true)
    try {
      await onSave({
        nombrePersonalizado: nombrePersonalizado.trim() || null,
        cantidad,
        precioUnitario,
        esReferencial,
        fuenteReferencial: esReferencial ? (fuenteReferencial || null) : null,
        grupoReferencial: esReferencial ? (grupoReferencial.trim() || null) : null,
        comentario: comentario.trim() || null,
        grupoItemId: grupoItemId || null,
        fotoUrl: fotoUrl.trim() || null,
      })
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  const handleConfirmarReemplazo = async () => {
    if (!productoSeleccionado) return
    setGuardando(true)
    try {
      await onReemplazarProducto(productoSeleccionado, mantenerPrecioActual)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    if (window.confirm('¿Seguro que deseas eliminar este ítem de la cotización?')) {
      setEliminando(true)
      try {
        await onEliminar()
        onClose()
      } finally {
        setEliminando(false)
      }
    }
  }

  const titulo = producto?.descripcion || item.nombrePersonalizado || 'Editar Ítem'

  return (
    <Modal open={true} onClose={onClose} title={titulo}>
      {/* Selector de Pestañas / Modos */}
      <div className="mb-4 flex border-b border-border-subtle">
        <button
          type="button"
          onClick={() => setModo('edicion')}
          className={`px-4 py-2 text-xs font-semibold transition-colors duration-fast border-b-2 ${
            modo === 'edicion'
              ? 'border-gold-500 text-gold-600 bg-bg-alt/40'
              : 'border-transparent text-text-muted hover:text-text-heading'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <IconoEditar />
            Detalles y Edición
          </span>
        </button>
        <button
          type="button"
          onClick={() => setModo('reemplazo')}
          className={`px-4 py-2 text-xs font-semibold transition-colors duration-fast border-b-2 ${
            modo === 'reemplazo'
              ? 'border-gold-500 text-gold-600 bg-bg-alt/40'
              : 'border-transparent text-text-muted hover:text-text-heading'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <IconoReemplazo />
            Reemplazar por Otro SKU
          </span>
        </button>
      </div>

      {modo === 'edicion' ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Imagen propia del Ítem (editable) + referencia de catálogo */}
            <div className="sm:w-1/3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Imagen del ítem
                </label>
                <ImagePicker
                  label="Foto propia del ítem"
                  value={fotoUrl ? [fotoUrl] : []}
                  onChange={(v) => setFotoUrl(v[0] ?? '')}
                  multiple={false}
                  r2Prefix="cotizador/items/"
                  hideGrid={true}
                />
                {fotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- URLs mock/blob temporales
                  <img
                    src={fotoUrl}
                    alt="Foto del ítem"
                    className="mt-1 aspect-[4/3] w-full rounded-sm border border-border-subtle object-cover shadow-xs"
                  />
                )}
              </div>

              {producto && (
                <div className="flex items-center gap-2 rounded-sm border border-border-subtle bg-bg-alt/40 p-1.5">
                  {producto.imagenUrl ? (
                    <Image
                      src={producto.imagenUrl}
                      alt=""
                      width={48}
                      height={36}
                      unoptimized
                      className="aspect-[4/3] h-9 w-12 shrink-0 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-sm bg-bg-paper text-[10px] text-text-muted">
                      Sin img
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-text-heading">
                      Catálogo: {producto.descripcion}
                    </p>
                    {producto.sku && (
                      <p className="font-mono text-[10px] text-text-muted">SKU: {producto.sku}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Formulario de Edición */}
            <div className="sm:w-2/3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Descripción o Nombre en Cotización
                </label>
                <input
                  type="text"
                  value={nombrePersonalizado}
                  onChange={(e) => setNombrePersonalizado(e.target.value)}
                  className="w-full rounded-sm border border-border-subtle bg-bg-paper px-2.5 py-1.5 text-xs text-text-heading focus:border-brand focus:outline-none"
                  placeholder="Ej: Mueble superior modificado"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Cantidad ({producto?.unidadMedida || 'und'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full rounded-sm border border-border-subtle bg-bg-paper px-2.5 py-1.5 font-mono text-xs text-text-heading focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Precio Unitario (COP)
                  </label>
                  <MoneyInput
                    value={precioUnitario}
                    onChange={setPrecioUnitario}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded bg-bg-alt/50 p-2 border border-border-subtle">
                <span className="text-xs text-text-muted">Total de esta línea:</span>
                <span className="font-mono text-sm font-bold text-brand">
                  {formatCOP(totalCalculado)}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esReferencial}
                    onChange={(e) => setEsReferencial(e.target.checked)}
                    className="rounded text-gold-500 focus:ring-gold-400"
                  />
                  <span>Presupuesto referencial / obra civil (no contractual)</span>
                </label>
              </div>

              {esReferencial && (
                <div className="space-y-2 rounded-sm border border-border-subtle bg-bg-alt/30 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Fuente referencial
                      </label>
                      <select
                        value={fuenteReferencial ?? ''}
                        onChange={(e) => setFuenteReferencial((e.target.value || null) as ItemVariante['fuenteReferencial'])}
                        className="w-full rounded-sm border border-border-subtle bg-bg-paper px-2.5 py-1.5 text-xs text-text-heading focus:border-brand focus:outline-none"
                      >
                        <option value="">Sin especificar</option>
                        {FUENTES_REFERENCIALES.map((f) => (
                          <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Grupo referencial
                      </label>
                      <input
                        type="text"
                        value={grupoReferencial}
                        onChange={(e) => setGrupoReferencial(e.target.value)}
                        placeholder="Ej: Obra Civil / Ventanas"
                        className="w-full rounded-sm border border-border-subtle bg-bg-paper px-2.5 py-1.5 text-xs text-text-heading focus:border-brand focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    No suma a Grand Totals ni al objeto de contrato — inversión estimada con terceros.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Comentario (visible para el cliente en la propuesta)
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-sm border border-border-subtle bg-bg-paper px-2.5 py-1.5 text-xs text-text-heading focus:border-brand focus:outline-none"
                  placeholder="Ej: Incluye herrajes de cierre suave"
                />
              </div>

              {grupos.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Grupo (dentro de este espacio)
                  </label>
                  <select
                    value={grupoItemId}
                    onChange={(e) => setGrupoItemId(e.target.value)}
                    className="w-full rounded-sm border border-border-subtle bg-bg-paper px-2.5 py-1.5 text-xs text-text-heading focus:border-brand focus:outline-none"
                  >
                    <option value="">Sin grupo</option>
                    {grupos.map((g) => (
                      <option key={g.id} value={g.id}>{rutaGrupo(g, gruposPorId)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-4">
            <button
              type="button"
              onClick={handleEliminar}
              disabled={eliminando || guardando}
              className="rounded px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              {eliminando ? 'Eliminando...' :
                <span className="inline-flex items-center gap-1.5">
                  <IconoEliminar />
                  Eliminar Ítem
                </span>}
            </button>
            <div className="flex gap-2">
              <Button variant="ghost" size="md" onClick={onClose} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGuardarCambios}
                loading={guardando}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Modo Reemplazo In-Situ */
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            Busca y selecciona un nuevo producto del catálogo para reemplazar el actual. Se conservarán la cantidad ({cantidad} und) y la posición en la cotización.
          </p>

          <SmartSearch
            items={catalogo.map((p) => ({
              id: p.id,
              sku: p.sku,
              descripcion: p.descripcion,
              tipo: p.tipo,
              precioPublico: p.precioPublico,
              precioDirecto: p.precioDirecto,
              categoriaComercial: p.categoriaComercial,
            }))}
            onSelect={(p) => {
              const full = catalogo.find((c) => c.id === p.id)
              if (full) setProductoSeleccionado(full)
            }}
            placeholder="Buscar nuevo SKU o descripción..."
          />

          {productoSeleccionado && (
            <div className="rounded border border-gold-400/60 bg-gold-50/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 bg-gold-100 px-1.5 py-0.5 rounded">
                    Nuevo Producto Seleccionado
                  </span>
                  <p className="font-semibold text-xs text-text-heading mt-1">
                    {productoSeleccionado.descripcion}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted">
                    SKU: {productoSeleccionado.sku} · Precio catálogo: {formatCOP(parseNum(productoSeleccionado.precioPublico))}
                  </p>
                </div>
                {productoSeleccionado.imagenUrl && (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-border-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element -- URLs mock/blob temporales */}
                    <img
                      src={productoSeleccionado.imagenUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Opción de Precios */}
              <div className="border-t border-border-subtle/80 pt-2 space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="opcionPrecio"
                    checked={mantenerPrecioActual}
                    onChange={() => setMantenerPrecioActual(true)}
                    className="text-gold-500"
                  />
                  <span>
                    Mantener precio cotizado actual (<strong>{formatCOP(parseNum(precioUnitario))}</strong>)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="opcionPrecio"
                    checked={!mantenerPrecioActual}
                    onChange={() => setMantenerPrecioActual(false)}
                    className="text-gold-500"
                  />
                  <span>
                    Adoptar nuevo precio de catálogo (<strong>{formatCOP(parseNum(productoSeleccionado.precioPublico))}</strong>)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="md" onClick={() => setProductoSeleccionado(null)}>
                  Elegir otro
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmarReemplazo}
                  loading={guardando}
                >
                  Confirmar Reemplazo In-Situ
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-border-subtle">
            <Button variant="ghost" size="md" onClick={() => setModo('edicion')}>
              Volver a detalles
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
