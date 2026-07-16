'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { BlockProps } from '@agnostic/core';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import { useRouter } from 'next/navigation';
import { COP } from '@/components/specialized/cotizador/utils';
import { CartProvider, useCart } from './CartContext';
import { CartDrawer } from './CartDrawer';

interface ProductDetail {
  id: string;
  nombre: string;
  descripcion_comercial?: string;
  categoria_comercial?: string;
  precio_publico: number;
  slug: string;
  imagen_url?: string;
  tipo: 'prefabricado' | 'catalogo';
  imagenes?: string[];
  dimensiones?: {
    ancho?: number | string;
    alto?: number | string;
    profundo?: number | string;
  };
}

function VetaProductoDetalleContent({ block }: Partial<BlockProps>) {
  const router = useRouter();
  const { addItem } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [mainImage, setMainImage] = useState<string | undefined>();
  const [products, setProducts] = useState<ProductDetail[]>([]);

  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';

  useEffect(() => {
    fetch('/api/public-data/store-products')
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Public catalog unavailable')))
      .then(payload => setProducts((payload.records ?? []).map((record: any) => ({
        id: record.slug_publico,
        slug: record.slug_publico,
        nombre: record.nombre,
        descripcion_comercial: record.descripcion_comercial,
        categoria_comercial: record.categoria_comercial,
        precio_publico: record.precio_publico,
        imagen_url: record.imagen_url,
        imagenes: record.imagen_url ? [record.imagen_url] : [],
        dimensiones: record.dimensiones,
        tipo: record.tipo,
      }))))
      .catch(() => setProducts([]));
  }, []);

  const product = useMemo<ProductDetail | null>(() => products.find(item => item.slug === slug) ?? null, [products, slug]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return products
      .filter(
        (p) =>
          p.categoria_comercial === product.categoria_comercial &&
          p.id !== product.id &&
          p.precio_publico > 0
      )
      .slice(0, 3);
  }, [product, products]);

  if (!product) {
    return (
      <div className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg-warm-paper))]">
        <VetaHeader />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-semibold text-[hsl(var(--veta-text-carbon))]">
              Producto no encontrado
            </h1>
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 text-[hsl(var(--veta-gold-hover))]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a la tienda
            </Link>
          </div>
        </div>
        <VetaFooter />
      </div>
    );
  }

  const images = product.imagenes?.filter(Boolean) || (product.imagen_url ? [product.imagen_url] : []);
  const displayImage = mainImage || images[0];

  const handleAddToCart = () => {
    addItem({
      tipo: product.tipo,
      ref_id: product.id,
      nombre: product.nombre,
      precio_unitario: product.precio_publico,
      cantidad,
      imagen_url: product.imagen_url,
    });
    setCartOpen(true);
  };

  return (
    <div className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]">
      <VetaHeader />

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Back Button */}
        <Link
          href="/tienda"
          className="mb-8 inline-flex items-center gap-2 text-[hsl(var(--veta-gold-hover))] transition-colors hover:text-[hsl(var(--veta-gold-muted))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la tienda
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-4">
            {displayImage && (
              <div className="h-96 overflow-hidden rounded-xl bg-[hsl(var(--veta-bg-linen))]">
                <img
                  src={displayImage}
                  alt={product.nombre}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMainImage(img)}
                    className={[
                      'h-20 rounded-lg border-2 transition-all',
                      mainImage === img || (idx === 0 && !mainImage)
                        ? 'border-[hsl(var(--veta-gold-muted))]'
                        : 'border-[hsl(var(--veta-glass-light-border))]',
                    ].join(' ')}
                  >
                    <img
                      src={img}
                      alt={`Vista ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="veta-heading mb-2 text-3xl font-semibold leading-tight">
                {product.nombre}
              </h1>
              <p className="text-[hsl(var(--veta-text-stone))]">
                {product.categoria_comercial}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4 border-b border-[hsl(var(--veta-glass-light-border))] pb-6">
              <span className="text-4xl font-semibold text-[hsl(var(--veta-text-carbon))]">
                {COP.format(product.precio_publico)}
              </span>
            </div>

            {/* Description */}
            {product.descripcion_comercial && (
              <div className="prose prose-sm max-w-none text-[hsl(var(--veta-text-stone))]">
                <p>{product.descripcion_comercial}</p>
              </div>
            )}

            {/* Dimensions */}
            {product.dimensiones && (
              <div className="space-y-2 rounded-xl bg-[hsl(var(--veta-bg-linen))] p-4">
                <h3 className="font-medium text-[hsl(var(--veta-text-carbon))]">
                  Dimensiones
                </h3>
                <div className="grid grid-cols-3 gap-2 text-sm text-[hsl(var(--veta-text-stone))]">
                  {product.dimensiones.ancho && (
                    <div>
                      <p className="font-medium">Ancho</p>
                      <p>{product.dimensiones.ancho}</p>
                    </div>
                  )}
                  {product.dimensiones.alto && (
                    <div>
                      <p className="font-medium">Alto</p>
                      <p>{product.dimensiones.alto}</p>
                    </div>
                  )}
                  {product.dimensiones.profundo && (
                    <div>
                      <p className="font-medium">Profundidad</p>
                      <p>{product.dimensiones.profundo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-[hsl(var(--veta-text-carbon))]">
                  Cantidad
                </label>
                <div className="flex items-center gap-2 rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white">
                  <button
                    type="button"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-2 text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{cantidad}</span>
                  <button
                    type="button"
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-2 text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full rounded-lg bg-[hsl(var(--veta-gold-muted))] px-6 py-3 font-semibold text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))]"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 space-y-6 border-t border-[hsl(var(--veta-glass-light-border))] pt-12">
            <h2 className="veta-heading text-2xl font-semibold">También te puede interesar</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  href={`/tienda/${related.slug}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-[hsl(var(--veta-glass-light-border))] bg-white transition-all hover:shadow-lg"
                >
                  {related.imagen_url ? (
                    <img
                      src={related.imagen_url}
                      alt={related.nombre}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 w-full bg-[hsl(var(--veta-bg-linen))]" />
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-medium text-[hsl(var(--veta-text-carbon))]">
                      {related.nombre}
                    </h3>
                    <span className="mt-auto pt-4 text-lg font-semibold text-[hsl(var(--veta-text-carbon))]">
                      {COP.format(related.precio_publico)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>

      <VetaFooter />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

export default function VetaProductoDetalle(props: Partial<BlockProps>) {
  return (
    <CartProvider>
      <VetaProductoDetalleContent {...props} />
    </CartProvider>
  );
}
