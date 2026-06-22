import { Metadata } from 'next';
import { AgnosticRoutePage } from '../agnostic-route-page';

export const metadata: Metadata = {
  title: 'Cargando Proyeccion...',
};

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function MasterRoute({ params }: PageProps) {
  const { slug } = await params;
  return <AgnosticRoutePage slug={slug} />;
}
