import { Metadata } from 'next';
import { AgnosticRoutePage } from '../agnostic-route-page';
import { getVaultData } from '@/core/server/vault';
import { resolveAgnosticRoute } from '@/lib/agnostic/resolver';
import { SYSTEM_NS } from '@/lib/agnostic/constants';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const coreData = await getVaultData([SYSTEM_NS.ROUTES, SYSTEM_NS.SCHEMAS]);
    const resolution = await resolveAgnosticRoute(slug, coreData);
    const route = resolution.route?.data as any;

    if (!route) {
      return { title: '404: Uncharted Entity' };
    }

    const description = route.description || '';
    return {
      // No route title → inherit the site identity default from the layout.
      ...(route.title ? { title: route.title } : {}),
      ...(description ? { description, openGraph: { description } } : {}),
    };
  } catch {
    return {};
  }
}

export default async function MasterRoute({ params }: PageProps) {
  const { slug } = await params;
  return <AgnosticRoutePage slug={slug} />;
}
