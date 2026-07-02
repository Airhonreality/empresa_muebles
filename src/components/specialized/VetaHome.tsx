'use client'
import React from 'react'
import type { BlockProps } from '@agnostic/core'
import Link from 'next/link'
import VetaHeader from './VetaHeader'
import VetaFooter from './VetaFooter'
import { ArrowRight, Compass, Layers, Calendar, Award, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function VetaHome({ block = {}, records, api }: Partial<BlockProps>) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex flex-col selection:bg-[#D4C5A1]/30 selection:text-[#F5F5F5]">
      <VetaHeader />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 px-6 overflow-hidden">
        {/* Background image backdrop with strong gold/dark overlays */}
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1800')] bg-cover bg-center opacity-30 scale-105 transform motion-safe:animate-[pulse_10s_infinite]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-[#0A0A0A]/50 z-0" />
        
        {/* Ambient warm light glow */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#D4C5A1]/10 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#D4C5A1]/20 bg-[#D4C5A1]/5 text-xs font-semibold tracking-[0.2em] uppercase text-[#D4C5A1]">
            <Award className="w-3..5 h-3.5" />
            <span>Mobiliario & Espacios de Colección</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-outfit uppercase tracking-tight leading-[1.1] text-[#F5F5F5] max-w-4xl mx-auto">
            La ilusión del espacio <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4C5A1] via-[#E6DCC5] to-[#D4C5A1]">perfecto</span>, hecho realidad
          </h1>

          <p className="text-base md:text-xl text-[#8E8A80] max-w-2xl mx-auto font-light leading-relaxed">
            Estudio de diseño residencial de alta gama. Fusionamos arquitectura integral a la medida con colecciones de catálogo a precios fijos, elaboradas en maderas finas y metales nobles.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/agendar"
              className="veta-btn-gold w-full sm:w-auto px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2.5 transition-all duration-300"
            >
              <span>Diseñar Mi Espacio (Gratis)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/colecciones"
              className="w-full sm:w-auto px-8 py-4 rounded-sm border border-[#D4C5A1]/20 text-xs font-bold uppercase tracking-widest text-[#F5F5F5] hover:bg-white/5 hover:border-[#D4C5A1]/60 transition-all duration-300 flex items-center justify-center"
            >
              Ver Colecciones
            </Link>
          </div>
        </div>

        {/* Floating details banner */}
        <div className="absolute bottom-8 left-0 right-0 hidden lg:flex items-center justify-center">
          <div className="veta-glass-card px-10 py-5 flex space-x-12 max-w-4xl border border-[#D4C5A1]/10">
            <div className="text-center">
              <span className="block text-2xl font-bold font-outfit text-[#D4C5A1]">100%</span>
              <span className="text-[10px] uppercase tracking-wider text-[#8E8A80]">Madera Premium</span>
            </div>
            <div className="w-[1px] bg-[#D4C5A1]/10" />
            <div className="text-center">
              <span className="block text-2xl font-bold font-outfit text-[#D4C5A1]">0%</span>
              <span className="text-[10px] uppercase tracking-wider text-[#8E8A80]">Garantía de Fracaso</span>
            </div>
            <div className="w-[1px] bg-[#D4C5A1]/10" />
            <div className="text-center">
              <span className="block text-2xl font-bold font-outfit text-[#D4C5A1]">24/7</span>
              <span className="text-[10px] uppercase tracking-wider text-[#8E8A80]">Asesoría Exclusiva</span>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso Comercial Section */}
      <section className="py-24 bg-[#0F0F0F] border-t border-b border-[#D4C5A1]/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-xs font-bold tracking-[0.25em] text-[#D4C5A1] uppercase">Metodología de Trabajo</span>
            <h2 className="text-3xl md:text-5xl font-bold font-outfit uppercase tracking-tight text-[#F5F5F5]">
              Cómo construimos tu sueño
            </h2>
            <div className="w-16 h-0.5 bg-[#D4C5A1] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="veta-glass-card p-10 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-4xl md:text-5xl font-bold font-outfit text-[#D4C5A1]/20 block">01</span>
                <h3 className="text-xl font-bold font-outfit uppercase tracking-wider text-[#F5F5F5]">
                  Asesoría y Visita Presencial
                </h3>
                <p className="text-sm leading-relaxed text-[#8E8A80]">
                  Agendamos una visita a tu domicilio sin ningún costo. Escuchamos tus ideas, analizamos el espacio y tomamos dimensiones de precisión milimétrica.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-[#D4C5A1] pt-4">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Gratis en Sitio</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="veta-glass-card p-10 space-y-6 flex flex-col justify-between border-[#D4C5A1]/30 bg-[#D4C5A1]/5">
              <div className="space-y-4">
                <span className="text-4xl md:text-5xl font-bold font-outfit text-[#D4C5A1]/40 block">02</span>
                <h3 className="text-xl font-bold font-outfit uppercase tracking-wider text-[#F5F5F5]">
                  Modelado 3D y Renderizado
                </h3>
                <p className="text-sm leading-relaxed text-[#8E8A80]">
                  Desarrollamos el diseño virtual en render fotorrealista. Visualizas materiales, colores e iluminación exactos. Se cobra el render y se reembolsa en tu orden de compra.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-[#D4C5A1] pt-4">
                <CheckCircle2 className="w-4 h-4" />
                <span>Descontable de tu Proyecto</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="veta-glass-card p-10 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-4xl md:text-5xl font-bold font-outfit text-[#D4C5A1]/20 block">03</span>
                <h3 className="text-xl font-bold font-outfit uppercase tracking-wider text-[#F5F5F5]">
                  Fabricación e Instalación
                </h3>
                <p className="text-sm leading-relaxed text-[#8E8A80]">
                  Nuestros artesanos fabrican las piezas y ensamblan con herrajes importados. Llevamos a cabo la instalación final con un equipo experto en pulcritud y acabados.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-[#D4C5A1] pt-4">
                <CheckCircle2 className="w-4 h-4" />
                <span>Llave en Mano con Garantía</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Espacios Destacados Pitch */}
      <section className="py-24 bg-[#0A0A0A] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold tracking-[0.25em] text-[#D4C5A1] uppercase">Espacios de Ultra-Lujo</span>
              <h2 className="text-3xl md:text-5xl font-bold font-outfit uppercase tracking-tight text-[#F5F5F5]">
                Diseños Integrales
              </h2>
            </div>
            <Link 
              href="/espacios-a-medida" 
              className="text-[#D4C5A1] hover:text-[#E6DCC5] text-sm uppercase tracking-widest font-semibold flex items-center space-x-2 transition-colors duration-300"
            >
              <span>Ver Portafolio Completo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cocinas */}
            <div className="group relative h-[450px] rounded-lg overflow-hidden border border-[#D4C5A1]/10 flex flex-col justify-end p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent z-0" />
              <div className="relative z-10 space-y-4">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4C5A1] block">Espacio Insignia</span>
                <h3 className="text-2xl md:text-3xl font-bold font-outfit uppercase text-[#F5F5F5]">Cocinas de Diseñador</h3>
                <p className="text-[#8E8A80] text-sm max-w-md font-light leading-relaxed">
                  Mesones sinterizados de última generación, acabados pulidos al aceite y sistemas de almacenamiento inteligentes.
                </p>
                <Link href="/espacios-a-medida" className="inline-flex items-center space-x-2 text-xs uppercase font-bold text-[#F5F5F5] group-hover:text-[#D4C5A1] transition-colors duration-300 pt-2">
                  <span>Conocer más</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Cavas */}
            <div className="group relative h-[450px] rounded-lg overflow-hidden border border-[#D4C5A1]/10 flex flex-col justify-end p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent z-0" />
              <div className="relative z-10 space-y-4">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4C5A1] block">Estilo & Sofisticación</span>
                <h3 className="text-2xl md:text-3xl font-bold font-outfit uppercase text-[#F5F5F5]">Cavas & Bares Privados</h3>
                <p className="text-[#8E8A80] text-sm max-w-md font-light leading-relaxed">
                  Espacios de exhibición con copero y control térmico integrados, fabricados en maderas nobles para el sommelier moderno.
                </p>
                <Link href="/espacios-a-medida" className="inline-flex items-center space-x-2 text-xs uppercase font-bold text-[#F5F5F5] group-hover:text-[#D4C5A1] transition-colors duration-300 pt-2">
                  <span>Conocer más</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-b from-[#0A0A0A] to-[#0F0F0F] relative border-t border-[#D4C5A1]/5">
        <div className="max-w-4xl mx-auto text-center px-6 space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit uppercase text-[#F5F5F5]">
            Hagamos que tu hogar sea inolvidable
          </h2>
          <p className="text-base text-[#8E8A80] max-w-2xl mx-auto font-light leading-relaxed">
            Reserva una asesoría de diseño personalizada hoy mismo. Nuestro equipo de arquitectos y diseñadores estará encantado de ayudarte a estructurar tu visión.
          </p>
          <div className="pt-4">
            <Link
              href="/agendar"
              className="veta-btn-gold inline-flex items-center space-x-3 px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest"
            >
              <span>Agendar Visita Gratuita</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <VetaFooter />
    </div>
  )
}
