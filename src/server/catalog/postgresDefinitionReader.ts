import postgres from 'postgres';
import {
  assertExpectedRevision,
  type DefinitionReader,
  type DefinitionRevision,
} from './definitionRevision';
import { createCatalogSnapshot, type CatalogSnapshot } from './catalogSnapshot';
import type { CatalogRecord } from './readOnlyCatalog';

type RevisionRow = {
  revision_id: string;
  catalog_sha256: string;
  source_commit: string;
  created_at: Date | string;
  catalog: unknown;
};

/** Reads only the active immutable bundle. It never touches operational records. */
export class PostgresDefinitionReader implements DefinitionReader {
  private readonly sql: ReturnType<typeof postgres>;

  constructor(databaseUrl: string) {
    if (!databaseUrl) throw new Error('DATABASE_URL is required in revision mode.');
    this.sql = postgres(databaseUrl, { max: 2, connect_timeout: 5, idle_timeout: 10 });
  }

  async readActiveRevision(): Promise<DefinitionRevision | null> {
    const rows = await this.sql<RevisionRow[]>`
      SELECT revision_id, catalog_sha256, source_commit, created_at, catalog
      FROM agnostic_definition_revisions
      WHERE revision_id = (
        SELECT active_revision_id FROM agnostic_definition_release WHERE release_key = 'active'
      )
    `;
    if (rows.length === 0) return null;
    return normalizeRevision(rows[0]);
  }

  async readExpectedRevision(expectedRevisionId = process.env.AGNOSTIC_EXPECTED_DEFINITION_REVISION): Promise<DefinitionRevision> {
    return assertExpectedRevision(await this.readActiveRevision(), expectedRevisionId);
  }
}

function normalizeRevision(row: RevisionRow): DefinitionRevision {
  if (!isObject(row.catalog) || !Array.isArray(row.catalog.records)) {
    throw new Error(`Definition revision ${row.revision_id} has an invalid catalog bundle.`);
  }
  const records = row.catalog.records as CatalogRecord[];
  const catalog = createCatalogSnapshot(records, stringTimestamp(row.catalog.exported_at));
  if (catalog.catalog_sha256 !== row.catalog_sha256) {
    throw new Error(`Definition revision ${row.revision_id} failed catalog hash verification.`);
  }
  return {
    revision_id: row.revision_id,
    catalog_sha256: row.catalog_sha256,
    source_commit: row.source_commit,
    created_at: stringTimestamp(row.created_at),
    catalog: catalog as CatalogSnapshot,
  };
}

function stringTimestamp(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString();
  throw new Error('Definition revision has an invalid timestamp.');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
