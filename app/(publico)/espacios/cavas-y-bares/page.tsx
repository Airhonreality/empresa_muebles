import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'cava_bar';

// Lee galería real/renders vía Server Action (obtenerGaleriaEspacioAction) — mismo criterio
// que el resto del sitio público con datos vivos (ver app/(publico)/page.tsx).
export const dynamic = 'force-dynamic';

// F-09 (Landings SEO por categoría), copy textual de
// arnes/lineas/demanda/contenido/contenido_F09_landings.md §3.4, aprobado por el Supervisor
// 2026-08-09. No se fabrica copy nuevo acá.
const CONFIG: EspacioLandingConfig = {
  slug: 'cavas-y-bares',
  nombreCategoria: 'Cavas y Bares',
  h1: 'Cavas y bares a medida',
  subtitulo: 'Espacios para disfrutar, diseñados a tu medida',
  parrafoDescriptor:
    'Cavas y bares que combinan funcionalidad y elegancia. Diseñamos cada detalle para que tu espacio de entretenimiento sea único.',
  imageKey: 'espaciosCavas',
};

export const metadata: Metadata = {
  title: 'Cavas y Bares a Medida en Bogotá',
  description:
    'Cavas y bares a medida en Bogotá. Diseño personalizado, materiales de calidad y acabados premium.',
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
  ...socialMeta({
    title: 'Cavas y Bares a Medida en Bogotá',
    description:
      'Cavas y bares a medida en Bogotá. Diseño personalizado, materiales de calidad y acabados premium.',
    path: `/espacios/${CONFIG.slug}`,
  }),
};

export default async function CavasYBaresPage() {
  const galeria = await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO);
  return <EspacioLanding config={CONFIG} galeria={galeria} tipoEspacio={TIPO_ESPACIO_CODIGO} />;
}
