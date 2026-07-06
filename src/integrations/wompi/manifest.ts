import type { AdapterManifest } from '@agnostic/core';

export const manifest: AdapterManifest = {
  id: 'wompi',
  name: 'Wompi',
  description: 'Cobros con Wompi sobre REST nativo y webhook firmado por HMAC.',
  kind: 'payment',
  coreMinVersion: '2.0.0',
  envVars: [
    { key: 'WOMPI_PUBLIC_KEY', label: 'Wompi Public Key', required: true, sensitive: true },
    { key: 'WOMPI_PRIVATE_KEY', label: 'Wompi Private Key', required: true, sensitive: true },
    { key: 'WOMPI_EVENTS_SECRET', label: 'Wompi Events Secret', required: true, sensitive: true },
    { key: 'WOMPI_ENV', label: 'Wompi Environment', required: false, sensitive: false },
  ],
  permissions: {
    network: 'outbound-api',
    outboundHosts: ['production.wompi.co', 'sandbox.wompi.co'],
    runsOutsideSandbox: true,
  },
};

export default manifest;
