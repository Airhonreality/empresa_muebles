import type { AdapterManifest, IntegrationSource } from '@agnostic/core';

// agno:adapter-imports:start — maintained by `agno install <id>` / `agno remove-adapter <id>` (scripts/agno-adapters.ts)
import { NotionAdapter } from '@/integrations/notion/adapter';
import { manifest as notionManifest } from '@/integrations/notion/manifest';
import { LlmAdapter } from '@/integrations/llm/adapter';
import { manifest as llmManifest } from '@/integrations/llm/manifest';
import { WhatsappAdapter } from '@/integrations/whatsapp/adapter';
import { manifest as whatsappManifest } from '@/integrations/whatsapp/manifest';
import { MetaAdapter } from '@/integrations/meta/adapter';
import { manifest as metaManifest } from '@/integrations/meta/manifest';
import { TiktokAdapter } from '@/integrations/tiktok/adapter';
import { manifest as tiktokManifest } from '@/integrations/tiktok/manifest';
import { GmailAdapter } from '@/integrations/gmail/adapter';
import { manifest as gmailManifest } from '@/integrations/gmail/manifest';
import { WompiAdapter } from '@/integrations/wompi/adapter';
import { manifest as wompiManifest } from '@/integrations/wompi/manifest';
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
    llm: { manifest: llmManifest, create: creds => new LlmAdapter(creds) },
    whatsapp: { manifest: whatsappManifest, create: creds => new WhatsappAdapter(creds) },
    meta: { manifest: metaManifest, create: creds => new MetaAdapter(creds) },
    tiktok: { manifest: tiktokManifest, create: creds => new TiktokAdapter(creds) },
    gmail: { manifest: gmailManifest, create: creds => new GmailAdapter(creds) },
    wompi: { manifest: wompiManifest, create: creds => new WompiAdapter(creds) },
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
