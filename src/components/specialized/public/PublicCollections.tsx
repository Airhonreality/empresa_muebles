'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { PublicSiteFooter, PublicSiteHeader } from './PublicSiteChrome';

type PublicProduct = { slug_publico: string; nombre: string; descripcion_comercial?: string; categoria_comercial: string; precio_publico: number; imagen_url?: string; disponibilidad: 'disponible' | 'bajo_pedido' | 'agotado'; };
const availabilityLabel: Record<PublicProduct['disponibilidad'], string> = { disponible: 'Disponible', bajo_pedido: 'Bajo pedido', agotado: 'Agotado' };
const currency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export default function PublicCollections() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState('todos');
  useEffect(() => {
    let active = true;
    fetch('/api/public-data/store-products', { cache: 'no-store' })
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<{ records?: PublicProduct[] }>; })
      .then((payload) => { if (active) setProducts(payload.records ?? []); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const categories = useMemo(() => ['todos', ...Array.from(new Set(products.map((product) => product.categoria_comercial)))], [products]);
  const visibleProducts = category === 'todos' ? products : products.filter((product) => product.categoria_comercial === category);
  return (
    <div className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]">
      <PublicSiteHeader />
      <main>
        <section className="veta-section px-6 !pb-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[0.26em] text-[hsl(var(--veta-gold-hover))]">Colecciones</p><h1 className="veta-heading mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Mobiliario de colección</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">Piezas con precio publicado y disponibilidad clara. Los detalles comerciales se consultan directamente con el estudio.</p></div></section>
        <section className="border-y border-[hsl(var(--veta-glass-light-border))] px-6 py-4"><div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">{categories.map((value) => <button key={value} type="button" onClick={() => setCategory(value)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${category === value ? 'bg-[hsl(var(--veta-gold-muted))] text-black' : 'bg-white/70 text-[hsl(var(--veta-text-stone))]'}`}>{value === 'todos' ? 'Ver todo' : value.replaceAll('_', ' ')}</button>)}</div></section>
        <section className="veta-section px-6"><div className="mx-auto max-w-7xl">
          {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : null}
          {error ? <div className="veta-surface-matte flex items-center gap-3 rounded-2xl p-6 text-sm"><AlertCircle className="h-5 w-5" /> El catálogo no está disponible temporalmente.</div> : null}
          {!loading && !error && visibleProducts.length === 0 ? <div className="veta-surface-matte rounded-2xl p-10 text-center text-sm text-[hsl(var(--veta-text-stone))]">Esta colección estará disponible próximamente.</div> : null}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product) => <article key={product.slug_publico} className="veta-surface-glass overflow-hidden rounded-[1.5rem]"><div className="h-56 bg-[hsl(var(--veta-bg-linen))]">{product.imagen_url ? <img src={product.imagen_url} alt={product.nombre} className="h-full w-full object-cover" loading="lazy" /> : null}</div><div className="space-y-4 p-6"><div className="flex items-start justify-between gap-3"><h2 className="veta-heading text-xl font-semibold">{product.nombre}</h2><span className="rounded-full border border-[hsl(var(--veta-glass-light-border))] px-2 py-1 text-[9px] uppercase tracking-wider">{availabilityLabel[product.disponibilidad]}</span></div>{product.descripcion_comercial ? <p className="line-clamp-2 text-sm text-[hsl(var(--veta-text-stone))]">{product.descripcion_comercial}</p> : null}<div className="flex items-center justify-between border-t border-[hsl(var(--veta-glass-light-border))] pt-4"><span className="font-semibold">{currency(product.precio_publico)}</span><Link href={`/tienda/${product.slug_publico}`} className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--veta-gold-hover))]">Ver pieza</Link></div></div></article>)}</div>
        </div></section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
