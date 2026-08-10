'use client';

import { useParams } from 'next/navigation';
import { useDataStore, type CatalogoAcabado } from '@/lib/data';
import { Badge } from '@/components/veta/badge';
import { Button } from '@/components/veta/button';
import Link from 'next/link';

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
  const catalogo = producto ? store.catalogo.obtenerPorId(producto.catalogoId) : undefined;
  const categoria = producto?.categoriaId ? store.categorias.listar().find(c => c.id === producto.categoriaId) : undefined;

  const acabadosRelacion = catalogo ? store.catalogoProductoAcabados.porProducto(catalogo.id) : [];
  const acabados = acabadosRelacion.map(r => store.catalogoAcabados.listar().find(a => a.id === r.acabadoId)).filter(Boolean) as CatalogoAcabado[];
  const acabadosConMuestras = acabados.map(a => ({
    ...a,
    muestras: store.acabadosMuestras.porAcabado(a.id).filter(m => m.disponibleWeb),
  }));

  if (!producto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-text-muted">Producto no encontrado.</p>
        <Link href="/colecciones" className="mt-4 inline-block">
          <Button variant="primary">Volver a colecciones</Button>
        </Link>
      </div>
    );
  }

  const disponible = (producto.inventarioDisponible ?? 0) > 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/colecciones" className="mb-6 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
        ← Volver a colecciones
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Galeria de imagen principal */}
        <div className="space-y-4">
          <div className="relative aspect-[4/3] rounded-lg bg-bg-paper overflow-hidden">
            {producto.imagenPrincipalUrl && (
              <img
                src={producto.imagenPrincipalUrl}
                alt={producto.descripcionDiseno ?? 'Producto'}
                className="w-full h-full object-cover"
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

          {acabadosConMuestras.length > 0 && acabadosConMuestras.some(a => a.muestras.length > 0) && (
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
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          <div>
            {categoria && (
              <Badge tone="neutral" variant="mist">
                {categoria.nombre}
              </Badge>
            )}
            <h1 className="font-display text-3xl font-semibold text-text-heading">
              {producto.descripcionDiseno ?? catalogo?.descripcion ?? 'Producto sin nombre'}
            </h1>
            {catalogo && (
              <p className="text-sm text-text-muted mt-1">SKU: {catalogo.sku}</p>
            )}
          </div>

          <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-display text-3xl font-bold text-brand">{formatCOP(producto.valorTienda)}</span>
              {catalogo?.precioPublico && catalogo.precioPublico !== producto.valorTienda && (
                <span className="text-sm text-text-muted line-through">{formatCOP(catalogo.precioPublico)}</span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Disponibilidad</span>
                <span className={disponible ? 'text-green-600' : 'text-amber-600'}>
                  {disponible ? `En stock (${producto.inventarioDisponible} uds)` : 'Bajo pedido'}
                </span>
              </div>
              {producto.calificacionPromedio && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Calificación</span>
                  <Badge tone="info" variant="mist" dot>
                    {producto.calificacionPromedio.toFixed(1)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {producto.descripcionDiseno && (
            <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
              <h3 className="font-display text-lg font-medium text-text-heading mb-3">Descripción</h3>
              <p className="text-text-muted whitespace-pre-wrap">{producto.descripcionDiseno}</p>
            </div>
          )}

          {acabados.length > 0 && (
            <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
              <h3 className="font-display text-lg font-medium text-text-heading mb-4">Acabados disponibles</h3>
              <div className="flex flex-wrap gap-3">
                {acabados.map(acabado => (
                  <div
                    key={acabado.id}
                    className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-paper px-3 py-2"
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

          <div className="pt-4 border-t border-border-subtle">
            <Button variant="primary" size="lg" className="w-full" onClick={() => alert('Funcionalidad de carrito no implementada en F-02 (solo lectura pública)')}>
              {disponible ? 'Añadir al carrito' : 'Consultar disponibilidad'}
            </Button>
            <p className="text-center text-xs text-text-muted mt-2">
              Sin botones de pago ni checkout — pantalla informativa (F-02 R5)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}