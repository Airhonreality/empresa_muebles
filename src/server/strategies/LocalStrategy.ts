/**
 * 🏛️ ARTEFACTO: LocalStrategy.ts
 * ────────────
 * CAPA: Server (Local File Persistence Strategy)
 * VERSIÓN: 6.0
 * COMMIT: P4-M1-FIELD-LWW-PULSE-HISTORY
 *
 * 🎯 FUNCTIONAL_SCOPE:
 * - Implement standard data persistence utilizing local JSON files.
 * - Field-Level LWW merge on write when _meta timestamps are present.
 * - mtime-based SHA fingerprint for change detection (pulse).
 * - Activity-log history per namespace.
 *
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Implement standard CRUD operation definitions cleanly.
 * - NEVER: Contain DDL schema evolution logic or registry auto-registration.
 * - ALWAYS: Keep operations atomic when writing to the filesystem.
 *
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [storage.ts, fieldMerge.ts]
 * - DOWNSTREAM: [getStrategy.ts]
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import type {
  DataItem,
  AgnosticBridge,
  AgnosticCapabilities,
  AgnosticQuery
} from '@agnostic/core';
import { mergeFieldLWW } from '@/lib/agnostic/fieldMerge';

export class LocalStrategy implements AgnosticBridge {
  private readonly dbDir: string;
  private readonly writeQueues = new Map<string, Promise<unknown>>();

  readonly capabilities: AgnosticCapabilities = {
    storageType: 'FILE',
    isRelational: false
  };

  constructor(siloPath: string) {
    this.dbDir = path.isAbsolute(siloPath)
      ? path.join(siloPath, 'db')
      : path.join(process.cwd(), siloPath, 'db');
  }

  private getFilePath(namespace: string): string {
    return path.join(this.dbDir, `${namespace}.json`);
  }

  private sanitizeData(namespace: string, data: any): DataItem[] {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data[namespace] && Array.isArray(data[namespace])) {
        return data[namespace];
      }
    }
    return Array.isArray(data) ? data : [];
  }

  // ─── CRUD OPERATIONS ───────────────────────────────────────────────────────

  async read(namespace: string, query?: AgnosticQuery): Promise<DataItem[]> {
    try {
      const filePath = this.getFilePath(namespace);
      try {
        const raw = (await fs.readFile(filePath, 'utf-8')).replace(/^﻿/, '');
        const items = this.sanitizeData(namespace, JSON.parse(raw));

        if (query?.where) {
          return items.filter(item => {
            return Object.entries(query.where!).every(([k, v]) => {
              return (k === 'id' && item.id === v) || item.data?.[k] === v || item[k] === v;
            });
          });
        }

        return items;
      } catch {
        return [];
      }
    } catch {
      return [];
    }
  }

  async write(namespace: string, record: Partial<DataItem> & { data: Record<string, unknown> }): Promise<DataItem> {
    const pending = this.writeQueues.get(namespace) ?? Promise.resolve();
    const next = pending.then(() => this._doWrite(namespace, record));
    this.writeQueues.set(namespace, next.catch(() => undefined));
    return next;
  }

  private async _doWrite(namespace: string, record: Partial<DataItem> & { data: Record<string, unknown> }): Promise<DataItem> {
    const existing = await this.read(namespace);
    const id = record.id || globalThis.crypto.randomUUID();
    const existingItem = existing.find(i => i.id === id);
    const patchMeta = (record as any)._meta as Record<string, string> | undefined;

    let saved: DataItem;
    if (existingItem && patchMeta) {
      // Field-Level LWW: merge only the fields present in the patch
      const { data, _meta } = mergeFieldLWW(existingItem, { data: record.data, _meta: patchMeta });
      saved = { ...existingItem, data, _meta, updated_at: new Date().toISOString() };
    } else {
      // Full replace — new record or legacy write without _meta
      saved = {
        id,
        context: namespace,
        data: record.data,
        ...(patchMeta ? { _meta: patchMeta } : {}),
        updated_at: new Date().toISOString(),
      };
    }

    const map = new Map(existing.map(i => [i.id, i]));
    map.set(id, saved);

    const filePath = this.getFilePath(namespace);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const content = JSON.stringify(Array.from(map.values()), null, 2);
    const tmp = filePath + '.tmp';
    await fs.writeFile(tmp, content, 'utf-8');
    try {
      await fs.rename(tmp, filePath);
    } catch {
      await fs.writeFile(filePath, content, 'utf-8');
      try { await fs.unlink(tmp); } catch { /* best-effort */ }
    }

    return saved;
  }

  async remove(namespace: string, id: string): Promise<void> {
    const existing = await this.read(namespace);
    const filtered = existing.filter(i => i.id !== id);

    const filePath = this.getFilePath(namespace);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
  }

  // ─── EXTENDED CAPABILITIES ────────────────────────────────────────────────

  /**
   * Returns an mtime+size fingerprint for a namespace file.
   * Changes when the file is written. Used by /api/pulse.
   */
  async getNamespaceSha(namespace: string): Promise<string | null> {
    try {
      const filePath = this.getFilePath(namespace);
      const stat = await fs.stat(filePath);
      return `${stat.mtimeMs}-${stat.size}`;
    } catch {
      return null;
    }
  }

  /**
   * Returns recent write events for a namespace from the activity log.
   * Used by /api/history. Returns empty array on environments without fs access.
   */
  async getHistory(namespace: string, limit = 20): Promise<any[]> {
    try {
      const { readLog } = await import('@/lib/agnostic/activity-log');
      const all = await readLog(limit * 5);
      return all
        .filter(e => e.ns === namespace && e.action === 'WRITE')
        .slice(0, limit)
        .map(e => ({
          sha: e.id ?? '',
          message: `[agnostic] vault: ${e.ns}`,
          author: 'local',
          email: '',
          timestamp: e.ts,
          url: '',
          summary: e.summary,
        }));
    } catch {
      return [];
    }
  }
}
