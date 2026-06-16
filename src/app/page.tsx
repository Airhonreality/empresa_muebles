import { redirect } from 'next/navigation';
import { getStrategy } from '@/server/getStrategy';

export default async function HomePage() {
  try {
    const items = await getStrategy().read('system_config');
    if (items.length > 0) {
      const cfg = items[0].data as Record<string, string>;
      if (cfg.home_slug) redirect(`/${cfg.home_slug}`);
    }
  } catch { /* no system_config → fall through */ }
  redirect('/login');
}
