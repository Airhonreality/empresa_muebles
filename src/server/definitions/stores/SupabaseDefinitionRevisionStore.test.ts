import {
  DefinitionRevisionConflictError,
  type DataItem,
  type DefinitionRevision,
  type DefinitionSet,
} from '@agnostic/core';
import { describe, expect, it } from 'vitest';

import { revisionIdFor } from '../canonical';
import { DefinitionStoreError } from '../errors';
import {
  SupabaseDefinitionRevisionStore,
  type SupabaseDefinitionFetch,
} from './SupabaseDefinitionRevisionStore';

function record(namespace: keyof DefinitionSet, id: string, data: DataItem['data']): DataItem {
  return { id, context: namespace, data };
}

function revision(sourceKind = 'test', routePath = '/items'): DefinitionRevision {
  const definitions: DefinitionSet = {
    schema_definitions: [
      record('schema_definitions', 'schema_items', { name: 'items', fields: [] }),
    ],
    page_routes: [
      record('page_routes', 'route_items', { path: routePath, blocks: [] }),
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

type RequestLog = {
  url: string;
  method: string;
  headers: Headers;
};

class MockPostgrest {
  readonly revisions = new Map<string, DefinitionRevision>();
  readonly requests: RequestLog[] = [];
  active: string | null = null;
  errorStatus: number | null = null;
  afterSuccessfulPatch: (() => void) | null = null;

  readonly fetch: SupabaseDefinitionFetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? 'GET';
    const headers = new Headers(init.headers);
    this.requests.push({ url: url.toString(), method, headers });

    if (this.errorStatus !== null) {
      return Response.json(
        { message: 'simulated failure' },
        { status: this.errorStatus },
      );
    }

    if (url.pathname.endsWith('/agnostic_definition_revisions')) {
      return this.handleRevisions(url, method, init);
    }
    if (url.pathname.endsWith('/agnostic_definition_state')) {
      return this.handleState(url, method, init);
    }
    return Response.json({ message: 'unknown table' }, { status: 404 });
  };

  private handleRevisions(url: URL, method: string, init: RequestInit): Response {
    if (method === 'GET') {
      const filter = url.searchParams.get('id') ?? '';
      const id = filter.replace(/^eq\./, '');
      const bundle = this.revisions.get(id);
      return Response.json(bundle ? [{ id, bundle: structuredClone(bundle) }] : []);
    }

    if (method === 'POST') {
      const [row] = JSON.parse(String(init.body)) as Array<{
        id: string;
        bundle: DefinitionRevision;
      }>;
      if (this.revisions.has(row.id)) return Response.json([], { status: 201 });
      this.revisions.set(row.id, structuredClone(row.bundle));
      return Response.json([{ id: row.id }], { status: 201 });
    }

    return Response.json({ message: 'method not allowed' }, { status: 405 });
  }

  private handleState(url: URL, method: string, init: RequestInit): Response {
    if (method === 'GET') {
      return Response.json(
        this.active === null ? [] : [{ revision_id: this.active }],
      );
    }

    if (method === 'POST') {
      const [row] = JSON.parse(String(init.body)) as Array<{
        revision_id: string;
      }>;
      if (this.active !== null) return Response.json([], { status: 201 });
      if (!this.revisions.has(row.revision_id)) {
        return Response.json({ message: 'foreign key violation' }, { status: 409 });
      }
      this.active = row.revision_id;
      return Response.json([{ revision_id: this.active }], { status: 201 });
    }

    if (method === 'PATCH') {
      const expected = (url.searchParams.get('revision_id') ?? '').replace(/^eq\./, '');
      const body = JSON.parse(String(init.body)) as { revision_id: string };
      if (this.active !== expected) return Response.json([]);
      if (!this.revisions.has(body.revision_id)) {
        return Response.json({ message: 'foreign key violation' }, { status: 409 });
      }
      this.active = body.revision_id;
      const returnedRevision = this.active;
      this.afterSuccessfulPatch?.();
      return Response.json([{ revision_id: returnedRevision }]);
    }

    return Response.json({ message: 'method not allowed' }, { status: 405 });
  }
}

function createStore(mock: MockPostgrest, serviceKey = 'private-test-key') {
  return new SupabaseDefinitionRevisionStore(
    'https://example.supabase.co/',
    serviceKey,
    mock.fetch,
  );
}

describe('SupabaseDefinitionRevisionStore', () => {
  it('writes and reads an immutable revision through dedicated PostgREST tables', async () => {
    const mock = new MockPostgrest();
    const store = createStore(mock);
    const bundle = revision();

    await store.writeRevision(bundle);
    await store.writeRevision(bundle);

    expect(await store.readRevision(bundle.id)).toEqual(bundle);
    expect(mock.revisions.size).toBe(1);
    expect(mock.requests.some(request =>
      request.url.includes('/rest/v1/agnostic_definition_revisions'),
    )).toBe(true);
  });

  it('rejects a duplicate id with a different immutable bundle', async () => {
    const mock = new MockPostgrest();
    const store = createStore(mock);
    const original = revision('original');
    const changedSource = revision('changed-source');

    expect(original.id).toBe(changedSource.id);
    await store.writeRevision(original);
    await expect(store.writeRevision(changedSource)).rejects.toBeInstanceOf(
      DefinitionStoreError,
    );
  });

  it('activates an initial pointer and then performs filtered CAS update', async () => {
    const mock = new MockPostgrest();
    const store = createStore(mock);
    const first = revision('first');
    const second = revision('second', '/changed');

    await store.writeRevision(first);
    await store.writeRevision(second);
    await store.activate(null, first.id);
    await store.activate(first.id, second.id);

    expect(await store.readActiveRevisionId()).toBe(second.id);
    const patch = mock.requests.find(request => request.method === 'PATCH');
    expect(patch?.url).toContain(`revision_id=eq.${first.id}`);
  });

  it('reports typed conflict and preserves state for stale CAS', async () => {
    const mock = new MockPostgrest();
    const store = createStore(mock);
    const bundle = revision();

    await store.writeRevision(bundle);
    await store.activate(null, bundle.id);

    const activation = store.activate('stale', bundle.id);
    await expect(activation).rejects.toMatchObject({
      expectedRevision: 'stale',
      actualRevision: bundle.id,
      code: 'DEFINITION_REVISION_CONFLICT',
    });
    await expect(store.activate('stale', bundle.id)).rejects.toBeInstanceOf(
      DefinitionRevisionConflictError,
    );
    expect(await store.readActiveRevisionId()).toBe(bundle.id);
  });

  it('does not turn a successful CAS into a false conflict after a successor advances', async () => {
    const mock = new MockPostgrest();
    const store = createStore(mock);
    const first = revision('first');
    const second = revision('second', '/second');
    const successor = revision('successor', '/successor');
    await store.writeRevision(first);
    await store.writeRevision(second);
    await store.writeRevision(successor);
    await store.activate(null, first.id);
    mock.afterSuccessfulPatch = () => {
      mock.active = successor.id;
    };

    await expect(store.activate(first.id, second.id)).resolves.toBeUndefined();
    expect(mock.active).toBe(successor.id);
  });

  it('treats HTTP failures as strict errors without exposing the service key', async () => {
    const mock = new MockPostgrest();
    const serviceKey = 'must-not-appear';
    const store = createStore(mock, serviceKey);
    mock.errorStatus = 503;

    let error: unknown;
    try {
      await store.readActiveRevisionId();
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(DefinitionStoreError);
    expect(String(error)).toContain('HTTP 503');
    expect(String(error)).not.toContain(serviceKey);
  });

  it('sends the service key only in request headers', async () => {
    const mock = new MockPostgrest();
    const serviceKey = 'header-only-key';
    const store = createStore(mock, serviceKey);

    await store.readActiveRevisionId();

    expect(mock.requests[0].headers.get('apikey')).toBe(serviceKey);
    expect(mock.requests[0].headers.get('authorization')).toBe(`Bearer ${serviceKey}`);
    expect(mock.requests[0].url).not.toContain(serviceKey);
  });
});
