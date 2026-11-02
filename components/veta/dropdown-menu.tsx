'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/veta/button'

export type DropdownMenuVariant = 'primary' | 'secondary' | 'destructive'

export interface DropdownMenuItem {
  id: string
  label: string
  icon?: ReactNode
  variant?: DropdownMenuVariant
  onClick: () => void
  hidden?: boolean
  disabled?: boolean
  loading?: boolean
  title?: string
}

interface DropdownMenuProps {
  items: DropdownMenuItem[]
  /** Contenido del botón trigger (por defecto se renderiza `⋮`). */
  trigger?: ReactNode
  variant?: 'ghost' | 'icon'
  size?: 'md' | 'lg'
  /** Ancho del desplegable (ej. `w-44`, `w-56`). */
  menuWidth?: string
  /** Clases adicionales para el container del menú. */
  className?: string
  /** Posición horizontal: `right-0` (default) o `left-0`. */
  align?: 'right' | 'left'
}

export function DropdownMenu({
  items,
  trigger = <span className="text-xs">⋮</span>,
  variant = 'ghost',
  size = 'md',
  menuWidth = 'w-56',
  className = '',
  align = 'right',
}: DropdownMenuProps) {
  const [abierto, setAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const visibleItems = items.filter((i) => !i.hidden)

  useEffect(() => {
    if (!abierto) return
    const handleClickOutside = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [abierto])

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled || item.loading) return
    item.onClick()
    setAbierto(false)
  }

  return (
    <div className={`relative shrink-0 ${className}`} ref={menuRef}>
      <Button
        variant={variant}
        size={size}
        className={`h-7 px-2 ${size === 'md' ? 'text-xs' : 'text-sm'} font-semibold ${variant === 'ghost' ? 'text-text-muted hover:text-text-heading' : ''}`}
        onClick={() => setAbierto((v) => !v)}
        aria-label="Más acciones"
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        {trigger}
      </Button>
      {abierto && visibleItems.length > 0 && (
        <div
          ref={menuRef}
          role="menu"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 ${menuWidth} rounded border border-border-subtle bg-bg-raised shadow-md py-1 z-50`}
        >
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(item)}
              disabled={item.disabled || item.loading}
              aria-disabled={item.disabled || undefined}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-bg-alt disabled:opacity-40 disabled:cursor-not-allowed ${
                item.variant === 'destructive' ? 'text-red-500' : 'text-text-heading'
              } ${item.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={item.title}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
              {item.loading && <span className="ml-auto text-[10px]">…</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
