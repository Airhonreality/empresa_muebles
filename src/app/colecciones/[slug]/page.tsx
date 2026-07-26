import type { Metadata } from 'next';
import VetaProductoDetalle from '@/components/specialized/tienda/VetaProductoDetalle';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function CollectionsProductPage() {
  return <VetaProductoDetalle />;
}
