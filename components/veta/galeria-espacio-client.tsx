'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FotoGaleriaEspacio } from '@/lib/data/actions/public';

// Desplazamiento automático lento: ~22 px por segundo, independiente de los FPS.
const VELOCIDAD_PX_POR_SEG = 22;
// Tiempo sin interacción antes de reanudar tras rueda, toque o flecha.
const REANUDAR_TRAS_MS = 3000;
// Paso de cada flecha en píxeles.
const PASO_FLECHA_PX = 420;

interface GaleriaEspacioScrollProps {
  fotos: FotoGaleriaEspacio[];
}

export function GaleriaEspacioScroll({ fotos }: GaleriaEspacioScrollProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Posición propia con decimales: scrollLeft redondea y el avance lento se perdería.
  const posRef = useRef(0);
  // Motivos independientes de pausa: el cursor encima, interacción reciente o galería fuera de pantalla.
  const pausa = useRef({ hover: false, interaccion: false, fueraDePantalla: false });
  const timerInteraccion = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reducirMovimiento, setReducirMovimiento] = useState(false);

  const estaPausado = () => {
    const p = pausa.current;
    return p.hover || p.interaccion || p.fueraDePantalla;
  };

  // Marca una interacción del usuario: pausa y reanuda tras un tiempo sin actividad.
  const marcarInteraccion = useCallback(() => {
    pausa.current.interaccion = true;
    if (timerInteraccion.current) clearTimeout(timerInteraccion.current);
    timerInteraccion.current = setTimeout(() => {
      pausa.current.interaccion = false;
    }, REANUDAR_TRAS_MS);
  }, []);

  // Preferencia de movimiento reducido del sistema.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducirMovimiento(mq.matches);
    const alCambiar = (e: MediaQueryListEvent) => setReducirMovimiento(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  // Pausa cuando la galería no está visible en pantalla.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observador = new IntersectionObserver(([entrada]) => {
      pausa.current.fueraDePantalla = !entrada.isIntersecting;
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Bucle de desplazamiento automático.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || reducirMovimiento) return undefined;

    let frame = 0;
    let ultimo = performance.now();
    posRef.current = el.scrollLeft;

    const paso = (ahora: number) => {
      const dt = Math.min(ahora - ultimo, 100); // limita el salto si la pestaña estuvo en segundo plano
      ultimo = ahora;
      if (!estaPausado()) {
        posRef.current += (VELOCIDAD_PX_POR_SEG * dt) / 1000;
        const maximo = el.scrollWidth - el.clientWidth;
        if (posRef.current >= maximo) posRef.current = 0;
        el.scrollLeft = posRef.current;
      }
      frame = requestAnimationFrame(paso);
    };

    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [reducirMovimiento]);

  // Si el usuario mueve la galería a mano (rueda, toque, flecha), la posición propia se alinea con la real.
  const alDesplazar = () => {
    const el = trackRef.current;
    if (el && estaPausado()) posRef.current = el.scrollLeft;
  };

  const desplazar = (px: number) => {
    const el = trackRef.current;
    if (!el) return;
    marcarInteraccion();
    posRef.current = el.scrollLeft;
    el.scrollBy({ left: px, behavior: 'smooth' });
  };

  const alEntrarCursor = () => {
    pausa.current.hover = true;
  };
  const alSalirCursor = () => {
    pausa.current.hover = false;
  };
  const alRueda = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) > 0) marcarInteraccion();
  };
  const alTocar = () => {
    pausa.current.interaccion = true;
    if (timerInteraccion.current) clearTimeout(timerInteraccion.current);
  };
  const alSoltarToque = () => {
    marcarInteraccion();
  };

  useEffect(() => {
    return () => {
      if (timerInteraccion.current) clearTimeout(timerInteraccion.current);
    };
  }, []);

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

      {/* Contenedor no desplazable: las flechas quedan fijas sobre la galería. */}
      <div className="relative">
        <div
          ref={trackRef}
          onMouseEnter={alEntrarCursor}
          onMouseLeave={alSalirCursor}
          onWheel={alRueda}
          onTouchStart={alTocar}
          onTouchEnd={alSoltarToque}
          onScroll={alDesplazar}
          className="flex overflow-x-auto gap-4 md:gap-8 px-6 xl:px-[calc((100vw-72rem)/2+1.5rem)] pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          role="region"
          aria-label="Galería de espacios"
          tabIndex={0}
        >
          {fotos.slice(0, 30).map((foto, i) => {
            let aspectClass = 'aspect-[3/4] w-[75vw] md:w-[30vw]';
            if (i % 5 === 0) aspectClass = 'aspect-[16/9] w-[85vw] md:w-[50vw]';
            if (i % 5 === 2) aspectClass = 'aspect-square w-[75vw] md:w-[35vw]';
            if (i % 5 === 4) aspectClass = 'aspect-[3/2] w-[80vw] md:w-[45vw]';

            return (
              <div
                key={`${foto.url}-${i}`}
                className={`group relative flex-shrink-0 overflow-hidden bg-charcoal-950 ${aspectClass}`}
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
        </div>

        <button
          type="button"
          onClick={() => desplazar(-PASO_FLECHA_PX)}
          aria-label="Desplazar galería a la izquierda"
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-white/95 border border-border-subtle text-gold-700 hover:bg-gold-600 hover:text-white transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => desplazar(PASO_FLECHA_PX)}
          aria-label="Desplazar galería a la derecha"
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-white/95 border border-border-subtle text-gold-700 hover:bg-gold-600 hover:text-white transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
