import type { DataItem } from '@agnostic/core';

export interface FieldPatch {
  data: Record<string, unknown>;
  _meta?: Record<string, string>; // ISO timestamps per field key
}

export interface MergeResult {
  data: Record<string, unknown>;
  _meta: Record<string, string>;
}

/**
 * Field-Level Last-Write-Wins merge.
 *
 * Each field is accepted independently: the incoming value wins only when
 * its timestamp is >= the stored timestamp for that field.
 * Fields absent from the patch are kept as-is (non-destructive partial update).
 *
 * Why timestamps on the client instead of the server: the client knows WHEN
 * the user made the change. Two users editing different fields simultaneously
 * both win on their own fields regardless of network arrival order.
 */
export function mergeFieldLWW(existing: DataItem, patch: FieldPatch): MergeResult {
  const mergedData = { ...existing.data };
  const existingMeta = ((existing as any)._meta as Record<string, string>) || {};
  const mergedMeta = { ...existingMeta };

  for (const [key, value] of Object.entries(patch.data)) {
    const patchTs = patch._meta?.[key] ?? new Date().toISOString();
    const storedTs = existingMeta[key];

    // Accept when no prior timestamp exists or patch is at least as recent.
    // ISO strings are lexicographically sortable, so >= works correctly.
    if (!storedTs || patchTs >= storedTs) {
      mergedData[key] = value;
      mergedMeta[key] = patchTs;
    }
  }

  return { data: mergedData, _meta: mergedMeta };
}
