'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDataStore, type CatalogoAcabado } from '@/lib/data';
import { Button, LinkButton } from '@/components/veta/button';

function formatCOP(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export default function ProductoDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const store = useDataStore();

  const producto = store.productosTienda.obtenerPorId(id);

  // R1: Filtro de visibilidad — producto no encontrado si no está visible en tienda
  if (!producto || !producto.visibleEnTienda) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-text-muted">Producto no encontrado.</p>
        <LinkButton href="/colecciones" variant="primary" className="mt-4">Volver a colecciones</LinkButton>
      </div>
    );
  }

  const catalogo = store.catalogo.obtenerPorId(producto.catalogoId);

  // R3: Proyección segura — solo campos públicos del catálogo (sin precioDirecto, stockActual, proveedorId)
  interface ProductoCatalogoPublico {
    sku: string | undefined;
    descripcion: string | undefined;
    imagenUrl: string | null | undefined;
    categoriaComercial: string | null | undefined;
  }

  const catalogoPublico: ProductoCatalogoPublico | undefined = catalogo ? {
    sku: catalogo.sku,
    descripcion: catalogo.descripcion,
    imagenUrl: catalogo.imagenUrl,
    categoriaComercial: catalogo.categoriaComercial,
  } : undefined;

  // Usa la categoría directamente del producto (más rápido y sin lookup)
  const categoriaSHOP = producto.categoria as string | undefined;

  const acabadosRelacion = catalogo ? store.catalogoProductoAcabados.porProducto(catalogo.id) : [];
  const acabados = acabadosRelacion.map(r => store.catalogoAcabados.listar().find(a => a.id === r.acabadoId)).filter(Boolean) as CatalogoAcabado[];
  const acabadosConMuestras = acabados.map(a => ({
    ...a,
    muestras: store.acabadosMuestras.porAcabado(a.id).filter(m => m.disponibleWeb),
  }));

  // LÓGICA DE IMÁGENE PRIORITARIA
  // 1. imagenPrincipalUrl: fotografía/render del producto (preferente)
  // 2. Si no hay ninguna: se omite imagen (modo vitrina sin imagen)
  const tieneFotoPrincipal = producto.imagenPrincipalUrl;
  const imagenPrincipal = tieneFotoPrincipal
    ? producto.imagenPrincipalUrl
    : undefined;

  const disponible = (producto.inventarioDisponible ?? 0) > 0;

  // LÓGICA JSON-LD PRODUCTO (D-02-2): Datos estructurados para SEO
  // Usando valores mock/placeholder hasta I-016 (imágenes reales)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.descripcionDiseno ?? catalogo?.descripcion ?? 'Producto Veta Dorada',
    description: producto.descripcionDiseno ?? catalogo?.descripcion ?? '',
    image: [
      producto.imagenPrincipalUrl,
      ...(catalogo?.imagenUrl ? [catalogo.imagenUrl] : [])
    ].filter(Boolean),
    sku: catalogo?.sku,
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