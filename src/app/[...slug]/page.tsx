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

    const title = route.title || 'Page';
    const description = route.description || '';
    return {
      title,
      description,
      openGraph: description ? { description } : undefined,
    };
  } catch {
    return { title: 'Error Loading Page' };
  }
}

export default async function MasterRoute({ params }: PageProps) {
  const { slug } = await params;
  return <AgnosticRoutePage slug={slug} />;
}
