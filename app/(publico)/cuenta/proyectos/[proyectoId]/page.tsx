import { redirect, notFound } from 'next/navigation'
import { requireSesionCliente } from '@/lib/auth/session'
import { getDataStore } from '@/lib/data/store'
import { ProyectoDetalleCliente } from './proyecto-detalle-cliente'

// F-07 Portal Cliente — Detalle de proyecto.
// Server Component: valida sesión + ownership, luego renderiza componente hijo.

interface PageProps {
  params: Promise<{ proyectoId: string }>
}

export default async function ProyectoDetallePage({ params }: PageProps) {
  const clienteId = await requireSesionCliente()
  if (!clienteId) redirect('/cuenta/login')

  const { proyectoId } = await params
  const store = getDataStore()
  const proyecto = store.proyectos.obtenerPorId(proyectoId)

  if (!proyecto || proyecto.clienteId !== clienteId) {
    notFound()
  }

  return <ProyectoDetalleCliente proyectoId={proyectoId} clienteId={clienteId} />
}
