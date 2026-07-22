import {
  DefinitionRevisionConflictError,
  type DefinitionRevision,
  type DefinitionRevisionStore,
} from '@agnostic/core';

import { canonicalJson, revisionIdFor } from '../canonical';
import { DefinitionStoreError } from '../errors';

export type SupabaseDefinitionFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const REVISIONS_TABLE = 'agnostic_definition_revisions';
const STATE_TABLE = 'agnostic_definition_state';

/**
 * Expected pre-provisioned PostgREST tables (this adapter never runs DDL):
 *
 * agnostic_definition_revisions
 *   id text primary key
 *   bundle jsonb not null
 *   created_at timestamptz
 *
 * agnostic_definition_state
 *   state_key text primary key
 *   revision_id text not null references agnostic_definition_revisions(id)
 *   updated_at timestamptz
 *
 * RLS/policies must allow the configured server credential to select, insert
 * revisions, and insert/update the single state_key='active' row.
 */
export class SupabaseDefinitionRevisionStore implements DefinitionRevisionStore {
  private readonly baseUrl: string;

  constructor(
    url: string,
    private readonly serviceKey: string,
    private readonly fetchImpl: SupabaseDefinitionFetch = globalThis.fetch,
  ) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private get headers(): HeadersInit {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
    };
  }

  private endpoint(table: string, query = ''): string {
    return `${this.baseUrl}/rest/v1/${table}${query ? `?${query}` : ''}`;
  }

  private async requestJson(
    operation: string,
    table: string,
    query = '',
    init: RequestInit = {},
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.endpoint(table, query), {
        ...init,
        headers: {
          ...this.headers,
          ...(init.headers ?? {}),
        },
        cache: 'no-store',
      });
    } catch (error) {
      throw new DefinitionStoreError(
        `Supabase definition ${operation} failed before receiving a response.`,
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new DefinitionStoreError(
        `Supabase definition ${operation} failed with HTTP ${response.status}.`,
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new DefinitionStoreError(
        `Supabase definition ${operation} returned invalid JSON.`,
        { cause: error },
      );
    }
  }

  async readActiveRevisionId(): Promise<string | null> {
    const query = new URLSearchParams({
      state_key: 'eq.active',
      select: 'revision_id',
      limit: '1',
    }).toString();
    const payload = await this.requestJson('active-read', STATE_TABLE, query);
    if (!Array.isArray(payload)) {
      throw new DefinitionStoreError('Supabase active-read response must be an array.');
    }
    if (payload.length === 0) return null;

    const revisionId = (payload[0] as Record<string, unknown>)?.revision_id;
    if (typeof revisionId !== 'string' || revisionId === '') {
      throw new DefinitionStoreError('Supabase active revision id is invalid.');
    }
    return revisionId;
  }

  async readRevision(id: string): Promise<DefinitionRevision | null> {
    const query = new URLSearchParams({
      id: `eq.${id}`,
      select: 'id,bundle',
      limit: '1',
    }).toString();
    const payload = await this.requestJson('revision-read', REVISIONS_TABLE, query);
    if (!Array.isArray(payload)) {
      throw new DefinitionStoreError('Supabase revision-read response must be an array.');
    }
    if (payload.length === 0) return null;

    const row = payload[0] as Record<string, unknown>;
    if (row.id !== id) {
      throw new DefinitionStoreError(
        `Supabase revision lookup returned an unexpected id for "${id}".`,
      );
    }
    if (!row.bundle || typeof row.bundle !== 'object' || Array.isArray(row.bundle)) {
      throw new DefinitionStoreError(`Supabase revision "${id}" has an invalid bundle.`);
    }

    const revision = row.bundle as DefinitionRevision;
    if (revision.id !== id || revisionIdFor(revision.definitions) !== id) {
      throw new DefinitionStoreError(
        `Supabase revision "${id}" failed content integrity verification.`,
      );
    }
    if (revision.consistency !== 'atomic') {
      throw new DefinitionStoreError(
        `Supabase revision "${id}" must declare atomic consistency.`,
      );
    }
    return revision;
  }

  async writeRevision(revision: DefinitionRevision): Promise<void> {
    const computedId = revisionIdFor(revision.definitions);
    if (revision.id !== computedId) {
      throw new DefinitionStoreError(
        `Definition revision id does not match its content hash "${computedId}".`,
      );
    }
    if (revision.consistency !== 'atomic') {
      throw new DefinitionStoreError('Persistent definition revisions must be atomic.');
    }

    const payload = await this.requestJson(
      'revision-write',
      REVISIONS_TABLE,
      'select=id',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=ignore-duplicates,return=representation',
        },
        body: JSON.stringify([{ id: revision.id, bundle: revision }]),
      },
    );
    if (!Array.isArray(payload)) {
      throw new DefinitionStoreError('Supabase revision-write response must be an array.');
    }
    if (payload.length > 0) {
      const insertedId = (payload[0] as Record<string, unknown>)?.id;
      if (insertedId !== revision.id) {
        throw new DefinitionStoreError('Supabase revision-write returned an unexpected id.');
      }
      return;
    }

    const existing = await this.readRevision(revision.id);
    if (!existing || canonicalJson(existing) !== canonicalJson(revision)) {
      throw new DefinitionStoreError(
        `Definition revision "${revision.id}" already exists with different content.`,
      );
    }
  }

  async activate(expected: string | null, next: string): Promise<void> {
    const payload = expected === null
      ? await this.requestJson(
          'activation-insert',
          STATE_TABLE,
          'select=revision_id',
          {
            method: 'POST',
            headers: {
              Prefer: 'resolution=ignore-duplicates,return=representation',
            },
            body: JSON.stringify([{ state_key: 'active', revision_id: next }]),
          },
        )
      : await this.requestJson(
          'activation-update',
          STATE_TABLE,
          new URLSearchParams({
            state_key: 'eq.active',
            revision_id: `eq.${expected}`,
            select: 'revision_id',
          }).toString(),
          {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              revision_id: next,
              updated_at: new Date().toISOString(),
            }),
          },
        );

    if (!Array.isArray(payload)) {
      throw new DefinitionStoreError('Supabase activation response must be an array.');
    }

    const returnedId = payload.length > 0
      ? (payload[0] as Record<string, unknown>)?.revision_id
      : null;
    if (returnedId === next) return;

    const actual = await this.readActiveRevisionId();
    throw new DefinitionRevisionConflictError(expected, actual);
  }
}
