'use client';

import Link from 'next/link';
import { useDataStore, type ProductoTienda, type Categoria } from '@/lib/data';
import { Badge } from '@/components/veta/badge';

function formatCOP(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

function ProductoCard({ producto, categoriaNombre }: { producto: ProductoTienda; categoriaNombre: string }) {
  const disponible = (producto.inventarioDisponible ?? 0) > 0;

  return (
    <Link
      href={`/colecciones/${producto.id}`}
      className="group flex flex-col rounded-lg border border-border-subtle bg-bg-raised overflow-hidden transition-all duration-300 hover:border-brand/40 hover:shadow-lg"
    >
      <div className="relative aspect-square bg-bg-paper overflow-hidden">
        {producto.imagenPrincipalUrl && (
          <img
            src={producto.imagenPrincipalUrl}
            alt={producto.descripcionDiseno ?? 'Producto'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {!disponible && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Badge tone="warning" variant="mist">
              Bajo pedido
            </Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-text-muted">{categoriaNombre}</span>
          {producto.calificacionPromedio && (
            <Badge tone="info" variant="mist" dot>
              {producto.calificacionPromedio.toFixed(1)}
            </Badge>
          )}
        </div>
        <h3 className="font-display text-lg font-medium text-text-heading mb-1 line-clamp-2">
          {producto.descripcionDiseno ?? 'Producto sin descripción'}
        </h3>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-mono text-lg font-semibold text-brand">{formatCOP(producto.valorTienda)}</span>
        </div>
      </div>
    </Link>
  );
}

function CategoriaFiltro({ categorias, activaId, onChange }: { categorias: Categoria[]; activaId: string | null; onChange: (id: string | null) => void }) {
  const raiz = categorias.filter(c => c.padreId === null && c.activo);
  const hijos = new Map<string, Categoria[]>();
  categorias.filter(c => c.padreId && c.activo).forEach(c => {
    const arr = hijos.get(c.padreId!) ?? [];
    arr.push(c);
    hijos.set(c.padreId!, arr);
  });

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Categorías</h3>
      <nav className="space-y-1">
        <button
          onClick={() => onChange(null)}
          className={`w-full text-left px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
            activaId === null
              ? 'bg-brand text-brand-text'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-alt'
          }`}
        >
          Todas
        </button>
        {raiz.map(cat => (
          <div key={cat.id} className="space-y-1">
            <button
              onClick={() => onChange(activaId === cat.id ? null : cat.id)}
              className={`w-full text-left px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                activaId === cat.id
                  ? 'bg-brand text-brand-text'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-alt'
              }`}
            >
              {cat.nombre}
            </button>
            {hijos.get(cat.id)?.map(sub => (
              <button
                key={sub.id}
                onClick={() => onChange(activaId === sub.id ? null : sub.id)}
                className={`w-full text-left pl-6 px-3 py-1.5 rounded-sm text-xs font-normal transition-colors ${
                  activaId === sub.id
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-alt'
                }`}
              >
                {sub.nombre}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default function ColeccionesPage() {
  const store = useDataStore();
  const productos = store.productosTienda.visibles();
  const categorias = store.categorias.porTipo('tienda');

  const categoriaMap = new Map(categorias.map(c => [c.id, c.nombre]));

  function getCategoriaNombre(categoriaId: string | null): string {
    if (!categoriaId) return 'Sin categoría';
    return categoriaMap.get(categoriaId) ?? 'Sin categoría';
  }

  const productosConCategoria = productos.map(p => ({
    ...p,
    categoriaNombre: getCategoriaNombre(p.categoriaId),
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-text-muted">Tienda</p>
        <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Colecciones</h1>
        <p className="text-text-muted mt-2 max-w-2xl">
          Muebles de carpintería arquitectónica diseñados y fabricados en nuestro taller.
          Cada pieza combina tradición, precisión técnica y materiales nobles.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <CategoriaFiltro
          categorias={categorias}
          activaId={null}
          onChange={() => {}}
        />

        <div className="flex-1">
          {productosConCategoria.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-text-muted">No hay productos disponibles en esta categoría.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productosConCategoria.map(producto => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  categoriaNombre={producto.categoriaNombre}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}