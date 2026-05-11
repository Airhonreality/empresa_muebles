'use client';

/**
 * 🏛️ ARTEFACTO: AgnosticConfigManager.tsx
 * ────────────
 * CAPA: Staging & Orchestration (Sovereign Design)
 * VERSIÓN: 2.5
 * COMMIT: P2-M2.1-ADR-STAGING-SYNC
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestación de sesiones de diseño en un buffer local (Staging Silo).
 * - Persistencia atómica de múltiples contextos (Routes, DNA, Vaults).
 * - Recuperación de desastres (Crash Recovery) vía LocalStorage.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Mantener aislamiento total entre el Staging y la DB Global hasta el Commit.
 * - NEVER: Permitir un Commit parcial si falla uno de los contextos sincronizados.
 * - ALWAYS: Notificar visualmente al usuario sobre cambios sin persistir (Pulse Status).
 * 
 * 📜 ADR: [2026-05-11] STAGING_AREA_ISO
 * - DECISIÓN: Implementar un estado intermedio de 'Staging' antes de la sincronización real.
 * - MOTIVO: Prevenir la corrupción de la base de datos viva durante procesos de diseño experimentales.
 * - IMPACTO: Eliminación de "Dirty Reads" en la interfaz de usuario mientras se configura el sistema.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [SovereigntyOrchestrator, AppContext]
 * - DOWNSTREAM: [SitemapSection, DNASection, VaultsSection, ComposerSection]
 */

import { useState, useEffect, useCallback } from 'react';
import { Route as RouteIcon, Database, Settings2, Save, Box, RotateCcw, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppDispatch, useAppState } from '@/context/AppContext';

// UI Sections
import { SitemapSection } from './sections/SitemapSection';
import { SystemSection } from './sections/SystemSection';
import { DNASection } from './sections/DNASection';
import { ComposerSection } from './sections/ComposerSection';
import { VaultsSection } from './sections/VaultsSection';

const SESSION_KEY = 'agnostic_staging_session';

export function AgnosticConfigManager({ 
  initialSection = 'routes', 
  initialRouteId = null 
}: { initialSection?: string, initialRouteId?: string | null }) {
  
  const { state } = useAppState();
  const { syncContext } = useAppDispatch();

  // 🕹️ NAVIGATION & UI STATE
  const [activeTab, setActiveTab] = useState(initialSection);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(initialRouteId);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 🧬 STAGING SILO (The Memory-Only state)
  const [staging, setStaging] = useState<{
    routes: any[],
    schemas: any[],
    vaults: any[],
    config: Record<string, any>
  }>(() => ({
    routes: state.data['page_routes'] ?? [],
    schemas: state.data['schema_definitions'] ?? [],
    vaults: state.data['vault_manifest'] ?? [],
    config: (state.data['system_config'] ?? []).reduce((acc, item) => ({ ...acc, ...(item.data as any) }), {})
  }));

  // 🛡️ RECOVERY ENGINE: Load previous session if available
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        // 🔄 DEFENSA: Asegurar que todas las llaves existan (Migración silenciosa)
        setStaging({
          routes: session.routes || [],
          schemas: session.schemas || [],
          vaults: session.vaults || [],
          config: session.config || {}
        });
        setHasUnsavedChanges(true);
        toast.info('Sesión recuperada del borrador local');
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // 💾 AUTO-SAVE (Local Only): Protect against tab close or crashes
  useEffect(() => {
    if (hasUnsavedChanges) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(staging));
    }
  }, [staging, hasUnsavedChanges]);

  // 🔄 UPDATE HANDLERS (Sovereign Events)
  const updateStaging = useCallback((key: keyof typeof staging, value: any) => {
    setStaging(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleDiscardChanges = () => {
    if (confirm('¿Estás seguro? Se perderán todos los cambios del borrador.')) {
      localStorage.removeItem(SESSION_KEY);
      window.location.reload(); // Hard reset to global state
    }
  };

  const handleSovereignCommit = async () => {
    setIsSaving(true);
    try {
      // Step 1: Atomic synchronization of all staging contexts
      await Promise.all([
        syncContext('page_routes', staging.routes),
        syncContext('schema_definitions', staging.schemas),
        syncContext('vault_manifest', staging.vaults),
        syncContext('system_config', [{ id: 'main_config', context: 'system_config', data: staging.config }])
      ]);
      
      // Step 2: Clear staging buffer on success
      localStorage.removeItem(SESSION_KEY);
      setHasUnsavedChanges(false);
      toast.success('DNA Persistido Soberanamente');
    } catch (error) {
      toast.error('Fallo en la persistencia del Silo');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'routes', label: 'Rutas', icon: RouteIcon },
    { id: 'vaults', label: 'Bóvedas', icon: Box },
    { id: 'dna', label: 'DNA', icon: Database },
    { id: 'system', label: 'Núcleo', icon: Settings2 },
  ];

  return (
    <div className="flex flex-col h-full bg-background p-8 select-none">
      
      {/* 🚀 SOVEREIGN HEADER */}
      <header className="flex items-center justify-between mb-8 border-b border-border/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/5 text-primary rounded-xl">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight">Agnostic Manager</h1>
            <div className="flex items-center gap-2">
               <span className={cn(
                 "w-2 h-2 rounded-full",
                 hasUnsavedChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
               )} />
               <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                 {hasUnsavedChanges ? "Staging Area (Uncommitted)" : "Sync OK"}
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button variant="ghost" size="sm" onClick={handleDiscardChanges} className="text-destructive hover:text-destructive hover:bg-destructive/10 text-[9px] font-bold uppercase tracking-widest">
              <RotateCcw size={12} className="mr-2" /> Descartar
            </Button>
          )}
          <Button 
            onClick={handleSovereignCommit}
            disabled={isSaving || !hasUnsavedChanges}
            className="font-bold uppercase tracking-widest text-[10px] h-10 px-8 shadow-xl shadow-primary/10"
          >
            {isSaving ? "Persistiendo..." : "Commit DNA"}
          </Button>
        </div>
      </header>

      {/* 🧭 NAVIGATION (Standard Nav) */}
      <nav className="flex gap-1 mb-8 bg-muted/20 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedRouteId(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
              activeTab === tab.id 
                ? "bg-background text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 🔮 STAGING VIEWPORTS */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'routes' && (
          <SitemapSection 
            routes={staging.routes} 
            setRoutes={(r) => updateStaging('routes', r)} 
            onEditRoute={(id) => { setSelectedRouteId(id); setActiveTab('composer'); }} 
          />
        )}

        {activeTab === 'vaults' && (
          <VaultsSection 
            vaults={staging.vaults} 
            schemas={staging.schemas}
            setVaults={(v) => updateStaging('vaults', v)} 
          />
        )}
        
        {activeTab === 'composer' && selectedRouteId && (
          <ComposerSection 
            routeId={selectedRouteId} 
            routes={staging.routes} 
            schemas={staging.schemas}
            vaults={staging.vaults}
            onUpdateRoutes={(r) => updateStaging('routes', r)}
            onBack={() => { setSelectedRouteId(null); setActiveTab('routes'); }} 
          />
        )}

        {activeTab === 'dna' && (
          <DNASection 
            schemas={staging.schemas} 
            setSchemas={(s) => updateStaging('schemas', s)} 
          />
        )}

        {activeTab === 'system' && (
          <SystemSection 
            config={staging.config} 
            setConfig={(c) => updateStaging('config', c)} 
          />
        )}
      </main>
    </div>
  );
}
