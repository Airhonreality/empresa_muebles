'use client'
// Capa 2 (t-200): colección de miniaturas de UN slot. Cada miniatura tiene una sola superficie
// de interacción (seleccionar). Ningún control flota encima de la imagen: mover, ampliar y
// quitar viven en el panel (capa 3) y en el teclado.
import type { KeyboardEvent } from 'react'
import type { ImagenItem } from '@/lib/imagen/tipos'

export interface SubidaEnCurso {
  id: string
  objectUrl: string
  nombre: string
}

export interface ColeccionProps {
  items: ImagenItem[]
  pendientes?: SubidaEnCurso[]
  seleccionadoId: string | null
  onSeleccionar: (clienteId: string) => void
  onMoverRelativo: (clienteId: string, delta: 1 | -1) => void
  onQuitar: (clienteId: string) => void
  onAmpliar: (clienteId: string) => void
  etiqueta: string
}

export function Coleccion({
  items,
  pendientes = [],
  seleccionadoId,
  onSeleccionar,
  onMoverRelativo,
  onQuitar,
  onAmpliar,
  etiqueta,
}: ColeccionProps) {
  if (items.length === 0 && pendientes.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-sm border border-dashed border-border-subtle text-xs text-text-muted">
        Todavía no hay fotos en “{etiqueta}”
      </div>
    )
  }

  const teclado = (clienteId: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); onMoverRelativo(clienteId, -1) }
    else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); onMoverRelativo(clienteId, 1) }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onQuitar(clienteId) }
    else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); onAmpliar(clienteId) }
  }

  return (
    <ul
      aria-label={`Fotos: ${etiqueta}`}
      className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3"
    >
      {items.map((it, idx) => {
        const seleccionado = it.clienteId === seleccionadoId
        return (
          <li key={it.clienteId}>
            <button
              type="button"
              aria-pressed={seleccionado}
              aria-label={`Foto ${idx + 1}${it.base.alt ? `: ${it.base.alt}` : ''}. Enter para seleccionar, Alt+flechas para mover, Supr para quitar`}
              onClick={() => onSeleccionar(it.clienteId)}
              onDoubleClick={() => onAmpliar(it.clienteId)}
              onKeyDown={teclado(it.clienteId)}
              className={`relative block w-full overflow-hidden rounded-sm border-2 bg-bg-paper transition-colors duration-fast focus:outline-none focus-visible:shadow-ring-focus ${
                seleccionado ? 'border-gold-500' : 'border-border-subtle hover:border-gold-400'
              }`}
            >
              <div className="aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs de R2 o externas clonadas, no assets estáticos */}
                <img src={it.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1 top-1 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[11px] leading-none text-white"
              >
                {idx + 1}
              </span>
            </button>
          </li>
        )
      })}

      {pendientes.map((p) => (
        <li key={p.id} aria-live="polite">
          <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-border-subtle bg-bg-paper opacity-70">
            {/* eslint-disable-next-line @next/next/no-img-element -- preview local temporal (blob:) mientras sube */}
            <img src={p.objectUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
            </div>
            <span className="sr-only">Subiendo {p.nombre}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
