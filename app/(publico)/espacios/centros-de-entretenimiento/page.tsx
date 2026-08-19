import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'centro_entretenimiento';

// Lee galería real/renders vía Server Action (obtenerGaleriaEspacioAction) — mismo criterio
// que el resto del sitio público con datos vivos (ver app/(publico)/page.tsx).
export const dynamic = 'force-dynamic';

// F-09 (Landings SEO por categoría), copy textual de
// arnes/lineas/demanda/contenido/contenido_F09_landings.md §3.6, aprobado por el Supervisor
// 2026-08-09. No se fabrica copy nuevo acá.
const CONFIG: EspacioLandingConfig = {
  slug: 'centros-de-entretenimiento',
  nombreCategoria: 'Centros de Entretenimiento',
  h1: 'Centros de entretenimiento a medida',
  subtitulo: 'Diseño y fabricación para tu espacio de diversión',
  parrafoDescriptor:
    'Centros de entretenimiento diseñados para integrar tecnología y estilo. Cada proyecto es único y adaptado a tus necesidades.',
  imageKey: 'espaciosCentrosEnt',
};

export const metadata: Metadata = {
  title: 'Centros de Entretenimiento a Medida en Bogotá',
  description:
    'Centros de entretenimiento a medida en Bogotá. Integración de tecnología, diseño personalizado y materiales de calidad.',
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
  ...socialMeta({
    title: 'Centros de Entretenimiento a Medida en Bogotá',
    description:
      'Centros de entretenimiento a medida en Bogotá. Integración de tecnología, diseño personalizado y materiales de calidad.',
    path: `/espacios/${CONFIG.slug}`,
  }),
};

export default async function CentrosDeEntretenimientoPage() {
  const galeria = await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO);
  return <EspacioLanding config={CONFIG} galeria={galeria} tipoEspacio={TIPO_ESPACIO_CODIGO} />;
}
