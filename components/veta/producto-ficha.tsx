'use client'

import { GalleryRail, type GalleryImage } from './gallery-rail'

export interface ProductoFichaData {
  descripcion: string
  sku: string
  unidadMedida: string
  precioPublico?: string | number | null
  precioDirecto?: string | number | null
  stockActual?: number | null
  categoriaComercial?: string | null
  tipo?: string | null
  publicadoWeb?: boolean
  imagenUrl?: string | null
  galeriaImagenesUrl?: string[]
}

interface ProductoFichaProps {
  data: ProductoFichaData
  /** Si se pasa, la galería de la ficha dispara el zoom. */
  onZoom?: (imagenes: GalleryImage[], index: number) => void
  className?: string
}

const fmt = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function aNumero(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') return Number(v)
  return NaN
}

/* Ficha de presentación del producto (t-139, 2026-08-15). Componente standalone:
   recibe datos planos (no la entidad del store) para poder reutilizarse como ficha
   frente al cliente final sin acoplarse al ERP. La galería es un GalleryRail
   compuesto por la portada (imagenUrl) + la galería (galeriaImagenesUrl). */
export function ProductoFicha({ data, onZoom, className }: ProductoFichaProps) {
  const fotos: GalleryImage[] = [
    ...(data.imagenUrl ? [{ url: data.imagenUrl, alt: data.descripcion }] : []),
    ...(data.galeriaImagenesUrl ?? []).map((u, i) => ({
      url: u,
      alt: `${data.descripcion} — imagen ${i + 2}`,
    })),
  ]

  const precioPublico = aNumero(data.precioPublico)
  const precioDirecto = aNumero(data.precioDirecto)
  const tienePrecio = Number.isFinite(precioPublico) && precioPublico > 0
  const tieneStock = typeof data.stockActual === 'number' && data.stockActual > 0

  return (
    <div className={`flex flex-col gap-4 ${className ?? ''}`}>
      <GalleryRail fotos={fotos} etiqueta="Producto" aspectRatio="4 / 3" onZoom={onZoom} />

      <div className="flex flex-col gap-2 border-t border-[var(--color-border-brand)]/30 pt-4">
        <h2 className="font-display text-2xl leading-tight text-[var(--color-text-primary)]">
          {data.descripcion || 'Producto sin descripción'}
        </h2>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-primary)]">
          <span className="font-mono">{data.sku}</span>
          <span className="opacity-50">·</span>
          <span>{data.unidadMedida}</span>
          {data.categoriaComercial && (
            <>
              <span className="opacity-50">·</span>
              <span>{data.categoriaComercial}</span>
            </>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
          {tienePrecio && (
            <span className="font-display text-3xl text-[var(--color-border-brand)]">
              {fmt.format(precioPublico as number)}
            </span>
          )}
          {Number.isFinite(precioDirecto) && precioDirecto > 0 && (
            <span className="pb-1 text-sm text-[var(--color-text-primary)] opacity-70">
              Directo: {fmt.format(precioDirecto as number)}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {data.publicadoWeb ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-border-brand)]/15 px-2.5 py-1 text-xs font-medium text-[var(--color-border-brand)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-border-brand)]" />
              Publicado en web
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-text-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] opacity-70">
              Borrador
            </span>
          )}
          {tieneStock && (
            <span className="inline-flex items-center rounded-full bg-[var(--color-text-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)]">
              Stock: {data.stockActual}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
