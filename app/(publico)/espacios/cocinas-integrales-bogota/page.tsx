import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'cocinas-integrales';

export const dynamic = 'force-dynamic';

const CONFIG: EspacioLandingConfig = {
  slug: 'cocinas-integrales-bogota',
  nombreCategoria: 'Cocinas Integrales',
  h1: 'Tus espacios a medida. Sin intermediarios.',
  subtitulo: 'Nuestros clientes estrenan cocina y tranquilidad.',
  parrafoDescriptor:
    'Cocinas integrales a medida en Bogotá. Materiales de primera, Madecor RH y acabados personalizados.',
  imageKey: 'espaciosCocinas',
};

export const metadata: Metadata = {
  title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
  description:
    'Cocinas integrales a medida en Bogotá. Nuestros clientes estrenan cocina y tranquilidad. Materiales de primera, Madecor RH y acabados personalizados.',
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
  ...socialMeta({
    title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
    description:
      'Cocinas integrales a medida en Bogotá. Nuestros clientes estrenan cocina y tranquilidad. Materiales de primera, Madecor RH y acabados personalizados.',
    path: `/espacios/${CONFIG.slug}`,
  }),
};

export default async function CocinasIntegralesPage() {
  const galeria = await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO);
  return <EspacioLanding config={CONFIG} galeria={galeria} tipoEspacio={TIPO_ESPACIO_CODIGO} />;
}
