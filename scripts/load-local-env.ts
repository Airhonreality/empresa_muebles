import fs from 'fs';
import path from 'path';

function parseEnvFile(raw: string): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = rawLine.indexOf('=');
    if (eqIndex === -1) continue;

    const key = rawLine.slice(0, eqIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = rawLine.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

export function loadLocalEnvFiles(options: { cwd?: string; files?: string[] } = {}): string[] {
  const cwd = options.cwd ?? process.env.INIT_CWD ?? process.cwd();
  const files = options.files ?? ['.env.vercel.local', '.env.local'];
  const loaded: string[] = [];
  const lockedKeys = new Set(Object.keys(process.env));

  for (const file of files) {
    const filePath = path.join(cwd, file);
    if (!fs.existsSync(filePath)) continue;

    const parsed = parseEnvFile(fs.readFileSync(filePath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (!lockedKeys.has(key)) {
        process.env[key] = value;
      }
    }
    loaded.push(file);
  }

  return loaded;
}
