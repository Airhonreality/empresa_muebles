export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'textarea' | 'select';

export interface ParsedSource {
  filename: string;
  headers: string[];                       // columnas detectadas, en orden
  rows: Record<string, string>[];          // valores crudos como string
  rowCount: number;
  delimiter?: ';' | ',' | '\t';            // detectado automáticamente
}

export interface FieldMapping {
  sourceKey: string;     // columna original del archivo: "Precio Directo"
  targetKey: string;     // clave JSON de salida: "precio_directo" (editable)
  targetLabel: string;   // etiqueta visual para el schema: "Precio Directo" (editable)
  targetType: FieldType; // inferido por type.detector, modificable por el usuario
  included: boolean;     // false = excluir esta columna del resultado
}

export type ImportMode =
  | 'schema_only'         // materializar solo el schema, sin records
  | 'records_only'        // agregar records a un schema ya existente
  | 'schema_and_records'; // crear schema y cargar todos los records

export interface ImportTarget {
  mode: ImportMode;
  schemaName?: string;         // nombre del nuevo schema ('schema_only' / 'schema_and_records')
  existingSchemaId?: string;   // id del schema destino ('records_only')
}

export interface ImportSession {
  source: ParsedSource | null;
  mappings: FieldMapping[];
  target: ImportTarget;
}

export interface ImportResult {
  schemaCreated: boolean;
  schemaId?: string;
  recordsWritten: number;
  errors: string[];
}

export const SCHEMA_NAMESPACE = 'schema_definitions' as const;
