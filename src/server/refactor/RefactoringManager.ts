import { getStrategy } from '@/server/getStrategy';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { triggerSchemaCompile } from '@/lib/agnostic/schema-compiler-trigger';
import { appendLog } from '@/lib/agnostic/activity-log';

/**
 * 🔄 Agnostic Schema Refactorer
 * =============================
 * Central coordinator for executing data migrations and maintaining referential 
 * integrity when schemas evolve (renames/deletions).
 * 
 * - Axiomatic Design: Adapters remain dumb. Manager handles the complexity.
 * - Graceful Degradation: If an adapter implements optimized SQL JSONB methods, 
 *   they are used. Otherwise, it falls back to universal read/write iteration.
 */
export class RefactoringManager {
  
  /**
   * Renames an entire collection namespace, and cascades the relation 
   * pointers in all other schemas and page routes.
   */
  static async renameCollection(fromNs: string, toNs: string): Promise<void> {
    const strategy = getStrategy();
    
    // 1. Data Migration
    if (typeof strategy.renameCollection === 'function') {
      await strategy.renameCollection(fromNs, toNs);
    } else {
      // Fallback: Read all, Rewrite to new namespace, Delete from old
      const records = await strategy.read(fromNs);
      for (const r of records) {
        await strategy.write(toNs, { id: r.id, context: toNs, data: r.data });
        await strategy.remove(fromNs, r.id);
      }
    }

    // 2. Cascade schema relations
    await this.cascadeRelationUpdates(fromNs, toNs);
    
    // 3. Cascade page routes
    await this.cascadeRouteContextUpdates(fromNs, toNs);

    appendLog({ src: 'refactor', action: 'RENAME', ns: fromNs, summary: `Collection renamed to ${toNs}` });
    triggerSchemaCompile();
  }

  /**
   * Renames a field key within a collection, preserving data, 
   * and cascades the field binding in page routes.
   */
  static async renameField(namespace: string, oldKey: string, newKey: string): Promise<void> {
    const strategy = getStrategy();
    
    // 1. Data Migration
    if (typeof strategy.renameField === 'function') {
      await strategy.renameField(namespace, oldKey, newKey);
    } else {
      // Fallback: Read all, mutate JSON in memory, write back
      const records = await strategy.read(namespace);
      for (const r of records) {
        if (r.data && r.data[oldKey] !== undefined) {
          const val = r.data[oldKey];
          const newData = { ...r.data, [newKey]: val };
          delete newData[oldKey];
          await strategy.write(namespace, { id: r.id, data: newData });
        }
      }
    }

    // 2. Cascade page routes field mappings
    await this.cascadeFieldUpdates(namespace, oldKey, newKey);

    appendLog({ src: 'refactor', action: 'UPDATE', ns: namespace, summary: `Field ${oldKey} renamed to ${newKey}` });
    triggerSchemaCompile();
  }

  /**
   * Deletes a field from all historical records in a collection to clean up space.
   */
  static async deleteField(namespace: string, key: string): Promise<void> {
    const strategy = getStrategy();
    
    if (typeof strategy.deleteField === 'function') {
      await strategy.deleteField(namespace, key);
    } else {
      const records = await strategy.read(namespace);
      for (const r of records) {
        if (r.data && r.data[key] !== undefined) {
          const newData = { ...r.data };
          delete newData[key];
          await strategy.write(namespace, { id: r.id, data: newData });
        }
      }
    }

    appendLog({ src: 'refactor', action: 'DELETE', ns: namespace, summary: `Field ${key} dropped` });
    triggerSchemaCompile();
  }

  // ─── CASCADE HELPERS ───────────────────────────────────────────────────────

  /** Updates 'relation.entity' values across all schemas if they point to the old namespace */
  private static async cascadeRelationUpdates(fromNs: string, toNs: string): Promise<void> {
    const strategy = getStrategy();
    const schemas = await strategy.read(SYSTEM_NS.SCHEMAS);
    
    for (const schema of schemas) {
      let changed = false;
      const fields = schema.data.fields as any[] || [];
      
      const walkFields = (flist: any[]) => {
        for (const f of flist) {
          if (f.type === 'relation' && f.config?.relation?.entity === fromNs) {
            f.config.relation.entity = toNs;
            changed = true;
          }
          if (f.fields && Array.isArray(f.fields)) {
            walkFields(f.fields);
          }
        }
      };
      
      walkFields(fields);

      if (changed) {
        await strategy.write(SYSTEM_NS.SCHEMAS, { id: schema.id, data: schema.data });
      }
    }
  }

  /** Updates active 'contexts' in page blocks if a collection is renamed */
  private static async cascadeRouteContextUpdates(fromNs: string, toNs: string): Promise<void> {
    const strategy = getStrategy();
    const routes = await strategy.read(SYSTEM_NS.ROUTES);
    
    for (const route of routes) {
      let changed = false;
      
      const fixContexts = (node: any) => {
        if (node.contexts && Array.isArray(node.contexts) && node.contexts.includes(fromNs)) {
          node.contexts = node.contexts.map((c: string) => c === fromNs ? toNs : c);
          changed = true;
        }
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(fixContexts);
        }
      };
      
      if (route.data) fixContexts(route.data);
      if (changed) {
        await strategy.write(SYSTEM_NS.ROUTES, { id: route.id, data: route.data });
      }
    }
  }

  /** Updates 'field_key' in UI atoms if a schema field was renamed */
  private static async cascadeFieldUpdates(namespace: string, oldKey: string, newKey: string): Promise<void> {
    const strategy = getStrategy();
    const routes = await strategy.read(SYSTEM_NS.ROUTES);
    
    for (const route of routes) {
      let changed = false;
      
      const fixFields = (node: any) => {
        if (node.contexts && Array.isArray(node.contexts) && node.contexts.includes(namespace)) {
          if (node.field_key === oldKey) {
            node.field_key = newKey;
            changed = true;
          }
        }
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(fixFields);
        }
      };
      
      if (route.data) fixFields(route.data);
      if (changed) {
        await strategy.write(SYSTEM_NS.ROUTES, { id: route.id, data: route.data });
      }
    }
  }
}
