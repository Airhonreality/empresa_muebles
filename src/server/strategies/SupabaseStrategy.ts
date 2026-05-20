/**
 * 🏛️ ARTEFACTO: SupabaseStrategy.ts
 * ────────────
 * CAPA: Server (Supabase SQL Cloud Strategy)
 * VERSIÓN: 5.0
 * COMMIT: P3-M1.3-SUPABASE-STRATEGY-AXIOMATIC
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Implement standard data persistence utilizing a remote Supabase REST API.
 * - Restrict operations strictly to read, write, and remove.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Expose standard CRUD data manipulation methods.
 * - NEVER: Contain RPC DDL evolution logic (evolve, inspect, wipe) or StrategyRegistry bindings.
 * - ALWAYS: Parse returned SQL records correctly back into universal DataItem format.
 * 
 * 📜 ADR: [2026-05-16] CLOUD_STRATEGY_PRUNING
 * - DECISIÓN: Strip out custom evolution RPCs, inspect logic, and other DDL operations from the cloud engine.
 * - MOTIVO: Adherence to Suh's Axiom of Independence, decoupling physical schema alterations from the persistence layer.
 * - IMPACTO: 100+ lines of code pruned, and simplified interface matching the new 3-method Adapter contract.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [storage.ts]
 * - DOWNSTREAM: [getStrategy.ts]
 */

import type { 
  DataItem, 
  AgnosticBridge, 
  AgnosticCapabilities, 
  AgnosticQuery 
} from '@agnostic/core';

export class SupabaseStrategy implements AgnosticBridge {
  constructor(
    private readonly url: string,
    private readonly key: string
  ) {}

  /**
   * Describes the cloud SQL storage capabilities.
   */
  readonly capabilities: AgnosticCapabilities = {
    storageType: 'SQL',
    isRelational: true
  };

  private get headers() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  // ─── CRUD OPERATIONS ───────────────────────────────────────────────────────

  /**
   * Reads records from dedicated tables using PostgREST syntax.
   */
  async read(namespace: string, query?: AgnosticQuery): Promise<DataItem[]> {
    try {
      let apiUrl = `${this.url}/rest/v1/${namespace}?select=*`;
      
      if (query?.where) {
        Object.entries(query.where).forEach(([k, v]) => {
          apiUrl += `&${k}=eq.${v}`;
        });
      }

      const res = await fetch(apiUrl, {
        headers: this.headers,
        cache: 'no-store'
      });

      if (!res.ok) {
        console.error(`[SupabaseStrategy] Read failed for ${namespace}: ${res.statusText}`);
        return [];
      }
      
      const rows = await res.json() as any[];
      return rows.map(row => ({
        id: row.id,
        context: row.context || namespace,
        data: row.data || row,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (err) {
      console.error(`[SupabaseStrategy] Read Error:`, err);
      return [];
    }
  }

  /**
   * Writes a record atomically using upsert ( resolution=merge-duplicates ).
   */
  async write(namespace: string, record: Partial<DataItem> & { data: Record<string, unknown> }): Promise<DataItem> {
    try {
      const id = record.id || globalThis.crypto.randomUUID();
      const payload = {
        id,
        context: namespace,
        data: record.data,
        updated_at: new Date().toISOString()
      };

      const res = await fetch(`${this.url}/rest/v1/${namespace}`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify([payload])
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[SupabaseStrategy] Write failed: ${errText}`);
      }

      const rows = await res.json();
      const row = rows[0] || payload;
      return {
        id: row.id,
        context: namespace,
        data: row.data || row,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (err) {
      console.error('[SupabaseStrategy] Write Error:', err);
      throw err;
    }
  }

  /**
   * Removes a single record by ID using delete PostgREST request.
   */
  async remove(namespace: string, id: string): Promise<void> {
    try {
      const apiUrl = `${this.url}/rest/v1/${namespace}?id=eq.${id}`;
      const res = await fetch(apiUrl, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
    } catch (err) {
      console.error('[SupabaseStrategy] Remove Error:', err);
      throw err;
    }
  }
}
