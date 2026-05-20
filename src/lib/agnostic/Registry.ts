/**
 * 🏛️ ARTEFACTO: Registry.ts
 * ────────────
 * CAPA: Staging / Client (Isomorphic Component Registry)
 * VERSIÓN: 9.0
 * COMMIT: P3-M3.2-REGISTRY-AXIOMATIC
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Act as a central, lightweight registration and discovery map for UI projector components.
 * - Support isomorphic resolution of components (Server and Client).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Register UI block components and their metadata.
 * - NEVER: Manage dynamic operations, external capability configurations, or runtime instances.
 * - ALWAYS: Keep the registration mapping static and memory-only.
 * 
 * 📜 ADR: [2026-05-16] UI_REGISTRY_SIMPLIFICATION
 * - DECISIÓN: Clean up the operations catalog, capabilities mapping, dynamic discovery imports, and SystemOperation type dependencies.
 * - MOTIVO: Adherence to Suh's Axiom of Independence, stripping out dynamic service orchestration from the static component registry.
 * - IMPACTO: 60+ lines of codebase pruned, compile-safe, and extremely fast block component resolution.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [init.ts]
 * - DOWNSTREAM: [AgnosticRenderer.tsx]
 */

import React from 'react';

export interface BlockMetadata {
  name: string;
  category: 'core' | 'layout' | 'data' | 'system' | 'guest' | 'content';
  description?: string;
  icon?: string;
  settings_schema?: any;
  capabilities?: string[];
}

type AgnosticBlockComponent = React.ComponentType<any>;

class AgnosticRegistry {
  private static instance: AgnosticRegistry;
  private blocks: Map<string, AgnosticBlockComponent> = new Map();
  private metadata: Map<string, BlockMetadata> = new Map();

  private constructor() {}

  public static getInstance(): AgnosticRegistry {
    if (!AgnosticRegistry.instance) {
      AgnosticRegistry.instance = new AgnosticRegistry();
    }
    return AgnosticRegistry.instance;
  }

  /**
   * Registers a UI block component and its catalog metadata.
   */
  public register(type: string, component: AgnosticBlockComponent, meta?: BlockMetadata) {
    this.blocks.set(type, component);
    const finalMeta: BlockMetadata = {
      name: meta?.name || type.charAt(0).toUpperCase() + type.slice(1),
      category: meta?.category || 'core',
      description: meta?.description || `UI block component of type ${type}`,
      settings_schema: meta?.settings_schema,
      icon: meta?.icon,
      capabilities: meta?.capabilities
    };
    this.metadata.set(type, finalMeta);
  }

  /**
   * Resolves a registered UI block component by type.
   */
  public get(type: string): AgnosticBlockComponent | null {
    return this.blocks.get(type) || null;
  }

  /**
   * Checks if a registered UI block component has a specific capability.
   */
  public hasCapability(type: string, capability: string): boolean {
    return this.metadata.get(type)?.capabilities?.includes(capability) || false;
  }

  /**
   * Returns a list of all registered block types.
   */
  public getRegisteredTypes(): string[] {
    return Array.from(this.blocks.keys());
  }

  /**
   * Retrieves metadata for a specific block type.
   */
  public getMetadata(type: string): BlockMetadata | null {
    return this.metadata.get(type) || null;
  }

  /**
   * Returns a list of all registered blocks formatted as simple static metadata.
   */
  public getManifest(): { type: string; name: string; category: string }[] {
    return Array.from(this.blocks.keys()).map(type => {
      const meta = this.metadata.get(type);
      return {
        type,
        name: meta?.name || type,
        category: meta?.category || 'core'
      };
    });
  }
}

export const registry = AgnosticRegistry.getInstance();
