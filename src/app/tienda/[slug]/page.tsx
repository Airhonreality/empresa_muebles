import type { Metadata } from 'next';
import VetaProductoDetalle from '@/components/specialized/tienda/VetaProductoDetalle';
import { getPublicStoreProducts } from '@/server/public-site-data';
import { buildProductSchema, buildBreadcrumbSchema, serializeJsonLd, absoluteUrl } from '@/lib/veta/seo/schemaGenerator';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = await getPublicStoreProducts();
  const product = products.find((p) => p.slug_publico === slug);
  if (!product) return { title: 'Producto no encontrado | Veta Dorada' };

  return {
    title: `${product.nombre} desde $${product.precio_publico.toLocaleString('es-CO')} en Bogotá | Veta Dorada`,
    description: product.descripcion_comercial ?? `Compra ${product.nombre} en Bogotá. Fabricación a medida con materiales premium.`,
    openGraph: {
      title: product.nombre,
      description: product.descripcion_comercial,
      images: product.imagen_url ? [{ url: absoluteUrl(product.imagen_url) }] : [],
    },
  };
}

export default async function StoreProductPage({ params }: Props) {
  const { slug } = await params;
  const products = await getPublicStoreProducts();
  const product = products.find((p) => p.slug_publico === slug);

  const schemas: Record<string, unknown>[] = [
    buildBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Tienda', url: '/tienda' },
      { name: product?.nombre ?? slug, url: `/tienda/${slug}` },
    ]),
  ];

  if (product) {
    schemas.push(buildProductSchema(product));
  }

  return (
    <>
      <script
        id="producto-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }}
      />
      <VetaProductoDetalle />
    </>
  );
}
