import 'server-only'
import { getStrategy } from '@/server/getStrategy'

export type PublicProposalSnapshot = {
  title: string
  issued_at: string
  client?: { name?: string; location?: string }
  financial?: {
    carpentry: { materials: number; labor: number; operating_costs: number; contingencies: number; discount: number; adjustment: number; vat: number; total: number }
    civil_estimate: { labor: number; logistics: number; materials: number; total: number }
    remodel_total: number
  }
  spaces: Array<{
    id: string
    name: string
    description?: string
    variants: Array<{
      name: string
      selected?: boolean
      colors?: Array<{ name: string; image_url?: string }>
      images?: Array<{ url: string; description?: string }>
      notes?: string[]
      items: Array<{ name: string; quantity: number; unit?: string; unit_price: number; line_total: number; image_url?: string }>
      civil_estimate?: Array<{ category: string; name: string; quantity: number; unit?: string; unit_price: number; line_total: number; notes?: string }>
      materials_total: number
      labor_total: number
      total: number
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
