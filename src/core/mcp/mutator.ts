import fs from 'fs';
import path from 'path';
import { CAPABILITY_REGISTRY } from '@/config/agnostic.capabilities';

// 🧬 GENERADOR DE ID UNIVERSAL (Isomórfico)
const generateId = (): string => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 🏛️ ARTEFACTO: mutator.ts
 * ────────────
 * CAPA: Core (Agnostic MCP / The Mutator)
 * VERSIÓN: 1.2.0
 */

export interface SimplifiedField {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  width?: string;
  section?: string;
  style?: any;
}

export class AgnosticDNA_Mutator {
  
  /**
   * 🔍 VALIDATE: Motor de validación universal basado en el Registry
   */
  public static validate(context: string, payload: any): { isValid: boolean; error?: string } {
    // 1. Encontrar la regla maestra para el contexto
    const ruleKey = Object.keys(CAPABILITY_REGISTRY).find(k => 
      k.toLowerCase() === context.replace(/s$/, '').replace('_', '').toLowerCase() || 
      (k === 'PageRoute' && context === 'page_routes') ||
      (k === 'SchemaDefinition' && context === 'schema_definitions')
    );
    const rule = ruleKey ? (CAPABILITY_REGISTRY as any)[ruleKey] : null;

    if (rule) {
      const result = this.validateObject(rule.params, payload, context);
      if (!result.isValid) return result;
    }

    // 2. Validación Recursiva de Bloques
    if (payload.blocks && Array.isArray(payload.blocks)) {
      for (const [index, block] of payload.blocks.entries()) {
        if (!block.type) {
          return { isValid: false, error: `Violación de Ley: Bloque [${index}] sin [type].` };
        }

        const blockRule = (CAPABILITY_REGISTRY as any)[block.type];
        if (!blockRule) {
          return { isValid: false, error: `Soberanía Violada: El tipo '${block.type}' no está registrado.` };
        }

        const config = block.config || block.props || block.data || {};
        const blockResult = this.validateObject(blockRule.params, config, `${context}.blocks[${index}] (${block.type})`);
        if (!blockResult.isValid) return blockResult;

        // 🔗 Validación Referencial
        if (config.vault) {
          const vaultFile = path.join(process.cwd(), 'storage', 'empresa_muebles', 'db', 'vault_manifest.json');
          if (fs.existsSync(vaultFile)) {
            const vaults = JSON.parse(fs.readFileSync(vaultFile, 'utf-8')).vault_manifest || [];
            if (!vaults.find((v: any) => v.id === config.vault)) {
              return { isValid: false, error: `Error de Referencia: La bóveda '${config.vault}' no existe.` };
            }
          }
        }
      }
    }
    
    return { isValid: true };
  }

  private static validateObject(schema: any, data: any, path: string): { isValid: boolean; error?: string } {
    if (schema.type === 'object' && schema.required) {
      const missing = schema.required.filter((field: string) => !data[field]);
      if (missing.length > 0) {
        return { 
          isValid: false, 
          error: `Faltan campos obligatorios [${missing.join(', ')}] en ${path}.` 
        };
      }
    }
    return { isValid: true };
  }

  static applyIntent(intent: any, existingSchema?: any): any {
    const { name, fields: intentFields, sync, prune, ...extraProps } = intent;
    const schemaId = `schema_${this.slugify(name)}_def`;
    const existingFields = existingSchema?.data?.fields || [];
    
    const incomingFields = (intentFields || []).map((f: any) => this.normalizeField(f));
    let finalFields = [...existingFields];

    if (sync || prune) {
      const incomingKeys = incomingFields.map((f: any) => f.key);
      finalFields = finalFields.filter(f => incomingKeys.includes(f.key));
    }

    incomingFields.forEach((newField: any) => {
      const index = finalFields.findIndex(f => f.key === newField.key);
      if (index !== -1) {
        finalFields[index] = { ...finalFields[index], ...newField };
      } else {
        finalFields.push(newField);
      }
    });

    return {
      id: schemaId,
      context: 'schema_definitions',
      data: {
        ...existingSchema?.data,
        ...extraProps,
        name: name,
        fields: finalFields,
        updatedAt: new Date().toISOString()
      }
    };
  }

  private static normalizeField(input: string | SimplifiedField): any {
    if (typeof input === 'object') {
      const fieldKey = this.slugify(input.key);
      return {
        id: generateId(),
        key: fieldKey,
        label: input.label || input.key,
        type: this.validateType(input.type || 'text'),
        required: !!input.required,
        width: input.width || 'full',
        section: input.section || 'General',
        config: input.style ? { style: input.style } : {}
      };
    }

    const [key, type, required, label] = input.split(':');
    return {
      id: generateId(),
      key: this.slugify(key),
      label: label || key.charAt(0).toUpperCase() + key.slice(1),
      type: this.validateType(type || 'text'),
      required: required === 'required',
      width: 'full',
      section: 'General',
      config: {}
    };
  }

  private static validateType(type: string): string {
    const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'relation', 'image', 'file', 'richtext', 'tags'];
    return validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'text';
  }

  private static slugify(text: string): string {
    return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '_').trim();
  }
}
