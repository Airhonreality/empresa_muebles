import { useState, useRef, useEffect, useCallback } from 'react'

export function useToolbarMenu(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)
  const menuRef = useRef<HTMLDivElement>(null)

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const open_ = useCallback(() => {
    setOpen(true)
  }, [])

  // Click-outside handler
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return {
    open,
    toggle,
    close,
    open: open_,
    menuRef,
  }
}
