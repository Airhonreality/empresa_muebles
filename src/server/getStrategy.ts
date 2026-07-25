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
import { resolveStorageStrategyName } from '@/lib/agnostic/env-contract';

/**
 * Resolves the persistence strategy from the explicit contract first.
 * If AGNOSTIC_STORAGE_STRATEGY is absent, falls back to inference from
 * the configured env payload in this order:
 * github → postgres → supabase → local.
 *
 * DATABASE_URL accepts any standard PostgreSQL connection string:
 *   Neon, Supabase (direct Postgres), Railway, Render, etc.
 */
export function getStrategy(): AgnosticBridge {
  const strategyName = getStrategyName();

  if (strategyName === 'github') {
    const repoPath = process.env.GITHUB_REPO;
    if (!repoPath) {
      throw new Error('AGNOSTIC_STORAGE_STRATEGY=github requiere GITHUB_REPO.');
    }
    const [owner, repo] = repoPath.split('/');
    if (!owner || !repo) {
      throw new Error('GITHUB_REPO debe tener formato "owner/repo".');
    }
    return new GitHubStrategy(owner, repo, undefined, process.env.GITHUB_BRANCH ?? 'main');
  }

  if (strategyName === 'postgres') {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('AGNOSTIC_STORAGE_STRATEGY=postgres requiere DATABASE_URL.');
    }
    return new PostgresStrategy(url);
  }

  if (strategyName === 'supabase') {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('AGNOSTIC_STORAGE_STRATEGY=supabase requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
    }
    return new SupabaseStrategy(url, key);
  }

  if (process.env.VERCEL && process.env.NOW_REGION) {
    console.warn('[getStrategy] WARNING: LocalStrategy on Vercel read-only filesystem. Set GITHUB_REPO or DATABASE_URL for persistent storage.');
  }

  return new LocalStrategy(getProjectStorageRoot());
}

export function getStrategyName(): 'github' | 'postgres' | 'supabase' | 'local' {
  return resolveStorageStrategyName();
}
