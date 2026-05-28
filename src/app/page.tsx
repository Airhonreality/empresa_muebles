import { redirect } from 'next/navigation';
import { getStrategy } from '@/server/getStrategy';

/**
 * 🏛️ ARTEFACTO: page.tsx
 * ────────────
 * CAPA: Staging / Server (Home Dynamic Redirector)
 * VERSIÓN: 2.0
 * COMMIT: P3-M5.2-HOME-REDIRECT-AXIOMATIC
 */
export default async function HomePage() {
  try {
    const strategy = getStrategy();
    const items = await strategy.read('system_config');
    if (items.length > 0) {
      const config = items[0].data as Record<string, string>;
      // Sistema ya configurado: ir al designer (o a home_slug si está definido)
      redirect(config.home_slug ? `/${config.home_slug}` : '/schema');
    }
  } catch {
    // Sin system_config.json → estado virgen
  }
  redirect('/setup');
}
