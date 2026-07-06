import fs from 'fs/promises';
import path from 'path';

export type JsonRecord = {
  id?: string;
  context?: string;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
};

export class StorageRepository {
  readonly rootDir: string;
  readonly dbDir: string;

  constructor(rootDir = process.env.INIT_CWD || process.cwd()) {
    this.rootDir = rootDir;
    this.dbDir = path.join(rootDir, 'storage', 'db');
  }

  resolve(...segments: string[]): string {
    return path.join(this.rootDir, ...segments);
  }

  dbPath(fileName: string): string {
    return path.join(this.dbDir, fileName);
  }

  relative(filePath: string): string {
    return path.relative(this.rootDir, filePath).replace(/\\/g, '/');
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readJsonArray(fileName: string): Promise<JsonRecord[]> {
    const filePath = this.dbPath(fileName);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err: any) {
      if (err?.code === 'ENOENT') return [];
      throw new Error(`No se pudo leer ${fileName}: ${err.message}`);
    }
  }

  async writeJsonArray(fileName: string, records: JsonRecord[]): Promise<void> {
    await fs.mkdir(this.dbDir, { recursive: true });
    await fs.writeFile(this.dbPath(fileName), JSON.stringify(records, null, 2) + '\n', 'utf8');
  }

  async listDbJsonFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dbDir);
      return files.filter(file => file.endsWith('.json')).sort();
    } catch (err: any) {
      if (err?.code === 'ENOENT') return [];
      throw err;
    }
  }

  async renameDbFile(oldName: string, newName: string): Promise<boolean> {
    const oldPath = this.dbPath(`${oldName}.json`);
    const newPath = this.dbPath(`${newName}.json`);
    if (!await this.exists(oldPath)) return false;
    if (await this.exists(newPath)) {
      throw new Error(`No se puede renombrar: storage/db/${newName}.json ya existe`);
    }
    await fs.rename(oldPath, newPath);
    return true;
  }

  async createBackup(files: string[], label: string): Promise<string | null> {
    const existingFiles: string[] = [];
    for (const file of files) {
      if (await this.exists(this.resolve(file))) existingFiles.push(file);
    }
    if (!existingFiles.length) return null;

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
    const backupDir = this.resolve('storage', 'progreso', 'backups', `${stamp}-${safeLabel}`);
    await fs.mkdir(backupDir, { recursive: true });

    for (const file of existingFiles) {
      const source = this.resolve(file);
      const target = path.join(backupDir, file);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(source, target);
    }

    return this.relative(backupDir);
  }
}

export const storageRepository = new StorageRepository();
