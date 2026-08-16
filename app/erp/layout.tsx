import type { Metadata } from 'next'
import { ErpShell } from '@/components/veta/erp-shell'
// Import directo de DataStoreProvider.tsx (no del barrel lib/data/index.ts): index.ts también
// define useDataStore() (usa useSyncExternalStore, hook de cliente), y Next marca este Server
// Component entero como "necesita 'use client'" si lo importa transitivamente. Mismo patrón que
// getDataStore() en lib/auth/session.ts — ver comentario en lib/data/store.ts.
import { DataStoreProvider } from '@/lib/data/DataStoreProvider'
import type { StoreSnapshot } from '@/lib/data/snapshot'

export const metadata: Metadata = {
  title: 'ERP — Veta Dorada',
  robots: 'noindex, nofollow',
}

// Hidratación completa del snapshot del ERP — movida acá desde app/layout.tsx (auditoría
// 2026-08-15, arnes/lineas/demanda/auditoria_prelanzamiento_seo_20260815.md): este layout SOLO
// envuelve /erp/**, ya gateado por middleware.ts (sesión de empleado válida). El snapshot
// completo (todas las tablas, sin proyección) es correcto acá porque el equipo interno necesita
// verlo todo — pero nunca debe llegar al HTML de una página pública, que es lo que pasaba cuando
// esta hidratación vivía en el layout raíz compartido con app/(publico)/.
//
// Duración máxima de función para longPollVersionAction (lib/data/actions/longpoll.ts, t-132):
// una función 'use server' no puede exportar valores no-función, así que el límite de duración
// se declara acá (route segment config del layout que envuelve a DataStoreProvider).
// Verificar contra el límite real del plan de Vercel configurado en el dashboard antes de subir.
export const maxDuration = 25

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const impl = process.env.DATA_IMPL ?? 'mock'
  let initialSnapshot: StoreSnapshot | undefined
  if (impl === 'drizzle') {
    const { fetchSnapshotAction } = await import('@/lib/data/actions/hydrate')
    initialSnapshot = await fetchSnapshotAction()
  }

  return (
    <DataStoreProvider mode={impl === 'drizzle' ? 'drizzle' : 'mock'} initialSnapshot={initialSnapshot}>
      <ErpShell>{children}</ErpShell>
    </DataStoreProvider>
  )
}
