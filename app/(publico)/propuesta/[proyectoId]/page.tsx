import type { Metadata } from 'next'
import {
  obtenerPropuestaPublicaAction,
  previsualizarPropuestaPublicaAction,
  obtenerVersionPropuestaPorNumeroAction,
  type PropuestaPublicaData,
} from '@/lib/data/actions/public'
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
  searchParams: Promise<{ preview?: string; version?: string }>
}

export default async function PropuestaPublicaPage({ params, searchParams }: PageProps) {
  const { proyectoId } = await params
  const sp = await searchParams

  // Control de versiones amigable (2026-09-11): el empleado necesita ver "cómo quedaría" sin
  // ensuciar el histórico (preview, nunca se guarda) o revisar una versión pasada puntual
  // (version=N) antes de decidir si la elimina — sin esto, la única vista posible era siempre
  // "la última publicada", que no alcanza para el flujo de control de calidad pedido.
  let data: PropuestaPublicaData | null
  let banner: 'preview' | { version: number } | null = null

  if (sp.preview === '1' || sp.preview === 'true') {
    data = await previsualizarPropuestaPublicaAction(proyectoId)
    banner = 'preview'
  } else if (sp.version) {
    const version = Number(sp.version)
    const fila = Number.isFinite(version) ? await obtenerVersionPropuestaPorNumeroAction(proyectoId, version) : null
    data = fila ? (fila.snapshotJson as PropuestaPublicaData) : null
    if (fila) banner = { version: fila.version }
  } else {
    data = await obtenerPropuestaPublicaAction(proyectoId)
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-text-muted">Propuesta no encontrada.</p>
      </div>
    )
  }

  const bannerNode = banner === 'preview' ? (
    <div className="bg-gold-500/90 px-4 py-2 text-center text-xs font-semibold text-white print:hidden">
      🔍 Vista previa — cambios sin publicar. El cliente NO ve esto todavía.
    </div>
  ) : undefined

  return <PropuestaPublicaClient data={data} banner={bannerNode} />
}
