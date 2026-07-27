import type { Metadata } from 'next';
import PublicAccount from '@/components/specialized/public/PublicAccount';
import { buildMetadata, getSiteIdentity } from '@/lib/seo/metadata-helpers';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  const baseMetadata = await buildMetadata({
    title: 'Tu Cuenta',
    description: 'Panel de control de tu cuenta y proyectos con Veta Dorada',
    canonical: `${identity.siteUrl}/cuenta`,
  });

  return {
    ...baseMetadata,
    robots: { index: false, follow: false },
  };
}

export default function AccountPage() { return <PublicAccount />; }
