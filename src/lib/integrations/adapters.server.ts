import type { AdapterManifest, IntegrationSource } from '@agnostic/core';
import agnosticConfig from '@/../agnostic.config';

export interface ServerAdapter {
    testConnection(): Promise<{ ok: boolean; message?: string }>;
    listSources?(): Promise<IntegrationSource[]>;
    getRecords?(sourceId: string): Promise<Array<Record<string, string>>>;
}

type AdapterConstructor = new (credentials: Record<string, string>) => ServerAdapter;

// El conjunto de adapters INSTALADOS vive en agnostic.config.ts (capa fork,
// protegida por merge=ours). El CÓDIGO vive en src/integrations/<id>/. Ningún
// archivo de engine lleva estado de fork: el adapter se resuelve por convención.
function installedIds(): Set<string> {
    return new Set(Object.keys(agnosticConfig.integrations ?? {}));
}

// Convención de nombre: src/integrations/<id>/adapter.ts exporta
// `${PascalCase(id)}Adapter` (o un default); manifest.ts exporta `manifest`.
function pascalCase(id: string): string {
    return id.split(/[_-]/).filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join('');
}

function credentialsFromEnv(manifest: AdapterManifest): Record<string, string> {
    const creds: Record<string, string> = {};
    for (const envVar of manifest.envVars) {
        creds[envVar.key] = process.env[envVar.key] ?? '';
    }
    return creds;
}

/**
 * Resuelve un adapter de servidor por id. Devuelve null si el adapter no está
 * instalado (no aparece en agnostic.config.ts) o si su código no cumple la
 * convención. La ruta es relativa (no alias) para que webpack cree el context
 * module de src/integrations/<*>/ de forma fiable.
 */
export async function getAdapter(
    id: string,
    credentials?: Record<string, string>,
): Promise<ServerAdapter | null> {
    if (!installedIds().has(id)) return null;

    let adapterModule: Record<string, unknown>;
    let manifestModule: { manifest?: AdapterManifest };
    try {
        [adapterModule, manifestModule] = await Promise.all([
            import(`../../integrations/${id}/adapter`),
            import(`../../integrations/${id}/manifest`),
        ]);
    } catch {
        return null;
    }

    const manifest = manifestModule.manifest;
    if (!manifest) return null;

    const Ctor = (adapterModule.default ?? adapterModule[`${pascalCase(id)}Adapter`]) as
        | AdapterConstructor
        | undefined;
    if (typeof Ctor !== 'function') return null;

    return new Ctor(credentials ?? credentialsFromEnv(manifest));
}
