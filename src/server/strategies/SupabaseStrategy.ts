import type { DataItem, DataStrategy } from '@agnostic/core';

/**
 * 🏛️ ARTEFACTO: SupabaseStrategy.ts
 * ────────────
 * CAPA: Integrations / Adapters (Cloud Persistence Bridge)
 * VERSIÓN: 2.2
 * COMMIT: P3-M6.2-CLOUD-INTROSPECTION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Adaptador de persistencia para Supabase (Silo Cloud Determinista).
 * - Implementación del patrón 'Sovereign Records' vía JSONB.
 * - Motor de Introspección Remota (Fase 6) para descubrimiento de DNA en la nube.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Utilizar una única tabla ('records') para centralizar la materia agnóstica.
 * - MUST: Garantizar el aislamiento de datos por columna de contexto.
 * - NEVER: Bypass de RLS (Row Level Security) en producción.
 * - ALWAYS: Normalizar las respuestas de Supabase al formato DataItem[].
 * 
 * 📜 ADR [2026-05-12]: CLOUD-SELF-MAPPING
 * - CONTEXTO: Necesidad de sincronizar DNA entre silos locales y remotos sin configuración manual.
 * - DECISIÓN: El método introspect() ahora analiza los payloads JSONB para inferir tipos de datos y estructuras.
 * - APRENDIZAJE: La nube debe ser tratada como un reflejo de la voluntad del sistema, no como una DB rígida.
 * 
 * 🔑 KEYWORDS: #SupabaseStrategy #CloudBridge #Fase6 #JSONB #SovereignRecords
 */
export class SupabaseStrategy implements DataStrategy {
  constructor(
    private readonly url: string,
    private readonly key: string
  ) {}

  private get headers() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      // 1. Build the URL (filter by context if provided)
      let apiUrl = `${this.url}/rest/v1/records?select=*`;
      if (context) {
        if (context.includes(',')) {
          apiUrl += `&context=in.(${context})`;
        } else {
          apiUrl += `&context=eq.${context}`;
        }
      }

      const start = Date.now();
      const res = await fetch(apiUrl, {
        headers: this.headers,
        cache: 'no-store'
      });

      if (!res.ok) {
        console.error(`[Supabase] Fetch failed: ${res.statusText}`);
        return context ? { [context]: [] } : {};
      }
      
      const rows = await res.json() as Array<{ id: string, data: any, context: string }>;
      console.log(`[Supabase] Received ${rows.length} items in ${Date.now() - start}ms`);
      
      // 2. Format rows back into DataItems
      const result: Record<string, DataItem[]> = {};
      
      // 🏛️ PRE-FILTRADO DE SOBERANÍA: Detectar si existe el Snapshot Canónico
      const hasCanonicalManifest = rows.some(r => r.id === 'vault_manifest_core' && r.context === 'vault_manifest');

      rows.forEach(row => {
        // 🏛️ SOVEREIGN BLOCK: El manifiesto es un objeto único, no una lista expandida
        if (row.id === 'vault_manifest_core' && row.context === 'vault_manifest') {
          console.log('[Sovereignty] Canonical Manifest Block Detected.');
          if (!result['vault_manifest']) result['vault_manifest'] = [];
          result['vault_manifest'].push(row as unknown as DataItem);
          return;
        }

        // 🛡️ ENTROPY SHIELD: Si tenemos un manifiesto canónico, ignoramos registros legacy
        if (hasCanonicalManifest && row.context === 'vault_manifest' && row.id !== 'vault_manifest_core') {
          console.log(`[Sovereignty] Skipping legacy manifest record: ${row.id}`);
          return;
        }

        // --- SMART FLATTEN (Axiomatic Recovery) ---
        let rawData = row.data;
        if (rawData && rawData.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)) {
          rawData = { ...rawData.data };
        }

        const item: DataItem = { 
          id: row.id,
          context: row.context,
          data: rawData,
          created_at: (row as any).created_at || new Date().toISOString(),
          updated_at: (row as any).updated_at || new Date().toISOString()
        };
        const ctx = row.context;
        if (!result[ctx]) result[ctx] = [];
        result[ctx].push(item);
      });

      return result;
    } catch (err) {
      console.error(`[Supabase] Read Error:`, err);
      return context ? { [context]: [] } : {};
    }
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    try {
      const allPayloads: any[] = [];
      let isManifestUpdate = false;

      for (const [context, items] of Object.entries(fullDatabase)) {
        if (context === 'vault_manifest') isManifestUpdate = true;
        
        items.forEach(item => {
          allPayloads.push({
            id: item.id,
            context: item.context,
            data: item.data,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
      }

      if (allPayloads.length === 0) return;

      // 1. Massive UPSERT (Cristalización de la Voluntad)
      const res = await fetch(`${this.url}/rest/v1/records`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(allPayloads)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Supabase] Write failed: ${errText}`);
        return;
      }

      // 🏛️ ENTROPY PURGE: Solo si somos los DUEÑOS del silo (Sovereign Policy)
      if (isManifestUpdate) {
        const manifest = allPayloads.find(p => p.id === 'vault_manifest_core');
        const silos = manifest?.data?.silos || [];
        
        for (const silo of silos) {
          if (silo.policy === 'OWNER') {
            console.log(`[Sovereignty] Purging entropy for Sovereign Silo: ${silo.context}`);
            // Solo purgamos el contexto si somos dueños.
            // Nota: id != vault_manifest_core para no borrar el propio manifiesto
            await fetch(`${this.url}/rest/v1/records?context=eq.${silo.context}&id=neq.vault_manifest_core`, {
              method: 'DELETE',
              headers: this.headers
            });
          }
        }
      }
    } catch (err) {
      console.error('[Supabase] Write Error:', err);
    }
  }
  async writeContext(context: string, items: DataItem[]): Promise<void> {
    return this.write({ [context]: items });
  }

  async delete(context: string, id: string): Promise<void> {
    try {
      const res = await fetch(`${this.url}/rest/v1/records?id=eq.${id}&context=eq.${context}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Supabase] Delete failed: ${errText}`);
      }
    } catch (err) {
      console.error('[Supabase] Delete Error:', err);
    }
  }

  /**
   * 🔭 INTROSPECT: Self-mapping from Cloud JSONB.
   * Samples the 'records' table to discover contexts and their data shapes.
   */
  async introspect(): Promise<DataItem[]> {
    try {
      console.log('[Supabase] Starting Infrastructure Discovery...');
      // 🔭 ROBUST QUERY: Obtener contextos (deduplicación manual para máxima compatibilidad)
      const apiUrl = `${this.url}/rest/v1/records?select=context`;
      const res = await fetch(apiUrl, { headers: this.headers });
      
      if (!res.ok) {
        console.error(`[Supabase] Introspection fetch failed: ${res.status}`);
        return [];
      }
      
      const rawData = await res.json() as Array<{ context: string }>;
      const distinctContexts = Array.from(new Set(rawData.map(r => r.context)));
      
      console.log(`[Supabase] Found ${distinctContexts.length} total contexts in records table.`);
      
      const schemas: DataItem[] = [];

      for (const context of distinctContexts) {
        // 🛡️ META-FILTER: Ignorar contextos de gestión interna y metadatos del sistema
        const isSystem = context.startsWith('system_') || ['schema_definitions', 'page_routes', 'records'].includes(context.toLowerCase());
        if (isSystem) continue;

        // 🧬 SAMPLE ACQUISITION: Obtener un ítem para inferir la forma de la materia
        const sampleRes = await fetch(`${this.url}/rest/v1/records?context=eq.${context}&limit=1`, { headers: this.headers });
        const sampleData = await sampleRes.json() as any[];
        const sample = sampleData[0]?.data || {};

        const fields = Object.keys(sample).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          type: typeof sample[key] === 'number' ? 'number' : 'text',
          required: false,
          width: 'half'
        }));

        schemas.push({
          id: `schema_${context}_def`,
          context: 'schema_definitions',
          data: {
            name: context.charAt(0).toUpperCase() + context.slice(1).replace(/_/g, ' '),
            fields
          }
        });
      }

      console.log(`[Supabase] Introspection completed. Discovered ${schemas.length} potential schemas.`);
      return schemas;
    } catch (err) {
      console.error('[Supabase] Introspection Error:', err);
      return [];
    }
  }

  /**
   * 🏗️ UPDATE: Standard Bulk Patch
   */
  async update(context: string, patch: Record<string, unknown>, filter: Record<string, unknown>): Promise<void> {
    try {
      let apiUrl = `${this.url}/rest/v1/records?context=eq.${context}`;
      
      // Add custom filters to the query
      Object.entries(filter).forEach(([key, value]) => {
        apiUrl += `&${key}=eq.${value}`;
      });

      const res = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          ...this.headers,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(patch)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[Supabase] Update failed: ${errText}`);
      }
      
      console.log(`[Supabase] Bulk Update successful for context: ${context}`);
    } catch (err) {
      console.error('[Supabase] Update Error:', err);
      throw err;
    }
  }

  /**
   * 🔭 DISCOVERY: Expose supported operations
   */
  getOperations(): any[] {
    return [
      {
        id: 'context_migration',
        label: 'Migrar Contexto de Materia',
        description: 'Actualiza masivamente el nombre de la bóveda para todos los registros vinculados.',
        action: 'UPDATE',
        scope: 'MATERIA'
      }
    ];
  }
}
