'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useTranslation } from '@/core/i18n/useTranslation';
import { Layers } from 'lucide-react';

// Atomic Components
import { SchemaSidebar } from './components/SchemaSidebar';
import { SystemConfigPanel } from './components/SystemConfigPanel';
import { SchemaDefinitionsPanel } from './components/SchemaDefinitionsPanel';
import { PageRoutesPanel } from './components/PageRoutesPanel';

type Tab = 'config' | 'schemas' | 'routes';

export default function SchemaBuilderPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const { state } = useAppContext();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Refactored Sidebar */}
      <SchemaSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        t={t} 
      />

      {/* Main Orchestrator */}
      <main className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth">
        {state.system.isLoading ? (
          <div className="flex h-full items-center justify-center bg-muted/5">
            <div className="flex flex-col items-center gap-6 text-muted-foreground animate-in zoom-in-95 duration-1000">
              <div className="relative">
                <Layers className="animate-pulse text-primary" size={48} />
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] opacity-40">Syncing with Materia&hellip;</span>
            </div>
          </div>
        ) : (
          <div className="container max-w-6xl py-12 px-10">
            {activeTab === 'config' && <SystemConfigPanel t={t} />}
            {activeTab === 'schemas' && <SchemaDefinitionsPanel t={t} />}
            {activeTab === 'routes' && <PageRoutesPanel t={t} />}
          </div>
        )}
      </main>
    </div>
  );
}
