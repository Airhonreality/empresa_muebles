'use client';

import { fireAdsConversion } from '@/lib/analytics/ads-conversion';
import { telUrl, waUrl } from '@/lib/contacto';

interface CtaMovilPisosProps {
  telefono: string;
  whatsapp: string;
}

export function CtaMovilPisos({ telefono, whatsapp }: CtaMovilPisosProps) {
  const texto = `Hola, me interesa asesoría para restaurar o mantener el piso de madera natural de mi casa. Quiero cuadrar una visita para ver el piso. (Bogotá)`;

  const handleLlamar = () => {
    fireAdsConversion('pisos');
    window.location.href = telUrl(telefono);
  };

  const handleWhatsApp = () => {
    fireAdsConversion('pisos');
    window.location.href = waUrl(whatsapp, texto);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:hidden z-50 flex gap-2">
      <button
        onClick={handleLlamar}
        className="flex-1 py-3 rounded-sm bg-charcoal-950 border border-gold-500/30 text-gold-500 font-semibold text-xs uppercase tracking-[0.1em] shadow-lg hover:text-gold-400 hover:bg-charcoal-900 transition-colors"
      >
        📞 Llamar
      </button>
      <button
        onClick={handleWhatsApp}
        className="flex-1 py-3 rounded-sm bg-charcoal-900 border border-gold-500/30 text-white font-semibold text-xs uppercase tracking-[0.1em] shadow-lg hover:text-gold-400 hover:bg-charcoal-800 transition-colors"
      >
        💬 WhatsApp
      </button>
    </div>
  );
}
