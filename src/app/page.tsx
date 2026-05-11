import { redirect } from 'next/navigation';
import { getStrategy } from '@/server/getStrategy';

export default async function HomePage() {
  try {
    const strategy = await getStrategy();
    const db = await strategy.read('system_config');
    const items = db['system_config'] ?? [];
    if (items.length > 0) {
      const config = items[0].data as Record<string, string>;
      if (config.home_slug) {
        redirect(`/${config.home_slug}`);
      }
    }
  } catch {
    // Fall through to schema builder
  }
  redirect('/schema');
}
