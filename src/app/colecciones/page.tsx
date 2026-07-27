import type { Metadata } from 'next';
import PublicCollections from '@/components/specialized/public/PublicCollections';
import { buildMetadata, getSiteIdentity } from '@/lib/seo/metadata-helpers';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  return buildMetadata({
    title: 'Colecciones de Muebles a Medida en Bogotá',
    description:
      'Descubre nuestras colecciones de mobiliario con precio y disponibilidad clara. Closets, cocinas integrales y piezas especiales fabricadas en Bogotá.',
    canonical: `${identity.siteUrl}/colecciones`,
  });
}

export default function CollectionsPage() { return <PublicCollections />; }
