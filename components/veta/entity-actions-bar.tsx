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

function ActionButton({ action, full = false }: { action: EntityAction; full?: boolean }) {
  return (
    <Button
      variant={buttonVariantFor(action.variant)}
      size="md"
      className={`h-7 px-2 text-xs whitespace-nowrap ${action.variant === 'destructive' ? 'text-red-500 hover:text-red-600' : ''} ${full ? 'flex-1 min-w-0 h-10 truncate' : ''}`}
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
 * EntityActionsBar — DP3/DP5 (decision_axiomatica_2026-09-10, Decisión 1). Recibe
 * descriptores de acción agnósticos (sin lógica de negocio propia) y resuelve UN SOLO
 * layout responsive -- reemplaza el patrón anterior de "barra desktop completa" +
 * "barra mobile con solo algunos botones" (bug documentado, t-151):
 *
 * - Desktop (>=sm): todas las acciones visibles en fila, agrupadas por variant
 *   (secondary agrupadas primero, primary destacadas, destructive separada por un
 *   divisor al final).
 * - Mobile (<sm): la(s) acción(es) primary quedan fijas abajo (fila sticky, como ya
 *   existía); secondary/destructive colapsan en un menú "⋮" (popover mínimo con
 *   useState + click-outside -- mismo patrón que components/veta/smart-search.tsx,
 *   sin librería nueva).
 */
export function EntityActionsBar({ actions, className = '' }: EntityActionsBarProps) {
  const visibles = actions.filter((a) => !a.hidden)
  const primarias = visibles.filter((a) => a.variant === 'primary')
  const secundarias = visibles.filter((a) => a.variant === 'secondary')
  const destructivas = visibles.filter((a) => a.variant === 'destructive')
  const colapsables = [...secundarias, ...destructivas]

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
    <>
      {/* Desktop: todas las acciones en fila, agrupadas por variant */}
      <div className={`hidden sm:flex items-center gap-1.5 shrink-0 ${className}`}>
        {secundarias.map((a) => (
          <ActionButton key={a.id} action={a} />
        ))}
        {primarias.map((a) => (
          <ActionButton key={a.id} action={a} />
        ))}
        {destructivas.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border-subtle">
            {destructivas.map((a) => (
              <ActionButton key={a.id} action={a} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile: primary fija abajo (fila sticky ya existente) + resto colapsado en "⋮" */}
      {(primarias.length > 0 || colapsables.length > 0) && (
        <div className="sm:hidden fixed bottom-14 left-0 right-0 z-40 bg-bg-raised border-t border-border-subtle p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center gap-2 pb-safe">
          {primarias.map((a) => (
            <ActionButton key={a.id} action={a} full />
          ))}
          {colapsables.length > 0 && (
            <div className="relative shrink-0" ref={menuRef}>
              <Button
                variant="ghost"
                size="md"
                className="h-10 px-3 text-base font-semibold"
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
                  className="absolute bottom-full right-0 mb-2 w-52 rounded border border-border-subtle bg-bg-raised shadow-md py-1 z-50"
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
      )}
    </>
  )
}
