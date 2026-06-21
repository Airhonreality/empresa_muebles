'use client'
import React, { useState, useMemo } from 'react'
import type { BlockProps } from 'packages/core/src/types'
import type { ProductosCatalogoRecord } from '@/generated/agnostic-schemas'
import Link from 'next/link'
import VetaHeader from './VetaHeader'
import VetaFooter from './VetaFooter'
import { Ruler, ShoppingBag, MessageSquare, Tag, Info, AlertCircle } from 'lucide-react'

export default function VetaCatalog({ block = {}, records = [], api }: Partial<BlockProps>) {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [activeDetailsProduct, setActiveDetailsProduct] = useState<any | null>(null)

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
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex flex-col selection:bg-[#D4C5A1]/30 selection:text-[#F5F5F5]">
      <VetaHeader />

      {/* Hero section banner */}
      <section className="pt-20 pb-12 px-6 border-b border-[#D4C5A1]/10 bg-[#0F0F0F] relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1800')] bg-cover bg-center opacity-5" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#D4C5A1] uppercase tracking-[0.2em]">
              <Tag className="w-3.5 h-3.5" />
              <span>Precio Fijo y Calidad Excepcional</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-outfit uppercase tracking-tight text-[#F5F5F5]">
              Mobiliario de Colección
            </h1>
          </div>
          <p className="text-sm text-[#8E8A80] max-w-md font-light leading-relaxed">
            Nuestras colecciones de catálogo representan la ilusión de poseer una pieza icónica de ultra-lujo a un precio sumamente honesto. Fabricados con juntas tradicionales e insumos importados.
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-6 px-6 bg-[#0E0E0E] border-b border-[#D4C5A1]/5 sticky top-20 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar gap-2">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-5 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                selectedCategory === tab.id
                  ? 'bg-[#D4C5A1] text-[#0A0A0A]'
                  : 'text-[#8E8A80] hover:text-[#F5F5F5] hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid of Catalog Furniture */}
      <section className="py-20 px-6 flex-grow">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#D4C5A1]/10 rounded-sm max-w-lg mx-auto space-y-4">
              <AlertCircle className="w-8 h-8 text-[#D4C5A1]/40 mx-auto" />
              <h3 className="text-lg font-bold font-outfit uppercase tracking-wider text-[#F5F5F5]">Colección Próximamente</h3>
              <p className="text-xs text-[#8E8A80] leading-relaxed max-w-xs mx-auto">
                Actualmente no existen piezas de catálogo activas en esta categoría. Agenda una cita y diseñemos una solución a la medida.
              </p>
              <div className="pt-2">
                <Link href="/agendar" className="veta-btn-gold inline-block px-6 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider">
                  Agendar Consulta
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item) => (
                <div 
                  key={item.id}
                  className="veta-glass-card group flex flex-col justify-between h-full overflow-hidden border border-[#D4C5A1]/10 bg-white/2"
                >
                  <div>
                    {/* Photo Container */}
                    <div className="relative h-64 overflow-hidden bg-[#0F0F0F] border-b border-[#D4C5A1]/10 shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Stock badge */}
                      <div className="absolute top-4 right-4 bg-[#0A0A0A]/90 border border-[#D4C5A1]/10 px-2 py-1 rounded-sm text-[9px] uppercase tracking-wider text-[#D4C5A1]">
                        {item.stock > 0 ? `Unidades: ${item.stock}` : 'Bajo Pedido'}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold tracking-wider text-[#8E8A80] uppercase">
                          SKU: {item.sku}
                        </span>
                        <h3 className="text-lg font-bold font-outfit uppercase tracking-wide text-[#F5F5F5] group-hover:text-[#D4C5A1] transition-colors duration-300">
                          {item.title}
                        </h3>
                      </div>

                      <p className="text-xs text-[#8E8A80] leading-relaxed font-light line-clamp-2">
                        {item.description}
                      </p>

                      {/* Technical details link */}
                      <button 
                        onClick={() => setActiveDetailsProduct(item)}
                        className="text-[10px] text-[#D4C5A1] hover:text-[#E6DCC5] font-bold uppercase tracking-wider flex items-center space-x-1.5 pt-1 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Ficha Técnica & Medidas</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-4">
                    {/* Price */}
                    <div className="border-t border-[#D4C5A1]/10 pt-4 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#8E8A80] font-semibold">Precio Fijo</span>
                      <span className="text-lg font-bold font-outfit text-[#F5F5F5]">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-5 gap-2">
                      <button
                        onClick={() => {
                          const message = encodeURIComponent(`Hola Veta Dorada, estoy interesado en el producto ${item.title} (SKU: ${item.sku}) de precio ${formatPrice(item.price)}.`);
                          window.open(`https://wa.me/573001234567?text=${message}`, '_blank');
                        }}
                        className="col-span-2 border border-[#D4C5A1]/20 hover:border-[#D4C5A1]/60 text-[#8E8A80] hover:text-[#F5F5F5] flex items-center justify-center py-3 rounded-sm transition-all duration-300"
                        title="Preguntar por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <Link
                        href="/agendar"
                        className="col-span-3 veta-btn-gold flex items-center justify-center space-x-2 py-3 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveDetailsProduct(null)}
        >
          <div 
            className="veta-glass-card bg-[#0A0A0A] max-w-lg w-full overflow-hidden border border-[#D4C5A1]/20 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative h-56 bg-[#0F0F0F] border-b border-[#D4C5A1]/10">
              <img 
                src={activeDetailsProduct.image} 
                alt={activeDetailsProduct.title}
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setActiveDetailsProduct(null)}
                className="absolute top-4 right-4 bg-[#0A0A0A]/80 border border-[#D4C5A1]/20 text-[#8E8A80] hover:text-[#F5F5F5] w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <span className="text-xs text-[#D4C5A1] font-semibold tracking-widest uppercase">
                  Ficha de Producto (SKU: {activeDetailsProduct.sku})
                </span>
                <h3 className="text-2xl font-bold font-outfit uppercase tracking-wider text-[#F5F5F5]">
                  {activeDetailsProduct.title}
                </h3>
              </div>

              <p className="text-sm text-[#8E8A80] leading-relaxed font-light">
                {activeDetailsProduct.description}
              </p>

              {/* Dimensions specs */}
              <div className="bg-white/2 border border-[#D4C5A1]/10 p-4 rounded-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center space-x-2">
                  <Ruler className="w-3.5 h-3.5 text-[#D4C5A1]" />
                  <span>Dimensiones y Espesores</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-white/2 p-2 border border-[#D4C5A1]/5 rounded-sm">
                    <span className="block text-[10px] text-[#8E8A80] uppercase">Ancho</span>
                    <span className="font-semibold text-[#F5F5F5]">{activeDetailsProduct.ancho}</span>
                  </div>
                  <div className="bg-white/2 p-2 border border-[#D4C5A1]/5 rounded-sm">
                    <span className="block text-[10px] text-[#8E8A80] uppercase">Alto</span>
                    <span className="font-semibold text-[#F5F5F5]">{activeDetailsProduct.alto}</span>
                  </div>
                  <div className="bg-white/2 p-2 border border-[#D4C5A1]/5 rounded-sm">
                    <span className="block text-[10px] text-[#8E8A80] uppercase">Profundo</span>
                    <span className="font-semibold text-[#F5F5F5]">{activeDetailsProduct.profundo}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#D4C5A1]/10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#8E8A80] uppercase tracking-wider font-semibold">Valor Unitario</span>
                  <span className="text-xl font-bold font-outfit text-[#D4C5A1]">
                    {formatPrice(activeDetailsProduct.price)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`Hola Veta Dorada, quiero encargar el producto ${activeDetailsProduct.title} (SKU: ${activeDetailsProduct.sku}).`);
                    window.open(`https://wa.me/573001234567?text=${message}`, '_blank');
                    setActiveDetailsProduct(null);
                  }}
                  className="veta-btn-gold px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-wider"
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
