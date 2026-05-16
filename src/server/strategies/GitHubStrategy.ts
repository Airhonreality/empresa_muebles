import type { DataItem, DataStrategy } from '@agnostic/core';

/**
 * 🏛️ GitHubStrategy v3.0 (Deterministic)
 * Supports dynamic repo targeting via Master Passport.
 */
export class GitHubStrategy implements DataStrategy {
  private readonly token = process.env.GITHUB_TOKEN;
  private readonly branch = process.env.GITHUB_BRANCH ?? 'main';

  constructor(
    private readonly owner: string,
    private readonly repo: string
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

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      if (!this.owner || !this.repo) return {};

      // Structure: storage/[identity]/db/[context].json translates to [repo]/db/[context].json
      const path = context ? `db/${context}.json` : 'db';
      const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
      
      const res = await fetch(`${apiUrl}?ref=${this.branch}`, {
        headers: this.headers,
        cache: 'no-store',
      });

      if (!res.ok) {
         console.warn(`[GitHubStrategy] Resource not found at ${path} (${res.statusText})`);
         return {};
      }

      const fileData = await res.json();

      // CASE: Single file read
      if (context) {
        const content = Buffer.from((fileData as any).content, 'base64').toString('utf-8');
        const parsed = JSON.parse(content);
        return { [context]: Array.isArray(parsed) ? parsed : (parsed[context] || []) };
      }

      // CASE: Directory scan (Full fetch)
      const fullDb: Record<string, DataItem[]> = {};
      const files = fileData as any[];
      
      for (const file of files) {
        if (file.name.endsWith('.json')) {
           const entityName = file.name.replace('.json', '');
           const fileContentRes = await fetch(file.download_url, { cache: 'no-store' });
           if (fileContentRes.ok) {
             const raw = await fileContentRes.json();
             fullDb[entityName] = Array.isArray(raw) ? raw : (raw[entityName] || []);
           }
        }
      }

      return fullDb;
    } catch (err) {
      console.error('[GitHubStrategy] Read Error:', err);
      return {};
    }
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    if (!this.token || !this.owner || !this.repo) {
       console.error('[GitHubStrategy] CANNOT WRITE: Missing credentials or repo config.');
       return;
    }

    for (const [context, items] of Object.entries(fullDatabase)) {
      const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/db/${context}.json`;
      
      // 1. Get current SHA to allow update
      const getRes = await fetch(`${apiUrl}?ref=${this.branch}`, { headers: this.headers, cache: 'no-store' });
      const existing = getRes.ok ? (await getRes.json() as { sha?: string }) : null;

      const payload = { [context]: items };
      const encoded = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
      
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          message: `[agnostic] ${context} synchronized`,
          content: encoded,
          sha: existing?.sha,
          branch: this.branch,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error(`[GitHubStrategy] Write failed for ${context}:`, error.message);
      } else {
        console.log(`[GitHubStrategy] Successfully committed ${context} to GitHub.`);
      }
    }
  }
}
