import type { DataItem, DataStrategy } from '@agnostic/core';

/**
 * SupabaseStrategy v2.0 (Sovereign Records Pattern)
 * 
 * This strategy uses a single 'records' table with JSONB to provide 
 * infinite flexibility to the Agnostic Schema Architect.
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
      
      rows.forEach(row => {
        // --- SMART FLATTEN (Axiomatic Recovery) ---
        // If data is double-nested (row.data.data exists), we flatten it to restore integrity.
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

      for (const [context, items] of Object.entries(fullDatabase)) {
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

      // Perform a massive UPSERT to the records table
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
}
