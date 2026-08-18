import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'cocina';

// Lee galería real/renders vía Server Action (obtenerGaleriaEspacioAction) — mismo criterio
// que el resto del sitio público con datos vivos (ver app/(publico)/page.tsx).
export const dynamic = 'force-dynamic';

// F-09 (Landings SEO por categoría), copy textual de
// arnes/lineas/demanda/contenido/contenido_F09_landings.md §3.2, aprobado por el Supervisor
// 2026-08-09. No se fabrica copy nuevo acá.
const CONFIG: EspacioLandingConfig = {
  slug: 'cocinas-integrales-bogota',
  nombreCategoria: 'Cocinas Integrales',
  h1: 'Cocinas integrales a medida',
  subtitulo: 'Diseño y fabricación a la medida de tu espacio y estilo',
  parrafoDescriptor:
    'Cocinas integrales diseñadas para aprovechar cada centímetro de tu espacio. Materiales de primera, acabados personalizados y instalación impecable.',
  imageKey: 'espaciosCocinas',
};

export const metadata: Metadata = {
  title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
  description:
    'Cocinas integrales a medida en Bogotá. Diseño, fabricación e instalación con materiales de primera y acabados personalizados.',
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
};

export default async function CocinasIntegralesPage() {
  const galeria = await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO);
  return <EspacioLanding config={CONFIG} galeria={galeria} />;
}
