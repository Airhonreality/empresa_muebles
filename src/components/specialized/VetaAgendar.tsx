'use client';

import type { BlockProps } from '@agnostic/core';
import { Calendar, MapPin, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import VetaHeader from './VetaHeader';
import VetaFooter from './VetaFooter';
import { VetaEmbudoForm } from './VetaEmbudoForm';
import { useGclidCapture } from '@/lib/veta/useGclidCapture';

export default function VetaAgendar({ block = {}, records, api }: Partial<BlockProps>) {
  useGclidCapture();

  return (
    <div className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]">
      <VetaHeader />

      <section className="veta-section px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="space-y-[var(--veta-space-md)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[hsl(var(--veta-text-stone))]">
              <Calendar className="h-3.5 w-3.5 text-[hsl(var(--veta-gold-hover))]" />
              <span>Agenda asistida</span>
            </div>

            <h1 className="veta-heading text-[clamp(2.1rem,calc(1.35rem+2.4vw),4rem)] font-semibold leading-[1.03] tracking-tight">
              Diseñemos tu espacio con un filtro simple.
            </h1>
            <p className="max-w-[66ch] text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
              El embudo reduce ruido comercial y nos permite entender tu necesidad antes de llevarte a WhatsApp. Trabajamos sobre Bogotá y sus sectores de investigación.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: 'Visita', text: 'Asesoría y toma de contexto', surface: 'veta-surface-glass' },
                { title: 'Filtro', text: 'Espacio y estado del proyecto', surface: 'veta-surface-stone' },
                { title: 'WhatsApp', text: 'Mensaje listo para avanzar', surface: 'veta-surface-matte' },
              ].map((item) => (
                <div key={item.title} className={`${item.surface} rounded-2xl p-5`}>
                  <Sparkles className="mb-3 h-5 w-5 text-[hsl(var(--veta-gold-hover))]" />
                  <p className="text-sm font-semibold text-[hsl(var(--veta-text-carbon))]">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[hsl(var(--veta-text-stone))]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="veta-surface-matte space-y-4 rounded-[1.75rem] p-6">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <p className="text-sm text-[hsl(var(--veta-text-stone))]">
                  Cobertura operativa en Bogotá: Usaquén, Rosales, Chicó, Chapinero, Quinta Camacho, Teusaquillo, Cedritos y Suba norte.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <p className="text-sm text-[hsl(var(--veta-text-stone))]">
                  El registro se hace primero en el CRM local y luego se abre WhatsApp con el mensaje prellenado.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <p className="text-sm text-[hsl(var(--veta-text-stone))]">
                  Capturamos GCLID y UTMs en segundo plano para mantener la atribución del lead.
                </p>
              </div>
            </div>
          </aside>

          <div className="veta-surface-glass rounded-[2rem] p-6 md:p-8">
            <VetaEmbudoForm mode="page" />
          </div>
        </div>
      </section>

      <VetaFooter />
    </div>
  );
}
