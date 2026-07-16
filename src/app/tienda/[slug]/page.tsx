import type { Metadata } from 'next';
import VetaProductoDetalle from '@/components/specialized/tienda/VetaProductoDetalle';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

/** Isolated public product route. Product data comes only from the public projection endpoint. */
export default function StoreProductPage() {
  return <VetaProductoDetalle />;
}
