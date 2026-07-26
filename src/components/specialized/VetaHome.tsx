'use client';

import React, { useMemo, useState } from 'react';
import type { BlockProps } from '@agnostic/core';
import Link from 'next/link';
import { ArrowRight, MapPin, Ruler, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import VetaHeader from './VetaHeader';
import VetaFooter from './VetaFooter';
import VetaTestimonials from './VetaTestimonials';
import { VetaEmbudoModal } from './VetaEmbudoModal';
import { useGclidCapture } from '@/lib/veta/useGclidCapture';
import type { PublicHomeContent } from '@/lib/veta/public-content';
import VetaProjectGallery from './shared/VetaProjectGallery';
import { uniqueCategories, categoryLabel, type SpaceCategoryId } from '@/lib/veta/portfolio';

export default function VetaHome({ publicContent }: { publicContent: PublicHomeContent }) {
  useGclidCapture();
  const [embudoOpen, setEmbudoOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<SpaceCategoryId>('todos');

  const heroImageUrl = publicContent.commercial_config?.find(
    (rec) => rec.data?.llave === 'home_hero_url'
  )?.data?.valor;

  const allCategories = useMemo(() => uniqueCategories(publicContent.spaces), [publicContent.spaces]);

  const destacados = useMemo(() => {
    return publicContent.spaces.filter((s) => s.destacado).slice(0, 3);
  }, [publicContent.spaces]);

  const displayedSpaces = useMemo(() => {
    if (activeCategory === 'todos') return destacados;
    return destacados.filter((s) => s.categoria_espacio === activeCategory);
  }, [activeCategory, destacados]);

  const handleCategorySelect = (categoryId: SpaceCategoryId) => {
    setActiveCategory(categoryId);
    setGalleryIndex(null);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        const target = document.getElementById('espacios-grid');
        const header = document.querySelector('header');
        const hud = document.getElementById('espacios-hud');
        if (!target) return;
        const headerHeight = header?.getBoundingClientRect().height ?? 0;
        const hudHeight = hud?.getBoundingClientRect().height ?? 0;
        const offset = headerHeight + Math.max(96, Math.round(hudHeight * 0.95));
        const top = window.scrollY + target.getBoundingClientRect().top - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      });
    }
  };

  return (
    <div className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))] selection:bg-[hsl(var(--veta-gold-muted))]/30 selection:text-[hsl(var(--veta-text-carbon))]">
      <VetaHeader configRecords={publicContent.commercial_config} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-black">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt="Carpintería arquitectónica Veta Dorada"
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/42 to-black/10" />

        <div className="relative flex min-h-[calc(100svh-3.5rem)] w-full flex-col">
          <div className="flex flex-1 items-center">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-6 text-center sm:px-6 lg:px-12 lg:py-10">
              <h1 className="veta-heading mt-4 max-w-[30ch] text-[clamp(1.9rem,calc(1rem+2.1vw),3.85rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-white">
                <span className="block">Carpintería arquitectónica</span>
                <span className="block">de alta precisión.</span>
              </h1>
              <p className="mx-auto mt-3 max-w-[68ch] text-[0.98rem] leading-[1.65] text-white/84 md:text-[1.02rem]">
                Diseñamos, fabricamos e instalamos espacios integrales pensados para tu bienestar. Tecnología 3D, materiales premium y calidad de fábrica, sin intermediarios.
              </p>

              <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEmbudoOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))] sm:px-6 sm:text-xs"
                >
                  <span>Agendar visita</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/portafolio"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md transition-colors hover:bg-white/15 sm:px-6 sm:text-xs"
                >
                  Ver portafolio
                </Link>
              </div>

              <div className="mt-6 grid w-full max-w-6xl gap-4 sm:grid-cols-3 lg:gap-6">
                {[
                  { value: 'Bogotá', label: 'Cobertura focalizada', icon: MapPin },
                  { value: '3D', label: 'Diseño y modelado', icon: Ruler },
                  { value: 'Premium', label: 'Fabricación directa', icon: ShieldCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur-md sm:p-6 lg:p-7">
                      <Icon className="mb-2 h-4 w-4 text-[hsl(var(--veta-gold-muted))]" />
                      <p className="veta-heading text-lg font-semibold text-white sm:text-xl">{item.value}</p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/60 sm:text-[10px] sm:tracking-[0.2em]">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {allCategories.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 z-30 px-3 sm:bottom-5 sm:px-4 lg:bottom-6 lg:px-8">
              <div
                id="espacios-hud"
                className="mx-auto w-full max-w-[80rem] rounded-full border border-white/18 bg-[rgba(252,251,249,0.72)] px-3 py-2.5 backdrop-blur-3xl sm:px-4 sm:py-3 lg:px-5"
              >
                <div className="flex items-center gap-0.5 overflow-x-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {allCategories.map((tabId) => (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => handleCategorySelect(tabId)}
                      className={`relative shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 sm:px-4 sm:py-2.5 sm:text-[11px] ${
                        activeCategory === tabId
                          ? 'bg-[hsl(var(--veta-text-carbon))] text-white'
                          : 'text-[hsl(var(--veta-text-stone))] hover:bg-white/70 hover:text-[hsl(var(--veta-text-carbon))]'
                      }`}
                    >
                      {tabId === 'todos' ? 'Proyectos destacados' : categoryLabel(tabId)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Espacios a medida */}
      <section id="espacios-grid" className="veta-section px-4 pt-16 sm:px-6 lg:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-[var(--veta-space-lg)] flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-[hsl(var(--veta-gold-hover))]">
                Espacios a medida
              </span>
              <h2 className="veta-heading text-[clamp(2rem,calc(1.2rem+2.4vw),3.8rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                Diseños reales que pueden convertirse en tu próximo espacio
              </h2>
            </div>
            <Link
              href="/portafolio"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--veta-text-carbon))] backdrop-blur-md transition-colors hover:bg-white hover:border-[hsl(var(--veta-gold-muted))]"
            >
              Ver portafolio completo
            </Link>
          </div>

          {displayedSpaces.length === 0 ? (
            <div className="veta-surface-matte mx-auto max-w-xl space-y-4 rounded-[2rem] py-20 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--veta-text-stone))]">
                No hay proyectos destacados en esta categoría todavía
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/portafolio"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]"
                >
                  Ver portafolio completo
                </Link>
                <button
                  type="button"
                  onClick={() => setEmbudoOpen(true)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] px-6 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--veta-text-carbon))]"
                >
                  Agendar visita
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
              {displayedSpaces.map((space, index) => (
                <article
                  key={space.nombre_espacio}
                  className={`${index % 2 === 0 ? 'veta-surface-stone' : 'veta-surface-matte'} overflow-hidden rounded-[1.75rem] cursor-pointer`}
                  onClick={() => setGalleryIndex(publicContent.spaces.indexOf(space))}
                >
                  <div className="relative aspect-[16/10]">
                    {space.imagen_url ? (
                      <img src={space.imagen_url} alt={space.nombre_espacio} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-[hsl(var(--veta-bg-linen))]" />
                    )}
                    {space.categoria_espacio && (
                      <div className="veta-surface-glass absolute left-4 top-4 rounded-full px-3 py-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--veta-text-carbon))]">
                          {categoryLabel(space.categoria_espacio)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-6 lg:p-8">
                    <h3 className="veta-heading text-lg font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))]">
                      {space.nombre_espacio}
                    </h3>
                    <p className="text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">{space.descripcion}</p>
                    {space.materiales.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {space.materiales.slice(0, 3).map((m) => (
                          <span
                            key={m}
                            className="rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[hsl(var(--veta-text-stone))]"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 pt-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--veta-gold-hover))]">
                      <span>Ver proyecto</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Validación técnica */}
      <section className="veta-section bg-[hsl(var(--veta-bg-linen))] px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-[var(--veta-space-lg)] max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-[hsl(var(--veta-gold-hover))]">
              Validación técnica
            </span>
            <h2 className="veta-heading text-[clamp(2rem,calc(1.2rem+2.4vw),3.8rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
              Por qué Veta Dorada
            </h2>
            <p className="max-w-[62ch] text-sm leading-[1.75] text-[hsl(var(--veta-text-stone))]">
              Veta Dorada es un estudio de carpintería arquitectónica ubicado en Bogotá. Especializados en diseño, modelado 3D y fabricación directa de cocinas integrales, vestidores y mobiliario residencial de alta gama, con precisión milimétrica y herrajes de estándar global.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: Ruler, title: 'Visualización 3D', text: 'Modelamos tu espacio antes de fabricarlo para que veas el resultado exacto, sin sorpresas ni decisiones a ciegas.' },
              { icon: ShieldCheck, title: 'Fábrica directa', text: 'Sin intermediarios. Controlamos calidad, tiempos y detalles desde el taller hasta la instalación final.' },
              { icon: MapPin, title: 'Asesoría de diseño', text: 'Te ayudamos a ordenar criterios de uso, estética y ergonomía desde la primera conversación, sin costo.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="veta-surface-matte rounded-2xl p-7 lg:p-8">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--veta-gold-muted))]/20 text-[hsl(var(--veta-gold-hover))]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="veta-heading text-xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))]">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
                    {item.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <VetaTestimonials testimonios={publicContent.testimonials} />

      {/* CTA final */}
      <section className="veta-section relative overflow-hidden px-4 sm:px-6">
        <div className="veta-surface-sheen veta-sheen-highlight relative z-10 mx-auto max-w-7xl rounded-[2rem] px-8 py-14 text-center md:px-12 md:py-16">
          <span className="text-xs font-bold uppercase tracking-[0.28em] text-[hsl(var(--veta-gold-hover))]">
            Próximo paso
          </span>
          <h2 className="veta-heading mt-4 text-[clamp(2rem,calc(1.2rem+2.4vw),3.8rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
            Hagamos que tu hogar respire mejor
          </h2>
          <p className="mx-auto mt-4 max-w-[48ch] text-sm leading-[1.75] text-[hsl(var(--veta-text-stone))]">
            La conversación empieza con un filtro simple. El objetivo es entender tu proyecto, darte contexto real y llevarte a WhatsApp con una solicitud ya estructurada.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setEmbudoOpen(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))]"
            >
              Agendar visita
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <VetaProjectGallery
        open={galleryIndex !== null}
        onOpenChange={(open) => { if (!open) setGalleryIndex(null); }}
        title={galleryIndex !== null ? publicContent.spaces[galleryIndex].nombre_espacio : ''}
        description={galleryIndex !== null ? publicContent.spaces[galleryIndex].descripcion : undefined}
        images={galleryIndex !== null ? publicContent.spaces[galleryIndex].imagenes.map((img) => ({ url: img.imagen_url, description: img.descripcion })) : []}
        materials={galleryIndex !== null && publicContent.spaces[galleryIndex].materiales.length > 0 ? publicContent.spaces[galleryIndex].materiales : undefined}
        cta={{
          label: 'Cotizar espacio similar',
          onClick: () => { setGalleryIndex(null); setEmbudoOpen(true); },
        }}
      />

      <VetaFooter configRecords={publicContent.commercial_config} />
      <VetaEmbudoModal configRecords={publicContent.commercial_config} open={embudoOpen} onOpenChange={setEmbudoOpen} />
    </div>
  );
}
