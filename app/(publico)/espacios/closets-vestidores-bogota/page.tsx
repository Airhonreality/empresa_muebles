import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'closet';

// Lee galería real/renders vía Server Action (obtenerGaleriaEspacioAction) — mismo criterio
// que el resto del sitio público con datos vivos (ver app/(publico)/page.tsx).
export const dynamic = 'force-dynamic';

// F-09 (Landings SEO por categoría), copy textual de
// arnes/lineas/demanda/contenido/contenido_F09_landings.md §3.3, aprobado por el Supervisor
// 2026-08-09. No se fabrica copy nuevo acá.
const CONFIG: EspacioLandingConfig = {
  slug: 'closets-vestidores-bogota',
  nombreCategoria: 'Closets y Vestidores',
  h1: 'Closets y vestidores a medida',
  subtitulo: 'Soluciones de almacenamiento diseñadas para tu espacio y estilo de vida',
  parrafoDescriptor:
    'Closets y vestidores que optimizan el espacio y reflejan tu estilo. Desde diseños minimalistas hasta soluciones con detalle en madera.',
  imageKey: 'espaciosClosets',
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Closets y Vestidores en Bogotá | Diseño a Medida',
  description:
    'Closets y vestidores a medida en Bogotá. Diseño personalizado, materiales duraderos y instalación profesional.',
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
  ...socialMeta({
    title: 'Closets y Vestidores en Bogotá | Diseño a Medida',
    description:
      'Closets y vestidores a medida en Bogotá. Diseño personalizado, materiales duraderos y instalación profesional.',
    path: `/espacios/${CONFIG.slug}`,
  }),
};

export default async function ClosetsVestidoresPage() {
  const galeria = await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO);
  return <EspacioLanding config={CONFIG} galeria={galeria} tipoEspacio={TIPO_ESPACIO_CODIGO} />;
}
