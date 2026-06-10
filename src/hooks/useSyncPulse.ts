'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMateriaStore, useDNAStore } from '@/lib/agnostic/store';
import { SYSTEM_NS } from '@/lib/agnostic/constants';

/**
 * Polls /api/pulse for each namespace and refetches data when the SHA changes.
 *
 * Flow per tick:
 *   1. GET /api/pulse?namespace=X  →  { sha }
 *   2. Compare with last known SHA stored in a ref (no re-render on compare)
 *   3. If changed → GET /api/vault?namespace=X → hydrate Zustand for that namespace only
 *   4. Pause when tab is hidden to avoid unnecessary GitHub API calls
 *
 * @param namespaces  List of namespace strings to watch
 * @param intervalMs  Poll interval in ms (default 5000). Should be >= 4000 to
 *                    stay within GitHub's 5000 req/hour rate limit at typical scale.
 */
export function useSyncPulse(namespaces: string[], intervalMs = 5000) {
  const shaMapRef = useRef<Record<string, string | null>>({});
  const { hydrate: hydrateMateria } = useMateriaStore();
  const { hydrate: hydrateDNA } = useDNAStore();

  const refetchNamespace = useCallback(async (ns: string) => {
    try {
      const res = await fetch(`/api/vault?namespace=${ns}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.records) return;

      hydrateMateria({ [ns]: data.records });

      // Keep DNA store in sync when system namespaces change
      if (ns === SYSTEM_NS.ROUTES || ns === SYSTEM_NS.SCHEMAS) {
        const current = useMateriaStore.getState().data;
        hydrateDNA(
          current[SYSTEM_NS.ROUTES] || [],
          current[SYSTEM_NS.SCHEMAS] || []
        );
      }
    } catch {
      // Silent — refetch failures don't break the UI
    }
  }, [hydrateMateria, hydrateDNA]);

  const checkPulse = useCallback(async () => {
    // Skip when tab is hidden to save GitHub API quota
    if (typeof document !== 'undefined' && document.hidden) return;

    for (const ns of namespaces) {
      try {
        const res = await fetch(`/api/pulse?namespace=${ns}`);
        if (!res.ok) continue;
        const { sha } = await res.json() as { sha: string | null };

        const prev = shaMapRef.current[ns];

        if (prev === undefined) {
          // First tick: record SHA, no refetch (data was SSR'd)
          shaMapRef.current[ns] = sha;
          continue;
        }

        // Only refetch when SHA is real and actually changed
        if (sha !== null && sha !== prev) {
          shaMapRef.current[ns] = sha;
          await refetchNamespace(ns);
        }
      } catch {
        // Silent — pulse failures don't break the UI
      }
    }
  }, [namespaces, refetchNamespace]);

  useEffect(() => {
    if (namespaces.length === 0) return;

    const id = setInterval(checkPulse, intervalMs);
    return () => clearInterval(id);
  // namespaces array identity would cause infinite re-register; join is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespaces.join(','), intervalMs, checkPulse]);
}
