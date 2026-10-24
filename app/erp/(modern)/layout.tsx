import { DataStoreProvider } from '@/lib/data/DataStoreProvider'
import { emptySnapshot } from '@/lib/data/snapshot'

export const dynamic = 'force-dynamic'

export default function ModernLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataStoreProvider mode="drizzle" initialSnapshot={emptySnapshot()} eventOnly>
      {children}
    </DataStoreProvider>
  )
}
