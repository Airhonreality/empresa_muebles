'use client'

import Image from 'next/image'
import { useCallback, useId, useState, type KeyboardEvent } from 'react'

export interface GalleryImage {
  url: string
  alt: string
}

interface GalleryRailProps {
  fotos: GalleryImage[]
  /** Etiqueta opcional mostrada como chip sobre la imagen (p. ej. "Espacio", "Producto"). */
  etiqueta?: string
  /** Proporción de la imagen principal (CSS aspect-ratio). Por defecto 4 / 3. */
  aspectRatio?: string
  /** Si se pasa, la imagen principal es clicable y dispara el zoom con (imágenes, índice). */
  onZoom?: (imagenes: GalleryImage[], index: number) => void
  /** Fallback personalizado si no hay imágenes. Si se omite, no renderiza nada para no contaminar el layout. */
  fallbackVacio?: React.ReactNode
  className?: string
}

/* Primitiva compartida de slider para el proyecto (t-139, 2026-08-15).
   Reemplaza el `GaleriaCarril` local de F-08 y alimenta la `ProductoFicha` del
   catálogo. Un solo carrusel sirve a ERP y a la propuesta del cliente.
   No usa Math.random para ids: consume useId() (regla de hidratación del arnés). */
export function GalleryRail({ fotos, etiqueta, aspectRatio = '4 / 3', onZoom, fallbackVacio, className }: GalleryRailProps) {
  const [activo, setActivo] = useState(0)
  const baseId = useId()
  const total = fotos.length

  const ir = useCallback(
    (i: number) => {
      if (total === 0) return
      setActivo(((i % total) + total) % total)
    },
    [total]
  )

  if (total === 0) {
    return fallbackVacio ? <>{fallbackVacio}</> : null
  }

  const actual = fotos[activo]
  const mostrarNav = total > 1

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!mostrarNav) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      ir(activo - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      ir(activo + 1)
    }
  }

  return (
    <div className={className}>
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-brand)] shadow-[var(--shadow-sm)]"
        style={{ aspectRatio }}
        onKeyDown={onKey}
        tabIndex={mostrarNav ? 0 : -1}
        role="group"
        aria-roledescription="carrusel"
        aria-label={etiqueta ?? 'Galería de imágenes'}
      >
        {onZoom ? (
          <button
            type="button"
            onClick={() => onZoom(fotos, activo)}
            aria-label="Ampliar imagen"
            className="block h-full w-full cursor-zoom-in"
          >
            <Image src={actual.url} alt={actual.alt} fill unoptimized className="object-cover" />
          </button>
        ) : (
          <Image src={actual.url} alt={actual.alt} fill unoptimized className="object-cover" />
        )}

        {etiqueta && (
          <span className="absolute left-3 top-3 rounded-[var(--radius-sm)] bg-white/85 px-2 py-1 text-xs font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]">
            {etiqueta}
          </span>
        )}

        {onZoom && (
          <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
            </svg>
          </span>
        )}

        {mostrarNav && (
          <>
            <button
              type="button"
              onClick={() => ir(activo - 1)}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] transition-transform hover:scale-105"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => ir(activo + 1)}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] transition-transform hover:scale-105"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {mostrarNav && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {fotos.map((f, i) => (
            <li key={`${baseId}-thumb-${i}`}>
              <button
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === activo}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition ${
                  i === activo
                    ? 'border-[var(--color-border-brand)]'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image src={f.url} alt={f.alt} fill unoptimized className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
