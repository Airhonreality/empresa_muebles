'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ChevronDown, Menu, X } from 'lucide-react';
import { VetaEmbudoModal } from './VetaEmbudoModal';

export default function VetaHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [embudoOpen, setEmbudoOpen] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(false);
  const [mobileSpacesOpen, setMobileSpacesOpen] = useState(false);

  const spacesLinks = [
    { label: 'Cocinas', path: '/cocinas-integrales-bogota' },
    { label: 'Closets y vestidores', path: '/closets-vestidores-bogota' },
    { label: 'Cavas y bares', path: '/cavas-y-bares' },
    { label: 'Centros de entretenimiento', path: '/centros-de-entretenimiento' },
    { label: 'Estudios y home office', path: '/estudios-home-office' },
    { label: 'Ver todos los espacios', path: '/espacios' },
  ];

  const isActive = (path: string) => pathname === path;
  const isSpacesActive = spacesLinks.some((item) => isActive(item.path)) || pathname === '/espacios';

  return (
    <>
      <header className="veta-glass-navbar-light sticky top-0 z-50 w-full rounded-none border-x-0 border-t-0 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-14 max-w-none items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 select-none">
            <img src="/logo_veta_dorada_positive.svg" alt="VETA DORADA" className="h-7 w-auto object-contain sm:h-8" />
            <div className="flex flex-col">
              <span className="veta-heading text-[0.95rem] font-semibold tracking-[0.08em] uppercase text-[hsl(var(--veta-text-carbon))] sm:text-[1rem]">
                VETA DORADA
              </span>
              <span className="text-[8px] uppercase tracking-[0.32em] text-[hsl(var(--veta-text-stone))] sm:text-[9px] sm:tracking-[0.42em]">
                estudio de carpintería
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegación principal">
            <Link
              href="/"
              className={[
                'relative text-[11px] font-medium uppercase tracking-[0.16em] transition-colors xl:text-xs',
                isActive('/')
                  ? 'text-[hsl(var(--veta-gold-hover))]'
                  : 'text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]',
              ].join(' ')}
            >
              Inicio
              {isActive('/') && <span className="absolute -bottom-2 left-0 h-px w-full bg-[hsl(var(--veta-gold-hover))]" />}
            </Link>

            <details
              className="group relative"
              open={spacesOpen}
              onToggle={(event) => setSpacesOpen(event.currentTarget.open)}
            >
              <summary
                className={[
                  'list-none cursor-pointer text-[11px] font-medium uppercase tracking-[0.16em] transition-colors xl:text-xs',
                  isSpacesActive
                    ? 'text-[hsl(var(--veta-gold-hover))]'
                    : 'text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]',
                ].join(' ')}
              >
                <span className="inline-flex items-center gap-1">
                  Espacios
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="absolute left-0 top-full mt-3 w-72 rounded-3xl border border-[hsl(var(--veta-glass-light-border))] bg-[rgba(252,251,249,0.98)] p-2 shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                {spacesLinks.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={[
                        'block rounded-2xl px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors',
                        active
                          ? 'bg-[hsl(var(--veta-bg-linen))] text-[hsl(var(--veta-text-carbon))]'
                          : 'text-[hsl(var(--veta-text-stone))] hover:bg-[hsl(var(--veta-bg-linen))] hover:text-[hsl(var(--veta-text-carbon))]',
                      ].join(' ')}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </details>

            <Link
              href="/portafolio"
              className={[
                'relative text-[11px] font-medium uppercase tracking-[0.16em] transition-colors xl:text-xs',
                isActive('/portafolio')
                  ? 'text-[hsl(var(--veta-gold-hover))]'
                  : 'text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]',
              ].join(' ')}
            >
              Portafolio
              {isActive('/portafolio') && <span className="absolute -bottom-2 left-0 h-px w-full bg-[hsl(var(--veta-gold-hover))]" />}
            </Link>

            <Link
              href="/proceso"
              className={[
                'relative text-[11px] font-medium uppercase tracking-[0.16em] transition-colors xl:text-xs',
                isActive('/proceso')
                  ? 'text-[hsl(var(--veta-gold-hover))]'
                  : 'text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]',
              ].join(' ')}
            >
              Proceso
              {isActive('/proceso') && <span className="absolute -bottom-2 left-0 h-px w-full bg-[hsl(var(--veta-gold-hover))]" />}
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => setEmbudoOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))] lg:px-5 lg:text-xs"
            >
              <Calendar className="h-4 w-4" />
              Agendar
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] text-[hsl(var(--veta-text-carbon))] lg:hidden"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[hsl(var(--veta-glass-light-border))] bg-[rgba(252,251,249,0.94)] px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={[
                  'flex min-h-[44px] items-center rounded-2xl border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em]',
                  isActive('/')
                    ? 'border-[hsl(var(--veta-gold-muted))] bg-[hsl(var(--veta-bg-linen))] text-[hsl(var(--veta-text-carbon))]'
                    : 'border-[hsl(var(--veta-glass-light-border))] text-[hsl(var(--veta-text-stone))]',
                ].join(' ')}
              >
                Inicio
              </Link>

              <div className="rounded-2xl border border-[hsl(var(--veta-glass-light-border))]">
                <button
                  type="button"
                  onClick={() => setMobileSpacesOpen((value) => !value)}
                  className={[
                    'flex min-h-[44px] w-full items-center justify-between rounded-2xl px-4 py-2 text-left text-[11px] font-medium uppercase tracking-[0.16em]',
                    isSpacesActive
                      ? 'bg-[hsl(var(--veta-bg-linen))] text-[hsl(var(--veta-text-carbon))]'
                      : 'text-[hsl(var(--veta-text-stone))]',
                  ].join(' ')}
                  aria-expanded={mobileSpacesOpen}
                  aria-controls="veta-mobile-spaces"
                >
                  <span>Espacios</span>
                  <ChevronDown className={['h-4 w-4 transition-transform', mobileSpacesOpen ? 'rotate-180' : ''].join(' ')} />
                </button>
                {mobileSpacesOpen && (
                  <div id="veta-mobile-spaces" className="border-t border-[hsl(var(--veta-glass-light-border))] p-2">
                    {spacesLinks.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={[
                            'block rounded-2xl px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em]',
                            active
                              ? 'bg-[hsl(var(--veta-bg-linen))] text-[hsl(var(--veta-text-carbon))]'
                              : 'text-[hsl(var(--veta-text-stone))]',
                          ].join(' ')}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <Link
                href="/portafolio"
                onClick={() => setMobileMenuOpen(false)}
                className={[
                  'flex min-h-[44px] items-center rounded-2xl border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em]',
                  isActive('/portafolio')
                    ? 'border-[hsl(var(--veta-gold-muted))] bg-[hsl(var(--veta-bg-linen))] text-[hsl(var(--veta-text-carbon))]'
                    : 'border-[hsl(var(--veta-glass-light-border))] text-[hsl(var(--veta-text-stone))]',
                ].join(' ')}
              >
                Portafolio
              </Link>

              <Link
                href="/proceso"
                onClick={() => setMobileMenuOpen(false)}
                className={[
                  'flex min-h-[44px] items-center rounded-2xl border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em]',
                  isActive('/proceso')
                    ? 'border-[hsl(var(--veta-gold-muted))] bg-[hsl(var(--veta-bg-linen))] text-[hsl(var(--veta-text-carbon))]'
                    : 'border-[hsl(var(--veta-glass-light-border))] text-[hsl(var(--veta-text-stone))]',
                ].join(' ')}
              >
                Proceso
              </Link>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setEmbudoOpen(true);
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A]"
              >
                <Calendar className="h-4 w-4" />
                Agendar visita
              </button>
            </div>
          </div>
        )}
      </header>

      <VetaEmbudoModal open={embudoOpen} onOpenChange={setEmbudoOpen} />
    </>
  );
}
