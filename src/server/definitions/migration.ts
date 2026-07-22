import type {
  DefinitionCandidate,
  DefinitionNamespace,
  DefinitionPublisher,
  DefinitionReader,
  DefinitionRevision,
  DefinitionRevisionStore,
  DefinitionSet,
} from '@agnostic/core';
import {
  DEFINITION_NAMESPACES,
  DefinitionRevisionConflictError,
} from '@agnostic/core';

import { canonicalJson, revisionIdFor } from './canonical';
import { DefinitionRevisionNotFoundError } from './errors';
import { validateDefinitionCandidate } from './validation';
import { validatePersistentDefinitionRevision } from './persistent';

export interface DefinitionMigrationDifference {
  namespace: DefinitionNamespace;
  added: number;
  changed: number;
  removed: number;
}

export type DefinitionMigrationRequest =
  | { mode: 'dry-run' }
  | { mode: 'apply'; expectedRevision: string | null };

interface DefinitionMigrationBase {
  candidateHash: string;
  activeRevision: string | null;
  differences: DefinitionMigrationDifference[];
}

export type DefinitionMigrationResult =
  | (DefinitionMigrationBase & {
      mode: 'dry-run';
      applied: false;
    })
  | (DefinitionMigrationBase & {
      mode: 'apply';
      applied: boolean;
      idempotent: boolean;
      revision: DefinitionRevision;
    });

function compareNamespace(
  namespace: DefinitionNamespace,
  candidate: DefinitionSet,
  active: DefinitionSet | null,
): DefinitionMigrationDifference {
  const candidateById = new Map(
    candidate[namespace].map(record => [record.id, record]),
  );
  const activeById = new Map(
    (active?.[namespace] ?? []).map(record => [record.id, record]),
  );

  let added = 0;
  let changed = 0;
  let removed = 0;

  for (const [id, record] of candidateById) {
    const activeRecord = activeById.get(id);
    if (!activeRecord) {
      added += 1;
    } else if (canonicalJson(record) !== canonicalJson(activeRecord)) {
      changed += 1;
    }
  }
  for (const id of activeById.keys()) {
    if (!candidateById.has(id)) removed += 1;
  }

  return { namespace, added, changed, removed };
}

/**
 * Explicitly previews or promotes the current legacy definitions.
 *
 * This operation is never invoked as a runtime fallback. Apply mode requires a
 * caller-provided expected revision so activation remains compare-and-set.
 */
export async function migrateLegacyDefinitions(
  legacyReader: DefinitionReader,
  publisher: DefinitionPublisher,
  store: DefinitionRevisionStore,
  request: DefinitionMigrationRequest,
): Promise<DefinitionMigrationResult> {
  if (
    request.mode === 'apply'
    && !Object.prototype.hasOwnProperty.call(request, 'expectedRevision')
  ) {
    throw new TypeError('Apply mode requires an explicit expectedRevision.');
  }

  const legacyRevision = await legacyReader.readActiveRevision();
  const candidate: DefinitionCandidate = {
    definitions: legacyRevision.definitions,
    source: legacyRevision.source,
  };
  validateDefinitionCandidate(candidate);

  const candidateHash = revisionIdFor(candidate.definitions);
  const activeRevision = await store.readActiveRevisionId();
  let active: DefinitionRevision | null = null;
  if (activeRevision !== null) {
    active = await store.readRevision(activeRevision);
    if (!active) throw new DefinitionRevisionNotFoundError(activeRevision);
    validatePersistentDefinitionRevision(active);
  }

  const differences = DEFINITION_NAMESPACES.map(namespace =>
    compareNamespace(namespace, candidate.definitions, active?.definitions ?? null),
  );
  const base = { candidateHash, activeRevision, differences };

  if (request.mode === 'dry-run') {
    return { ...base, mode: 'dry-run', applied: false };
  }

  if (activeRevision !== request.expectedRevision) {
    throw new DefinitionRevisionConflictError(
      request.expectedRevision,
      activeRevision,
    );
  }

  if (activeRevision === candidateHash && active) {
    return {
      ...base,
      mode: 'apply',
      applied: false,
      idempotent: true,
      revision: active,
    };
  }

  const revision = await publisher.publish(candidate, request.expectedRevision);
  return {
    ...base,
    mode: 'apply',
    applied: true,
    idempotent: false,
    revision,
  };
}
