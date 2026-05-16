/**
 * 🏛️ ARTEFACTO: Middleware.ts
 * ────────────
 * CAPA: Agnostic Core (Sovereignty / Universal Normalization)
 * VERSIÓN: 10.1
 * COMMIT: P3-M10.1-SOVEREIGN-RECURSION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Motor de Normalización y Certificación de Materia (DNA Compiler).
 * - Puerta de enlace obligatoria para TODA entrada/salida de materia (The Sentinel).
 * - Implementación de Soberanía Recursiva: consumo de capacidades internas como materia estándar.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: "Duty of Care": Procesar toda fuente de datos (Física o Virtual) al formato DataItem.
 * - MUST: Garantizar que la UI de configuración sea un proyector agnóstico de su propia realidad (Recursividad).
 * - NEVER: Permitir que un motor de proyección consuma datos sin purificación previa.
 * - ALWAYS: Mantener el desacoplamiento total entre el origen de la materia y su forma proyectada.
 * 
 * 📜 ADR [2026-05-12]: SOVEREIGN-RECURSION-PROTOCOL
 * - CONTEXTO: Necesidad de que el Config Manager sea autoconsciente sin duplicar información estática.
 * - DECISIÓN: Virtualizar el Registry como un contexto de materia estándar (system_capabilities). El sistema se "autopregunta" sus capacidades a través del Middleware.
 * - APRENDIZAJE: Un sistema es realmente agnóstico cuando usa sus propios átomos para configurarse a sí mismo.
 * 
 * 🔑 KEYWORDS: #SovereignRecursion #TheSentinel #DynamicReflection #AgnosticDuty #Middleware
 * 🔗 RELATIONSHIPS: [Registry, VaultAPI, AgnosticRenderer, ConfigManager]
 */
// 🧬 GENERADOR DE ID UNIVERSAL (Isomórfico Server/Client)
const generateId = (): string => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback para contextos no seguros o SSR antiguo
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

import { DataItem } from '@agnostic/core';

export type RawBlock = Record<string, any>;
export type CertifiedBlock = {
  type: string;
  context: string;
  schemaId: string;
  config: Record<string, any>;
  [key: string]: any;
};

export class AgnosticDNACompiler {
  /**
   * 🧪 CANONICALIZE_BLOCK: Convierte un bloque incierto en uno certificado (DataItem).
   * Ahora es consciente del registro de esquemas para resolver bindings implícitos.
   */
  public static canonicalizeBlock(raw: RawBlock, schemas: any[] = []): DataItem | null {
    if (!raw || typeof raw !== 'object') return null;

    // 1. Detección de Tipo (Default: form si hay contexto)
    const type = raw.type || (raw.context ? 'form' : null) || 'form'; 
    
    // 2. Inferencia de Contexto Segura
    const context = raw.context || raw.schemaId?.replace('schema_', '')?.replace('_def', '') || 'system';

    // 3. Resolución Inteligente de Esquema (Binding Soberano)
    let schemaId = raw.schemaId;
    
    if (!schemaId || !schemas.find(s => s.id === schemaId)) {
      // Si no hay ID o el ID es inválido, buscamos por convención de nombre
      const targetName = raw.schemaId || `schema_${context}`;
      const foundSchema = schemas.find(s => s.id === targetName || s.data?.name === targetName || s.data?.name === context);
      
      if (foundSchema) {
        schemaId = foundSchema.id; // Vinculamos al ID REAL (ej: schema_projects_def)
      } else {
        schemaId = targetName; // Fallback a la inferencia original
      }
    }

    // 4. Construcción de Config Segura
    const config = {
      ...(raw.config || {}),
      title: raw.title || raw.config?.title || '',
      syncMode: raw.config?.syncMode || 'auto'
    };

    return {
      id: raw.id || generateId(),
      context,
      data: config,
      type,
      schemaId: schemaId as string,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 🌊 COMPILE_PAGE: Purifica todos los bloques de una página usando el registro de esquemas.
   */
  public static compilePage(blocks: RawBlock[], schemas: any[] = []): DataItem[] {
    return blocks
      .map(b => this.canonicalizeBlock(b, schemas))
      .filter(Boolean) as DataItem[];
  }

  /**
   * 🏺 CANONICALIZE: Cristaliza un objeto desnudo en un DataItem canónico.
   * Si el objeto ya es un DataItem (id, context, data), lo devuelve tal cual (Idempotencia).
   */
  public static canonicalize(raw: any, schemas: any[] = []): DataItem | null {
    if (!raw) return null;

    // 🧬 SOVEREIGN RECURSION: Si el contexto es virtual, inyectamos el manifiesto del Registro
    if (raw.context === 'system_capabilities') {
      const { registry } = require('./Registry');
      return registry.getManifest() as any;
    }

    // 🛡️ IDEMPOTENCIA: Si ya es un DataItem válido, no envolver de nuevo
    if (raw.id && raw.context && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
      return raw as DataItem;
    }

    const certified = this.canonicalizeBlock(raw, schemas);
    if (!certified) return null;

    const { id, context, ...data } = certified;
    return {
      id: id || (raw.id as string) || generateId(),
      context: context || (raw.context as string) || 'system',
      data: data as any,
      updated_at: new Date().toISOString()
    };
  }
}
