export interface UnifiedQuery {
  action: 'READ' | 'WRITE' | 'DELETE';
  context: string;
  payload?: Record<string, unknown>;
}

export interface DataItem {
  id: string;
  context: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'image' | 'boolean';
  options?: string[];
  required?: boolean;
}

export interface SchemaDefinition {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

export interface AppState {
  system: {
    config: Record<string, string>;
    schemas: SchemaDefinition[];
    isLoading: boolean;
  };
  data: Record<string, DataItem[]>;
}

export interface DataStrategy {
  read(context?: string): Promise<Record<string, DataItem[]>>;
  write(fullDatabase: Record<string, DataItem[]>): Promise<void>;
}
