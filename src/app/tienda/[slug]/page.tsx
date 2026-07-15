import VetaProductoDetalle from '@/components/specialized/tienda/VetaProductoDetalle';

export const dynamic = 'force-dynamic';

/** Isolated public product route. Product data comes only from the public projection endpoint. */
export default function StoreProductPage() {
  return <VetaProductoDetalle />;
}
