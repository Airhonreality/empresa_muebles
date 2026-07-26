'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import VetaProjectGallery from '../shared/VetaProjectGallery';

type PublicPortfolioImage = {
  imagen_url: string;
  descripcion?: string;
};

export type PublicPortfolioEntry = {
  slug: string;
  titulo: string;
  descripcion_comercial?: string;
  zona: string;
  categoria_espacio: string;
  materiales_destacados?: string;
  precio_referencial?: number;
  destacado: boolean;
  imagenes: PublicPortfolioImage[];
};

const categorias = ['todos', 'cocinas', 'cavas_bares', 'dormitorios_closets', 'consolas_recibidores', 'otros'];
const categoriasLabels: Record<string, string> = {
  todos: 'Todos',
  cocinas: 'Cocinas',
  cavas_bares: 'Cavas & Bares',
  dormitorios_closets: 'Dormitorios & Closets',
  consolas_recibidores: 'Consolas & Recibidores',
  otros: 'Otros',
};

const currency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export default function VetaPortfolio({ entries }: { entries: PublicPortfolioEntry[] }) {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [gallerySlug, setGallerySlug] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (activeCategory === 'todos') return entries;
    return entries.filter((e) => e.categoria_espacio === activeCategory);
  }, [entries, activeCategory]);

  const galleryEntry = useMemo(() => {
    if (!gallerySlug) return null;
    return entries.find((e) => e.slug === gallerySlug) ?? null;
  }, [gallerySlug, entries]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))]">
      {/* Sticky category nav */}
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--veta-glass-light-border))] bg-[hsl(var(--veta-bg-warm-paper))]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="veta-heading text-lg font-semibold tracking-tight hidden sm:block">Portafolio</h1>
          <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  activeCategory === cat
                    ? 'bg-[hsl(var(--veta-text-carbon))] text-white'
                    : 'text-[hsl(var(--veta-text-stone))] hover:bg-white/70 hover:text-[hsl(var(--veta-text-carbon))]'
                }`}
              >
                {categoriasLabels[cat]}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Snap-scroll magazine */}
      {filtered.length === 0 ? (
        <div className="flex h-[60vh] items-center justify-center text-sm text-[hsl(var(--veta-text-stone))]">
          No hay proyectos en esta categoría
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-[calc(100vh-57px)] overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          {filtered.map((entry, index) => {
            const materials = entry.materiales_destacados
              ? entry.materiales_destacados.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean)
              : [];
            const heroImage = entry.imagenes[0];
            const restImages = entry.imagenes.slice(1, 4);

            return (
              <section
                key={entry.slug}
                className="snap-start min-h-screen flex flex-col lg:flex-row relative"
              >
                {/* Hero image side */}
                <div className="relative h-[50vh] lg:h-screen lg:w-[58%] lg:sticky lg:top-0 overflow-hidden bg-[hsl(var(--veta-bg-linen))]">
                  {heroImage ? (
                    <img
                      src={heroImage.imagen_url}
                      alt={entry.titulo}
                      className="h-full w-full object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[hsl(var(--veta-text-stone))]">
                      Sin imagen
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-black/80 lg:via-black/30 lg:to-transparent" />

                  {/* Title overlay on mobile, moves to content side on desktop */}
                  <div className="absolute bottom-6 left-4 right-4 z-10 lg:hidden">
                    <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm mb-2">
                      {categoriasLabels[entry.categoria_espacio] || entry.categoria_espacio}
                    </span>
                    <h2 className="veta-heading text-2xl font-semibold text-white leading-tight">
                      {entry.titulo}
                    </h2>
                  </div>

                  {/* Scroll indicator */}
                  {index === 0 && filtered.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-1 text-white/60">
                      <span className="text-[9px] uppercase tracking-widest">Desliza</span>
                      <ChevronDown className="h-4 w-4 animate-bounce" />
                    </div>
                  )}
                </div>

                {/* Content side */}
                <div className="flex-1 px-6 py-8 lg:px-10 lg:py-12 lg:overflow-y-auto flex flex-col justify-center">
                  {/* Desktop category & title */}
                  <div className="hidden lg:block mb-6">
                    <span className="inline-block rounded-full bg-[hsl(var(--veta-gold-muted))]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--veta-gold-hover))] mb-3">
                      {categoriasLabels[entry.categoria_espacio] || entry.categoria_espacio}
                    </span>
                    <h2 className="veta-heading text-3xl font-semibold leading-tight tracking-tight">
                      {entry.titulo}
                    </h2>
                  </div>

                  {/* Description */}
                  {entry.descripcion_comercial && (
                    <p className="text-sm leading-relaxed text-[hsl(var(--veta-text-stone))] mb-6 max-w-prose">
                      {entry.descripcion_comercial}
                    </p>
                  )}

                  {/* Image mosaic */}
                  {restImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {restImages.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className={`overflow-hidden rounded-lg bg-[hsl(var(--veta-bg-linen))] ${
                            i === 0 && restImages.length === 3 ? 'row-span-2' : ''
                          }`}
                        >
                          <img
                            src={img.imagen_url}
                            alt={img.descripcion || ''}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Materials */}
                  {materials.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--veta-text-stone))] mb-2">
                        Materiales
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {materials.map((m) => (
                          <span
                            key={m}
                            className="rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--veta-text-stone))]"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  {entry.precio_referencial && entry.precio_referencial > 0 && (
                    <p className="text-sm text-[hsl(var(--veta-text-carbon))] mb-4">
                      Desde <span className="font-semibold">{currency(entry.precio_referencial)}</span>
                    </p>
                  )}

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={() => setGallerySlug(entry.slug)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))] self-start"
                  >
                    Ver galería completa
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Gallery modal */}
      <VetaProjectGallery
        open={galleryEntry !== null}
        onOpenChange={(open) => { if (!open) setGallerySlug(null); }}
        title={galleryEntry?.titulo ?? ''}
        description={galleryEntry?.descripcion_comercial}
        images={galleryEntry?.imagenes.map((img) => ({ url: img.imagen_url, description: img.descripcion })) ?? []}
        materials={
          galleryEntry?.materiales_destacados
            ? galleryEntry.materiales_destacados.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean)
            : undefined
        }
      />
    </div>
  );
}
