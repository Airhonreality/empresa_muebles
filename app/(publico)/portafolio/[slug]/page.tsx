'use client';

import { useParams } from 'next/navigation';
import { useDataStore, type ModuloArtefacto } from '@/lib/data';
import { Badge } from '@/components/veta/badge';
import { Button } from '@/components/veta/button';
import Link from 'next/link';

export default function PortafolioDetallePage() {
  const params = useParams();
  const slug = params.slug as string;
  const store = useDataStore();

  const proyectoPortafolio = store.portafolio.porSlug(slug);
  const proyecto = proyectoPortafolio ? store.proyectos.obtenerPorId(proyectoPortafolio.proyectoId) : undefined;

  const modulos = proyecto ? store.modulos.porProyecto(proyecto.id) : [];
  const imagenes: ModuloArtefacto[] = [];
  modulos.forEach(m => {
    const arts = store.modulosArtefactos.porModulo(m.id);
    arts.filter(a => a.tipo === 'imagen' && (a.fuente === 'heredado_catalogo' || a.fuente === 'dedicado_proyecto')).forEach(a => imagenes.push(a));
  });

  if (!proyectoPortafolio) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-text-muted">Proyecto no encontrado.</p>
        <Link href="/portafolio" className="mt-4 inline-block">
          <Button variant="primary">Volver al portafolio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/portafolio" className="mb-6 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
        ← Volver al portafolio
      </Link>

      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge tone="neutral" variant="mist">
            {proyectoPortafolio.categoriaEspacio.charAt(0).toUpperCase() + proyectoPortafolio.categoriaEspacio.slice(1)}
          </Badge>
          {proyectoPortafolio.destacado && (
            <Badge tone="info" variant="mist" dot>
              Destacado
            </Badge>
          )}
        </div>
        <h1 className="font-display text-3xl font-semibold text-text-heading">
          {proyectoPortafolio.titulo}
        </h1>
        {proyecto?.direccionObra && (
          <p className="text-text-muted mt-1">{proyecto.direccionObra}</p>
        )}
      </header>

      {/* Galeria de imágenes */}
      {imagenes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Galería</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {imagenes.map((img, i) => (
              <div key={img.id} className="relative aspect-[4/3] rounded-lg bg-bg-paper overflow-hidden">
                <img
                  src={img.url}
                  alt={`${proyectoPortafolio.titulo} - Imagen ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading={i < 3 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Descripción comercial */}
        <section className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-display text-lg font-medium text-text-heading mb-4">Descripción</h2>
          <p className="text-text-muted whitespace-pre-wrap">
            {proyectoPortafolio.descripcionComercial ?? 'Sin descripción comercial disponible.'}
          </p>
        </section>

        {/* Detalles del proyecto */}
        <section className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-display text-lg font-medium text-text-heading mb-4">Detalles</h2>
          <dl className="space-y-4">
            {proyectoPortafolio.materialesDestacados.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-text-muted">Materiales destacados</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {proyectoPortafolio.materialesDestacados.map((mat, i) => (
                    <Badge key={i} tone="neutral" variant="glass">
                      {mat}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
            {proyectoPortafolio.precioReferencial && (
              <div>
                <dt className="text-sm font-medium text-text-muted">Precio de referencia</dt>
                <dd className="mt-1 text-brand font-medium">{proyectoPortafolio.precioReferencial}</dd>
              </div>
            )}
            {proyecto && (
              <>
                <div>
                  <dt className="text-sm font-medium text-text-muted">Estado del proyecto</dt>
                  <dd className="mt-1 text-text-heading">
                    {proyecto.estado.charAt(0).toUpperCase() + proyecto.estado.slice(1).replace('_', ' ')}
                  </dd>
                </div>
                {proyecto.garantiaAnios && (
                  <div>
                    <dt className="text-sm font-medium text-text-muted">Garantía</dt>
                    <dd className="mt-1 text-text-heading">{proyecto.garantiaAnios} años</dd>
                  </div>
                )}
              </>
            )}
          </dl>

          <p className="mt-6 text-xs text-text-muted italic">
            Los precios mostrados son rangos estimados de referencia. Cada proyecto es único y el presupuesto final
            depende de medidas, materiales, acabados y condiciones de obra específicas.
          </p>
        </section>
      </div>

      {/* JSON-LD para SEO (schema.org CreativeWork) - solo en cliente como demostración */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: proyectoPortafolio.titulo,
            description: proyectoPortafolio.descripcionComercial,
            category: proyectoPortafolio.categoriaEspacio,
            image: imagenes.map(i => i.url),
            ...(proyecto?.direccionObra && { location: { '@type': 'Place', address: proyecto.direccionObra } }),
          }, null, 2),
        }}
      />
    </div>
  );
}