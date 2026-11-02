'use client'

import { useDroppable } from '@dnd-kit/core'
import { type GrupoItem } from '@/lib/data'

export interface DroppableGrupoProps {
  grupoId: string
  grupo: GrupoItem
  isOver?: boolean
  children: React.ReactNode
}

export function DroppableGrupo({
  grupoId,
  grupo,
  isOver = false,
  children,
}: DroppableGrupoProps) {
  const { setNodeRef } = useDroppable({
    id: grupoId,
  })

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${
        isOver ? 'bg-blue-50/30 border border-blue-400' : ''
      }`}
    >
      {children}
    </div>
  )
}
