import type {
  DefinitionCandidate,
  DefinitionPublisher,
  DefinitionReader,
  DefinitionRevision,
} from '@agnostic/core';

import { canonicalClone, canonicalJson, revisionIdFor } from './canonical';
import {
  DefinitionRevisionConflictError,
  DefinitionRevisionNotFoundError,
  DefinitionStoreError,
} from './errors';
import type { DefinitionRevisionStore } from './revision-store';
import { validateDefinitionCandidate } from './validation';

export function validatePersistentDefinitionRevision(
  revision: DefinitionRevision,
): void {
  validateDefinitionCandidate({
    definitions: revision.definitions,
    source: revision.source,
  });
  const computedId = revisionIdFor(revision.definitions);
  if (computedId !== revision.id) {
    throw new DefinitionStoreError(
      `Revision "${revision.id}" failed integrity verification; computed "${computedId}".`,
    );
  }
  if (revision.consistency !== 'atomic') {
    throw new DefinitionStoreError(
      `Persistent revision "${revision.id}" must declare atomic consistency.`,
    );
  }
}

export class PersistentDefinitionReader implements DefinitionReader {
  constructor(private readonly store: DefinitionRevisionStore) {}

  async readActiveRevision(): Promise<DefinitionRevision> {
    const activeId = await this.store.readActiveRevisionId();
    if (!activeId) {
      throw new DefinitionRevisionNotFoundError('active');
    }

    const revision = await this.store.readRevision(activeId);
    if (!revision) {
      throw new DefinitionRevisionNotFoundError(activeId);
    }
    if (revision.id !== activeId) {
      throw new DefinitionStoreError(
        `Definition store returned revision "${revision.id}" for active id "${activeId}".`,
      );
    }

    validatePersistentDefinitionRevision(revision);
    return canonicalClone(revision);
  }
}

export class PersistentDefinitionPublisher implements DefinitionPublisher {
  constructor(private readonly store: DefinitionRevisionStore) {}

  async publish(
    candidate: DefinitionCandidate,
    expectedRevision?: string | null,
  ): Promise<DefinitionRevision> {
    validateDefinitionCandidate(candidate);

    const activeId = await this.store.readActiveRevisionId();
    if (expectedRevision !== undefined && activeId !== expectedRevision) {
      throw new DefinitionRevisionConflictError(
        expectedRevision,
        activeId,
      );
    }

    const definitions = canonicalClone(candidate.definitions);
    const revision: DefinitionRevision = {
      id: revisionIdFor(definitions),
      definitions,
      source: canonicalClone(candidate.source),
      consistency: 'atomic',
    };

    validatePersistentDefinitionRevision(revision);

    let persisted = await this.store.readRevision(revision.id);
    if (!persisted) {
      await this.store.writeRevision(revision);
      persisted = await this.store.readRevision(revision.id);
    }
    if (!persisted) {
      throw new DefinitionStoreError(
        `Definition revision "${revision.id}" was not readable after persistence.`,
      );
    }
    validatePersistentDefinitionRevision(persisted);
    if (canonicalJson(persisted.definitions) !== canonicalJson(revision.definitions)) {
      throw new DefinitionStoreError(
        `Definition revision "${revision.id}" definitions changed during persistence.`,
      );
    }

    try {
      await this.store.activate(activeId, revision.id);
    } catch (error) {
      if (error instanceof DefinitionRevisionConflictError) throw error;
      throw new DefinitionStoreError(
        `Could not activate definition revision "${revision.id}".`,
        { cause: error },
      );
    }

    return canonicalClone(persisted);
  }
}
