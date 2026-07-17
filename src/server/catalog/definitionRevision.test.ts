import { describe, expect, it } from 'vitest';
import { createCatalogSnapshot } from './catalogSnapshot';
import {
  assertExpectedRevision,
  DEFINITION_MODE,
  getDefinitionMode,
  recordsForNamespace,
  type DefinitionRevision,
} from './definitionRevision';

const catalog = createCatalogSnapshot([
  { id: 'route-root', namespace: 'page_routes', context: 'page_routes', data: { path: '/' }, created_at: null, updated_at: null },
  { id: 'schema-products', namespace: 'schema_definitions', context: 'schema_definitions', data: { name: 'products' }, created_at: null, updated_at: null },
], '2026-07-17T00:00:00.000Z');

const revision: DefinitionRevision = {
  revision_id: 'rev-001', catalog_sha256: catalog.catalog_sha256, source_commit: 'abc123', created_at: '2026-07-17T00:00:00.000Z', catalog,
};

describe('definition revisions', () => {
  it('requires an exact expected revision', () => {
    expect(assertExpectedRevision(revision, 'rev-001')).toBe(revision);
    expect(() => assertExpectedRevision(revision, 'rev-002')).toThrow('DEFINITION_REVISION_MISMATCH');
    expect(() => assertExpectedRevision(null, 'rev-001')).toThrow('DEFINITION_REVISION_MISSING');
    expect(() => assertExpectedRevision(revision, '')).toThrow('DEFINITION_REVISION_EXPECTATION_MISSING');
  });

  it('keeps structural records grouped by namespace', () => {
    expect(recordsForNamespace(revision, 'page_routes')).toHaveLength(1);
    expect(recordsForNamespace(revision, 'scripts')).toEqual([]);
  });

  it('only enables revision mode explicitly', () => {
    expect(getDefinitionMode('revision')).toBe(DEFINITION_MODE.REVISION);
    expect(getDefinitionMode('legacy')).toBe(DEFINITION_MODE.LEGACY);
    expect(getDefinitionMode('anything')).toBe(DEFINITION_MODE.LEGACY);
  });
});
