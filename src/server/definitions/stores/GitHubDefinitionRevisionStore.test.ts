import type { DataItem, DefinitionRevision, DefinitionSet } from '@agnostic/core';
import { DefinitionRevisionConflictError } from '@agnostic/core';
import { describe, expect, it } from 'vitest';

import { revisionIdFor } from '../canonical';
import { GitHubDefinitionRevisionStore } from './GitHubDefinitionRevisionStore';

type StoredFile = {
  content: string;
  sha: string;
};

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
        fields: [],
      }),
    ],
    page_routes: [
      item('page_routes', `route_${label}`, {
        path: `/${label}`,
        blocks: [],
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
    source: { kind: 'github-test' },
    consistency: 'atomic',
  };
}

function createGitHubContentsMock() {
  const files = new Map<string, StoredFile>();
  let shaSequence = 0;

  const pathFromUrl = (url: string) => {
    const parsed = new URL(url);
    const marker = '/contents/';
    return parsed.pathname
      .slice(parsed.pathname.indexOf(marker) + marker.length)
      .split('/')
      .map(decodeURIComponent)
      .join('/');
  };

  const fetchMock = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
    const logicalPath = pathFromUrl(url);
    const method = init?.method ?? 'GET';

    if (method === 'GET') {
      const file = files.get(logicalPath);
      if (!file) return Response.json({ message: 'Not Found' }, { status: 404 });
      return Response.json({
        type: 'file',
        encoding: 'base64',
        content: file.content,
        sha: file.sha,
      });
    }

    if (method === 'PUT') {
      const body = JSON.parse(String(init?.body)) as {
        content: string;
        sha?: string;
      };
      const existing = files.get(logicalPath);
      if (existing) {
        if (!body.sha || body.sha !== existing.sha) {
          return Response.json({ message: 'sha mismatch' }, { status: 409 });
        }
      } else if (body.sha) {
        return Response.json({ message: 'file missing' }, { status: 422 });
      }

      const sha = `blob-${++shaSequence}`;
      files.set(logicalPath, { content: body.content, sha });
      return Response.json({ content: { sha } }, { status: existing ? 200 : 201 });
    }

    return Response.json({ message: 'unsupported method' }, { status: 405 });
  };

  return {
    files,
    fetch: fetchMock as typeof fetch,
  };
}

function createStore(fetchImplementation: typeof fetch) {
  return new GitHubDefinitionRevisionStore({
    owner: 'owner',
    repo: 'repo',
    branch: 'main',
    token: 'secret-token',
    technicalPath: '.agnostic/definitions',
    fetch: fetchImplementation,
  });
}

describe('GitHubDefinitionRevisionStore', () => {
  it('returns null only for confirmed missing content', async () => {
    const github = createGitHubContentsMock();
    const store = createStore(github.fetch);
    const missing = revision('missing');

    await expect(store.readActiveRevisionId()).resolves.toBeNull();
    await expect(store.readRevision(missing.id)).resolves.toBeNull();
  });

  it('writes and strictly reads a content-addressed immutable bundle', async () => {
    const github = createGitHubContentsMock();
    const store = createStore(github.fetch);
    const saved = revision('saved');

    await store.writeRevision(saved);
    await expect(store.readRevision(saved.id)).resolves.toEqual(saved);
    expect(
      github.files.has(`.agnostic/definitions/revisions/${saved.id}.json`),
    ).toBe(true);
  });

  it('creates the active pointer without a prior SHA', async () => {
    const github = createGitHubContentsMock();
    const store = createStore(github.fetch);
    const first = revision('first');

    await store.writeRevision(first);
    await store.activate(null, first.id);

    await expect(store.readActiveRevisionId()).resolves.toBe(first.id);
  });

  it('rejects a stale expected revision before writing the pointer', async () => {
    const github = createGitHubContentsMock();
    const store = createStore(github.fetch);
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

  it('turns a concurrent SHA conflict into a typed conflict without retrying', async () => {
    const github = createGitHubContentsMock();
    const firstStore = createStore(github.fetch);
    const secondStore = createStore(github.fetch);
    const initial = revision('initial');
    const left = revision('left');
    const right = revision('right');
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
    expect([left.id, right.id]).toContain(await firstStore.readActiveRevisionId());
  });
});
