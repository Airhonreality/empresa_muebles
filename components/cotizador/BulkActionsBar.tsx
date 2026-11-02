'use client'

import { Button } from '@/components/veta/button'
import { type ItemVariante } from '@/lib/data'

export interface BulkActionsBarProps {
  selectedCount: number
  selectedItems: Set<string>
  items: ItemVariante[]
  onMove: (itemIds: Set<string>) => void
  onDelete: (itemIds: Set<string>) => void
  onClear: () => void
}

export function BulkActionsBar({
  selectedCount,
  selectedItems,
  items,
  onMove,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null
  }

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar ${selectedCount} ítem${selectedCount !== 1 ? 's' : ''}?`)) {
      onDelete(selectedItems)
    }
  }

  return (
    <div className="mt-4 p-4 rounded border border-gold-400 bg-gold-50/40 flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-gold-700">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="secondary" size="md" className="text-xs" onClick={() => onMove(selectedItems)}>
          ↔ Mover
        </Button>
        <Button variant="destructive" size="md" className="text-xs" onClick={handleDelete}>
          Eliminar
        </Button>
        <button
          type="button"
          onClick={onClear}
          className="ml-2 text-xs text-text-muted hover:text-text-heading transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
