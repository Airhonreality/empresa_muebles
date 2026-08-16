'use client';

import { useEffect, useState } from 'react';

// Mismo mensaje/número que app/(publico)/page.tsx (WHATSAPP_URL) y contenido_F00_shell.md §3.2.
// No se centraliza en un módulo compartido porque el origen (page.tsx) es un Server/Client
// Component de página, no un módulo pensado para importarse -- mismo criterio que llevó a que
// ese archivo declarara su propio literal en vez de traerlo de otro sitio.
const WHATSAPP_URL =
  'https://wa.me/573025922101?text=Hola%2C%20vengo%20del%20sitio%20web%20de%20Veta%20Dorada%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20espacios%20de%20dise%C3%B1o%20a%20la%20medida.';

/* F-00 shell global (§3.2, contenido_F00_shell.md): botón flotante transversal, visible en toda
   página pública. Tooltip 3s al montar, luego se oculta; reaparece en hover/focus. Ícono oficial
   de WhatsApp sin recolorear (verde de marca, no tokens D4 -- así lo pide el spec). */
export function WhatsappFloat() {
  const [tooltipVisible, setTooltipVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTooltipVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
      className="group fixed bottom-6 right-6 z-toast flex items-center gap-3"
      aria-label="¿Hablamos por WhatsApp?"
    >
      <span
        role="tooltip"
        className={`rounded-sm bg-[#2B2B2B] px-3 py-2 text-sm text-white shadow-lg transition-opacity duration-300 ${
          tooltipVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        ¿Hablamos por WhatsApp?
      </span>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-charcoal-900 shadow-lg transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden className="h-8 w-8">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.83 14.11c-.24.68-1.42 1.32-1.95 1.4-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.15-4.9-4.35-.14-.19-1.17-1.56-1.17-2.98s.75-2.11 1.02-2.4c.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.38-.41.51-.14.15-.28.31-.12.6.16.29.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.25 1.38.29.14.46.12.63-.07.17-.19.72-.83.91-1.12.19-.29.38-.24.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.53.33.07.12.07.68-.17 1.36Z" />
        </svg>
      </span>
    </a>
  );
}
