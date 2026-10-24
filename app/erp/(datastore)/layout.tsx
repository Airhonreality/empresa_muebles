import { DataStoreProvider } from '@/lib/data/DataStoreProvider'
import { fetchSnapshotAction } from '@/lib/data/actions/hydrate'

export const dynamic = 'force-dynamic'

export default async function DatastoreLayout({ children }: { children: React.ReactNode }) {
  const initialSnapshot = await fetchSnapshotAction()
  return (
    <DataStoreProvider mode="drizzle" initialSnapshot={initialSnapshot}>
      {children}
    </DataStoreProvider>
  )
}
