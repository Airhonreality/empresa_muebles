'use client';

import { useCallback, useMemo, useState } from 'react';
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

const CATEGORY_COLORS: Record<string, string> = {
  cocinas: '#D4AF37',
  cavas_bares: '#8B7355',
  dormitorios_closets: '#4A6670',
  consolas_recibidores: '#8B4513',
  otros: '#6B5B4F',
};

export default function VetaPortfolio({ entries }: { entries: PublicPortfolioEntry[] }) {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [galleryEntry, setGalleryEntry] = useState<{ slug: string; startIdx: number } | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === 'todos') return entries;
    return entries.filter((e) => e.categoria_espacio === activeCategory);
  }, [entries, activeCategory]);

  const openGallery = useCallback((slug: string, startIdx: number) => {
    setGalleryEntry({ slug, startIdx });
  }, []);

  const activeEntry = useMemo(() => {
    if (!galleryEntry) return null;
    return entries.find((e) => e.slug === galleryEntry.slug) ?? null;
  }, [galleryEntry, entries]);

  return (
    <div className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))]">
      <VetaHeader />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="veta-heading text-4xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))]">
              Portafolio
            </h1>
            <p className="mt-1.5 text-sm text-[hsl(var(--veta-text-stone))]">
              Proyectos realizados con materiales de calidad
            </p>
          </div>
          <nav className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
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

        {filtered.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center text-sm text-[hsl(var(--veta-text-stone))]">
            No hay proyectos en esta categoría
          </div>
        ) : (
          <div className="columns-2 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
            {filtered.map((entry) => {
              const img = entry.imagenes[0];
              const categoryColor = CATEGORY_COLORS[entry.categoria_espacio] || CATEGORY_COLORS.otros;

              return (
                <button
                  key={entry.slug}
                  type="button"
                  onClick={() => openGallery(entry.slug, 0)}
                  className="group relative mb-4 block w-full overflow-hidden rounded-xl bg-[hsl(var(--veta-bg-linen))] text-left transition-transform duration-300 hover:-translate-y-0.5 break-inside-avoid"
                >
                  {img ? (
                    <>
                      <img
                        src={img.imagen_url}
                        alt={entry.titulo}
                        className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white mb-1.5"
                          style={{ backgroundColor: categoryColor }}
                        >
                          {categoriasLabels[entry.categoria_espacio] || entry.categoria_espacio}
                        </span>
                        <h2 className="veta-heading text-base font-semibold text-white">
                          {entry.titulo}
                        </h2>
                      </div>
                    </>
                  ) : (
                    <div className="flex aspect-square items-center justify-center p-6">
                      <p className="text-center text-xs text-[hsl(var(--veta-text-stone))]">
                        {entry.titulo}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

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
