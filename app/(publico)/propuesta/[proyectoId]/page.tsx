import type { Metadata } from 'next'
import { obtenerPropuestaPublicaAction } from '@/lib/data/actions/public'
import { PropuestaPublicaClient } from './PropuestaPublicaClient'

// Server Component (auditoría 2026-08-15, A4): antes 'use client' con useDataStore() (leía el
// snapshot completo del ERP — de cualquier proyecto, no solo el de este link — y filtraba
// client-side). Ahora trae solo los datos de ESTE proyecto, ya proyectados a campos públicos
// (R2 disenio_F08_propuesta_publica.md: sin id interno/costo/margen/proveedorId del catálogo),
// vía obtenerPropuestaPublicaAction (lib/data/actions/public.ts).
export const dynamic = 'force-dynamic'

// F-08 es "público con link" (Roles: público con link, disenio_F08_propuesta_publica.md línea 3)
// — un enlace puntual compartido con un cliente, con UUID no adivinable (proyectos.id =
// uuid().defaultRandom()), no contenido para buscar en Google. noindex es defensa en
// profundidad, consistente con cómo ya se trata /cuenta y /erp.
export const metadata: Metadata = {
  title: 'Propuesta comercial — Veta Dorada',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ proyectoId: string }>
}

export default async function PropuestaPublicaPage({ params }: PageProps) {
  const { proyectoId } = await params
  const data = await obtenerPropuestaPublicaAction(proyectoId)

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-text-muted">Propuesta no encontrada.</p>
      </div>
    )
  }

  return <PropuestaPublicaClient data={data} />
}
