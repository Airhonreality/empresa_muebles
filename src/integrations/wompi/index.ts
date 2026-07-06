import type { IntegrationClientModule } from '@agnostic/core';
import { ConfigPanel } from './ConfigPanel';
export { ConfigPanel } from './ConfigPanel';

export const meta = {
  id: 'wompi',
  name: 'Wompi',
  description: 'Integra Wompi para cobros, estados asincronos y webhooks firmados.',
  icon: 'W',
};

const integrationModule: IntegrationClientModule = { meta, ConfigPanel };

export default integrationModule;
