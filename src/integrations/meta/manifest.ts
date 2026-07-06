import type { AdapterManifest } from '@agnostic/core';

export const manifest: AdapterManifest = {
  id: 'meta',
  name: 'Meta Messaging',
  description: 'Mensajeria directa para Messenger e Instagram sobre Graph API.',
  kind: 'messaging',
  coreMinVersion: '2.0.0',
  envVars: [
    { key: 'META_PAGE_ACCESS_TOKEN', label: 'Meta Page Access Token', required: true, sensitive: true },
    { key: 'META_IG_USER_ID', label: 'Meta Instagram User ID', required: true, sensitive: true },
    { key: 'META_WEBHOOK_VERIFY_TOKEN', label: 'Meta Webhook Verify Token', required: true, sensitive: true },
    { key: 'META_APP_SECRET', label: 'Meta App Secret', required: true, sensitive: true },
  ],
  permissions: {
    network: 'outbound-api',
    outboundHosts: ['graph.facebook.com', 'graph.instagram.com'],
    runsOutsideSandbox: true,
  },
};

export default manifest;
