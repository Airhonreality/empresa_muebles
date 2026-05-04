import type { DataItem, DataStrategy } from '@/core/types';

/**
 * SupabaseStrategy (PostgREST Implementation)
 * 
 * Interconnects the Satellite with the Supabase giant 
 * using the standard REST API for maximum performance.
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
      if (!context) {
        // In a Multi-Tenant world, we might need a meta-fetch or just return empty
        // For now, we fetch the requested entity
        return {};
      }

      const res = await fetch(`${this.url}/rest/v1/${context}?select=*`, {
        headers: this.headers,
        cache: 'no-store'
      });

      if (!res.ok) return { [context]: [] };
      
      const data = await res.json();
      return { [context]: data };
    } catch (err) {
      console.error(`[SupabaseStrategy] Read Error for ${context}:`, err);
      return { [context || 'error']: [] };
    }
  }

  async write(fullDatabase: Record<string, DataItem[]>): Promise<void> {
    try {
      // We iterate through contexts and upsert them into their respective tables
      for (const [tableName, items] of Object.entries(fullDatabase)) {
        await fetch(`${this.url}/rest/v1/${tableName}`, {
          method: 'POST',
          headers: {
            ...this.headers,
            'Prefer': 'resolution=merge-duplicates' // UPSERT logic
          },
          body: JSON.stringify(items)
        });
      }
    } catch (err) {
      console.error('[SupabaseStrategy] Write Error:', err);
    }
  }
}
