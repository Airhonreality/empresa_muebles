'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FotoGaleriaEspacio } from '@/lib/data/actions/public';

const SCROLL_PX_POR_FRAME = 0.5;

interface GaleriaEspacioScrollProps {
  fotos: FotoGaleriaEspacio[];
}

export function GaleriaEspacioScroll({ fotos }: GaleriaEspacioScrollProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reiniciarTemporizadorInactivo = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 3000);
  }, []);

  const desplazar = useCallback((px: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: px, behavior: 'smooth' });
    pausedRef.current = true;
    reiniciarTemporizadorInactivo();
  }, [reiniciarTemporizadorInactivo]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const paso = () => {
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(paso);
        return;
      }
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += SCROLL_PX_POR_FRAME;
      }
      rafRef.current = requestAnimationFrame(paso);
    };
    rafRef.current = requestAnimationFrame(paso);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [reiniciarTemporizadorInactivo]);

  const alEntrar = () => {
    pausedRef.current = true;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };
  const alSalir = () => {
    pausedRef.current = false;
  };
  const alRueda = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) > 0) {
      pausedRef.current = true;
      reiniciarTemporizadorInactivo();
    }
  }, [reiniciarTemporizadorInactivo]);

  if (fotos.length === 0) return null;

  return (
    <section className="bg-bg-alt py-24 md:py-32 border-b border-border-subtle overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 mb-12 md:mb-20">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] w-8 bg-gold-600" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 font-semibold">
            Portafolio
          </span>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-medium text-text-heading tracking-tight">
          Espacios que <span className="font-serif italic text-gold-700 font-light">creamos</span>
        </h2>
      </div>

      <div
        ref={trackRef}
        onMouseEnter={alEntrar}
        onMouseLeave={alSalir}
        onWheel={alRueda}
        className="relative flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-8 px-6 xl:px-[calc((100vw-72rem)/2+1.5rem)] pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        role="region"
        aria-label="Galería de espacios"
      >
        {fotos.slice(0, 30).map((foto, i) => {
          let aspectClass = 'aspect-[3/4] w-[75vw] md:w-[30vw]';
          if (i % 5 === 0) aspectClass = 'aspect-[16/9] w-[85vw] md:w-[50vw]';
          if (i % 5 === 2) aspectClass = 'aspect-square w-[75vw] md:w-[35vw]';
          if (i % 5 === 4) aspectClass = 'aspect-[3/2] w-[80vw] md:w-[45vw]';

          return (
            <div
              key={`${foto.url}-${i}`}
              className={`group relative flex-shrink-0 snap-center overflow-hidden bg-charcoal-950 ${aspectClass}`}
            >
              <Image
                src={foto.url}
                alt={foto.alt}
                fill
                className="object-cover opacity-90 saturate-50 group-hover:opacity-100 group-hover:saturate-100 group-hover:scale-105 transition-all duration-[1500ms] ease-out"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-charcoal-900/10 group-hover:bg-transparent transition-colors duration-700" />
              <div className="absolute bottom-6 left-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10">
                <div className="h-[1px] w-4 bg-gold-500"></div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-gold-100 bg-charcoal-950/80 px-2 py-1 backdrop-blur-sm border border-gold-500/10">
                  {foto.esRender ? 'Render 3D' : 'Proyecto Real'}
                </span>
              </div>
            </div>
          );
        })}
        <div className="flex-shrink-0 w-6 md:w-[10vw]" />

        <button
          onClick={() => desplazar(-400)}
          aria-label="Desplazar galería a la izquierda"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-white/95 border border-border-subtle text-gold-700 hover:bg-gold-600 hover:text-white transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus-ring-gold-500"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => desplazar(400)}
          aria-label="Desplazar galería a la derecha"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-white/95 border border-border-subtle text-gold-700 hover:bg-gold-600 hover:text-white transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
