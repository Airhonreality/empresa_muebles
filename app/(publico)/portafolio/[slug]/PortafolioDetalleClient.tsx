'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Portafolio } from '@/lib/data/contracts';
import Link from 'next/link';

// --- Componente: Lightbox Editorial Diamante 4 ---
function GalleryOverlay({
  imagenes,
  selectedIndex,
  onClose,
  onPrev,
  onNext,
}: {
  imagenes: Array<{ url: string; alt: string }>;
  selectedIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  if (selectedIndex < 0 || selectedIndex >= imagenes.length) return null;
  const current = imagenes[selectedIndex];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-bg-paper/98 backdrop-blur-md transition-all"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full h-full max-w-[1920px] mx-auto flex items-center justify-center p-4 lg:p-12 pointer-events-none">
        
        {/* Cierre Minimalista */}
        <button
          className="absolute top-6 right-6 lg:top-12 lg:right-12 text-text-muted hover:text-text-heading transition-colors pointer-events-auto flex items-center gap-2 group z-50 bg-bg-alt/50 backdrop-blur-md px-4 py-2 rounded-full border border-border-subtle"
          onClick={onClose}
          aria-label="Cerrar galería"
        >
          <span className="text-[10px] uppercase tracking-widest font-bold">Cerrar</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Controles de Revista (Laterales) */}
        <button
          className="absolute left-2 lg:left-12 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading transition-all pointer-events-auto p-4 hover:-translate-x-2 z-50 bg-bg-alt/50 backdrop-blur-md rounded-full border border-border-subtle"
          onClick={onPrev}
          aria-label="Anterior"
        >
          <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          className="absolute right-2 lg:right-12 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading transition-all pointer-events-auto p-4 hover:translate-x-2 z-50 bg-bg-alt/50 backdrop-blur-md rounded-full border border-border-subtle"
          onClick={onNext}
          aria-label="Siguiente"
        >
          <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* Imagen Central con Carrusel */}
        <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-auto px-16 lg:px-32 py-16">
          <Image
            src={current.url}
            alt={current.alt}
            fill
            unoptimized
            className="object-contain drop-shadow-2xl animate-in zoom-in-95 duration-300"
            priority
          />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-text-heading text-[10px] font-mono tracking-widest uppercase bg-bg-alt/50 backdrop-blur-md px-4 py-2 rounded-full border border-border-subtle">
            {selectedIndex + 1} de {imagenes.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Componente Principal: The Split Monolith Refinado ---
export function PortafolioDetalleClient({ proyecto }: { proyecto: Portafolio }) {
  
  // Deduplicación estricta de URLs
  const urlsUnicas = Array.from(new Set([
    proyecto.imagenPortafolioUrl,
    ...(proyecto.galeriaPortafolioUrl || [])
  ].filter(Boolean) as string[]));

  const imagenes = urlsUnicas.length > 0
    ? urlsUnicas.map((url, idx) => ({ url, alt: `${proyecto.titulo} - Foto ${idx + 1}` }))
    : [{ url: '/placeholder-portafolio.jpg', alt: proyecto.titulo }];

  const categoriaLabel = proyecto.categoriaEspacio?.replace(/_/g, ' ') || 'Proyecto';
  const formatTitle = (t: string) => t.toLowerCase();

  // Helper Tipográfico Mejorado: Atomización de Precio y Divisa
  const renderPrecioEditorial = (precioRaw: string) => {
    let valor = precioRaw;
    
    // Extirpamos el prefijo (se manejará en el layout)
    if (precioRaw.toLowerCase().startsWith('desde ')) {
      valor = precioRaw.substring(6).trim();
    }

    // Extirpamos el sufijo COP para atomizarlo
    let sufijo = '';
    if (valor.toLowerCase().endsWith(' cop')) {
      sufijo = 'COP';
      valor = valor.substring(0, valor.length - 4).trim();
    }

    return (
      <div className="flex items-baseline gap-2 mt-1 min-w-0 flex-wrap">
        <span className="font-display text-lg sm:text-xl lg:text-2xl xl:text-3xl text-gold-700 leading-none tracking-tight break-words">{valor}</span>
        {sufijo && <span className="text-[10px] lg:text-xs font-mono text-gold-700/60 uppercase tracking-widest">{sufijo}</span>}
      </div>
    );
  };

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const handleOpenOverlay = (index: number) => {
    setSelectedIndex(index);
    setIsOverlayOpen(true);
  };

  const handleCloseOverlay = useCallback(() => setIsOverlayOpen(false), []);
  const handlePrev = useCallback(
    () => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : imagenes.length - 1)),
    [imagenes.length],
  );
  const handleNext = useCallback(
    () => setSelectedIndex((prev) => (prev < imagenes.length - 1 ? prev + 1 : 0)),
    [imagenes.length],
  );

  return (
    <div className="bg-bg-paper selection:bg-gold-500 selection:text-white relative min-h-screen">
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto items-stretch border-t border-border-subtle">
        
        {/* =========================================
            MÓDULO IZQUIERDO: TEXTO COMPACTO
            ========================================= */}
        <aside className="w-full lg:w-[30%] xl:w-[25%] bg-bg-paper border-r border-border-subtle lg:sticky lg:top-16 lg:h-[calc(100dvh-64px)] overflow-y-auto no-scrollbar flex flex-col">
          
          {/* Bloque 1: Cabecera y Título Compacto */}
          <div className="p-8 lg:p-10 border-b border-border-subtle flex flex-col gap-6 bg-bg-alt/30">
            <Link 
              href="/portafolio" 
              className="text-[10px] uppercase tracking-widest text-text-muted hover:text-text-heading transition-colors font-bold flex items-center gap-2 w-fit"
            >
              ← Regresar
            </Link>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold flex items-center gap-3">
                <span>{categoriaLabel}</span>
                {proyecto.destacado && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gold-500"></span>
                    <span className="text-gold-600">Destacada</span>
                  </>
                )}
              </p>
              <h1 className="font-display text-2xl lg:text-3xl xl:text-4xl font-semibold text-text-heading capitalize leading-tight tracking-tight">
                {formatTitle(proyecto.titulo)}
              </h1>
            </div>
          </div>

          {/* Bloque 2: Narrativa Compacta */}
          <div className="p-8 lg:p-10">
             <h3 className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-4 flex items-center gap-3">
               <span className="w-4 h-[1px] bg-border-strong"></span>
               El Concepto
             </h3>
             <div className="text-text-primary font-normal leading-relaxed text-sm tracking-wide">
              {proyecto.descripcionComercial ? (
                <p className="whitespace-pre-wrap">{proyecto.descripcionComercial}</p>
              ) : (
                <p>Proyecto arquitectónico fabricado a la medida. Un ejercicio de proporción, selección de maderas y precisión en la instalación final.</p>
              )}
            </div>
          </div>
        </aside>

        {/* =========================================
            MÓDULO DERECHO: GALERÍA MASONRY + FICHA TÉCNICA
            ========================================= */}
        <main className="w-full lg:w-[70%] xl:w-[75%] bg-bg-paper p-6 lg:p-10 xl:p-16 flex flex-col">
          
          {/* GALERÍA MASONRY */}
          <div>
            <div className="mb-8 flex items-center justify-between">
               <h2 className="text-lg font-display text-text-heading">Registro Fotográfico</h2>
               <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{imagenes.length} Capturas</span>
            </div>

            <div className="columns-1 sm:columns-2 xl:columns-3 gap-6 space-y-6">
              {imagenes.map((img, idx) => (
                <div 
                  key={idx} 
                  className="break-inside-avoid relative group cursor-zoom-in overflow-hidden rounded-sm bg-bg-alt ring-1 ring-border-subtle"
                  onClick={() => handleOpenOverlay(idx)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- grid masonry: next/image exige dimensión fija y el CSS de columnas depende de la altura natural */}
                  <img 
                    src={img.url} 
                    alt={img.alt} 
                    className="w-full h-auto object-cover saturate-[0.85] group-hover:saturate-100 transition-all duration-700 group-hover:scale-[1.03]"
                    loading={idx < 4 ? "eager" : "lazy"}
                    fetchPriority={idx === 0 ? "high" : "auto"}
                  />
                  <div className="absolute inset-0 bg-charcoal-900/0 group-hover:bg-charcoal-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300 pointer-events-none">
                    <div className="bg-bg-paper/80 backdrop-blur-sm p-3 rounded-full text-text-heading shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FICHA TÉCNICA MOVIDA DEBAJO DE LA GALERÍA (Balanceada) */}
          <div className="mt-16 lg:mt-24 border-t border-border-subtle pt-12 lg:pt-16">
            <h3 className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-8 flex items-center gap-3">
               <span className="w-4 h-[1px] bg-border-strong"></span>
               Ficha Técnica y Especificaciones
            </h3>
            
            <dl className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-5 bg-bg-alt/30 p-8 lg:p-12 border border-border-subtle rounded-sm overflow-hidden">

              {/* Columna 1: Ubicación (Ocupa 1) */}
              {proyecto.barrio && (
                <div className="lg:col-span-1 min-w-0 pr-6 flex flex-col justify-start">
                  <dt className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-3">Ubicación</dt>
                  <dd className="text-sm text-text-heading font-medium leading-relaxed">{proyecto.barrio}</dd>
                </div>
              )}

              {/* Columna 2: Intervención (Ocupa 1) */}
              {proyecto.tipoProyecto && (
                <div className="lg:col-span-1 min-w-0 sm:pl-6 sm:border-l border-border-subtle flex flex-col justify-start">
                  <dt className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-3">Intervención</dt>
                  <dd className="text-sm text-text-heading font-medium capitalize leading-relaxed">{proyecto.tipoProyecto.replace(/_/g, ' ')}</dd>
                </div>
              )}

              {/* Columna 3: Materialidad (Ocupa 2 espacios para equilibrar el texto denso) */}
              {proyecto.materialesDestacados && proyecto.materialesDestacados.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-2 min-w-0 lg:pl-8 lg:border-l border-border-subtle flex flex-col justify-start">
                  <dt className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-3">Materialidad</dt>
                  <dd className="text-sm text-text-heading font-medium leading-relaxed">
                    {proyecto.materialesDestacados.join(', ')}
                  </dd>
                </div>
              )}

              {/* Columna 4: Precio (Ocupa 1) */}
              {proyecto.precioReferencial && (
                <div className="sm:col-span-2 lg:col-span-1 min-w-0 pt-8 sm:pt-0 lg:pl-8 lg:border-l border-border-subtle flex flex-col justify-center">
                  <dt className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">
                    {proyecto.precioReferencial.toLowerCase().startsWith('desde ') ? 'Inversión Base' : 'Inversión Referencial'}
                  </dt>
                  <dd>
                    {renderPrecioEditorial(proyecto.precioReferencial)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* CTA FINAL DEBAJO DE LA FICHA TÉCNICA */}
          <div className="mt-12 flex items-center justify-between">
            <Link 
              href="https://wa.me/573025922101?text=Hola%2C%20estuve%20revisando%20el%20portafolio%20Veta%20Dorada%20y%20quiero%20iniciar%20un%20proyecto." 
              target="_blank"
              className="inline-flex justify-center items-center px-6 py-3 border border-text-heading text-text-heading uppercase text-[10px] tracking-widest font-bold rounded-sm hover:bg-text-heading hover:text-bg-paper transition-colors"
            >
              Agendar Asesoría
            </Link>
          </div>

        </main>
      </div>

    </div>
  );
}
