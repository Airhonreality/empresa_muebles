import React, { useEffect, useState, useRef, useMemo } from 'react'
import type { DataItem } from '@agnostic/core'
import { Briefcase, Copy, Plus, Trash2, ArrowLeft, ArrowRight, Upload, Loader2, Image as ImageIcon, ClipboardList, Palette, Eye, EyeOff, X, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COP } from './utils'
import { EspacioTabs } from './EspacioTabs'
import { ItemRow } from './ItemRow'
import { DayCounter } from './DayCounter'
import { CollapseStrip } from './CollapseStrip'
import { toast } from 'sonner'
import type { EspacioVariantes, ItemsVariante, ItemsObraCivil } from '@/generated/agnostic-schemas'
import { SmartImageInput } from '@/components/ui/SmartImageInput'

export function EspacioCard({ nombre, variants, items, catalogo, tarifas,
  activeVarId, onSelectVarId,
  onRename, onAddVariante, onUpdateVariante, onDuplicateVariante, onDeleteVariante, onReorderVariante, onAddItem, onUpdateItem, onDeleteItem, onDelete, onDuplicate,
  onMoveUp, onMoveDown,
  onEditCatalogItem, onAddCatalogItem,
  itemsObraCivil = [],
  onAddItemObraCivil, onUpdateItemObraCivil, onDeleteItemObraCivil,
  allExistingColors = [],
}: {
  nombre: string; variants: DataItem[]; items: DataItem[]
  catalogo: DataItem[]; tarifas: { dev: number; assembly: number; install: number }
  activeVarId: string; onSelectVarId: (id: string) => void
  onRename: (n: string) => void
  onAddVariante: () => void
  onUpdateVariante: (id: string, p: Partial<EspacioVariantes>) => void
  onDuplicateVariante: (id: string) => void
  onDeleteVariante: (id: string) => void
  onReorderVariante?: (id: string, direction: 'left' | 'right') => void
  onAddItem: (varId: string) => Promise<string | undefined>
  onUpdateItem: (id: string, p: Partial<ItemsVariante>) => void
  onDeleteItem: (id: string) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onEditCatalogItem: (id: string) => void
  onAddCatalogItem: (initialSearch: string) => void
  itemsObraCivil?: DataItem[]
  onAddItemObraCivil?: (varId: string, categoria: 'mano_obra' | 'logistica' | 'materiales') => Promise<string | undefined>
  onUpdateItemObraCivil?: (id: string, p: Partial<ItemsObraCivil>) => void
  onDeleteItemObraCivil?: (id: string) => void
  allExistingColors?: { nombre: string; imagen_url: string }[]
}) {
  const [moOpen, setMoOpen] = useState(false)
  const [totOpen, setTotOpen] = useState(false)
  const [ocOpen, setOcOpen] = useState(false)
  const [editName, setEditName] = useState(false)
  const [nameLocal, setNameLocal] = useState(nombre)
  
  const [autoFocusItemId, setAutoFocusItemId] = useState<string | null>(null)
  const [imgOpen, setImgOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNameLocal(nombre)
  }, [nombre])

  const activeVar = variants.find(v => v.id === activeVarId) || variants[0]
  const vd = (activeVar?.data ?? {}) as any as EspacioVariantes
  const activeVarIdResolved = activeVar?.id || activeVarId
  const activeItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === activeVarIdResolved)

  const [descLocal, setDescLocal] = useState(vd.descripcion || '')
  const [descAltLocal, setDescAltLocal] = useState(vd.descripcion_alternativa || '')

  useEffect(() => {
    setDescLocal(vd.descripcion || '')
    setDescAltLocal(vd.descripcion_alternativa || '')
  }, [vd.descripcion, vd.descripcion_alternativa])

  const images: string[] = useMemo(() => {
    if (!vd.imagenes) return []
    try {
      const parsed = JSON.parse(vd.imagenes)
      if (Array.isArray(parsed)) return parsed
      return []
    } catch (e) {
      return vd.imagenes.split(',').map(x => x.trim()).filter(Boolean)
    }
  }, [vd.imagenes])

  const handleAddUrl = () => {
    if (!urlInput.trim()) return
    const next = [...images, urlInput.trim()]
    onUpdateVariante(activeVarIdResolved, { imagenes: JSON.stringify(next) })
    setUrlInput('')
  }

  const handleDeleteImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx)
    onUpdateVariante(activeVarIdResolved, { imagenes: JSON.stringify(next) })
  }

  const handleMoveImage = (idx: number, dir: 'left' | 'right') => {
    const targetIdx = dir === 'left' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= images.length) return
    const next = [...images]
    const temp = next[idx]
    next[idx] = next[targetIdx]
    next[targetIdx] = temp
    onUpdateVariante(activeVarIdResolved, { imagenes: JSON.stringify(next) })
  }

  const notes: string[] = useMemo(() => {
    if (!vd.notas_markdown) return []
    return vd.notas_markdown
      .split('\n')
      .map(n => n.replace(/^[-*]\s+/, '').trim())
      .filter(Boolean)
  }, [vd.notas_markdown])

  const [newNoteInput, setNewNoteInput] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)

  const handleAddNote = () => {
    if (!newNoteInput.trim()) return
    const next = [...notes, newNoteInput.trim()]
    onUpdateVariante(activeVarIdResolved, { notas_markdown: next.map(n => `- ${n}`).join('\n') })
    setNewNoteInput('')
  }

  const handleUpdateNote = (idx: number, newVal: string) => {
    const next = [...notes]
    next[idx] = newVal
    onUpdateVariante(activeVarIdResolved, { notas_markdown: next.map(n => n.trim()).filter(Boolean).map(n => `- ${n}`).join('\n') })
  }

  const handleDeleteNote = (idx: number) => {
    const next = notes.filter((_, i) => i !== idx)
    onUpdateVariante(activeVarIdResolved, { notas_markdown: next.map(n => `- ${n}`).join('\n') })
  }

  const handleMoveNote = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= notes.length) return
    const next = [...notes]
    const temp = next[idx]
    next[idx] = next[targetIdx]
    next[targetIdx] = temp
    onUpdateVariante(activeVarIdResolved, { notas_markdown: next.map(n => `- ${n}`).join('\n') })
  }

  const colors: { nombre: string; imagen_url: string }[] = useMemo(() => {
    if (!vd.colores) return []
    try {
      const parsed = JSON.parse(vd.colores)
      if (Array.isArray(parsed)) return parsed
      return []
    } catch (e) {
      return []
    }
  }, [vd.colores])

  const [colorNameInput, setColorNameInput] = useState('')
  const [colorUrlInput, setColorUrlInput] = useState('')
  const [colorsOpen, setColorsOpen] = useState(false)

  const handleAddColor = (url?: string) => {
    const targetUrl = url || colorUrlInput.trim()
    if (!colorNameInput.trim()) {
      toast.error('Debes ingresar el nombre del color')
      return
    }
    if (!targetUrl) {
      toast.error('Debes ingresar o subir una imagen para el color')
      return
    }
    if (colors.some(c => c.nombre.toLowerCase() === colorNameInput.trim().toLowerCase())) {
      toast.error('Ya existe un color con este nombre en este espacio')
      return
    }
    const next = [...colors, { nombre: colorNameInput.trim(), imagen_url: targetUrl }]
    onUpdateVariante(activeVarIdResolved, { colores: JSON.stringify(next) })
    setColorNameInput('')
    setColorUrlInput('')
    toast.success(`Color "${colorNameInput.trim()}" agregado con éxito`)
  }

  const handleDeleteColor = (idx: number) => {
    const next = colors.filter((_, i) => i !== idx)
    onUpdateVariante(activeVarIdResolved, { colores: JSON.stringify(next) })
  }

  const handleMoveColor = (idx: number, dir: 'left' | 'right') => {
    const targetIdx = dir === 'left' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= colors.length) return
    const next = [...colors]
    const temp = next[idx]
    next[idx] = next[targetIdx]
    next[targetIdx] = temp
    onUpdateVariante(activeVarIdResolved, { colores: JSON.stringify(next) })
  }

  const handleAddItem = async () => {
    const newId = await onAddItem(activeVarIdResolved)
    if (newId) {
      setAutoFocusItemId(newId)
    }
  }

  const totalMat = activeItems.reduce((s, it) => s + (Number((it.data as any as ItemsVariante).total_linea) || 0), 0)
  
  const totalMO = (Number(vd.jornadas_desarrollo_tecnico) || 0) * tarifas.dev
                + (Number(vd.jornadas_ensamblaje_taller) || 0) * tarifas.assembly
                + (Number(vd.jornadas_instalacion_obra) || 0) * tarifas.install

  const jorns = (Number(vd.jornadas_desarrollo_tecnico) || 0)
    + (Number(vd.jornadas_ensamblaje_taller) || 0)
    + (Number(vd.jornadas_instalacion_obra) || 0)

  const totalEsp = totalMat + totalMO

  // Totals for obra civil by category
  const activeItemsOC = itemsObraCivil ? itemsObraCivil.filter(it => (it.data as any as ItemsObraCivil).variante_id === activeVarIdResolved) : []
  const totalOC_MO = activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'mano_obra').reduce((s, it) => s + (Number((it.data as any as ItemsObraCivil).total_linea) || (Number((it.data as any as ItemsObraCivil).cantidad) || 0) * (Number((it.data as any as ItemsObraCivil).precio_unitario) || 0)), 0)
  const totalOC_Log = activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'logistica').reduce((s, it) => s + (Number((it.data as any as ItemsObraCivil).total_linea) || (Number((it.data as any as ItemsObraCivil).cantidad) || 0) * (Number((it.data as any as ItemsObraCivil).precio_unitario) || 0)), 0)
  const totalOC_Mat = activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'materiales').reduce((s, it) => s + (Number((it.data as any as ItemsObraCivil).total_linea) || (Number((it.data as any as ItemsObraCivil).cantidad) || 0) * (Number((it.data as any as ItemsObraCivil).precio_unitario) || 0)), 0)
  const totalOC = totalOC_MO + totalOC_Log + totalOC_Mat

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-300",
      vd.visible_pdf === false && "opacity-75 border-dashed border-stone-300"
    )}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-0">
        {editName ? (
          <input autoFocus value={nameLocal}
            onChange={e => setNameLocal(e.target.value)}
            onBlur={() => { onRename(nameLocal); setEditName(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onRename(nameLocal); setEditName(false) } }}
            className="flex-1 text-base font-semibold text-stone-800 bg-transparent border-b-2 border-amber-400 focus:outline-none pb-0.5"
          />
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <h3 onClick={() => setEditName(true)}
              className="veta-heading text-base font-semibold text-stone-800 cursor-text hover:text-amber-700 transition-colors select-none">
              {nombre}
            </h3>
            {vd.visible_pdf === false && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100/80 px-2 py-0.5 rounded-lg border border-stone-200/50 shrink-0 select-none">
                Oculto en PDF
              </span>
            )}
          </div>
        )}
        <span className="text-[10px] tabular-nums text-stone-300 font-medium">{COP(totalEsp)}</span>
        <button 
          onClick={() => onUpdateVariante(activeVarIdResolved, { visible_pdf: vd.visible_pdf === false })}
          title={vd.visible_pdf === false ? "Mostrar en PDF" : "Ocultar en PDF"}
          className={cn(
            "p-1 transition-colors",
            vd.visible_pdf === false ? "text-stone-300 hover:text-amber-600" : "text-stone-200 hover:text-amber-600"
          )}
        >
          {vd.visible_pdf === false ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <button onClick={onDuplicate} title="Duplicar espacio"
          className="text-stone-200 hover:text-amber-600 transition-colors p-1">
          <Copy size={13} />
        </button>
        <div className="flex flex-col gap-0 border-l border-stone-200 pl-1 ml-1 items-center justify-center">
          <button onClick={onMoveUp} title="Mover arriba" className="text-stone-300 hover:text-amber-600">
            <ChevronUp size={14} />
          </button>
          <button onClick={onMoveDown} title="Mover abajo" className="text-stone-300 hover:text-amber-600">
            <ChevronDown size={14} />
          </button>
        </div>
        <button onClick={onDelete} title="Eliminar espacio"
          className="text-stone-200 hover:text-red-400 transition-colors p-1">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Description of Space (Above Tabs) */}
      <div className="px-5 pt-2 pb-1.5 flex flex-col gap-1">
        <label className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Descripción del Espacio</label>
        <textarea
          value={descLocal}
          onChange={e => setDescLocal(e.target.value)}
          onBlur={() => onUpdateVariante(activeVarIdResolved, { descripcion: descLocal })}
          placeholder="Descripción general del espacio (ej: Cocina en L con acabados premium)..."
          rows={2}
          className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-stone-300 resize-none transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3">
        <p className="veta-quote-section-label mb-1.5">Variantes cotizadas de este espacio</p>
        <EspacioTabs
          variants={variants}
          activeId={activeVarIdResolved}
          onSelect={onSelectVarId}
          onAdd={onAddVariante}
          onDuplicate={() => onDuplicateVariante(activeVarIdResolved)}
          onDelete={onDeleteVariante}
          onRename={(id, name) => onUpdateVariante(id, { nombre_variante: name })}
          onMove={onReorderVariante}
          onUpdate={onUpdateVariante}
        />
      </div>

      {/* Description of Alternative (Below Tabs) */}
      <div className="px-5 pt-2.5 pb-2.5 flex flex-col gap-1 border-b border-stone-100 bg-stone-50/20">
        <label className="text-[9px] font-bold uppercase tracking-wider text-amber-700/80">Descripción de Alternativa ({vd.nombre_variante || 'Variante'})</label>
        <textarea
          value={descAltLocal}
          onChange={e => setDescAltLocal(e.target.value)}
          onBlur={() => onUpdateVariante(activeVarIdResolved, { descripcion_alternativa: descAltLocal })}
          placeholder="Detalles específicos para esta variante (ej: Se cambia mesón a cuarzo blanco)..."
          rows={2}
          className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-stone-300 resize-none transition-all"
        />
      </div>

      {/* Item sheet */}
      <div className="px-2 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-left pb-2 pl-3 text-[9px] font-bold uppercase tracking-widest text-stone-300">Descripción</th>
              <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-widest text-stone-300 w-16">Und</th>
              <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-widest text-stone-300 w-14">Cant</th>
              <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-widest text-stone-300 w-28">P. Unit</th>
              <th className="pb-2 pr-3 text-right text-[9px] font-bold uppercase tracking-widest text-stone-300 w-28">Total</th>
              <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-widest text-stone-300 w-14">Vista</th>
              <th className="w-7" />
            </tr>
          </thead>
          <tbody>
            {activeItems.map(it => (
              <ItemRow key={it.id} item={it} catalogo={catalogo}
                onUpdate={p => onUpdateItem(it.id, p)}
                onDelete={() => onDeleteItem(it.id)}
                onEditCatalogItem={onEditCatalogItem}
                onAddCatalogItem={onAddCatalogItem}
                autoFocus={it.id === autoFocusItemId}
              />
            ))}
          </tbody>
        </table>
        <button onClick={handleAddItem}
          className="mt-1 ml-3 flex items-center gap-1.5 text-xs text-stone-300 hover:text-amber-600 transition-colors py-1">
          <Plus size={11} /><span>Agregar ítem</span>
        </button>
      </div>

      {/* Imágenes de referencia */}
      <CollapseStrip open={imgOpen} onToggle={() => setImgOpen(o => !o)}
        label="Imágenes de referencia" icon={ImageIcon}
        summary={images.length > 0 && (
          <span className="ml-2 text-amber-600 font-medium tabular-nums">
            {images.length} imagen{images.length !== 1 ? 'es' : ''}
          </span>
        )}
      >
        <div className="px-5 pb-5 space-y-4">
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((url, idx) => (
                <div key={url + '-' + idx} className="relative aspect-video rounded-xl overflow-hidden border border-stone-200 bg-stone-50 group/img">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  
                  {/* Badge displaying order */}
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold">
                    {idx + 1}
                  </span>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveImage(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-white/80 hover:bg-white text-stone-700 disabled:opacity-40 disabled:hover:bg-white/80 transition-colors"
                      title="Mover a la izquierda"
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveImage(idx, 'right')}
                      disabled={idx === images.length - 1}
                      className="p-1 rounded bg-white/80 hover:bg-white text-stone-700 disabled:opacity-40 disabled:hover:bg-white/80 transition-colors"
                      title="Mover a la derecha"
                    >
                      <ArrowRight size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(idx)}
                      className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SmartImageInput
            multiple
            value={[]}
            onChange={(uploadedUrls) => {
              const next = [...images, ...uploadedUrls]
              onUpdateVariante(activeVarIdResolved, { imagenes: JSON.stringify(next) })
              toast.success(`${uploadedUrls.length} imagen${uploadedUrls.length !== 1 ? 'es' : ''} agregada${uploadedUrls.length !== 1 ? 's' : ''}`)
            }}
            accept="image/*"
            placeholder="Pegar URL y pulsar Enter — o arrastra/pega imagen de referencia"
          />
        </div>
      </CollapseStrip>

      {/* Notas del espacio */}
      <CollapseStrip open={notesOpen} onToggle={() => setNotesOpen(o => !o)}
        label="Notas del espacio" icon={ClipboardList}
        summary={notes.length > 0 && (
          <span className="ml-2 text-amber-600 font-medium tabular-nums">
            {notes.length} nota{notes.length !== 1 ? 's' : ''}
          </span>
        )}
      >
        <div className="px-5 pb-5 space-y-3">
          {notes.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notes.map((note, idx) => (
                <div key={idx} className="flex items-center gap-2 group/note bg-stone-50 hover:bg-stone-100/60 px-3 py-2 rounded-xl border border-stone-100/60 transition-colors">
                  <span className="text-stone-300 font-bold select-none text-[10px] tabular-nums w-4 text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={note}
                    onChange={e => handleUpdateNote(idx, e.target.value)}
                    className="flex-1 bg-transparent text-xs text-stone-700 focus:outline-none focus:ring-0 border-none p-0 font-medium"
                  />
                  <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleMoveNote(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-stone-300 hover:text-stone-700 disabled:opacity-30 transition-colors"
                      title="Mover arriba"
                    >
                      <ArrowLeft size={12} className="rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveNote(idx, 'down')}
                      disabled={idx === notes.length - 1}
                      className="p-1 rounded text-stone-300 hover:text-stone-700 disabled:opacity-30 transition-colors"
                      title="Mover abajo"
                    >
                      <ArrowRight size={12} className="rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(idx)}
                      className="p-1 rounded text-stone-300 hover:text-red-500 transition-colors"
                      title="Eliminar nota"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add note input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newNoteInput}
              onChange={e => setNewNoteInput(e.target.value)}
              placeholder="Escribe una nota para este espacio..."
              onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }}
              className="flex-1 text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700 placeholder:text-stone-300"
            />
            <button
              type="button"
              onClick={handleAddNote}
              className="px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus size={13} />
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </CollapseStrip>

      {/* Colores del espacio */}
      <CollapseStrip open={colorsOpen} onToggle={() => setColorsOpen(o => !o)}
        label="Colores y Acabados del Espacio" icon={Palette}
        summary={colors.length > 0 && (
          <span className="ml-2 text-amber-600 font-medium tabular-nums">
            {colors.length} acabado{colors.length !== 1 ? 'os' : ''}
          </span>
        )}
      >
        <div className="px-5 pb-5 space-y-4">
          {/* Colors Swatches Grid */}
          {colors.length > 0 && (
            <div className="flex flex-wrap gap-4 pt-1">
              {colors.map((col, idx) => (
                <div key={idx} className="relative group/color flex flex-col items-center gap-1.5 p-2 bg-stone-50 border border-stone-100 rounded-xl hover:shadow-md hover:bg-stone-100/60 transition-all w-20">
                  {/* Swatch image */}
                  <div className="w-12 h-12 rounded-lg border border-stone-200 overflow-hidden bg-stone-200 shrink-0 shadow-sm">
                    <img src={col.imagen_url} alt={col.nombre} className="w-full h-full object-cover" />
                  </div>
                  {/* Color name */}
                  <span className="text-[10px] font-semibold text-stone-600 text-center w-full truncate px-0.5" title={col.nombre}>
                    {col.nombre}
                  </span>

                  {/* Hover Controls */}
                  <div className="absolute inset-0 bg-stone-900/70 rounded-xl flex items-center justify-center gap-0.5 opacity-0 group-hover/color:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveColor(idx, 'left')}
                      className="p-1 rounded bg-white/20 text-white hover:bg-white/40 disabled:opacity-30 transition-colors"
                      title="Mover izquierda"
                    >
                      <ArrowLeft size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteColor(idx)}
                      className="p-1 rounded bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={10} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === colors.length - 1}
                      onClick={() => handleMoveColor(idx, 'right')}
                      className="p-1 rounded bg-white/20 text-white hover:bg-white/40 disabled:opacity-30 transition-colors"
                      title="Mover derecha"
                    >
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Muestrario de colores existentes en el catálogo global */}
          {allExistingColors && allExistingColors.length > 0 && (
            <div className="space-y-2">
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block">
                Colores del catálogo (Haz clic para agregar)
              </span>
              <div className="flex flex-wrap gap-2 p-3 bg-stone-50/40 border border-stone-100 rounded-xl max-h-36 overflow-y-auto">
                {allExistingColors.map((col, idx) => {
                  const alreadyAdded = colors.some(c => c.nombre.toLowerCase() === col.nombre.toLowerCase())
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => {
                        const next = [...colors, col]
                        onUpdateVariante(activeVarIdResolved, { colores: JSON.stringify(next) })
                        toast.success(`Color "${col.nombre}" agregado`)
                      }}
                      className={cn(
                        "group relative flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-all text-xs font-medium",
                        alreadyAdded
                          ? "bg-stone-50 border-stone-200 text-stone-300 cursor-not-allowed opacity-50"
                          : "bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:bg-amber-50/10 hover:shadow-sm"
                      )}
                      title={alreadyAdded ? "Ya agregado" : `Agregar ${col.nombre}`}
                    >
                      <div className="w-6 h-6 rounded bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                        <img src={col.imagen_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate max-w-[90px]">{col.nombre}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Form to create a new custom color */}
          <div className="bg-stone-50/50 border border-stone-100 rounded-xl p-4 space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold block">
              Crear Nuevo Color / Acabado
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left Column: Color Name & Button (Occupies 2/3 of space on desktop) */}
              <div className="md:col-span-2 space-y-3 w-full">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Nombre del color / acabado
                  </label>
                  <input
                    type="text"
                    value={colorNameInput}
                    onChange={e => setColorNameInput(e.target.value)}
                    placeholder="e.g. Melamina Roble, Fórmica Gris..."
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700 font-medium h-9"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddColor()}
                  className="w-full h-9 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 justify-center shadow-sm"
                >
                  <Plus size={14} />
                  <span>Añadir Color / Acabado</span>
                </button>
              </div>

              {/* Right Column: Texture / Image Upload (Occupies 1/3 of space on desktop) */}
              <div className="md:col-span-1 space-y-1.5 w-full max-w-[240px]">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Imagen / Muestra de textura
                </label>
                <div className="w-full">
                  <SmartImageInput
                    multiple={false}
                    value={colorUrlInput}
                    onChange={setColorUrlInput}
                    accept="image/*"
                    placeholder="Subir muestra..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapseStrip>

      {/* Mano de obra */}
      <CollapseStrip open={moOpen} onToggle={() => setMoOpen(o => !o)}
        label="Mano de obra" icon={Briefcase}
        summary={jorns > 0 && (
          <span className="ml-2 text-amber-600 font-medium tabular-nums">
            {jorns}j · {COP(totalMO)}
          </span>
        )}
      >
        <div className="px-5 pb-5 flex items-start gap-5 flex-wrap">
          <DayCounter label="Desarrollo" value={Number(vd.jornadas_desarrollo_tecnico) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_desarrollo_tecnico: n })} />
          <DayCounter label="Ensamblaje" value={Number(vd.jornadas_ensamblaje_taller) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_ensamblaje_taller: n })} />
          <DayCounter label="Instalación" value={Number(vd.jornadas_instalacion_obra) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_instalacion_obra: n })} />
          <div className="ml-auto text-right flex flex-col justify-end gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-stone-300">Tarifa/jornada (des/ens/ins)</span>
            <span className="text-xs font-semibold text-stone-500 tabular-nums">{COP(tarifas.dev)} / {COP(tarifas.assembly)} / {COP(tarifas.install)}</span>
            <span className="text-sm font-bold text-amber-700 tabular-nums">{COP(totalMO)}</span>
          </div>
        </div>
      </CollapseStrip>

      {/* Totals */}
      <CollapseStrip open={totOpen} onToggle={() => setTotOpen(o => !o)}
        label="Subtotal" icon={({ size }: { size: number }) => (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        )}
        summary={<span className="ml-2 text-stone-600 font-semibold tabular-nums">{COP(totalEsp)}</span>}
      >
        <div className="px-5 pb-5 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Materiales', val: totalMat },
            { label: 'Mano de obra', val: totalMO },
            { label: 'Total espacio', val: totalEsp, highlight: true },
          ].map(({ label, val, highlight }) => (
            <div key={label}>
              <div className={cn('text-[9px] uppercase tracking-widest mb-1', highlight ? 'text-amber-500' : 'text-stone-400')}>{label}</div>
              <div className={cn('font-bold tabular-nums', highlight ? 'text-lg text-amber-700' : 'text-sm text-stone-700')}>{COP(val)}</div>
            </div>
          ))}
        </div>
      </CollapseStrip>

      {/* Estimado de Obra Civil */}
      {(
        <CollapseStrip open={ocOpen} onToggle={() => setOcOpen(o => !o)}
          label="Estimado de Obra Civil" icon={({ size }: { size: number }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 4h12v2H6V4zm1 4h10v10H7V8zm8 6v4H9v-4h6z"/>
            </svg>
          )}
          summary={<span className="ml-2 text-blue-600 font-semibold tabular-nums">{COP(totalOC)}</span>}
        >
          <div className="px-5 pb-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {([['mano_obra', 'Mano de obra'], ['logistica', 'Logística'], ['materiales', 'Materiales']] as const).map(([category, label]) => (
                <button key={category} type="button" onClick={() => onAddItemObraCivil?.(activeVarIdResolved, category)} className="min-h-9 rounded-full border border-blue-200 bg-white px-3 text-xs text-blue-700 hover:bg-blue-50">
                  <Plus size={12} className="mr-1 inline" /> {label}
                </button>
              ))}
            </div>
            {activeItemsOC.length > 0 && <div className="mb-5 space-y-2 rounded-xl border border-blue-100 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Editar estimados</p>
              {activeItemsOC.map(item => {
                const data = item.data as any as ItemsObraCivil
                const lineTotal = Number(data.total_linea) || (Number(data.cantidad) || 0) * (Number(data.precio_unitario) || 0)
                return <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_4rem_5rem_6rem] gap-2 border-t border-stone-100 pt-2 first:border-0 first:pt-0">
                  <input value={data.descripcion_manual || ''} onChange={event => onUpdateItemObraCivil?.(item.id, { descripcion_manual: event.target.value })} placeholder="Descripción" className="min-w-0 rounded border border-stone-200 px-2 py-1.5 text-xs" />
                  <input type="number" min="0" value={data.cantidad ?? 0} onChange={event => { const quantity = Number(event.target.value) || 0; onUpdateItemObraCivil?.(item.id, { cantidad: quantity, total_linea: quantity * (Number(data.precio_unitario) || 0) }) }} className="rounded border border-stone-200 px-2 py-1.5 text-xs" aria-label="Cantidad" />
                  <input type="number" min="0" value={data.precio_unitario ?? 0} onChange={event => { const unitPrice = Number(event.target.value) || 0; onUpdateItemObraCivil?.(item.id, { precio_unitario: unitPrice, total_linea: (Number(data.cantidad) || 0) * unitPrice }) }} className="rounded border border-stone-200 px-2 py-1.5 text-xs" aria-label="Precio unitario" />
                  <output className="self-center text-right text-xs font-semibold tabular-nums text-blue-700">{COP(lineTotal)}</output>
                </div>
              })}
            </div>}
            {/* Warning badge */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              Referencial — no incluido en el valor del contrato de carpintería
            </div>

            {/* Mano de obra */}
            {activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'mano_obra').length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-stone-600 mb-2 flex justify-between">
                  <span>Mano de obra</span>
                  <span className="text-blue-600 tabular-nums">{COP(totalOC_MO)}</span>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'mano_obra').map(it => (
                      <tr key={it.id} className="border-b border-stone-100">
                        <td className="py-1 text-stone-600">{(it.data as any as ItemsObraCivil).descripcion_manual || (it.data as any as ItemsObraCivil).catalogo_id}</td>
                        <td className="py-1 text-right text-stone-500">{(it.data as any as ItemsObraCivil).cantidad} {(it.data as any as ItemsObraCivil).unidad_medida}</td>
                        <td className="py-1 text-right text-stone-600 font-semibold tabular-nums">{COP(Number((it.data as any as ItemsObraCivil).total_linea) || 0)}</td>
                        <td className="py-1 text-right">
                          <button onClick={() => onDeleteItemObraCivil?.(it.id)} className="text-red-500 hover:text-red-700">
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => onAddItemObraCivil?.(activeVarIdResolved, 'mano_obra')} className="mt-1 ml-0 flex items-center gap-1.5 text-xs text-stone-300 hover:text-blue-600 transition-colors py-1">
                  <Plus size={11} /><span>Agregar</span>
                </button>
              </div>
            )}

            {/* Logística */}
            {activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'logistica').length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-stone-600 mb-2 flex justify-between">
                  <span>Logística</span>
                  <span className="text-blue-600 tabular-nums">{COP(totalOC_Log)}</span>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'logistica').map(it => (
                      <tr key={it.id} className="border-b border-stone-100">
                        <td className="py-1 text-stone-600">{(it.data as any as ItemsObraCivil).descripcion_manual || (it.data as any as ItemsObraCivil).catalogo_id}</td>
                        <td className="py-1 text-right text-stone-500">{(it.data as any as ItemsObraCivil).cantidad} {(it.data as any as ItemsObraCivil).unidad_medida}</td>
                        <td className="py-1 text-right text-stone-600 font-semibold tabular-nums">{COP(Number((it.data as any as ItemsObraCivil).total_linea) || 0)}</td>
                        <td className="py-1 text-right">
                          <button onClick={() => onDeleteItemObraCivil?.(it.id)} className="text-red-500 hover:text-red-700">
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => onAddItemObraCivil?.(activeVarIdResolved, 'logistica')} className="mt-1 ml-0 flex items-center gap-1.5 text-xs text-stone-300 hover:text-blue-600 transition-colors py-1">
                  <Plus size={11} /><span>Agregar</span>
                </button>
              </div>
            )}

            {/* Materiales */}
            {activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'materiales').length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-stone-600 mb-2 flex justify-between">
                  <span>Materiales</span>
                  <span className="text-blue-600 tabular-nums">{COP(totalOC_Mat)}</span>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {activeItemsOC.filter(it => (it.data as any as ItemsObraCivil).categoria === 'materiales').map(it => (
                      <tr key={it.id} className="border-b border-stone-100">
                        <td className="py-1 text-stone-600">{(it.data as any as ItemsObraCivil).descripcion_manual || (it.data as any as ItemsObraCivil).catalogo_id}</td>
                        <td className="py-1 text-right text-stone-500">{(it.data as any as ItemsObraCivil).cantidad} {(it.data as any as ItemsObraCivil).unidad_medida}</td>
                        <td className="py-1 text-right text-stone-600 font-semibold tabular-nums">{COP(Number((it.data as any as ItemsObraCivil).total_linea) || 0)}</td>
                        <td className="py-1 text-right">
                          <button onClick={() => onDeleteItemObraCivil?.(it.id)} className="text-red-500 hover:text-red-700">
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => onAddItemObraCivil?.(activeVarIdResolved, 'materiales')} className="mt-1 ml-0 flex items-center gap-1.5 text-xs text-stone-300 hover:text-blue-600 transition-colors py-1">
                  <Plus size={11} /><span>Agregar</span>
                </button>
              </div>
            )}

            {/* Botón para agregar primer ítem si no hay ninguno */}
            {activeItemsOC.length === 0 && (
              <button onClick={() => onAddItemObraCivil?.(activeVarIdResolved, 'materiales')} className="w-full flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={14} /> Agregar ítem de obra civil
              </button>
            )}
          </div>
        </CollapseStrip>
      )}
    </div>
  )
}
