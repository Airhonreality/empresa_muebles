import type { IntegrationClientModule } from '@agnostic/core';
import { ConfigPanel } from './ConfigPanel';

const integrationModule: IntegrationClientModule = {
    meta: {
        id: 'notion',
        name: 'Notion',
        description: 'Lee bases de datos de Notion como fuentes de registros.',
        icon: 'N',
    },
    ConfigPanel,
};

export default integrationModule;
