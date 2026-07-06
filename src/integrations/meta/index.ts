import type { IntegrationClientModule } from '@agnostic/core';

export { ConfigPanel } from './ConfigPanel';
import { ConfigPanel } from './ConfigPanel';

export const meta = {
  id: 'meta',
  name: 'Meta',
  description: 'Mensajeria directa para Messenger e Instagram.',
  icon: 'M',
};

const integrationModule: IntegrationClientModule = { meta, ConfigPanel };

export default integrationModule;
