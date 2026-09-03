'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Modal } from '@/components/veta/modal'
import { Button } from '@/components/veta/button'
import { SmartSearch } from '@/components/veta/smart-search'
import { MoneyInput } from '@/components/veta/money-input'
import type { ItemVariante, ProductoCatalogo } from '@/lib/data'

interface ItemEditorModalProps {
  item: ItemVariante
  producto: ProductoCatalogo | undefined
  catalogo: ProductoCatalogo[]
  onClose: () => void
  onSave: (cambios: Partial<ItemVariante>) => Promise<void>
  onReemplazarProducto: (nuevoProducto: ProductoCatalogo, mantenerPrecioActual: boolean) => Promise<void>
  onEliminar: () => Promise<void>
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

export function ItemEditorModal({
  item,
  producto,
  catalogo,
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
          ✏️ Detalles y Edición
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
          🔄 Reemplazar por Otro SKU
        </button>
      </div>

      {modo === 'edicion' ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Imagen del Producto */}
            <div className="sm:w-1/3">
              {producto?.imagenUrl ? (
                <Image
                  src={producto.imagenUrl}
                  alt={producto.descripcion || 'Producto'}
                  width={320}
                  height={240}
                  unoptimized
                  className="aspect-[4/3] w-full rounded-sm border border-border-subtle object-cover shadow-xs"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-sm border border-border-subtle bg-bg-alt text-xs text-text-muted">
                  Sin imagen de catálogo
                </div>
              )}
              {producto?.sku && (
                <p className="mt-1 text-center font-mono text-[11px] text-text-muted">
                  SKU: {producto.sku}
                </p>
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
              {eliminando ? 'Eliminando...' : '🗑️ Eliminar Ítem'}
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
