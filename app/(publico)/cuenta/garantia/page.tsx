import { redirect } from 'next/navigation'
import { requireSesionCliente } from '@/lib/auth/session'
import { obtenerGarantiasClienteAction } from '@/lib/data/actions/public'
import { GarantiaHistorialClienteConReportar } from './garantia-historial-cliente'

// F-07 Portal Cliente — Historial de garantías del cliente.
// Server Component: hace el guard de sesión y trae los datos ya escopados a este cliente
// (auditoría 2026-08-15, A5).

export default async function GarantiaPage() {
  const clienteId = await requireSesionCliente()
  if (!clienteId) redirect('/cuenta/login')

  const data = await obtenerGarantiasClienteAction(clienteId)

  return <GarantiaHistorialClienteConReportar clienteId={clienteId} data={data} />
}
