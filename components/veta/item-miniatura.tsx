'use client'

import { type ProductoCatalogo } from '@/lib/data'

interface ItemMiniaturaProps {
  producto?: ProductoCatalogo | null
  onClick?: () => void
}

/**
 * Miniatura clicable de un ítem cotizado que hereda del ProductoCatalogo referenciado
 * por `item.catalogoId`. Cuadrado pequeño (36px) con imagen `object-cover` o placeholder
 * de inicial de SKU sobre `bg-bg-alt` (mismo patrón de app/erp/catalogo/page.tsx).
 *
 * Si `producto` es undefined/null (ítem a pedido sin catálogo), no muestra nada
 * clicable — evita que se abra el modal con información fantasma y no crashea.
 */
export function ItemMiniatura({ producto, onClick }: ItemMiniaturaProps) {
  if (!producto) {
    return (
      <div
        className="h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-border-subtle bg-bg-alt"
        aria-label="Sin catálogo asociado"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver detalle del producto"
      aria-label={`Ver detalle de ${producto.descripcion}`}
      className="h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-border-subtle bg-bg-alt p-0 align-middle shadow-xs transition-colors duration-fast hover:border-brand"
    >
      {producto.imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URLs mock/blob temporales
        <img src={producto.imagenUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] text-text-muted">
          {producto.sku.charAt(0) || '·'}
        </span>
      )}
    </button>
  )
}
