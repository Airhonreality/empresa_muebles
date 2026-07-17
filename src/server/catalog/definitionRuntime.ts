import { SYSTEM_NS } from '@/lib/agnostic/constants';
import type { DataItem } from '@agnostic/core';
import { DEFINITION_MODE, getDefinitionMode, recordsForNamespace } from './definitionRevision';
import { PostgresDefinitionReader } from './postgresDefinitionReader';
import type { StructuralNamespace } from './readOnlyCatalog';

export function isStructuralNamespace(namespace: string): namespace is StructuralNamespace {
  return resolveStructuralNamespace(namespace) !== null;
}

export async function readRuntimeDefinitions(namespace: string): Promise<DataItem[] | null> {
  if (getDefinitionMode() !== DEFINITION_MODE.REVISION || !isStructuralNamespace(namespace)) return null;
  const reader = new PostgresDefinitionReader(process.env.DATABASE_URL ?? '');
  const revision = await reader.readExpectedRevision();
  return recordsForNamespace(revision, resolveStructuralNamespace(namespace)!).map(record => ({
    id: record.id,
    context: record.context ?? record.namespace,
    data: record.data,
    created_at: record.created_at ?? undefined,
    updated_at: record.updated_at ?? undefined,
  }));
}

function resolveStructuralNamespace(namespace: string): StructuralNamespace | null {
  if (namespace === SYSTEM_NS.SCHEMAS || namespace === 'schema_definitions') return 'schema_definitions';
  if (namespace === SYSTEM_NS.ROUTES || namespace === 'page_routes') return 'page_routes';
  if (namespace === SYSTEM_NS.CONFIG || namespace === 'scripts') return 'scripts';
  return null;
}

export function assertStructuralMutationAllowed(namespace: string): void {
  if (getDefinitionMode() === DEFINITION_MODE.REVISION && isStructuralNamespace(namespace)) {
    throw new Error('DEFINITION_MUTATION_REQUIRES_PUBLISHER');
  }
}
