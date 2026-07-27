'use client';

import { useCallback, useEffect, useRef } from 'react';

export type PublicReadRecord = Record<string, string | number | boolean | Array<string | number | boolean> | null>;

/**
 * Polls a declared public resource. It deliberately has no namespace argument,
 * so public pages cannot fall back to the private Vault transport.
 */
export function usePublicReadModelPulse(
  resource: string | null | undefined,
  onRecords: (records: PublicReadRecord[]) => void,
  intervalMs = 5000,
) {
  const revisionRef = useRef<string | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!resource || (typeof document !== 'undefined' && document.hidden)) return;
    const response = await fetch(`/api/public-data/${encodeURIComponent(resource)}/pulse`);
    if (!response.ok) return;
    const pulse = await response.json() as { success?: boolean, revision?: string | null };
    if (!pulse.success) return;
    if (revisionRef.current === undefined) {
      revisionRef.current = pulse.revision ?? null;
      return;
    }
    if (pulse.revision === revisionRef.current) return;
    revisionRef.current = pulse.revision ?? null;
    const dataResponse = await fetch(`/api/public-data/${encodeURIComponent(resource)}`);
    if (!dataResponse.ok) return;
    const data = await dataResponse.json() as { success?: boolean, records?: PublicReadRecord[] };
    if (data.success && data.records) onRecords(data.records);
  }, [resource, onRecords]);

  useEffect(() => {
    if (!resource) return;
    const interval = window.setInterval(() => { void refresh(); }, intervalMs);
    return () => window.clearInterval(interval);
  }, [resource, intervalMs, refresh]);
}
