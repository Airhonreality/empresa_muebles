import VetaPortfolio from '@/components/specialized/portfolio/VetaPortfolio';
import { getPublicPortfolio } from '@/server/public-site-data';

export const dynamic = 'force-dynamic';

/** Isolated public route: it bypasses AgnosticShell and receives only the public projection. */
export default async function PortfolioPage() {
  return <VetaPortfolio entries={await getPublicPortfolio()} />;
}
