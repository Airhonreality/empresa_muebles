'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Home, Layers3, Sparkles } from 'lucide-react';

type SpaceCategory = {
  title: string;
  href: string;
  description: string;
  note: string;
};

const spaceCategories: SpaceCategory[] = [
  {
    title: 'Cocinas',
    href: '/cocinas-integrales-bogota',
    description: 'Cocinas integrales pensadas para uso diario, organización clara y una presencia visual sobria.',
    note: 'Diseño, fabricación e instalación a medida.',
  },
  {
    title: 'Closets y vestidores',
    href: '/closets-vestidores-bogota',
    description: 'Soluciones de guardado con proporción, orden y detalles que facilitan la rutina sin recargar el ambiente.',
    note: 'Aprovechamiento eficiente del espacio.',
  },
  {
    title: 'Cavas y bares',
    href: '/cavas-y-bares',
    description: 'Piezas que combinan almacenamiento y carácter, con una ejecución contenida y elegante.',
    note: 'Para espacios sociales y de exhibición.',
  },
  {
    title: 'Centros de entretenimiento',
    href: '/centros-de-entretenimiento',
    description: 'Frentes limpios, pasacables resueltos y mobiliario que integra tecnología sin perder orden visual.',
    note: 'Lectura ligera y funcional.',
  },
  {
    title: 'Estudios y home office',
    href: '/estudios-home-office',
    description: 'Ambientes de trabajo que priorizan concentración, ergonomía básica y presencia arquitectónica.',
    note: 'Pensado para uso cotidiano y remoto.',
  },
];

export default function VetaEspacios() {
  return (
    <main className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]">
      <section className="veta-section px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[hsl(var(--veta-text-stone))]">
                <Layers3 className="h-3.5 w-3.5 text-[hsl(var(--veta-gold-hover))]" />
                <span>Espacios a medida</span>
              </div>

              <h1 className="veta-heading max-w-[16ch] text-[clamp(2.15rem,calc(1.3rem+3vw),4.4rem)] font-semibold leading-[0.96] tracking-[-0.04em]">
                Diseñamos espacios que ordenan la vida cotidiana.
              </h1>

              <p className="max-w-[60ch] text-sm leading-relaxed text-[hsl(var(--veta-text-stone))] md:text-[0.98rem]">
                En esta página reunimos cinco líneas de trabajo para proyectos residenciales y sociales.
                El enfoque es prudente y funcional: resolver uso, proporción y acabado con una estética
                limpia, sin prometer más de lo que cada espacio requiere.
              </p>
            </div>

            <aside className="veta-surface-matte rounded-[2rem] p-6 md:p-8">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--veta-text-carbon))]">
                    Proceso claro, sin ruido
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
                    Revisión inicial, definición del alcance y avance hacia una cita agendada cuando el
                    proyecto ya tiene contexto suficiente.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'Atención en Bogotá',
                  'Diseño y fabricación a medida',
                  'Materialidad sobria y duradera',
                  'CTA directo a agenda',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--veta-glass-light-border))] bg-white/55 px-4 py-3"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                    <span className="text-xs font-medium text-[hsl(var(--veta-text-stone))]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Link
                  href="/agendar"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))]"
                >
                  Agendar visita
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {spaceCategories.map((category, index) => (
              <article
                key={category.title}
                className={`overflow-hidden rounded-[1.75rem] ${
                  index % 2 === 0 ? 'veta-surface-stone' : 'veta-surface-matte'
                }`}
              >
                <div className="p-6 md:p-7">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--veta-text-stone))]">
                      <Home className="h-3.5 w-3.5 text-[hsl(var(--veta-gold-hover))]" />
                      <span>Categoria</span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--veta-text-stone))]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h2 className="veta-heading text-xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))]">
                    {category.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
                    {category.description}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[hsl(var(--veta-text-stone))]">
                    {category.note}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={category.href}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--veta-text-carbon))] transition-colors hover:bg-white hover:border-[hsl(var(--veta-gold-muted))]"
                    >
                      Ver categoría
                    </Link>
                    <Link
                      href="/espacios"
                      aria-label="Ir a la página de espacios"
                      className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--veta-text-stone))] transition-colors hover:text-[hsl(var(--veta-text-carbon))]"
                    >
                      /espacios
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-12 veta-surface-glass rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[hsl(var(--veta-text-stone))]">
                  Siguiente paso
                </p>
                <h2 className="veta-heading text-2xl font-semibold tracking-tight md:text-3xl">
                  Si ya tienes una idea, la convertimos en una agenda concreta.
                </h2>
                <p className="max-w-[58ch] text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
                  La ruta recomendada es revisar la categoría correspondiente y, cuando el alcance esté
                  claro, pasar a una cita en <span className="font-medium text-[hsl(var(--veta-text-carbon))]">/agendar</span>.
                </p>
              </div>

              <Link
                href="/agendar"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))]"
              >
                Agendar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
