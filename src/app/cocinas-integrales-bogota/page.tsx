import type { Metadata } from 'next';
import VetaEspacioDetail from '@/components/specialized/VetaEspacioDetail';

export const metadata: Metadata = { title: 'Cocinas integrales en Bogotá | Veta Dorada', description: 'Diseño y fabricación de cocinas integrales a medida en Bogotá, con visualización 3D, materiales seleccionados e instalación.' };

export default function CocinasPage() {
  return <VetaEspacioDetail eyebrow="Cocinas a medida" title="Cocinas que organizan tu forma de vivir." description="Diseñamos cocinas integrales a medida para aprovechar cada centímetro, ordenar el trabajo diario y lograr un espacio coherente con tu casa." portfolioCategory="cocinas" benefits={['Distribuciones pensadas para tu rutina y las medidas reales del espacio.', 'Selección de frentes, interiores, mesones y herrajes según el proyecto.', 'Visualización previa para revisar la propuesta antes de fabricar.', 'Fabricación e instalación coordinadas por Veta Dorada.']} processNote="Fabricamos la solución aprobada en nuestro taller y coordinamos una instalación cuidada en tu espacio." />;
}
