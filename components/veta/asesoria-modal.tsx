'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { submitLeadAction } from '@/app/actions/lead-actions';

interface AsesoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  precio3dFormatted: string;
}

export function AsesoriaModal({ isOpen, onClose, precio3dFormatted }: AsesoriaModalProps) {
  const [mounted, setMounted] = useState(false);
  const [tipo, setTipo] = useState<'gratis' | '3d' | 'medidas'>('gratis');
  const [ubicacion, setUbicacion] = useState('Bogotá D.C.');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'redirecting'>('idle');

  // Asegurar que solo usamos Portal en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Efecto: Tecla Escape, Bloqueo de Scroll y Limpieza
  useEffect(() => {
    if (!isOpen) {
      setFormStatus('idle'); // Reset por si vuelve de estado zombie
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Bloquear el scroll del body
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, onClose]);

  // 2. Manejador del reseteo Zombi (pageshow) - por si usa el botón Atrás
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setFormStatus('idle');
        onClose();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [onClose]);

  const digitsLength = telefono.replace(/\D/g, '').length;
  const isPhoneValid = digitsLength >= 10;
  const showPhoneWarning = digitsLength > 0 && digitsLength < 10;

  if (!isOpen || !mounted) return null;

  const executeRedirect = (url: string) => {
    setFormStatus('redirecting');
    
    const gtagFn = typeof window !== 'undefined' ? (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag : undefined;
    if (gtagFn) {
      try {
        const sendTo = process.env.NEXT_PUBLIC_GTAG_SEND_TO || 'AW-10970379192/55ciCNWI4ZQZELjniu8o';
        gtagFn('event', 'conversion', { send_to: sendTo });
      } catch {
        // Ignorar
      }
    }

    // Abordaje Axiomático: Navegación directa en la misma pestaña para evadir Popup Blockers y forzar Deep Linking en móviles
    window.location.href = url;
    
    // Limpieza resiliente
    setTimeout(() => {
      if (formStatus !== 'idle') {
        onClose();
      }
    }, 800);
  };

  const handleWhatsApp = async () => {
    if (!isPhoneValid || formStatus !== 'idle') return;

    setFormStatus('submitting');
    
    const tipoProyectoTexto = tipo === 'gratis' ? 'Asesoría Base' : tipo === '3d' ? 'Asesoría 3D' : 'Cotización con medidas';
    const fallbackUrl = `https://api.whatsapp.com/send/?phone=573025922101&text=${encodeURIComponent(`Hola, me interesa la ${tipoProyectoTexto}. Mi proyecto es en ${ubicacion}.`)}`;

    try {
      const gclid = typeof window !== 'undefined' ? sessionStorage.getItem('veta_gclid') || undefined : undefined;
      const wbraid = typeof window !== 'undefined' ? sessionStorage.getItem('veta_wbraid') || undefined : undefined;
      const gbraid = typeof window !== 'undefined' ? sessionStorage.getItem('veta_gbraid') || undefined : undefined;
      const utmSource = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_source') || undefined : undefined;
      const utmMedium = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_medium') || undefined : undefined;
      const utmCampaign = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_campaign') || undefined : undefined;
      const utmTerm = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_term') || undefined : undefined;
      const utmContent = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_content') || undefined : undefined;

      const fetchPromise = submitLeadAction({
        nombre: nombre.trim() || 'Cliente Web',
        telefono: telefono.trim(),
        tipoProyecto: tipoProyectoTexto,
        ubicacion,
        gclid,
        wbraid,
        gbraid,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      });

      // Patrón Circuit Breaker: si Neon DB o Vercel Actions tardan más de 1.5s, forzamos el fallo
      const timeoutPromise = new Promise<{ whatsappUrl?: string }>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout_Circuit_Breaker')), 1500);
      });

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      const targetUrl = result.whatsappUrl || fallbackUrl;
      executeRedirect(targetUrl);

    } catch (error) {
      console.error('Fallback activado: Error al procesar lead', error);
      // Graceful Degradation: El usuario igual va a WhatsApp con la URL estática
      executeRedirect(fallbackUrl);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div 
          className="relative bg-bg-paper w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col text-left sm:my-8 border border-border-subtle/50 animate-slide-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
        <div className="flex-none flex items-center justify-between p-6 border-b border-border-subtle bg-bg-paper rounded-t-sm">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 font-semibold mb-1 block">Asesoría VIP</span>
            <h3 className="text-2xl font-display font-medium text-text-heading tracking-tight">Inicia tu proyecto</h3>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-charcoal-950 transition-colors" aria-label="Cerrar">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tipo de Asesoría */}
          <div>
            <label className="block text-sm font-medium text-text-heading mb-3">¿Cómo prefieres empezar?</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex flex-col p-3 border rounded-sm cursor-pointer transition-colors ${tipo === 'gratis' ? 'border-gold-500 bg-gold-500/5 shadow-sm' : 'border-border-strong/40 hover:border-gold-500/30'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="tipo" value="gratis" checked={tipo === 'gratis'} onChange={() => setTipo('gratis')} className="mr-2 accent-gold-600" />
                  <span className="font-medium text-sm text-text-heading leading-none">Asesoría Base</span>
                </div>
                <div className="text-xs text-text-muted ml-5 leading-tight mt-1">Gratis. Visita, medidas y cotización.</div>
              </label>

              <label className={`flex flex-col p-3 border rounded-sm cursor-pointer transition-colors ${tipo === '3d' ? 'border-gold-500 bg-gold-500/5 shadow-sm' : 'border-border-strong/40 hover:border-gold-500/30'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="tipo" value="3d" checked={tipo === '3d'} onChange={() => setTipo('3d')} className="mr-2 accent-gold-600" />
                  <span className="font-medium text-sm text-text-heading leading-none">Premium (3D)</span>
                </div>
                <div className="text-xs text-text-muted ml-5 leading-tight mt-1">+ Render 3D ({precio3dFormatted})</div>
              </label>

              <label className={`col-span-2 flex flex-col p-3 border rounded-sm cursor-pointer transition-colors ${tipo === 'medidas' ? 'border-gold-500 bg-gold-500/5 shadow-sm' : 'border-border-strong/40 hover:border-gold-500/30'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="tipo" value="medidas" checked={tipo === 'medidas'} onChange={() => setTipo('medidas')} className="mr-2 accent-gold-600" />
                  <span className="font-medium text-sm text-text-heading leading-none">Cotizar con mis medidas</span>
                </div>
                <div className="text-xs text-text-muted ml-5 leading-tight mt-1">Si ya tienes un plano o diseño previo, envíalo y te cotizamos directamente.</div>
              </label>
            </div>
          </div>

          {/* Nombre y Ubicación */}
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

            <div>
              <label className="block text-sm font-medium text-text-heading mb-2">Ciudad del proyecto</label>
              <select 
                value={ubicacion} 
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full p-2.5 text-sm border border-border-strong/40 rounded-sm bg-bg-alt text-text-primary focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20"
              >
                <option value="Bogotá D.C.">Bogotá D.C.</option>
                <option value="Chía / Cajicá / Cota">Chía / Cajicá / Cota</option>
                <option value="otro">Otro municipio</option>
              </select>
            </div>
          </div>

          {/* Teléfono WhatsApp */}
          <div data-clarity-mask="true">
            <label className="block text-sm font-medium text-text-heading mb-2">¿A qué número enviamos tu cotización?</label>
            <input 
              type="tel"
              autoComplete="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 300 123 4567"
              className={`w-full p-2.5 text-sm border rounded-sm bg-bg-alt text-text-primary focus:outline-none focus:ring-1 transition-colors ${showPhoneWarning ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-border-strong/40 focus:border-gold-500 focus:ring-gold-500/20'} placeholder:text-text-muted`}
            />
            {showPhoneWarning && (
              <p className="text-red-500 text-xs mt-1.5 font-light animate-slide-in">
                Ingresa al menos 10 dígitos.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none p-6 border-t border-border-subtle bg-bg-paper rounded-b-sm">
          {ubicacion === 'otro' ? (
            <div className="p-4 bg-red-900/5 border border-red-900/10 rounded-sm text-center">
              <p className="text-red-700 font-medium text-sm">Lo sentimos, por ahora solo prestamos servicio de diseño e instalación en Bogotá y la Sabana.</p>
            </div>
          ) : (
            <>
              <button 
                onClick={handleWhatsApp}
                disabled={!isPhoneValid || formStatus !== 'idle'}
                className={`w-full py-3.5 uppercase tracking-[0.15em] text-sm font-semibold rounded-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  isPhoneValid && formStatus === 'idle'
                    ? 'bg-charcoal-950 text-gold-500 hover:text-gold-400 hover:bg-charcoal-900 shadow-md' 
                    : formStatus !== 'idle'
                    ? 'bg-charcoal-900 text-gold-500/70 cursor-wait shadow-inner'
                    : 'bg-bg-paper text-gold-500/50 border border-gold-500/20 shadow-none cursor-not-allowed'
                }`}
              >
                {formStatus === 'submitting' ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                    Conectando...
                  </>
                ) : formStatus === 'redirecting' ? (
                  'Abriendo WhatsApp...'
                ) : (
                  'Ir a WhatsApp'
                )}
              </button>
              <p className="text-center text-xs text-text-muted mt-4 font-light">Un diseñador te atenderá directamente para coordinar los detalles.</p>
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
