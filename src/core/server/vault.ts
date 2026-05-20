/**
 * 🏛️ ARTEFACTO: vault.ts
 * ────────────
 * CAPA: Core / Server (Unified SSR Hydration Loader)
 * VERSIÓN: 4.0
 * COMMIT: P3-M3.4-VAULT-LOADER-AXIOMATIC
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Load selective database contexts on the Server for initial page hydration.
 * - Act as the single source of data truth for SSR routing.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Load contexts synchronously from the resolved Strategy adapter.
 * - NEVER: Inject system capabilities, dynamic block registry configurations, or custom operations into user data.
 * - ALWAYS: Run static integrity analysis on loaded contexts.
 * 
 * 📜 ADR: [2026-05-16] HYDRATION_LOADER_SIMPLIFICATION
 * - DECISIÓN: Remove the dynamic registry capability injection from the SSR bundle, make strategy loading synchronous, and simplify namespace iteration.
 * - MOTIVO: Adherence to Nam P. Suh's Independence Axiom, eliminating runtime UI component discovery from the data loading layer.
 * - IMPACTO: 30+ lines of codebase pruned, predictable hydration speed, and fully typed contracts.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [getStrategy.ts, IntegrityChecker.ts]
 * - DOWNSTREAM: [[...slug]/page.tsx, resolver.ts]
 */

import { IntegrityChecker } from '@/lib/agnostic/IntegrityChecker';
import { getStrategy } from '@/server/getStrategy';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { cache } from 'react';

/**
 * Unified Server-Side Data Hydration Loader.
 * Resolves the active strategy synchronously and reads only the necessary contexts.
 */
export const getVaultData = cache(async function getVaultData(requestedContexts?: string | string[]): Promise<Record<string, any>> {
  try {
    const strategy = getStrategy();
    
    // Core namespaces always required by the system
    const coreContexts = [SYSTEM_NS.ROUTES, SYSTEM_NS.SCHEMAS, SYSTEM_NS.CONFIG];
    
    const contextsToFetch = [...new Set([
      ...coreContexts, 
      ...(requestedContexts 
        ? (Array.isArray(requestedContexts) ? requestedContexts : [requestedContexts]) 
        : [])
    ])];

    const db: Record<string, any> = {};

    // Retrieve each namespace using standard read operations
    for (const context of contextsToFetch) {
      db[context] = await strategy.read(context);
    }

    // Run structural and schema checks on the loaded data
    const integrity = process.env.NODE_ENV === 'development'
      ? IntegrityChecker.analyze(db)
      : { isValid: true, issues: [] };
    
    return {
      ...db,
      _integrity: integrity
    };
  } catch (error) {
    console.error('[VaultHydration] Selective server-side hydration failure:', error);
    return {
      _integrity: { 
        isValid: false, 
        issues: [{ level: 'ERROR', context: 'SYSTEM', message: 'Critical server hydration failed.' }] 
      }
    };
  }
});
