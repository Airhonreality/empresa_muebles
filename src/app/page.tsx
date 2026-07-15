import VetaHome from '@/components/specialized/VetaHome';
import { buildLocalBusinessSchema, buildWebsiteSchema, readCommercialConfig, serializeJsonLd } from '@/lib/veta/seo/schemaGenerator';
import { getPublicHomeContent } from '@/server/public-site-data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const publicContent = await getPublicHomeContent();
  const commercialConfig = readCommercialConfig(publicContent.commercial_config);
  const homeSchemas = [
    buildWebsiteSchema(),
    buildLocalBusinessSchema(commercialConfig, publicContent.testimonials),
  ];

  return (
    <>
      <script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeSchemas) }}
      />
      <VetaHome publicContent={publicContent} />
    </>
  );
}
