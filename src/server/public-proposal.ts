import 'server-only'
import { getStrategy } from '@/server/getStrategy'

export type PublicProposalSnapshot = {
  title: string
  issued_at: string
  client?: { name?: string; location?: string }
  spaces: Array<{
    id: string
    name: string
    description?: string
    variants: Array<{
      name: string
      selected?: boolean
      colors?: Array<{ name: string; image_url?: string }>
      images?: Array<{ url: string; description?: string }>
      items: Array<{ name: string; quantity: number; unit?: string; image_url?: string }>
    }>
  }>
}

export async function getPublicProposal(slug: string): Promise<PublicProposalSnapshot | null> {
  const records = await getStrategy().read('propuestas_publicas') as Array<{ data?: Record<string, unknown> }>
  const record = records.find((item) => item.data?.public_slug === slug && item.data?.estado === 'publicada')
  if (!record) return null
  const snapshot = record.data?.snapshot_json
  if (typeof snapshot !== 'string') return null
  try { return JSON.parse(snapshot) as PublicProposalSnapshot } catch { return null }
}
