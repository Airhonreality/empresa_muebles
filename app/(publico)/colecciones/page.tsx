'use client';

import Link from 'next/link';
import { useDataStore, type ProductoTienda } from '@/lib/data';

function formatCOP(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

function ProductoCard({ producto }: { producto: ProductoTienda }) {
  const disponible = (producto.inventarioDisponible ?? 0) > 0;

  return (
    <Link
      href={`/colecciones/${producto.id}`}
      className="group flex flex-col rounded-sm overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
      {/* Imagen protagonista */}
      <div className="relative aspect-square bg-bg-paper overflow-hidden">
        {producto.imagenPrincipalUrl && (
          <img
            src={producto.imagenPrincipalUrl}
            alt={producto.descripcionDiseno ?? 'Producto'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {!producto.imagenPrincipalUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-paper">
            <span className="text-xs uppercase tracking-wide text-text-muted">Sin imagen</span>
          </div>
        )}
        {!disponible && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-xs uppercase tracking-wide text-white font-medium">Bajo pedido</span>
          </div>
        )}
      </div>

      {/* Contenido editorial */}
      <div className="flex flex-1 flex-col p-5 bg-bg-raised">
        <p className="text-xs uppercase tracking-wide text-text-muted mb-2">{producto.categoria}</p>
        <h3 className="font-display text-lg font-semibold text-text-heading mb-3 line-clamp-2">
          {producto.descripcionDiseno ?? 'Producto sin descripción'}
        </h3>
        <div className="mt-auto pt-3 border-t border-border-subtle/50">
          <p className="font-mono text-lg text-text-heading font-semibold">
            {formatCOP(producto.valorTienda)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function ColeccionesPage() {
  const store = useDataStore();
  const productos = store.productosTienda.visibles();

  const productosConCategoria = productos.map(p => ({
    ...p,
    categoriaNombre: p.categoria,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-wide text-text-muted mb-2">Tienda</p>
        <h1 className="font-display text-display-publico font-semibold text-text-heading mb-4">
          Colecciones
        </h1>
        <p className="text-text-lead text-text-muted max-w-2xl">
          Muebles de carpintería arquitectónica diseñados y fabricados en nuestro taller.
          Cada pieza combina tradición, precisión técnica y materiales nobles.
        </p>
      </header>

      {productosConCategoria.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted">No hay productos disponibles.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {productosConCategoria.map(producto => (
            <ProductoCard
              key={producto.id}
              producto={producto}
            />
          ))}
        </div>
      )}
    </div>
  );
}