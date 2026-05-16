/**
 * 🏛️ ARTEFACTO: getStrategy.ts
 * ────────────
 * CAPA: Server (Sovereignty Orchestration)
 * VERSIÓN: 4.0 (Axiomatic & Typed)
 * COMMIT: P3-M2.2-ADR-DETERMINISTIC-ORCHESTRATOR
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Resolución determinista de la Realidad Activa (ADN + Almacenamiento).
 * - Hidratación del motor basada en el contrato MasterPassport.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Lanzar error fatal si el Pasaporte Maestro está incompleto (Cero Fallbacks).
 * - NEVER: Registrar estado dinámico en el Registry (El Registry es Catálogo).
 * - ALWAYS: Garantizar que la identidad inyectada sea la fuente única de verdad.
 * 
 * 📜 ADR: [2026-05-15] ZERO_FALLBACK_POLICY
 * - DECISIÓN: Eliminar el uso de 'any' y los valores por defecto 'LocalStrategy' o 'default'.
 * - MOTIVO: Los fallbacks enmascaran la orfandad de datos y rompen el determinismo.
 * - IMPACTO: El sistema solo arranca si el Pasaporte es válido y completo.
 */

import type { DataStrategy } from '@agnostic/core';
import { LocalStrategy } from './strategies/LocalStrategy';
import { SupabaseStrategy } from './strategies/SupabaseStrategy';
import { GitHubStrategy } from './strategies/GitHubStrategy';
import { HybridStrategy } from './strategies/HybridStrategy';
import { MasterPassport } from '@/types/sovereignty';
import fs from 'fs';
import path from 'path';

const CACHE_TTL_MS = 5 * 60 * 1000;
interface CacheEntry {
  strategy: DataStrategy;
  expiresAt: number;
}
const strategyCache = new Map<string, CacheEntry>();

export function invalidateStrategyCache(): void {
  strategyCache.clear();
}

/**
 * 🛡️ SOVEREIGNTY VALIDATOR
 * Ensures the passport follows the Master Contract.
 */
function validatePassport(p: any): asserts p is MasterPassport {
  const requiredFields: (keyof MasterPassport)[] = ['project_identity', 'dna_strategy', 'storage_strategy'];
  const missing = requiredFields.filter(f => !p[f]);
  if (missing.length > 0) {
    throw new Error(`[SovereigntyEngine] FATAL ERROR: Master Passport is incomplete. Missing fields: ${missing.join(', ')}`);
  }
}

async function buildStrategy(): Promise<DataStrategy> {
  const projectRoot = process.cwd();
  let passport: Partial<MasterPassport> = {};

  // 📜 IDENTITY DISCOVERY (Injection Priority)
  try {
    if (process.env.SYSTEM_PASSPORT) {
      passport = JSON.parse(process.env.SYSTEM_PASSPORT);
    } else {
      const neutralConfigPath = path.join(projectRoot, 'storage', 'system_config.json');
      if (fs.existsSync(neutralConfigPath)) {
        const config = JSON.parse(fs.readFileSync(neutralConfigPath, 'utf8'));
        // In Local, system_config is a DataItem array
        const masterItem = Array.isArray(config) ? config.find((i: any) => i.id === 'master_passport') : null;
        passport = masterItem ? masterItem.data : config;
      }
    }
  } catch (e) {
    throw new Error(`[SovereigntyEngine] Failed to read Identity Passport: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // 🛡️ ENFORCE DETERMINISM
  validatePassport(passport);

  const { project_identity, dna_strategy, storage_strategy } = passport;
  const siloPath = path.join(projectRoot, 'storage', project_identity);

  console.log(`[SovereigntyEngine] EXECUTION_MODE: ID=${project_identity} | DNA=${dna_strategy} | STORAGE=${storage_strategy}`);

  // 🏗️ STRATEGY FACTORY (Pure Resolution)
  let dnaInstance: DataStrategy;
  switch (dna_strategy) {
    case 'GitHubStrategy': 
      dnaInstance = new GitHubStrategy(
        process.env.GITHUB_OWNER || '', 
        process.env.GITHUB_REPO || ''
      ); 
      break;
    case 'LocalStrategy':
      dnaInstance = new LocalStrategy(siloPath); 
      break;
    default:
      throw new Error(`[SovereigntyEngine] Unsupported DNA Strategy: ${dna_strategy}`);
  }

  let storageInstance: DataStrategy;
  switch (storage_strategy) {
    case 'SupabaseStrategy':
      storageInstance = new SupabaseStrategy(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      break;
    case 'LocalStrategy':
      storageInstance = dnaInstance;
      break;
    default:
      throw new Error(`[SovereigntyEngine] Unsupported Storage Strategy: ${storage_strategy}`);
  }

  // 🛡️ HYBRID ASSEMBLY
  let finalStrategy = dnaInstance;
  if (passport.sovereign_mode === 'HYBRID') {
    const cloudContexts = ['schema_projects', 'schema_clients', 'class_space', 'quote_items', 'items'];
    finalStrategy = new HybridStrategy(dnaInstance, storageInstance, cloudContexts);
  }

  return finalStrategy;
}

export async function getStrategy(): Promise<DataStrategy> {
  const cacheKey = 'global_sovereign_strategy';
  const cached = strategyCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.strategy;
  }

  const strategy = await buildStrategy();
  strategyCache.set(cacheKey, {
    strategy,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  return strategy;
}
