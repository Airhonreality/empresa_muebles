import type { DataItem } from './indra';
import type { AgnosticBridge } from './storage';

/**
 * Engine-owned namespaces whose records define the application at runtime.
 *
 * This classification is intentionally narrow. Other system namespaces may
 * choose their own lifecycle without being implicitly treated as definitions.
 */
export const DEFINITION_NAMESPACES = [
  'schema_definitions',
  'page_routes',
  'scripts',
] as const;

export type DefinitionNamespace = (typeof DEFINITION_NAMESPACES)[number];

const definitionNamespaceSet: ReadonlySet<string> = new Set(DEFINITION_NAMESPACES);

export function isDefinitionNamespace(namespace: string): namespace is DefinitionNamespace {
  return definitionNamespaceSet.has(namespace);
}

/**
 * Existing persistence adapters already satisfy the record-store contract.
 * Keeping this relationship structural makes the split additive for forks.
 */
export interface RecordStore extends AgnosticBridge {}

export type DefinitionSet = Record<DefinitionNamespace, DataItem[]>;

export interface DefinitionSource {
  /**
   * Adapter- or topology-defined source identifier.
   * It is deliberately open so the core does not prescribe infrastructure.
   */
  kind: string;
}

export interface DefinitionRevision {
  id: string;
  definitions: DefinitionSet;
  source: DefinitionSource;
  consistency: 'observed' | 'atomic';
}

export interface DefinitionReader {
  readActiveRevision(): Promise<DefinitionRevision>;
}

export interface DefinitionCandidate {
  definitions: DefinitionSet;
  source: DefinitionSource;
}

export interface DefinitionPublisher {
  publish(
    candidate: DefinitionCandidate,
    expectedRevision?: string | null,
  ): Promise<DefinitionRevision>;
}

export type DefinitionErrorCode =
  | 'DEFINITION_REVISION_CONFLICT'
  | 'DEFINITION_REVISION_NOT_FOUND'
  | 'DEFINITION_VALIDATION_FAILED';

export class DefinitionError extends Error {
  constructor(
    message: string,
    readonly code: DefinitionErrorCode,
  ) {
    super(message);
    this.name = 'DefinitionError';
  }
}

export class DefinitionRevisionConflictError extends DefinitionError {
  constructor(
    readonly expectedRevision: string | null,
    readonly actualRevision: string | null,
  ) {
    super(
      `Definition revision conflict: expected ${expectedRevision ?? 'none'}, actual ${actualRevision ?? 'none'}.`,
      'DEFINITION_REVISION_CONFLICT',
    );
    this.name = 'DefinitionRevisionConflictError';
  }
}

export class DefinitionRevisionNotFoundError extends DefinitionError {
  constructor(readonly revisionId: string) {
    super(
      `Definition revision "${revisionId}" was not found.`,
      'DEFINITION_REVISION_NOT_FOUND',
    );
    this.name = 'DefinitionRevisionNotFoundError';
  }
}

export class DefinitionValidationError extends DefinitionError {
  constructor(readonly issues: readonly string[]) {
    super(
      `Definition validation failed with ${issues.length} issue${issues.length === 1 ? '' : 's'}.`,
      'DEFINITION_VALIDATION_FAILED',
    );
    this.name = 'DefinitionValidationError';
  }
}

/**
 * Persistence primitive for immutable revisions plus compare-and-swap
 * activation. Implementations decide how and where revisions are stored.
 */
export interface DefinitionRevisionStore {
  readActiveRevisionId(): Promise<string | null>;
  readRevision(id: string): Promise<DefinitionRevision | null>;
  writeRevision(revision: DefinitionRevision): Promise<void>;
  activate(expected: string | null, next: string): Promise<void>;
}
