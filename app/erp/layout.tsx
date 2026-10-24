import type { Metadata } from 'next'
import { ErpShell } from '@/components/veta/erp-shell'
import { QueryProvider } from '@/components/erp/query-provider'
import { ToastProvider } from '@/components/veta/toast-provider'

export const metadata: Metadata = {
  title: 'ERP — Veta Dorada',
  robots: 'noindex, nofollow',
}

// Duración máxima de función para longPollVersionAction (lib/data/actions/longpoll.ts, t-132).
// La config se declara acá porque una función 'use server' no puede exportar valores no-función.
export const maxDuration = 25
export const dynamic = 'force-dynamic'

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <ErpShell>{children}</ErpShell>
      </ToastProvider>
    </QueryProvider>
  )
}
