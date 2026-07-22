import type {
  DefinitionPublisher,
  DefinitionReader,
  DefinitionRevision,
  DefinitionRevisionStore,
  DefinitionSet,
} from '@agnostic/core';
import {
  DefinitionRevisionConflictError,
  DefinitionValidationError,
} from '@agnostic/core';
import { describe, expect, it, vi } from 'vitest';

import { revisionIdFor } from './canonical';
import { migrateLegacyDefinitions } from './migration';

function definitionSet(label = 'current'): DefinitionSet {
  return {
    schema_definitions: [
      {
        id: 'schema-records',
        context: 'schema_definitions',
        data: { name: 'records', label },
      },
    ],
    page_routes: [
      {
        id: 'route-records',
        context: 'page_routes',
        data: {
          path: '/records',
          blocks: [{ context: 'records', schema_id: 'records' }],
        },
      },
    ],
    scripts: [],
  };
}

function observedRevision(definitions = definitionSet()): DefinitionRevision {
  return {
    id: revisionIdFor(definitions),
    definitions,
    source: { kind: 'legacy-test' },
    consistency: 'observed',
  };
}

function atomicRevision(definitions = definitionSet()): DefinitionRevision {
  return {
    id: revisionIdFor(definitions),
    definitions,
    source: { kind: 'legacy-test' },
    consistency: 'atomic',
  };
}

function readerDouble(
  revision: DefinitionRevision,
): DefinitionReader & { readActiveRevision: ReturnType<typeof vi.fn> } {
  return {
    readActiveRevision: vi.fn(async () => revision),
  };
}

function publisherDouble(
  result: DefinitionRevision | Error,
): DefinitionPublisher & { publish: ReturnType<typeof vi.fn> } {
  return {
    publish: vi.fn(async () => {
      if (result instanceof Error) throw result;
      return result;
    }),
  };
}

function storeDouble(
  activeId: string | null,
  revisions: DefinitionRevision[] = [],
): DefinitionRevisionStore & {
  readActiveRevisionId: ReturnType<typeof vi.fn>;
  readRevision: ReturnType<typeof vi.fn>;
  writeRevision: ReturnType<typeof vi.fn>;
  activate: ReturnType<typeof vi.fn>;
} {
  const byId = new Map(revisions.map(revision => [revision.id, revision]));
  return {
    readActiveRevisionId: vi.fn(async () => activeId),
    readRevision: vi.fn(async (id: string) => byId.get(id) ?? null),
    writeRevision: vi.fn(async () => undefined),
    activate: vi.fn(async () => undefined),
  };
}

describe('migrateLegacyDefinitions', () => {
  it('previews hash, active revision and differences without writing', async () => {
    const legacy = observedRevision(definitionSet('candidate'));
    const active = atomicRevision(definitionSet('active'));
    const publisher = publisherDouble(atomicRevision(legacy.definitions));
    const store = storeDouble(active.id, [active]);

    const result = await migrateLegacyDefinitions(
      readerDouble(legacy),
      publisher,
      store,
      { mode: 'dry-run' },
    );

    expect(result).toEqual({
      mode: 'dry-run',
      applied: false,
      candidateHash: legacy.id,
      activeRevision: active.id,
      differences: [
        { namespace: 'schema_definitions', added: 0, changed: 1, removed: 0 },
        { namespace: 'page_routes', added: 0, changed: 0, removed: 0 },
        { namespace: 'scripts', added: 0, changed: 0, removed: 0 },
      ],
    });
    expect(publisher.publish).not.toHaveBeenCalled();
    expect(store.writeRevision).not.toHaveBeenCalled();
    expect(store.activate).not.toHaveBeenCalled();
  });

  it('performs a first activation only with an explicit null expectation', async () => {
    const legacy = observedRevision();
    const published = atomicRevision(legacy.definitions);
    const publisher = publisherDouble(published);

    const result = await migrateLegacyDefinitions(
      readerDouble(legacy),
      publisher,
      storeDouble(null),
      { mode: 'apply', expectedRevision: null },
    );

    expect(publisher.publish).toHaveBeenCalledWith(
      {
        definitions: legacy.definitions,
        source: legacy.source,
      },
      null,
    );
    expect(result).toMatchObject({
      mode: 'apply',
      applied: true,
      idempotent: false,
      candidateHash: legacy.id,
      activeRevision: null,
      revision: published,
    });
  });

  it('is idempotent when the candidate hash is already active', async () => {
    const legacy = observedRevision();
    const active = atomicRevision(legacy.definitions);
    const publisher = publisherDouble(active);

    const result = await migrateLegacyDefinitions(
      readerDouble(legacy),
      publisher,
      storeDouble(active.id, [active]),
      { mode: 'apply', expectedRevision: active.id },
    );

    expect(result).toMatchObject({
      mode: 'apply',
      applied: false,
      idempotent: true,
      candidateHash: active.id,
      activeRevision: active.id,
      revision: active,
    });
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('rejects a stale expectation before the idempotent fast path', async () => {
    const legacy = observedRevision();
    const active = atomicRevision(legacy.definitions);
    const publisher = publisherDouble(active);

    await expect(
      migrateLegacyDefinitions(
        readerDouble(legacy),
        publisher,
        storeDouble(active.id, [active]),
        { mode: 'apply', expectedRevision: 'stale' },
      ),
    ).rejects.toMatchObject({
      expectedRevision: 'stale',
      actualRevision: active.id,
    });
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('rejects an active bundle that runtime revision mode would reject', async () => {
    const legacy = observedRevision();
    const invalidActive = observedRevision(legacy.definitions);
    const publisher = publisherDouble(atomicRevision());

    await expect(
      migrateLegacyDefinitions(
        readerDouble(legacy),
        publisher,
        storeDouble(invalidActive.id, [invalidActive]),
        { mode: 'apply', expectedRevision: invalidActive.id },
      ),
    ).rejects.toThrow('must declare atomic consistency');
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('raises a stale revision conflict before invoking the publisher', async () => {
    const legacy = observedRevision(definitionSet('candidate'));
    const active = atomicRevision(definitionSet('active'));
    const conflict = new DefinitionRevisionConflictError('stale', active.id);
    const publisher = publisherDouble(conflict);

    await expect(
      migrateLegacyDefinitions(
        readerDouble(legacy),
        publisher,
        storeDouble(active.id, [active]),
        { mode: 'apply', expectedRevision: 'stale' },
      ),
    ).rejects.toMatchObject({
      expectedRevision: conflict.expectedRevision,
      actualRevision: conflict.actualRevision,
    });
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('validates the legacy candidate before reading or writing persistent state', async () => {
    const invalid = observedRevision();
    invalid.definitions.page_routes[0].data.blocks = [
      { context: 'missing_schema' },
    ];
    const publisher = publisherDouble(atomicRevision());
    const store = storeDouble(null);

    await expect(
      migrateLegacyDefinitions(
        readerDouble(invalid),
        publisher,
        store,
        { mode: 'dry-run' },
      ),
    ).rejects.toBeInstanceOf(DefinitionValidationError);
    expect(store.readActiveRevisionId).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('rejects apply mode when expectedRevision is omitted at runtime', async () => {
    const publisher = publisherDouble(atomicRevision());
    const store = storeDouble(null);

    await expect(
      migrateLegacyDefinitions(
        readerDouble(observedRevision()),
        publisher,
        store,
        { mode: 'apply' } as never,
      ),
    ).rejects.toThrow('Apply mode requires an explicit expectedRevision.');
    expect(store.readActiveRevisionId).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
