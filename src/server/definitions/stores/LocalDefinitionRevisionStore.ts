import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
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
const TECHNICAL_DIRECTORY = '.agnostic';
const DEFINITIONS_DIRECTORY = 'definitions';
const REVISIONS_DIRECTORY = 'revisions';
const ACTIVE_POINTER_FILE = 'active.json';
const MUTATION_LOCK_FILE = '.mutation.lock';

const mutationQueues = new Map<string, Promise<void>>();

async function withMutationLock<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = mutationQueues.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const tail = previous.catch(() => undefined).then(() => gate);
  mutationQueues.set(key, tail);

  await previous.catch(() => undefined);
  try {
    await fs.mkdir(key, { recursive: true });
    const lockPath = path.join(key, MUTATION_LOCK_FILE);
    let lockHandle: Awaited<ReturnType<typeof fs.open>>;
    try {
      lockHandle = await fs.open(lockPath, 'wx');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new DefinitionStoreError(
          `Definition store mutation lock is already held at "${lockPath}".`,
          { cause: error },
        );
      }
      throw new DefinitionStoreError(
        `Could not acquire definition store mutation lock at "${lockPath}".`,
        { cause: error },
      );
    }
    try {
      await lockHandle.writeFile(
        JSON.stringify({ pid: process.pid, acquired_at: new Date().toISOString() }),
        'utf8',
      );
    } catch (error) {
      await lockHandle.close().catch(() => undefined);
      await fs.unlink(lockPath).catch(() => undefined);
      throw new DefinitionStoreError(
        `Could not initialize definition store mutation lock at "${lockPath}".`,
        { cause: error },
      );
    }

    try {
      return await operation();
    } finally {
      await lockHandle.close();
      try {
        await fs.unlink(lockPath);
      } catch (error) {
        throw new DefinitionStoreError(
          `Could not release definition store mutation lock at "${lockPath}".`,
          { cause: error },
        );
      }
    }
  } finally {
    release();
    if (mutationQueues.get(key) === tail) {
      mutationQueues.delete(key);
    }
  }
}

function assertRevisionId(id: string, field: string): void {
  if (!REVISION_ID_PATTERN.test(id)) {
    throw new DefinitionStoreError(
      `${field} must be a lowercase SHA-256 revision id.`,
    );
  }
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
    || revision.source.kind.length === 0
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
      'The active definition revision pointer contains invalid JSON.',
      { cause: error },
    );
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new DefinitionStoreError(
      'The active definition revision pointer is not an object.',
    );
  }

  const revisionId = (value as { revision_id?: unknown }).revision_id;
  if (typeof revisionId !== 'string') {
    throw new DefinitionStoreError(
      'The active definition revision pointer has no revision_id.',
    );
  }
  assertRevisionId(revisionId, 'Active revision_id');
  return revisionId;
}

async function readUtf8File(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new DefinitionStoreError(
      `Could not read definition store file "${filePath}".`,
      { cause: error },
    );
  }
}

async function writeAtomicUtf8(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    await fs.writeFile(temporaryPath, content, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch {
      // The temporary file may not exist or may already have been renamed.
    }
    throw new DefinitionStoreError(
      `Could not atomically write definition store file "${filePath}".`,
      { cause: error },
    );
  }
}

/**
 * Filesystem-backed immutable definition revision store.
 *
 * Layout:
 * storageRoot/.agnostic/definitions/
 *   active.json
 *   revisions/{sha256}.json
 */
export class LocalDefinitionRevisionStore implements DefinitionRevisionStore {
  private readonly root: string;
  private readonly revisionsDirectory: string;
  private readonly activePointerPath: string;

  constructor(storageRoot: string) {
    if (!storageRoot.trim()) {
      throw new DefinitionStoreError('Definition storage root is required.');
    }

    const resolvedStorageRoot = path.resolve(storageRoot);
    this.root = path.join(
      resolvedStorageRoot,
      TECHNICAL_DIRECTORY,
      DEFINITIONS_DIRECTORY,
    );
    this.revisionsDirectory = path.join(this.root, REVISIONS_DIRECTORY);
    this.activePointerPath = path.join(this.root, ACTIVE_POINTER_FILE);
  }

  async readActiveRevisionId(): Promise<string | null> {
    const raw = await readUtf8File(this.activePointerPath);
    return raw === null ? null : decodeActivePointer(raw);
  }

  async readRevision(id: string): Promise<DefinitionRevision | null> {
    assertRevisionId(id, 'Revision id');
    const raw = await readUtf8File(this.revisionPath(id));
    return raw === null ? null : decodeRevision(raw, id);
  }

  async writeRevision(revision: DefinitionRevision): Promise<void> {
    assertRevisionId(revision.id, 'Revision id');
    const computedId = revisionIdFor(revision.definitions);
    if (computedId !== revision.id) {
      throw new DefinitionStoreError(
        `Definition revision id "${revision.id}" does not match its content hash "${computedId}".`,
      );
    }

    const serialized = `${canonicalJson(revision)}\n`;
    await withMutationLock(this.root, async () => {
      const revisionPath = this.revisionPath(revision.id);
      const existing = await readUtf8File(revisionPath);
      if (existing !== null) {
        const persisted = decodeRevision(existing, revision.id);
        if (canonicalJson(persisted) !== canonicalJson(revision)) {
          throw new DefinitionStoreError(
            `Definition revision "${revision.id}" already exists with different content.`,
          );
        }
        return;
      }

      await writeAtomicUtf8(revisionPath, serialized);
    });
  }

  async activate(expected: string | null, next: string): Promise<void> {
    if (expected !== null) assertRevisionId(expected, 'Expected revision');
    assertRevisionId(next, 'Next revision');

    await withMutationLock(this.root, async () => {
      const actual = await this.readActiveRevisionId();
      if (actual !== expected) {
        throw new DefinitionRevisionConflictError(expected, actual);
      }

      const nextRevision = await this.readRevision(next);
      if (!nextRevision) {
        throw new DefinitionRevisionNotFoundError(next);
      }

      await writeAtomicUtf8(
        this.activePointerPath,
        `${JSON.stringify({ revision_id: next })}\n`,
      );
    });
  }

  private revisionPath(id: string): string {
    // id is validated before this method is reached. No caller-controlled path
    // separators can enter the final path.
    return path.join(this.revisionsDirectory, `${id}.json`);
  }
}
