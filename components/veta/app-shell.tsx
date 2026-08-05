'use client';

import Link from 'next/link';
import { NavItem } from '@/components/veta/nav-item';

const navigation = [
  { href: '/', label: 'Inicio', desc: 'Hub PoC' },
  { href: '/landing', label: 'Landing', desc: 'Público / marca' },
  { href: '/cotizador', label: 'Cotizador', desc: 'ERP comercial' },
  { href: '/cronograma', label: 'Cronograma', desc: 'ERP operativo' },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-100">
      <header className="border-b border-border-subtle bg-bg-raised/80 backdrop-blur-sm sticky top-0 z-nav">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-text-heading" aria-label="Veta Dorada - Inicio">
              <span className="text-brand">Veta</span> Dorada
            </Link>
            <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
              {navigation.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </nav>
            <div className="md:hidden">
              <button className="p-2 rounded-sm text-text-muted hover:text-text-primary" aria-label="Menú móvil">
                ☰
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1" id="main-content">
        {children}
      </main>

      <footer className="border-t border-border-subtle bg-bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-text-muted">
          <p>Hermanos García González S.A.S. · Taller de carpintería arquitectónica</p>
          <p className="mt-1">Veta Dorada Real · Diamante 4 · PoC 3</p>
        </div>
      </footer>
    </div>
  );
}