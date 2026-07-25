import type { DefinitionReader, DefinitionRevision } from '@agnostic/core';
import { describe, expect, it } from 'vitest';
import { PinnedDefinitionPublisher, PinnedDefinitionReader } from './PinnedDefinitionAccess';

const revision: DefinitionRevision = {
  id: 'expected',
  definitions: {
    schema_definitions: [],
    page_routes: [],
    scripts: [],
  },
  source: { kind: 'test' },
  consistency: 'atomic',
};

const reader: DefinitionReader = {
  readActiveRevision: async () => structuredClone(revision),
};

describe('pinned definition access', () => {
  it('accepts only the deployed active revision', async () => {
    await expect(new PinnedDefinitionReader(reader, 'expected').readActiveRevision())
      .resolves.toMatchObject({ id: 'expected' });
    await expect(new PinnedDefinitionReader(reader, 'other').readActiveRevision())
      .rejects.toThrow('does not match deployed revision');
  });

  it('blocks runtime publication of a different definition bundle', async () => {
    await expect(new PinnedDefinitionPublisher(reader, 'expected').publish({
      definitions: revision.definitions,
      source: revision.source,
    })).rejects.toThrow('pinned');
  });
});
