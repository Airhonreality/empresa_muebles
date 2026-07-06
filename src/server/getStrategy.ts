if (typeof window !== 'undefined') {
  throw new Error('getStrategy can only be used on the server.');
}

if (process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('server-only');
}

import type { AgnosticBridge } from '@agnostic/core';
import { LocalStrategy }    from './strategies/LocalStrategy';
import { SupabaseStrategy } from './strategies/SupabaseStrategy';
import { GitHubStrategy }   from './strategies/GitHubStrategy';
import { PostgresStrategy } from './strategies/PostgresStrategy';
import { getProjectStorageRoot } from './activeProject';

/**
 * Resolves the persistence strategy from environment variables.
 * Priority:
 * 1. Explicit AGNOSTIC_STORAGE_STRATEGY override.
 * 2. LocalStrategy in development by default.
 * 3. GITHUB_REPO → DATABASE_URL → SUPABASE_URL → LocalStrategy in production.
 *
 * DATABASE_URL accepts any standard PostgreSQL connection string:
 *   Neon, Supabase (direct Postgres), Railway, Render, etc.
 */
export function getStrategy(): AgnosticBridge {
  const strategyName = getStrategyName();

  if (strategyName === 'github') {
    const [owner, repo] = process.env.GITHUB_REPO!.split('/');
    return new GitHubStrategy(owner, repo, undefined, process.env.GITHUB_BRANCH ?? 'main');
  }

  if (strategyName === 'postgres') {
    return new PostgresStrategy(process.env.DATABASE_URL!);
  }

  if (strategyName === 'supabase') {
    return new SupabaseStrategy(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }

  if (process.env.VERCEL && process.env.NOW_REGION) {
    console.warn('[getStrategy] WARNING: LocalStrategy on Vercel read-only filesystem. Set GITHUB_REPO or DATABASE_URL for persistent storage.');
  }

  return new LocalStrategy(getProjectStorageRoot());
}

export function getStrategyName(): 'github' | 'postgres' | 'supabase' | 'local' {
  const explicit = normalizeStrategyName(process.env.AGNOSTIC_STORAGE_STRATEGY);
  if (explicit) return explicit;

  if (process.env.NODE_ENV !== 'production') {
    return 'local';
  }

  if (process.env.GITHUB_REPO) return 'github';
  if (process.env.DATABASE_URL) return 'postgres';
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return 'supabase';
  return 'local';
}

function normalizeStrategyName(value?: string): 'github' | 'postgres' | 'supabase' | 'local' | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'github' || normalized === 'postgres' || normalized === 'supabase' || normalized === 'local') {
    return normalized;
  }
  return null;
}
