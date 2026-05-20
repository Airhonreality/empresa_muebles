/**
 * 🏛️ ARTEFACTO: GitHubStrategy.ts
 * ────────────
 * CAPA: Server (GitHub Git Persistence Strategy)
 * VERSIÓN: 5.0
 * COMMIT: P3-M1.3-GITHUB-STRATEGY-AXIOMATIC
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Implement standard data persistence utilizing JSON files hosted on a GitHub Repository.
 * - Restrict operations strictly to read, write, and remove using GitHub Contents API.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Implement standard read, write, and remove operations securely.
 * - NEVER: Contain any DDL schema creation logic or auto-registration.
 * - ALWAYS: Keep operations consistent with read-modify-write cycles to simulate atomic writes over Git.
 * 
 * 📜 ADR: [2026-05-16] GIT_STRATEGY_PRUNING
 * - DECISIÓN: Align the Git backend with the simplified 3-method Adapter contract, purging old patch, evolve, wipe, inspect verbs.
 * - MOTIVO: Adherence to Suh's Independence Axiom, eliminating dynamic DDL and complex transaction capabilities from a pure storage engine.
 * - IMPACTO: 100+ lines of code deleted, simplified API interface, and unified terminology.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [storage.ts]
 * - DOWNSTREAM: [getStrategy.ts]
 */

import type { 
  DataItem, 
  AgnosticBridge, 
  AgnosticCapabilities, 
  AgnosticQuery 
} from '@agnostic/core';

export class GitHubStrategy implements AgnosticBridge {
  private get token(): string | undefined {
    return this.customToken ?? process.env.GITHUB_TOKEN;
  }

  private get branch(): string {
    return this.customBranch ?? process.env.GITHUB_BRANCH ?? 'main';
  }

  /**
   * Describes the GitHub Git storage capabilities.
   */
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
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/db/${namespace}.json`;
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
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/db/${namespace}.json`;
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
      // Concurrency conflict (409 stale SHA) - auto-retry once with fresh SHA
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

  /**
   * Reads raw JSON files from the GitHub repository contents.
   */
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

  /**
   * Writes a record by retrieving the remote JSON array, updating it in memory, and committing back.
   */
  async write(namespace: string, record: Partial<DataItem> & { data: Record<string, unknown> }): Promise<DataItem> {
    if (!this.token || !this.owner || !this.repo) {
       throw new Error('GitHubStrategy requires GITHUB_TOKEN, owner, and repo to write');
    }

    const id = record.id || globalThis.crypto.randomUUID();
    const saved: DataItem = { 
      id, 
      context: namespace, 
      data: record.data, 
      updated_at: new Date().toISOString() 
    };

    const { items, sha } = await this.fetchFile(namespace);
    const map = new Map(items.map(i => [i.id, i]));
    map.set(id, saved);

    await this.putFile(namespace, Array.from(map.values()), sha);
    return saved;
  }

  /**
   * Removes a record by filtering it out from the remote JSON array and committing the updated array back.
   */
  async remove(namespace: string, id: string): Promise<void> {
    if (!this.token || !this.owner || !this.repo) {
       throw new Error('GitHubStrategy requires GITHUB_TOKEN, owner, and repo to remove');
    }

    const { items, sha } = await this.fetchFile(namespace);
    const filtered = items.filter(i => i.id !== id);

    await this.putFile(namespace, filtered, sha);
  }
}
