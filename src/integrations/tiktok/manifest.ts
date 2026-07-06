import type { AdapterManifest } from '@agnostic/core';

export const manifest: AdapterManifest = {
  id: 'tiktok',
  name: 'TikTok Business Messaging',
  description: 'Mensajeria directa para TikTok Business Messaging sobre REST firmado con HMAC.',
  kind: 'messaging',
  coreMinVersion: '2.0.0',
  envVars: [
    { key: 'TIKTOK_CLIENT_ID', label: 'TikTok Client ID', required: true, sensitive: true },
    { key: 'TIKTOK_CLIENT_SECRET', label: 'TikTok Client Secret', required: true, sensitive: true },
    { key: 'TIKTOK_ACCESS_TOKEN', label: 'TikTok Access Token', required: true, sensitive: true },
    { key: 'TIKTOK_REFRESH_TOKEN', label: 'TikTok Refresh Token', required: true, sensitive: true },
    { key: 'TIKTOK_REFRESH_TOKEN_EXPIRES_AT', label: 'TikTok Refresh Token Expires At', required: false, sensitive: false },
  ],
  permissions: {
    network: 'outbound-api',
    outboundHosts: ['business-api.tiktok.com'],
    runsOutsideSandbox: true,
  },
};

export default manifest;
