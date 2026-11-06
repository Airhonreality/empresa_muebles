'use client'

/**
 * Sistema de barra inferior móvil del ERP (Fase 2, 2026-11).
 *
 * Contrato:
 * - El SHELL (`erp-shell.tsx`) es dueño de la pila inferior: un único contenedor
 *   `fixed bottom-0 z-50` (solo <md) que contiene primero el slot del dock y después
 *   la nav. Las páginas NO escriben `fixed bottom-*` (lo fuerza un test en
 *   `mobile-dock.test.ts`).
 * - `<MobileDock>` se monta por portal dentro de ese slot: máximo 2 acciones primarias
 *   + overflow ⋮ que abre `<MobileActionSheet>`.
 * - `<MobileActionSheet>` se monta por portal a `document.body` (z-70): nunca queda
 *   atrapada en un contexto de apilamiento de la página (filas con transform/z-index).
 * - La altura real de la pila se publica en la variable CSS `--erp-stack-h` (ResizeObserver
 *   en el shell); el shell usa esa variable como padding inferior, así que las páginas
 *   no necesitan magic numbers.
 *
 * Escala de capas (z-index): contenido 0 · sticky 10 · pila inferior (dock+nav) 50 ·
 * hoja/overlay 70. Las clases van literales porque Tailwind no ve clases dinámicas.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/veta/button'

// ---------------------------------------------------------------------------
// Slot: el shell publica el nodo donde el dock se dibuja.
// ---------------------------------------------------------------------------

const MobileDockSlotContext = createContext<HTMLElement | null>(null)

export function MobileDockSlotProvider({ node, children }: { node: HTMLElement | null; children: ReactNode }) {
  return <MobileDockSlotContext.Provider value={node}>{children}</MobileDockSlotContext.Provider>
}

export function useMobileDockSlot(): HTMLElement | null {
  return useContext(MobileDockSlotContext)
}

// ---------------------------------------------------------------------------
// Dock
// ---------------------------------------------------------------------------

export type DockAction = {
  key: string
  label: string
  onSelect: () => void
  variant?: 'primary' | 'secondary' | 'destructive'
  disabled?: boolean
  ariaLabel?: string
}

export type MobileDockProps = {
  /** Texto/resumen a la izquierda (ej. total acumulado). Opcional. */
  info?: ReactNode
  /** Acciones primarias visibles: 1 o 2, nunca más. */
  primary: [DockAction] | [DockAction, DockAction]
  /** Acciones secundarias: van dentro de la hoja ⋮. Si no hay, no aparece el ⋮. */
  overflow?: DockAction[]
  overflowTitle?: string
}

export function MobileDock({ info, primary, overflow = [], overflowTitle = 'Más acciones' }: MobileDockProps) {
  const slot = useMobileDockSlot()
  const [hojaAbierta, setHojaAbierta] = useState(false)
  // Los `sm:hidden` replican el comportamiento previo: el dock solo existe por debajo de sm.
  if (!slot) return null

  return createPortal(
    <div className="sm:hidden border-t border-border-subtle bg-bg-raised/95 backdrop-blur-sm px-4 py-3 shadow-lg">
      <div className="flex items-center gap-3">
        {info && <div className="flex flex-col min-w-0">{info}</div>}
        <div className="flex flex-1 gap-2">
          {primary.map((accion) => (
            <Button
              key={accion.key}
              variant={accion.variant === 'secondary' ? 'secondary' : 'primary'}
              size="md"
              className="flex-1 h-12 min-w-[44px]"
              disabled={accion.disabled}
              aria-label={accion.ariaLabel}
              onClick={accion.onSelect}
            >
              {accion.label}
            </Button>
          ))}
          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setHojaAbierta(true)}
              aria-label="Más acciones"
              aria-haspopup="dialog"
              aria-expanded={hojaAbierta}
              className="h-12 w-12 shrink-0 flex items-center justify-center rounded-md border border-border-subtle bg-bg-paper text-text-heading hover:bg-bg-alt"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {overflow.length > 0 && (
        <MobileActionSheet open={hojaAbierta} onClose={() => setHojaAbierta(false)} title={overflowTitle}>
          <div className="space-y-1">
            {overflow.map((accion) => (
              <button
                key={accion.key}
                type="button"
                disabled={accion.disabled}
                onClick={() => {
                  setHojaAbierta(false)
                  accion.onSelect()
                }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-bg-alt border-b border-border-subtle/50 last:border-0 ${
                  accion.variant === 'destructive' ? 'text-red-600 font-medium' : 'text-text-heading'
                }`}
              >
                {accion.label}
              </button>
            ))}
          </div>
        </MobileActionSheet>
      )}
    </div>,
    slot,
  )
}

// ---------------------------------------------------------------------------
// Hoja de acciones (Action Sheet), reutilizable. Siempre por portal a body.
// ---------------------------------------------------------------------------

export function MobileActionSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    // Un solo contenedor fijo cubre pantalla (z-70): el clic en el fondo cierra, el clic
    // dentro del panel no burbujea a filas/padres de la página.
    <div className="fixed inset-0 z-[70] sm:hidden" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        aria-label="Cerrar menú"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] flex flex-col bg-bg-raised border-t border-border-subtle shadow-2xl rounded-t-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="p-3 border-b border-border-subtle bg-bg-paper flex items-center justify-between">
          <span className="font-semibold text-text-heading">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-gold-600 rounded hover:bg-bg-alt"
            aria-label="Cerrar menú"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 6L10 10M10 6L6 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
