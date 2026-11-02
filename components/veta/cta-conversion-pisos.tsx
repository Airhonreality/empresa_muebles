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
        ? waUrl(canal.whatsapp, `Hola, me interesa asesoría para restaurar o mantener el piso de madera natural de mi casa. Quiero cuadrar una visita para ver el piso. (Bogotá)`)
        : telUrl(canal.telefono);
  };

  const isWhatsapp = tipo === 'whatsapp';
  return (
    <Link
      href={
        tipo === 'whatsapp'
          ? waUrl(canal.whatsapp, `Hola, me interesa asesoría para restaurar o mantener el piso de madera natural de mi casa. Quiero cuadrar una visita para ver el piso. (Bogotá)`)
          : telUrl(canal.telefono)
      }
      onClick={handleClick}
      className={`${buttonClassName(
        'primary',
        size,
        className
      )} ${isWhatsapp ? 'text-white' : 'text-gold-500 hover:text-gold-700'}`}
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
              <span className="text-white/90">💬</span>
              <span>Hablar con el experto en pisos</span>
            </>
          ) : (
            <>
              <span className="text-gold-600">📞</span>
              <span>Llamar al {canal.telefono.replace('+57 ', '')}</span>
            </>
          )}
        </>
      )}
    </Link>
  );
}
