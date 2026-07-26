import type { Metadata } from 'next';
import PublicAccount from '@/components/specialized/public/PublicAccount';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountPage() { return <PublicAccount />; }
