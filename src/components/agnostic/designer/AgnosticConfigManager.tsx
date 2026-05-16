'use client';

import { useState } from 'react';
import { Route as RouteIcon, Database, Settings2, Box, RotateCcw, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppDispatch } from '@/context/AppContext';
import { useMateriaStore } from '@/lib/agnostic/store';
import { MasterPassport } from '@/types/sovereignty';

// UI Sections
import { SitemapSection } from './sections/SitemapSection';
import { SystemSection } from './sections/SystemSection';
import { DNASection } from './sections/DNASection';
import { VaultsSection } from './sections/VaultsSection';

/**
 * 🏛️ ARTEFACTO: AgnosticConfigManager.tsx
 * ────────────
 * CAPA: Designer (Governance Orchestration)
 * VERSIÓN: 2.0
 * COMMIT: P3-M2.6-ADR-PURE-PASSPORT-RESOLUTION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestación de la configuración de rutas, esquemas y soberanía.
 * - Punto de entrada para la administración del ADN del satélite.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Resolver el Pasaporte Maestro de forma directa (Sin reduce() contaminante).
 * - NEVER: Permitir la mezcla de contextos de configuración heterogéneos.
 * - ALWAYS: Garantizar que los cambios se cristalicen con el ID 'master_passport'.
 */
export function AgnosticConfigManager({ 
  initialSection = 'routes', 
  initialRouteId = null 
}: { initialSection?: string, initialRouteId?: string | null }) {
  
  const { data: materia } = useMateriaStore();
  const { saveItem, saveContext, refreshStore } = useAppDispatch();

  const [activeTab, setActiveTab] = useState(initialSection);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(initialRouteId);

  // 🔭 PURE RESOLUTION: Direct find instead of polluting reduce()
  const routes = materia['page_routes'] ?? [];
  const schemas = materia['schema_definitions'] ?? [];
  const vaults = materia['vault_manifest'] ?? [];
  
  const passportItem = (materia['system_config'] ?? []).find(item => item.id === 'master_passport');
  const config = (passportItem?.data as MasterPassport) ?? {};

  const handleRefresh = async () => {
    await refreshStore();
    toast.success('Realidad sincronizada');
  };

  const handleUpdateConfig = async (newConfig: any) => {
    // 🛡️ ENFORCE SOBERIGNTY ID
    await saveItem('system_config', { id: 'master_passport', data: newConfig });
  };

  const handleBulkUpdateRoutes = async (newRoutes: any[]) => {
    await saveContext('page_routes', newRoutes);
  };

  const tabs = [
    { id: 'routes', label: 'Rutas', icon: RouteIcon },
    { id: 'vaults', label: 'Bóvedas', icon: Box },
    { id: 'dna', label: 'DNA', icon: Database },
    { id: 'system', label: 'Núcleo', icon: Settings2 },
  ];

  return (
    <div className="flex flex-col h-full bg-background p-8 select-none">
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Agnostic Manager</h1>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500" />
               <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                 Sincronización Atómica Activa
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="font-bold text-xs rounded-xl">
            <RotateCcw size={14} className="mr-2" /> Refrescar Realidad
          </Button>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="flex gap-1 mb-8 bg-muted/30 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedRouteId(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
              activeTab === tab.id 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* VIEWPORTS */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'routes' && (
          <SitemapSection 
            routes={routes} 
            setRoutes={handleBulkUpdateRoutes} 
            onEditRoute={(id) => { setSelectedRouteId(id); setActiveTab('composer'); }} 
          />
        )}

        {activeTab === 'vaults' && (
          <VaultsSection 
            vaults={vaults} 
            schemas={schemas}
            setVaults={async (v) => await saveContext('vault_manifest', v)} 
          />
        )}
        
        {activeTab === 'dna' && (
          <DNASection 
            schemas={schemas} 
            setSchemas={async (s) => await saveContext('schema_definitions', s)} 
            routes={routes}
            setRoutes={handleBulkUpdateRoutes}
            vaults={vaults}
          />
        )}

        {activeTab === 'system' && (
          <SystemSection 
            config={config} 
            setConfig={handleUpdateConfig} 
          />
        )}
      </main>
    </div>
  );
}
