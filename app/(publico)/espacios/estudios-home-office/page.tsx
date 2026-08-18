import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'estudio_home_office';

// Lee galería real/renders vía Server Action (obtenerGaleriaEspacioAction) — mismo criterio
// que el resto del sitio público con datos vivos (ver app/(publico)/page.tsx).
export const dynamic = 'force-dynamic';

// F-09 (Landings SEO por categoría), copy textual de
// arnes/lineas/demanda/contenido/contenido_F09_landings.md §3.7, aprobado por el Supervisor
// 2026-08-09. No se fabrica copy nuevo acá.
const CONFIG: EspacioLandingConfig = {
  slug: 'estudios-home-office',
  nombreCategoria: 'Estudios y Home Office',
  h1: 'Estudios y home office a medida',
  subtitulo: 'Espacios de trabajo diseñados para tu productividad',
  parrafoDescriptor:
    'Estudios y home offices que combinan funcionalidad y comodidad. Diseñamos cada detalle para que tu espacio de trabajo sea inspirador.',
  imageKey: 'espaciosEstudios',
};

export const metadata: Metadata = {
  title: 'Estudios y Home Office a Medida en Bogotá',
  description:
    'Estudios y home office a medida en Bogotá. Diseño ergonómico, materiales duraderos y instalación profesional.',
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
};

export default async function EstudiosHomeOfficePage() {
  const galeria = await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO);
  return <EspacioLanding config={CONFIG} galeria={galeria} />;
}
