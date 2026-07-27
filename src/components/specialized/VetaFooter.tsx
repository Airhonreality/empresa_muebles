'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Instagram, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { VetaEmbudoModal } from './VetaEmbudoModal';

const BRAND_LABEL = 'VETA DORADA';
const WHATSAPP_NUM = '+57 302 592 2101';
const WHATSAPP_LINK = 'https://wa.me/573025922101';
const INSTAGRAM_URL = 'https://instagram.com/veta.dorada';
const TIKTOK_URL = '';
const DIRECCION_TALLER = 'Carrera 72A # 71A-57, Bogotá D.C., Colombia';
const CIUDAD_OPERACION = 'Bogotá D.C.';
const NIT_LEGAL = '901421357';
const NOMBRE_EMPRESA = 'Hermanos García González SAS';

export default function VetaFooter() {
  const [embudoOpen, setEmbudoOpen] = useState(false);

  return (
    <>
      <footer className="veta-surface-matte rounded-none border-x-0 border-b-0 py-[var(--veta-space-lg)] text-[hsl(var(--veta-text-carbon))]">
        <div className="mx-auto mb-16 grid max-w-7xl gap-12 px-6 md:grid-cols-4">
          <div className="space-y-5 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 select-none">
              <img src="/logo_veta_dorada_positive.svg" alt="VETA DORADA" className="h-9 w-auto object-contain" />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
              Carpintería arquitectónica de alta precisión, con diseño, fabricación e instalación para hogares en Bogotá.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 transition-colors hover:border-[hsl(var(--veta-gold-muted))]"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              {TIKTOK_URL && (
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 text-xs font-bold transition-colors hover:border-[hsl(var(--veta-gold-muted))]"
                  aria-label="TikTok"
                >
                  <span>TT</span>
                </a>
              )}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 transition-colors hover:border-[hsl(var(--veta-gold-muted))]"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="veta-heading text-xs font-bold uppercase tracking-[0.22em] text-[hsl(var(--veta-text-carbon))]">Navegación</h4>
            <ul className="space-y-2.5 text-sm text-[hsl(var(--veta-text-stone))]">
              <li>
                <Link href="/#espacios-hud" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
                  Espacios a Medida
                </Link>
              </li>
              <li>
                <Link href="/tienda" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
                  Tienda
                </Link>
              </li>
              <li>
                <Link href="/portafolio" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
                  Portafolio
                </Link>
              </li>
              <li>
                <Link href="/colecciones" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
                  Colecciones
                </Link>
              </li>
              <li>
                <Link href="/agendar" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
                  Formulario de agenda
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="veta-heading text-xs font-bold uppercase tracking-[0.22em] text-[hsl(var(--veta-text-carbon))]">Contacto</h4>
            <ul className="space-y-3 text-sm text-[hsl(var(--veta-text-stone))]">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <span>{DIRECCION_TALLER}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <span>{WHATSAPP_NUM}</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <span>{CIUDAD_OPERACION}</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setEmbudoOpen(true)}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[hsl(var(--veta-gold-muted))] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))]"
            >
              Agendar visita
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-[hsl(var(--veta-glass-light-border))] px-6 pt-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-xs tracking-wide text-[hsl(var(--veta-text-stone))]">
              © {new Date().getFullYear()} VETA DORADA. Todos los derechos reservados.
            </p>
            <p className="text-[11px] text-[hsl(var(--veta-text-stone))]">
              Operado legalmente por <strong className="text-[hsl(var(--veta-text-carbon))]">{NOMBRE_EMPRESA}</strong> - NIT {NIT_LEGAL}
            </p>
          </div>

          <div className="flex items-center justify-center gap-5 text-[11px] text-[hsl(var(--veta-text-stone))]">
            <Link href="/#espacios-hud" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
              Espacios a medida
            </Link>
            <span className="h-1 w-1 rounded-full bg-[hsl(var(--veta-gold-muted))]" />
            <Link href="/portafolio" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
              Portafolio
            </Link>
          </div>
        </div>
      </footer>

      <VetaEmbudoModal configRecords={configRecords} open={embudoOpen} onOpenChange={setEmbudoOpen} />
    </>
  );
}
