'use client'

import { useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCenter,
} from '@dnd-kit/core'
import { type ItemVariante, type GrupoItem } from '@/lib/data'

export interface DragDropContainerProps {
  items: ItemVariante[]
  grupos: GrupoItem[]
  onReorderItems: (sourceId: string, targetGrupoId: string | null) => void
  children: React.ReactNode
}

export function DragDropContainer({
  items,
  grupos,
  onReorderItems,
  children,
}: DragDropContainerProps) {
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // Set up visual feedback if needed
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Determine if we're dragging over a group
    const isOverGroup = grupos.some((g) => g.id === overId)
    if (isOverGroup) {
      // Add visual feedback for drag-over-group
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find which group we're dropping into
    const overGroup = grupos.find((g) => g.id === overId)
    if (overGroup) {
      onReorderItems(activeId, overGroup.id)
    } else {
      // Drop into "sin grupo"
      onReorderItems(activeId, null)
    }
  }

  // Create sensors for keyboard/touch support
  const sensors = useMemo(() => [], [])

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  )
}
