/**
 * activity-log.ts — Server-side only.
 * Appends structured events to .agno-log.jsonl in the project root.
 * Rotates at MAX_ENTRIES to avoid unbounded growth.
 * Never throws — log failures are silent so they never break writes.
 */

import fs   from 'fs/promises';
import path from 'path';

const LOG_FILE   = path.join(process.cwd(), '.agno-log.jsonl');
const MAX_ENTRIES = 500;

export interface LogEntry {
  ts:      string;
  src:     'vault' | 'agno';
  action:  string;          // WRITE | REMOVE | add-block | patch-blocks | …
  ns:      string;          // namespace / context
  id?:     string;          // record id when available
  summary: string;          // human-readable one-liner
}

export async function appendLog(entry: Omit<LogEntry, 'ts'>): Promise<void> {
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';

    // Read existing lines, rotate if needed, append
    let existing = '';
    try { existing = await fs.readFile(LOG_FILE, 'utf-8'); } catch { /* first write */ }

    const lines = existing.split('\n').filter(Boolean);
    if (lines.length >= MAX_ENTRIES) {
      lines.splice(0, lines.length - MAX_ENTRIES + 1);
    }
    lines.push(line.trimEnd());

    await fs.writeFile(LOG_FILE, lines.join('\n') + '\n', 'utf-8');
  } catch {
    // Silent — log must never break the primary operation
  }
}

export async function readLog(limit = 50): Promise<LogEntry[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf-8');
    const lines = raw.split('\n').filter(Boolean);
    return lines
      .slice(-limit)
      .reverse()
      .map(l => JSON.parse(l) as LogEntry);
  } catch {
    return [];
  }
}
