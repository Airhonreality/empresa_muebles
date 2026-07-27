import type {
  DefinitionRevision,
  DefinitionRevisionStore,
} from '@agnostic/core';
import {
  DefinitionRevisionConflictError,
  DefinitionRevisionNotFoundError,
} from '@agnostic/core';

import { canonicalJson, revisionIdFor } from '../canonical';
import { DefinitionStoreError } from '../errors';

const REVISION_ID_PATTERN = /^[a-f0-9]{64}$/;
const DEFAULT_TECHNICAL_PATH = '.agnostic/definitions';

type FetchImplementation = typeof fetch;

type GitHubContent = {
  content: string;
  encoding: string;
  sha: string;
};

type StoredActivePointer = {
  revisionId: string;
  sha: string;
};

export interface GitHubDefinitionRevisionStoreOptions {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  technicalPath?: string;
  fetch?: FetchImplementation;
}

function requireValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new DefinitionStoreError(`${field} is required.`);
  }
  return normalized;
}

function normalizeTechnicalPath(value: string): string {
  const normalized = value.replace(/\\/g, '/').replace(/\/+$/, '');
  const segments = normalized.split('/');
  if (
    normalized.startsWith('/')
    || segments.length === 0
    || segments.some(segment => !segment || segment === '.' || segment === '..')
  ) {
    throw new DefinitionStoreError(
      'GitHub definition technicalPath must be a relative path without traversal segments.',
    );
  }
  return segments.join('/');
}

function assertRevisionId(id: string, field: string): void {
  if (!REVISION_ID_PATTERN.test(id)) {
    throw new DefinitionStoreError(
      `${field} must be a lowercase SHA-256 revision id.`,
    );
  }
}

function encodeContent(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

function decodeContent(file: GitHubContent, logicalPath: string): string {
  if (file.encoding !== 'base64' || typeof file.content !== 'string') {
    throw new DefinitionStoreError(
      `GitHub content "${logicalPath}" is not base64 encoded.`,
    );
  }
  return Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8');
}

function decodeRevision(raw: string, expectedId: string): DefinitionRevision {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new DefinitionStoreError(
      `Definition revision "${expectedId}" contains invalid JSON.`,
      { cause: error },
    );
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new DefinitionStoreError(
      `Definition revision "${expectedId}" is not an object.`,
    );
  }

  const revision = value as Partial<DefinitionRevision>;
  if (revision.id !== expectedId) {
    throw new DefinitionStoreError(
      `Definition revision "${expectedId}" contains mismatched id "${String(revision.id)}".`,
    );
  }
  if (
    !revision.source
    || typeof revision.source !== 'object'
    || typeof revision.source.kind !== 'string'
    || !revision.source.kind
  ) {
    throw new DefinitionStoreError(
      `Definition revision "${expectedId}" has an invalid source.`,
    );
  }
  if (revision.consistency !== 'observed' && revision.consistency !== 'atomic') {
    throw new DefinitionStoreError(
      `Definition revision "${expectedId}" has invalid consistency.`,
    );
  }
  if (!revision.definitions || typeof revision.definitions !== 'object') {
    throw new DefinitionStoreError(
      `Definition revision "${expectedId}" has no definitions object.`,
    );
  }
  for (const namespace of ['schema_definitions', 'page_routes', 'scripts'] as const) {
    if (!Array.isArray(revision.definitions[namespace])) {
      throw new DefinitionStoreError(
        `Definition revision "${expectedId}" has invalid namespace "${namespace}".`,
      );
    }
  }

  const computedId = revisionIdFor(revision.definitions);
  if (computedId !== expectedId) {
    throw new DefinitionStoreError(
      `Definition revision "${expectedId}" failed integrity verification; computed "${computedId}".`,
    );
  }

  return revision as DefinitionRevision;
}

function decodeActivePointer(raw: string): string {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new DefinitionStoreError(
      'The active GitHub definition pointer contains invalid JSON.',
      { cause: error },
    );
  }

  const revisionId = value
    && typeof value === 'object'
    && !Array.isArray(value)
    ? (value as { revision_id?: unknown }).revision_id
    : undefined;
  if (typeof revisionId !== 'string') {
    throw new DefinitionStoreError(
      'The active GitHub definition pointer has no revision_id.',
    );
  }
  assertRevisionId(revisionId, 'Active revision_id');
  return revisionId;
}

export class GitHubDefinitionRevisionStore implements DefinitionRevisionStore {
  private readonly owner: string;
  private readonly repo: string;
  private readonly branch: string;
  private readonly token: string;
  private readonly technicalPath: string;
  private readonly fetchImplementation: FetchImplementation;

  constructor(options: GitHubDefinitionRevisionStoreOptions) {
    this.owner = requireValue(options.owner, 'GitHub owner');
    this.repo = requireValue(options.repo, 'GitHub repo');
    this.branch = requireValue(options.branch, 'GitHub branch');
    this.token = requireValue(options.token, 'GitHub token');
    this.technicalPath = normalizeTechnicalPath(
      options.technicalPath ?? DEFAULT_TECHNICAL_PATH,
    );
    this.fetchImplementation = options.fetch ?? fetch;
  }

  async readActiveRevisionId(): Promise<string | null> {
    return (await this.readActivePointer())?.revisionId ?? null;
  }

  async readRevision(id: string): Promise<DefinitionRevision | null> {
    assertRevisionId(id, 'Revision id');
    const logicalPath = this.revisionPath(id);
    const file = await this.readContent(logicalPath);
    if (!file) return null;
    return decodeRevision(decodeContent(file, logicalPath), id);
  }

  async writeRevision(revision: DefinitionRevision): Promise<void> {
    assertRevisionId(revision.id, 'Revision id');
    const computedId = revisionIdFor(revision.definitions);
    if (computedId !== revision.id) {
      throw new DefinitionStoreError(
        `Definition revision id "${revision.id}" does not match its content hash "${computedId}".`,
      );
    }

    const logicalPath = this.revisionPath(revision.id);
    const existing = await this.readContent(logicalPath);
    if (existing) {
      this.assertSameRevision(existing, logicalPath, revision);
      return;
    }

    const response = await this.putContent(
      logicalPath,
      `${canonicalJson(revision)}\n`,
      `Store definition revision ${revision.id}`,
    );
    if (response.ok) return;

    if (response.status === 409 || response.status === 422) {
      const concurrent = await this.readContent(logicalPath);
      if (concurrent) {
        this.assertSameRevision(concurrent, logicalPath, revision);
        return;
      }
    }

    throw this.requestError('write immutable revision', logicalPath, response.status);
  }

  async activate(expected: string | null, next: string): Promise<void> {
    if (expected !== null) assertRevisionId(expected, 'Expected revision');
    assertRevisionId(next, 'Next revision');

    const revision = await this.readRevision(next);
    if (!revision) {
      throw new DefinitionRevisionNotFoundError(next);
    }

    const active = await this.readActivePointer();
    const actual = active?.revisionId ?? null;
    if (actual !== expected) {
      throw new DefinitionRevisionConflictError(expected, actual);
    }

    const response = await this.putContent(
      this.activePointerPath(),
      `${JSON.stringify({ revision_id: next })}\n`,
      `Activate definition revision ${next}`,
      active?.sha,
    );
    if (response.ok) return;

    if (response.status === 409 || response.status === 422) {
      const current = await this.readActivePointer();
      throw new DefinitionRevisionConflictError(
        expected,
        current?.revisionId ?? null,
      );
    }

    throw this.requestError(
      'activate revision',
      this.activePointerPath(),
      response.status,
    );
  }

  private async readActivePointer(): Promise<StoredActivePointer | null> {
    const logicalPath = this.activePointerPath();
    const file = await this.readContent(logicalPath);
    if (!file) return null;
    return {
      revisionId: decodeActivePointer(decodeContent(file, logicalPath)),
      sha: file.sha,
    };
  }

  private async readContent(logicalPath: string): Promise<GitHubContent | null> {
    let response: Response;
    try {
      response = await this.fetchImplementation(this.contentUrl(logicalPath), {
        method: 'GET',
        headers: this.headers(),
        cache: 'no-store',
      });
    } catch (error) {
      throw new DefinitionStoreError(
        `GitHub definition read failed for "${logicalPath}".`,
        { cause: error },
      );
    }

    if (response.status === 404) return null;
    if (!response.ok) {
      throw this.requestError('read content', logicalPath, response.status);
    }

    let value: unknown;
    try {
      value = await response.json();
    } catch (error) {
      throw new DefinitionStoreError(
        `GitHub returned invalid JSON for "${logicalPath}".`,
        { cause: error },
      );
    }

    if (
      !value
      || typeof value !== 'object'
      || Array.isArray(value)
      || typeof (value as GitHubContent).content !== 'string'
      || typeof (value as GitHubContent).encoding !== 'string'
      || typeof (value as GitHubContent).sha !== 'string'
    ) {
      throw new DefinitionStoreError(
        `GitHub returned an invalid content object for "${logicalPath}".`,
      );
    }
    return value as GitHubContent;
  }

  private putContent(
    logicalPath: string,
    content: string,
    message: string,
    sha?: string,
  ): Promise<Response> {
    return this.fetchImplementation(this.contentUrl(logicalPath), {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({
        message,
        content: encodeContent(content),
        branch: this.branch,
        ...(sha ? { sha } : {}),
      }),
    });
  }

  private assertSameRevision(
    file: GitHubContent,
    logicalPath: string,
    revision: DefinitionRevision,
  ): void {
    const persisted = decodeRevision(
      decodeContent(file, logicalPath),
      revision.id,
    );
    if (canonicalJson(persisted) !== canonicalJson(revision)) {
      throw new DefinitionStoreError(
        `Definition revision "${revision.id}" already exists with different content.`,
      );
    }
  }

  private contentUrl(logicalPath: string): string {
    const encodedPath = logicalPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    const owner = encodeURIComponent(this.owner);
    const repo = encodeURIComponent(this.repo);
    const branch = encodeURIComponent(this.branch);
    return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`;
  }

  private headers(): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private revisionPath(id: string): string {
    return `${this.technicalPath}/revisions/${id}.json`;
  }

  private activePointerPath(): string {
    return `${this.technicalPath}/active.json`;
  }

  private requestError(
    operation: string,
    logicalPath: string,
    status: number,
  ): DefinitionStoreError {
    return new DefinitionStoreError(
      `GitHub could not ${operation} for "${logicalPath}" (HTTP ${status}).`,
    );
  }
}
