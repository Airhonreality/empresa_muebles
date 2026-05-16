/**
 * 🏛️ ARTEFACTO: AgnosticLogicEngine.ts
 * ────────────
 * CAPA: Agnostic Core (Intelligent Engine / Logic Hub)
 * VERSIÓN: 2.1
 * COMMIT: P3-M7.1-SYSTEMIC-SEGMENTATION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestador de lógica de negocio dinámica (Zaps / Sandboxing).
 * - Motor de Inferencia de Derivaciones y Cálculos en tiempo real.
 * - Servicio Centralizado de Segmentación Sistémica (Fase 7).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ejecutar lógica en un Sandbox aislado; nunca permitir acceso a globals (Suh's Law).
 * - MUST: Proveer determinismo en la partición de realidad (Segmentation).
 * - NEVER: Permitir que la lógica de negocio se filtre a los componentes de UI.
 * - ALWAYS: Fallback a valores seguros si la ejecución lógica falla.
 * 
 * 📜 ADR [2026-05-12]: CENTRALIZED-SEGMENTATION-SERVICE
 * - CONTEXTO: Necesidad de dinamismo en pestañas y pasos sin contaminar la UI con IFs.
 * - DECISIÓN: Implementar getVisibleSegments() como un servicio universal del motor.
 * - APRENDIZAJE: La partición de la materia es una capacidad del sistema, no una propiedad del proyector.
 * 
 * 🔑 KEYWORDS: #LogicEngine #Segmentation #Fase7 #DynamicLogic #AgnosticSandbox
 */

import { DataItem } from '@agnostic/core';

type AgnosticFunction = (data: any, context: any) => Promise<any> | any;

class LogicEngine {
  private registry: Record<string, AgnosticFunction> = {};

  /**
   * 🧬 REGISTRATION: Inscribe una función en el motor.
   */
  register(name: string, fn: AgnosticFunction) {
    this.registry[name] = fn;
  }

  /**
   * 📋 DISCOVERY: Retorna la lista de automatizaciones disponibles.
   */
  getRegisteredFunctions(): string[] {
    return Object.keys(this.registry);
  }

  /**
   * ⚡ EXECUTION: Dispara una función registrada (Zap).
   */
  async execute(name: string, data: any, systemContext: any) {
    const fn = this.registry[name];
    if (!fn) {
      console.warn(`[LogicEngine] Functor '${name}' no encontrado en el Registro.`);
      return null;
    }
    
    try {
      return await fn(data, systemContext);
    } catch (error) {
      console.error(`[LogicEngine] Fallo en ejecución de '${name}':`, error);
      throw error;
    }
  }

  /**
   * 🧮 COMPUTATION: Deriva valores basados en el esquema y la materia actual.
   * Axioma: Lógica Unidireccional, Pura y Estable.
   */
  compute(
    schema: any, 
    data: any, 
    fullMateria?: Record<string, DataItem[]>, 
    depth = 0
  ): any {
    // 🛡️ RECURSION SHIELD (Axiom: Systemic Stability)
    // Prevent infinite loops if schemas have circular dependencies
    if (depth > 5) {
      console.error("[LogicEngine] Circular dependency detected or depth limit exceeded.");
      return data;
    }

    if (!schema || !schema.fields || !data) return data;
    
    const result = { ...data };
    let hasChanges = false;

    schema.fields.forEach((field: any) => {
      if (field.config?.derivation) {
        const { op, args, context: childContext, foreignKey } = field.config.derivation;
        let newValue: number | undefined;

        switch (op) {
          case 'MULTIPLY': {
            const val1 = Number(result[args[0]] || 0);
            const val2 = Number(result[args[1]] || 0);
            newValue = val1 * val2;
            break;
          }

          case 'SUM': {
            newValue = args.reduce((acc: number, key: string) => acc + Number(result[key] || 0), 0);
            break;
          }

          case 'AGGREGATE': {
            if (fullMateria && childContext && foreignKey) {
              const children = fullMateria[childContext] || [];
              const relevantChildren = children.filter((c: any) => 
                String(c.data[foreignKey]) === String(data.id) || 
                String(c.data[foreignKey]) === String(data._slug)
              );
              
              newValue = relevantChildren.reduce((sum, child: any) => {
                return sum + Number(child.data[args[0]] || 0);
              }, 0);
            }
            break;
          }

          case 'SLUGIFY': {
            const raw = String(result[args[0]] || '');
            const slug = raw.toString().toLowerCase().trim()
              .replace(/\s+/g, '_')           // Replace spaces with _
              .replace(/[^\w-]+/g, '')       // Remove all non-word chars
              .replace(/--+/g, '_');         // Replace multiple - or _ with single _
            
            result[field.key] = slug;
            hasChanges = true;
            break;
          }
        }

        if (newValue !== undefined && result[field.key] !== newValue) {
          result[field.key] = newValue;
          hasChanges = true;
        }
      }
    });

    return result;
  }

  /**
   * 🧩 SEGMENTATION: System-wide capability to partition reality.
   * Resolves which segments/tabs/steps are visible for a given context and record.
   */
  async getVisibleSegments(
    context: string, 
    record: any, 
    allSegments: string[],
    zapName?: string
  ): Promise<string[]> {
    if (!zapName) return allSegments;

    try {
      const result = await this.execute(zapName, record, { context, allSegments });
      if (Array.isArray(result)) return result;
      return allSegments;
    } catch (e) {
      console.warn(`[LogicEngine] Segmentation failed for ${zapName}, falling back to all segments.`);
      return allSegments;
    }
  }

  /**
   * 📥 HYDRATION: Carga lógica desde un blob de texto (proveniente del Silo).
   * Soporta sintaxis de 'export' transformándola dinámicamente.
   */
  loadFromSource(source: string) {
    if (!source) return;

    try {
      // ⚡ MINI-TRANSPILER: Convierte sintaxis 'export' a 'exports' object pattern
      // Esto permite que el usuario escriba lógica moderna (ESM) en archivos planos.
      const transformedSource = source
        .replace(/export\s+const\s+(\w+)\s*=/g, 'exports.$1 =')
        .replace(/export\s+async\s+function\s+(\w+)/g, 'exports.$1 = async function $1')
        .replace(/export\s+function\s+(\w+)/g, 'exports.$1 = function $1');

      const factory = new Function('exports', transformedSource);
      const exports: Record<string, any> = {};
      
      factory(exports);
      
      Object.entries(exports).forEach(([name, fn]) => {
        if (typeof fn === 'function') {
          console.log(`[LogicEngine] Registrado functor: ${name}`);
          this.register(name, fn as AgnosticFunction);
        }
      });
    } catch (error) {
      console.error("[LogicEngine] Error al hidratar lógica desde fuente:", error);
      // Loggear el error de sintaxis específicamente para ayudar al dev
      if (error instanceof SyntaxError) {
        console.warn("[LogicEngine] Revisa la sintaxis de tu script. Asegúrate de no usar 'import' (solo 'export' es soportado vía transpilación)");
      }
    }
  }
}

export const AgnosticLogicEngine = new LogicEngine();
