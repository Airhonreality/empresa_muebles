import { describe, expect, expectTypeOf, it } from 'vitest';
import type { AgnosticBridge } from './storage';
import {
  DEFINITION_NAMESPACES,
  DefinitionError,
  DefinitionRevisionConflictError,
  DefinitionRevisionNotFoundError,
  DefinitionValidationError,
  isDefinitionNamespace,
  type DefinitionCandidate,
  type DefinitionPublisher,
  type DefinitionReader,
  type DefinitionRevision,
  type DefinitionRevisionStore,
  type RecordStore,
} from './definitions';

describe('definition namespace contract', () => {
  it('contains only the three engine definition namespaces', () => {
    expect(DEFINITION_NAMESPACES).toEqual([
      'schema_definitions',
      'page_routes',
      'scripts',
    ]);
  });

  it('narrows exact definition namespace values', () => {
    expect(isDefinitionNamespace('schema_definitions')).toBe(true);
    expect(isDefinitionNamespace('page_routes')).toBe(true);
    expect(isDefinitionNamespace('scripts')).toBe(true);
    expect(isDefinitionNamespace('system_config')).toBe(false);
    expect(isDefinitionNamespace('users')).toBe(false);
    expect(isDefinitionNamespace('Scripts')).toBe(false);
  });
});

describe('additive type compatibility', () => {
  it('keeps existing bridges assignable as record stores', () => {
    expectTypeOf<AgnosticBridge>().toMatchTypeOf<RecordStore>();
    expectTypeOf<RecordStore>().toMatchTypeOf<AgnosticBridge>();
  });

  it('exposes composable reader, publisher, and revision-store contracts', () => {
    expectTypeOf<DefinitionReader['readActiveRevision']>()
      .returns.resolves.toMatchTypeOf<DefinitionRevision>();
    expectTypeOf<DefinitionPublisher['publish']>()
      .parameter(0).toMatchTypeOf<DefinitionCandidate>();
    expectTypeOf<DefinitionRevisionStore['activate']>()
      .parameters.toEqualTypeOf<[string | null, string]>();
  });
});

describe('typed definition errors', () => {
  it('reports compare-and-swap revision conflicts', () => {
    const error = new DefinitionRevisionConflictError('revision-a', 'revision-b');

    expect(error).toBeInstanceOf(DefinitionError);
    expect(error).toBeInstanceOf(DefinitionRevisionConflictError);
    expect(error.code).toBe('DEFINITION_REVISION_CONFLICT');
    expect(error.expectedRevision).toBe('revision-a');
    expect(error.actualRevision).toBe('revision-b');
  });

  it('identifies missing revisions', () => {
    const error = new DefinitionRevisionNotFoundError('revision-missing');

    expect(error).toBeInstanceOf(DefinitionError);
    expect(error.code).toBe('DEFINITION_REVISION_NOT_FOUND');
    expect(error.revisionId).toBe('revision-missing');
  });

  it('carries validation issues without domain assumptions', () => {
    const issues = ['route references an unknown schema'];
    const error = new DefinitionValidationError(issues);

    expect(error).toBeInstanceOf(DefinitionError);
    expect(error.code).toBe('DEFINITION_VALIDATION_FAILED');
    expect(error.issues).toEqual(issues);
  });
});
