import type { Metadata } from 'next';
import VetaHome from '@/components/specialized/VetaHome';
import { buildLocalBusinessSchema, buildWebsiteSchema, readCommercialConfig, serializeJsonLd } from '@/lib/veta/seo/vetaSchemas';
import { getPublicHomeContent } from '@/server/public-site-data';
import { getSiteIdentity } from '@/lib/seo/metadata-helpers';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  return {
    title: identity.title,
    description: identity.description,
    alternates: { canonical: identity.siteUrl },
    openGraph: {
      title: identity.title,
      description: identity.description,
      url: identity.siteUrl,
      siteName: identity.name,
      type: 'website',
      images: identity.ogImage ? [identity.ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: identity.title,
      description: identity.description,
      images: identity.ogImage,
      site: identity.twitterHandle,
    },
  };
}

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
