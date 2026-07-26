'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type GalleryImage = {
  url: string;
  description?: string;
};

type VetaProjectGalleryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  images: GalleryImage[];
  materials?: string[];
  startIndex?: number;
  cta?: {
    label: string;
    onClick: () => void;
  };
};

export default function VetaProjectGallery({
  open,
  onOpenChange,
  title,
  description,
  images,
  materials,
  startIndex = 0,
  cta,
}: VetaProjectGalleryProps) {
  const [currentIdx, setCurrentIdx] = useState(startIndex);

  if (!open) return null;

  const currentImage = images[currentIdx];
  const hasMultiple = images.length > 1;

  const goPrev = () => setCurrentIdx((idx) => (idx === 0 ? images.length - 1 : idx - 1));
  const goNext = () => setCurrentIdx((idx) => (idx === images.length - 1 ? 0 : idx + 1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </button>

        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage.url}
              alt={currentImage.description || title}
              className="max-h-[55vh] w-full object-contain bg-black"
            />
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  {currentIdx + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center text-[hsl(var(--veta-text-stone))] bg-[hsl(var(--veta-bg-linen))]">
            Sin imagen disponible
          </div>
        )}

        <div className="space-y-4 p-6">
          <h3 className="veta-heading text-xl font-semibold text-[hsl(var(--veta-text-carbon))]">{title}</h3>
          {currentImage?.description && (
            <p className="text-xs text-[hsl(var(--veta-text-stone))]">{currentImage.description}</p>
          )}
          {description && (
            <p className="text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">{description}</p>
          )}
          {materials && materials.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {materials.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[hsl(var(--veta-text-stone))] border border-[hsl(var(--veta-glass-light-border))]"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
          {cta && (
            <button
              type="button"
              onClick={cta.onClick}
              className="w-full rounded-full bg-[hsl(var(--veta-gold-muted))] py-3 text-xs font-semibold uppercase tracking-wider text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))]"
            >
              {cta.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
