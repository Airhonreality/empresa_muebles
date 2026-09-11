'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './button'

export type EntityActionVariant = 'primary' | 'secondary' | 'destructive'

export interface EntityAction {
  id: string
  label: string
  icon?: ReactNode
  variant: EntityActionVariant
  onClick: () => void
  hidden?: boolean
  disabled?: boolean
  loading?: boolean
  title?: string
}

interface EntityActionsBarProps {
  actions: EntityAction[]
  className?: string
}

// Mapea el `variant` semántico de la acción al `variant` visual de Button.
// `destructive` usa el look "ghost + rojo" que ya tenía "Eliminar" en el
// cotizador (no introduce un botón rojo sólido nuevo que no exista en D4).
function buttonVariantFor(variant: EntityActionVariant): 'primary' | 'secondary' | 'ghost' {
  if (variant === 'primary') return 'primary'
  if (variant === 'destructive') return 'ghost'
  return 'secondary'
}

function ActionButton({ action }: { action: EntityAction }) {
  return (
    <Button
      variant={buttonVariantFor(action.variant)}
      size="md"
      className={`h-7 shrink-0 px-2 text-xs whitespace-nowrap ${action.variant === 'destructive' ? 'text-red-500 hover:text-red-600' : ''}`}
      onClick={action.onClick}
      disabled={action.disabled}
      loading={action.loading}
      title={action.title}
    >
      {action.icon}
      {action.label}
    </Button>
  )
}

/**
 * EntityActionsBar — DP3/DP5 (decision_axiomatica_2026-09-10, Decisión 1).
 *
 * REDISEÑO 2026-09-11 (hallazgo de Javier, boceto anotado): la versión anterior tenía dos
 * layouts divergentes por breakpoint — desktop mostraba TODAS las acciones en una fila sin
 * wrap (desbordaba con >5-6 acciones, exactamente lo que pasó en el cotizador con 8-9) y
 * mobile colapsaba a un menú "⋮" con las primarias fijas en una barra `fixed bottom-14`
 * aparte. Dos layouts = dos lugares donde reintroducir el mismo bug (t-151). Unificado a
 * UN SOLO layout, igual en cualquier viewport:
 * - Las acciones `primary` (normalmente 1-3) van siempre inline, en la fila del header.
 * - `secondary` + `destructive` colapsan siempre en un menú "⋮" (popover, click-outside).
 * Ya no hay una barra fija aparte que pueda chocar con otro elemento `fixed`/`sticky` de
 * la pantalla (ej. el footer financiero del cotizador, que también vive en `bottom-14`
 * en mobile).
 */
export function EntityActionsBar({ actions, className = '' }: EntityActionsBarProps) {
  const visibles = actions.filter((a) => !a.hidden)
  const primarias = visibles.filter((a) => a.variant === 'primary')
  const colapsables = visibles.filter((a) => a.variant !== 'primary')

  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuAbierto) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuAbierto])

  if (visibles.length === 0) return null

  return (
    <div className={`flex items-center gap-1.5 shrink-0 ${className}`}>
      {primarias.map((a) => (
        <ActionButton key={a.id} action={a} />
      ))}
      {colapsables.length > 0 && (
        <div className="relative shrink-0" ref={menuRef}>
          <Button
            variant="ghost"
            size="md"
            className="h-7 px-2 text-sm font-semibold"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Más acciones"
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
          >
            ⋮
          </Button>
          {menuAbierto && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 rounded border border-border-subtle bg-bg-raised shadow-md py-1 z-50"
            >
              {colapsables.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    a.onClick()
                    setMenuAbierto(false)
                  }}
                  disabled={a.disabled}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-bg-alt disabled:opacity-40 ${
                    a.variant === 'destructive' ? 'text-red-500' : 'text-text-heading'
                  }`}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
