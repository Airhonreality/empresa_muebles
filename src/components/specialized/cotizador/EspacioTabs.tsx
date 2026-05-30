import React, { useEffect, useRef, useState } from 'react'
import type { DataItem } from '@agnostic/core'
import { Copy, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EspacioVariantes } from '@/generated/agnostic-schemas'

export function EspacioTabs({ variants, activeId, onSelect, onAdd, onDuplicate, onDelete }: {
  variants: DataItem[]; activeId: string
  onSelect: (id: string) => void; onAdd: () => void; onDuplicate: () => void; onDelete: (id: string) => void;
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [ind, setInd] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const el = tabRefs.current[activeId]
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeId, variants.length])

  return (
    <div className="relative flex items-center border-b border-stone-100">
      {variants.map(v => (
        <div key={v.id} className="relative flex items-center group pr-3">
          <button
            ref={el => { tabRefs.current[v.id] = el }}
            onClick={() => onSelect(v.id)}
            className={cn(
              'px-4 py-2.5 text-sm transition-colors duration-200 whitespace-nowrap',
              v.id === activeId ? 'text-amber-700 font-semibold' : 'text-stone-400 hover:text-stone-600',
            )}
          >
            {(v.data as any as EspacioVariantes).nombre_variante || 'Variante'}
          </button>
          {v.id === activeId && variants.length > 1 && (
            <button
              onClick={() => onDelete(v.id)}
              title="Eliminar variante"
              className="absolute top-1/2 right-0 -translate-y-1/2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
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
