import { AgnosticRoutePage } from './agnostic-route-page';
import { getVaultData } from '@/core/server/vault';
import { buildLocalBusinessSchema, buildWebsiteSchema, readCommercialConfig, serializeJsonLd } from '@/lib/veta/seo/schemaGenerator';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const homeData = await getVaultData(['configuracion_comercial', 'testimonios']);
  const commercialConfig = readCommercialConfig(homeData['configuracion_comercial'] as any);
  const homeSchemas = [
    buildWebsiteSchema(),
    buildLocalBusinessSchema(commercialConfig, (homeData['testimonios'] as any[]) || []),
  ];

  return (
    <>
      <script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeSchemas) }}
      />
      <AgnosticRoutePage slug={[]} />
    </>
  );
}
