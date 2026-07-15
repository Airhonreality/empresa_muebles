import VetaTienda from '@/components/specialized/tienda/VetaTienda';

export const dynamic = 'force-dynamic';

/** Isolated public route: it never invokes AgnosticShell or reads Vault for the browser. */
export default function StorePage() {
  return <VetaTienda />;
}
