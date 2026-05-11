import type { DataItem, DataStrategy } from '@agnostic/core';

export class HybridStrategy implements DataStrategy {
  private local: DataStrategy;
  private remote: DataStrategy;
  private cloudContexts: string[];

  constructor(local: DataStrategy, remote: DataStrategy, cloudContexts: string[] = []) {
    this.local = local;
    this.remote = remote;
    this.cloudContexts = cloudContexts;
  }

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      if (!context) {
        const [localDb, remoteDb] = await Promise.all([
          this.local.read(),
          this.remote.read().catch(() => ({})),
        ]);
        const finalDb = { ...localDb };
        for (const cloudCtx of this.cloudContexts) {
          if (remoteDb[cloudCtx]) finalDb[cloudCtx] = remoteDb[cloudCtx];
        }
        return finalDb;
      }

      if (this.cloudContexts.includes(context)) {
        try {
          const cloudData = await this.remote.read(context);
          if (cloudData[context] && cloudData[context].length > 0) return cloudData;
        } catch (err) { /* fallback to local */ }
      }

      return await this.local.read(context);
    } catch (err) {
      return context ? { [context]: [] } : {};
    }
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    const localUpdates: Record<string, DataItem[]> = {};
    const remoteUpdates: Record<string, DataItem[]> = {};

    for (const [context, items] of Object.entries(fullDatabase)) {
      if (this.cloudContexts.includes(context)) {
        remoteUpdates[context] = items;
      } else {
        localUpdates[context] = items;
      }
    }

    const tasks: Promise<any>[] = [];
    if (Object.keys(localUpdates).length > 0) tasks.push(this.local.write(localUpdates));
    if (Object.keys(remoteUpdates).length > 0) tasks.push(this.remote.write(remoteUpdates));
    await Promise.all(tasks);
  }

  /**
   * 🏗️ OVERWRITE_CONTEXT:
   * Sincronización total de un contexto en la fuente de soberanía correspondiente.
   */
  async overwriteContext(context: string, items: DataItem[]): Promise<void> {
    const target = this.cloudContexts.includes(context) ? this.remote : this.local;
    
    // Si la estrategia destino tiene overwriteContext, lo usamos. 
    // Si no, caemos en write({ [context]: items }) que es el equivalente universal.
    if ((target as any).overwriteContext) {
      return await (target as any).overwriteContext(context, items);
    }
    return await target.write({ [context]: items });
  }

  async writeContext(context: string, items: DataItem[]): Promise<void> {
    const target = this.cloudContexts.includes(context) ? this.remote : this.local;
    if (target.writeContext) return await target.writeContext(context, items);
    return await target.write({ [context]: items });
  }

  async delete(context: string, id: string): Promise<void> {
    const target = this.cloudContexts.includes(context) ? this.remote : this.local;
    if (target.delete) return await target.delete(context, id);
    
    // Fallback delete: Read, filter, and overwrite
    const db = await target.read(context);
    const filtered = (db[context] || []).filter(i => i.id !== id);
    return await this.overwriteContext(context, filtered);
  }
}
