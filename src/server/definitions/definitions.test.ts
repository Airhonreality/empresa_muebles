import type {
  AgnosticBridge,
  AgnosticCapabilities,
  AgnosticQuery,
  DataItem,
  DefinitionCandidate,
  DefinitionRevision,
  DefinitionSet,
} from '@agnostic/core';
import { describe, expect, it } from 'vitest';

import { canonicalJson, revisionIdFor, sha256 } from './canonical';
import {
  DefinitionRevisionConflictError,
  DefinitionRevisionNotFoundError,
  DefinitionStoreError,
  DefinitionValidationError,
} from './errors';
import { LegacyDefinitionPublisher, LegacyDefinitionReader } from './legacy';
import {
  PersistentDefinitionPublisher,
  PersistentDefinitionReader,
  validatePersistentDefinitionRevision,
} from './persistent';
import type { DefinitionRevisionStore } from './revision-store';

function record(
  namespace: keyof DefinitionSet,
  id: string,
  data: Record<string, unknown>,
): DataItem {
  return { id, context: namespace, data };
}

function definitions(label = 'base'): DefinitionSet {
  return {
    schema_definitions: [
      record('schema_definitions', 'schema_items', {
        name: 'items',
        fields: [{ key: 'name', type: 'text', label }],
      }),
    ],
    page_routes: [
      record('page_routes', 'route_items', {
        path: '/items',
        blocks: [
          {
            id: 'items_table',
            type: 'table',
            context: 'items',
            schema_id: 'schema_items',
            zap: 'save_item',
          },
        ],
      }),
    ],
    scripts: [
      record('scripts', 'script_save_item', {
        name: 'save_item',
        code: '// test',
      }),
    ],
  };
}

function candidate(label = 'base'): DefinitionCandidate {
  return {
    definitions: definitions(label),
    source: { kind: 'test' },
  };
}

class MemoryBridge implements AgnosticBridge {
  readonly capabilities: AgnosticCapabilities = {
    storageType: 'FILE',
    isRelational: false,
  };

  readonly reads: string[] = [];
  readonly writes: string[] = [];
  private readonly data = new Map<string, DataItem[]>();

  constructor(seed: DefinitionSet) {
    for (const [namespace, records] of Object.entries(seed)) {
      this.data.set(namespace, structuredClone(records) as DataItem[]);
    }
  }

  async read(namespace: string, query?: AgnosticQuery): Promise<DataItem[]> {
    this.reads.push(namespace);
    const records = structuredClone(this.data.get(namespace) ?? []);
    if (!query?.where) return records;
    return records.filter(item =>
      Object.entries(query.where ?? {}).every(([key, value]) =>
        key === 'id' ? item.id === value : item.data[key] === value,
      ),
    );
  }

  async write(
    namespace: string,
    value: Partial<DataItem> & { data: Record<string, unknown> },
  ): Promise<DataItem> {
    this.writes.push(namespace);
    const records = this.data.get(namespace) ?? [];
    const saved: DataItem = {
      id: value.id ?? crypto.randomUUID(),
      context: namespace,
      data: structuredClone(value.data),
    };
    const next = records.filter(existing => existing.id !== saved.id);
    next.push(saved);
    this.data.set(namespace, next);
    return structuredClone(saved);
  }

  async remove(namespace: string, id: string): Promise<void> {
    const records = this.data.get(namespace) ?? [];
    this.data.set(namespace, records.filter(item => item.id !== id));
  }
}

class MemoryRevisionStore implements DefinitionRevisionStore {
  active: string | null = null;
  readonly revisions = new Map<string, DefinitionRevision>();
  failRead = false;
  failWriteVisibility = false;
  activationConflict = false;

  async readActiveRevisionId(): Promise<string | null> {
    if (this.failRead) throw new Error('transport unavailable');
    return this.active;
  }

  async readRevision(id: string): Promise<DefinitionRevision | null> {
    if (this.failRead) throw new Error('transport unavailable');
    if (this.failWriteVisibility) return null;
    return structuredClone(this.revisions.get(id) ?? null);
  }

  async writeRevision(revision: DefinitionRevision): Promise<void> {
    this.revisions.set(revision.id, structuredClone(revision));
  }

  async activate(expectedRevision: string | null, nextRevision: string): Promise<void> {
    if (this.activationConflict || this.active !== expectedRevision) {
      throw new DefinitionRevisionConflictError(
        expectedRevision,
        this.active,
      );
    }
    this.active = nextRevision;
  }
}

describe('definition canonicalization', () => {
  it('sorts object keys recursively and preserves array order', () => {
    expect(canonicalJson({ z: { b: 2, a: 1 }, a: ['b', 'a'] })).toBe(
      '{"a":["b","a"],"z":{"a":1,"b":2}}',
    );
    expect(sha256({ b: 2, a: 1 })).toBe(sha256({ a: 1, b: 2 }));
    expect(sha256(['a', 'b'])).not.toBe(sha256(['b', 'a']));
  });

  it('rejects values that cannot form deterministic JSON', () => {
    expect(() => canonicalJson({ value: Number.NaN })).toThrow(DefinitionValidationError);
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => canonicalJson(circular)).toThrow(DefinitionValidationError);
  });
});

describe('legacy definition compatibility', () => {
  it('reads exactly the three canonical namespaces and reports observed consistency', async () => {
    const bridge = new MemoryBridge(definitions());
    const revision = await new LegacyDefinitionReader(bridge).readActiveRevision();

    expect(bridge.reads).toEqual(['schema_definitions', 'page_routes', 'scripts']);
    expect(revision.consistency).toBe('observed');
    expect(revision.id).toBe(revisionIdFor(revision.definitions));
  });

  it('preserves bridge upsert semantics without deleting absent legacy records', async () => {
    const seed = definitions();
    const extra = record('scripts', 'script_existing', {
      name: 'existing_script',
      code: '// retained',
    });
    const bridge = new MemoryBridge({
      ...seed,
      scripts: [...seed.scripts, extra],
    });

    const published = await new LegacyDefinitionPublisher(bridge).publish(candidate('changed'));
    expect(bridge.writes).toEqual([
      'schema_definitions',
      'page_routes',
      'scripts',
    ]);
    expect(published.definitions.scripts.map(item => item.id)).toContain('script_existing');
    expect(published.consistency).toBe('observed');
  });

  it('checks expectedRevision before writing', async () => {
    const bridge = new MemoryBridge(definitions());
    await expect(
      new LegacyDefinitionPublisher(bridge).publish(candidate(), 'stale'),
    ).rejects.toBeInstanceOf(DefinitionRevisionConflictError);
    expect(bridge.writes).toEqual([]);
  });

  it('fails closed in strict mode when the bridge has no strict read capability', async () => {
    const bridge = new MemoryBridge(definitions());

    await expect(
      new LegacyDefinitionReader(bridge, { strict: true }).readActiveRevision(),
    ).rejects.toThrow('bridge.readStrict');
    expect(bridge.reads).toEqual([]);
  });

  it('propagates strict read failures instead of converting them into empty definitions', async () => {
    const bridge = new MemoryBridge(definitions()) as MemoryBridge & {
      readStrict: AgnosticBridge['read'];
    };
    bridge.readStrict = async namespace => {
      throw new Error(`strict read failed: ${namespace}`);
    };

    await expect(
      new LegacyDefinitionReader(bridge, { strict: true }).readActiveRevision(),
    ).rejects.toThrow('strict read failed');
  });
});

describe('persistent definition revisions', () => {
  it('writes one immutable bundle, verifies it and activates it with CAS', async () => {
    const store = new MemoryRevisionStore();
    const publisher = new PersistentDefinitionPublisher(store);

    const revision = await publisher.publish(candidate(), null);
    expect(revision.consistency).toBe('atomic');
    expect(store.active).toBe(revision.id);
    expect(store.revisions.size).toBe(1);

    const loaded = await new PersistentDefinitionReader(store).readActiveRevision();
    expect(loaded).toEqual(revision);
  });

  it('rejects stale expected revisions before persistence', async () => {
    const store = new MemoryRevisionStore();
    store.active = 'current';

    await expect(
      new PersistentDefinitionPublisher(store).publish(candidate(), 'stale'),
    ).rejects.toMatchObject({
      expectedRevision: 'stale',
      actualRevision: 'current',
    });
    expect(store.revisions.size).toBe(0);
  });

  it('surfaces activation conflicts instead of retrying or falling back', async () => {
    const store = new MemoryRevisionStore();
    store.activationConflict = true;

    await expect(
      new PersistentDefinitionPublisher(store).publish(candidate(), null),
    ).rejects.toBeInstanceOf(DefinitionRevisionConflictError);
    expect(store.active).toBeNull();
  });

  it('fails when a persisted bundle is not readable', async () => {
    const store = new MemoryRevisionStore();
    store.failWriteVisibility = true;

    await expect(
      new PersistentDefinitionPublisher(store).publish(candidate(), null),
    ).rejects.toBeInstanceOf(DefinitionStoreError);
    expect(store.active).toBeNull();
  });

  it('uses strict reads with explicit missing and transport errors', async () => {
    const store = new MemoryRevisionStore();
    const reader = new PersistentDefinitionReader(store);

    await expect(reader.readActiveRevision()).rejects.toBeInstanceOf(
      DefinitionRevisionNotFoundError,
    );

    store.failRead = true;
    await expect(reader.readActiveRevision()).rejects.toThrow('transport unavailable');
  });

  it('rejects broken schema and zap references before writing', async () => {
    const store = new MemoryRevisionStore();
    const broken = candidate();
    const route = broken.definitions.page_routes[0];
    broken.definitions = {
      ...broken.definitions,
      page_routes: [
        {
          ...route,
          data: {
            ...route.data,
            blocks: [{ context: 'missing_schema', zap: 'missing_zap' }],
          },
        },
      ],
    };

    await expect(
      new PersistentDefinitionPublisher(store).publish(broken, null),
    ).rejects.toBeInstanceOf(DefinitionValidationError);
    expect(store.revisions.size).toBe(0);
  });

  it('reuses and returns the persisted bundle when only source metadata differs', async () => {
    const store = new MemoryRevisionStore();
    const persisted = {
      ...await new PersistentDefinitionPublisher(store).publish(candidate(), null),
      source: { kind: 'first-source' },
    };
    store.revisions.set(persisted.id, structuredClone(persisted));
    store.active = null;

    const republished = await new PersistentDefinitionPublisher(store).publish(
      { ...candidate(), source: { kind: 'second-source' } },
      null,
    );

    expect(republished.source).toEqual({ kind: 'first-source' });
    expect(store.revisions.get(persisted.id)?.source).toEqual({ kind: 'first-source' });
  });

  it('exports the same integral validation used by runtime reads', () => {
    const invalid = {
      id: revisionIdFor(definitions()),
      definitions: definitions(),
      source: { kind: 'test' },
      consistency: 'observed' as const,
    };

    expect(() => validatePersistentDefinitionRevision(invalid)).toThrow(
      'must declare atomic consistency',
    );
  });
});
