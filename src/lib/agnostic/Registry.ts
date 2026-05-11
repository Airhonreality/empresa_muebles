/**
 * 🏛️ ARTEFACTO: Registry.ts
 * ────────────
 * CAPA: Lib (Infrastructure Services)
 * VERSIÓN: 7.0
 * COMMIT: P2-M2.2-SPEC-7-GET
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Mediación central para el registro descentralizado de bloques (Core/Guest).
 * - Resolución de componentes durante la fase de proyección dinámica.
 * - Soporte para la extensibilidad infinita del motor (Satellite Synergy).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Operar como un Singleton para garantizar consistencia global.
 * - NEVER: Contener lógica de estado o de renderizado.
 * - NEVER: Depender de la implementación interna de los componentes registrados.
 * 
 * 📜 ADR: [2026-05-08] UNIFIED_COMPONENT_REGISTRY
 * - DECISIÓN: Implementar Registry como Singleton Isomórfico con acceso vía get().
 * - MOTIVO: Garantizar que tanto el servidor como el cliente compartan la misma tabla de bloques sin dependencias circulares.
 * - IMPACTO: Estabilidad total en la hidratación y desacoplamiento absoluto del motor.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [React (Types)]
 * - DOWNSTREAM: [AgnosticRenderer, Satellite Modules]
 */
import React from 'react';

type AgnosticBlockComponent = React.ComponentType<any>;

class AgnosticRegistry {
  private static instance: AgnosticRegistry;
  private blocks: Map<string, AgnosticBlockComponent> = new Map();

  private constructor() {}

  public static getInstance(): AgnosticRegistry {
    if (!AgnosticRegistry.instance) {
      AgnosticRegistry.instance = new AgnosticRegistry();
    }
    return AgnosticRegistry.instance;
  }

  /**
   * 🔗 Register a block type
   */
  public register(type: string, component: AgnosticBlockComponent) {
    this.blocks.set(type, component);
  }

  /**
   * 🔍 Get a block component
   */
  public get(type: string): AgnosticBlockComponent | null {
    return this.blocks.get(type) || null;
  }

  /**
   * 📜 List all registered types
   */
  public getRegisteredTypes(): string[] {
    return Array.from(this.blocks.keys());
  }
}

export const registry = AgnosticRegistry.getInstance();
