import type { Metadata } from 'next';
import VetaEspacios from '@/components/specialized/VetaEspacios';
import VetaFooter from '@/components/specialized/VetaFooter';
import VetaHeader from '@/components/specialized/VetaHeader';

export const metadata: Metadata = {
  title: 'Espacios a medida | Veta Dorada',
  description: 'Diseño, fabricación e instalación de muebles a medida para cocinas, closets, cavas, entretenimiento y home office en Bogotá.',
};

export default function EspaciosPage() {
  return (
    <div className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg-warm-paper))]">
      <VetaHeader />
      <VetaEspacios />
      <VetaFooter />
    </div>
  );
}
