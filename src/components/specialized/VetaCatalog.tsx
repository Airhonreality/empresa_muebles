'use client'
import React, { useState, useMemo } from 'react'
import type { BlockProps } from 'packages/core/src/types'
import type { ProductosCatalogoRecord } from '@/generated/agnostic-schemas'
import Link from 'next/link'
import VetaHeader from './VetaHeader'
import VetaFooter from './VetaFooter'
import { useAppState } from '@/context/AppContext'
import { getCommercialValue, normalizeWhatsappDestination } from '@/lib/veta/config'
import { Ruler, ShoppingBag, MessageSquare, Tag, Info, AlertCircle } from 'lucide-react'

const cardSurfaces = ['veta-surface-glass', 'veta-surface-stone', 'veta-surface-matte'] as const

export default function VetaCatalog({ block = {}, records = [], api }: Partial<BlockProps>) {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [activeDetailsProduct, setActiveDetailsProduct] = useState<any | null>(null)
  const { data } = useAppState()
  const configRecords = data['configuracion_comercial'] || []
  const whatsappDestination = normalizeWhatsappDestination(
    getCommercialValue(configRecords, 'whatsapp_number', '+57 300 123 4567')
  )

  const catalogRecords = records as ProductosCatalogoRecord[]

  // Clean products list loaded dynamically from the Adapter
  const furnitureItems = useMemo(() => {
    return catalogRecords
      .filter(r => r.data?.tipo === 'Mueble Terminado')
      .map(r => ({
        id: r.id,
        sku: r.data.sku || 'VD-GEN-01',
        title: r.data.descripcion || 'Mueble de Colección',
        price: r.data.precio_publico || 0,
        // TODO: reemplazar por fotografía real de proyecto Veta Dorada
        image: r.data.imagen_url || '/api/assets/milano_console.png',
        ancho: r.data.ancho || '-',
        alto: r.data.alto || '-',
        profundo: r.data.profundo || '-',
        stock: r.data.stock_actual || 0,
        description: r.data.url_referencia || 'Mobiliario exclusivo premium elaborado bajo pedido con ebanistería fina.',
        // Decoupled commercial category read directly from data schemas, avoiding SKU parsing
        category: (r.data as any).categoria_comercial || 'consolas'
      }))
  }, [catalogRecords])

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'todos') return furnitureItems
    return furnitureItems.filter(item => item.category === selectedCategory)
  }, [selectedCategory, furnitureItems])

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(p)
  }

  const categoryTabs = [
    { id: 'todos', label: 'Ver Todo' },
    { id: 'consolas', label: 'Consolas / Recibidores' },
    { id: 'cavas', label: 'Cavas / Bares' },
    { id: 'mesas', label: 'Comedores' },
    { id: 'camas', label: 'Camas' }
  ]

  return (
    <div className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))] flex flex-col">
      <VetaHeader />

      {/* Hero section banner */}
      <section className="veta-section relative px-6 !pb-12">
        <div className="mx-auto max-w-7xl relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[hsl(var(--veta-gold-hover))] uppercase tracking-[0.26em]">
              <Tag className="w-3.5 h-3.5" />
              <span>Precio Fijo y Calidad Excepcional</span>
            </div>
            <h1 className="veta-heading text-3xl md:text-5xl font-semibold tracking-tight">
              Mobiliario de Colección
            </h1>
          </div>
          <p className="text-sm max-w-[46ch] font-light leading-relaxed text-[hsl(var(--veta-text-stone))]">
            Nuestras colecciones de catálogo representan la ilusión de poseer una pieza icónica de ultra-lujo a un precio sumamente honesto. Fabricados con juntas tradicionales e insumos importados.
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="veta-surface-matte sticky top-20 z-40 rounded-none border-x-0 px-6 py-5">
        <div className="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar gap-2">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                selectedCategory === tab.id
                  ? 'bg-[hsl(var(--veta-gold-muted))] text-[#0A0A0A]'
                  : 'text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))] hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid of Catalog Furniture */}
      <section className="veta-section px-6 flex-grow">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="veta-surface-matte text-center py-20 rounded-[2rem] max-w-lg mx-auto space-y-4">
              <AlertCircle className="w-8 h-8 text-[hsl(var(--veta-gold-hover))] mx-auto" />
              <h3 className="text-lg font-semibold uppercase tracking-wider">Colección Próximamente</h3>
              <p className="text-xs leading-relaxed max-w-xs mx-auto text-[hsl(var(--veta-text-stone))]">
                Actualmente no existen piezas de catálogo activas en esta categoría. Agenda una cita y diseñemos una solución a la medida.
              </p>
              <div className="pt-2">
                <Link href="/agendar" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
                  Agendar Consulta
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`${cardSurfaces[index % cardSurfaces.length]} group flex flex-col justify-between h-full overflow-hidden rounded-[1.5rem]`}
                >
                  <div>
                    {/* Photo Container */}
                    <div className="relative h-64 overflow-hidden shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Stock badge */}
                      <div className="absolute top-4 right-4 veta-surface-glass px-2 py-1 rounded-full text-[9px] uppercase tracking-wider text-[hsl(var(--veta-text-carbon))]">
                        {item.stock > 0 ? `Unidades: ${item.stock}` : 'Bajo Pedido'}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-[hsl(var(--veta-text-stone))]">
                          SKU: {item.sku}
                        </span>
                        <h3 className="veta-heading text-lg font-semibold tracking-tight transition-colors duration-300 group-hover:text-[hsl(var(--veta-gold-hover))]">
                          {item.title}
                        </h3>
                      </div>

                      <p className="text-xs leading-relaxed font-light line-clamp-2 text-[hsl(var(--veta-text-stone))]">
                        {item.description}
                      </p>

                      {/* Technical details link */}
                      <button
                        onClick={() => setActiveDetailsProduct(item)}
                        className="text-[10px] text-[hsl(var(--veta-gold-hover))] font-semibold uppercase tracking-wider flex items-center space-x-1.5 pt-1 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Ficha Técnica & Medidas</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-4">
                    {/* Price */}
                    <div className="border-t border-[hsl(var(--veta-glass-light-border))] pt-4 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[hsl(var(--veta-text-stone))]">Precio Fijo</span>
                      <span className="text-lg font-semibold tracking-tight">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-5 gap-2">
                      <button
                        onClick={() => {
                          const message = encodeURIComponent(`Hola Veta Dorada, estoy interesado en el producto ${item.title} (SKU: ${item.sku}) de precio ${formatPrice(item.price)}.`);
                          window.open(`https://wa.me/${whatsappDestination}?text=${message}`, '_blank');
                        }}
                        className="col-span-2 border border-[hsl(var(--veta-glass-light-border))] hover:border-[hsl(var(--veta-gold-muted))] text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))] flex items-center justify-center py-3 rounded-full transition-all duration-300"
                        title="Preguntar por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <Link
                        href="/agendar"
                        className="col-span-3 bg-[hsl(var(--veta-gold-muted))] hover:bg-[hsl(var(--veta-gold-hover))] text-[#0A0A0A] flex items-center justify-center space-x-2 py-3 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-300"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Comprar</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      {activeDetailsProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveDetailsProduct(null)}
        >
          <div
            className="veta-surface-glass max-w-lg w-full overflow-hidden rounded-[1.5rem] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative h-56">
              <img
                src={activeDetailsProduct.image}
                alt={activeDetailsProduct.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveDetailsProduct(null)}
                className="absolute top-4 right-4 veta-surface-glass text-[hsl(var(--veta-text-carbon))] w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <span className="text-xs text-[hsl(var(--veta-gold-hover))] font-semibold tracking-widest uppercase">
                  Ficha de Producto (SKU: {activeDetailsProduct.sku})
                </span>
                <h3 className="veta-heading text-2xl font-semibold tracking-tight">
                  {activeDetailsProduct.title}
                </h3>
              </div>

              <p className="text-sm leading-relaxed font-light text-[hsl(var(--veta-text-stone))]">
                {activeDetailsProduct.description}
              </p>

              {/* Dimensions specs */}
              <div className="veta-surface-matte p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center space-x-2">
                  <Ruler className="w-3.5 h-3.5 text-[hsl(var(--veta-gold-hover))]" />
                  <span>Dimensiones y Espesores</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-white/50 p-2 rounded-xl">
                    <span className="block text-[10px] uppercase text-[hsl(var(--veta-text-stone))]">Ancho</span>
                    <span className="font-semibold">{activeDetailsProduct.ancho}</span>
                  </div>
                  <div className="bg-white/50 p-2 rounded-xl">
                    <span className="block text-[10px] uppercase text-[hsl(var(--veta-text-stone))]">Alto</span>
                    <span className="font-semibold">{activeDetailsProduct.alto}</span>
                  </div>
                  <div className="bg-white/50 p-2 rounded-xl">
                    <span className="block text-[10px] uppercase text-[hsl(var(--veta-text-stone))]">Profundo</span>
                    <span className="font-semibold">{activeDetailsProduct.profundo}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--veta-glass-light-border))]">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[hsl(var(--veta-text-stone))]">Valor Unitario</span>
                  <span className="text-xl font-semibold text-[hsl(var(--veta-gold-hover))]">
                    {formatPrice(activeDetailsProduct.price)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`Hola Veta Dorada, quiero encargar el producto ${activeDetailsProduct.title} (SKU: ${activeDetailsProduct.sku}).`);
                    window.open(`https://wa.me/${whatsappDestination}?text=${message}`, '_blank');
                    setActiveDetailsProduct(null);
                  }}
                  className="bg-[hsl(var(--veta-gold-muted))] hover:bg-[hsl(var(--veta-gold-hover))] px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]"
                >
                  Comprar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <VetaFooter />
    </div>
  )
}
