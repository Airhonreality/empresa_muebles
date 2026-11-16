'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { waUrl, obtenerCanal } from '@/lib/contacto';

interface AsesoriaModalPisosProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AsesoriaModalPisos({ isOpen, onClose }: AsesoriaModalPisosProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const canal = obtenerCanal('pisos');
  const leadId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : '00000000-0000-0000-0000-000000000000';
  const texto = `Hola ${canal.nombreExperto}, vengo desde la página de pisos de madera y quiero consultar por el diagnóstico de mi piso. Referencia: VD-PISOS-${leadId}`;
  const url = waUrl(canal.whatsapp, texto);

  const digits = telefono.replace(/\D/g, '');
  const isPhoneValid = digits.length >= 10;

  const handleSend = () => {
    if (!isPhoneValid || redirecting) return;
    setRedirecting(true);
    window.location.href = url;
    setTimeout(() => onClose(), 800);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="relative bg-bg-paper w-full max-w-md max-h-[calc(100vh-2rem)] rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col text-left sm:my-8 border border-border-subtle/50 animate-slide-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-none flex items-center justify-between p-6 border-b border-border-subtle bg-bg-paper rounded-t-sm">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 font-semibold mb-1 block">Pisos de Madera</span>
              <h3 className="text-2xl font-display font-medium text-text-heading tracking-tight">Hablar con Jair Daza</h3>
            </div>
            <button onClick={onClose} className="p-2 text-text-muted hover:text-charcoal-950 transition-colors" aria-label="Cerrar">
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <p className="text-sm text-text-muted font-light">
              Déjanos tu nombre y teléfono para que Jair Daza, experto en pisos de madera, te escriba por WhatsApp.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div data-clarity-mask="true">
                <label className="block text-sm font-medium text-text-heading mb-2">Tu Nombre <span className="text-text-muted/70 font-light text-xs">(Opcional)</span></label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full p-2.5 text-sm border border-border-strong/40 rounded-sm bg-bg-alt text-text-primary focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 placeholder:text-text-muted"
                />
              </div>
              <div data-clarity-mask="true">
                <label className="block text-sm font-medium text-text-heading mb-2">Teléfono</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 300 123 4567"
                  className={`w-full p-2.5 text-sm border rounded-sm bg-bg-alt text-text-primary focus:outline-none focus:ring-1 transition-colors border-border-strong/40 focus:border-gold-500 focus:ring-gold-500/20 placeholder:text-text-muted`}
                />
              </div>
            </div>
          </div>
          <div className="flex-none p-6 border-t border-border-subtle bg-bg-paper rounded-b-sm">
            <button
              onClick={handleSend}
              disabled={!isPhoneValid || redirecting}
              className={`w-full py-3.5 uppercase tracking-[0.15em] text-sm font-semibold rounded-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                isPhoneValid && !redirecting
                  ? 'bg-charcoal-950 text-gold-500 hover:text-gold-400 hover:bg-charcoal-900'
                  : 'bg-charcoal-900 text-gold-500/70 cursor-not-allowed'
              }`}
            >
              {redirecting ? 'Abriendo WhatsApp...' : 'Enviar por WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
