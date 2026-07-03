import type { AdapterManifest, IntegrationSource } from '@agnostic/core';

// agno:adapter-imports:start — maintained by `agno install <id>` / `agno remove-adapter <id>` (scripts/agno-adapters.ts)
import { NotionAdapter } from '@/integrations/notion/adapter';
import { manifest as notionManifest } from '@/integrations/notion/manifest';
// agno:adapter-imports:end

export interface ServerAdapter {
    testConnection(): Promise<{ ok: boolean; message?: string }>;
    listSources?(): Promise<IntegrationSource[]>;
    getRecords?(sourceId: string): Promise<Array<Record<string, string>>>;
}

interface Registration {
    manifest: AdapterManifest;
    create: (credentials: Record<string, string>) => ServerAdapter;
}

// Do not edit the marked zone by hand outside an emergency — the CLI keeps it
// in sync with agnostic.config.ts.
const REGISTRY: Record<string, Registration> = {
    // agno:adapter-registry:start
    notion: { manifest: notionManifest, create: creds => new NotionAdapter(creds) },
    // agno:adapter-registry:end
};

function credentialsFromEnv(manifest: AdapterManifest): Record<string, string> {
    const creds: Record<string, string> = {};
    for (const envVar of manifest.envVars) {
        creds[envVar.key] = process.env[envVar.key] ?? '';
    }
    return creds;
}

export function getAdapter(id: string, credentials?: Record<string, string>): ServerAdapter | null {
    const reg = REGISTRY[id];
    if (!reg) return null;
    return reg.create(credentials ?? credentialsFromEnv(reg.manifest));
}
