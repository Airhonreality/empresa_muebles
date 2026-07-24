import 'server-only'
import { getStrategy } from '@/server/getStrategy'

export type PublicProposalSnapshot = {
  title: string
  issued_at: string
  financial?: {
    carpentry_total: number
    civil_estimate_total: number
    subtotal?: number
    costos_operativos?: number
    imprevistos?: number
    descuento?: number
    ajuste?: number
    aplica_iva?: boolean
    pct_iva?: number
    iva?: number
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
      items: Array<{ name: string; quantity: number; unit?: string; image_url?: string; unit_price?: number; total?: number }>
      civil_estimate?: Array<{ category: string; name: string; quantity: number; unit?: string; unit_price?: number; total?: number; notes?: string }>
      total: number
    }>
  }>
}

type SnapshotRecord = Record<string, unknown>

const asNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0
const asText = (value: unknown) => typeof value === 'string' ? value : ''

// The stored snapshot can contain private commercial metadata from earlier versions.
// Project it explicitly before crossing the server-to-client boundary.
function projectPublicProposal(snapshot: SnapshotRecord): PublicProposalSnapshot {
  const financial = snapshot.financial as SnapshotRecord | undefined
  const carpentry = financial?.carpentry as SnapshotRecord | undefined
  const civilEstimate = financial?.civil_estimate as SnapshotRecord | undefined
  const rawSpaces = Array.isArray(snapshot.spaces) ? snapshot.spaces : []

  return {
    title: asText(snapshot.title) || 'Propuesta de diseno',
    issued_at: asText(snapshot.issued_at),
    financial: financial ? {
      carpentry_total: asNumber(financial.carpentry_total ?? carpentry?.total),
      civil_estimate_total: asNumber(financial.civil_estimate_total ?? civilEstimate?.total),
      subtotal: asNumber(financial.subtotal),
      costos_operativos: asNumber(financial.costos_operativos),
      imprevistos: asNumber(financial.imprevistos),
      descuento: asNumber(financial.descuento),
      ajuste: asNumber(financial.ajuste),
      aplica_iva: Boolean(financial.aplica_iva),
      pct_iva: asNumber(financial.pct_iva),
      iva: asNumber(financial.iva),
    } : undefined,
    spaces: rawSpaces.map((rawSpace, spaceIndex) => {
      const space = (rawSpace ?? {}) as SnapshotRecord
      const rawVariants = Array.isArray(space.variants) ? space.variants : []
      const selectedVariant = rawVariants.find(rawVariant => Boolean((rawVariant as SnapshotRecord)?.selected)) ?? rawVariants[0]
      return {
        id: `space-${spaceIndex + 1}`,
        name: asText(space.name) || `Espacio ${spaceIndex + 1}`,
        description: asText(space.description) || undefined,
        variants: selectedVariant ? [selectedVariant].map(rawVariant => {
          const variant = (rawVariant ?? {}) as SnapshotRecord
          const rawColors = Array.isArray(variant.colors) ? variant.colors : []
          const rawImages = Array.isArray(variant.images) ? variant.images : []
          const rawItems = Array.isArray(variant.items) ? variant.items : []
          const rawCivilItems = Array.isArray(variant.civil_estimate) ? variant.civil_estimate : []
          const rawNotes = Array.isArray(variant.notes) ? variant.notes : []
          return {
            name: asText(variant.name) || 'Alternativa',
            selected: true,
            colors: rawColors.map(rawColor => {
              const color = (rawColor ?? {}) as SnapshotRecord
              return { name: asText(color.name), image_url: asText(color.image_url) || undefined }
            }).filter(color => color.name),
            images: rawImages.map(rawImage => {
              const image = (rawImage ?? {}) as SnapshotRecord
              return { url: asText(image.url), description: asText(image.description) || undefined }
            }).filter(image => image.url),
            notes: rawNotes.map(asText).filter(Boolean),
            items: rawItems.map(rawItem => {
              const item = (rawItem ?? {}) as SnapshotRecord
              return {
                name: asText(item.name) || 'Item incluido',
                quantity: asNumber(item.quantity),
                unit: asText(item.unit) || undefined,
                image_url: asText(item.image_url) || undefined,
                unit_price: asNumber(item.unit_price),
                total: asNumber(item.total),
              }
            }),
            civil_estimate: rawCivilItems.map(rawItem => {
              const item = (rawItem ?? {}) as SnapshotRecord
              return {
                category: asText(item.category),
                name: asText(item.name) || 'Item de obra civil',
                quantity: asNumber(item.quantity),
                unit: asText(item.unit) || undefined,
                unit_price: asNumber(item.unit_price),
                total: asNumber(item.total),
                notes: asText(item.notes) || undefined,
              }
            }),
            total: asNumber(variant.total),
          }
        }) : [],
      }
    }),
  }
}

export async function getPublicProposal(slug: string): Promise<PublicProposalSnapshot | null> {
  const records = await getStrategy().read('propuestas_publicas') as Array<{ data?: Record<string, unknown> }>
  const record = records.find((item) => item.data?.public_slug === slug && item.data?.estado === 'publicada')
  if (!record) return null
  const snapshot = record.data?.snapshot_json
  if (typeof snapshot !== 'string') return null
  try {
    const parsed = JSON.parse(snapshot)
    return parsed && typeof parsed === 'object' ? projectPublicProposal(parsed as SnapshotRecord) : null
  } catch {
    return null
  }
}
