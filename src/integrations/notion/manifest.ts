import type { AdapterManifest } from '@agnostic/core';

/**
 * Reference adapter manifest. Copy this file's shape when building a new
 * adapter under src/integrations/<id>/manifest.ts — see Comandos CLI.md
 * ("Adapters") for the full contract.
 */
export const manifest: AdapterManifest = {
  id: 'notion',
  name: 'Notion',
  description: 'Lee bases de datos de Notion como fuentes de registros.',
  kind: 'data-source',
  coreMinVersion: '1.0.0',
  envVars: [
    { key: 'NOTION_TOKEN', label: 'Notion Internal Integration Token', required: true, sensitive: true },
  ],
  permissions: {
    network: 'outbound-api',
    outboundHosts: ['api.notion.com'],
    runsOutsideSandbox: true,
  },
};

export default manifest;
