import React, { useState, useEffect, useRef } from 'react'
import type { DataItem } from '@agnostic/core'
import { X, Edit3, Plus, ImagePlus, Maximize2 } from 'lucide-react'
import { COP } from './utils'
import type { ItemsVariante, ProductosCatalogo } from '@/generated/agnostic-schemas'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SmartImageInput } from '@/components/ui/SmartImageInput'
import { fuzzySearch } from '@/lib/utils'

export function ItemRow({ item, catalogo, onUpdate, onDelete, onEditCatalogItem, onAddCatalogItem, autoFocus }: {
  item: DataItem; catalogo: DataItem[]
  onUpdate: (p: Partial<ItemsVariante>) => void; onDelete: () => void
  onEditCatalogItem: (id: string) => void
  onAddCatalogItem: (initialSearch: string) => void
  autoFocus?: boolean
}) {
  const d = item.data as any as ItemsVariante
  const [catSearch, setCatSearch] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [priceFocused, setPriceFocused] = useState(false)
  const [priceVal, setPriceVal] = useState('')

  useEffect(() => {
    if (!priceFocused) {
      setPriceVal(d.precio_unitario !== undefined && d.precio_unitario !== 0 ? COP(d.precio_unitario) : '')
    }
  }, [d.precio_unitario, priceFocused])

  const handlePriceBlur = () => {
    setPriceFocused(false)
    const p = parseFloat(priceVal.replace(/[^0-9.-]/g, '')) || 0
    onUpdate({ precio_unitario: p, total_linea: (Number(d.cantidad) || 1) * p })
  }

  const handlePriceFocus = () => {
    setPriceFocused(true)
    setPriceVal(d.precio_unitario !== undefined && d.precio_unitario !== 0 ? String(d.precio_unitario) : '')
  }

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small timeout to ensure the DOM is ready and prevent potential render race conditions
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  // Resolve display name
  const matched = catalogo.find(c => c.id === d.catalogo_id)
  const displayName = matched ? (matched.data as any as ProductosCatalogo).descripcion : ''

  const filtered = React.useMemo(() => {
    return fuzzySearch(catalogo, catSearch, c => {
      const cd = c.data as any as ProductosCatalogo
      return cd.descripcion || ''
    })
  }, [catSearch, catalogo])

  const pickCat = (c: DataItem) => {
    const cd = c.data as any as ProductosCatalogo
    const qty = Number(d.cantidad) || 1
    const precio = Number(cd.precio_publico) || 0
    onUpdate({ catalogo_id: c.id, unidad_medida: cd.unidad_medida || '', precio_unitario: precio, total_linea: qty * precio })
    setCatSearch(''); setCatOpen(false)
  }

  return (
    <>
      <tr className="group/row border-b border-stone-50 hover:bg-amber-50/20 transition-colors">
      {/* Descripción */}
      <td className="py-2 pl-3 pr-2">
        <Popover open={catOpen} onOpenChange={setCatOpen}>
          <PopoverTrigger asChild>
            <input type="text"
              ref={inputRef}
              value={catOpen ? catSearch : displayName}
              onChange={e => { setCatSearch(e.target.value); setCatOpen(true) }}
              onFocus={() => { setCatSearch(''); setCatOpen(true) }}
              onBlur={() => setTimeout(() => setCatOpen(false), 180)}
              placeholder="Buscar en catálogo…"
              className="w-full text-xs text-stone-700 bg-transparent focus:outline-none py-0.5 min-w-[140px] placeholder:text-stone-300"
            />
          </PopoverTrigger>
          <PopoverContent 
            align="start" 
            side="bottom" 
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="w-72 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden p-0 max-h-60 overflow-y-auto"
          >
            <div className="border-b border-stone-100 p-1.5 bg-stone-50 flex items-center justify-between">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider px-1">Catálogo</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onAddCatalogItem(catSearch)
                  setCatOpen(false)
                }}
                className="text-[10px] text-amber-600 hover:text-amber-700 font-bold px-1.5 py-0.5 hover:bg-amber-100/50 rounded flex items-center gap-0.5 transition-colors"
              >
                <Plus size={10} /> Nuevo producto
              </button>
            </div>
            {filtered.map(c => {
              const cd = c.data as any as ProductosCatalogo
              return (
                <button key={c.id} onMouseDown={() => pickCat(c)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between gap-2 transition-colors">
                  <span className="truncate text-stone-700">{cd.descripcion}</span>
                  <span className="text-stone-400 shrink-0 tabular-nums text-[10px]">{COP(cd.precio_publico)}</span>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="p-3 text-center text-xs text-stone-400">
                Sin coincidencias en el catálogo
              </div>
            )}
          </PopoverContent>
        </Popover>
      </td>
      {/* Unidad */}
      <td className="py-2 px-1 w-16 text-center">
        <input type="text" value={d.unidad_medida || ''}
          onChange={e => onUpdate({ unidad_medida: e.target.value })}
          className="w-full text-center text-xs text-stone-400 bg-transparent focus:outline-none"
          placeholder="und"
        />
      </td>
      {/* Cantidad */}
      <td className="py-2 px-1 w-14">
        <input type="number" value={d.cantidad ?? ''}
          onChange={e => {
            const q = parseFloat(e.target.value) || 0
            onUpdate({ cantidad: q, total_linea: q * (Number(d.precio_unitario) || 0) })
          }}
          className="w-full text-center text-xs font-medium text-stone-700 bg-transparent focus:outline-none tabular-nums"
          min={0} step={0.1}
        />
      </td>
      {/* Precio */}
      <td className="py-2 px-1 w-28">
        <input type="text"
          value={priceVal}
          onFocus={handlePriceFocus}
          onBlur={handlePriceBlur}
          onChange={e => setPriceVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
          }}
          placeholder="$ 0"
          className="w-full text-right text-xs font-medium text-stone-700 bg-transparent focus:outline-none tabular-nums"
        />
      </td>
      {/* Total */}
      <td className="py-2 pl-1 pr-3 text-right w-28">
        <span className="text-xs font-semibold text-stone-700 tabular-nums">{COP(d.total_linea)}</span>
      </td>
      {/* Referencia visual opcional: no reserva altura cuando el ítem no la necesita. */}
      <td className="w-14 px-1 py-1 text-center">
        {d.imagen_url ? (
          <button
            type="button"
            onClick={() => setImagePreviewOpen(true)}
            className="group/image relative mx-auto block h-9 w-12 overflow-hidden rounded-md border border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg-linen))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--veta-gold-muted))]"
            aria-label={`Ampliar referencia visual de ${displayName || 'ítem'}`}
          >
            <img src={d.imagen_url} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover/image:opacity-100 group-focus-visible/image:opacity-100">
              <Maximize2 size={13} className="text-white" aria-hidden="true" />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setImageEditorOpen(true)}
            className="mx-auto flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--veta-text-stone))] opacity-35 transition-opacity hover:bg-[hsl(var(--veta-bg-linen))] hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--veta-gold-muted))]"
            aria-label={`Añadir referencia visual a ${displayName || 'ítem'}`}
            title="Añadir referencia visual"
          >
            <ImagePlus size={14} aria-hidden="true" />
          </button>
        )}
      </td>
      {/* Actions (Edit / Delete) */}
      <td className="py-2 pr-1 w-14">
        <div className="flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-all justify-end pr-2">
          {d.imagen_url && (
            <button
              type="button"
              onClick={() => setImageEditorOpen(true)}
              className="text-stone-300 hover:text-[hsl(var(--veta-gold-hover))] transition-colors p-1"
              title="Cambiar referencia visual"
            >
              <ImagePlus size={11} />
            </button>
          )}
          {d.catalogo_id && (
            <button onClick={() => onEditCatalogItem(d.catalogo_id!)}
              className="text-stone-300 hover:text-amber-600 transition-colors p-1"
              title="Editar producto en catálogo">
              <Edit3 size={11} />
            </button>
          )}
          <button onClick={onDelete}
            className="text-stone-300 hover:text-red-400 transition-colors p-1"
            title="Eliminar fila">
            <X size={12} />
          </button>
        </div>
      </td>
      </tr>
      <Dialog open={imageEditorOpen} onOpenChange={setImageEditorOpen}>
        <DialogContent className="max-w-md border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg-warm-paper))]">
          <DialogHeader>
            <DialogTitle className="veta-heading pr-8 text-xl text-[hsl(var(--veta-text-carbon))]">Referencia visual</DialogTitle>
            <DialogDescription>Opcional. Solo aparece en la tabla cuando el ítem tiene una imagen.</DialogDescription>
          </DialogHeader>
          <SmartImageInput
            multiple={false}
            value={d.imagen_url || ''}
            onChange={(url) => {
              onUpdate({ imagen_url: url || undefined })
              if (url) setImageEditorOpen(false)
            }}
            accept="image/*"
            placeholder="Subir o pegar URL de imagen"
          />
          {d.imagen_url && (
            <button
              type="button"
              onClick={() => { onUpdate({ imagen_url: undefined }); setImageEditorOpen(false) }}
              className="self-start text-xs font-medium text-destructive transition-colors hover:opacity-75"
            >
              Quitar imagen
            </button>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-3xl border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg-warm-paper))] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="veta-heading pr-8 text-xl text-[hsl(var(--veta-text-carbon))]">{displayName || 'Referencia visual'}</DialogTitle>
            <DialogDescription>Referencia del ítem cotizado.</DialogDescription>
          </DialogHeader>
          {d.imagen_url && <img src={d.imagen_url} alt={`Referencia visual de ${displayName || 'ítem'}`} className="max-h-[70vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  )
}
