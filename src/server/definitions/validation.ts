import {
  DEFINITION_NAMESPACES,
  type DefinitionCandidate,
  type DefinitionNamespace,
} from '@agnostic/core';

import { DefinitionValidationError } from './errors';

type RecordLike = {
  id: string;
  context?: string;
  data: Record<string, unknown>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertRecordShape(
  namespace: DefinitionNamespace,
  value: unknown,
  index: number,
): asserts value is RecordLike {
  if (!isObject(value)) {
    throw new DefinitionValidationError([`${namespace}[${index}] must be an object.`]);
  }
  if (typeof value.id !== 'string' || value.id.trim() === '') {
    throw new DefinitionValidationError([
      `${namespace}[${index}].id must be a non-empty string.`,
    ]);
  }
  if (!isObject(value.data)) {
    throw new DefinitionValidationError([`${namespace}[${index}].data must be an object.`]);
  }
  if (value.context !== undefined && value.context !== namespace) {
    throw new DefinitionValidationError([
      `${namespace}[${index}].context must equal "${namespace}" when present.`,
    ]);
  }
}

function collectBlocks(value: unknown, output: Record<string, unknown>[]): void {
  if (!Array.isArray(value)) return;
  for (const candidate of value) {
    if (!isObject(candidate)) continue;
    output.push(candidate);
    collectBlocks(candidate.blocks, output);
    if (isObject(candidate.data)) collectBlocks(candidate.data.blocks, output);
  }
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function validateDefinitionCandidate(candidate: DefinitionCandidate): void {
  if (!isObject(candidate) || !isObject(candidate.definitions)) {
    throw new DefinitionValidationError([
      'Definition candidate must contain a definitions object.',
    ]);
  }
  if (
    !isObject(candidate.source)
    || typeof candidate.source.kind !== 'string'
    || candidate.source.kind.trim() === ''
  ) {
    throw new DefinitionValidationError([
      'Definition candidate source.kind must be a non-empty string.',
    ]);
  }

  for (const namespace of DEFINITION_NAMESPACES) {
    const records = candidate.definitions[namespace];
    if (!Array.isArray(records)) {
      throw new DefinitionValidationError([`definitions.${namespace} must be an array.`]);
    }

    const ids = new Set<string>();
    records.forEach((record, index) => {
      assertRecordShape(namespace, record, index);
      if (ids.has(record.id)) {
        throw new DefinitionValidationError([
          `definitions.${namespace} contains duplicate id "${record.id}".`,
        ]);
      }
      ids.add(record.id);
    });
  }

  const schemas = candidate.definitions.schema_definitions as readonly RecordLike[];
  const routes = candidate.definitions.page_routes as readonly RecordLike[];
  const scripts = candidate.definitions.scripts as readonly RecordLike[];

  const schemaReferences = new Set<string>();
  const schemaContexts = new Set<string>();
  for (const schema of schemas) {
    schemaReferences.add(schema.id);
    const name = optionalString(schema.data.name);
    const slug = optionalString(schema.data.slug);
    if (!name) {
      throw new DefinitionValidationError([
        `Schema "${schema.id}" must define a non-empty data.name.`,
      ]);
    }
    schemaReferences.add(name);
    schemaContexts.add(name);
    if (slug) schemaReferences.add(slug);
  }

  const scriptNames = new Set<string>();
  for (const script of scripts) {
    const name = optionalString(script.data.name);
    if (!name) {
      throw new DefinitionValidationError([
        `Script "${script.id}" must define a non-empty data.name.`,
      ]);
    }
    scriptNames.add(name);
  }

  for (const route of routes) {
    const blocks: Record<string, unknown>[] = [];
    collectBlocks(route.data.blocks, blocks);

    for (const block of blocks) {
      const data = isObject(block.data) ? block.data : {};
      const schemaId = optionalString(block.schema_id) ?? optionalString(data.schema_id);
      const context = optionalString(block.context) ?? optionalString(data.context);
      const zap = optionalString(block.zap) ?? optionalString(data.zap);

      if (schemaId && !schemaReferences.has(schemaId)) {
        throw new DefinitionValidationError([
          `Route "${route.id}" references unknown schema "${schemaId}".`,
        ]);
      }
      if (context && context !== 'system' && !schemaContexts.has(context)) {
        throw new DefinitionValidationError([
          `Route "${route.id}" references unknown context "${context}".`,
        ]);
      }
      if (zap && !scriptNames.has(zap)) {
        throw new DefinitionValidationError([
          `Route "${route.id}" references unknown zap "${zap}".`,
        ]);
      }
    }
  }
}
