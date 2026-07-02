'use client'
import React, { useState, useMemo } from 'react'
import type { BlockProps } from '@agnostic/core'
import type { EspacioVariantesRecord } from '@/generated/agnostic-schemas'
import Link from 'next/link'
import VetaHeader from './VetaHeader'
import VetaFooter from './VetaFooter'
import { ArrowRight, Compass, Filter, Sparkles, Layout, Ruler, Award, AlertCircle } from 'lucide-react'

export default function VetaSpaces({ block = {}, records = [], api }: Partial<BlockProps>) {
  const [activeFilter, setActiveFilter] = useState<string>('todos')

  const typedRecords = records as unknown as EspacioVariantesRecord[]
  
  // Extract and format portfolio spaces loaded dynamically from the Database strategy
  const portfolioItems = useMemo(() => {
    // Filter records that represent public portfolio elements with a description and title
    // Filtering items with visible_pdf as a marker of portfolio status
    return typedRecords
      .filter(r => r.data?.nombre_espacio && r.data?.descripcion)
      .map((r, index) => {
        const title = r.data.nombre_espacio || 'Espacio Veta Dorada'
        const lowerTitle = title.toLowerCase()
        
        // Dynamic categorization based on domain data properties
        let category: 'cocinas' | 'cavas' | 'habitaciones' | 'consolas' = 'consolas'
        let categoryLabel = 'Mobiliario Especializado'
        
        if (lowerTitle.includes('cocina')) {
          category = 'cocinas'
          categoryLabel = 'Cocinas de Diseñador'
        } else if (lowerTitle.includes('cava') || lowerTitle.includes('bar')) {
          category = 'cavas'
          categoryLabel = 'Cavas & Bares'
        } else if (lowerTitle.includes('cama') || lowerTitle.includes('closet') || lowerTitle.includes('habita')) {
          category = 'habitaciones'
          categoryLabel = 'Dormitorios & Closets'
        }

        const images = r.data.imagenes?.split(',').map(img => img.trim()).filter(Boolean) || []
        const defaultImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'

        return {
          id: r.id || `space-item-${index}`,
          title,
          category,
          categoryLabel,
          image: defaultImage,
          description: r.data.descripcion || 'Espacio residencial exclusivo personalizado.',
          materials: r.data.colores?.split(',').map(c => c.trim()).filter(Boolean) || ['Madera Fina', 'Acabados Premium'],
          dimensions: r.data.descripcion_alternativa || 'Diseño a medida'
        }
      })
  }, [typedRecords])

  const filteredItems = useMemo(() => {
    if (activeFilter === 'todos') return portfolioItems
    return portfolioItems.filter(item => item.category === activeFilter)
  }, [activeFilter, portfolioItems])

  const filterTabs = [
    { id: 'todos', label: 'Todos los Espacios' },
    { id: 'cocinas', label: 'Cocinas' },
    { id: 'cavas', label: 'Cavas & Bares' },
    { id: 'habitaciones', label: 'Dormitorios & Closets' },
    { id: 'consolas', label: 'Consolas & Recibidores' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex flex-col selection:bg-[#D4C5A1]/30 selection:text-[#F5F5F5]">
      <VetaHeader />

      {/* Header Banner */}
      <section className="pt-20 pb-12 px-6 border-b border-[#D4C5A1]/10 bg-[#0F0F0F] relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=1800')] bg-cover bg-center opacity-5" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#D4C5A1] uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alta Carpintería Residencial</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-outfit uppercase tracking-tight text-[#F5F5F5]">
              Espacios a Medida
            </h1>
          </div>
          <p className="text-sm text-[#8E8A80] max-w-md font-light leading-relaxed">
            Cada espacio es un lienzo en blanco. Diseñamos y fabricamos a las dimensiones exactas de tu hogar, asegurando un encaje perfecto y materiales que duran toda la vida.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-6 px-6 bg-[#0E0E0E] border-b border-[#D4C5A1]/5 sticky top-20 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Filter className="w-4 h-4 text-[#D4C5A1] shrink-0" />
            <div className="flex space-x-1 whitespace-nowrap">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                    activeFilter === tab.id
                      ? 'bg-[#D4C5A1] text-[#0A0A0A]'
                      : 'text-[#8E8A80] hover:text-[#F5F5F5] hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-20 px-6 flex-grow">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#D4C5A1]/10 rounded-sm max-w-xl mx-auto space-y-4">
              <Compass className="w-8 h-8 text-[#D4C5A1]/40 mx-auto" />
              <h3 className="text-lg font-bold font-outfit text-[#F5F5F5] uppercase">No hay espacios en esta categoría</h3>
              <p className="text-xs text-[#8E8A80] max-w-xs mx-auto leading-relaxed">
                Aún no se han configurado proyectos públicos para esta sección de portafolio. ¡Agenda tu cita y comienza el tuyo!
              </p>
              <div className="pt-2">
                <Link href="/agendar" className="veta-btn-gold inline-block px-6 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider">
                  Agendar Visita
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <div 
                  key={item.id}
                  className="veta-glass-card group flex flex-col h-full overflow-hidden"
                >
                  {/* Image Container */}
                  <div className="relative h-64 overflow-hidden border-b border-[#D4C5A1]/10 bg-[#0F0F0F] shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-[#0A0A0A]/85 backdrop-blur-sm border border-[#D4C5A1]/20 px-3 py-1 rounded-sm">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4C5A1]">
                        {item.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col justify-between flex-grow space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold font-outfit uppercase tracking-wide text-[#F5F5F5]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#8E8A80] leading-relaxed font-light">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#D4C5A1]/10">
                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center space-x-1.5 text-[#8E8A80]">
                          <Ruler className="w-3.5 h-3.5 text-[#D4C5A1] shrink-0" />
                          <span className="truncate">{item.dimensions}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[#8E8A80]">
                          <Layout className="w-3.5 h-3.5 text-[#D4C5A1] shrink-0" />
                          <span className="truncate">Alta Gama</span>
                        </div>
                      </div>

                      {/* Materials tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.materials.map((m, idx) => (
                          <span 
                            key={idx} 
                            className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-sm border border-[#D4C5A1]/10 bg-white/5 text-[#8E8A80]"
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* CTA link */}
                      <div className="pt-2">
                        <Link 
                          href="/agendar"
                          className="w-full text-center block py-2.5 rounded-sm border border-[#D4C5A1]/20 text-xs font-bold uppercase tracking-wider text-[#F5F5F5] group-hover:bg-[#D4C5A1] group-hover:text-[#0A0A0A] group-hover:border-[#D4C5A1] transition-all duration-300"
                        >
                          Cotizar Espacio Similar
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-16 bg-[#0F0F0F] border-t border-[#D4C5A1]/10 text-center px-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Award className="w-8 h-8 text-[#D4C5A1] mx-auto" />
          <h3 className="text-xl font-bold font-outfit uppercase tracking-wider text-[#F5F5F5]">Diseños 100% Personalizados</h3>
          <p className="text-sm text-[#8E8A80] leading-relaxed font-light">
            ¿Tienes una idea en mente para tu cocina, dormitorio o salón? Nos encargamos de todo el proceso de punta a punta, desde el render inicial hasta la instalación final sin que te preocupes por nada.
          </p>
          <div className="pt-2">
            <Link 
              href="/agendar"
              className="text-[#D4C5A1] hover:text-[#E6DCC5] text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors duration-300"
            >
              <span>Agendar mi Asesoría en Sitio (Gratis)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <VetaFooter />
    </div>
  )
}
