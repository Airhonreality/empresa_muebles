'use client';
import { useState } from 'react';
import { AsesoriaModal } from './asesoria-modal';
import { obtenerPrecioAsesoria3dAction } from '@/lib/data/actions/public';

interface AsesoriaBotonProps {
  /** Si no llega, el botón consulta el parámetro al abrir (fallback: precio cerrado $130.000). */
  precio3dFormatted?: string;
  children: React.ReactNode;
  className?: string;
}

function formatearPrecio(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
}

export function AsesoriaBoton({ precio3dFormatted, children, className = '' }: AsesoriaBotonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [precio, setPrecio] = useState(precio3dFormatted || formatearPrecio(130000));

  const abrir = () => {
    setIsOpen(true);
    if (!precio3dFormatted) {
      obtenerPrecioAsesoria3dAction()
        .then((valor) => setPrecio(formatearPrecio(valor || 130000)))
        .catch(() => setPrecio(formatearPrecio(130000)));
    }
  };

  return (
    <>
      <button
        onClick={abrir}
        className={className || "px-8 py-4 bg-gold-600 text-white font-medium rounded-sm hover:bg-gold-700 transition-colors shadow-md w-full sm:w-auto"}
      >
        {children}
      </button>
      <AsesoriaModal isOpen={isOpen} onClose={() => setIsOpen(false)} precio3dFormatted={precio} />
    </>
  );
}
