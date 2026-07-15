import Link from 'next/link';
import { Calendar, Layers, MessageCircle } from 'lucide-react';

const navigation = [
  { href: '/', label: 'Espacios a medida' },
  { href: '/tienda', label: 'Tienda' },
  { href: '/portafolio', label: 'Portafolio' },
  { href: '/colecciones', label: 'Colecciones' },
  { href: '/agendar', label: 'Agendar' },
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
        <nav className="hidden items-center gap-5 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-[11px] font-medium uppercase tracking-[0.16em] text-[hsl(var(--veta-text-stone))] transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/agendar" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A]">
          <Calendar className="h-4 w-4" /> Agendar
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
          <Link href="/tienda" className="inline-flex items-center gap-2 hover:text-[hsl(var(--veta-text-carbon))]"><Layers className="h-4 w-4" /> Tienda</Link>
          <Link href="/agendar" className="inline-flex items-center gap-2 hover:text-[hsl(var(--veta-text-carbon))]"><MessageCircle className="h-4 w-4" /> Contacto</Link>
        </div>
      </div>
    </footer>
  );
}
