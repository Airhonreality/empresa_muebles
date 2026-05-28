/**
 * 🏛️ ARTEFACTO: SchemaInterpreter.ts
 * ────────────
 * CAPA: Lib / Staging (Universal Schema Option Resolver)
 * VERSIÓN: 2.0
 * COMMIT: P3-M4.3-INTERPRETER-AXIOMATIC
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Dynamically interpret and resolve custom system options protocol (system://...) inside JSON Schemas.
 * - Translate system registries into drop-down options for UI projection forms.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Parse system protocol URIs consistently on the Client.
 * - NEVER: Rely on dynamic registry capabilities or runtime discovery hooks.
 * - ALWAYS: Provide clean fallback option lists for core system components.
 * 
 * 📜 ADR: [2026-05-16] SCHEMA_INTERPRETER_CLEANUP
 * - DECISIÓN: Replace dynamic registry capability lookup with a clean static option dictionary inside the interpreter.
 * - MOTIVO: Adherence to Nam P. Suh's Independence Axiom, eliminating runtime capability service propagation from the schema parsing engine.
 * - IMPACTO: Pruned registry dependency, compile safety, and extremely fast option resolution.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [Registry.ts]
 * - DOWNSTREAM: [AgnosticForm.tsx]
 */

import { useState, useEffect } from 'react';
import { registry } from './Registry';

export interface ResolvedOption {
  label: string;
  value: string;
}

export class SchemaInterpreter {
  /**
   * Resolves custom option sources (system://[domain]/[key]) within a JSON Schema.
   */
  public static async resolve(schema: any): Promise<any> {
    if (!schema || typeof schema !== 'object') return schema;

    const resolvedSchema = JSON.parse(JSON.stringify(schema));
    const properties = resolvedSchema.properties || {};
    const fields = resolvedSchema.fields || [];

    // 1. Resolve in Properties properties definitions
    for (const key in properties) {
      const prop = properties[key];
      if (prop.options_source) {
        prop.options = await this.resolveSource(prop.options_source);
      }
    }

    // 2. Sync to UI Fields representation
    for (const field of fields) {
      const prop = properties[field.key];
      if (prop && prop.options) {
        field.options = prop.options;
      }
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
        console.warn(`[SchemaInterpreter] Unsupported options domain: ${domain}`);
        return [];
    }
  }

  /**
   * Resolves system options statically to prevent complex runtime capability dependencies.
   */
  private static resolveFromRegistry(domain: string): ResolvedOption[] {
    if (domain === 'strategy') {
      return [
        { label: 'Estrategia Local (Filesystem)', value: 'LocalStrategy' },
        { label: 'Estrategia Supabase (SQL Cloud)', value: 'SupabaseStrategy' }
      ];
    }

    if (domain === 'blocks') {
      const manifest = registry.getManifest();
      return manifest.map(item => ({
        label: item.name,
        value: item.type
      }));
    }

    return [];
  }
}

/**
 * React Hook for executing asynchronous schema option resolution inside UI components.
 */
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
