'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDataStore } from '@/lib/data';

export default function PortafolioPage() {
  const store = useDataStore();
  const proyectos = store.portafolio.publicados();
  
  const [hoveredProyectoId, setHoveredProyectoId] = useState<string | null>(
    proyectos.length > 0 ? proyectos[0].id : null
  );

  // Referencia para el contenedor de Scroll Manual Infinito
  const scrollRef = useRef<HTMLDivElement>(null);

  // Truco mágico para scroll loop infinito
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight } = scrollRef.current;
    
    // Al duplicar el array, la mitad del scrollHeight es exactamente el array original
    const mitad = scrollHeight / 2;
    
    // Si pasamos de la mitad, saltamos silenciosamente a la primera copia
    if (scrollTop >= mitad) {
      scrollRef.current.scrollTop = scrollTop - mitad;
    } 
    // Si tocamos el techo, saltamos a la segunda copia
    else if (scrollTop <= 0) {
      scrollRef.current.scrollTop = mitad;
    }
  };

  // Posicionar a la mitad inicialmente para permitir scroll infinito hacia arriba de inmediato
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 10; 
    }
  }, []);

  const activeProyecto = proyectos.find((p) => p.id === hoveredProyectoId) || proyectos[0];
  const activeImage = activeProyecto?.imagenPortafolioUrl || activeProyecto?.galeriaPortafolioUrl?.[0] || '';

  if (proyectos.length === 0) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-bg-paper flex items-center justify-center">
        <p className="text-text-muted text-xl font-light">No hay proyectos publicados.</p>
      </div>
    );
  }

  const formatTitle = (title: string) => title.toLowerCase();

  return (
    <div className="bg-bg-paper min-h-[calc(100vh-80px)] w-full">
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mask-vertical {
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }
      `}} />

      {/* ========================================================
          LAYOUT DESKTOP (Índice Tipográfico Claro) 
          ======================================================== */}
      <div className="hidden lg:flex h-[calc(100vh-80px)] w-full overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: Índice Tipográfico */}
        <div className="relative z-10 w-[60%] flex flex-col h-full">
          
          {/* HEADER FIJO (Contenido Comercial) */}
          <header className="px-16 pt-20 pb-8 z-20 flex-shrink-0">
            <p className="text-xs tracking-widest text-gold-600 uppercase font-bold mb-4">Portafolio Veta Dorada</p>
            <h1 className="font-display text-5xl lg:text-6xl font-semibold tracking-tighter text-text-heading mb-4 leading-none">
              Proyectos<br />realizados.
            </h1>
            <p className="text-text-muted text-base max-w-sm font-light leading-relaxed">
              Una selección de obras recientes en carpintería arquitectónica y mobiliario a la medida.
            </p>
          </header>

          {/* CUADRO DE CRONOS (Lista con Scroll Manual Infinito/Loop) */}
          <div className="flex-1 overflow-hidden relative mask-vertical px-16 pb-10">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto no-scrollbar relative"
            >
              <div className="flex flex-col">
                {/* Duplicamos el array de proyectos para engañar al navegador y crear el loop */}
                {[...proyectos, ...proyectos].map((proyecto, globalIndex) => {
                  const index = globalIndex % proyectos.length;
                  const uniqueKey = `${proyecto.id}-${globalIndex}`;
                  const isHovered = hoveredProyectoId === proyecto.id;

                  return (
                    <Link 
                      key={uniqueKey} 
                      href={`/portafolio/${proyecto.slug}`}
                      className="group flex items-start gap-4 cursor-pointer py-4"
                      onMouseEnter={() => setHoveredProyectoId(proyecto.id)}
                    >
                      <span className={`font-mono text-sm pt-2 transition-colors duration-500 ${isHovered ? 'text-gold-500' : 'text-border-strong'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      
                      <div className="flex flex-col flex-1 min-w-0 pr-4">
                        <h2 className={`font-display text-2xl lg:text-3xl font-medium capitalize truncate transition-all duration-500 origin-left ${isHovered ? 'text-text-heading scale-100 translate-x-2' : 'text-text-muted scale-95'}`}>
                          {formatTitle(proyecto.titulo)}
                        </h2>
                        
                        <div className={`overflow-hidden transition-all duration-500 ${isHovered ? 'max-h-20 mt-3 opacity-100 translate-x-2' : 'max-h-0 opacity-0 translate-x-0'}`}>
                           <p className="text-text-muted text-sm tracking-wide capitalize flex items-center">
                             <span className="text-gold-600 font-medium">{proyecto.categoriaEspacio?.toLowerCase() || 'proyecto'}</span>
                             <span className="mx-3 text-border-strong">•</span> 
                             <span className="underline decoration-border-subtle underline-offset-4 hover:decoration-gold-500 transition-colors">Ver galería de obra</span>
                           </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: La Obra Enmarcada */}
        <div className="relative z-10 w-[40%] flex items-center justify-center bg-bg-alt/50 border-l border-border-subtle pointer-events-none p-12 lg:p-20">
            {activeImage ? (
              <div key={activeProyecto.id} className="relative w-full aspect-[4/5] rounded-sm overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-700 bg-bg-raised">
                 <Image 
                    src={activeImage} 
                    alt={activeProyecto?.titulo || 'Proyecto'}
                    fill
                    className="object-cover saturate-50 contrast-[1.1] transition-all duration-1000 ease-out"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                 />
              </div>
            ) : (
              <div className="relative w-full aspect-[4/5] rounded-sm bg-bg-raised border border-border-subtle flex items-center justify-center">
                 <span className="font-display text-text-muted uppercase tracking-widest text-sm">En Obra</span>
              </div>
            )}
        </div>
      </div>

      {/* ========================================================
          LAYOUT MÓVIL (Fullscreen Snap Inmersivo Oscuro)
          ======================================================== */}
      <div className="lg:hidden h-[calc(100dvh-80px)] overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar">
        <div className="absolute top-24 left-0 right-0 z-20 flex justify-center pointer-events-none opacity-50 animate-pulse">
          <span className="text-[10px] text-charcoal-900 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full backdrop-blur-md">
            Desliza para explorar ↓
          </span>
        </div>

        {proyectos.map((proyecto, index) => {
          const mainImg = proyecto.imagenPortafolioUrl || proyecto.galeriaPortafolioUrl?.[0];
          return (
            <Link 
              key={proyecto.id}
              href={`/portafolio/${proyecto.slug}`}
              className="relative flex flex-col items-center justify-end w-full h-full snap-start snap-always"
            >
              {/* Imagen Fullscreen */}
              <div className="absolute inset-0 z-0 bg-charcoal-900">
                {mainImg && (
                  <Image 
                    src={mainImg}
                    alt={proyecto.titulo}
                    fill
                    className="object-cover saturate-50"
                    sizes="100vw"
                  />
                )}
                {/* Doble gradiente para asegurar lectura de textos */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/30 to-transparent" />
              </div>

              {/* Contenido (Placa flotante) */}
              <div className="relative z-10 w-full p-6 pb-12 flex flex-col">
                <span className="text-gold-500 text-xs font-bold tracking-widest uppercase mb-3">
                  Vol. {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white capitalize mb-4 leading-tight drop-shadow-md truncate">
                  {formatTitle(proyecto.titulo)}
                </h2>
                <div className="flex items-center text-sm text-gold-100/90 capitalize">
                  <span className="font-medium">{proyecto.categoriaEspacio?.toLowerCase() || 'Proyecto'}</span>
                  <span className="mx-3 text-white/30">•</span>
                  <span className="border-b border-gold-500/50 pb-0.5">Explorar proyecto</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}