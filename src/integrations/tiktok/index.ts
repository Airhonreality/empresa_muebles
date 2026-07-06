import type { IntegrationClientModule } from '@agnostic/core';
import { ConfigPanel } from './ConfigPanel';
export { ConfigPanel } from './ConfigPanel';

export const meta = {
  id: 'tiktok',
  name: 'TikTok',
  description: 'Integra TikTok Business Messaging para bandeja de entrada push-only.',
  icon: 'T',
};

const integrationModule: IntegrationClientModule = { meta, ConfigPanel };

export default integrationModule;
