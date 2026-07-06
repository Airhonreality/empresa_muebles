import type { AdapterManifest } from '@agnostic/core';

export const manifest: AdapterManifest = {
  id: 'whatsapp',
  name: 'WhatsApp Cloud API',
  description: 'Envio y recepcion de mensajes via WhatsApp Cloud API sobre Graph REST.',
  kind: 'messaging',
  coreMinVersion: '2.0.0',
  envVars: [
    { key: 'WHATSAPP_ACCESS_TOKEN', label: 'WhatsApp Access Token', required: true, sensitive: true },
    { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'WhatsApp Phone Number ID', required: true, sensitive: true },
    { key: 'WHATSAPP_WABA_ID', label: 'WhatsApp WABA ID', required: true, sensitive: true },
    { key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', label: 'WhatsApp Webhook Verify Token', required: true, sensitive: true },
    { key: 'WHATSAPP_APP_SECRET', label: 'WhatsApp App Secret', required: true, sensitive: true },
  ],
  permissions: {
    network: 'outbound-api',
    outboundHosts: ['graph.facebook.com'],
    runsOutsideSandbox: true,
  },
};

export default manifest;
