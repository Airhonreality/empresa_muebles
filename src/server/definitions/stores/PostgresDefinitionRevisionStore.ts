import {
  DefinitionRevisionConflictError,
  type DefinitionRevision,
  type DefinitionRevisionStore,
} from '@agnostic/core';
import postgres from 'postgres';

import { canonicalJson, revisionIdFor } from '../canonical';
import { DefinitionStoreError } from '../errors';

type SqlRow = Record<string, unknown>;

/**
 * Small injectable boundary around postgres.js. Tests can provide an in-memory
 * executor; production receives a connection string and keeps it private.
 */
export interface PostgresDefinitionExecutor {
  query<T extends SqlRow = SqlRow>(
    statement: string,
    parameters?: readonly unknown[],
  ): Promise<T[]>;
}

type PostgresDefinitionExecutorFactory = (
  databaseUrl: string,
) => PostgresDefinitionExecutor;

const executorsByDatabaseUrl = new Map<string, PostgresDefinitionExecutor>();
const bootstrapByExecutor = new WeakMap<PostgresDefinitionExecutor, Promise<void>>();

const BOOTSTRAP_SQL = `
  CREATE TABLE IF NOT EXISTS agnostic_definition_revisions (
    id          TEXT        PRIMARY KEY,
    bundle      JSONB       NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS agnostic_definition_state (
    state_key    TEXT        PRIMARY KEY CHECK (state_key = 'active'),
    revision_id  TEXT        NOT NULL REFERENCES agnostic_definition_revisions(id),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

function createExecutor(databaseUrl: string): PostgresDefinitionExecutor {
  const sql = postgres(databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return {
    async query<T extends SqlRow>(
      statement: string,
      parameters: readonly unknown[] = [],
    ): Promise<T[]> {
      return sql.unsafe(
        statement,
        [...parameters] as unknown as never[],
      ) as unknown as Promise<T[]>;
    },
  };
}

function sharedExecutor(
  databaseUrl: string,
  factory: PostgresDefinitionExecutorFactory,
): PostgresDefinitionExecutor {
  const existing = executorsByDatabaseUrl.get(databaseUrl);
  if (existing) return existing;

  const created = factory(databaseUrl);
  executorsByDatabaseUrl.set(databaseUrl, created);
  return created;
}

function parseBundle(value: unknown): DefinitionRevision {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as DefinitionRevision;
    } catch (error) {
      throw new DefinitionStoreError('Stored definition bundle is not valid JSON.', {
        cause: error,
      });
    }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new DefinitionStoreError('Stored definition bundle is not a JSON object.');
  }
  return value as DefinitionRevision;
}

export class PostgresDefinitionRevisionStore implements DefinitionRevisionStore {
  private readonly executor: PostgresDefinitionExecutor;

  constructor(
    databaseUrlOrExecutor: string | PostgresDefinitionExecutor,
    executorFactory: PostgresDefinitionExecutorFactory = createExecutor,
  ) {
    this.executor = typeof databaseUrlOrExecutor === 'string'
      ? sharedExecutor(databaseUrlOrExecutor, executorFactory)
      : databaseUrlOrExecutor;
  }

  private ensureTables(): Promise<void> {
    const existing = bootstrapByExecutor.get(this.executor);
    if (existing) return existing;

    const bootstrap = this.executor.query(BOOTSTRAP_SQL)
      .then(() => undefined)
      .catch(error => {
        bootstrapByExecutor.delete(this.executor);
        throw error;
      });
    bootstrapByExecutor.set(this.executor, bootstrap);
    return bootstrap;
  }

  async readActiveRevisionId(): Promise<string | null> {
    await this.ensureTables();
    const rows = await this.executor.query<{ revision_id: unknown }>(
      `SELECT revision_id
       FROM agnostic_definition_state
       WHERE state_key = 'active'
       LIMIT 1`,
    );
    if (rows.length === 0) return null;
    if (typeof rows[0].revision_id !== 'string' || rows[0].revision_id === '') {
      throw new DefinitionStoreError('Active definition revision id is invalid.');
    }
    return rows[0].revision_id;
  }

  async readRevision(id: string): Promise<DefinitionRevision | null> {
    await this.ensureTables();
    const rows = await this.executor.query<{ id: unknown; bundle: unknown }>(
      `SELECT id, bundle
       FROM agnostic_definition_revisions
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    if (rows.length === 0) return null;

    const rowId = rows[0].id;
    if (typeof rowId !== 'string' || rowId !== id) {
      throw new DefinitionStoreError(
        `Definition revision lookup returned an unexpected id for "${id}".`,
      );
    }

    const revision = parseBundle(rows[0].bundle);
    if (revision.id !== id) {
      throw new DefinitionStoreError(
        `Stored definition bundle id does not match row id "${id}".`,
      );
    }
    if (revisionIdFor(revision.definitions) !== id) {
      throw new DefinitionStoreError(
        `Stored definition bundle "${id}" failed content integrity verification.`,
      );
    }
    return revision;
  }

  async writeRevision(revision: DefinitionRevision): Promise<void> {
    await this.ensureTables();

    const computedId = revisionIdFor(revision.definitions);
    if (revision.id !== computedId) {
      throw new DefinitionStoreError(
        `Definition revision id does not match its content hash "${computedId}".`,
      );
    }
    if (revision.consistency !== 'atomic') {
      throw new DefinitionStoreError('Persistent definition revisions must be atomic.');
    }

    const rows = await this.executor.query<{ id: unknown }>(
      `INSERT INTO agnostic_definition_revisions (id, bundle)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [revision.id, canonicalJson(revision)],
    );

    if (rows.length > 0) return;

    // Content-addressed revisions are immutable. A duplicate is accepted only
    // when the complete stored bundle is byte-equivalent after canonicalization.
    const existing = await this.readRevision(revision.id);
    if (!existing || canonicalJson(existing) !== canonicalJson(revision)) {
      throw new DefinitionStoreError(
        `Definition revision "${revision.id}" already exists with different content.`,
      );
    }
  }

  async activate(expected: string | null, next: string): Promise<void> {
    await this.ensureTables();

    const rows = expected === null
      ? await this.executor.query<{ revision_id: unknown }>(
          `INSERT INTO agnostic_definition_state (state_key, revision_id)
           VALUES ('active', $1)
           ON CONFLICT (state_key) DO NOTHING
           RETURNING revision_id`,
          [next],
        )
      : await this.executor.query<{ revision_id: unknown }>(
          `UPDATE agnostic_definition_state
           SET revision_id = $1, updated_at = NOW()
           WHERE state_key = 'active' AND revision_id = $2
           RETURNING revision_id`,
          [next, expected],
        );

    if (rows.length > 0 && rows[0].revision_id === next) return;

    const actual = await this.readActiveRevisionId();
    throw new DefinitionRevisionConflictError(expected, actual);
  }
}
