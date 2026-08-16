import { redirect } from 'next/navigation'
import { requireSesionCliente } from '@/lib/auth/session'
import { obtenerProyectosClienteAction } from '@/lib/data/actions/public'
import { MisProyectosLista } from './mis-proyectos-lista'

// F-07 Portal Cliente — Índice: lista de proyectos del cliente autenticado.
// Server Component: hace el guard de sesión y trae los datos ya escopados a este cliente
// (auditoría 2026-08-15, A5: antes el componente hijo leía useDataStore(), el snapshot completo
// del ERP, y filtraba client-side — el filtro por clienteId era solo de UI).

export default async function CuentaPage() {
  const clienteId = await requireSesionCliente()
  if (!clienteId) redirect('/cuenta/login')

  const data = await obtenerProyectosClienteAction(clienteId)

  return <MisProyectosLista data={data} />
}
