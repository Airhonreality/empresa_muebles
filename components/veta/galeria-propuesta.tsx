'use client'

import Image from 'next/image'

export interface GaleriaPropuestaFoto {
  url: string
  alt: string
}

interface GaleriaPropuestaProps {
  fotos: GaleriaPropuestaFoto[]
  etiqueta?: string
  onZoom?: (fotos: GaleriaPropuestaFoto[], index: number) => void
}

/* Galería compacta de la propuesta pública (rediseño 2026-10-29).
   Antes cada ambiente usaba un carrusel único a ancho completo: en escritorio
   la imagen se estiraba hasta ~900px y se veía gigante y pixelada. Aquí:
   móvil = una imagen por fila a ancho total (lectura cómoda), escritorio =
   grilla de 3 columnas a ancho total. Las imágenes se recortan con object-cover
   en un marco 4/3, así que nunca se muestran por encima de su resolución útil. */
export function GaleriaPropuesta({ fotos, etiqueta, onZoom }: GaleriaPropuestaProps) {
  if (fotos.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {fotos.map((foto, i) => (
        <button
          key={`${foto.url}-${i}`}
          type="button"
          onClick={() => onZoom?.(fotos, i)}
          disabled={!onZoom}
          aria-label={onZoom ? `Ampliar imagen ${i + 1}` : undefined}
          className={`group relative aspect-[4/3] overflow-hidden rounded-lg border border-border-subtle bg-bg-alt shadow-xs ${
            onZoom ? 'cursor-zoom-in' : 'cursor-default'
          }`}
        >
          <Image
            src={foto.url}
            alt={foto.alt}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-base group-hover:scale-[1.02]"
          />
          {etiqueta && i === 0 && (
            <span className="absolute left-2 top-2 rounded-sm bg-white/85 px-2 py-0.5 text-[11px] font-medium text-text-primary shadow-xs">
              {etiqueta}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
