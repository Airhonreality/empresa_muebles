import type React from 'react';

export interface IntegrationMeta {
    id: string;
    name: string;
    description: string;
    icon?: string;
}

export interface IntegrationSource {
    id: string;
    name: string;
    recordCount?: number;
}

export interface IntegrationConfigPanelProps {
    envPresence: Record<string, boolean>;
    onSave: (vars: Record<string, string>) => Promise<void>;
}

export interface IntegrationClientModule {
    meta: IntegrationMeta;
    ConfigPanel: React.ComponentType<IntegrationConfigPanelProps>;
}

export type IntegrationClientLoader = () => Promise<IntegrationClientModule>;
