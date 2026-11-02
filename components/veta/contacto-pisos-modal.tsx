'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { fireAdsConversion } from '@/lib/analytics/ads-conversion';
import { obtenerCanal, telUrl, waUrl } from '@/lib/contacto';

interface ContactoPisosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactoPisosModal({ isOpen, onClose }: ContactoPisosModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const canal = obtenerCanal('pisos');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleLlamar = () => {
    fireAdsConversion('pisos');
    window.location.href = telUrl(canal.telefono);
  };

  const handleWhatsApp = () => {
    fireAdsConversion('pisos');
    const texto = `Hola, me interesa asesoría para restaurar o mantener el piso de madera natural de mi casa. Quiero cuadrar una visita para ver el piso. (Bogotá)`;
    window.location.href = waUrl(canal.whatsapp, texto);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative bg-bg-paper w-full max-w-md max-h-[calc(100vh-2rem)] rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col text-left sm:my-8 border border-border-subtle/50 animate-slide-in" onClick={(e) => e.stopPropagation()}>
          <div className="flex-none flex items-center justify-between p-6 border-b border-border-subtle bg-bg-paper rounded-t-sm">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 font-semibold mb-1 block">
                Contacto directo
              </span>
              <h3 className="text-2xl font-display font-medium text-text-heading tracking-tight">
                Habla con {canal.nombreExperto ?? 'el experto en pisos'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 text-text-muted hover:text-charcoal-950 transition-colors" aria-label="Cerrar">
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <p className="text-[var(--color-text)] leading-relaxed font-light">
              Asesoría directa por teléfono o WhatsApp. {canal.nombreExperto ?? 'El experto'} te guiará sobre
              restauración y mantenimiento de pisos de madera y cuadrará una visita para ver tu piso sin costo.
            </p>

            <div className="space-y-3">
              <button onClick={handleLlamar} className="w-full py-3.5 flex items-center justify-center gap-3 text-left rounded-sm border border-gold-500/30 bg-charcoal-950 text-gold-500 font-semibold text-sm uppercase tracking-[0.12em] hover:text-gold-400 hover:bg-charcoal-900 transition-colors shadow-md">
                <span className="text-gold-400">📞</span>
                Llamar ahora al {canal.telefono.replace('+57 ', '')}
              </button>
              <button onClick={handleWhatsApp} className="w-full py-3.5 flex items-center justify-center gap-3 text-left rounded-sm border border-gold-500/30 bg-charcoal-900 text-white font-semibold text-sm uppercase tracking-[0.12em] hover:text-gold-400 hover:bg-charcoal-800 transition-colors shadow-md">
                <span className="text-gold-400">💬</span>
                Escribir por WhatsApp
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] font-light text-center">
              Diagnóstico y visita sin costo. Atendemos Bogotá y la Sabana.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
