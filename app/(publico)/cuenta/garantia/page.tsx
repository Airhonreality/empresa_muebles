import { redirect } from 'next/navigation'
import { requireSesionCliente } from '@/lib/auth/session'
import { GarantiaHistorialCliente } from './garantia-historial-cliente'

// F-07 Portal Cliente — Historial de garantías del cliente.
// Server Component: hace el guard de sesión y pasa clienteId al componente hijo.

export default async function GarantiaPage() {
  const clienteId = await requireSesionCliente()
  if (!clienteId) redirect('/cuenta/login')

  return <GarantiaHistorialCliente clienteId={clienteId} />
}
