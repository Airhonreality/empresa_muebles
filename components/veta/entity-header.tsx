import type { ReactNode } from 'react'

type EntityHeaderVariant = 'compact' | 'stacked'

interface EntityHeaderProps {
  /** Código corto de la entidad (ej. "COT-2026-09-04-01"). Oculto en mobile en variant compact. */
  codigo?: string
  titulo: string
  /** Metadata secundaria (cliente, ubicación, etc.). String simple o JSX compuesto por el caller. */
  subtitulo?: ReactNode
  /** Uno o más <Badge> (u otro indicador) — EntityHeader no conoce su contenido. */
  badges?: ReactNode
  /** Si se provee, renderiza un ícono de lápiz junto al título que dispara este callback
   * (ej. abrir un modal de edición específico de la entidad — EntityHeader no lo conoce). */
  onEditar?: () => void
  /**
   * 'compact': fila sticky de una sola línea (uso: barra superior de un editor denso).
   * 'stacked': título grande, subtítulo debajo, badges a la derecha (uso: header de página/detalle).
   */
  variant?: EntityHeaderVariant
  /** Solo aplica a variant='compact'. */
  sticky?: boolean
  /**
   * Slot libre a la derecha del header (controles inline como checkboxes/inputs de edición
   * rápida, y/o un <EntityActionsBar>). EntityHeader NO decide qué de esto se oculta en mobile
   * -- cada nodo pasado aquí controla su propia visibilidad responsive (así el <EntityActionsBar>
   * puede resolver su fila fija mobile sin quedar atrapado detrás de un `hidden` del padre).
   */
  children?: ReactNode
  className?: string
}

function EditarTrigger({ onEditar, titulo }: { onEditar: () => void; titulo: string }) {
  return (
    <button
      type="button"
      onClick={onEditar}
      className="shrink-0 p-1 rounded text-text-muted hover:text-gold-600 hover:bg-bg-alt transition-colors duration-fast"
      aria-label={`Editar ${titulo}`}
      title="Editar"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M11.5 2.5l2 2L5 13l-2.5.5.5-2.5 8.5-8.5z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </button>
  )
}

/**
 * EntityHeader — DP1 (decision_axiomatica_2026-09-10, Decisión 1). Presentación pura de
 * metadata de una entidad (código/título/subtítulo/badges). No conoce "proyecto" ni
 * "cotización" -- 100% agnóstico, consumido por props. Las acciones de la pantalla NO
 * viven acá: van en <EntityActionsBar>, compuesto como children (ver nota en la prop).
 */
export function EntityHeader({
  codigo,
  titulo,
  subtitulo,
  badges,
  onEditar,
  variant = 'compact',
  sticky = false,
  children,
  className,
}: EntityHeaderProps) {
  if (variant === 'stacked') {
    return (
      <header className={className ?? 'mb-8'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {codigo && <span className="text-xs font-mono text-gold-600 shrink-0">{codigo}</span>}
              <h1 className="font-display text-3xl font-semibold text-text-heading truncate" title={titulo}>
                {titulo}
              </h1>
              {onEditar && <EditarTrigger onEditar={onEditar} titulo={titulo} />}
            </div>
            {subtitulo && <div className="text-sm text-text-muted mt-2">{subtitulo}</div>}
          </div>
          {(badges || children) && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {badges}
              {children}
            </div>
          )}
        </div>
      </header>
    )
  }

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-10 ' : ''}bg-bg-raised px-4 py-3 sm:py-2 border-b border-border-subtle shadow-sm${className ? ` ${className}` : ''}`}
    >
      <div className="flex items-center justify-between gap-x-4">
        <div className="min-w-0 flex flex-1 items-center gap-3">
          {codigo && <span className="hidden sm:inline text-xs font-mono text-gold-600 shrink-0">{codigo}</span>}
          <h1 className="font-display text-lg sm:text-base font-semibold text-text-heading truncate" title={titulo}>
            {titulo}
          </h1>
          {onEditar && <EditarTrigger onEditar={onEditar} titulo={titulo} />}
          {subtitulo && <span className="hidden sm:inline text-xs text-text-muted truncate">{subtitulo}</span>}
          {badges}
        </div>
        {children && <div className="flex items-center gap-1.5 shrink-0">{children}</div>}
      </div>
    </header>
  )
}
