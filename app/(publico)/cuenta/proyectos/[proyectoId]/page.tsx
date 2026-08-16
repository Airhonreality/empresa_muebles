import { redirect, notFound } from 'next/navigation'
import { requireSesionCliente } from '@/lib/auth/session'
import { obtenerProyectoClienteAction } from '@/lib/data/actions/public'
import { ProyectoDetalleCliente } from './proyecto-detalle-cliente'

// F-07 Portal Cliente — Detalle de proyecto.
// Server Component: valida sesión + ownership, luego renderiza componente hijo.
// Auditoría 2026-08-15 (A5): antes usaba getDataStore() (el singleton mock-only) para el chequeo
// de ownership — lanza a propósito bajo DATA_IMPL=drizzle (lib/data/store.ts), así que esta ruta
// crasheaba con datos reales. obtenerProyectoClienteAction ya verifica ownership server-side
// (defensa en profundidad) y funciona en ambos DATA_IMPL.

interface PageProps {
  params: Promise<{ proyectoId: string }>
}

export default async function ProyectoDetallePage({ params }: PageProps) {
  const clienteId = await requireSesionCliente()
  if (!clienteId) redirect('/cuenta/login')

  const { proyectoId } = await params
  const data = await obtenerProyectoClienteAction(proyectoId, clienteId)

  if (!data) {
    notFound()
  }

  return <ProyectoDetalleCliente proyectoId={proyectoId} clienteId={clienteId} data={data} />
}
