'use client';
import { useState } from 'react';
import { AsesoriaModal } from './asesoria-modal';

interface AsesoriaBotonProps {
  precio3dFormatted: string;
  children: React.ReactNode;
  className?: string;
}

export function AsesoriaBoton({ precio3dFormatted, children, className = '' }: AsesoriaBotonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={className || "px-8 py-4 bg-gold-600 text-white font-medium rounded-sm hover:bg-gold-700 transition-colors shadow-md w-full sm:w-auto"}
      >
        {children}
      </button>
      <AsesoriaModal isOpen={isOpen} onClose={() => setIsOpen(false)} precio3dFormatted={precio3dFormatted} />
    </>
  );
}
