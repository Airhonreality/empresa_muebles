import type { Metadata } from 'next';
import VetaEspacioDetail from '@/components/specialized/VetaEspacioDetail';

export const metadata: Metadata = { title: 'Cavas y bares a medida | Veta Dorada', description: 'Diseño y fabricación de cavas, bares y muebles para compartir en Bogotá.' };

export default function CavasPage() {
  return <VetaEspacioDetail eyebrow="Cavas y bares" title="Un lugar para recibir y compartir." description="Diseñamos cavas y bares que integran almacenamiento, exhibición y una experiencia social dentro de tu casa o proyecto." portfolioCategory="cavas_bares" benefits={['Composición a medida para el muro, rincón o ambiente disponible.', 'Espacios para botellas, cristalería, accesorios y apoyo.', 'Materiales y acabados alineados con el carácter del ambiente.', 'Solución fabricada e instalada con atención a los detalles.']} processNote="Fabricamos la composición definida y coordinamos su instalación para que quede integrada al ambiente." />;
}
