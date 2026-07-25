import type { AgnosticBridge, AgnosticCapabilities } from '@agnostic/core';
import { hasStrictRead } from '@agnostic/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GitHubStrategy } from '../GitHubStrategy';
import { SupabaseStrategy } from '../SupabaseStrategy';

const capabilities: AgnosticCapabilities = {
  storageType: 'NOSQL',
  isRelational: false,
};

const bridgeWithoutStrictRead: AgnosticBridge = {
  capabilities,
  read: async () => [],
  write: async (namespace, record) => ({
    id: record.id ?? 'record',
    context: namespace,
    data: record.data,
  }),
  remove: async () => undefined,
};

describe('strict strategy reads', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('provides a reusable guard for strict definition readers', () => {
    expect(hasStrictRead(bridgeWithoutStrictRead)).toBe(false);
    expect(hasStrictRead(new GitHubStrategy('owner', 'repo', 'token'))).toBe(true);
    expect(hasStrictRead(new SupabaseStrategy('https://example.invalid', 'key'))).toBe(true);
  });

  it('keeps GitHub legacy reads empty while strict reads reject HTTP failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ message: 'server error' }), {
        status: 500,
        statusText: 'Server Error',
      }),
    ));
    const strategy = new GitHubStrategy('owner', 'repo', 'token');

    await expect(strategy.read('page_routes')).resolves.toEqual([]);
    await expect(strategy.readStrict('page_routes')).rejects.toThrow(
      '[GitHubStrategy] GET failed for page_routes: HTTP 500 Server Error',
    );
  });

  it('keeps Supabase legacy reads empty while strict reads reject HTTP failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ message: 'server error' }), {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    ));
    const strategy = new SupabaseStrategy('https://example.invalid', 'key');

    await expect(strategy.read('schema_definitions')).resolves.toEqual([]);
    await expect(strategy.readStrict('schema_definitions')).rejects.toThrow(
      '[SupabaseStrategy] Read failed for schema_definitions: HTTP 503 Service Unavailable',
    );
  });

  it('rejects malformed successful Supabase payloads only on strict reads', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ records: [] })));
    const strategy = new SupabaseStrategy('https://example.invalid', 'key');

    await expect(strategy.read('schema_definitions')).resolves.toEqual([]);
    await expect(strategy.readStrict('schema_definitions')).rejects.toThrow(
      'expected an array',
    );
  });
});
