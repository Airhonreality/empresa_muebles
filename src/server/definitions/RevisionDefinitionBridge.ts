import type {
  AgnosticBridge,
  AgnosticCapabilities,
  AgnosticQuery,
  DataItem,
  DefinitionNamespace,
  DefinitionPublisher,
  DefinitionReader,
  DefinitionRevision,
  DefinitionSet,
} from '@agnostic/core';
import {
  DefinitionRevisionConflictError,
  isDefinitionNamespace,
} from '@agnostic/core';

const DEFAULT_CONFLICT_RETRIES = 12;
let mutationTail: Promise<void> = Promise.resolve();

function serializeDefinitionMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutationTail.catch(() => undefined).then(operation);
  mutationTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export class DefinitionRevisionRetryExhaustedError extends Error {
  constructor(
    readonly namespace: DefinitionNamespace,
    readonly attempts: number,
    readonly lastConflict: DefinitionRevisionConflictError,
  ) {
    super(
      `Definition mutation for "${namespace}" exhausted after ${attempts} CAS attempts.`,
      { cause: lastConflict },
    );
    this.name = 'DefinitionRevisionRetryExhaustedError';
  }
}

function assertDefinitionNamespace(namespace: string): asserts namespace is DefinitionNamespace {
  if (!isDefinitionNamespace(namespace)) {
    throw new Error(`Namespace "${namespace}" is not an engine definition namespace.`);
  }
}

function matchesQuery(record: DataItem, query?: AgnosticQuery): boolean {
  if (!query?.where) return true;
  return Object.entries(query.where).every(([key, expected]) =>
    key === 'id' ? record.id === expected : record.data[key] === expected,
  );
}

function applyQuery(records: readonly DataItem[], query?: AgnosticQuery): DataItem[] {
  let result = records.filter(record => matchesQuery(record, query));

  if (query?.orderBy) {
    const { column, order } = query.orderBy;
    const direction = order === 'desc' ? -1 : 1;
    result = [...result].sort((left, right) => {
      const leftValue = column === 'id' ? left.id : left.data[column];
      const rightValue = column === 'id' ? right.id : right.data[column];
      return String(leftValue ?? '').localeCompare(String(rightValue ?? '')) * direction;
    });
  }

  const offset = Math.max(0, query?.offset ?? 0);
  const limit = query?.limit;
  return result.slice(offset, limit === undefined ? undefined : offset + Math.max(0, limit));
}

/**
 * Backward-compatible AgnosticBridge facade over revisioned definitions.
 *
 * It exists only to keep legacy consumers working while official call sites
 * migrate to DefinitionReader and DefinitionPublisher.
 */
export class RevisionDefinitionBridge implements AgnosticBridge {
  readonly capabilities: AgnosticCapabilities = {
    storageType: 'NOSQL',
    isRelational: false,
  };

  constructor(
    private readonly reader: DefinitionReader,
    private readonly publisher: DefinitionPublisher,
    private readonly maxConflictRetries = DEFAULT_CONFLICT_RETRIES,
  ) {
    if (!Number.isInteger(maxConflictRetries) || maxConflictRetries < 0) {
      throw new TypeError('maxConflictRetries must be a non-negative integer.');
    }
  }

  async read(namespace: string, query?: AgnosticQuery): Promise<DataItem[]> {
    assertDefinitionNamespace(namespace);
    const revision = await this.reader.readActiveRevision();
    return structuredClone(applyQuery(revision.definitions[namespace], query));
  }

  async write(
    namespace: string,
    record: Partial<DataItem> & { data: Record<string, unknown> },
  ): Promise<DataItem> {
    assertDefinitionNamespace(namespace);
    const saved: DataItem = {
      id: record.id ?? globalThis.crypto.randomUUID(),
      context: namespace,
      data: structuredClone(record.data),
      ...(record._meta ? { _meta: structuredClone(record._meta) } : {}),
    };
    const published = await serializeDefinitionMutation(() =>
      this.publishWithRebase(
        namespace,
        active => ({
          ...active,
          [namespace]: [
            ...active[namespace].filter(item => item.id !== saved.id),
            saved,
          ],
        }),
      ),
    );
    const persisted = published.definitions[namespace].find(item => item.id === saved.id);
    if (!persisted) {
      throw new Error(`Published definition "${namespace}/${saved.id}" was not readable.`);
    }
    return structuredClone(persisted);
  }

  async remove(namespace: string, id: string): Promise<void> {
    assertDefinitionNamespace(namespace);
    await serializeDefinitionMutation(() =>
      this.publishWithRebase(
        namespace,
        active => ({
          ...active,
          [namespace]: active[namespace].filter(item => item.id !== id),
        }),
      ),
    );
  }

  private async publishWithRebase(
    namespace: DefinitionNamespace,
    mutate: (active: DefinitionSet) => DefinitionSet,
  ): Promise<DefinitionRevision> {
    let lastConflict: DefinitionRevisionConflictError | null = null;
    const attempts = this.maxConflictRetries + 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const active = await this.reader.readActiveRevision();
      try {
        return await this.publisher.publish(
          {
            definitions: mutate(active.definitions),
            source: active.source,
          },
          active.id,
        );
      } catch (error) {
        if (!(error instanceof DefinitionRevisionConflictError)) throw error;
        lastConflict = error;
      }
    }

    throw new DefinitionRevisionRetryExhaustedError(
      namespace,
      attempts,
      lastConflict!,
    );
  }
}
