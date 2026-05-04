import type { DataStrategy } from '@/core/types';
import { LocalStrategy } from './strategies/LocalStrategy';
import { GitHubStrategy } from './strategies/GitHubStrategy';
import { SupabaseStrategy } from './strategies/SupabaseStrategy';

/**
 * getStrategy v3.0 (Dynamic Discovery)
 * 
 * This is the heart of the NOMON Multi-Tenant architecture.
 * It identifies the tenant, fetches its DNA from GitHub, 
 * and discovers where its 'Blood' (Data) lives.
 */
export async function getStrategy(host?: string): Promise<DataStrategy> {
  // 1. Identify Tenant (e.g., from veta-de-oro.engine.so or a header)
  // For now, we use the GITHUB_REPO env as a default, but it's ready for subdomains
  const repoName = process.env.GITHUB_REPO || 'veta_de_oro';

  // 2. Fetch the DNA (Configuration) from GitHub
  const dnaLoader = new GitHubStrategy();
  const config = await dnaLoader.readConfig('vault_link.json');

  // 3. Discovery: Does this DNA point to a specific Supabase?
  if (config?.supabaseUrl && config?.supabaseKey) {
    console.log(`[Discovery] Tenant '${repoName}' identified. Connecting to specific Supabase...`);
    return new SupabaseStrategy(config.supabaseUrl, config.supabaseKey);
  }

  // 4. Fallback: Use GitHub directly for data if no Supabase is linked
  if (process.env.GITHUB_TOKEN) {
    return dnaLoader;
  }

  return new LocalStrategy();
}
