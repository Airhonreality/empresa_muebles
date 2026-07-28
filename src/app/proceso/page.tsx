import type { Metadata } from 'next';
import VetaProceso from '@/components/specialized/VetaProceso';

export const metadata: Metadata = {
  title: 'Proceso de diseño y fabricación | Veta Dorada',
  description: 'Conoce el proceso de Veta Dorada para diseñar, fabricar e instalar muebles a medida en Bogotá.',
};

export default function ProcesoPage() {
  return <VetaProceso />;
}
