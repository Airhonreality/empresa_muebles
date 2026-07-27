/**
 * Strict persistence port for immutable definition bundles.
 *
 * Implementations must throw on transport or decoding errors. Returning null is
 * reserved for a confirmed missing pointer or revision. `activate` is a
 * compare-and-set operation and must throw when `expectedRevision` is stale.
 */
export type { DefinitionRevisionStore } from '@agnostic/core';
