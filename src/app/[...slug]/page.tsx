import { Metadata } from 'next';
import { AgnosticRoutePage } from '../agnostic-route-page';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = slug?.length > 0 ? `/${slug.join('/')}` : '/';

  const metadataMap: Record<string, Metadata> = {
    '/colecciones': {
      title: 'Colecciones — Veta Dorada | Muebles a medida en Bogotá',
      description: 'Explora nuestras colecciones de mobiliario terminado con precio fijo. Consolas, cavas, comedores y camas de fabricación directa en Bogotá.',
      openGraph: { title: 'Colecciones — Veta Dorada', description: 'Muebles de colección con precio fijo en Bogotá' },
    },
    '/portafolio': {
      title: 'Portafolio — Veta Dorada | Proyectos de carpintería arquitectónica',
      description: 'Conoce nuestros proyectos de cocinas integrales, closets walk-in, cavas y mobiliario a medida instalados en Bogotá.',
      openGraph: { title: 'Portafolio — Veta Dorada', description: 'Proyectos de mobiliario a medida en Bogotá' },
    },
    '/agendar': {
      title: 'Agendar Asesoría Gratis — Veta Dorada',
      description: 'Agenda una asesoría gratuita a domicilio para tu proyecto de mobiliario a medida en Bogotá. Te visitamos, medimos y cotizamos sin compromiso.',
      openGraph: { title: 'Agendar Asesoría — Veta Dorada', description: 'Asesoría gratuita a domicilio en Bogotá' },
    },
    '/cuenta': {
      title: 'Mi Cuenta — Veta Dorada',
      description: 'Inicia sesión o regístrate para gestionar tus pedidos, proyectos y acceder a tu portal de cliente.',
      robots: { index: false, follow: false },
    },
  };

  return metadataMap[path] ?? { title: 'Cargando...' };
}

export default async function MasterRoute({ params }: PageProps) {
  const { slug } = await params;
  return <AgnosticRoutePage slug={slug} />;
}
