'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { buttonClassName } from '@/components/veta/button';
import { ModalAsistente } from './ModalAsistente';

/**
 * Montado una sola vez en app/erp/layout.tsx. Botón flotante y atajo Ctrl+/ (Cmd+/).
 * `puedeConfigurar` solo oculta la pestaña; el servidor vuelve a verificar el rol en cada ruta.
 */
export function AsistenteProvider({ puedeConfigurar }: { puedeConfigurar: boolean }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    function alPresionar(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setAbierto((v) => !v);
      }
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir asistente (Ctrl+/)"
        className={`${buttonClassName('primary', 'lg', 'fixed bottom-6 right-6 z-modal rounded-full shadow-lg')}`}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Asistente</span>
      </button>
      <ModalAsistente open={abierto} onClose={() => setAbierto(false)} puedeConfigurar={puedeConfigurar} />
    </>
  );
}
