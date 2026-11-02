'use client';

import { useState } from 'react';
import { ContactoPisosModal } from './contacto-pisos-modal';

interface ContactoPisosBotonProps {
  children?: React.ReactNode;
  className?: string;
}

export function ContactoPisosBoton({ children, className }: ContactoPisosBotonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-charcoal-950 text-gold-500 font-semibold text-sm uppercase tracking-[0.15em] px-8 py-3.5 shadow-md hover:text-gold-400 hover:bg-charcoal-900 transition-colors ${className ?? ''}`}
      >
        {children ?? 'Contactar al experto en pisos'}
      </button>

      <ContactoPisosModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
