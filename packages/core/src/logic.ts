/**
 * 🧠 CANONICAL AGNOSTIC LOGIC ENGINE (v3.0)
 * ============================================
 * 
 * ROLE: The unified "Computation Brain" of the system.
 * PRINCIPLE: Pure functional derivation + Isolated dynamic functors (Zaps).
 * AGNOSTICISM: Does not know business rules, only mathematical and logical operators.
 * 
 * 🛡️ AXIOMATIC CONTRACT:
 * - MUST: Execute scripts in isolated sandboxes (new Function).
 * - MUST: Fallback to safe values on execution failures.
 * - NEVER: Contaminate core operations with hardcoded business conditions.
 */

import { DataItem } from './indra';

export type OperatorType = 
  | 'MULTIPLY' 
  | 'SUM' 
  | 'SUBTRACT' 
  | 'DIVIDE' 
  | 'AGGREGATE' 
  | 'PERCENTAGE'
  | 'SLUGIFY'
  | 'LOOKUP';

export interface LogicOperation {
  op: OperatorType;
  args: string[]; // Keys of fields to use as arguments
  context?: string; // Used for AGGREGATE (which context to sum)
  foreignKey?: string; // Used for AGGREGATE (how to link to parent)
}

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
    if (depth > 5) {
      console.error("[LogicEngine] Circular dependency detected or depth limit exceeded.");
      return data;
    }

    if (!schema || !schema.fields || !data) return data;
    
    const result = { ...data };
    let hasChanges = false;

    schema.fields.forEach((field: any) => {
      const derivation = field.config?.derivation as LogicOperation | undefined;
      if (derivation) {
        const { op, args, context: childContext, foreignKey } = derivation;
        let newValue: number | string | undefined;

        switch (op) {
          case 'MULTIPLY': {
            const values = args.map(key => Number(result[key] || 0));
            newValue = values.reduce((acc, val) => acc * val, 1);
            break;
          }

          case 'SUM': {
            const values = args.map(key => Number(result[key] || 0));
            newValue = values.reduce((acc, val) => acc + val, 0);
            break;
          }

          case 'SUBTRACT': {
            const values = args.map(key => Number(result[key] || 0));
            newValue = values[0] - (values[1] || 0);
            break;
          }

          case 'DIVIDE': {
            const values = args.map(key => Number(result[key] || 0));
            newValue = values[1] !== 0 ? values[0] / values[1] : 0;
            break;
          }

          case 'PERCENTAGE': {
            const values = args.map(key => Number(result[key] || 0));
            newValue = (values[0] * values[1]) / 100;
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

          case 'LOOKUP': {
            const [relationKey, targetField] = args;
            const targetEntity = derivation.context || (derivation as any).entity;
            const relationId = result[relationKey];
            if (fullMateria && targetEntity && relationId) {
              const relatedList = fullMateria[targetEntity] || [];
              const relatedRecord = relatedList.find((r: any) => r.id === relationId);
              if (relatedRecord && relatedRecord.data) {
                newValue = relatedRecord.data[targetField] as string | number | undefined;
              }
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
   * 📥 HYDRATION: Carga lógica desde un blob de texto.
   */
  loadFromSource(source: string) {
    if (!source) return;

    try {
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
    }
  }
}

export const AgnosticLogicEngine = new LogicEngine();
