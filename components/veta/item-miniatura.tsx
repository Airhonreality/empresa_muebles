'use client'

import Image from 'next/image'
import { type ProductoCatalogo } from '@/lib/data'

interface ItemMiniaturaProps {
  producto?: ProductoCatalogo | null
  /** Foto propia del ítem (schema items_variante.foto_url, 2026-09-18). Tiene precedencia sobre
   * la imagen del producto. Permite que un ítem a la medida sin catálogo tenga miniatura. */
  fotoUrl?: string | null
  onClick?: () => void
}

/**
 * Miniatura clicable de un ítem cotizado que hereda del ProductoCatalogo referenciado
 * por `item.catalogoId`. Cuadrado pequeño (36px) con imagen `object-cover` o placeholder
 * de inicial de SKU sobre `bg-bg-alt` (mismo patrón de app/erp/catalogo/page.tsx).
 * La foto propia del ítem (`fotoUrl`) tiene precedencia sobre la del producto.
 *
 * Si no hay producto ni foto propia, no muestra nada clicable — evita que se abra el
 * modal con información fantasma y no crashea.
 */
export function ItemMiniatura({ producto, fotoUrl, onClick }: ItemMiniaturaProps) {
  if (!producto && !fotoUrl) {
    return (
      <div
        className="h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-border-subtle bg-bg-alt"
        aria-label="Sin catálogo asociado"
      />
    )
  }

  const src = fotoUrl || producto?.imagenUrl || null
  const etiqueta = producto?.descripcion ?? 'Ítem a la medida'

  return (
    <button
      type="button"
      onClick={onClick}
      title={producto ? `Ver detalle de ${producto.descripcion}` : 'Ver detalle del ítem'}
      aria-label={etiqueta}
      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-border-subtle bg-bg-alt p-0 align-middle shadow-xs transition-colors duration-fast hover:border-brand"
    >
      {src ? (
        // unoptimized: URLs mock/blob temporales en el cotizador
        <Image src={src} alt="" fill unoptimized className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] text-text-muted">
          {producto?.sku.charAt(0) || '·'}
        </span>
      )}
    </button>
  )
}
