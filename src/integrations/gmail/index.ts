import type { IntegrationClientModule } from '@agnostic/core';
import { ConfigPanel } from './ConfigPanel';

export { ConfigPanel } from './ConfigPanel';
export { GmailAdapter, previewGmailSendMessage, reconcileGmailPubSubNotification } from './adapter';
export { manifest } from './manifest';

export const meta = {
  id: 'gmail',
  name: 'Gmail API',
  description: 'Bandeja de entrada y envio de correo sobre Gmail API con Pub/Sub.',
  icon: 'G',
};

const integrationModule: IntegrationClientModule = { meta, ConfigPanel };

export default integrationModule;
