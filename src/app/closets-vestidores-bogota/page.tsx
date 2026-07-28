import type { Metadata } from 'next';
import VetaEspacioDetail from '@/components/specialized/VetaEspacioDetail';

export const metadata: Metadata = { title: 'Closets y vestidores en Bogotá | Veta Dorada', description: 'Closets y vestidores a medida en Bogotá, diseñados para organizar tu ropa, accesorios y objetos con precisión.' };

export default function ClosetsPage() {
  return <VetaEspacioDetail eyebrow="Closets y vestidores" title="Orden que se adapta a ti." description="Creamos closets y vestidores a medida con una distribución interior clara, materiales durables y detalles que hacen más fácil usar cada día." portfolioCategory="dormitorios_closets" benefits={['Distribución interior según tus hábitos y necesidades de almacenamiento.', 'Módulos, cajones, puertas y accesorios definidos para el espacio real.', 'Acabados y perfiles que integran el mueble con la arquitectura.', 'Diseño, fabricación e instalación en un mismo proceso.']} processNote="Producimos cada módulo con las medidas y especificaciones acordadas, y lo instalamos en el espacio preparado." />;
}
