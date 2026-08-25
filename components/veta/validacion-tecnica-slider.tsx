'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FrameAtributos, AtributoTecnico } from '@/lib/data/espacios-atributos';
import { HOME_IMAGES_SEO } from '@/lib/seo/home-images';

interface ValidacionTecnicaSliderProps {
  frames: FrameAtributos[];
  nombreCategoria?: string;
}

export function ValidacionTecnicaSlider({ frames, nombreCategoria = 'este espacio' }: ValidacionTecnicaSliderProps) {
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  if (!frames || frames.length === 0) return null;

  const activeFrame = frames[activeFrameIndex];
  const totalFrames = frames.length;

  const handleNext = () => {
    setActiveFrameIndex((prev) => (prev + 1) % totalFrames);
  };

  const handlePrev = () => {
    setActiveFrameIndex((prev) => (prev - 1 + totalFrames) % totalFrames);
  };

  return (
    <section className="bg-bg-paper text-text-primary py-6 lg:py-8 border-y border-border-subtle overflow-hidden relative">
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Outer Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        
        {/* Top Centered Minimalist Controls */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <button
            onClick={handlePrev}
            className="text-gold-600/50 hover:text-gold-700 transition-colors duration-300 p-1"
            aria-label="Anterior folio"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-2.5">
            {frames.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveFrameIndex(i)}
                className={`transition-all duration-500 h-[2px] rounded-full ${
                  i === activeFrameIndex ? 'w-8 bg-gold-600' : 'w-4 bg-charcoal-900/10 hover:bg-gold-600/50'
                }`}
                aria-label={`Ir al folio 0${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="text-gold-600/50 hover:text-gold-700 transition-colors duration-300 p-1"
            aria-label="Siguiente folio"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Dynamic Frame Layout Stage with Zero CLS matches exactly the height of cards */}
        <div className="transition-opacity duration-500 min-h-[420px] sm:min-h-[480px]">
          <LayoutCartas atributos={activeFrame.atributos} />
        </div>
      </div>
    </section>
  );
}

{/* Layout Único: Grid de Cards Editorial (Mismo tamaño siempre, centradas) */}
function LayoutCartas({ atributos }: { atributos: AtributoTecnico[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {atributos.map((item) => {
        const imgData = item.imageKey ? HOME_IMAGES_SEO[item.imageKey] : null;
        return (
          <div
            key={item.id}
            className="group relative h-[420px] sm:h-[480px] flex flex-col overflow-hidden rounded-sm bg-bg-raised border border-border-subtle hover:border-gold-500/50 transition-all duration-500 hover:-translate-y-1 shadow-md w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
          >
            {/* 85% Image Area */}
            <div className="relative h-[82%] w-full overflow-hidden">
              {imgData && (
                <Image
                  src={imgData.src}
                  alt={imgData.alt}
                  fill
                  className="object-cover opacity-90 saturate-75 group-hover:opacity-100 group-hover:saturate-100 group-hover:scale-105 transition-all duration-700"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              )}
              {/* Overlay with number and badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="text-2xl font-bold text-gold-600 drop-shadow-sm group-hover:text-gold-500 transition-colors">
                  {item.numero}
                </span>
                {item.badge && (
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-bg-paper/90 backdrop-blur-md text-gold-700 border border-gold-500/20 rounded-xs shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/50 via-transparent to-transparent opacity-100" />
            </div>

            {/* 15% Text Area */}
            <div className="h-[18%] w-full flex flex-col justify-center px-5 bg-bg-raised relative z-10">
              <h4 className="font-display text-base font-semibold text-text-heading mb-1 group-hover:text-gold-700 transition-colors line-clamp-1">
                {item.titulo}
              </h4>
              <p className="text-text-muted text-xs font-light line-clamp-2 leading-tight">
                {item.cuerpo}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
