/**
 * Read-only extraction boundary for the structural catalog.
 *
 * This module intentionally does not use PostgresStrategy: its read path performs
 * bootstrap DDL. The only database operation here is the fixed SELECT below.
 */

export const STRUCTURAL_NAMESPACES = [
  'schema_definitions',
  'page_routes',
  'scripts',
] as const;

export type StructuralNamespace = typeof STRUCTURAL_NAMESPACES[number];

export type CatalogRecord = {
  id: string;
  namespace: StructuralNamespace;
  context: string | null;
  data: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
};

export interface ReadOnlyCatalogQuery {
  unsafe<T extends readonly unknown[]>(
    query: string,
    parameters?: readonly unknown[],
  ): Promise<T>;
}

export interface ReadOnlyCatalogSql {
  begin<T>(
    options: string,
    callback: (transaction: ReadOnlyCatalogQuery) => Promise<T>,
  ): Promise<T>;
}

export const READ_ONLY_TRANSACTION = 'ISOLATION LEVEL REPEATABLE READ READ ONLY';

export const STRUCTURAL_CATALOG_QUERY = `
  SELECT id, namespace, context, data, created_at, updated_at
  FROM agnostic_records
  WHERE namespace = ANY($1::text[])
  ORDER BY namespace ASC, id ASC
`;

const namespaceSet = new Set<string>(STRUCTURAL_NAMESPACES);

/**
 * Reads a transactionally consistent structural snapshot. No table bootstrap,
 * discovery, fallback strategy, or write operation is permitted in this boundary.
 */
export async function readStructuralCatalog(sql: ReadOnlyCatalogSql): Promise<CatalogRecord[]> {
  return sql.begin(READ_ONLY_TRANSACTION, async transaction => {
    const rows = await transaction.unsafe<unknown[]>(
      STRUCTURAL_CATALOG_QUERY,
      [STRUCTURAL_NAMESPACES],
    );

    return rows.map(normalizeRecord).sort(compareRecords);
  });
}

function normalizeRecord(row: unknown): CatalogRecord {
  if (!isObject(row)) throw new Error('Catalog query returned a non-object row.');

  const id = row.id;
  const namespace = row.namespace;
  const context = row.context;
  const data = row.data;

  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Catalog query returned a record without a string id.');
  }
  if (typeof namespace !== 'string' || !namespaceSet.has(namespace)) {
    throw new Error(`Catalog query returned a namespace outside the allowlist: ${String(namespace)}.`);
  }
  if (context !== null && typeof context !== 'string') {
    throw new Error(`Catalog record "${id}" has an invalid context.`);
  }
  if (!isObject(data)) {
    throw new Error(`Catalog record "${id}" has non-object data.`);
  }

  return {
    id,
    namespace: namespace as StructuralNamespace,
    context,
    data,
    created_at: normalizeTimestamp(row.created_at, id, 'created_at'),
    updated_at: normalizeTimestamp(row.updated_at, id, 'updated_at'),
  };
}

function normalizeTimestamp(value: unknown, id: string, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString();
  throw new Error(`Catalog record "${id}" has an invalid ${field}.`);
}

function compareRecords(a: CatalogRecord, b: CatalogRecord): number {
  return a.namespace.localeCompare(b.namespace) || a.id.localeCompare(b.id);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
