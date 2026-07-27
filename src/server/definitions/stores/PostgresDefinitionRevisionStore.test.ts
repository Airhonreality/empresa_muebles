import {
  DefinitionRevisionConflictError,
  type DataItem,
  type DefinitionRevision,
  type DefinitionSet,
} from '@agnostic/core';
import { describe, expect, it, vi } from 'vitest';

import { revisionIdFor } from '../canonical';
import { DefinitionStoreError } from '../errors';
import {
  PostgresDefinitionRevisionStore,
  type PostgresDefinitionExecutor,
} from './PostgresDefinitionRevisionStore';

function record(namespace: keyof DefinitionSet, id: string, data: DataItem['data']): DataItem {
  return { id, context: namespace, data };
}

function revision(sourceKind = 'test'): DefinitionRevision {
  const definitions: DefinitionSet = {
    schema_definitions: [
      record('schema_definitions', 'schema_items', { name: 'items', fields: [] }),
    ],
    page_routes: [
      record('page_routes', 'route_items', { path: '/items', blocks: [] }),
    ],
    scripts: [
      record('scripts', 'script_save', { name: 'save_item', code: '// test' }),
    ],
  };
  return {
    id: revisionIdFor(definitions),
    definitions,
    source: { kind: sourceKind },
    consistency: 'atomic',
  };
}

class FakePostgresExecutor implements PostgresDefinitionExecutor {
  readonly revisions = new Map<string, DefinitionRevision>();
  active: string | null = null;
  bootstrapCount = 0;
  statements: string[] = [];

  async query<T extends Record<string, unknown>>(
    statement: string,
    parameters: readonly unknown[] = [],
  ): Promise<T[]> {
    this.statements.push(statement);

    if (statement.includes('CREATE TABLE IF NOT EXISTS')) {
      this.bootstrapCount++;
      return [];
    }

    if (
      statement.includes('SELECT revision_id')
      && statement.includes('agnostic_definition_state')
    ) {
      return (this.active === null
        ? []
        : [{ revision_id: this.active }]) as unknown as T[];
    }

    if (
      statement.includes('SELECT id, bundle')
      && statement.includes('agnostic_definition_revisions')
    ) {
      const id = String(parameters[0]);
      const stored = this.revisions.get(id);
      return (stored
        ? [{ id, bundle: structuredClone(stored) }]
        : []) as unknown as T[];
    }

    if (statement.includes('INSERT INTO agnostic_definition_revisions')) {
      const id = String(parameters[0]);
      if (this.revisions.has(id)) return [];
      this.revisions.set(id, JSON.parse(String(parameters[1])) as DefinitionRevision);
      return [{ id }] as unknown as T[];
    }

    if (statement.includes('INSERT INTO agnostic_definition_state')) {
      const next = String(parameters[0]);
      if (this.active !== null) return [];
      if (!this.revisions.has(next)) throw new Error('foreign key violation');
      this.active = next;
      return [{ revision_id: next }] as unknown as T[];
    }

    if (statement.includes('UPDATE agnostic_definition_state')) {
      const next = String(parameters[0]);
      const expected = String(parameters[1]);
      if (this.active !== expected) return [];
      if (!this.revisions.has(next)) throw new Error('foreign key violation');
      this.active = next;
      return [{ revision_id: next }] as unknown as T[];
    }

    throw new Error(`Unexpected SQL in fake executor: ${statement}`);
  }
}

describe('PostgresDefinitionRevisionStore', () => {
  it('reuses one executor and bootstrap for stores with the same database URL', async () => {
    const executor = new FakePostgresExecutor();
    const factory = vi.fn(() => executor);
    const databaseUrl = 'postgres://private-pool-reuse-test';
    const first = new PostgresDefinitionRevisionStore(databaseUrl, factory);
    const second = new PostgresDefinitionRevisionStore(databaseUrl, factory);

    await Promise.all([
      first.readActiveRevisionId(),
      second.readActiveRevisionId(),
    ]);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(executor.bootstrapCount).toBe(1);
  });

  it('bootstraps once and round-trips an immutable JSONB bundle', async () => {
    const executor = new FakePostgresExecutor();
    const store = new PostgresDefinitionRevisionStore(executor);
    const bundle = revision();

    await store.writeRevision(bundle);
    await store.writeRevision(bundle);

    expect(await store.readRevision(bundle.id)).toEqual(bundle);
    expect(executor.bootstrapCount).toBe(1);
    expect(executor.revisions.size).toBe(1);
    expect(executor.statements.some(sql => sql.includes('$2::jsonb'))).toBe(true);
  });

  it('rejects a revision whose id is not its definitions hash', async () => {
    const executor = new FakePostgresExecutor();
    const store = new PostgresDefinitionRevisionStore(executor);
    const bundle = { ...revision(), id: 'invalid' };

    await expect(store.writeRevision(bundle)).rejects.toBeInstanceOf(
      DefinitionStoreError,
    );
    expect(executor.revisions.size).toBe(0);
  });

  it('rejects an attempted immutable-bundle overwrite', async () => {
    const executor = new FakePostgresExecutor();
    const store = new PostgresDefinitionRevisionStore(executor);
    const original = revision('original');
    const conflicting = revision('different-source');

    expect(conflicting.id).toBe(original.id);
    await store.writeRevision(original);
    await expect(store.writeRevision(conflicting)).rejects.toBeInstanceOf(
      DefinitionStoreError,
    );
  });

  it('activates with compare-and-set for empty and existing state', async () => {
    const executor = new FakePostgresExecutor();
    const store = new PostgresDefinitionRevisionStore(executor);
    const first = revision('first');
    const secondDefinitions = structuredClone(first.definitions);
    secondDefinitions.page_routes[0].data.path = '/changed';
    const second: DefinitionRevision = {
      ...first,
      id: revisionIdFor(secondDefinitions),
      definitions: secondDefinitions,
      source: { kind: 'second' },
    };

    await store.writeRevision(first);
    await store.writeRevision(second);
    await store.activate(null, first.id);
    await store.activate(first.id, second.id);

    expect(await store.readActiveRevisionId()).toBe(second.id);
    expect(executor.statements.some(sql =>
      sql.includes("WHERE state_key = 'active' AND revision_id = $2"),
    )).toBe(true);
  });

  it('reports actual state on stale activation without overwriting it', async () => {
    const executor = new FakePostgresExecutor();
    const store = new PostgresDefinitionRevisionStore(executor);
    const bundle = revision();

    await store.writeRevision(bundle);
    await store.activate(null, bundle.id);

    await expect(store.activate('stale', bundle.id)).rejects.toMatchObject({
      expectedRevision: 'stale',
      actualRevision: bundle.id,
      code: 'DEFINITION_REVISION_CONFLICT',
    });
    await expect(store.activate('stale', bundle.id)).rejects.toBeInstanceOf(
      DefinitionRevisionConflictError,
    );
    expect(await store.readActiveRevisionId()).toBe(bundle.id);
  });

  it('returns null only for confirmed missing rows', async () => {
    const store = new PostgresDefinitionRevisionStore(new FakePostgresExecutor());

    expect(await store.readActiveRevisionId()).toBeNull();
    expect(await store.readRevision('missing')).toBeNull();
  });
});
