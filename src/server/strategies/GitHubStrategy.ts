/**
 * 🏛️ ARTEFACTO: GitHubStrategy.ts
 * ────────────
 * CAPA: Server (GitHub Git Persistence Strategy)
 * VERSIÓN: 6.0
 * COMMIT: P4-M1-FIELD-LWW-PULSE-HISTORY
 *
 * 🎯 FUNCTIONAL_SCOPE:
 * - Implement standard data persistence utilizing JSON files hosted on a GitHub Repository.
 * - Field-Level LWW merge on write when _meta timestamps are present.
 * - Lightweight SHA pulse for change detection without full content decode.
 * - Commit-log history per namespace via GitHub Commits API.
 *
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Implement standard read, write, and remove operations securely.
 * - NEVER: Contain any DDL schema creation logic or auto-registration.
 * - ALWAYS: Keep operations consistent with read-modify-write cycles to simulate atomic writes over Git.
 *
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [storage.ts, fieldMerge.ts]
 * - DOWNSTREAM: [getStrategy.ts]
 */

import type {
  DataItem,
  AgnosticBridge,
  AgnosticCapabilities,
  AgnosticQuery
} from '@agnostic/core';
import { mergeFieldLWW } from '@/lib/agnostic/fieldMerge';

export interface HistoryEntry {
  sha: string;
  message: string;
  author: string;
  email: string;
  timestamp: string;
  url: string;
}

export class GitHubStrategy implements AgnosticBridge {
  private get token(): string | undefined {
    return this.customToken ?? process.env.GITHUB_TOKEN;
  }

  private get branch(): string {
    return this.customBranch ?? process.env.GITHUB_BRANCH ?? 'main';
  }

  readonly capabilities: AgnosticCapabilities = {
    storageType: 'GIT',
    isRelational: false
  };

  constructor(
    private readonly owner: string,
    private readonly repo: string,
    private readonly customToken?: string,
    private readonly customBranch?: string
  ) {
    if (!this.token) {
      console.warn('[GitHubStrategy] WARNING: GITHUB_TOKEN not found in environment.');
    }
  }

  private get headers(): HeadersInit {
    return {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  private async fetchFile(namespace: string): Promise<{ items: DataItem[]; sha: string | undefined }> {
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/storage/db/${namespace}.json`;
    const res = await fetch(`${apiUrl}?ref=${this.branch}`, {
      headers: this.headers,
      cache: 'no-store',
    });
    if (!res.ok) return { items: [], sha: undefined };
    const file = await res.json() as { content: string; sha: string };
    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    const parsed = JSON.parse(content);
    const items = Array.isArray(parsed) ? parsed : (parsed[namespace] || []);
    return { items, sha: file.sha };
  }

  private async putFile(namespace: string, items: DataItem[], sha: string | undefined, attempt = 1): Promise<void> {
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/storage/db/${namespace}.json`;
    const encoded = Buffer.from(JSON.stringify(items, null, 2)).toString('base64');
    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({
        message: `[agnostic] vault: ${namespace}`,
        content: encoded,
        sha,
        branch: this.branch,
      }),
    });
    if (res.status === 409 && attempt === 1) {
      const fresh = await this.fetchFile(namespace);
      await this.putFile(namespace, items, fresh.sha, 2);
      return;
    }
    if (!res.ok) {
      const error = await res.json();
      throw new Error(`[GitHubStrategy] PUT failed for ${namespace}: ${error.message}`);
    }
  }

  // ─── CRUD OPERATIONS ───────────────────────────────────────────────────────

  async read(namespace: string, query?: AgnosticQuery): Promise<DataItem[]> {
    try {
      if (!this.owner || !this.repo) return [];
      const { items } = await this.fetchFile(namespace);
      if (query?.where) {
        return items.filter((i: any) => {
          return Object.entries(query.where!).every(([k, v]) => {
            return (k === 'id' && i.id === v) || i.data?.[k] === v || i[k] === v;
          });
        });
      }
      return items;
    } catch (err) {
      console.error('[GitHubStrategy] Read Error:', err);
      return [];
    }
  }

  async write(namespace: string, record: Partial<DataItem> & { data: Record<string, unknown> }): Promise<DataItem> {
    if (!this.token || !this.owner || !this.repo) {
      throw new Error('GitHubStrategy requires GITHUB_TOKEN, owner, and repo to write');
    }

    const id = record.id || globalThis.crypto.randomUUID();
    const { items, sha } = await this.fetchFile(namespace);
    const existing = items.find(i => i.id === id);
    const patchMeta = (record as any)._meta as Record<string, string> | undefined;

    let saved: DataItem;
    if (existing && patchMeta) {
      // Field-Level LWW: merge only the fields present in the patch
      const { data, _meta } = mergeFieldLWW(existing, { data: record.data, _meta: patchMeta });
      saved = { ...existing, data, _meta, updated_at: new Date().toISOString() };
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

    const map = new Map(items.map(i => [i.id, i]));
    map.set(id, saved);
    await this.putFile(namespace, Array.from(map.values()), sha);
    return saved;
  }

  async remove(namespace: string, id: string): Promise<void> {
    if (!this.token || !this.owner || !this.repo) {
      throw new Error('GitHubStrategy requires GITHUB_TOKEN, owner, and repo to remove');
    }

    const { items, sha } = await this.fetchFile(namespace);
    const filtered = items.filter(i => i.id !== id);
    await this.putFile(namespace, filtered, sha);
  }

  // ─── EXTENDED CAPABILITIES ────────────────────────────────────────────────

  /**
   * Returns the Git blob SHA of a namespace file without full content decode.
   * Used by /api/pulse for lightweight change detection.
   */
  async getNamespaceSha(namespace: string): Promise<string | null> {
    try {
      if (!this.owner || !this.repo) return null;
      const { sha } = await this.fetchFile(namespace);
      return sha ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Returns the commit history for a namespace file via GitHub Commits API.
   * Used by /api/history for version log.
   */
  async getHistory(namespace: string, limit = 20): Promise<HistoryEntry[]> {
    try {
      if (!this.token || !this.owner || !this.repo) return [];
      const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/commits?path=storage/db/${namespace}.json&per_page=${limit}&sha=${this.branch}`;
      const res = await fetch(apiUrl, { headers: this.headers, cache: 'no-store' });
      if (!res.ok) return [];
      const commits = await res.json() as any[];
      return commits.map(c => ({
        sha: c.sha as string,
        message: c.commit.message as string,
        author: c.commit.author.name as string,
        email: c.commit.author.email as string,
        timestamp: c.commit.author.date as string,
        url: c.html_url as string,
      }));
    } catch {
      return [];
    }
  }
}
