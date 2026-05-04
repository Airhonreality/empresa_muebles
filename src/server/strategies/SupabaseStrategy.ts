import type { DataItem, DataStrategy } from '@/core/types';

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
      let apiUrl = `${this.url}/rest/v1/records?select=id,data`;
      if (context) {
        apiUrl += `&context=eq.${context}`;
      }

      const res = await fetch(apiUrl, {
        headers: this.headers,
        cache: 'no-store'
      });

      if (!res.ok) {
        console.error(`[Supabase] Fetch failed: ${res.statusText}`);
        return context ? { [context]: [] } : {};
      }
      
      const rows = await res.json() as Array<{ id: string, data: any }>;
      
      // 2. Format rows back into DataItems
      const result: Record<string, DataItem[]> = {};
      
      rows.forEach(row => {
        // We ensure the 'id' from the DB is the one used in the app
        const item = { ...row.data, id: row.id };
        const ctx = context || 'default'; // In a full fetch, we'd need the context col too
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
          const { id, ...data } = item;
          const payload: any = {
            context,
            data
          };
          // If the item has a valid UUID, we use it for upserting
          if (id && id.length === 36) {
            payload.id = id;
          }
          allPayloads.push(payload);
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
}
