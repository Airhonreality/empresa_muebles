'use client';

import { Star } from 'lucide-react';
import type { PublicTestimonial } from '@/lib/veta/public-content';

const surfaces = ['veta-surface-glass', 'veta-surface-stone', 'veta-surface-matte'] as const;

// El grid asume 3 columnas; con menos reseñas reales publicadas, degrada a un
// ancho contenido y centrado en vez de dejar columnas vacías (bug visible cuando
// solo hay 1-2 testimonios destacados).
const gridLayoutByCount: Record<number, string> = {
  1: 'max-w-xl mx-auto grid-cols-1',
  2: 'max-w-4xl mx-auto grid-cols-1 sm:grid-cols-2',
};
const defaultGridLayout = 'md:grid-cols-2 xl:grid-cols-3';

export default function VetaTestimonials({ testimonios = [] }: { testimonios?: PublicTestimonial[] }) {

  if (testimonios.length === 0) return null;

  const gridLayout = gridLayoutByCount[testimonios.length] ?? defaultGridLayout;

  return (
    <section className="veta-section bg-[hsl(var(--veta-bg-linen))] px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-[var(--veta-space-lg)] max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-[hsl(var(--veta-text-stone))]">
            <span className="h-px w-6 bg-[hsl(var(--veta-gold-muted))]" />
            Prueba social real
          </span>
          <h2 className="veta-heading text-3xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))] md:text-5xl">
            Voces de clientes reales
          </h2>
          <p className="max-w-[66ch] text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
            Solo mostramos reseñas curadas manualmente por el equipo, con nombre y barrio, para sostener la confianza del Home sin inventar prueba social.
          </p>
        </div>

        <div className={`grid gap-6 ${gridLayout}`}>
          {testimonios.map((item, cardIndex) => {
            const dataItem = item.data;
            const rating = Number(dataItem.calificacion || 0);
            return (
              <article key={`${dataItem.nombre_cliente}-${cardIndex}`} className={`${surfaces[cardIndex % surfaces.length]} rounded-2xl p-6`}>
                <div className="mb-4 flex items-center gap-1 text-[hsl(var(--veta-gold-hover))]">
                  {Array.from({ length: Math.max(0, Math.min(5, rating || 0)) }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-[hsl(var(--veta-text-carbon))]">
                  {dataItem.texto_resena}
                </p>
                <div className="mt-5 space-y-1">
                  <p className="text-sm font-semibold text-[hsl(var(--veta-text-carbon))]">
                    {dataItem.nombre_cliente}
                  </p>
                  <p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--veta-text-stone))]">
                    {dataItem.barrio}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
