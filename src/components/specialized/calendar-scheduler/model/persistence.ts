import type { BlockProps } from '@agnostic/core'
import type { DataRecord, EventData, EventRecord } from './types'

export function normalizeEventRecords(records: BlockProps['records']): EventRecord[] {
  return (records ?? [])
    .filter(record => record?.data?.start && record?.data?.end)
    .map(record => ({
      id: record.id,
      context: record.context,
      data: record.data as unknown as EventData,
    }))
}

export async function readNamespace<T>(namespace: string): Promise<Array<DataRecord<T>>> {
  const response = await fetch(`/api/vault?namespace=${encodeURIComponent(namespace)}`)
  const json = await response.json()
  if (!response.ok || json.success === false) return []
  return (json.records ?? []) as Array<DataRecord<T>>
}

export async function writeRecord<T extends object>(namespace: string, id: string | undefined, data: T) {
  const response = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { id, data } }),
  })
  const json = await response.json()
  if (!response.ok || json.success === false) throw new Error(json.error ?? `Could not write ${namespace}`)
}

export async function removeRecord(namespace: string, id: string) {
  const response = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'REMOVE', namespace, id }),
  })
  const json = await response.json()
  if (!response.ok || json.success === false) throw new Error(json.error ?? `Could not remove ${namespace}`)
}
