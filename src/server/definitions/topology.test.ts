import type {
  AgnosticBridge,
  DataItem,
  DefinitionRevision,
  DefinitionRevisionStore,
} from '@agnostic/core';
import { describe, expect, it, vi } from 'vitest';
import { revisionIdFor } from './canonical';
import { createPersistenceTopology } from './topology';

class MemoryBridge implements AgnosticBridge {
  readonly capabilities = { storageType: 'FILE' as const, isRelational: false };
  constructor(private readonly values: Record<string, DataItem[]>) {}
  async read(namespace: string): Promise<DataItem[]> {
    return structuredClone(this.values[namespace] ?? []);
  }
  async write(namespace: string, record: Partial<DataItem> & { data: Record<string, unknown> }) {
    const saved = {
      id: record.id ?? crypto.randomUUID(),
      context: namespace,
      data: record.data,
    };
    this.values[namespace] = [
      ...(this.values[namespace] ?? []).filter(item => item.id !== saved.id),
      saved,
    ];
    return structuredClone(saved);
  }
  async remove(namespace: string, id: string): Promise<void> {
    this.values[namespace] = (this.values[namespace] ?? []).filter(item => item.id !== id);
  }
}

class MemoryRevisionStore implements DefinitionRevisionStore {
  constructor(public active: DefinitionRevision | null) {}
  async readActiveRevisionId() { return this.active?.id ?? null; }
  async readRevision(id: string) {
    return this.active?.id === id ? structuredClone(this.active) : null;
  }
  async writeRevision(revision: DefinitionRevision) {
    this.active = structuredClone(revision);
  }
  async activate(expected: string | null, next: string) {
    if ((this.active?.id ?? null) !== expected || this.active?.id !== next) {
      throw new Error('conflict');
    }
  }
}

function fixture() {
  const definitions = {
    schema_definitions: [
      { id: 'schema_items', context: 'schema_definitions', data: { name: 'items' } },
    ],
    page_routes: [],
    scripts: [],
  };
  const bridge = new MemoryBridge(definitions);
  const revision: DefinitionRevision = {
    id: revisionIdFor(definitions),
    definitions,
    source: { kind: 'test' },
    consistency: 'atomic',
  };
  return { bridge, revision };
}

describe('createPersistenceTopology', () => {
  it('keeps the historical bridge and observed definitions in legacy', async () => {
    const { bridge } = fixture();
    const topology = createPersistenceTopology({
      env: { AGNOSTIC_DEFINITION_MODE: 'legacy' },
      recordStore: bridge,
    });

    expect(topology.compatibilityBridge).toBe(bridge);
    await expect(topology.definitionReader.readActiveRevision())
      .resolves.toMatchObject({ consistency: 'observed' });
  });

  it('returns legacy and reports comparison in shadow', async () => {
    const { bridge, revision } = fixture();
    const report = vi.fn();
    const topology = createPersistenceTopology({
      env: { AGNOSTIC_DEFINITION_MODE: 'shadow' },
      recordStore: bridge,
      revisionStore: new MemoryRevisionStore(revision),
      reportShadow: report,
    });

    const observed = await topology.definitionReader.readActiveRevision();
    expect(observed.consistency).toBe('observed');
    expect(report).toHaveBeenCalledWith(expect.objectContaining({
      status: 'compared',
      match: true,
    }));
  });

  it('reads atomic definitions and routes records separately in revision', async () => {
    const { bridge, revision } = fixture();
    const topology = createPersistenceTopology({
      env: { AGNOSTIC_DEFINITION_MODE: 'revision' },
      recordStore: bridge,
      revisionStore: new MemoryRevisionStore(revision),
    });

    await expect(topology.definitionReader.readActiveRevision())
      .resolves.toMatchObject({ id: revision.id, consistency: 'atomic' });
    await expect(topology.compatibilityBridge.read('schema_definitions'))
      .resolves.toEqual(revision.definitions.schema_definitions);
  });

  it('requires a deployed revision pin in production', () => {
    const { bridge, revision } = fixture();
    expect(() => createPersistenceTopology({
      env: { NODE_ENV: 'production', AGNOSTIC_DEFINITION_MODE: 'revision' },
      recordStore: bridge,
      revisionStore: new MemoryRevisionStore(revision),
    })).toThrow('AGNOSTIC_DEFINITION_REVISION');
  });
});
