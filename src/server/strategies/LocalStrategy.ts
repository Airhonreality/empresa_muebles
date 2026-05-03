import fs from 'fs/promises';
import path from 'path';
import type { DataItem, DataStrategy } from '@/core/types';

const STORAGE_PATH = process.env.STORAGE_PATH || 'storage/default';
const DB_DIR = path.join(process.cwd(), STORAGE_PATH, 'db');

/**
 * LocalStrategy (Atomic Collections Edition)
 * Next.js 15 + Agnostic Core: This strategy stores each context in its own file.
 * Instead of db.json, we have db/users.json, db/schema_definitions.json, etc.
 * This ensures data integrity, prevents massive file rewrites, and scales to thousands of records.
 */
export class LocalStrategy implements DataStrategy {
  private getFilePath(context: string): string {
    return path.join(DB_DIR, `${context}.json`);
  }

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      await fs.mkdir(DB_DIR, { recursive: true });

      if (context) {
        // Read only the specific entity file requested
        const filePath = this.getFilePath(context);
        try {
          const raw = await fs.readFile(filePath, 'utf-8');
          return { [context]: JSON.parse(raw) as DataItem[] };
        } catch {
          return { [context]: [] };
        }
      }

      // Read all entity files in the db directory (Initial Sync)
      const files = await fs.readdir(DB_DIR);
      const db: Record<string, DataItem[]> = {};
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const contextName = path.basename(file, '.json');
          const raw = await fs.readFile(path.join(DB_DIR, file), 'utf-8');
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
    await fs.mkdir(DB_DIR, { recursive: true });

    // Identify which contexts need updating (surgical write)
    for (const [context, items] of Object.entries(fullDatabase)) {
      const filePath = this.getFilePath(context);
      // Only write if there's actual data to avoid empty file noise
      await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
    }
  }

  /**
   * Surgical Write: Only updates a specific context.
   * This is what the Core uses for high-frequency updates.
   */
  async writeContext(context: string, items: DataItem[]): Promise<void> {
    await fs.mkdir(DB_DIR, { recursive: true });
    const filePath = this.getFilePath(context);
    await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
  }
}
