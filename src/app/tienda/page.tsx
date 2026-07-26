import type { Metadata } from 'next';
import VetaTienda from '@/components/specialized/tienda/VetaTienda';
import { getPublicStoreProducts } from '@/server/public-site-data';
import { buildBreadcrumbSchema, serializeJsonLd } from '@/lib/veta/seo/schemaGenerator';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tienda de Muebles a Medida en Bogotá | Veta Dorada',
  description:
    'Explora nuestra colección de muebles, closets y cocinas integrales con precio publicado. Fabricación a medida en Bogotá con materiales premium y diseño 3D.',
};

export default async function StorePage() {
  const products = await getPublicStoreProducts();

  const schemas: Record<string, unknown>[] = [
    buildBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Tienda', url: '/tienda' },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.nombre,
          url: `/tienda/${product.slug_publico}`,
        },
      })),
    },
  ];

  return (
    <>
      <script
        id="tienda-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }}
      />
      <VetaTienda />
    </>
  );
}
