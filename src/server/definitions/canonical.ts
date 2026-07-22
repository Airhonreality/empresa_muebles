import { createHash } from 'node:crypto';
import type { DefinitionCandidate, DefinitionRevision } from '@agnostic/core';

import { DefinitionValidationError } from './errors';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function normalizeJson(value: unknown, seen: Set<object>): JsonValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new DefinitionValidationError([
        'Definition bundles cannot contain non-finite numbers.',
      ]);
    }
    return value;
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  if (typeof value === 'bigint') {
    throw new DefinitionValidationError(['Definition bundles cannot contain bigint values.']);
  }

  if (typeof value !== 'object') {
    throw new DefinitionValidationError([
      `Unsupported definition value: ${typeof value}.`,
    ]);
  }

  if (seen.has(value)) {
    throw new DefinitionValidationError([
      'Definition bundles cannot contain circular references.',
    ]);
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map(item => normalizeJson(item, seen) ?? null);
    }

    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(value).sort()) {
      const child = normalizeJson((value as Record<string, unknown>)[key], seen);
      if (child !== undefined) normalized[key] = child;
    }
    return normalized;
  } finally {
    seen.delete(value);
  }
}

/**
 * Canonical JSON preserves array order while sorting every object key.
 * This matches JSON persistence semantics for undefined values.
 */
export function canonicalJson(value: unknown): string {
  const normalized = normalizeJson(value, new Set());
  if (normalized === undefined) {
    throw new DefinitionValidationError([
      'The root definition value must be JSON serializable.',
    ]);
  }
  return JSON.stringify(normalized);
}

export function sha256(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

export function revisionIdFor(
  definitions: DefinitionCandidate['definitions'] | DefinitionRevision['definitions'],
): string {
  return sha256(definitions);
}

export function canonicalClone<T>(value: T): T {
  return JSON.parse(canonicalJson(value)) as T;
}
