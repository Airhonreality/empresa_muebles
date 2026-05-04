import type { DataStrategy } from '@/core/types';
import { LocalStrategy } from './strategies/LocalStrategy';
import { GitHubStrategy } from './strategies/GitHubStrategy';
import { SupabaseStrategy } from './strategies/SupabaseStrategy';

/**
 * getStrategy: The Brain of the Satellite.
 * Decides where to fetch the Materia based on Environment Variables.
 */
export function getStrategy(): DataStrategy {
  // 1. If Supabase is configured, use it for Data (Hybrid is handled inside Strategy if needed)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return new SupabaseStrategy();
  }

  // 2. If GitHub is configured, use it for the Cloud Silo
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
    return new GitHubStrategy();
  }

  // 3. Fallback to Local Storage (Development mode)
  return new LocalStrategy();
}
