import { redirect } from 'next/navigation'
import { requireSesionCliente } from '@/lib/auth/session'
import { MisProyectosLista } from './mis-proyectos-lista'

// F-07 Portal Cliente — Índice: lista de proyectos del cliente autenticado.
// Server Component: hace el guard de sesión y pasa clienteId al componente hijo.

export default async function CuentaPage() {
  const clienteId = await requireSesionCliente()
  if (!clienteId) redirect('/cuenta/login')

  return <MisProyectosLista clienteId={clienteId} />
}
