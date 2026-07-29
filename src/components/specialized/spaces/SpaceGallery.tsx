'use client';

import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import type { SpaceGalleryProps } from '@/types/space-showcase';

export default function SpaceGallery({
  images,
  columns = 3,
  showCaptions = true,
  onImageClick,
}: SpaceGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  // responsive columns
  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }[columns];

  return (
    <section className="veta-section px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-2">
          <h2 className="veta-heading text-3xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))] md:text-4xl">
            Galería de proyectos
          </h2>
          <p className="text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
            Explora nuestros trabajos más recientes y descubre el nivel de detalle y personalización que ofrecemos.
          </p>
        </div>

        <div className={`grid gap-4 ${gridColsClass}`}>
          {images.map((image, idx) => (
            <figure
              key={idx}
              className="group relative overflow-hidden rounded-2xl bg-[hsl(var(--veta-bg-linen))]"
              onClick={() => onImageClick?.(image, idx)}
            >
              {/* image container */}
              <div className="relative overflow-hidden">
                {/* aspect ratio container (16:9) */}
                <div className="aspect-video overflow-hidden bg-black">
                  <img
                    src={image.imagen_url}
                    alt={image.alt_text}
                    title={image.image_title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>

                {/* overlay with zoom icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
                  <div className="transform transition-all duration-300 group-hover:scale-100 scale-75 opacity-0 group-hover:opacity-100">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* caption */}
              {showCaptions && (
                <figcaption className="space-y-2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--veta-gold-muted))]">
                    Proyecto destacado
                  </p>
                  <h3 className="veta-heading text-sm font-semibold text-[hsl(var(--veta-text-carbon))]">
                    {image.image_title}
                  </h3>
                  <p className="line-clamp-3 text-xs leading-relaxed text-[hsl(var(--veta-text-stone))]">
                    {image.descripcion}
                  </p>

                  {/* keywords */}
                  {image.keywords && image.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {image.keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-block rounded-full bg-[hsl(var(--veta-glass-light-border))] px-2.5 py-0.5 text-[10px] font-medium text-[hsl(var(--veta-text-stone))]"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </figcaption>
              )}

              {/* hover state indicator */}
              <div
                className={`absolute top-0 left-0 h-1 bg-[hsl(var(--veta-gold-muted))] transition-all duration-300 ${
                  hoveredIndex === idx ? 'w-full' : 'w-0'
                }`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </figure>
          ))}
        </div>

        {/* browse all cta */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-[hsl(var(--veta-text-stone))]">
            ¿Quieres ver más de nuestros trabajos?
          </p>
          <a
            href="/portafolio"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(var(--veta-glass-light-border))] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-all hover:border-[hsl(var(--veta-gold-muted))] hover:text-[hsl(var(--veta-gold-muted))]"
          >
            Ver galería completa →
          </a>
        </div>
      </div>
    </section>
  );
}
