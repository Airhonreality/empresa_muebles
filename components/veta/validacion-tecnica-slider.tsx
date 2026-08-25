'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AtributoTecnico } from '@/lib/data/contracts';

const TARJETAS_POR_FOLIO = 4;

interface ValidacionTecnicaSliderProps {
  atributos: AtributoTecnico[];
}

export function ValidacionTecnicaSlider({ atributos }: ValidacionTecnicaSliderProps) {
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  const frames = useMemo(() => {
    const chunks: AtributoTecnico[][] = [];
    for (let i = 0; i < atributos.length; i += TARJETAS_POR_FOLIO) {
      chunks.push(atributos.slice(i, i + TARJETAS_POR_FOLIO));
    }
    return chunks;
  }, [atributos]);

  if (frames.length === 0) return null;

  const activeFrame = frames[activeFrameIndex] ?? frames[0];
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
        {totalFrames > 1 && (
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
        )}

        {/* Dynamic Frame Layout Stage with Zero CLS matches exactly the height of cards */}
        <div className="transition-opacity duration-500 min-h-[420px] sm:min-h-[480px]">
          <LayoutCartas atributos={activeFrame} offset={activeFrameIndex * TARJETAS_POR_FOLIO} />
        </div>
      </div>
    </section>
  );
}

{/* Layout Único: Grid de Cards Editorial (Mismo tamaño siempre, centradas) */}
function LayoutCartas({ atributos, offset }: { atributos: AtributoTecnico[]; offset: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {atributos.map((item, i) => (
        <div
          key={item.id}
          className="group relative h-[420px] sm:h-[480px] flex flex-col overflow-hidden rounded-sm bg-bg-raised border border-border-subtle hover:border-gold-500/50 transition-all duration-500 hover:-translate-y-1 shadow-md w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
        >
          {/* 85% Image Area */}
          <div className="relative h-[82%] w-full overflow-hidden">
            {item.imagenUrl && (
              <Image
                src={item.imagenUrl}
                alt={item.titulo}
                fill
                className="object-cover opacity-90 saturate-75 group-hover:opacity-100 group-hover:saturate-100 group-hover:scale-105 transition-all duration-700"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            )}
            {/* Overlay with number and badge */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="text-2xl font-bold text-gold-600 drop-shadow-sm group-hover:text-gold-500 transition-colors">
                {String(offset + i + 1).padStart(2, '0')}
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
      ))}
    </div>
  );
}
