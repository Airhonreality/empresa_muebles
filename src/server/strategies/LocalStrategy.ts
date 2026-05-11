import fs from 'fs/promises';
import path from 'path';
import type { DataItem, DataStrategy } from '@agnostic/core';

export class LocalStrategy implements DataStrategy {
  private readonly dbDir: string;

  constructor(siloPath: string) {
    // 🛡️ Use resolve to handle absolute paths correctly
    this.dbDir = path.isAbsolute(siloPath) 
      ? path.join(siloPath, 'db') 
      : path.join(process.cwd(), siloPath, 'db');
  }

  private getFilePath(context: string): string {
    return path.join(this.dbDir, `${context}.json`);
  }

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      await fs.mkdir(this.dbDir, { recursive: true });

      if (context) {
        const filePath = this.getFilePath(context);
        try {
          const raw = await fs.readFile(filePath, 'utf-8');
          return { [context]: JSON.parse(raw) as DataItem[] };
        } catch {
          return { [context]: [] };
        }
      }

      const files = await fs.readdir(this.dbDir);
      const db: Record<string, DataItem[]> = {};
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const contextName = path.basename(file, '.json');
          const raw = await fs.readFile(path.join(this.dbDir, file), 'utf-8');
          db[contextName] = JSON.parse(raw);
        }
      }
      return db;
    } catch (err) {
      console.error('[LocalStrategy] Read Error:', err);
      return {};
    }
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    await fs.mkdir(this.dbDir, { recursive: true });
    for (const [context, items] of Object.entries(fullDatabase)) {
      const filePath = this.getFilePath(context);
      await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
    }
  }

  /**
   * 🏗️ AXIOMATIC_OVERWRITE:
   * Cristaliza la verdad recibida eliminando cualquier rastro anterior en el contexto.
   */
  async overwriteContext(context: string, items: DataItem[]): Promise<void> {
    await fs.mkdir(this.dbDir, { recursive: true });
    const filePath = this.getFilePath(context);
    const tempPath = `${filePath}.tmp`;
    
    await fs.writeFile(tempPath, JSON.stringify(items, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  }

  /**
   * 📝 UPSERT_CONTEXT:
   * Mantiene la integridad de los registros existentes realizando una fusión por ID.
   */
  async writeContext(context: string, items: DataItem[]): Promise<void> {
    const db = await this.read(context);
    const existingItems = db[context] || [];

    const itemMap = new Map(existingItems.map(item => [item.id, item]));
    items.forEach(item => {
      itemMap.set(item.id, item);
    });

    await this.overwriteContext(context, Array.from(itemMap.values()));
  }

  async delete(context: string, id: string): Promise<void> {
    const db = await this.read(context);
    const items = db[context] || [];
    const filtered = items.filter(item => item.id !== id);
    await this.overwriteContext(context, filtered);
  }
}
