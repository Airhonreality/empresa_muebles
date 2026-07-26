import type { Metadata } from 'next';
import VetaPortfolio from '@/components/specialized/portfolio/VetaPortfolio';
import { getPublicPortfolio } from '@/server/public-site-data';
import { buildPortfolioItemSchema, serializeJsonLd } from '@/lib/veta/seo/schemaGenerator';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portafolio de Carpintería y Diseño en Bogotá | Veta Dorada',
  description:
    'Galería de proyectos de cocinas integrales, closets empotrados y mobiliario arquitectónico realizados en Bogotá. Diseño 3D y fabricación con materiales premium.',
};

/** Isolated public route: it bypasses AgnosticShell and receives only the public projection. */
export default async function PortfolioPage() {
  const entries = await getPublicPortfolio();
  const portfolioSchemas = entries.map(buildPortfolioItemSchema);

  return (
    <>
      {portfolioSchemas.length > 0 && (
        <script
          id="portfolio-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(portfolioSchemas) }}
        />
      )}
      <VetaPortfolio entries={entries} />
    </>
  );
}
