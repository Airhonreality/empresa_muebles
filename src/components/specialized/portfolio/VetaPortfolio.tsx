'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
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

/* ── Smart image layout ──────────────────────────────────────────── */

type Orientation = 'landscape' | 'portrait' | 'square';

function useImageOrientations(urls: string[]): Orientation[] {
  const [dims, setDims] = useState<Map<string, Orientation>>(new Map());

  useEffect(() => {
    let active = true;
    const pending = new Map<string, Orientation>();
    const load = async (url: string) => {
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const orient = img.naturalWidth > img.naturalHeight ? 'landscape'
          : img.naturalWidth < img.naturalHeight ? 'portrait' : 'square';
        pending.set(url, orient);
      } catch {
        pending.set(url, 'landscape');
      }
    };
    Promise.all(urls.map(load)).then(() => { if (active) setDims(new Map(pending)); });
    return () => { active = false; };
  }, [urls.join(',')]);

  return urls.map((u) => dims.get(u) ?? 'landscape');
}

type ImageItem = { url: string; description?: string };

function SmartImageGrid({
  images,
  onImageClick,
}: {
  images: ImageItem[];
  onImageClick: (index: number) => void;
}) {
  const urls = useMemo(() => images.map((i) => i.url), [images]);
  const orientations = useImageOrientations(urls);
  const count = images.length;

  if (count === 0) return null;

  const allPortrait = orientations.every((o) => o === 'portrait');
  const allLandscape = orientations.every((o) => o === 'landscape');
  const maxShow = Math.min(count, 6);
  const display = images.slice(0, maxShow);

  let gridClass = 'grid grid-cols-2 gap-2 h-full';
  let childClass: ((i: number) => string) = () => '';

  if (count === 1) {
    gridClass = 'grid grid-cols-1 gap-0 h-full';
  } else if (count === 2 && allPortrait) {
    gridClass = 'grid grid-cols-2 gap-2 h-full';
  } else if (count === 2 && allLandscape) {
    gridClass = 'grid grid-rows-2 gap-2 h-full';
  } else if (count === 3) {
    gridClass = 'grid grid-cols-2 gap-2 h-full';
    childClass = (i) => i === 0 ? 'row-span-2' : '';
  } else if (count === 4) {
    gridClass = 'grid grid-cols-2 gap-2 h-full';
  } else if (count >= 5) {
    gridClass = 'grid grid-cols-3 gap-2 h-full';
    childClass = (i) => i < 2 ? 'col-span-1 row-span-2' : '';
  }

  return (
    <div className={gridClass}>
      {display.map((img, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onImageClick(i)}
          className={`group relative overflow-hidden rounded-lg bg-[hsl(var(--veta-bg-linen))] ${childClass(i)}`}
        >
          <img
            src={img.url}
            alt={img.description ?? ''}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        </button>
      ))}
      {count > maxShow && (
        <button
          type="button"
          onClick={() => onImageClick(0)}
          className="relative overflow-hidden rounded-lg bg-[hsl(var(--veta-bg-linen))] flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-[hsl(var(--veta-text-stone))] hover:bg-[hsl(var(--veta-bg-linen))]/80 transition-colors"
        >
          +{count - maxShow} más
        </button>
      )}
    </div>
  );
}

/* ── Page component ──────────────────────────────────────────────── */

export default function VetaPortfolio({ entries }: { entries: PublicPortfolioEntry[] }) {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [galleryEntry, setGalleryEntry] = useState<{ slug: string; startIdx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (activeCategory === 'todos') return entries;
    return entries.filter((e) => e.categoria_espacio === activeCategory);
  }, [entries, activeCategory]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  const openGallery = useCallback((slug: string, startIdx: number) => {
    setGalleryEntry({ slug, startIdx });
  }, []);

  const activeEntry = useMemo(() => {
    if (!galleryEntry) return null;
    return entries.find((e) => e.slug === galleryEntry.slug) ?? null;
  }, [galleryEntry, entries]);

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--veta-bg-warm-paper))]">
      <VetaHeader />

      {/* Hero + category filter — static, outside scroll */}
      <section className="pt-24 pb-5 px-4 sm:px-8 lg:px-12 border-b border-[hsl(var(--veta-glass-light-border))] shrink-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="veta-heading text-3xl font-semibold tracking-tight mb-2">Portafolio</h1>
          <p className="text-sm text-[hsl(var(--veta-text-stone))] mb-5">
            Proyectos realizados con materiales de calidad
          </p>
          <nav className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  activeCategory === cat
                    ? 'bg-[hsl(var(--veta-text-carbon))] text-white'
                    : 'text-[hsl(var(--veta-text-stone))] border border-[hsl(var(--veta-glass-light-border))] hover:bg-white/70'
                }`}
              >
                {categoriasLabels[cat]}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* Scrollable area — flex-1 fills remaining space between header+hero and footer */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[hsl(var(--veta-text-stone))]">
          No hay proyectos en esta categoría
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          {filtered.map((entry, index) => {
            const materials = entry.materiales_destacados
              ? entry.materiales_destacados.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean)
              : [];

            return (
              <section
                key={entry.slug}
                className="snap-start lg:h-full min-h-0 flex flex-col lg:flex-row"
              >
                {/* Gallery side — 65% */}
                <div className="lg:w-[65%] lg:h-full min-h-0 p-3 lg:p-4 flex flex-col">
                  <div className="flex-1 min-h-0">
                    <SmartImageGrid
                      images={entry.imagenes.map((img) => ({ url: img.imagen_url, description: img.descripcion }))}
                      onImageClick={(idx) => openGallery(entry.slug, idx)}
                    />
                  </div>
                  {index === 0 && filtered.length > 1 && (
                    <div className="flex-none flex items-center justify-center gap-1 mt-2 text-[9px] uppercase tracking-widest text-[hsl(var(--veta-text-stone))] lg:hidden">
                      <span>Desliza</span>
                      <ChevronDown className="h-3 w-3 animate-bounce" />
                    </div>
                  )}
                </div>

                {/* Info side — 35% */}
                <div className="lg:w-[35%] px-6 py-6 lg:px-8 lg:py-10 lg:h-full lg:overflow-y-auto flex flex-col justify-center">
                  <span className="inline-block rounded-full bg-[hsl(var(--veta-gold-muted))]/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--veta-gold-hover))] mb-3 self-start">
                    {categoriasLabels[entry.categoria_espacio] || entry.categoria_espacio}
                  </span>

                  <h2 className="veta-heading text-2xl lg:text-3xl font-semibold leading-tight tracking-tight mb-3">
                    {entry.titulo}
                  </h2>

                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--veta-text-stone))] mb-4">
                    {entry.zona}
                  </p>

                  {entry.descripcion_comercial && (
                    <p className="text-sm leading-relaxed text-[hsl(var(--veta-text-stone))] mb-6">
                      {entry.descripcion_comercial}
                    </p>
                  )}

                  {materials.length > 0 && (
                    <div>
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

                  {index === 0 && filtered.length > 1 && (
                    <div className="hidden lg:flex items-center gap-2 mt-8 text-[10px] uppercase tracking-widest text-[hsl(var(--veta-text-stone))]">
                      <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
                      <span>Desliza para ver más proyectos</span>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <VetaProjectGallery
        open={activeEntry !== null}
        onOpenChange={(open) => { if (!open) setGalleryEntry(null); }}
        title={activeEntry?.titulo ?? ''}
        description={activeEntry?.descripcion_comercial}
        images={activeEntry?.imagenes.map((img) => ({ url: img.imagen_url, description: img.descripcion })) ?? []}
        materials={
          activeEntry?.materiales_destacados
            ? activeEntry.materiales_destacados.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean)
            : undefined
        }
        startIndex={galleryEntry?.startIdx ?? 0}
      />

      <VetaFooter />
    </div>
  );
}
