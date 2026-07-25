import {
  DEFINITION_NAMESPACES,
  hasStrictRead,
  type AgnosticBridge,
  type DefinitionCandidate,
  type DefinitionPublisher,
  type DefinitionReader,
  type DefinitionRevision,
  type DefinitionSet,
  type StrictReadableBridge,
} from '@agnostic/core';

import { canonicalClone, revisionIdFor } from './canonical';
import { DefinitionRevisionConflictError, DefinitionStoreError } from './errors';
import { validateDefinitionCandidate } from './validation';

export interface LegacyDefinitionReaderOptions {
  sourceKind?: string;
  strict?: boolean;
}

export class LegacyDefinitionReader implements DefinitionReader {
  private readonly sourceKind: string;
  private readonly strict: boolean;

  constructor(
    private readonly bridge: AgnosticBridge,
    options: string | LegacyDefinitionReaderOptions = {},
  ) {
    this.sourceKind = typeof options === 'string'
      ? options
      : options.sourceKind ?? 'legacy-bridge';
    this.strict = typeof options === 'string' ? false : options.strict ?? false;
  }

  async readActiveRevision(): Promise<DefinitionRevision> {
    if (this.strict && !hasStrictRead(this.bridge)) {
      throw new DefinitionStoreError(
        'Strict legacy definition reads require bridge.readStrict().',
      );
    }
    const strictBridge = this.bridge as StrictReadableBridge;
    const read = this.strict
      ? strictBridge.readStrict.bind(strictBridge)
      : this.bridge.read.bind(this.bridge);

    const entries = await Promise.all(
      DEFINITION_NAMESPACES.map(async namespace => {
        const records = await read(namespace);
        if (!Array.isArray(records)) {
          throw new DefinitionStoreError(
            `Legacy definition read for "${namespace}" did not return an array.`,
          );
        }
        return [namespace, records] as const;
      }),
    );
    const definitions = canonicalClone(Object.fromEntries(entries) as DefinitionSet);

    return {
      id: revisionIdFor(definitions),
      definitions,
      source: { kind: this.sourceKind },
      consistency: 'observed',
    };
  }
}

/**
 * Transitional publisher. It intentionally preserves the current bridge
 * behavior: candidate records are upserted and absent records are not removed.
 */
export class LegacyDefinitionPublisher implements DefinitionPublisher {
  private readonly reader: LegacyDefinitionReader;

  constructor(
    private readonly bridge: AgnosticBridge,
    sourceKind = 'legacy-bridge',
  ) {
    this.reader = new LegacyDefinitionReader(bridge, sourceKind);
  }

  async publish(
    candidate: DefinitionCandidate,
    expectedRevision?: string | null,
  ): Promise<DefinitionRevision> {
    validateDefinitionCandidate(candidate);

    if (expectedRevision !== undefined) {
      const active = await this.reader.readActiveRevision();
      if (active.id !== expectedRevision) {
        throw new DefinitionRevisionConflictError(
          expectedRevision,
          active.id,
        );
      }
    }

    for (const namespace of DEFINITION_NAMESPACES) {
      for (const record of candidate.definitions[namespace]) {
        await this.bridge.write(namespace, {
          id: record.id,
          data: record.data,
          ...('_meta' in record && record._meta ? { _meta: record._meta } : {}),
        });
      }
    }

    return this.reader.readActiveRevision();
  }
}
