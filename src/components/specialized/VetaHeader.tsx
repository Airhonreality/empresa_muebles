'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Compass, Layers, Menu, X } from 'lucide-react';
import { getCommercialValue } from '@/lib/veta/config';
import { VetaEmbudoModal } from './VetaEmbudoModal';
import type { PublicCommercialRecord } from '@/lib/veta/public-content';

export default function VetaHeader({ configRecords = [] }: { configRecords?: PublicCommercialRecord[] }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [embudoOpen, setEmbudoOpen] = useState(false);
  const logoPositive = getCommercialValue(configRecords, 'logo_positivo_url', '');
  const brandLabel = getCommercialValue(configRecords, 'brand_label_alternative', 'VETA DORADA');

  const links = [
    { label: 'Espacios a Medida', path: '/#espacios-hud', icon: Compass },
    { label: 'Tienda', path: '/tienda', icon: Layers },
    { label: 'Portafolio', path: '/portafolio', icon: Layers },
    { label: 'Colecciones', path: '/colecciones', icon: Layers },
    { label: 'Agendar', path: '/agendar', icon: Calendar },
  ];

  return (
    <>
      <header className="veta-glass-navbar-light sticky top-0 z-50 w-full rounded-none border-x-0 border-t-0 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-14 max-w-none items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 select-none">
            {logoPositive ? (
              <img src={logoPositive} alt={brandLabel} className="h-7 w-auto object-contain sm:h-8" />
            ) : (
              <div className="flex flex-col">
                <span className="veta-heading text-[0.95rem] font-semibold tracking-[0.08em] uppercase text-[hsl(var(--veta-text-carbon))] sm:text-[1rem]">
                  {brandLabel}
                </span>
                <span className="text-[8px] uppercase tracking-[0.32em] text-[hsl(var(--veta-text-stone))] sm:text-[9px] sm:tracking-[0.42em]">
                  estudio de carpintería
                </span>
              </div>
            )}
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={[
                    'relative flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors xl:text-xs',
                    isActive
                      ? 'text-[hsl(var(--veta-gold-hover))]'
                      : 'text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {isActive && <span className="absolute -bottom-2 left-0 h-px w-full bg-[hsl(var(--veta-gold-hover))]" />}
                </Link>
              );
            })}
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
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      'flex items-center gap-3 rounded-2xl border px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em]',
                      isActive
                        ? 'border-[hsl(var(--veta-gold-muted))] bg-[hsl(var(--veta-bg-linen))] text-[hsl(var(--veta-text-carbon))]'
                        : 'border-[hsl(var(--veta-glass-light-border))] text-[hsl(var(--veta-text-stone))]',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
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
                Agendar
              </button>
            </div>
          </div>
        )}
      </header>

      <VetaEmbudoModal configRecords={configRecords} open={embudoOpen} onOpenChange={setEmbudoOpen} />
    </>
  );
}
