'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ItemVariante } from '@/lib/data'
import type { CatalogoItemPublico } from '@/lib/data/actions/public'
import { Button } from '@/components/veta/button'

interface ProductSheetModalProps {
  item: ItemVariante
  producto: CatalogoItemPublico | undefined
  onClose: () => void
}

export function ProductSheetModal({ item, producto, onClose }: ProductSheetModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const galeriaCompleta = producto ? [producto.imagenUrl, ...(producto.galeriaImagenesUrl ?? [])].filter(Boolean) as string[] : []

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && galeriaCompleta.length > 1) {
        setCurrentImageIndex((i) => (i + 1) % galeriaCompleta.length)
      }
      if (e.key === 'ArrowLeft' && galeriaCompleta.length > 1) {
        setCurrentImageIndex((i) => (i - 1 + galeriaCompleta.length) % galeriaCompleta.length)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [galeriaCompleta.length, onClose])

  const nombre = item.nombrePersonalizado ?? producto?.descripcion ?? 'Ítem'
  const unidad = producto?.unidadMedida || 'unidad'
  const precioUnitario = Number(item.precioUnitario) || 0
  const totalLinea = Number(item.totalLinea) || 0

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-charcoal-800/50 backdrop-blur-sm p-4">
      <div className="bg-bg-raised rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header Sticky */}
        <header className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border-subtle bg-bg-raised">
          <div className="flex-1">
            <h2 className="font-display text-2xl font-semibold text-text-heading">{nombre}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:bg-linen transition-colors duration-fast ml-4"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-text-heading" />
          </button>
        </header>

        {/* Contenido Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-6 lg:p-10">
          {/* Columna: Galería */}
          <div className="flex flex-col gap-4">
            {galeriaCompleta.length > 0 ? (
              <>
                {/* Imagen Principal */}
                <div className="relative w-full aspect-[3/4] bg-surface rounded-lg overflow-hidden border border-border-subtle">
                  <Image
                    src={galeriaCompleta[currentImageIndex]}
                    alt={nombre}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  {galeriaCompleta.length > 1 && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-mono text-text-muted font-medium">
                      {currentImageIndex + 1} / {galeriaCompleta.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {galeriaCompleta.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {galeriaCompleta.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-sm overflow-hidden border-2 transition-all duration-fast ${
                          idx === currentImageIndex
                            ? 'border-border-brand shadow-md'
                            : 'border-border-subtle hover:border-border-subtle'
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Vista ${idx + 1}`}
                          width={64}
                          height={64}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Controles de Navegación */}
                {galeriaCompleta.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i - 1 + galeriaCompleta.length) % galeriaCompleta.length)}
                      className="flex-1 py-2 px-3 rounded-md border border-border-subtle hover:bg-linen transition-colors duration-fast flex items-center justify-center gap-2 text-sm font-medium text-text-heading"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i + 1) % galeriaCompleta.length)}
                      className="flex-1 py-2 px-3 rounded-md border border-border-subtle hover:bg-linen transition-colors duration-fast flex items-center justify-center gap-2 text-sm font-medium text-text-heading"
                    >
                      Siguiente
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-[3/4] bg-surface rounded-lg border border-border-subtle flex items-center justify-center">
                <p className="text-sm text-text-muted">Sin imagen disponible</p>
              </div>
            )}
          </div>

          {/* Columna: Información Técnica */}
          <div className="flex flex-col gap-6">
            {/* Descripción */}
            {producto?.descripcion && (
              <div className="border-b border-border-subtle pb-6">
                <p className="text-sm leading-relaxed text-stone-600 italic">{producto.descripcion}</p>
              </div>
            )}

            {/* Precio */}
            <div className="p-4 bg-linen rounded-lg border-l-3 border-gold-600">
              <p className="text-xs uppercase tracking-[0.08em] text-text-muted font-medium mb-1">
                Precio unitario
              </p>
              <p className="font-display text-3xl font-bold text-text-heading">
                {precioUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </p>
            </div>

            {/* Cantidad, Unidad y Total */}
            <div className="border-b border-border-subtle pb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface rounded-md border border-border-subtle">
                  <p className="text-xs uppercase tracking-[0.08em] text-text-muted font-medium mb-1">
                    Cantidad
                  </p>
                  <p className="text-lg font-semibold text-text-heading">
                    {Number(item.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                {unidad && (
                  <div className="p-3 bg-surface rounded-md border border-border-subtle">
                    <p className="text-xs uppercase tracking-[0.08em] text-text-muted font-medium mb-1">
                      Unidad
                    </p>
                    <p className="text-lg font-semibold text-text-heading">
                      {unidad}
                    </p>
                  </div>
                )}
              </div>
              {totalLinea > 0 && (
                <div className="mt-3 p-3 bg-surface rounded-md border border-border-subtle">
                  <p className="text-xs uppercase tracking-[0.08em] text-text-muted font-medium mb-1">
                    Total línea
                  </p>
                  <p className="text-lg font-semibold text-text-heading">
                    {totalLinea.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
            </div>

            {/* Campos Personalizados del Producto */}
            {producto?.camposPersonalizados && producto.camposPersonalizados.length > 0 && (
              <div className="border-b border-border-subtle pb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-600 mb-4">
                  Especificaciones
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {producto.camposPersonalizados.map((campo) => (
                    <div key={campo.clave} className="p-3 bg-surface rounded-md border border-border-subtle">
                      <p className="text-xs uppercase tracking-[0.08em] text-text-muted font-medium mb-1">
                        {campo.clave}
                      </p>
                      <p className="text-sm text-text-heading">{campo.valor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comentario del Ítem */}
            {item.comentario && (
              <div className="p-4 bg-gold-100 rounded-lg border-l-3 border-gold-600">
                <p className="text-sm text-text-heading leading-relaxed">
                  <strong>Nota:</strong> {item.comentario}
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-md border border-border-subtle hover:bg-linen transition-colors duration-fast text-sm font-medium text-text-heading"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
