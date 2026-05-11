import { DataItem, DataStrategy } from '@agnostic/core';

/**
 * 🛰️ REMOTE_JSON_STRATEGY (v1.0)
 * =============================
 * 
 * ROLE: Enables the 'Universal Engine' model. 
 * Fetches matter and modules from a remote URL (GitHub/S3/CDN).
 * 
 * This strategy is the key to 'divorcing' the Seed from the local machine.
 */
export class RemoteJSONStrategy implements DataStrategy {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  async read(context?: string): Promise<Record<string, DataItem[]>> {
    try {
      if (context) {
        const response = await fetch(`${this.baseUrl}/db/${context}.json`);
        if (!response.ok) return { [context]: [] };
        const items = await response.json();
        return { [context]: items };
      }

      // If no context, we would need a directory index or a manifest.
      // For now, we assume a manifest.json exists or return empty.
      const manifestRes = await fetch(`${this.baseUrl}/db/manifest.json`);
      if (!manifestRes.ok) return {};
      return await manifestRes.json();
    } catch (err) {
      console.error('[RemoteStrategy] Read failure:', err);
      return {};
    }
  }

  async write(data: Record<string, DataItem[]>): Promise<void> {
    // ⚠️ CRITICAL: Remote writing requires a Storage Agent or a Write-Proxy.
    // Standard CDNs/GitHub Pages are read-only.
    console.warn('[RemoteStrategy] Write requested on Read-Only remote. Ignoring.');
  }

  async delete(context: string, id: string): Promise<void> {
    console.warn('[RemoteStrategy] Delete requested on Read-Only remote. Ignoring.');
  }
}
