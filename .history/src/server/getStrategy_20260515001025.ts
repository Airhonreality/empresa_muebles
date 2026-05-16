/**
 * 🏛️ ARTEFACTO: getStrategy.ts (Sovereignty Orchestrator)
 * ────────────
 * CAPA: Server / Infrastructure (The Sentinel)
 * VERSIÓN: 7.0 (Sovereign Intelligence Edition)
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestación inteligente de la fuente de verdad (DNA y Materia).
 * - Protocolo de Descubrimiento de Soberanía: Local (Proximidad) -> GitHub (Espejo).
 * - Garantía de Desacoplo Puro: GitHub para ADN, Supabase para Materia.
 * 
 * 📜 ADR: [2026-05-15] SOVEREIGNTY_AUTO_DETECTION
 * - DECISIÓN: El sistema autodetecta su origen de ADN basándose en la presencia física de la carpeta 'storage' o tokens de GitHub.
 * - MOTIVO: Eliminar la entropía de configuración y permitir la portabilidad total entre Local y Vercel.
 * 
 * 🛡️ AXIOMAS:
 * - AXIOMA DE PROXIMIDAD: Si el ADN existe en el disco local, es la verdad más inmediata y soberana.
 * - AXIOMA DE DELEGACIÓN: GitHub es el espejo de soberanía para entornos sin presencia física del repositorio.
 * - AXIOMA DEL VACÍO: Un sistema sin ADN detectado debe declarar su inexistencia elegantemente.
 */
import type { DataStrategy } from '@agnostic/core';
import { registry }           from '@/lib/agnostic/Registry';
import { LocalStrategy }       from './strategies/LocalStrategy';
import { SupabaseStrategy }    from './strategies/SupabaseStrategy';
import { GitHubStrategy }      from './strategies/GitHubStrategy';
import { HybridStrategy }      from './strategies/HybridStrategy';
import fs from 'fs';
import path from 'path';

// ─── CACHE ───────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; 
interface CacheEntry {
  strategy:  DataStrategy;
  expiresAt: number;
}
const strategyCache = new Map<string, CacheEntry>();

export function invalidateStrategyCache(tenant?: string): void {
  if (tenant) { strategyCache.delete(tenant); } 
  else { strategyCache.clear(); }
}

// ─── TENANT RESOLUTION ───────────────────────────────────────────────────────
function resolveTenantKey(host?: string): string {
  // 1. Prioridad Absoluta: Orden directa del Arquitecto (Entorno)
  const envTenant = process.env.ACTIVE_TENANT;
  if (envTenant) return envTenant;

  // 2. Soberanía Ontológica: El Pasaporte Maestro en la carpeta Madre
  try {
    const rootConfigPath = path.join(process.cwd(), 'storage', 'default', 'db', 'system_config.json');
    if (fs.existsSync(rootConfigPath)) {
      const config = JSON.parse(fs.readFileSync(rootConfigPath, 'utf8'));
      const passport = Array.isArray(config) 
        ? config.find(i => i.id === 'master_passport')?.data 
        : config;
      
      const identity = passport?.project_identity || passport?.active_tenant;
      if (identity) {
        console.log(`[SovereigntyEngine] Identity confirmed via Passport: ${identity}`);
        return identity;
      }
    }
  } catch (err) {
    console.warn('[SovereigntyEngine] Failed to read Master Passport:', err);
  }

  // 3. Inferencia por Host (Producción)
  if (host && !host.includes('localhost')) return host.split('.')[0];

  // 4. Fallback: Autodetección de Inquilinos (Desarrollo)
  const storagePath = path.join(process.cwd(), 'storage');
  if (fs.existsSync(storagePath)) {
    const folders = fs.readdirSync(storagePath).filter(f => 
      fs.statSync(path.join(storagePath, f)).isDirectory() && 
      !['scripts', 'default'].includes(f)
    );
    if (folders.length > 0) return folders[0]; 
  }
  return 'default';
}

// ─── SOVEREIGNTY DISCOVERY ENGINE ────────────────────────────────────────────
async function buildStrategy(tenantKey: string): Promise<DataStrategy> {
  const projectRoot = process.cwd();
  const siloPath = path.join(projectRoot, 'storage', tenantKey);
  
  // 📜 READ THE MANIFEST (The Mother Passport)
  let passport: any = {};
  try {
    const rootConfigPath = path.join(projectRoot, 'storage', 'default', 'db', 'system_config.json');
    if (fs.existsSync(rootConfigPath)) {
      const config = JSON.parse(fs.readFileSync(rootConfigPath, 'utf8'));
      passport = Array.isArray(config) ? config.find(i => i.id === 'master_passport')?.data : config;
    }
  } catch (e) { /* Fallback to defaults */ }

  const dnaType = passport?.dna_strategy || 'LocalStrategy';
  const storageType = passport?.storage_strategy || 'LocalStrategy';

  console.log(`[SovereigntyEngine] EXECUTION MODE: DNA=${dnaType} | STORAGE=${storageType}`);

  // 🏛️ STRATEGY FACTORY (No guessing, just execution)
  let dnaStrategy: DataStrategy;
  switch (dnaType) {
    case 'GitHubStrategy': dnaStrategy = new GitHubStrategy(); break;
    case 'LocalStrategy':  
    default:               dnaStrategy = new LocalStrategy(siloPath); break;
  }

  let storageStrategy: DataStrategy;
  switch (storageType) {
    case 'SupabaseStrategy': 
      storageStrategy = new SupabaseStrategy(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); 
      break;
    case 'LocalStrategy':
    default:
      storageStrategy = dnaStrategy; // Same silo for both by default
      break;
  }

  // 🛡️ HYBRID ASSEMBLY (If requested)
  if (passport?.sovereign_mode === 'HYBRID') {
    const cloudContexts = ['schema_projects', 'schema_clients', 'class_space', 'quote_items', 'items'];
    return new HybridStrategy(dnaStrategy, storageStrategy, cloudContexts);
  }

  return dnaStrategy;
}

// ─── PUBLIC RESOLVER ─────────────────────────────────────────────────────────
export async function getStrategy(host?: string): Promise<DataStrategy> {
  const tenantKey = resolveTenantKey(host);

  // 🔭 INFRASTRUCTURE DISCOVERY (Silos)
  try {
    const storageRoot = path.join(process.cwd(), 'storage');
    console.log(`[SovereigntyEngine] Scanning infrastructure at: ${storageRoot}`);
    if (fs.existsSync(storageRoot)) {
      const items = fs.readdirSync(storageRoot, { withFileTypes: true });
      console.log(`[SovereigntyEngine] Found ${items.length} items in storage.`);
      items.filter(dirent => dirent.isDirectory()).forEach(dirent => {
        console.log(`[SovereigntyEngine] Registering Silo: ${dirent.name}`);
        registry.registerOperation({
          id: `silo_${dirent.name}`,
          name: `Silo: ${dirent.name}`,
          metadata: { type: 'silo', path: dirent.name }
        });
      });
    } else {
      console.warn(`[SovereigntyEngine] Storage root NOT FOUND at: ${storageRoot}`);
    }
  } catch (e) { console.error('[SovereigntyEngine] Silo discovery failed:', e); }

  const cached = strategyCache.get(tenantKey);
  if (cached && cached.expiresAt > Date.now()) return cached.strategy;

  const strategy = await buildStrategy(tenantKey);

  // 🛡️ INFRASTRUCTURE REFLECTION: Registramos qué motores están moviendo el sistema
  const dnaInstance = (strategy as any).local || strategy;
  const storageInstance = (strategy as any).remote || strategy;

  registry.registerOperation({
    id: 'active_strategy_adn',
    name: 'Estrategia ADN (Esquema)',
    execute: async () => {},
    metadata: { 
      active: dnaInstance.constructor.name,
      available: ['LocalStrategy', 'GitHubStrategy']
    }
  });

  registry.registerOperation({
    id: 'active_strategy_storage',
    name: 'Estrategia Almacenamiento',
    execute: async () => {},
    metadata: { 
      active: storageInstance.constructor.name,
      available: ['LocalStrategy', 'SupabaseStrategy']
    }
  });

  if (strategy.getOperations) {
    strategy.getOperations().forEach(op => registry.registerOperation(op));
  }

  strategyCache.set(tenantKey, { strategy, expiresAt: Date.now() + CACHE_TTL_MS });
  return strategy;
}
