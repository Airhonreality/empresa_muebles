import type { Metadata } from 'next';
import { LinkButton } from '@/components/veta/button';
import { obtenerPortafolioPorSlugAction } from '@/lib/data/actions/portafolio';
import { PortafolioDetalleClient } from './PortafolioDetalleClient';

// Server Component a propósito (t-134): permite generateMetadata() para OG/SEO real
// (bots de WhatsApp/Facebook/etc. no ejecutan JS, así que la versión 'use client'
// anterior nunca les servía imagen/título/descripción del proyecto). La consulta a
// datos ocurre siempre server-side vía obtenerPortafolioPorSlugAction (soporta
// DATA_IMPL=mock y drizzle), sin depender de useDataStore()/<DataStoreProvider>.
// force-dynamic evita que `next build` intente resolver datos reales en tiempo de
// build (mismo problema documentado en AGENTS.md para /colecciones, /portafolio).
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const proyecto = await obtenerPortafolioPorSlugAction(slug);

  if (!proyecto) {
    return { title: 'Proyecto no encontrado — Veta Dorada' };
  }

  const descripcion = proyecto.descripcionComercial || `Proyecto de carpintería arquitectónica: ${proyecto.titulo}`;
  const imagen = proyecto.imagenPortafolioUrl || proyecto.galeriaPortafolioUrl[0];

  return {
    title: `${proyecto.titulo} — Portafolio Veta Dorada`,
    description: descripcion,
    openGraph: {
      title: proyecto.titulo,
      description: descripcion,
      type: 'article',
      images: imagen ? [{ url: imagen }] : undefined,
    },
  };
}

export default async function PortafolioDetallePage({ params }: RouteParams) {
  const { slug } = await params;
  const proyecto = await obtenerPortafolioPorSlugAction(slug);

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-text-muted">Proyecto no encontrado.</p>
        <LinkButton href="/portafolio" variant="primary" className="mt-4">
          Volver al portafolio
        </LinkButton>
      </div>
    );
  }

  return <PortafolioDetalleClient proyecto={proyecto} />;
}
