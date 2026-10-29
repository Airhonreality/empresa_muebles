'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { type ItemVariante, type ProductoCatalogo } from '@/lib/data'
import { ItemRow, type ItemRowProps } from './ItemRow'

export interface DraggableItemRowProps extends ItemRowProps {
  itemId: string
  isDragDisabled?: boolean
}

export function DraggableItemRow({
  itemId,
  isDragDisabled = false,
  ...itemRowProps
}: DraggableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: itemId,
    disabled: isDragDisabled,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <ItemRow {...itemRowProps} />
    </div>
  )
}
