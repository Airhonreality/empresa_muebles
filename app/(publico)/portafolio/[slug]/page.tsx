import type { Metadata } from 'next';
import { LinkButton } from '@/components/veta/button';
import { obtenerPortafolioPorSlugAction } from '@/lib/data/actions/portafolio';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
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
    alternates: { canonical: `${SITE_URL}/portafolio/${slug}` },
    ...socialMeta({
      title: proyecto.titulo,
      description: descripcion,
      path: `/portafolio/${slug}`,
      image: imagen,
    }),
    openGraph: {
      type: 'article',
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

  // JSON-LD CreativeWork + ImageObject + BreadcrumbList (plan_seo_2026.md §2, auditoría SEO
  // 2026-08-19 checklist #7). Sin precios (precio_referencial no se publica), sin dirección
  // exacta — barrio sí (es contenido público del portafolio, I-049).
  const imagenes = [proyecto.imagenPortafolioUrl, ...proyecto.galeriaPortafolioUrl].filter(Boolean) as string[];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        name: proyecto.titulo,
        description: proyecto.descripcionComercial || `Proyecto de carpintería arquitectónica: ${proyecto.titulo}`,
        image: imagenes.map((url) => ({ '@type': 'ImageObject', url })),
        about: proyecto.categoriaEspacio,
        inLanguage: 'es-CO',
        url: `${SITE_URL}/portafolio/${slug}`,
        mainEntityOfPage: `${SITE_URL}/portafolio/${slug}`,
        datePublished: proyecto.createdAt,
        dateModified: proyecto.updatedAt,
        creator: { '@type': 'Organization', name: 'Veta Dorada', url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Portafolio', item: `${SITE_URL}/portafolio` },
          { '@type': 'ListItem', position: 3, name: proyecto.titulo, item: `${SITE_URL}/portafolio/${slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PortafolioDetalleClient proyecto={proyecto} />
    </>
  );
}
