import { IntegrityChecker } from '@/lib/agnostic/IntegrityChecker';
import { getStrategy } from '@/server/getStrategy';

/**
 * Unified Vault Data Loader (Axiomatic v3.0)
 * 
 * This is the SINGLE point of truth for both SSR and Runtime.
 * It uses the Strategy Resolver to determine where the 'Materia' lives,
 * ensuring no discrepancy between the initial HTML and the dynamic app.
 */
export async function getVaultData(): Promise<Record<string, any>> {
  try {
    // 1. Resolve the strategy (Local vs Supabase) based on the DNA
    const strategy = await getStrategy();
    
    // 2. Fetch all data using the strategy's read method
    const db = await strategy.read();
    
    // 3. Perform Integrity Audit (Axiom: Fail-Fast / Deterministic Monitoring)
    const integrity = IntegrityChecker.analyze(db);
    
    console.log(`[Vault] Successfully hydrated ${Object.keys(db).length} contexts via ${strategy.constructor.name}. Integrity: ${integrity.isValid ? 'OK' : 'ISSUES'}`);
    
    return {
      ...db,
      _integrity: integrity
    };
  } catch (error) {
    console.error('[Vault] Critical failure during unified hydration:', error);
    return {
      _integrity: { isValid: false, issues: [{ level: 'ERROR', context: 'SYSTEM', message: 'Fallo crítico en la bóveda de datos.' }] }
    };
  }
}
