/**
 * 🏛️ ARTEFACTO: LocalStrategy.ts
 * ────────────
 * CAPA: Integrations / Adapters (Local Persistence Bridge)
 * VERSIÓN: 3.0 (Neutral Sovereignty)
 */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import type { DataItem, DataStrategy, SystemOperation } from '@agnostic/core';

export class LocalStrategy implements DataStrategy {
  private readonly dbDir: string;

  constructor(siloPath: string) {
    this.dbDir = path.isAbsolute(siloPath) 
      ? path.join(siloPath, 'db') 
      : path.join(process.cwd(), siloPath, 'db');
  }

  private getFilePath(context: string): string {
    return path.join(this.dbDir, `${context}.json`);
  }

  private sanitizeData(context: string, data: any): DataItem[] {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data[context] && Array.isArray(data[context])) {
        return data[context];
      }
    }
    return Array.isArray(data) ? data : [];
  }

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      await fs.mkdir(this.dbDir, { recursive: true });

      if (context) {
        // 🛡️ SOVEREIGNTY BRIDGE: Master Passport is ALWAYS in the neutral root
        if (context === 'system_config') {
          const rootPath = path.join(process.cwd(), 'storage', 'system_config.json');
          try {
            const raw = await fs.readFile(rootPath, 'utf-8');
            return { [context]: this.sanitizeData(context, JSON.parse(raw)) };
          } catch { return { [context]: [] }; }
        }

        // 🧬 DNA HERITAGE: Inject Core Definitions
        if (context === 'schema_definitions' || context === 'page_routes') {
           const coreItems = await this.readCoreDNA(context);
           const filePath = this.getFilePath(context);
           let localItems: DataItem[] = [];
           try {
             const raw = await fs.readFile(filePath, 'utf-8');
             localItems = this.sanitizeData(context, JSON.parse(raw));
           } catch {}
           
           const itemMap = new Map(coreItems.map(i => [i.id, i]));
           localItems.forEach(i => itemMap.set(i.id, i));
           return { [context]: Array.from(itemMap.values()) };
        }

        const filePath = this.getFilePath(context);
        try {
          const raw = await fs.readFile(filePath, 'utf-8');
          return { [context]: this.sanitizeData(context, JSON.parse(raw)) };
        } catch { return { [context]: [] }; }
      }

      // Full Directory Read
      const files = await fs.readdir(this.dbDir);
      const db: Record<string, DataItem[]> = {};
      for (const file of files) {
        if (file.endsWith('.json')) {
          const contextName = path.basename(file, '.json');
          const raw = await fs.readFile(path.join(this.dbDir, file), 'utf-8');
          db[contextName] = this.sanitizeData(contextName, JSON.parse(raw));
        }
      }
      return db;
    } catch (err) {
      return {};
    }
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    for (const [context, items] of Object.entries(fullDatabase)) {
      // 🛡️ SOVEREIGNTY BRIDGE: Master Passport writes to Neutral Root
      const masterPassport = items.find(i => i.id === 'master_passport' && context === 'system_config');
      
      if (masterPassport) {
        const rootPath = path.join(process.cwd(), 'storage', 'system_config.json');
        
        // 🧬 SOVEREIGNTY MIGRATION: Auto-rename silo folder
        let oldPassport: any = null;
        try {
          if (fsSync.existsSync(rootPath)) {
            const raw = await fs.readFile(rootPath, 'utf-8');
            const parsed = JSON.parse(raw);
            oldPassport = Array.isArray(parsed) ? parsed.find(i => i.id === 'master_passport')?.data : parsed;
          }
        } catch (e) {}

        const newPassport = (masterPassport as any).data;
        const oldIdentity = oldPassport?.project_identity;
        const newIdentity = newPassport?.project_identity;

        if (oldIdentity && newIdentity && oldIdentity !== newIdentity) {
          const storageRoot = path.join(process.cwd(), 'storage');
          const oldSiloPath = path.join(storageRoot, oldIdentity);
          const newSiloPath = path.join(storageRoot, newIdentity);

          if (fsSync.existsSync(oldSiloPath) && !fsSync.existsSync(newSiloPath)) {
            console.log(`[SovereigntyMigration] RENAMING SILO: ${oldIdentity} -> ${newIdentity}`);
            await fs.rename(oldSiloPath, newSiloPath);
          }
        }

        await fs.writeFile(rootPath, JSON.stringify(items, null, 2), 'utf-8');
        
        // Invalidate cache to force re-instantiation of the engine with the new identity
        const { invalidateStrategyCache } = require('../getStrategy');
        invalidateStrategyCache();
        continue; 
      }

      const filePath = this.getFilePath(context);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
    }
  }

  private async readCoreDNA(context: string): Promise<DataItem[]> {
    const coreDnaPath = path.join(process.cwd(), 'src', 'core', 'designer', 'dna');
    const items: DataItem[] = [];
    if (!fsSync.existsSync(coreDnaPath)) return [];
    
    const files = await fs.readdir(coreDnaPath);
    const extension = context === 'schema_definitions' ? '.schema.json' : '.route.json';
    
    for (const file of files) {
      if (file.endsWith(extension)) {
        const raw = await fs.readFile(path.join(coreDnaPath, file), 'utf-8');
        const data = JSON.parse(raw);
        items.push({ id: data.id || `core_${path.basename(file, extension)}`, context, data });
      }
    }
    return items;
  }

  async overwriteContext(context: string, items: DataItem[]): Promise<void> {
    // 🛡️ SOVEREIGNTY BRIDGE: Master Passport writes to Neutral Root
    const masterPassport = items.find(i => i.id === 'master_passport' && context === 'system_config');
    
    if (masterPassport) {
      const rootPath = path.join(process.cwd(), 'storage', 'system_config.json');
      await fs.writeFile(rootPath, JSON.stringify(items, null, 2), 'utf-8');
      
      // Invalidate cache to force re-instantiation
      try {
        const { invalidateStrategyCache } = require('../getStrategy');
        invalidateStrategyCache();
      } catch (e) {}
      return;
    }

    const filePath = this.getFilePath(context);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
  }

  async writeContext(context: string, items: DataItem[]): Promise<void> {
    const db = await this.read(context);
    const existingItems = db[context] || [];
    const itemMap = new Map(existingItems.map(item => [item.id, item]));
    items.forEach(item => itemMap.set(item.id, item));
    await this.overwriteContext(context, Array.from(itemMap.values()));
  }

  async delete(context: string, id: string): Promise<void> {
    const db = await this.read(context);
    const filtered = (db[context] || []).filter(item => item.id !== id);
    await this.overwriteContext(context, filtered);
  }

  getOperations(): SystemOperation[] {
    return [{ id: 'local_migration', label: 'Alinear Silo Local', action: 'UPDATE', scope: 'MATERIA' }];
  }
}
