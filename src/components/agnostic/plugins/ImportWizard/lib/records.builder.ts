import { FieldMapping, FieldType } from '../types';
import { DataItem } from '@agnostic/core';

/**
 * 🧠 records.builder.ts
 * Convierte una fila de datos crudos (strings) en un registro fuertemente tipado
 * y alineado con el esquema y contexto de destino.
 */
export function buildRecordItem(
  row: Record<string, string>,
  mappings: FieldMapping[],
  schemaName: string
): Omit<DataItem, 'id'> {
  const data: Record<string, string | number | boolean | null> = {};
  
  for (const m of mappings.filter(m => m.included)) {
    const raw = row[m.sourceKey];
    data[m.targetKey] = coerceValue(raw, m.targetType);
  }
  
  return {
    context: schemaName,
    data
  };
}

/**
 * Coerciona un valor crudo a su tipo correspondiente para evitar desajustes de base de datos.
 */
function coerceValue(raw: string | undefined | null, type: FieldType): string | number | boolean | null {
  if (raw === undefined || raw === null || raw.trim() === '') {
    return null;
  }
  
  const val = raw.trim();
  
  if (type === 'number') {
    const clean = val.replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }
  
  if (type === 'boolean') {
    return /^(si|true|1)$/i.test(val);
  }
  
  return val;
}
