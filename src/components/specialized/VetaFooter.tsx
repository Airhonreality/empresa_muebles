'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppState } from '@/context/AppContext';
import { getCommercialValue } from '@/lib/veta/config';
import { Instagram, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { VetaEmbudoModal } from './VetaEmbudoModal';

export default function VetaFooter() {
  const { data } = useAppState();
  const [embudoOpen, setEmbudoOpen] = useState(false);
  const configRecords = data['configuracion_comercial'] || [];

  const logoPositive = getCommercialValue(configRecords, 'logo_positivo_url', '');
  const brandLabel = getCommercialValue(configRecords, 'brand_label_alternative', 'VETA DORADA');
  const whatsappNum = getCommercialValue(configRecords, 'whatsapp_number', '+57 300 123 4567');
  const whatsappLink = getCommercialValue(configRecords, 'whatsapp_link', 'https://wa.me/573001234567');
  const instagramUrl = getCommercialValue(configRecords, 'instagram_url', 'https://instagram.com/vetadora');
  const tiktokUrl = getCommercialValue(configRecords, 'tiktok_url', 'https://tiktok.com/@vetadorada');
  const direccionTaller = getCommercialValue(configRecords, 'direccion_taller', 'Carrera 72A # 71A-57, Bogotá D.C., Colombia');
  const ciudadOperacion = getCommercialValue(configRecords, 'ciudad_operacion', 'Bogotá D.C.');
  const nitLegal = getCommercialValue(configRecords, 'nit_legal', '901421357');
  const nombreEmpresa = getCommercialValue(configRecords, 'nombre_empresa', 'Hermanos García González SAS');

  return (
    <>
      <footer className="veta-surface-matte rounded-none border-x-0 border-b-0 py-[var(--veta-space-lg)] text-[hsl(var(--veta-text-carbon))]">
        <div className="mx-auto mb-16 grid max-w-7xl gap-12 px-6 md:grid-cols-4">
          <div className="space-y-5 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 select-none">
              {logoPositive ? (
                <img src={logoPositive} alt={brandLabel} className="h-9 w-auto object-contain" />
              ) : (
                <div className="flex flex-col">
                  <span className="veta-heading text-lg font-semibold tracking-[0.08em] uppercase text-[hsl(var(--veta-text-carbon))]">
                    {brandLabel}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.42em] text-[hsl(var(--veta-text-stone))]">
                    estudio de carpintería
                  </span>
                </div>
              )}
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
              Carpintería arquitectónica de alta precisión, con diseño, fabricación e instalación para hogares en Bogotá.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 transition-colors hover:border-[hsl(var(--veta-gold-muted))]"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white/70 text-xs font-bold transition-colors hover:border-[hsl(var(--veta-gold-muted))]"
                  aria-label="TikTok"
                >
                  <span>TT</span>
                </a>
              )}
              <a
                href={whatsappLink}
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
                <span>{direccionTaller}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <span>{whatsappNum}</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                <span>{ciudadOperacion}</span>
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
              Operado legalmente por <strong className="text-[hsl(var(--veta-text-carbon))]">{nombreEmpresa}</strong> - NIT {nitLegal}
            </p>
          </div>

          <div className="flex items-center justify-center gap-5 text-[11px] text-[hsl(var(--veta-text-stone))]">
            <Link href="/terminos" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
              Términos
            </Link>
            <span className="h-1 w-1 rounded-full bg-[hsl(var(--veta-gold-muted))]" />
            <Link href="/privacidad" className="transition-colors hover:text-[hsl(var(--veta-text-carbon))]">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>

      <VetaEmbudoModal open={embudoOpen} onOpenChange={setEmbudoOpen} />
    </>
  );
}
