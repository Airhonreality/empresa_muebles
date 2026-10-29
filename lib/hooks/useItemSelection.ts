import { useState, useCallback } from 'react'

export function useItemSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = useCallback((itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((itemIds: string[]) => {
    setSelected(new Set(itemIds))
  }, [])

  const clearAll = useCallback(() => {
    setSelected(new Set())
  }, [])

  const isSelected = useCallback((itemId: string) => {
    return selected.has(itemId)
  }, [selected])

  return {
    selected,
    toggle,
    selectAll,
    clearAll,
    isSelected,
    count: selected.size,
    isEmpty: selected.size === 0,
  }
}
