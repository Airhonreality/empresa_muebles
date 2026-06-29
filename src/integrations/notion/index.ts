import type { IntegrationClientModule } from '@agnostic/core';
import { ConfigPanel } from './ConfigPanel';
export { ConfigPanel } from './ConfigPanel';

export const meta = {
    id: 'notion',
    name: 'Notion',
    description: 'Lee bases de datos de Notion como fuentes de registros.',
    icon: 'N',
};

const integrationModule: IntegrationClientModule = { meta, ConfigPanel };

export default integrationModule;
