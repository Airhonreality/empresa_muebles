/**
 * 🧠 AGNOSTIC LOGIC ENGINE (v1.0)
 * =====================================
 * 
 * ROLE: The "Computation Brain" of the system.
 * PRINCIPLE: Pure functional derivation. Data in -> Computed data out.
 * AGNOSTICISM: Does not know business rules, only mathematical operators.
 */

import { DataItem } from './indra';

export type OperatorType = 'MULTIPLY' | 'SUM' | 'SUBTRACT' | 'DIVIDE' | 'AGGREGATE' | 'PERCENTAGE';

export interface LogicOperation {
  op: OperatorType;
  args: string[]; // Keys of fields to use as arguments
  context?: string; // Used for AGGREGATE (which context to sum)
  foreignKey?: string; // Used for AGGREGATE (how to link to parent)
}

/**
 * THE INTERPRETER
 * Executes a declarative operation against a raw data item or the full state.
 */
export const AgnosticLogicEngine = {
  
  /**
   * Executes atomic arithmetic operations on a single record.
   * Example: MULTIPLY quantity * price
   */
  executeAtomic(op: OperatorType, args: string[], data: Record<string, any>): number {
    const values = args.map(key => Number(data[key] || 0));
    
    switch (op) {
      case 'MULTIPLY':  return values.reduce((acc, val) => acc * val, 1);
      case 'SUM':       return values.reduce((acc, val) => acc + val, 0);
      case 'SUBTRACT':  return values[0] - (values[1] || 0);
      case 'DIVIDE':    return values[1] !== 0 ? values[0] / values[1] : 0;
      case 'PERCENTAGE': return (values[0] * values[1]) / 100;
      default: return 0;
    }
  },

  /**
   * Executes aggregation across multiple records (Fractal Aggregation).
   * Example: SUM all item totals where projectId matches current project.
   */
  executeAggregate(
    contextItems: DataItem[], 
    targetField: string, 
    parentId: string, 
    foreignKey: string
  ): number {
    return contextItems
      .filter(item => item.data[foreignKey] === parentId)
      .reduce((acc, item) => acc + Number(item.data[targetField] || 0), 0);
  },

  /**
   * MASTER RESOLVER
   * The entry point for the Core to compute all "Derived Reality".
   */
  compute(schema: any, item: DataItem, fullData: Record<string, DataItem[]>): Record<string, any> {
    const computed: Record<string, any> = { ...item.data };
    
    // Look for fields marked as 'computed' or having a 'derivation' rule
    schema.fields?.forEach((field: any) => {
      const rule = field.config?.derivation as LogicOperation;
      if (!rule) return;

      if (rule.op === 'AGGREGATE') {
        const targetContext = rule.context || '';
        const contextItems = fullData[targetContext] || [];
        computed[field.key] = this.executeAggregate(
          contextItems, 
          rule.args[0], // The field to sum (e.g., 'total')
          item.id, 
          rule.foreignKey || `${item.context}_id`
        );
      } else {
        computed[field.key] = this.executeAtomic(rule.op, rule.args, computed);
      }
    });

    return computed;
  }
};
