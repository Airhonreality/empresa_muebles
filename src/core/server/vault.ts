import fs from 'fs/promises';
import path from 'path';
import { DataItem } from '@/core/types';

/**
 * Server-Side Atomic Database Reader
 * Optimized for Next.js 15: Reads all entity files from the 'db/' directory 
 * to pre-populate the satellite with the full Materia context.
 */
export async function getVaultData(): Promise<Record<string, DataItem[]>> {
  try {
    const storagePath = process.env.STORAGE_PATH || 'storage/default';
    const dbDir = path.join(process.cwd(), storagePath, 'db');
    
    // Ensure the directory exists
    await fs.mkdir(dbDir, { recursive: true });

    const files = await fs.readdir(dbDir);
    const db: Record<string, DataItem[]> = {};
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const contextName = path.basename(file, '.json');
        const raw = await fs.readFile(path.join(dbDir, file), 'utf-8');
        db[contextName] = JSON.parse(raw);
      }
    }
    
    return db;
  } catch (error) {
    console.warn('[ServerDB] Error reading atomic collections:', error);
    return {};
  }
}
