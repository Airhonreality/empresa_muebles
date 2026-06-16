import type { IntegrationSource } from '@agnostic/core';

const NOTION_VERSION = '2022-06-28';
const MAX_RECORDS = 5000;

export class NotionAdapter {
    private token: string;

    constructor(credentials: Record<string, string>) {
        this.token = credentials.NOTION_TOKEN ?? '';
    }

    private async fetch(path: string, options: RequestInit = {}) {
        const res = await globalThis.fetch(`https://api.notion.com/v1${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Notion-Version': NOTION_VERSION,
                'Content-Type': 'application/json',
                ...(options.headers ?? {}),
            },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? `Notion API error ${res.status}`);
        }
        return res.json();
    }

    async testConnection(): Promise<{ ok: boolean; message?: string }> {
        try {
            await this.fetch('/users/me');
            return { ok: true };
        } catch (e: any) {
            return { ok: false, message: e.message };
        }
    }

    async listSources(): Promise<IntegrationSource[]> {
        const data = await this.fetch('/search', {
            method: 'POST',
            body: JSON.stringify({
                filter: { value: 'database', property: 'object' },
                page_size: 100,
            }),
        });
        return (data.results ?? []).map((db: any) => ({
            id: db.id,
            name: db.title?.[0]?.plain_text ?? db.id,
        }));
    }

    async getRecords(databaseId: string): Promise<Array<Record<string, string>>> {
        const records: Array<Record<string, string>> = [];
        let cursor: string | undefined;

        while (records.length < MAX_RECORDS) {
            const body: Record<string, unknown> = { page_size: 100 };
            if (cursor) body.start_cursor = cursor;

            const data = await this.fetch(`/databases/${databaseId}/query`, {
                method: 'POST',
                body: JSON.stringify(body),
            });

            for (const page of data.results ?? []) {
                records.push(this.flattenPage(page));
            }

            if (!data.has_more) break;
            cursor = data.next_cursor;
        }

        return records;
    }

    private flattenPage(page: any): Record<string, string> {
        const out: Record<string, string> = { _notion_id: page.id };
        for (const [key, prop] of Object.entries<any>(page.properties ?? {})) {
            out[key] = this.flattenProperty(prop);
        }
        return out;
    }

    private flattenProperty(prop: any): string {
        switch (prop.type) {
            case 'title': return prop.title?.map((t: any) => t.plain_text).join('') ?? '';
            case 'rich_text': return prop.rich_text?.map((t: any) => t.plain_text).join('') ?? '';
            case 'number': return String(prop.number ?? '');
            case 'select': return prop.select?.name ?? '';
            case 'multi_select': return (prop.multi_select ?? []).map((o: any) => o.name).join(', ');
            case 'date': return prop.date?.start ?? '';
            case 'checkbox': return String(prop.checkbox ?? false);
            case 'url': return prop.url ?? '';
            case 'email': return prop.email ?? '';
            case 'phone_number': return prop.phone_number ?? '';
            case 'formula': return String(prop.formula?.string ?? prop.formula?.number ?? prop.formula?.boolean ?? '');
            case 'people': return (prop.people ?? []).map((p: any) => p.name ?? p.id).join(', ');
            case 'files': return (prop.files ?? []).map((f: any) => f.name).join(', ');
            case 'relation': return (prop.relation ?? []).map((r: any) => r.id).join(', ');
            case 'created_time': return prop.created_time ?? '';
            case 'last_edited_time': return prop.last_edited_time ?? '';
            default: return '';
        }
    }
}
