'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { submitLeadAction } from '@/app/actions/lead-actions';

interface AsesoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  precio3dFormatted: string;
}

export function AsesoriaModal({ isOpen, onClose, precio3dFormatted }: AsesoriaModalProps) {
  const [tipo, setTipo] = useState<'gratis' | '3d' | 'medidas'>('gratis');
  const [ubicacion, setUbicacion] = useState('Bogotá D.C.');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPhoneValid = telefono.replace(/\D/g, '').length >= 10;

  if (!isOpen) return null;

  const handleWhatsApp = async () => {
    if (!isPhoneValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Rescatar identificadores de atribución de sessionStorage
      const gclid = typeof window !== 'undefined' ? sessionStorage.getItem('veta_gclid') || undefined : undefined;
      const wbraid = typeof window !== 'undefined' ? sessionStorage.getItem('veta_wbraid') || undefined : undefined;
      const gbraid = typeof window !== 'undefined' ? sessionStorage.getItem('veta_gbraid') || undefined : undefined;
      const utmSource = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_source') || undefined : undefined;
      const utmMedium = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_medium') || undefined : undefined;
      const utmCampaign = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_campaign') || undefined : undefined;
      const utmTerm = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_term') || undefined : undefined;
      const utmContent = typeof window !== 'undefined' ? sessionStorage.getItem('veta_utm_content') || undefined : undefined;

      const tipoProyectoTexto = tipo === 'gratis' ? 'Asesoría Base' : tipo === '3d' ? 'Asesoría 3D' : 'Cotización con medidas';

      // 2. Ejecutar Server Action para persistir lead y generar URL de WhatsApp
      const result = await submitLeadAction({
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

      const targetUrl = result.whatsappUrl || `https://wa.me/573025922101`;

      // 3. Resiliencia: Disparar evento a Google Ads (si gtag está presente) con fallback timeout
      let hasRedirected = false;
      const executeRedirect = () => {
        if (!hasRedirected) {
          hasRedirected = true;
          window.open(targetUrl, '_blank');
          setIsSubmitting(false);
          onClose();
        }
      };

      const gtagFn = typeof window !== 'undefined' ? (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag : undefined;
      if (gtagFn) {
        try {
          const sendTo = process.env.NEXT_PUBLIC_GTAG_SEND_TO || 'AW-10970379192/55ciCNWI4ZQZELjniu8o';
          gtagFn('event', 'conversion', {
            send_to: sendTo,
            event_callback: executeRedirect,
          });
        } catch {
          // Ignorar error si adblocker interfiere
        }
      }

      // Fallback: Si Google Ads no responde en 500ms, abrir WhatsApp de todos modos
      setTimeout(executeRedirect, 500);
    } catch (error) {
      console.error('Error al procesar la conversión:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md">
      <div className="flex min-h-full justify-center p-4 sm:p-6 text-center">
        <div className="relative my-auto bg-bg-paper w-full max-w-lg rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col text-left sm:my-8 animate-in fade-in zoom-in-95 duration-200 border border-border-subtle/50">
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
              className="w-full p-2.5 text-sm border border-border-strong/40 rounded-sm bg-bg-alt text-text-primary focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 placeholder:text-text-muted"
            />
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
                disabled={!isPhoneValid || isSubmitting}
                className={`w-full py-3.5 uppercase tracking-[0.15em] text-sm font-semibold rounded-sm transition-all duration-300 ${
                  isPhoneValid && !isSubmitting 
                    ? 'bg-charcoal-950 text-gold-500 hover:text-gold-400 hover:bg-charcoal-900 shadow-md' 
                    : 'bg-bg-alt text-text-muted/50 border border-border-subtle cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Conectando...' : 'Ir a WhatsApp'}
              </button>
              <p className="text-center text-xs text-text-muted mt-4 font-light">Un diseñador te atenderá directamente para coordinar los detalles.</p>
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
