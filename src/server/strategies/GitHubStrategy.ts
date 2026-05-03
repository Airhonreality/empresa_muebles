import type { DataItem, DataStrategy } from '@/core/types';

export class GitHubStrategy implements DataStrategy {
  private readonly token = process.env.GITHUB_TOKEN!;
  private readonly owner = process.env.GITHUB_OWNER!;
  private readonly repo = process.env.GITHUB_REPO!;
  private readonly filePath = process.env.GITHUB_FILE_PATH ?? 'db.json';
  private readonly branch = process.env.GITHUB_BRANCH ?? 'main';

  private get apiUrl() {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.filePath}`;
  }

  private get headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    const res = await fetch(`${this.apiUrl}?ref=${this.branch}`, {
      headers: this.headers,
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const file = await res.json() as { content: string };
    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    const db = JSON.parse(content) as Record<string, DataItem[]>;
    if (context) return { [context]: db[context] ?? [] };
    return db;
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    const getRes = await fetch(`${this.apiUrl}?ref=${this.branch}`, {
      headers: this.headers,
      cache: 'no-store',
    });
    const existing = getRes.ok ? (await getRes.json() as { sha?: string }) : null;

    const encoded = Buffer.from(JSON.stringify(fullDatabase, null, 2)).toString('base64');
    await fetch(this.apiUrl, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({
        message: `[agnostic-seed] db update ${new Date().toISOString()}`,
        content: encoded,
        sha: existing?.sha,
        branch: this.branch,
      }),
    });
  }
}
