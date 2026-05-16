/**
 * 🏛️ ARTEFACTO: SchemaInterpreter.ts
 * ────────────
 * CAPA: Lib (Orchestration)
 * VERSIÓN: 1.0
 * COMMIT: P3-M2.1-ADR-UNIVERSAL-INTERPRETER
 */

import { registry } from './Registry';

export interface ResolvedOption {
  label: string;
  value: string;
}

export class SchemaInterpreter {
  /**
   * 🔭 Resolve System URIs inside a JSON Schema
   * Protocol: system://[domain]/[key]
   */
  public static async resolve(schema: any): Promise<any> {
    if (!schema || typeof schema !== 'object') return schema;

    const resolvedSchema = JSON.parse(JSON.stringify(schema));
    const properties = resolvedSchema.properties || {};
    const fields = resolvedSchema.fields || [];

    // 1. Resolve in Properties
    for (const key in properties) {
      const prop = properties[key];
      if (prop.options_source) {
        prop.options = await this.resolveSource(prop.options_source);
      }
    }

    // 2. Sync to Fields (The UI view)
    for (const field of fields) {
      const prop = properties[field.key];
      if (prop && prop.options) {
        field.options = prop.options;
      }
      // Direct source in field (if applicable)
      if (field.options_source) {
        field.options = await this.resolveSource(field.options_source);
      }
    }

    return resolvedSchema;
  }

  private static async resolveSource(uri: string): Promise<ResolvedOption[]> {
    const [protocol, path] = uri.split('://');
    if (protocol !== 'system') return [];

    const [domain, resource] = path.split('/');

    switch (domain) {
      case 'registry':
        return this.resolveFromRegistry(resource);
      default:
        console.warn(`[SchemaInterpreter] Unsupported domain: ${domain}`);
        return [];
    }
  }

  private static resolveFromRegistry(domain: string): ResolvedOption[] {
    const capabilities = registry.getCapabilities(domain);
    return capabilities as ResolvedOption[];
  }
}

/**
 * 🎣 React Hook for easy interpretation in components
 */
import { useState, useEffect } from 'react';

export function useAgnosticSchema(rawSchema: any) {
  const [schema, setSchema] = useState(rawSchema);
  const [isLoading, setIsLoading] = useState(!!rawSchema);

  useEffect(() => {
    let isMounted = true;

    async function process() {
      if (!rawSchema) return;
      setIsLoading(true);
      const resolved = await SchemaInterpreter.resolve(rawSchema);
      if (isMounted) {
        setSchema(resolved);
        setIsLoading(false);
      }
    }

    process();
    return () => { isMounted = false; };
  }, [rawSchema]);

  return { schema, isLoading };
}
