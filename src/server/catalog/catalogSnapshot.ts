import { createHash } from 'node:crypto';
import {
  STRUCTURAL_NAMESPACES,
  type CatalogRecord,
  type StructuralNamespace,
} from './readOnlyCatalog';

export const CATALOG_SNAPSHOT_FORMAT = 'agnostic-structural-catalog/v1' as const;

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

export type CatalogSnapshot = {
  format: typeof CATALOG_SNAPSHOT_FORMAT;
  exported_at: string;
  namespaces: readonly StructuralNamespace[];
  records: readonly CatalogRecord[];
  catalog_sha256: string;
};

/** Creates a stable, portable snapshot. The timestamp is deliberately excluded from the hash. */
export function createCatalogSnapshot(
  records: readonly CatalogRecord[],
  exportedAt = new Date().toISOString(),
): CatalogSnapshot {
  const normalizedRecords = records
    .map(normalizeRecord)
    .sort((a, b) => a.namespace.localeCompare(b.namespace) || a.id.localeCompare(b.id));

  const digestInput = {
    format: CATALOG_SNAPSHOT_FORMAT,
    namespaces: [...STRUCTURAL_NAMESPACES],
    records: normalizedRecords.map(record => ({
      id: record.id,
      namespace: record.namespace,
      context: record.context,
      data: record.data,
    })),
  };

  return {
    format: CATALOG_SNAPSHOT_FORMAT,
    exported_at: exportedAt,
    namespaces: [...STRUCTURAL_NAMESPACES],
    records: normalizedRecords,
    catalog_sha256: sha256(canonicalStringify(digestInput)),
  };
}

export function serializeCatalogSnapshot(snapshot: CatalogSnapshot): string {
  return `${JSON.stringify(canonicalize(snapshot), null, 2)}\n`;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function normalizeRecord(record: CatalogRecord): CatalogRecord {
  return {
    id: record.id,
    namespace: record.namespace,
    context: record.context,
    data: canonicalize(record.data) as Record<string, unknown>,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function canonicalize(value: unknown): CanonicalValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Catalog snapshots cannot contain non-finite numbers.');
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, CanonicalValue>>((result, key) => {
        result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }
  throw new Error(`Catalog snapshots cannot serialize ${typeof value} values.`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
