import type { DataItem, DataStrategy } from '@/core/types';

/**
 * GitHubStrategy v2.0
 * Supports multi-file silos and directory-based data fetching.
 */
export class GitHubStrategy implements DataStrategy {
  private readonly token = process.env.GITHUB_TOKEN!;
  private readonly owner = process.env.GITHUB_OWNER!;
  private readonly repo = process.env.GITHUB_REPO!;
  private readonly branch = process.env.GITHUB_BRANCH ?? 'main';

  private get headers(): HeadersInit {
    return {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      // In NOMON, we assume 'db/' is the folder for entities
      const path = context ? `db/${context}.json` : 'db';
      const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
      
      const res = await fetch(`${apiUrl}?ref=${this.branch}`, {
        headers: this.headers,
        cache: 'no-store',
      });

      if (!res.ok) {
         console.warn(`[GitHubStrategy] Failed to fetch ${path}: ${res.statusText}`);
         return {};
      }

      const fileData = await res.json();

      // If we requested a specific file (context)
      if (context) {
        const content = Buffer.from((fileData as any).content, 'base64').toString('utf-8');
        return { [context]: JSON.parse(content) };
      }

      // If we requested the whole directory (initial boot)
      const fullDb: Record<string, DataItem[]> = {};
      const files = fileData as any[];
      
      for (const file of files) {
        if (file.name.endsWith('.json')) {
           const entityName = file.name.replace('.json', '');
           const fileContentRes = await fetch(file.download_url, { cache: 'no-store' });
           if (fileContentRes.ok) {
             fullDb[entityName] = await fileContentRes.json();
           }
        }
      }

      return fullDb;
    } catch (err) {
      console.error('[GitHubStrategy] Read Error:', err);
      return {};
    }
  }

  /**
   * readConfig: Fetches a specific configuration file from the DNA
   */
  async readConfig(fileName: string): Promise<any> {
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${fileName}`;
    const res = await fetch(`${apiUrl}?ref=${this.branch}`, {
      headers: this.headers,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const file = await res.json() as { content: string };
    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    return JSON.parse(content);
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    // Note: Writing to GitHub is intentionaly slow for DNA/Config changes.
    // For transactional data, SupabaseStrategy is recommended.
    for (const [context, items] of Object.entries(fullDatabase)) {
      const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/db/${context}.json`;
      
      // Get SHA to update
      const getRes = await fetch(`${apiUrl}?ref=${this.branch}`, { headers: this.headers, cache: 'no-store' });
      const existing = getRes.ok ? (await getRes.json() as { sha?: string }) : null;

      const encoded = Buffer.from(JSON.stringify(items, null, 2)).toString('base64');
      
      await fetch(apiUrl, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          message: `[nomon] ${context} update`,
          content: encoded,
          sha: existing?.sha,
          branch: this.branch,
        }),
      });
    }
  }
}
