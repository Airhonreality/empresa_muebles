import type {
  DefinitionCandidate,
  DefinitionPublisher,
  DefinitionReader,
  DefinitionRevision,
  DefinitionSet,
} from '@agnostic/core';
import { DefinitionRevisionConflictError } from '@agnostic/core';
import { describe, expect, it, vi } from 'vitest';
import {
  DefinitionRevisionRetryExhaustedError,
  RevisionDefinitionBridge,
} from './RevisionDefinitionBridge';
import { revisionIdFor } from './canonical';

function createDefinitions(): DefinitionSet {
  return {
    schema_definitions: [
      { id: 'schema_items', context: 'schema_definitions', data: { name: 'items' } },
    ],
    page_routes: [],
    scripts: [],
  };
}

class MemoryDefinitions implements DefinitionReader, DefinitionPublisher {
  revision: DefinitionRevision;

  constructor() {
    const definitions = createDefinitions();
    this.revision = {
      id: revisionIdFor(definitions),
      definitions,
      source: { kind: 'test' },
      consistency: 'atomic',
    };
  }

  async readActiveRevision(): Promise<DefinitionRevision> {
    return structuredClone(this.revision);
  }

  async publish(
    candidate: DefinitionCandidate,
    expectedRevision?: string | null,
  ): Promise<DefinitionRevision> {
    if (expectedRevision !== this.revision.id) {
      throw new DefinitionRevisionConflictError(
        expectedRevision ?? null,
        this.revision.id,
      );
    }
    this.revision = {
      id: revisionIdFor(candidate.definitions),
      definitions: structuredClone(candidate.definitions),
      source: candidate.source,
      consistency: 'atomic',
    };
    return structuredClone(this.revision);
  }
}

describe('RevisionDefinitionBridge', () => {
  it('reads definition namespaces with bridge query semantics', async () => {
    const definitions = new MemoryDefinitions();
    const bridge = new RevisionDefinitionBridge(definitions, definitions);

    await expect(
      bridge.read('schema_definitions', { where: { id: 'schema_items' }, limit: 1 }),
    ).resolves.toHaveLength(1);
    await expect(
      bridge.read('schema_definitions', { where: { id: 'missing' } }),
    ).resolves.toEqual([]);
  });

  it('publishes writes and removals against the expected active revision', async () => {
    const definitions = new MemoryDefinitions();
    const bridge = new RevisionDefinitionBridge(definitions, definitions);

    const saved = await bridge.write('scripts', {
      id: 'script_save',
      data: { name: 'save', code: '// test' },
    });
    expect(saved.id).toBe('script_save');
    await expect(bridge.read('scripts')).resolves.toEqual([saved]);

    await bridge.remove('scripts', saved.id);
    await expect(bridge.read('scripts')).resolves.toEqual([]);
  });

  it('serializes a designer-sized batch so every concurrent write remains active', async () => {
    const definitions = new MemoryDefinitions();
    const bridge = new RevisionDefinitionBridge(definitions, definitions);

    const saved = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        bridge.write('scripts', {
          id: `script_${index}`,
          data: { name: `script_${index}`, code: `// ${index}` },
        }),
      ),
    );

    const persisted = await bridge.read('scripts', {
      orderBy: { column: 'name', order: 'asc' },
    });
    expect(persisted).toEqual(saved);
  });

  it('rebases concurrent removals so neither deleted record is restored', async () => {
    const definitions = new MemoryDefinitions();
    const bridge = new RevisionDefinitionBridge(definitions, definitions);
    await bridge.write('scripts', {
      id: 'script_first',
      data: { name: 'first', code: '// first' },
    });
    await bridge.write('scripts', {
      id: 'script_second',
      data: { name: 'second', code: '// second' },
    });

    await Promise.all([
      bridge.remove('scripts', 'script_first'),
      bridge.remove('scripts', 'script_second'),
    ]);

    await expect(bridge.read('scripts')).resolves.toEqual([]);
  });

  it('stops after the configured number of typed conflicts', async () => {
    const definitions = new MemoryDefinitions();
    const conflict = new DefinitionRevisionConflictError(
      definitions.revision.id,
      definitions.revision.id,
    );
    const publisher: DefinitionPublisher = {
      publish: vi.fn(async () => {
        throw conflict;
      }),
    };
    const bridge = new RevisionDefinitionBridge(definitions, publisher, 1);

    const error = await bridge.write('scripts', {
        id: 'script_blocked',
        data: { name: 'blocked', code: '// blocked' },
      }).catch(cause => cause);

    expect(error).toBeInstanceOf(DefinitionRevisionRetryExhaustedError);
    expect(error).toMatchObject({
      name: 'DefinitionRevisionRetryExhaustedError',
      namespace: 'scripts',
      attempts: 2,
      lastConflict: conflict,
    });
    expect(publisher.publish).toHaveBeenCalledTimes(2);
  });

  it('does not retry publication failures that are not CAS conflicts', async () => {
    const definitions = new MemoryDefinitions();
    const publisher: DefinitionPublisher = {
      publish: vi.fn(async () => {
        throw new Error('transport unavailable');
      }),
    };
    const bridge = new RevisionDefinitionBridge(definitions, publisher);

    await expect(
      bridge.remove('scripts', 'missing'),
    ).rejects.toThrow('transport unavailable');
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it('rejects operational namespaces explicitly', async () => {
    const definitions = new MemoryDefinitions();
    const bridge = new RevisionDefinitionBridge(definitions, definitions);

    await expect(bridge.read('items')).rejects.toThrow(
      'Namespace "items" is not an engine definition namespace.',
    );
  });
});
