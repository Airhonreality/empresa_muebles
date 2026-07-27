import fs from 'fs/promises';
import path from 'path';

export type EnvAssignment = {
  key: string;
  value: string;
};

function escapeEnvValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function mergeEnvText(existingText: string, assignments: EnvAssignment[]): string {
  const lines = existingText ? existingText.split(/\r?\n/) : [];

  for (const { key, value } of assignments) {
    let found = false;
    const targetLine = `${key}="${escapeEnvValue(value)}"`;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match && match[1] === key) {
        lines[i] = targetLine;
        found = true;
        break;
      }
    }

    if (!found) {
      lines.push(targetLine);
    }
  }

  if (lines.length === 0) {
    return '';
  }

  return `${lines.join('\n')}\n`;
}

export async function writeEnvFile(filePath: string, assignments: EnvAssignment[]): Promise<void> {
  const existingText = await fs.readFile(filePath, 'utf8').catch((err: any) => {
    if (err?.code === 'ENOENT') return '';
    throw err;
  });
  const nextText = mergeEnvText(existingText, assignments);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, nextText, 'utf8');
}
