import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Cargando Proyeccion...',
};

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function MasterRoute({ params }: PageProps) {
  await params;
  // Public routes are explicit modules. Generic data-driven rendering is private under /app.
  notFound();
}
