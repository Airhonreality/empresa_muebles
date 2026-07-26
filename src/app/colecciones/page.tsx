import type { Metadata } from 'next';
import PublicCollections from '@/components/specialized/public/PublicCollections';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Colecciones de Muebles a Medida en Bogotá | Veta Dorada',
  description:
    'Descubre nuestras colecciones de mobiliario con precio y disponibilidad clara. Closets, cocinas integrales y piezas especiales fabricadas en Bogotá.',
};

export default function CollectionsPage() { return <PublicCollections />; }
