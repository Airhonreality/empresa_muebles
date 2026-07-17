import { describe, expect, it } from 'vitest';
import {
  canonicalStringify,
  createCatalogSnapshot,
  serializeCatalogSnapshot,
} from './catalogSnapshot';
import type { CatalogRecord } from './readOnlyCatalog';

const records: CatalogRecord[] = [
  {
    id: 'route-b',
    namespace: 'page_routes',
    context: 'page_routes',
    data: { z: true, a: { beta: 2, alpha: 1 } },
    created_at: null,
    updated_at: null,
  },
  {
    id: 'schema-a',
    namespace: 'schema_definitions',
    context: 'schema_definitions',
    data: { name: 'productos' },
    created_at: null,
    updated_at: null,
  },
];

describe('catalog snapshots', () => {
  it('has a stable hash despite input order and export timestamp', () => {
    const first = createCatalogSnapshot(records, '2026-07-17T00:00:00.000Z');
    const second = createCatalogSnapshot([...records].reverse(), '2026-07-18T00:00:00.000Z');

    expect(first.catalog_sha256).toBe(second.catalog_sha256);
    expect(first.records.map(record => record.id)).toEqual(['route-b', 'schema-a']);
  });

  it('changes the hash when catalog content changes', () => {
    const original = createCatalogSnapshot(records, '2026-07-17T00:00:00.000Z');
    const changed = createCatalogSnapshot([
      { ...records[0], data: { ...records[0].data, z: false } },
      records[1],
    ], '2026-07-17T00:00:00.000Z');

    expect(changed.catalog_sha256).not.toBe(original.catalog_sha256);
  });

  it('keeps evidence timestamps outside the catalog digest', () => {
    const original = createCatalogSnapshot(records, '2026-07-17T00:00:00.000Z');
    const withNewEvidence = createCatalogSnapshot([
      { ...records[0], created_at: '2026-07-17T01:00:00.000Z', updated_at: '2026-07-17T02:00:00.000Z' },
      records[1],
    ], '2026-07-17T00:00:00.000Z');

    expect(withNewEvidence.catalog_sha256).toBe(original.catalog_sha256);
    expect(withNewEvidence.records[0].updated_at).toBe('2026-07-17T02:00:00.000Z');
  });

  it('serializes canonical UTF-8 JSON with a trailing newline', () => {
    const snapshot = createCatalogSnapshot(records, '2026-07-17T00:00:00.000Z');
    const serialized = serializeCatalogSnapshot(snapshot);

    expect(serialized.endsWith('\n')).toBe(true);
    expect(Buffer.from(serialized, 'utf8').subarray(0, 3)).not.toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(canonicalStringify({ z: 1, a: 2 })).toBe('{"a":2,"z":1}');
  });
});
