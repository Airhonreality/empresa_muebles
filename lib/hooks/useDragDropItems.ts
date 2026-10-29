import { useState, useCallback } from 'react'

interface DragState {
  draggedItemId: string | null
  dragOverGrupoId: string | null
}

export function useDragDropItems() {
  const [dragState, setDragState] = useState<DragState>({
    draggedItemId: null,
    dragOverGrupoId: null,
  })

  const handleDragStart = useCallback((itemId: string) => {
    setDragState((prev) => ({
      ...prev,
      draggedItemId: itemId,
    }))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState({
      draggedItemId: null,
      dragOverGrupoId: null,
    })
  }, [])

  const handleDragOver = useCallback((grupoId: string | null) => {
    setDragState((prev) => ({
      ...prev,
      dragOverGrupoId: grupoId,
    }))
  }, [])

  const isDragging = dragState.draggedItemId !== null
  const isDropTarget = (grupoId: string) => dragState.dragOverGrupoId === grupoId

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    isDragging,
    isDropTarget,
  }
}
