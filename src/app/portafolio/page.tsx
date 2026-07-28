import type { Metadata } from 'next';
import VetaPortfolio from '@/components/specialized/portfolio/VetaPortfolio';
import { getPublicPortfolio } from '@/server/public-site-data';
import { buildPortfolioItemSchema, serializeJsonLd } from '@/lib/veta/seo/vetaSchemas';
import { buildMetadata, getSiteIdentity } from '@/lib/seo/metadata-helpers';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const portfolio = await getPublicPortfolio();
  const identity = await getSiteIdentity();
  const projectCount = portfolio.length;

  return buildMetadata({
    title: `Portafolio de Carpintería y Diseño en Bogotá${projectCount > 0 ? ` (${projectCount} proyectos)` : ''}`,
    description: projectCount > 0
      ? `Galería de ${projectCount} proyectos de cocinas integrales, closets empotrados y mobiliario arquitectónico realizados en Bogotá. Diseño 3D y fabricación con materiales premium.`
      : 'Galería de proyectos de cocinas integrales, closets empotrados y mobiliario arquitectónico realizados en Bogotá. Diseño 3D y fabricación con materiales premium.',
    canonical: `${identity.siteUrl}/portafolio`,
  });
}

/** Isolated public route: it bypasses AgnosticShell and receives only the public projection. */
export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const entries = await getPublicPortfolio();
  const portfolioSchemas = entries.map((entry) => buildPortfolioItemSchema({
    id: entry.slug,
    data: {
      slug: entry.slug,
      titulo: entry.titulo,
      descripcion_comercial: entry.descripcion_comercial,
      barrio: entry.zona,
    },
  }));
  const { categoria } = await searchParams;

  return (
    <>
      {portfolioSchemas.length > 0 && (
        <script
          id="portfolio-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(portfolioSchemas) }}
        />
      )}
      <VetaPortfolio entries={entries} initialCategory={categoria} />
    </>
  );
}
