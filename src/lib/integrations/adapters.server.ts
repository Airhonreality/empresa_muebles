import { NotionAdapter } from '@/integrations/notion/adapter';
import type { IntegrationSource } from '@agnostic/core';

export interface ServerAdapter {
    testConnection(): Promise<{ ok: boolean; message?: string }>;
    listSources?(): Promise<IntegrationSource[]>;
    getRecords?(sourceId: string): Promise<Array<Record<string, string>>>;
}

function getEnvCredentials(id: string): Record<string, string> {
    if (id === 'notion') return { NOTION_TOKEN: process.env.NOTION_TOKEN ?? '' };
    return {};
}

export function getAdapter(id: string, credentials?: Record<string, string>): ServerAdapter | null {
    const creds = credentials ?? getEnvCredentials(id);
    if (id === 'notion') return new NotionAdapter(creds);
    return null;
}
