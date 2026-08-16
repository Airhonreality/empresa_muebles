'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryImage {
  url: string;
  alt: string;
  id: string;
}

interface GalleryHeroProps {
  imagen: GalleryImage;
  metadata?: { ubicacion?: string; fecha?: string; espacio?: string };
  onClick: () => void;
  dataModelo3d?: string | null;
}

export function GalleryHero({ imagen, metadata, onClick, dataModelo3d }: GalleryHeroProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-6 w-full">
      <button
        type="button"
        onClick={onClick}
        className="relative w-full aspect-[16/9] rounded-sm overflow-hidden bg-bg-paper group cursor-zoom-in block"
        data-modelo-3d={dataModelo3d ?? undefined}
        aria-label={`Ver imagen ampliada: ${imagen.alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagen.url}
          alt={imagen.alt}
          className="w-full h-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
          fetchPriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--dur-base)]" />
      </button>
      {metadata && (metadata.ubicacion || metadata.fecha || metadata.espacio) && (
        <figcaption className="mt-3 text-sm font-sans text-text-muted">
          {metadata.espacio && <span>{metadata.espacio}</span>}
          {metadata.espacio && metadata.ubicacion && <span> · </span>}
          {metadata.ubicacion && <span>{metadata.ubicacion}</span>}
          {(metadata.espacio || metadata.ubicacion) && metadata.fecha && <span> · </span>}
          {metadata.fecha && <span>{metadata.fecha}</span>}
        </figcaption>
      )}
    </div>
  );
}

interface GalleryFilmstripProps {
  imagenes: GalleryImage[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function GalleryFilmstrip({ imagenes, selectedId, onSelect }: GalleryFilmstripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (imagenes.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-10 w-full">
      <div
        ref={scrollRef}
        className="flex flex-row gap-2 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-1"
        role="tablist"
        aria-label="Galería de imágenes del proyecto"
      >
        {imagenes.map((img) => (
          <button
            key={img.id}
            type="button"
            role="tab"
            aria-selected={img.id === selectedId}
            aria-label={img.alt}
            onClick={() => onSelect(img.id)}
            className={`
              flex-none w-28 h-20 md:w-[120px] md:h-[80px] rounded-sm overflow-hidden snap-start
              transition-all duration-[var(--dur-base)] ease-[var(--ease-out)]
              cursor-pointer border-2
              ${img.id === selectedId
                ? 'border-border-brand shadow-md'
                : 'border-transparent hover:border-border-subtle hover:scale-[1.05]'
              }
            `}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

interface GalleryOverlayProps {
  imagenes: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

export function GalleryOverlay({ imagenes, initialIndex, onClose }: GalleryOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const current = imagenes[currentIndex];

  const goNext = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((i) => (i + 1) % imagenes.length);
  }, [imagenes.length]);

  const goPrev = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((i) => (i - 1 + imagenes.length) % imagenes.length);
  }, [imagenes.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  if (!current) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Galería de imágenes"
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar galería"
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-[var(--dur-quick)]"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Previous arrow */}
      {imagenes.length > 1 && (
        <button
          type="button"
          onClick={goPrev}
          aria-label="Imagen anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-[var(--dur-quick)]"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Main image */}
      <button
        type="button"
        onClick={() => setIsZoomed((z) => !z)}
        className={`
          max-w-[90vw] max-h-[85vh] cursor-zoom-out rounded-sm overflow-hidden
          transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]
          ${isZoomed ? 'scale-150' : 'scale-100'}
        `}
        aria-label={isZoomed ? "Reducir imagen" : "Ampliar imagen"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt}
          className="max-w-full max-h-[85vh] object-contain"
        />
      </button>

      {/* Next arrow */}
      {imagenes.length > 1 && (
        <button
          type="button"
          onClick={goNext}
          aria-label="Imagen siguiente"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-[var(--dur-quick)]"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Counter */}
      {imagenes.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-sans">
          {currentIndex + 1} / {imagenes.length}
        </div>
      )}
    </div>
  );
}

interface Modelo3dPlaceholderProps {
  className?: string;
}

export function Modelo3dPlaceholder({ className }: Modelo3dPlaceholderProps) {
  return (
    <button
      type="button"
      disabled
      data-modelo-3d="pending"
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-sm
        border border-border-subtle bg-bg-raised text-text-muted text-sm
        cursor-not-allowed opacity-60
        ${className ?? ''}
      `}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
      </svg>
      Ver en 3D (próximamente)
    </button>
  );
}
