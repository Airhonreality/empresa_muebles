if (typeof window !== 'undefined') {
  throw new Error('getStrategy can only be used on the server.');
}

if (process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('server-only');
}

import type { AgnosticBridge } from '@agnostic/core';
import { LocalStrategy }   from './strategies/LocalStrategy';
import { SupabaseStrategy } from './strategies/SupabaseStrategy';
import { GitHubStrategy }  from './strategies/GitHubStrategy';
import { getSiloPath }     from './activeProject';

/**
 * Resolves the persistence strategy from environment variables.
 * Priority: GITHUB_REPO → SUPABASE_URL → LocalStrategy (default).
 * No filesystem passport needed — strategy is set at deploy time via env vars.
 */
export function getStrategy(): AgnosticBridge {
  if (process.env.GITHUB_REPO) {
    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    return new GitHubStrategy(owner, repo, undefined, process.env.GITHUB_BRANCH ?? 'main');
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseStrategy(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  if (process.env.VERCEL) {
    console.warn('[getStrategy] WARNING: LocalStrategy on Vercel read-only filesystem. Set GITHUB_REPO for persistent storage.');
  }

  return new LocalStrategy(getSiloPath());
}
