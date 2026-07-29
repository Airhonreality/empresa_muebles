'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, MapPin } from 'lucide-react';
import type { SpaceShowcaseHeroProps } from '@/types/space-showcase';

export default function SpaceShowcaseHero({
  title,
  subtitle,
  description,
  images,
  ctaConfig,
  breadcrumbs,
}: SpaceShowcaseHeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const currentImage = useMemo(() => {
    return images[currentImageIndex] || images[0];
  }, [currentImageIndex, images]);

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const whatsappLink =
    ctaConfig?.whatsappLink || 'https://wa.me/573017604530?text=Hola+Veta+Dorada';
  const primaryLabel = ctaConfig?.primaryLabel || 'Consultar disponibilidad';

  return (
    <section className="relative isolate overflow-hidden bg-black">
      {/* hero image */}
      {currentImage?.imagen_url && (
        <img
          src={currentImage.imagen_url}
          alt={currentImage.alt_text}
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-300"
          fetchPriority="high"
        />
      )}

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/70" />

      {/* navigation dots */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentImageIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentImageIndex
                  ? 'w-8 bg-[hsl(var(--veta-gold-muted))]'
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* prev/next buttons */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-all hover:bg-white/40 lg:left-8"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-all hover:bg-white/40 lg:right-8"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* content */}
      <div className="relative flex min-h-[60vh] w-full flex-col">
        {/* breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className="flex items-center gap-2 px-4 py-4 text-xs text-white/70 sm:px-6 lg:px-8"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {crumb.path ? (
                  <Link
                    href={crumb.path}
                    className="hover:text-[hsl(var(--veta-gold-muted))] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <span className="text-white/40">/</span>}
              </div>
            ))}
          </nav>
        )}

        {/* main content */}
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {subtitle && (
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[hsl(var(--veta-gold-muted))]">
                  {subtitle}
                </p>
              )}

              <h1 className="veta-heading text-[clamp(2.2rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-white">
                {title}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/88 sm:mt-6 sm:text-lg">
                {description}
              </p>

              {/* cta buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] transition-all hover:bg-[hsl(var(--veta-gold-hover))] hover:shadow-lg"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>

                {ctaConfig?.calendarLink && (
                  <Link
                    href={ctaConfig.calendarLink}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-[hsl(var(--veta-gold-muted))]"
                  >
                    {ctaConfig.secondaryLabel || 'Agendar visita'}
                  </Link>
                )}
              </div>

              {/* image counter */}
              {images.length > 1 && (
                <p className="mt-6 text-xs text-white/60">
                  {currentImageIndex + 1} / {images.length} imágenes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
