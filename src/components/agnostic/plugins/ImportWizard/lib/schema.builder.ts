import { FieldMapping, SCHEMA_NAMESPACE } from '../types';
import { DataItem } from '@agnostic/core';

/**
 * 🧠 schema.builder.ts
 * Transforma un conjunto de mapeos activos en una estructura de esquema válida del sistema.
 */
export function buildSchemaItem(schemaName: string, mappings: FieldMapping[]): Omit<DataItem, 'id'> {
  return {
    context: SCHEMA_NAMESPACE,
    data: {
      name: schemaName,
      fields: mappings
        .filter(m => m.included)
        .map(m => ({
          id: crypto.randomUUID(),
          key: m.targetKey,
          label: m.targetLabel,
          type: m.targetType,
          width: 'full' // Por defecto ocupan ancho completo
        }))
    }
  };
}
