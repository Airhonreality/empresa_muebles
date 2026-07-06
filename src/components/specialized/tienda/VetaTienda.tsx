'use client';

import React, { useMemo, useState } from 'react';
import type { BlockProps } from '@agnostic/core';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import { useAppState } from '@/context/AppContext';
import { COP } from '@/components/specialized/cotizador/utils';
import { CartProvider } from './CartContext';
import { CartDrawer } from './CartDrawer';
import { useCart } from './CartContext';

interface Product {
  id: string;
  nombre: string;
  descripcion_comercial?: string;
  categoria_comercial?: string;
  precio_publico: number;
  slug?: string;
  imagen_url?: string;
  tipo: 'prefabricado' | 'catalogo';
}

function VetaTiendaContent() {
  const { data } = useAppState();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const { itemCount } = useCart();

  const products = useMemo(() => {
    const result: Product[] = [];

    // Agregar prefabricados publicados
    const prefabricados = (data['prefabricados'] || []).filter(
      (p: any) => p.data.publicado_web === true && p.data.precio_publico > 0
    );
    result.push(
      ...prefabricados.map((p: any) => ({
        id: p.id,
        nombre: p.data.nombre,
        descripcion_comercial: p.data.descripcion_comercial || p.data.descripcion,
        categoria_comercial: p.data.categoria_comercial || 'General',
        precio_publico: p.data.precio_publico,
        slug: p.data.slug || p.data.nombre.toLowerCase().replace(/\s+/g, '-'),
        imagen_url: p.data.imagen_url,
        tipo: 'prefabricado' as const,
      }))
    );

    // Agregar productos_catalogo publicados
    const catalogo = (data['productos_catalogo'] || []).filter(
      (p: any) => p.data.publicado_web === true && p.data.precio_publico > 0
    );
    result.push(
      ...catalogo.map((p: any) => ({
        id: p.id,
        nombre: p.data.descripcion || 'Producto',
        descripcion_comercial: p.data.descripcion,
        categoria_comercial: p.data.categoria_comercial || p.data.tipo || 'General',
        precio_publico: p.data.precio_publico,
        slug: p.data.sku || p.id,
        imagen_url: p.data.imagen_url,
        tipo: 'catalogo' as const,
      }))
    );

    return result;
  }, [data]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.categoria_comercial) cats.add(p.categoria_comercial);
    });
    return ['todos', ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'todos') return products;
    return products.filter((p) => p.categoria_comercial === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]">
      <VetaHeader />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-12 text-center">
          <h1 className="veta-heading mb-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Tienda
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[hsl(var(--veta-text-stone))]">
            Explora nuestra selección de productos y prefabricados disponibles para tu hogar.
          </p>
        </div>

        {/* Cart Badge */}
        <div className="mb-8 flex justify-end">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-4 py-2 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))]"
          >
            <span>Carrito</span>
            {itemCount > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="mb-12 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={[
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-[hsl(var(--veta-gold-muted))] text-[#0A0A0A]'
                  : 'border border-[hsl(var(--veta-glass-light-border))] bg-white text-[hsl(var(--veta-text-carbon))] hover:border-[hsl(var(--veta-gold-muted))]',
              ].join(' ')}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-[hsl(var(--veta-text-stone))]">
              No hay productos en esta categoría.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[hsl(var(--veta-glass-light-border))] bg-white transition-all hover:shadow-lg"
              >
                {/* Image */}
                {product.imagen_url ? (
                  <img
                    src={product.imagen_url}
                    alt={product.nombre}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 w-full bg-[hsl(var(--veta-bg-linen))]" />
                )}

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-medium text-[hsl(var(--veta-text-carbon))]">
                    {product.nombre}
                  </h3>
                  {product.descripcion_comercial && (
                    <p className="mt-1 text-sm text-[hsl(var(--veta-text-stone))]">
                      {product.descripcion_comercial}
                    </p>
                  )}
                  <div className="mt-auto flex items-baseline justify-between pt-4">
                    <span className="text-lg font-semibold text-[hsl(var(--veta-text-carbon))]">
                      {COP.format(product.precio_publico)}
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/tienda/${product.slug}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--veta-gold-muted))] px-4 py-2 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[hsl(var(--veta-gold-hover))]"
                  >
                    Ver detalle
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <VetaFooter />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

export default function VetaTienda(props: Partial<BlockProps>) {
  return (
    <CartProvider>
      <VetaTiendaContent />
    </CartProvider>
  );
}
