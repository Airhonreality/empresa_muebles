import { Button } from "@/components/veta/button";
import { Badge } from "@/components/veta/badge";
import { WebGLHeroWrapper } from '@/components/veta/webgl-hero-wrapper';

/* F-01 · Landing público (PoC del D4 §Ola4-Objetivo 1).
   Valida: display tipográfico público, paleta Luz y Biofilia, layout seccional. */
export default function LandingPage() {
  const obras = [
    { titulo: "Biblioteca roble americano", tipo: "Proyecto fijo", palo: "Roble" },
    { titulo: "Escritorio flotante nogal", tipo: "A medida", palo: "Nogal" },
    { titulo: "Cocina integral cedro", tipo: "Proyecto fijo", palo: "Cedro" },
  ];

  return (
    <main className="flex-1">
      {/* Header hereda del layout raíz; hero aquí */}
      <section className="relative border-b border-border-subtle bg-bg-paper overflow-hidden">
        <WebGLHeroWrapper />
        {/* CSS Fallback hero (partículas CSS @keyframes) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--gold-300)_0%,_transparent_70%)] opacity-30" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:py-28">
          <div>
          <Badge tone="neutral" dot>
            Normativa Veta Dorada
          </Badge>
          <h1 className="mt-6 font-display text-display-publico font-semibold leading-tight text-text-display">
            Muebles que se construyen
            <span className="text-brand"> como madera de veta dorada</span>,
            pieza a pieza.
          </h1>
          <p className="mt-5 max-w-2xl text-lead leading-relaxed text-text-muted">
            El taller de Hermanos García González S.A.S. Tallamos, armamos y damos
            vida a muebles técnicos y vivienda en madera, con el oficio que solo
            da la experiencia.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button>Cotizar un proyecto</Button>
            <Button variant="secondary">Ver portafolio</Button>
          </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-border-subtle bg-bg-raised p-6 shadow-sm lg:justify-self-end lg:w-full">
            <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Señales de sistema
            </p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { k: "3", v: "superficies piloto" },
                { k: "1", v: "lenguaje visual" },
                { k: "0", v: "tokens inventados" },
              ].map((item) => (
                <div key={item.v} className="rounded-md bg-bg-alt p-4">
                  <p className="font-display text-xl font-semibold text-text-heading">{item.k}</p>
                  <p className="mt-1 text-sm text-text-muted">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Destacados / obras */}
      <section className="bg-surface-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-text-heading">
            Obras recientes
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {obras.map((o) => (
              <article
                key={o.titulo}
                className="rounded-md border border-border-subtle bg-bg-raised p-6 shadow-xs transition-all duration-soft hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-4 h-28 rounded-sm bg-skeleton-bg" aria-hidden />
                <h3 className="font-display text-lg font-semibold text-text-heading">
                  {o.titulo}
                </h3>
                <p className="mt-1 text-sm font-medium text-gold-700">{o.palo}</p>
                <p className="mt-1 text-sm text-text-muted">{o.tipo}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Valores de marca */}
      <section className="bg-charcoal-900 text-bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-gold-200">
            El oficio en tres valores
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {["Precisión de taller", "Madera seleccionada", "Entrega puntual"].map((v) => (
              <div key={v}>
                <div className="h-px w-8 bg-gold-300" aria-hidden />
                <p className="mt-4 text-lg font-medium text-bg-paper">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}