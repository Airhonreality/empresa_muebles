/**
 * 🏛️ ARTEFACTO: Registry.ts
 * ────────────
 * CAPA: Lib (Infrastructure Services)
 * VERSIÓN: 8.0
 * COMMIT: P3-M2.1-ADR-CAPABILITY-CATALOG
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Mediación central para el registro de bloques y capacidades del sistema.
 * - Resolución isomórfica de componentes (Servidor/Cliente).
 * - Catálogo de Introspección para el MCP Bridge y el Designer.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Separar el Catálogo (qué existe) del Estado (qué está activo).
 * - NEVER: Almacenar configuración volátil o de instancia.
 * - ALWAYS: Proporcionar metadatos claros para el autodescubrimiento del sistema.
 * 
 * 📜 ADR: [2026-05-15] CAPABILITY_DECOUPLING
 * - DECISIÓN: Implementar un mapa de 'capabilities' independiente de las 'operations'.
 * - MOTIVO: Erradicar el abuso del Registry como transporte de configuración dinámica.
 * - IMPACTO: Arquitectura mínima donde el Registry solo sabe qué herramientas tiene disponibles.
 */

import React from 'react';
import { DataItem, SystemOperation } from '@agnostic/core';
import { CAPABILITY_REGISTRY } from '@/config/agnostic.capabilities';

export interface BlockMetadata {
  name: string;
  category: 'core' | 'layout' | 'data' | 'system' | 'guest';
  description?: string;
  icon?: string;
  settings_schema?: any;
  capabilities?: string[];
}

export interface CapabilityMetadata {
  value?: string;
  domain: string;
  label: string;
  description?: string;
  metadata?: any;
}

type AgnosticBlockComponent = React.ComponentType<any>;

class AgnosticRegistry {
  private static instance: AgnosticRegistry;
  private blocks: Map<string, AgnosticBlockComponent> = new Map();
  private metadata: Map<string, BlockMetadata> = new Map();
  private operations: Map<string, SystemOperation> = new Map();
  private capabilities: Map<string, Map<string, CapabilityMetadata>> = new Map();

  private constructor() {}

  public static getInstance(): AgnosticRegistry {
    if (!AgnosticRegistry.instance) {
      AgnosticRegistry.instance = new AgnosticRegistry();
    }
    return AgnosticRegistry.instance;
  }

  public register(type: string, component: AgnosticBlockComponent, meta?: BlockMetadata) {
    this.blocks.set(type, component);
    const capability = CAPABILITY_REGISTRY[type];
    const finalMeta: BlockMetadata = {
      name: capability?.label || meta?.name || type.charAt(0).toUpperCase() + type.slice(1),
      category: (capability?.type as any) || meta?.category || 'core',
      description: capability?.description || meta?.description,
      settings_schema: capability?.params || meta?.settings_schema,
      icon: meta?.icon,
      capabilities: meta?.capabilities
    };
    this.metadata.set(type, finalMeta);
  }

  public registerCapability(domain: string, id: string, meta: CapabilityMetadata) {
    if (!this.capabilities.has(domain)) {
      this.capabilities.set(domain, new Map());
    }
    this.capabilities.get(domain)!.set(id, meta);
  }

  public registerOperation(op: SystemOperation) {
    this.operations.set(op.id, op);
  }

  public get(type: string): AgnosticBlockComponent | null {
    return this.blocks.get(type) || null;
  }

  public getCapabilities(domain: string): CapabilityMetadata[] {
    const domainMap = this.capabilities.get(domain);
    if (!domainMap) return [];
    
    // Inject the key (value) into the returned metadata object
    return Array.from(domainMap.entries()).map(([value, meta]) => ({
      value,
      ...meta
    }));
  }

  public getManifest(): DataItem[] {
    const blocks = Array.from(this.blocks.keys()).map(type => ({
      id: `capability_block_${type}`,
      context: 'system_capabilities',
      data: { type, ...this.metadata.get(type) },
      updated_at: new Date().toISOString()
    }));

    const capabilities: any[] = [];
    this.capabilities.forEach((map, domain) => {
      map.forEach((meta, id) => {
        capabilities.push({
          id: `capability_${domain}_${id}`,
          context: 'system_capabilities',
          data: { id, ...meta },
          updated_at: new Date().toISOString()
        });
      });
    });

    const operations = Array.from(this.operations.values()).map(op => ({
      id: `operation_${op.id}`,
      context: 'system_operations',
      data: { id: op.id, name: op.name, metadata: op.metadata },
      updated_at: new Date().toISOString()
    }));

    return [...blocks, ...capabilities, ...operations];
  }
}

export const registry = AgnosticRegistry.getInstance();
