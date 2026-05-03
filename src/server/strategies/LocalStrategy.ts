import fs from 'fs/promises';
import path from 'path';
import type { DataItem, DataStrategy } from '@/core/types';

const DB_PATH = path.join(process.cwd(), 'data-silo', 'db.json');

export class LocalStrategy implements DataStrategy {
  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      const raw = await fs.readFile(DB_PATH, 'utf-8');
      const db = JSON.parse(raw) as Record<string, DataItem[]>;
      if (context) {
        return { [context]: db[context] ?? [] };
      }
      return db;
    } catch {
      return {};
    }
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    const dir = path.dirname(DB_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(fullDatabase, null, 2), 'utf-8');
  }
}
