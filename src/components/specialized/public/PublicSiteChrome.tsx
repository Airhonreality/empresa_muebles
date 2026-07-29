import Link from 'next/link';
import { Calendar, ChevronDown, MessageCircle } from 'lucide-react';

const navigation = [
  { href: '/', label: 'Inicio' },
  { href: '/espacios', label: 'Espacios' },
  { href: '/portafolio', label: 'Portafolio' },
  { href: '/proceso', label: 'Proceso' },
];

const spacesLinks = [
  { href: '/cocinas-integrales-bogota', label: 'Cocinas' },
  { href: '/closets-vestidores-bogota', label: 'Closets y vestidores' },
  { href: '/cavas-y-bares', label: 'Cavas y bares' },
  { href: '/centros-de-entretenimiento', label: 'Centros de entretenimiento' },
  { href: '/estudios-home-office', label: 'Estudios y home office' },
  { href: '/espacios', label: 'Ver todos los espacios' },
];

/** Public-only chrome: it never hydrates the Vault-backed application. */
export function PublicSiteHeader() {
  return (
    <header className="veta-glass-navbar-light sticky top-0 z-50 border-x-0 border-t-0 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex flex-col">
          <span className="veta-heading text-[0.95rem] font-semibold tracking-[0.08em] uppercase text-[hsl(var(--veta-text-carbon))]">Veta Dorada</span>
          <span className="text-[8px] uppercase tracking-[0.32em] text-[hsl(var(--veta-text-stone))]">estudio de carpintería</span>
        </Link>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Navegación principal">
          {navigation.map((item) =>
            item.href === '/espacios' ? (
              <details key={item.href} className="group relative">
                <summary className="list-none cursor-pointer text-[11px] font-medium uppercase tracking-[0.16em] text-[hsl(var(--veta-text-stone))] transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
                  <span className="inline-flex items-center gap-1">
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="absolute left-0 top-full mt-3 w-72 rounded-3xl border border-[hsl(var(--veta-glass-light-border))] bg-[rgba(252,251,249,0.98)] p-2 shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                  {spacesLinks.map((space) => (
                    <Link
                      key={space.href}
                      href={space.href}
                      className="block rounded-2xl px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--veta-text-stone))] transition-colors hover:bg-[hsl(var(--veta-bg-linen))] hover:text-[hsl(var(--veta-text-carbon))]"
                    >
                      {space.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link key={item.href} href={item.href} className="text-[11px] font-medium uppercase tracking-[0.16em] text-[hsl(var(--veta-text-stone))] transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <Link href="/agendar" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A]">
          <Calendar className="h-4 w-4" /> Agendar visita
        </Link>
      </div>
    </header>
  );
}

export function PublicSiteFooter() {
  return (
    <footer className="veta-surface-matte border-x-0 border-b-0 px-6 py-12 text-[hsl(var(--veta-text-carbon))]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="veta-heading text-sm font-semibold uppercase tracking-[0.12em]">Veta Dorada</p>
          <p className="mt-1 text-sm text-[hsl(var(--veta-text-stone))]">Carpintería arquitectónica en Bogotá.</p>
        </div>
        <div className="flex items-center gap-5 text-sm text-[hsl(var(--veta-text-stone))]">
          <Link href="/espacios" className="inline-flex items-center gap-2 hover:text-[hsl(var(--veta-text-carbon))]">Espacios</Link>
          <Link href="/agendar" className="inline-flex items-center gap-2 hover:text-[hsl(var(--veta-text-carbon))]"><MessageCircle className="h-4 w-4" /> Agendar visita</Link>
        </div>
      </div>
    </footer>
  );
}
