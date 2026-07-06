/**
 * AdapterManifest — canonical description of an installable integration adapter.
 *
 * Every adapter under src/integrations/<id>/ must ship a manifest.ts exporting
 * a `manifest: AdapterManifest` (id === folder name === agnostic.config.ts key).
 * `agno install/list-adapters/remove-adapter` (scripts/agno-adapters.ts) read
 * this shape to register/unregister adapters and to run collision + permission
 * checks before writing anything.
 */

export interface AdapterEnvVar {
  key: string;
  label: string;
  required: boolean;
  sensitive: boolean;
}

export type AdapterKind = 'data-source' | 'messaging' | 'payment' | 'llm' | 'other';

export interface AdapterPermissions {
  network: 'none' | 'outbound-api';
  /** Hosts the adapter calls out to. Informational; not enforced yet. */
  outboundHosts?: string[];
  /**
   * Must be true whenever `network !== 'none'`. The zap sandbox
   * (src/app/api/engine/route.ts) has no fetch/fs/process, so any adapter
   * that talks to the network must run inside a real API route, never a zap.
   */
  runsOutsideSandbox: boolean;
}

export interface AdapterManifest {
  /** Must equal the src/integrations/<id> folder name and the agnostic.config.ts integrations key. */
  id: string;
  name: string;
  description: string;
  kind: AdapterKind;
  /** Informational — packages/core version this adapter was built against. No enforcement yet. */
  coreMinVersion: string;
  envVars: AdapterEnvVar[];
  /** storage/db/schema_definitions.json schema names this adapter expects to exist. */
  requiresSchemas?: string[];
  permissions: AdapterPermissions;
}
