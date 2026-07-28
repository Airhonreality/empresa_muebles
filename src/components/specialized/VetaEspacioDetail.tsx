import Link from 'next/link';
import { ArrowRight, Check, MessageCircle } from 'lucide-react';
import VetaFooter from './VetaFooter';
import VetaHeader from './VetaHeader';

export interface VetaEspacioDetailProps {
  title: string;
  eyebrow: string;
  description: string;
  benefits: string[];
  processNote: string;
  portfolioCategory: string;
}

export default function VetaEspacioDetail({
  title,
  eyebrow,
  description,
  benefits,
  processNote,
  portfolioCategory,
}: VetaEspacioDetailProps) {
  return (
    <div className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]">
      <VetaHeader />
      <main>
        <section className="border-b border-[hsl(var(--veta-glass-light-border))] px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-[hsl(var(--veta-text-stone))]">{eyebrow}</p>
              <h1 className="veta-heading text-[clamp(2.5rem,6vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.05em]">{title}</h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-[hsl(var(--veta-text-stone))] sm:text-lg">{description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/agendar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] hover:bg-[hsl(var(--veta-gold-hover))]">
                  Agendar visita <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={`/portafolio?categoria=${portfolioCategory}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[hsl(var(--veta-glass-light-border))] px-6 text-xs font-semibold uppercase tracking-[0.16em] hover:border-[hsl(var(--veta-gold-muted))]">
                  Ver proyectos <MessageCircle className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="veta-surface-stone rounded-[2rem] p-7 sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--veta-text-stone))]">Lo que resolvemos</p>
              <ul className="mt-5 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-3 text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <section className="px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            {[
              ['01', 'Conversamos', 'Entendemos el uso, las medidas, el estilo y las prioridades de tu espacio.'],
              ['02', 'Diseñamos', 'Preparamos una propuesta visual y técnica para que puedas decidir con claridad.'],
              ['03', 'Fabricamos e instalamos', processNote],
            ].map(([number, step, copy]) => (
              <article key={number} className="border-t border-[hsl(var(--veta-glass-light-border))] pt-5">
                <p className="text-xs font-bold tracking-[0.2em] text-[hsl(var(--veta-gold-hover))]">{number}</p>
                <h2 className="veta-heading mt-4 text-2xl font-semibold">{step}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <VetaFooter />
    </div>
  );
}
