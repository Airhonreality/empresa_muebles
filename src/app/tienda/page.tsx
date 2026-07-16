import type { Metadata } from 'next';
import VetaTienda from '@/components/specialized/tienda/VetaTienda';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

/** Isolated public route: it never invokes AgnosticShell or reads Vault for the browser. */
export default function StorePage() {
  return <VetaTienda />;
}
