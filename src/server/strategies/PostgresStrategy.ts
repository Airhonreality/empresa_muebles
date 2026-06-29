import type {
  DataItem,
  AgnosticBridge,
  AgnosticCapabilities,
  AgnosticQuery,
} from '@agnostic/core';
import { mergeFieldLWW } from '@/lib/agnostic/fieldMerge';
import postgres from 'postgres';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

// ─── SINGLETON CONNECTION ─────────────────────────────────────────────────────
// One pool per process (shared across requests in the same Vercel function instance).

let _sql: ReturnType<typeof postgres> | null = null;

function getConnection(url: string): ReturnType<typeof postgres> {
  if (!_sql) {
    _sql = postgres(url, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return _sql;
}

// ─── BOOTSTRAP (runs once per cold start) ────────────────────────────────────
// Creates the single table if it doesn't exist. No DDL per namespace ever.

const BOOTSTRAP_SQL = `
  CREATE TABLE IF NOT EXISTS agnostic_records (
    id         TEXT        NOT NULL,
    namespace  TEXT        NOT NULL,
    context    TEXT,
    data       JSONB       NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    PRIMARY KEY (namespace, id)
  );
  CREATE INDEX IF NOT EXISTS idx_agnostic_ns ON agnostic_records (namespace);
`;

const bootstrapped = new Set<string>();

async function ensureTable(sql: ReturnType<typeof postgres>, url: string): Promise<void> {
  if (bootstrapped.has(url)) return;
  await sql.unsafe(BOOTSTRAP_SQL);
  bootstrapped.add(url);
}

// ─── STRATEGY ────────────────────────────────────────────────────────────────

export class PostgresStrategy implements AgnosticBridge {
  private readonly sql: ReturnType<typeof postgres>;
  private readonly url: string;

  readonly capabilities: AgnosticCapabilities = {
    storageType: 'SQL',
    isRelational: true,
  };

  constructor(databaseUrl: string) {
    this.url = databaseUrl;
    this.sql = getConnection(databaseUrl);
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────

  async read(namespace: string, query?: AgnosticQuery): Promise<DataItem[]> {
    try {
      await ensureTable(this.sql, this.url);

      let rows: Record<string, unknown>[];

      if (query?.where) {
        const entries = Object.entries(query.where);
        if (entries.length === 1 && entries[0][0] === 'id') {
          rows = await this.sql`
            SELECT id, namespace, context, data, created_at, updated_at
            FROM agnostic_records
            WHERE namespace = ${namespace} AND id = ${String(entries[0][1])}
          `;
        } else {
          // JSONB filter for data fields
          rows = await this.sql`
            SELECT id, namespace, context, data, created_at, updated_at
            FROM agnostic_records
            WHERE namespace = ${namespace}
          `;
          return rows
            .filter(r =>
              entries.every(([k, v]) =>
                k === 'id' ? r.id === v : (r.data as Record<string, unknown>)?.[k] === v,
              ),
            )
            .map(toDataItem);
        }
      } else {
        rows = await this.sql`
          SELECT id, namespace, context, data, created_at, updated_at
          FROM agnostic_records
          WHERE namespace = ${namespace}
          ORDER BY created_at ASC
        `;
      }

      return rows.map(toDataItem);
    } catch (err) {
      console.error('[PostgresStrategy] Read error:', err);
      return [];
    }
  }

  async write(
    namespace: string,
    record: Partial<DataItem> & { data: Record<string, unknown> },
  ): Promise<DataItem> {
    await ensureTable(this.sql, this.url);

    const id = record.id ?? globalThis.crypto.randomUUID();
    const patchMeta = (record as Record<string, unknown>)._meta as
      | Record<string, string>
      | undefined;

    // Field-Level LWW: read existing record to merge
    let mergedData = record.data;
    let mergedMeta = patchMeta;

    if (patchMeta) {
      const existing = await this.sql<{ data: Record<string, unknown>; _meta?: Record<string, string> }[]>`
        SELECT data FROM agnostic_records WHERE namespace = ${namespace} AND id = ${id}
      `;
      if (existing.length > 0) {
        const existingItem: DataItem = {
          id,
          context: namespace,
          data: existing[0].data,
          _meta: (existing[0].data as Record<string, unknown>)._meta as
            | Record<string, string>
            | undefined,
        };
        const merged = mergeFieldLWW(existingItem, { data: record.data, _meta: patchMeta });
        mergedData = merged.data;
        mergedMeta = merged._meta;
      }
    }

    const now = new Date().toISOString();
    const context = record.context ?? namespace;
    const data = mergedMeta ? { ...mergedData, _meta: mergedMeta } : mergedData;

    await this.sql`
      INSERT INTO agnostic_records (id, namespace, context, data, updated_at)
      VALUES (${id}, ${namespace}, ${context}, ${this.sql.json(data as JsonValue)}, ${now})
      ON CONFLICT (namespace, id) DO UPDATE SET
        data       = EXCLUDED.data,
        context    = EXCLUDED.context,
        updated_at = EXCLUDED.updated_at
    `;

    return {
      id,
      context: namespace,
      data,
      updated_at: now,
    };
  }

  async remove(namespace: string, id: string): Promise<void> {
    await ensureTable(this.sql, this.url);
    await this.sql`
      DELETE FROM agnostic_records WHERE namespace = ${namespace} AND id = ${id}
    `;
  }

  // ─── REFACTORING OPERATIONS (Optimized SQL) ────────────────────────────────

  async renameCollection(fromNamespace: string, toNamespace: string): Promise<void> {
    await ensureTable(this.sql, this.url);
    await this.sql`
      UPDATE agnostic_records 
      SET namespace = ${toNamespace}, context = ${toNamespace} 
      WHERE namespace = ${fromNamespace}
    `;
  }

  async renameField(namespace: string, oldKey: string, newKey: string): Promise<void> {
    await ensureTable(this.sql, this.url);
    // Uses jsonb_set to inject the old value under the new key, and - operator to remove the old key.
    await this.sql`
      UPDATE agnostic_records 
      SET data = (data - ${oldKey}) || jsonb_build_object(${newKey}, data->${oldKey}) 
      WHERE namespace = ${namespace} AND data ? ${oldKey}
    `;
  }

  async deleteField(namespace: string, key: string): Promise<void> {
    await ensureTable(this.sql, this.url);
    await this.sql`
      UPDATE agnostic_records 
      SET data = data - ${key} 
      WHERE namespace = ${namespace} AND data ? ${key}
    `;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toDataItem(row: Record<string, unknown>): DataItem {
  return {
    id: row.id as string,
    context: (row.context as string) ?? (row.namespace as string),
    data: (row.data as Record<string, unknown>) ?? {},
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}
