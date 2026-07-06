import type { IntegrationClientModule } from '@agnostic/core';
import { ConfigPanel } from './ConfigPanel';
export { ConfigPanel } from './ConfigPanel';

export const meta = {
  id: 'whatsapp',
  name: 'WhatsApp',
  description: 'Integra WhatsApp Cloud API para mensajeria y webhooks.',
  icon: 'W',
};

const integrationModule: IntegrationClientModule = { meta, ConfigPanel };

export default integrationModule;
