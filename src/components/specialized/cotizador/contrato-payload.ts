type RecordData = Record<string, unknown>

type QuoteRecord = {
  id?: unknown
  data?: unknown
  [key: string]: unknown
}

/**
 * The engine zap consumes a flat record and requires the Vault id at the
 * top level. Keep this boundary normalization in one place so callers do
 * not accidentally discard the id when they unwrap `data`.
 */
export function toContractZapRecord(value: unknown): RecordData | null {
  if (!value || typeof value !== 'object') return null

  const source = value as QuoteRecord
  const data = source.data

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return {
      ...(data as RecordData),
      ...(source.id !== undefined ? { id: source.id } : {})
    }
  }

  return { ...source } as RecordData
}
