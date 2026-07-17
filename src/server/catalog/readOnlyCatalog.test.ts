import { describe, expect, it } from 'vitest';
import {
  READ_ONLY_TRANSACTION,
  STRUCTURAL_CATALOG_QUERY,
  STRUCTURAL_NAMESPACES,
  readStructuralCatalog,
  type ReadOnlyCatalogQuery,
  type ReadOnlyCatalogSql,
} from './readOnlyCatalog';

describe('readStructuralCatalog', () => {
  it('uses one fixed SELECT inside a repeatable-read read-only transaction', async () => {
    const queries: Array<{ query: string; parameters?: readonly unknown[] }> = [];
    let transactionOptions = '';
    const query: ReadOnlyCatalogQuery = {
      unsafe: async <T extends readonly unknown[]>(sql: string, parameters?: readonly unknown[]) => {
        queries.push({ query: sql, parameters });
        return [
          { id: 'route-b', namespace: 'page_routes', context: 'page_routes', data: { path: '/b' }, created_at: null, updated_at: null },
          { id: 'schema-a', namespace: 'schema_definitions', context: 'schema_definitions', data: { name: 'a' }, created_at: null, updated_at: null },
        ] as unknown as T;
      },
    };
    const sql: ReadOnlyCatalogSql = {
      begin: async <T>(options: string, callback: (tx: ReadOnlyCatalogQuery) => Promise<T>) => {
        transactionOptions = options;
        return callback(query);
      },
    };

    const records = await readStructuralCatalog(sql);

    expect(transactionOptions).toBe(READ_ONLY_TRANSACTION);
    expect(queries).toEqual([{ query: STRUCTURAL_CATALOG_QUERY, parameters: [STRUCTURAL_NAMESPACES] }]);
    expect(queries[0].query.toLowerCase()).not.toMatch(/\b(create|insert|update|delete|alter|drop)\b/);
    expect(records.map(record => record.id)).toEqual(['route-b', 'schema-a']);
  });

  it('fails closed when a returned row is outside the namespace allowlist', async () => {
    const sql: ReadOnlyCatalogSql = {
      begin: async <T>(_options: string, callback: (tx: ReadOnlyCatalogQuery) => Promise<T>) => callback({
        unsafe: async <R extends readonly unknown[]>() => [
          { id: 'unexpected', namespace: 'usuarios', context: 'usuarios', data: {}, created_at: null, updated_at: null },
        ] as unknown as R,
      }),
    };

    await expect(readStructuralCatalog(sql)).rejects.toThrow('outside the allowlist');
  });
});
