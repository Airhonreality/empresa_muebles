import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { previsualizarPropuestaPublicaAction, hidratarClientePropuesta } from '@/lib/data/actions/public'
import { PropuestaPublicaClient } from '@/app/(publico)/propuesta/[proyectoId]/PropuestaPublicaClient'

// Vista previa de la propuesta sin publicar. Vive SOLO dentro del ERP (bajo /erp, con el gate de
// middleware y el layout que exige sesión de empleado). Antes esta vista estaba en la ruta pública
// /propuesta/[id]?preview=1; el cliente final no debe poder pedir cambios sin publicar.
// previsualizarPropuestaPublicaAction exige permiso cotizador:leer (protegerAccion).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Vista previa de propuesta — ERP Veta Dorada',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ proyectoId: string }>
}

export default async function VistaPreviaPropuestaPage({ params }: PageProps) {
  const { proyectoId } = await params
  const data = await hidratarClientePropuesta(await previsualizarPropuestaPublicaAction(proyectoId))
  if (!data) notFound()

  const banner = (
    <div className="bg-gold-500/90 px-4 py-2 text-center text-xs font-semibold text-white print:hidden">
      🔍 Vista previa — cambios sin publicar. El cliente NO ve esto todavía.
    </div>
  )

  return <PropuestaPublicaClient data={data} banner={banner} />
}
