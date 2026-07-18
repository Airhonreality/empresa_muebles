import type { CatalogSnapshot } from './catalogSnapshot';
import type { CatalogRecord, StructuralNamespace } from './readOnlyCatalog';

export const DEFINITION_MODE = {
  LEGACY: 'legacy',
  REVISION: 'revision',
} as const;

export type DefinitionMode = typeof DEFINITION_MODE[keyof typeof DEFINITION_MODE];

export type DefinitionRevision = {
  revision_id: string;
  catalog_sha256: string;
  source_commit: string;
  created_at: string;
  catalog: CatalogSnapshot;
};

export interface DefinitionReader {
  readActiveRevision(): Promise<DefinitionRevision | null>;
}

export function getDefinitionMode(value = process.env.AGNOSTIC_DEFINITION_MODE): DefinitionMode {
  return value?.trim().toLowerCase() === DEFINITION_MODE.REVISION
    ? DEFINITION_MODE.REVISION
    : DEFINITION_MODE.LEGACY;
}

export function assertExpectedRevision(
  revision: DefinitionRevision | null,
  expectedRevisionId = process.env.AGNOSTIC_EXPECTED_DEFINITION_REVISION,
): DefinitionRevision {
  if (!revision) throw new Error('DEFINITION_REVISION_MISSING');
  if (!expectedRevisionId) throw new Error('DEFINITION_REVISION_EXPECTATION_MISSING');
  if (revision.revision_id !== expectedRevisionId) {
    throw new Error(`DEFINITION_REVISION_MISMATCH: expected ${expectedRevisionId}, active ${revision.revision_id}`);
  }
  return revision;
}

export function recordsForNamespace(
  revision: DefinitionRevision,
  namespace: StructuralNamespace,
): CatalogRecord[] {
  return revision.catalog.records.filter(record => record.namespace === namespace);
}
