import React, { useEffect, useRef, useState } from 'react'
import type { DataItem } from '@agnostic/core'
import { Copy, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EspacioVariantes } from '@/generated/agnostic-schemas'

export function EspacioTabs({ variants, activeId, onSelect, onAdd, onDuplicate, onDelete, onRename, onMove }: {
  variants: DataItem[]; activeId: string
  onSelect: (id: string) => void; onAdd: () => void; onDuplicate: () => void; onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onMove?: (id: string, direction: 'left' | 'right') => void;
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [ind, setInd] = useState({ left: 0, width: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = tabRefs.current[activeId]
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeId, variants.length])

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const handleStartEdit = (v: DataItem) => {
    const vd = v.data as any as EspacioVariantes
    setEditingId(v.id)
    setEditVal(vd.nombre_variante || 'Variante')
  }

  const handleSave = (id: string) => {
    if (editVal.trim()) {
      onRename(id, editVal.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="relative flex items-center border-b border-stone-100">
      {variants.map(v => {
        const vd = v.data as any as EspacioVariantes
        const isEditing = editingId === v.id
        const isActive = v.id === activeId

        return (
          <div key={v.id} className="relative flex flex-col justify-center group pr-3 min-h-[38px]">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => handleSave(v.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSave(v.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="px-2 py-1 text-sm border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-stone-800 font-semibold max-w-[120px] mx-2"
              />
            ) : (
              <button
                ref={el => { tabRefs.current[v.id] = el }}
                onClick={() => onSelect(v.id)}
                onDoubleClick={() => isActive && handleStartEdit(v)}
                title="Doble clic para renombrar la variante"
                className={cn(
                  'px-4 py-2 text-sm transition-colors duration-200 whitespace-nowrap cursor-pointer',
                  isActive ? 'text-amber-700 font-semibold' : 'text-stone-400 hover:text-stone-600',
                )}
              >
                {vd.nombre_variante || 'Variante'}
              </button>
            )}
            {!isEditing && variants.length > 1 && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-stone-200 px-1 py-0.5 rounded shadow-sm z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); onMove?.(v.id, 'left'); }}
                  className="text-stone-400 hover:text-amber-600 p-0.5"
                  title="Mover a la izquierda"
                >
                  <ChevronLeft size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMove?.(v.id, 'right'); }}
                  className="text-stone-400 hover:text-amber-600 p-0.5"
                  title="Mover a la derecha"
                >
                  <ChevronRight size={10} />
                </button>
              </div>
            )}
            {!isEditing && isActive && variants.length > 1 && (
              <button
                onClick={() => onDelete(v.id)}
                title="Eliminar variante"
                className="absolute top-1/2 right-0 -translate-y-1/2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )
      })}
      <button onClick={onAdd} title="Nueva variante"
        className="px-3 py-2.5 text-stone-300 hover:text-amber-500 transition-colors">
        <Plus size={13} />
      </button>
      <button onClick={onDuplicate} title="Duplicar variante"
        className="px-3 py-2.5 text-stone-300 hover:text-amber-500 transition-colors">
        <Copy size={13} />
      </button>
      <div
        className="absolute bottom-0 h-[2px] bg-amber-500 rounded-full transition-all duration-300 ease-out"
        style={{ left: ind.left, width: ind.width }}
      />
    </div>
  )
}

