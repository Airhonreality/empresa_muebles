'use client'

import type { EstadoAutosave } from '@/lib/hooks/autosave-cola'

/** Indicador mínimo de autoguardado: una línea, sin toasts por tecla. */
export function AutosaveStatus({
  estado,
  onReintentar,
  className = '',
}: {
  estado: EstadoAutosave
  onReintentar?: () => void
  className?: string
}) {
  if (estado === 'idle') return null

  if (estado === 'error') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] text-red-600 ${className}`} role="status">
        No se guardó
        {onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className="underline hover:text-red-700 transition-colors duration-fast"
          >
            Reintentar
          </button>
        )}
      </span>
    )
  }

  if (estado === 'saved') {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] text-text-muted ${className}`} role="status">
        <span aria-hidden>✓</span> Guardado
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-text-muted ${className}`} role="status">
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
      {estado === 'pending' ? 'Sin guardar…' : 'Guardando…'}
    </span>
  )
}
