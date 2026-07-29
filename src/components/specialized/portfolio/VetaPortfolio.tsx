'use client';

import { useMemo, useState } from 'react';
import type { BlockProps } from '@agnostic/core';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';

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

type FlatImage = {
  url: string;
  descripcion?: string;
  projectSlug: string;
  projectTitle: string;
  projectCategory: string;
};

type VetaPortfolioProps = Partial<BlockProps> & {
  entries?: PublicPortfolioEntry[];
  initialCategory?: string;
};

export default function VetaPortfolio({ entries = [], initialCategory }: VetaPortfolioProps) {
  const [activeCategory, setActiveCategory] = useState(() =>
    initialCategory && categorias.includes(initialCategory) ? initialCategory : 'todos'
  );
  const [selectedProject, setSelectedProject] = useState<PublicPortfolioEntry | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === 'todos') return entries;
    return entries.filter((e) => e.categoria_espacio === activeCategory);
  }, [entries, activeCategory]);

  const allImages: FlatImage[] = useMemo(
    () =>
      filtered.flatMap((entry) =>
        entry.imagenes.map((img) => ({
          url: img.imagen_url,
          descripcion: img.descripcion,
          projectSlug: entry.slug,
          projectTitle: entry.titulo,
          projectCategory: entry.categoria_espacio,
        }))
      ),
    [filtered]
  );

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))]">
        <VetaHeader />
        <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <button
            type="button"
            onClick={() => setSelectedProject(null)}
            className="group mb-8 flex items-center gap-2 text-sm font-medium text-[hsl(var(--veta-text-stone))] transition-colors hover:text-[hsl(var(--veta-text-carbon))]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:-translate-x-0.5">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver al portafolio
          </button>

          <div className="mb-12">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span
                  className="mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white"
                  style={{ backgroundColor: CATEGORY_COLORS[selectedProject.categoria_espacio] || CATEGORY_COLORS.otros }}
                >
                  {categoriasLabels[selectedProject.categoria_espacio] || selectedProject.categoria_espacio}
                </span>
                <h1 className="veta-heading text-3xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))] sm:text-4xl">
                  {selectedProject.titulo}
                </h1>
              </div>
              {selectedProject.precio_referencial && (
                <p className="text-lg font-medium text-[hsl(var(--veta-text-carbon))]">
                  Desde ${selectedProject.precio_referencial.toLocaleString('es-CO')}
                </p>
              )}
            </div>

            {selectedProject.descripcion_comercial && (
              <p className="mb-6 max-w-2xl text-base leading-relaxed text-[hsl(var(--veta-text-stone))]">
                {selectedProject.descripcion_comercial}
              </p>
            )}

            {selectedProject.materiales_destacados && (
              <div className="mb-10 flex flex-wrap gap-2">
                {selectedProject.materiales_destacados.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean).map((mat) => (
                  <span
                    key={mat}
                    className="rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/50 px-3 py-1 text-[11px] font-medium text-[hsl(var(--veta-text-stone))]"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="columns-2 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
            {selectedProject.imagenes.map((img, idx) => (
              <div key={idx} className="mb-4 break-inside-avoid overflow-hidden rounded-xl">
                <img
                  src={img.imagen_url}
                  alt={img.descripcion || `${selectedProject.titulo} - Imagen ${idx + 1}`}
                  className="w-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </main>
        <VetaFooter />
      </div>
    );
  }

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
              Cada imagen es un proyecto. Haz clic para verlo completo.
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

        {allImages.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center text-sm text-[hsl(var(--veta-text-stone))]">
            No hay proyectos en esta categoría
          </div>
        ) : (
          <div className="columns-2 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
            {allImages.map((img, idx) => {
              const entry = entries.find((e) => e.slug === img.projectSlug);
              const categoryColor = CATEGORY_COLORS[img.projectCategory] || CATEGORY_COLORS.otros;

              return (
                <button
                  key={`${img.projectSlug}-${idx}`}
                  type="button"
                  onClick={() => entry && setSelectedProject(entry)}
                  className="group relative mb-4 block w-full overflow-hidden rounded-xl bg-[hsl(var(--veta-bg-linen))] text-left transition-transform duration-300 hover:-translate-y-0.5 break-inside-avoid"
                >
                  <img
                    src={img.url}
                    alt={img.descripcion || img.projectTitle}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span
                      className="mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {categoriasLabels[img.projectCategory] || img.projectCategory}
                    </span>
                    <h2 className="veta-heading text-sm font-semibold text-white">
                      {img.projectTitle}
                    </h2>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <VetaFooter />
    </div>
  );
}
