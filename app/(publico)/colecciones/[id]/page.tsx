import type { Metadata } from 'next';
import Link from 'next/link';
import { obtenerProductoTiendaConDetalleAction } from '@/lib/data/actions/public';
import { SITE_URL } from '@/lib/seo/jsonld';
import { Button, LinkButton } from '@/components/veta/button';

// Server Component (auditoría 2026-08-15, A3/B4): antes 'use client' con useDataStore() (ya no
// hidrata el árbol público). Trae el detalle ya ensamblado (producto + catálogo público + acabados
// con muestras) por Server Action escopada — de paso conecta el JSON-LD `Product` que existía
// calculado pero nunca se inyectaba en un <script> (B4).
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const detalle = await obtenerProductoTiendaConDetalleAction(id);
  if (!detalle) return { title: 'Producto no encontrado — Veta Dorada' };

  const nombre = detalle.producto.descripcionDiseno ?? detalle.catalogoPublico?.descripcion ?? 'Producto Veta Dorada';
  return {
    title: `${nombre} — Colecciones Veta Dorada`,
    description: detalle.producto.descripcionDiseno ?? detalle.catalogoPublico?.descripcion ?? undefined,
    alternates: { canonical: `${SITE_URL}/colecciones/${id}` },
  };
}

function formatCOP(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export default async function ProductoDetallePage({ params }: RouteParams) {
  const { id } = await params;
  const detalle = await obtenerProductoTiendaConDetalleAction(id);

  // R1: Filtro de visibilidad — producto no encontrado si no está visible en tienda
  if (!detalle) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-text-muted">Producto no encontrado.</p>
        <LinkButton href="/colecciones" variant="primary" className="mt-4">Volver a colecciones</LinkButton>
      </div>
    );
  }

  const { producto, catalogoPublico, acabados: acabadosConMuestras } = detalle;

  // Usa la categoría directamente del producto (más rápido y sin lookup)
  const categoriaSHOP = producto.categoria as string | undefined;
  const acabados = acabadosConMuestras;

  // LÓGICA DE IMÁGENE PRIORITARIA
  // 1. imagenPrincipalUrl: fotografía/render del producto (preferente)
  // 2. Si no hay ninguna: se omite imagen (modo vitrina sin imagen)
  const tieneFotoPrincipal = producto.imagenPrincipalUrl;
  const imagenPrincipal = tieneFotoPrincipal
    ? producto.imagenPrincipalUrl
    : undefined;

  const disponible = (producto.inventarioDisponible ?? 0) > 0;

  // LÓGICA JSON-LD PRODUCTO (D-02-2): Datos estructurados para SEO — R3: proyección segura,
  // solo campos públicos del catálogo (catalogoPublico ya excluye precioDirecto/stockActual/proveedorId).
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.descripcionDiseno ?? catalogoPublico?.descripcion ?? 'Producto Veta Dorada',
    description: producto.descripcionDiseno ?? catalogoPublico?.descripcion ?? '',
    image: [
      producto.imagenPrincipalUrl,
      ...(catalogoPublico?.imagenUrl ? [catalogoPublico.imagenUrl] : [])
    ].filter(Boolean),
    sku: catalogoPublico?.sku,
    brand: 'Veta Dorada',
    offers: {
      '@type': 'Offer',
      price: producto.valorTienda,
      priceCurrency: 'COP',
      availability: producto.inventarioDisponible > 0 ? 'InStock' : 'OutOfStock',
      url: '/colecciones/' + id
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-paper">
      {/* JSON-LD Product (B4, auditoría 2026-08-15): antes se calculaba pero nunca se inyectaba */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Backlink */}
      <div className="mx-auto max-w-6xl px-6 pt-8 pb-4 w-full">
        <Link href="/colecciones" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
          ← Volver a colecciones
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-12 w-full grid gap-8 lg:grid-cols-2">
        {/* Imagen principal */}
        <div className="space-y-4">
          <div className="relative aspect-[4/3] rounded-sm bg-bg-paper overflow-hidden">
            {imagenPrincipal && (
              <img
                src={imagenPrincipal}
                alt={producto.descripcionDiseno ?? 'Producto'}
                className="w-full h-full object-cover"
                loading="eager"
              />
            )}
            {!imagenPrincipal && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-paper">
                <span className="text-sm uppercase tracking-wide text-text-muted">
                  Sin imagen disponible
                </span>
              </div>
            )}
            {/* Sin segunda imagen - ProductoTienda solo tiene una imagen principal */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-sm uppercase tracking-wide text-white font-medium">Bajo pedido</span>
            </div>
          </div>

          {/* Muestras de acabados */}
          {acabadosConMuestras.length > 0 && acabadosConMuestras.some(a => a.muestras.length > 0) && (
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted mb-3">Muestras disponibles</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {acabadosConMuestras.flatMap(a =>
                  a.muestras
                    .filter(m => m.imagenMuestraUrl)
                    .map(m => (
                      <img
                        key={m.id}
                        src={m.imagenMuestraUrl!}
                        alt={`Muestra ${a.nombre}`}
                        className="w-20 h-20 flex-shrink-0 rounded-sm border border-border-subtle object-cover"
                        loading="lazy"
                      />
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          {/* Encabezado */}
          <div>
            {categoriaSHOP && (
              <p className="text-xs uppercase tracking-wide text-text-muted mb-2">{categoriaSHOP}</p>
            )}
            <h1 className="font-display text-display-publico font-semibold text-text-heading mb-3">
              {producto.descripcionDiseno ?? catalogoPublico?.descripcion ?? 'Producto sin nombre'}
            </h1>
            {catalogoPublico && (
              <p className="text-sm text-text-muted">SKU: {catalogoPublico.sku}</p>
            )}
          </div>

          {/* Precio y disponibilidad */}
          <div className="bg-bg-raised rounded-sm p-6 border border-border-subtle/50">
            <div className="mb-4">
              <p className="text-sm text-text-muted uppercase tracking-wide mb-1">Precio</p>
              <p className="font-display text-3xl font-bold text-text-heading">
                {formatCOP(producto.valorTienda)}
              </p>
            </div>

            <div className="pt-4 border-t border-border-subtle/50 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Disponibilidad</span>
                <span className={disponible ? 'text-text-heading font-medium' : 'text-text-muted'}>
                  {disponible ? 'En stock' : 'Bajo pedido'}
                </span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {producto.descripcionDiseno && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Descripción</p>
              <p className="text-text-muted whitespace-pre-wrap leading-relaxed">
                {producto.descripcionDiseno}
              </p>
            </div>
          )}

          {/* Acabados disponibles */}
          {acabados.length > 0 && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Acabados</p>
              <div className="flex flex-wrap gap-2">
                {acabados.map(acabado => (
                  <div
                    key={acabado.id}
                    className="inline-flex items-center gap-2 rounded-sm border border-border-subtle bg-bg-paper px-3 py-2"
                  >
                    {acabado.colorHex && (
                      <span
                        className="h-3 w-3 rounded-full shrink-0 ring-1 ring-black/10"
                        style={{ backgroundColor: acabado.colorHex }}
                        title={acabado.color ?? undefined}
                      />
                    )}
                    <span className="text-sm text-text-heading">{acabado.nombre}</span>
                    {acabado.precioDiferencial && Number(acabado.precioDiferencial) > 0 && (
                      <span className="text-xs text-text-muted">+{formatCOP(acabado.precioDiferencial)}</span>
                    )}
                  </div>
                ))}
              </div>
              </div>
            )}

          {/* CTA */}
          <div className="pt-4 border-t border-border-subtle">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
            >
              {disponible ? 'Consultar disponibilidad' : 'Consultar disponibilidad'}
            </Button>
            <p className="text-center text-xs text-text-muted mt-3 italic">
              Pantalla informativa. Contacta directamente para cotizaciones y disponibilidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}