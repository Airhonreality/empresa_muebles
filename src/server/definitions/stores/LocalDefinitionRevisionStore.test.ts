import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { DataItem, DefinitionRevision, DefinitionSet } from '@agnostic/core';
import { DefinitionRevisionConflictError } from '@agnostic/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { revisionIdFor } from '../canonical';
import { DefinitionStoreError } from '../errors';
import { LocalDefinitionRevisionStore } from './LocalDefinitionRevisionStore';

function item(
  namespace: keyof DefinitionSet,
  id: string,
  data: Record<string, unknown>,
): DataItem {
  return { id, context: namespace, data };
}

function revision(label: string): DefinitionRevision {
  const definitions: DefinitionSet = {
    schema_definitions: [
      item('schema_definitions', `schema_${label}`, {
        name: `entity_${label}`,
        fields: [{ key: 'name', type: 'text' }],
      }),
    ],
    page_routes: [
      item('page_routes', `route_${label}`, {
        path: `/${label}`,
        blocks: [{ id: `block_${label}`, context: `entity_${label}`, type: 'table' }],
      }),
    ],
    scripts: [
      item('scripts', `script_${label}`, {
        name: `save_${label}`,
        code: '// test',
      }),
    ],
  };

  return {
    id: revisionIdFor(definitions),
    definitions,
    source: { kind: 'test' },
    consistency: 'atomic',
  };
}

describe('LocalDefinitionRevisionStore', () => {
  let storageRoot: string;

  beforeEach(async () => {
    storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'definition-store-'));
  });

  afterEach(async () => {
    await fs.rm(storageRoot, { recursive: true, force: true });
  });

  it('persists immutable UTF-8 bundles outside storage db', async () => {
    const store = new LocalDefinitionRevisionStore(storageRoot);
    const first = revision('first');

    await store.writeRevision(first);
    await store.activate(null, first.id);

    const bundlePath = path.join(
      storageRoot,
      '.agnostic',
      'definitions',
      'revisions',
      `${first.id}.json`,
    );
    const bytes = await fs.readFile(bundlePath);

    expect(bytes.subarray(0, 3)).not.toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(JSON.parse(bytes.toString('utf8'))).toEqual(first);
    await expect(fs.stat(path.join(storageRoot, 'db', `${first.id}.json`)))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('reopens persisted state from a new store instance', async () => {
    const firstStore = new LocalDefinitionRevisionStore(storageRoot);
    const saved = revision('reopen');
    await firstStore.writeRevision(saved);
    await firstStore.activate(null, saved.id);

    const reopenedStore = new LocalDefinitionRevisionStore(storageRoot);
    await expect(reopenedStore.readActiveRevisionId()).resolves.toBe(saved.id);
    await expect(reopenedStore.readRevision(saved.id)).resolves.toEqual(saved);
  });

  it('enforces exact compare-and-swap activation', async () => {
    const store = new LocalDefinitionRevisionStore(storageRoot);
    const current = revision('current');
    const next = revision('next');
    await store.writeRevision(current);
    await store.writeRevision(next);
    await store.activate(null, current.id);

    await expect(store.activate(null, next.id)).rejects.toMatchObject({
      expectedRevision: null,
      actualRevision: current.id,
    });
    await expect(store.readActiveRevisionId()).resolves.toBe(current.id);
  });

  it('rejects an existing bundle with different content', async () => {
    const store = new LocalDefinitionRevisionStore(storageRoot);
    const saved = revision('immutable');
    await store.writeRevision(saved);

    await expect(store.writeRevision({
      ...saved,
      source: { kind: 'different-source' },
    })).rejects.toThrow('already exists with different content');
  });

  it('fails explicitly on corrupted bundles and active pointers', async () => {
    const store = new LocalDefinitionRevisionStore(storageRoot);
    const saved = revision('corrupt');
    await store.writeRevision(saved);
    await store.activate(null, saved.id);

    const technicalRoot = path.join(storageRoot, '.agnostic', 'definitions');
    await fs.writeFile(
      path.join(technicalRoot, 'revisions', `${saved.id}.json`),
      '{broken',
      'utf8',
    );
    await expect(store.readRevision(saved.id)).rejects.toBeInstanceOf(DefinitionStoreError);

    await fs.writeFile(path.join(technicalRoot, 'active.json'), '{"revision_id":"../escape"}', 'utf8');
    await expect(store.readActiveRevisionId()).rejects.toThrow(
      'Active revision_id must be a lowercase SHA-256 revision id.',
    );
  });

  it('makes path traversal impossible through revision identifiers', async () => {
    const store = new LocalDefinitionRevisionStore(storageRoot);

    await expect(store.readRevision('../outside')).rejects.toThrow(
      'Revision id must be a lowercase SHA-256 revision id.',
    );
    await expect(store.activate(null, '../outside')).rejects.toThrow(
      'Next revision must be a lowercase SHA-256 revision id.',
    );
  });

  it('serializes concurrent CAS attempts so exactly one succeeds', async () => {
    const initial = revision('initial');
    const left = revision('left');
    const right = revision('right');
    const firstStore = new LocalDefinitionRevisionStore(storageRoot);
    const secondStore = new LocalDefinitionRevisionStore(storageRoot);

    await Promise.all([
      firstStore.writeRevision(initial),
      firstStore.writeRevision(left),
      secondStore.writeRevision(right),
    ]);
    await firstStore.activate(null, initial.id);

    const results = await Promise.allSettled([
      firstStore.activate(initial.id, left.id),
      secondStore.activate(initial.id, right.id),
    ]);

    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const rejection = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    expect(rejection?.reason).toBeInstanceOf(DefinitionRevisionConflictError);

    const active = await firstStore.readActiveRevisionId();
    expect([left.id, right.id]).toContain(active);
  });

  it('fails explicitly when another process holds the mutation lock', async () => {
    const store = new LocalDefinitionRevisionStore(storageRoot);
    const saved = revision('locked');
    const lockRoot = path.join(storageRoot, '.agnostic', 'definitions');
    await fs.mkdir(lockRoot, { recursive: true });
    await fs.writeFile(
      path.join(lockRoot, '.mutation.lock'),
      JSON.stringify({ pid: 99999 }),
      'utf8',
    );

    await expect(store.writeRevision(saved)).rejects.toThrow(
      'mutation lock is already held',
    );
    await expect(store.readRevision(saved.id)).resolves.toBeNull();
  });
});
