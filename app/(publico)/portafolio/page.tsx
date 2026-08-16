import type { Metadata } from 'next';
import { listarPortafolioPublicadosAction } from '@/lib/data/actions/public';
import { SITE_URL } from '@/lib/seo/jsonld';
import { PortafolioListaClient } from './PortafolioListaClient';

// Server Component (auditoría 2026-08-15, A3): antes 'use client' con useDataStore() (ya no
// hidrata el árbol público, ver app/layout.tsx). Trae los proyectos publicados por Server Action
// escopada y delega toda la interactividad (hover, scroll loop) a PortafolioListaClient.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portafolio — Veta Dorada',
  description: 'Una selección de obras recientes en carpintería arquitectónica y mobiliario a la medida en Bogotá.',
  alternates: { canonical: `${SITE_URL}/portafolio` },
};

export default async function PortafolioPage() {
  const proyectos = await listarPortafolioPublicadosAction();
  return <PortafolioListaClient proyectos={proyectos} />;
}
