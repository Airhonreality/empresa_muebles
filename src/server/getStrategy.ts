/**
 * 🛡️ AGNOSTICISM GUARDIAN: STRATEGY RESOLVER (v6.0 — SINGLETON + CACHE)
 * ======================================================================
 *
 * ROLE: Identifies the Tenant, reads their manifest.json once per TTL window,
 *       and returns the correct DataStrategy singleton.
 *
 * SINGLETON PROTOCOL:
 * - Strategy instances are cached in a module-level Map keyed by tenant.
 * - Default TTL: 5 minutes (stays inside the Next.js server process lifetime).
 * - Call `invalidateStrategyCache(tenant?)` to force re-resolution (e.g. after hot-reload).
 */
import type { DataStrategy } from '@agnostic/core';
import { LocalStrategy }       from './strategies/LocalStrategy';
import { SupabaseStrategy }    from './strategies/SupabaseStrategy';
import { RemoteJSONStrategy }  from './strategies/RemoteJSONStrategy';
import { HybridStrategy }      from './strategies/HybridStrategy';

// ─── CACHE ───────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — stays inside prompt-cache window

interface CacheEntry {
  strategy:  DataStrategy;
  expiresAt: number;
}

const strategyCache = new Map<string, CacheEntry>();

export function invalidateStrategyCache(tenant?: string): void {
  if (tenant) {
    strategyCache.delete(tenant);
  } else {
    strategyCache.clear();
  }
}

// ─── TENANT RESOLUTION ───────────────────────────────────────────────────────

function resolveTenantKey(host?: string): string {
  const envTenant = process.env.ACTIVE_TENANT;
  if (envTenant) return envTenant;
  if (host && !host.includes('localhost')) return host.split('.')[0];
  return 'default';
}

// ─── MANIFEST READER (sync, called once per cache miss) ──────────────────────

function readLocalManifest(siloPath: string): Record<string, unknown> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs   = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const manifestPath = path.isAbsolute(siloPath) 
      ? path.join(siloPath, 'manifest.json')
      : path.join(process.cwd(), siloPath, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) return null;
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── STRATEGY BUILDER (called only on cache miss) ────────────────────────────

async function buildStrategy(tenantKey: string): Promise<DataStrategy> {
  const storageUrl = process.env.STORAGE_URL;
  // 🛡️ AXIOMATIC FIX: Use absolute path to prevent CWD deviations
  const projectRoot = 'c:/Users/javir/Documents/DEVs/agnostic system';
  const siloPath   = `${projectRoot}/storage/${tenantKey}`;

  let manifest = readLocalManifest(siloPath);

  if (storageUrl && !manifest) {
    try {
      const res = await fetch(`${storageUrl}/manifest.json`);
      if (res.ok) manifest = (await res.json()) as Record<string, unknown>;
    } catch { /* silent fallback */ }
  }

  if (manifest) {
    const config       = (manifest['config']  as Record<string, unknown> | undefined) ?? {};
    const secrets      = (manifest['secrets'] as Record<string, unknown> | undefined) ?? {};
    const strategy     = config['strategy']       as string | undefined;
    const cloudContexts = config['cloud_contexts'] as string[] | undefined;
    const supabaseUrl  = secrets['supabaseUrl']   as string | undefined;
    const supabaseKey  = secrets['supabaseKey']   as string | undefined;
    const hasSupabase  = Boolean(supabaseUrl && supabaseKey);

    if (strategy === 'HYBRID' && hasSupabase) {
      console.log(`[StrategyResolver] HYBRID_MODE — tenant: ${tenantKey}`);
      return new HybridStrategy(
        new LocalStrategy(siloPath),
        new SupabaseStrategy(supabaseUrl!, supabaseKey!),
        cloudContexts ?? [],
      );
    }

    if (hasSupabase) {
      return new SupabaseStrategy(supabaseUrl!, supabaseKey!);
    }
  }

  if (storageUrl && !manifest) return new RemoteJSONStrategy(storageUrl);
  return new LocalStrategy(siloPath);
}

// ─── PUBLIC RESOLVER ─────────────────────────────────────────────────────────

export async function getStrategy(host?: string): Promise<DataStrategy> {
  const tenantKey = resolveTenantKey(host);

  const cached = strategyCache.get(tenantKey);
  if (cached && cached.expiresAt > Date.now()) return cached.strategy;

  const strategy = await buildStrategy(tenantKey);
  strategyCache.set(tenantKey, { strategy, expiresAt: Date.now() + CACHE_TTL_MS });
  return strategy;
}
