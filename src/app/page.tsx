import { Metadata } from 'next';
import { AgnosticRoutePage } from './agnostic-route-page';
import { getVaultData } from '@/core/server/vault';
import { resolveAgnosticRoute } from '@/lib/agnostic/resolver';
import { SYSTEM_NS } from '@/lib/agnostic/constants';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const coreData = await getVaultData([SYSTEM_NS.ROUTES, SYSTEM_NS.SCHEMAS]);
    const resolution = await resolveAgnosticRoute([], coreData);
    const route = resolution.route?.data as any;

    if (route?.title) {
      return { title: route.title };
    }
  } catch {
    // Fall through
  }

  // No explicit home title → inherit the site identity default from the layout
  // (title.default = the fork's site name). Returning {} keeps that default.
  return {};
}

export default async function HomePage() {
  return <AgnosticRoutePage slug={[]} />;
}
