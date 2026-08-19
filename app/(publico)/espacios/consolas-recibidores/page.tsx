import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'consola_recibidor';

// Lee galería real/renders vía Server Action (obtenerGaleriaEspacioAction) — mismo criterio
// que el resto del sitio público con datos vivos (ver app/(publico)/page.tsx).
export const dynamic = 'force-dynamic';

// F-09 (Landings SEO por categoría), copy textual de
// arnes/lineas/demanda/contenido/contenido_F09_landings.md §3.5, aprobado por el Supervisor
// 2026-08-09. No se fabrica copy nuevo acá.
const CONFIG: EspacioLandingConfig = {
  slug: 'consolas-recibidores',
  nombreCategoria: 'Consolas y Recibidores',
  h1: 'Consolas y recibidores a medida',
  subtitulo: 'La primera impresión de tu hogar, diseñada a tu estilo',
  parrafoDescriptor:
    'Consolas y recibidores que dan la bienvenida a tu hogar con estilo y funcionalidad. Cada pieza es única y diseñada para tu espacio.',
  imageKey: 'espaciosConsolas',
};

export const metadata: Metadata = {
  title: 'Consolas y Recibidores a Medida en Bogotá',
  description:
    'Consolas y recibidores a medida en Bogotá. Diseño personalizado, materiales resistentes y instalación profesional.',
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
  ...socialMeta({
    title: 'Consolas y Recibidores a Medida en Bogotá',
    description:
      'Consolas y recibidores a medida en Bogotá. Diseño personalizado, materiales resistentes y instalación profesional.',
    path: `/espacios/${CONFIG.slug}`,
  }),
};

export default async function ConsolasRecibidoresPage() {
  const galeria = await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO);
  return <EspacioLanding config={CONFIG} galeria={galeria} />;
}
