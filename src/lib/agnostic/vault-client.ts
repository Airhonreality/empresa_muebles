/**
 * Vault Client — Single source of truth for API interactions.
 *
 * Replaces the duplicated vaultWrite/zapCall functions that were
 * copy-pasted across 7+ files in src/components/specialized/.
 */
import { useMateriaStore } from '@/lib/agnostic/store'
import { toast } from 'sonner'

/**
 * Write a record to the Vault API.
 * Returns the persisted record from the server.
 */
export async function vaultWrite(
  namespace: string,
  id: string | undefined,
  data: Record<string, unknown>
) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { id, data } }),
  })
  if (!res.ok) throw new Error(await res.text())
  const body = await res.json()
  return body.record ?? body
}

/**
 * Execute a Zap (server script) and process the returned events.
 * Automatically handles materia_sync (Zustand update) and notify (toast).
 */
export async function zapCall(
  zap: string,
  payload: Record<string, unknown>
) {
  const res = await fetch('/api/engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zap, payload }),
  })
  const { events = [] } = await res.json()
  for (const event of events) {
    if (event.action === 'materia_sync') {
      useMateriaStore.getState().updateItem(event.context, event.item)
    }
    if (event.action === 'notify') {
      event.type === 'success'
        ? toast.success(event.message)
        : toast.error(event.message)
    }
  }
}
