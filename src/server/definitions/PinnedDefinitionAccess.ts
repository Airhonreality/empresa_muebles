import type {
  DefinitionCandidate,
  DefinitionPublisher,
  DefinitionReader,
  DefinitionRevision,
} from '@agnostic/core';
import { revisionIdFor } from './canonical';
import { DefinitionStoreError } from './errors';

export class PinnedDefinitionReader implements DefinitionReader {
  constructor(
    private readonly reader: DefinitionReader,
    private readonly expectedRevision: string,
  ) {}

  async readActiveRevision(): Promise<DefinitionRevision> {
    const revision = await this.reader.readActiveRevision();
    if (revision.id !== this.expectedRevision) {
      throw new DefinitionStoreError(
        `Active definition revision "${revision.id}" does not match deployed revision "${this.expectedRevision}".`,
      );
    }
    return revision;
  }
}

export class PinnedDefinitionPublisher implements DefinitionPublisher {
  constructor(
    private readonly reader: DefinitionReader,
    private readonly expectedRevision: string,
  ) {}

  async publish(candidate: DefinitionCandidate): Promise<DefinitionRevision> {
    const candidateRevision = revisionIdFor(candidate.definitions);
    if (candidateRevision !== this.expectedRevision) {
      throw new DefinitionStoreError(
        `Definition revision is pinned to "${this.expectedRevision}" for this deployment.`,
      );
    }
    return this.reader.readActiveRevision();
  }
}
