import { IntegrityChecker } from '@/lib/agnostic/IntegrityChecker';
import { getStrategy } from '@/server/getStrategy';

/**
 * Unified Vault Data Loader (Axiomatic v3.0)
 * 
 * This is the SINGLE point of truth for both SSR and Runtime.
 * It uses the Strategy Resolver to determine where the 'Materia' lives,
 * ensuring no discrepancy between the initial HTML and the dynamic app.
 */
export async function getVaultData(requestedContexts?: string | string[]): Promise<Record<string, any>> {
  try {
    const strategy = await getStrategy();
    
    // Core contexts always required for system operation
    const coreContexts = ['page_routes', 'schema_definitions', 'system_config'];
    const contextsToFetch = requestedContexts 
      ? [...new Set([...coreContexts, ...(Array.isArray(requestedContexts) ? requestedContexts : [requestedContexts])])]
      : null; // null means fetch all

    const db: Record<string, any> = {};

    if (contextsToFetch) {
      // Selective fetch
      for (const context of contextsToFetch) {
        const result = await strategy.read(context);
        if (result[context]) {
          db[context] = result[context];
        }
      }
    } else {
      // Full fetch (backward compatibility)
      Object.assign(db, await strategy.read());
    }

    // System capabilities injection
    const { registry } = await import('@/lib/agnostic/Registry');
    const { initializeRegistry } = await import('@/lib/agnostic/init');
    initializeRegistry();
    
    const manifest = registry.getManifest();
    manifest.forEach(item => {
      if (!db[item.context]) db[item.context] = [];
      db[item.context].push(item);
    });
    
    const integrity = IntegrityChecker.analyze(db);
    
    return {
      ...db,
      _integrity: integrity
    };
  } catch (error) {
    console.error('[Vault] Selective hydration failure:', error);
    return {
      _integrity: { isValid: false, issues: [{ level: 'ERROR', context: 'SYSTEM', message: 'Critical vault failure.' }] }
    };
  }
}
