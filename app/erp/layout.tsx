import type { Metadata } from 'next'
import { ErpShell } from '@/components/veta/erp-shell'
import { QueryProvider } from '@/components/erp/query-provider'
import { ToastProvider } from '@/components/veta/toast-provider'
import { requireSesionEmpleado } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'ERP — Veta Dorada',
  robots: 'noindex, nofollow',
}

// Duración máxima de función para longPollVersionAction (lib/data/actions/longpoll.ts, t-132).
// La config se declara acá porque una función 'use server' no puede exportar valores no-función.
export const maxDuration = 25
export const dynamic = 'force-dynamic'

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requireSesionEmpleado()
  return (
    <QueryProvider>
      <ToastProvider>
        <ErpShell usuario={sesion ? { nombre: sesion.nombre, rol: sesion.rol } : null}>{children}</ErpShell>
      </ToastProvider>
    </QueryProvider>
  )
}
