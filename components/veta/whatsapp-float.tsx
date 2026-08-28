'use client';

import { useEffect, useState } from 'react';
import { AsesoriaModal } from './asesoria-modal';

/* F-00 shell global (§3.2, contenido_F00_shell.md): botón flotante transversal, visible en toda
   página pública. Rediseñado a la mitad de tamaño con estética de marca Veta Dorada (Oro & Carbón).
   Hitbox estrictamente acotado a los 40px del círculo para no bloquear clics ni hovers traseros. */
export function WhatsappFloat() {
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTooltipVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-toast flex items-center justify-center">
        {/* Tooltip Editorial Minimalista (Absoluto y pointer-events-none para no bloquear interacciones) */}
        <span
          role="tooltip"
          className={`absolute right-full mr-2.5 whitespace-nowrap rounded-xs bg-charcoal-950 border border-gold-500/30 px-3 py-1.5 text-right shadow-md backdrop-blur-md transition-all duration-300 pointer-events-none ${
            tooltipVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          <div className="text-[11px] font-medium text-gold-200 leading-tight">¿Hablamos por WhatsApp?</div>
          <div className="text-[9.5px] font-light text-gold-200/60 leading-tight tracking-widest mt-0.5">+57 302 5922101</div>
        </span>

        {/* Botón Compacto Estilo Veta Dorada (Hitbox estricto de 40px x 40px) */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          onFocus={() => setTooltipVisible(true)}
          onBlur={() => setTooltipVisible(false)}
          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal-950/90 border border-gold-500/40 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-gold-500 hover:bg-gold-600 cursor-pointer p-0"
          aria-label="¿Hablamos por WhatsApp?"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-5 w-5 fill-gold-400 transition-colors duration-300 group-hover:fill-white"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.83 14.11c-.24.68-1.42 1.32-1.95 1.4-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.15-4.9-4.35-.14-.19-1.17-1.56-1.17-2.98s.75-2.11 1.02-2.4c.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.38-.41.51-.14.15-.28.31-.12.6.16.29.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.25 1.38.29.14.46.12.63-.07.17-.19.72-.83.91-1.12.19-.29.38-.24.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.53.33.07.12.07.68-.17 1.36Z" />
          </svg>
        </button>
      </div>

      <AsesoriaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        precio3dFormatted="$250.000 COP"
      />
    </>
  );
}
