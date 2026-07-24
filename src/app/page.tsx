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
    // Fall through to default
  }

  return { title: 'Home' };
}

export default async function HomePage() {
  return <AgnosticRoutePage slug={[]} />;
}
