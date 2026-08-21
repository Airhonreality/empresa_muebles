'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

interface AsesoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  precio3dFormatted: string;
}

export function AsesoriaModal({ isOpen, onClose, precio3dFormatted }: AsesoriaModalProps) {
  const [tipo, setTipo] = useState<'gratis' | '3d' | 'medidas'>('gratis');
  const [ubicacion, setUbicacion] = useState('Bogotá D.C.');
  const [telefono, setTelefono] = useState('');

  const isPhoneValid = telefono.replace(/\D/g, '').length >= 10;

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    // Aquí iría el Server Action que guarda el teléfono y el GCLID (DIFERIDO a Parte II)
    // guardarLead({ telefono, tipo, ubicacion, gclid: getGclidCookie() });
    
    let text = '';
    if (tipo === 'medidas') {
      text = `Hola, vengo del sitio web de Veta Dorada. Ya tengo las medidas/planos de mi proyecto y quiero enviarlos para recibir una cotización. Mi espacio está en ${ubicacion}.`;
    } else {
      const tipoText = tipo === 'gratis' ? 'una Asesoría Gratuita' : 'una Asesoría con Diseño 3D';
      text = `Hola, vengo del sitio web de Veta Dorada. Quiero agendar ${tipoText}. Mi espacio está en ${ubicacion}.`;
    }
    const url = `https://wa.me/573025922101?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/80 backdrop-blur-sm">
      <div className="relative bg-bg-paper w-full max-w-lg rounded-md shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex-none flex items-center justify-between p-6 border-b border-border-subtle bg-bg-surface rounded-t-md">
          <h3 className="text-2xl font-serif text-text-heading">Inicia tu Proyecto</h3>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-heading transition-colors" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tipo de Asesoría */}
          <div>
            <label className="block text-sm font-semibold text-text-heading mb-2">1. ¿Cómo prefieres empezar?</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex flex-col p-3 border rounded-sm cursor-pointer transition-colors ${tipo === 'gratis' ? 'border-gold-600 bg-gold-600/5' : 'border-border-subtle hover:border-gold-600/10'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="tipo" value="gratis" checked={tipo === 'gratis'} onChange={() => setTipo('gratis')} className="mr-2 accent-gold-600" />
                  <span className="font-bold text-sm text-text-heading leading-none">Asesoría Base</span>
                </div>
                <div className="text-xs text-text-primary ml-5 leading-tight">Gratis. Visita, medidas y cotización.</div>
              </label>
              
              <label className={`flex flex-col p-3 border rounded-sm cursor-pointer transition-colors ${tipo === '3d' ? 'border-gold-600 bg-gold-600/5' : 'border-border-subtle hover:border-gold-600/10'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="tipo" value="3d" checked={tipo === '3d'} onChange={() => setTipo('3d')} className="mr-2 accent-gold-600" />
                  <span className="font-bold text-sm text-text-heading leading-none">Premium (3D)</span>
                </div>
                <div className="text-xs text-text-primary ml-5 leading-tight">+ Render 3D ({precio3dFormatted})</div>
              </label>
              
              <label className={`col-span-2 flex flex-col p-3 border rounded-sm cursor-pointer transition-colors ${tipo === 'medidas' ? 'border-gold-600 bg-gold-600/5' : 'border-border-subtle hover:border-gold-600/10'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="tipo" value="medidas" checked={tipo === 'medidas'} onChange={() => setTipo('medidas')} className="mr-2 accent-gold-600" />
                  <span className="font-bold text-sm text-text-heading leading-none">Cotizar con mis medidas</span>
                </div>
                <div className="text-xs text-text-primary ml-5 leading-tight">Si ya tienes un plano o diseño previo, envíalo y te cotizamos directamente.</div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ubicación */}
            <div>
              <label className="block text-sm font-semibold text-text-heading mb-2">2. Ubicación</label>
              <select 
                value={ubicacion} 
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full p-2.5 text-sm border border-border-subtle rounded-sm bg-bg-surface text-text-primary focus:outline-none focus:border-gold-600"
              >
                <option value="Bogotá D.C.">Bogotá D.C.</option>
                <option value="Chía / Cajicá / Cota">Chía / Cajicá / Cota</option>
                <option value="otro">Otro municipio</option>
              </select>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-text-heading mb-2">3. Tu WhatsApp</label>
              <input 
                type="tel"
                autoComplete="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 300 123 4567"
                className="w-full p-2.5 text-sm border border-border-subtle rounded-sm bg-bg-surface text-text-primary focus:outline-none focus:border-gold-600 placeholder:text-text-muted/50"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none p-6 border-t border-border-subtle bg-bg-surface rounded-b-md">
          {ubicacion === 'otro' ? (
            <div className="p-4 bg-red-900/5 border border-red-900/10 rounded-sm text-center">
              <p className="text-red-700 font-medium text-sm">Lo sentimos, por ahora solo prestamos servicio de diseño e instalación en Bogotá y la Sabana.</p>
            </div>
          ) : (
            <>
              <button 
                onClick={handleWhatsApp}
                disabled={!isPhoneValid}
                className={`w-full py-4 text-white font-medium rounded-sm transition-colors text-lg ${isPhoneValid ? 'bg-gold-600 hover:bg-gold-700' : 'bg-gold-600/50 cursor-not-allowed'}`}
              >
                Continuar a WhatsApp
              </button>
              <p className="text-center text-xs text-text-muted mt-4">Un diseñador te atenderá directamente para continuar.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
