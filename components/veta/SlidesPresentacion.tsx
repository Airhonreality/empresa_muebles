'use client'

import Image from 'next/image'
import type { TipoSlide } from '@/lib/data'

interface SlideProps { slide: TipoSlide }

function SlidePortadaProyecto({ slide }: { slide: Extract<TipoSlide, { tipo: 'portada_proyecto' }> }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-16 text-center">
      <p className="text-amber-400 text-sm uppercase tracking-widest font-medium">Propuesta Comercial</p>
      <h1 className="text-5xl font-bold text-white leading-tight">{slide.proyecto.nombreProyecto}</h1>
      {slide.cliente && <p className="text-white/60 text-xl">{slide.cliente.nombre}</p>}
      <p className="text-white/30 text-sm mt-8">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  )
}

function SlideEspacioPortada({ slide }: { slide: Extract<TipoSlide, { tipo: 'espacio_portada' }> }) {
  const fotoHero = slide.espacio.fotosDisenio?.[0] ?? slide.espacio.fotosEspacio?.[0] ?? null
  return (
    <div className="relative h-full flex flex-col justify-end">
      {fotoHero && (
        <Image src={fotoHero} alt={slide.espacio.nombreEspacio} fill unoptimized className="object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="relative z-10 p-12">
        <p className="text-amber-400 text-xs uppercase tracking-widest mb-2">
          {slide.indice} de {slide.total}
        </p>
        <h2 className="text-4xl font-bold text-white">{slide.espacio.nombreEspacio}</h2>
        {slide.espacio.nombreVariante && (
          <p className="text-white/60 text-lg mt-1">{slide.espacio.nombreVariante}</p>
        )}
        {slide.espacio.descripcion && (
          <p className="text-white/70 text-base mt-3 max-w-lg">{slide.espacio.descripcion}</p>
        )}
      </div>
    </div>
  )
}

function SlideEspacioGaleria({ slide }: { slide: Extract<TipoSlide, { tipo: 'espacio_galeria' }> }) {
  const fotos = slide.fotos.slice(0, 6)
  const extras = slide.fotos.length - 6
  const gridClass = fotos.length === 1 ? 'grid-cols-1' : fotos.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <div className="h-full p-6 flex flex-col gap-4">
      <h3 className="text-white/50 text-xs uppercase tracking-widest">
        {slide.espacio.nombreEspacio} — Diseño
      </h3>
      <div className={`grid ${gridClass} gap-3 flex-1`}>
        {fotos.map((url, i) => (
          <div key={i} className="relative rounded-xl overflow-hidden min-h-[160px]">
            <Image src={url} alt={`Diseño ${i + 1}`} fill unoptimized className="object-cover" />
            {i === fotos.length - 1 && extras > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{extras}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideEspacioItems({ slide }: { slide: Extract<TipoSlide, { tipo: 'espacio_items' }> }) {
  return (
    <div className="h-full p-12 flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold text-white">{slide.espacio.nombreEspacio}</h2>
        <p className="text-white/50 text-sm mt-1">Qué incluye tu proyecto</p>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
        {slide.items.map((item) => {
          const prod = item.catalogoId ? slide.catalogo.get(item.catalogoId) : undefined
          const nombre = item.nombrePersonalizado ?? prod?.descripcion ?? 'Ítem'
          const imagen = prod?.imagenUrl ?? null
          return (
            <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              {imagen ? (
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image src={imagen} alt={nombre} fill unoptimized className="object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-white/30 text-xs">—</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{nombre}</p>
                <p className="text-white/40 text-xs">{item.cantidad} {prod?.unidadMedida ?? 'und'}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
        <p className="text-white/40 text-sm">{slide.items.length} ítems incluidos</p>
        <p className="text-amber-400 text-xl font-semibold">{slide.subtotal}</p>
      </div>
    </div>
  )
}

function SlideResumenBreakdown({ slide }: { slide: Extract<TipoSlide, { tipo: 'resumen_breakdown' }> }) {
  return (
    <div className="h-full p-12 flex flex-col gap-8">
      <h2 className="text-3xl font-bold text-white">Resumen de inversión</h2>
      <div className="flex-1 flex flex-col gap-3">
        {slide.espacios.map((esp) => (
          <div key={esp.id} className="flex justify-between items-center border-b border-white/10 py-3">
            <p className="text-white text-base">{esp.nombreEspacio}</p>
            <p className="text-white/70 text-base">{slide.subtotales[esp.id] ?? '—'}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-4">
        <p className="text-white/60 text-lg">Total del proyecto</p>
        <p className="text-amber-400 text-3xl font-bold">{slide.totalGeneral}</p>
      </div>
    </div>
  )
}

function SlideCierre({ slide }: { slide: Extract<TipoSlide, { tipo: 'cierre' }> }) {
  return (
    <div className="relative h-full flex flex-col items-center justify-center gap-6 p-16 text-center">
      {slide.renderHero && (
        <>
          <Image src={slide.renderHero} alt="Render principal" fill unoptimized className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <h2 className="text-4xl font-bold text-white">¿Empezamos?</h2>
        <p className="text-white/60 text-lg max-w-md">
          Este es tu proyecto, diseñado a la medida de tus espacios y tu estilo de vida.
        </p>
        <div className="mt-6 flex gap-8 text-center">
          <div>
            <p className="text-amber-400 text-3xl font-bold">{slide.proyecto.garantiaAnios}</p>
            <p className="text-white/40 text-sm">años de garantía</p>
          </div>
          {slide.proyecto.diasEntregaEstimados && (
            <div>
              <p className="text-amber-400 text-3xl font-bold">{slide.proyecto.diasEntregaEstimados}</p>
              <p className="text-white/40 text-sm">días estimados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SlideActual({ slide }: SlideProps) {
  switch (slide.tipo) {
    case 'portada_proyecto': return <SlidePortadaProyecto slide={slide} />
    case 'espacio_portada':  return <SlideEspacioPortada slide={slide} />
    case 'espacio_galeria':  return <SlideEspacioGaleria slide={slide} />
    case 'espacio_items':    return <SlideEspacioItems slide={slide} />
    case 'resumen_breakdown': return <SlideResumenBreakdown slide={slide} />
    case 'cierre':           return <SlideCierre slide={slide} />
  }
}
