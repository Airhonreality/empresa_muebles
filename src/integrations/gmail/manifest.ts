import type { AdapterManifest } from '@agnostic/core';

export const manifest: AdapterManifest = {
  id: 'gmail',
  name: 'Gmail API',
  description: 'Bandeja de entrada y envio de correo sobre Gmail API con Pub/Sub para notificaciones.',
  kind: 'messaging',
  coreMinVersion: '2.0.0',
  envVars: [
    { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', required: true, sensitive: true },
    { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', required: true, sensitive: true },
    { key: 'GOOGLE_REFRESH_TOKEN', label: 'Google Refresh Token', required: true, sensitive: true },
    { key: 'GMAIL_PUBSUB_TOPIC', label: 'Gmail Pub/Sub Topic', required: false, sensitive: false },
    { key: 'GMAIL_PUBSUB_VERIFICATION_AUDIENCE', label: 'Gmail Pub/Sub OIDC Audience', required: false, sensitive: false },
  ],
  permissions: {
    network: 'outbound-api',
    outboundHosts: ['gmail.googleapis.com', 'oauth2.googleapis.com', 'www.googleapis.com'],
    runsOutsideSandbox: true,
  },
};

export default manifest;
