'use client';

import Link from 'next/link';
import { useState } from 'react';
import { fireAdsConversion } from '@/lib/analytics/ads-conversion';
import { obtenerCanal, telUrl, waUrl } from '@/lib/contacto';
import { buttonClassName } from '@/components/veta/button';

type CtaTipo = 'whatsapp' | 'telefono';

interface CtaConversionPisosProps {
  tipo: CtaTipo;
  className?: string;
  size?: 'md' | 'lg';
}

export function CtaConversionPisos({
  tipo,
  className = '',
  size = 'lg',
}: CtaConversionPisosProps) {
  const [loading, setLoading] = useState(false);
  const canal = obtenerCanal('pisos');

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    fireAdsConversion('pisos');
    // Pequeña pausa para que el evento de conversión se envíe antes de navegar.
    await new Promise((r) => setTimeout(r, 350));
    window.location.href =
      tipo === 'whatsapp'
        ? waUrl(canal.whatsapp, `Hola, vengo desde su página de pisos de madera y quiero consultar por el diagnóstico de mi piso.`)
        : telUrl(canal.telefono);
  };

  const isWhatsapp = tipo === 'whatsapp';
  return (
    <Link
      href={
        tipo === 'whatsapp'
          ? waUrl(canal.whatsapp, `Hola, vengo desde su página de pisos de madera y quiero consultar por el diagnóstico de mi piso.`)
          : telUrl(canal.telefono)
      }
      onClick={handleClick}
      className={`${buttonClassName(
        'primary',
        size,
        className
      )} ${isWhatsapp ? 'text-white' : 'text-white hover:text-gold-100'}`}
      rel="noopener noreferrer"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Conectando…
        </>
      ) : (
        <>
          {isWhatsapp ? (
            <>
              <span className="text-white/90">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span>Hablar con el experto en pisos</span>
            </>
          ) : (
            <>
              <span className="text-gold-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 011 1.714l-.382 1.146A11 11 0 0111 12.756a1 1 0 01-1.714 1l-.382-1.146A1 1 0 019 14.286V16a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </span>
              <span>Llamar al {canal.telefono.replace('+57 ', '')}</span>
            </>
          )}
        </>
      )}
    </Link>
  );
}
