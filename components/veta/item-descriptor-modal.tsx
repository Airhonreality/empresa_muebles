'use client'

import Image from 'next/image'
import { Modal } from '@/components/veta/modal'
import { type ProductoCatalogo } from '@/lib/data'

interface ItemDescriptorModalProps {
  producto: ProductoCatalogo
  onClose: () => void
}

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Modal descriptivo al que abre la <ItemMiniatura>. Hereda visualmente el
 * ProductoCatalogo referenciado por un ítem cotizado: imagen HD + specs.
 *
 * No muestra datos internos de compras: `stockActual`, `proveedorId`,
 * `modelo3dUrl`. El cierre (X esquina superior derecha + Escape + overlay) vuelve
 * al padre vía `onClose`; el padre deja de renderizarlo (patrón controlled-mount).
 */
export function ItemDescriptorModal({ producto, onClose }: ItemDescriptorModalProps) {
  const titulo = producto.descripcion || producto.sku
  return (
    <Modal open={true} onClose={onClose} title={titulo}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="sm:w-1/2">
          {producto.imagenUrl ? (
            // unoptimized: URLs mock/blob temporales en el cotizador
            <Image
              src={producto.imagenUrl}
              alt={producto.descripcion}
              width={640}
              height={480}
              unoptimized
              className="aspect-[4/3] w-full rounded-sm border border-border-subtle object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-sm border border-border-subtle bg-bg-alt text-xs text-text-muted">
              Sin imagen
            </div>
          )}
        </div>

        <div className="sm:w-1/2 space-y-2 text-sm">
          <p className="font-mono text-xs text-text-muted">{producto.sku}</p>
          <p className="font-semibold text-text-heading">{producto.descripcion}</p>
          {producto.categoriaComercial ? (
            <span className="inline-block rounded bg-bg-alt px-2 py-0.5 text-xs text-text-muted">
              {producto.categoriaComercial}
            </span>
          ) : null}

          <div className="border-t border-border-subtle my-3"></div>

          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-text-muted">Precio directo</td>
                <td className="font-mono text-right">
                  {producto.precioDirecto ? formatCOP(parseNum(producto.precioDirecto)) : '—'}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-text-muted">Precio público</td>
                <td className="font-mono text-right">
                  {producto.precioPublico ? formatCOP(parseNum(producto.precioPublico)) : '—'}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-text-muted">Unidad</td>
                <td className="text-right">{producto.unidadMedida || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
