/**
 * 🏛️ ARTEFACTO: sovereignty.ts
 * ────────────
 * CAPA: Types (Shared Contracts)
 * VERSIÓN: 1.0
 * COMMIT: P3-M1.1-TS-SOVEREIGNTY-CONTRACT
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Definición de tipos canónicos para el Sistema de Soberanía.
 * - Contratos de configuración para Estrategias de Datos y ADN.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Reflejar exactamente las capacidades del motor de orquestación.
 * - NEVER: Usar tipos genéricos (any) para la configuración maestra del sistema.
 */

export type StrategyType = 'LocalStrategy' | 'GitHubStrategy' | 'SupabaseStrategy';

export interface MasterPassport {
  project_identity: string;
  dna_strategy: StrategyType;
  storage_strategy: StrategyType;
  github_owner?: string;
  github_repo?: string;
  sovereign_mode?: 'PURE' | 'HYBRID';
}
