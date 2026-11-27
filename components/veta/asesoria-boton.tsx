'use client';
import { useState } from 'react';
import { AsesoriaModal } from './asesoria-modal';
import { obtenerPrecioAsesoria3dAction } from '@/lib/data/actions/public';
import { formatearPrecioAsesoria3d, PRECIO_ASESORIA_3D_SIN_DATO } from '@/lib/utils/format';

interface AsesoriaBotonProps {
  /** Si no llega, el botón consulta el parámetro al abrir (sin dato: "tarifa vigente"). */
  precio3dFormatted?: string;
  children: React.ReactNode;
  className?: string;
}

export function AsesoriaBoton({ precio3dFormatted, children, className = '' }: AsesoriaBotonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [precio, setPrecio] = useState(precio3dFormatted || PRECIO_ASESORIA_3D_SIN_DATO);

  const abrir = () => {
    setIsOpen(true);
    if (!precio3dFormatted) {
      obtenerPrecioAsesoria3dAction()
        .then((valor) => setPrecio(formatearPrecioAsesoria3d(valor)))
        .catch(() => setPrecio(PRECIO_ASESORIA_3D_SIN_DATO));
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
