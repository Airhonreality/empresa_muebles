/**
 * 🏛️ ARTEFACTO: storage.ts
 * ────────────
 * CAPA: Core (Unified Persistence Interface)
 * VERSIÓN: 5.0
 * COMMIT: P3-M1.1-AXIOMATIC-ADAPTER-CONTRACT
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Define the canonical interface for data adapters.
 * - Standardize query capabilities and storage properties.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Expose exactly three data methods: read, write, and remove.
 * - NEVER: Contain any environment-specific database or filesystem logic.
 * - ALWAYS: Keep operations centered around the universal DataItem structure.
 * 
 * 📜 ADR: [2026-05-16] AXIOMATIC_ADAPTER_REFACTOR
 * - DECISIÓN: Reduce the 7 complex DML/DDL actions of AgnosticBridge to 3 basic CRUD methods (read, write, remove).
 * - MOTIVO: Adherence to Suh's Independence Axiom by decoupling schema evolution from data persistence.
 * - IMPACTO: Elimination of 700 lines of redundant/over-engineered framework bureaucracy.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [indra.ts]
 * - DOWNSTREAM: [LocalStrategy.ts, SupabaseStrategy.ts, GitHubStrategy.ts, route.ts]
 */

import { DataItem } from './indra';

/**
 * Declares the system's operational and architectural limitations.
 * Used by the UI to dynamically toggle storage-specific controls.
 */
export interface AgnosticCapabilities {
  storageType: 'FILE' | 'SQL' | 'NOSQL' | 'GIT';
  isRelational: boolean;
}

/**
 * Represents structured constraints for database or file queries.
 */
export interface AgnosticQuery {
  where?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: { column: string; order: 'asc' | 'desc' };
}

/**
 * The unified contract for data strategies.
 * All persistence engines (filesystem, SQL, Git) must implement this interface.
 */
export interface AgnosticBridge {
  readonly capabilities: AgnosticCapabilities;

  /**
   * Retrieves a list of records under a specific namespace, applying filter options if provided.
   */
  read(namespace: string, query?: AgnosticQuery): Promise<DataItem[]>;

  /**
   * Persists or updates a single record under a specific namespace.
   * Merges fields if the ID already exists, or generates a new one.
   */
  write(namespace: string, record: Partial<DataItem> & { data: Record<string, unknown> }): Promise<DataItem>;

  /**
   * Deletes a record from a specific namespace using its unique identifier.
   */
  remove(namespace: string, id: string): Promise<void>;

  // ─── OPTIONAL REFACTORING API (Optimized Operations) ──────────────────────
  
  /** Renames a collection physically without iterating records */
  renameCollection?(fromNamespace: string, toNamespace: string): Promise<void>;
  
  /** Renames a field across all records in a collection */
  renameField?(namespace: string, oldKey: string, newKey: string): Promise<void>;
  
  /** Deletes a field from all records in a collection */
  deleteField?(namespace: string, key: string): Promise<void>;
}
