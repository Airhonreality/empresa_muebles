'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { AgnosticForm } from './AgnosticForm';
import { AgnosticModuleLoader } from './AgnosticModuleLoader';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { toast } from 'sonner';
import * as LucideIcons from 'lucide-react';

// --- Placeholder components for the Base Library ---
const AgnosticHero = ({ title, description }: any) => (
  <div className="py-24 px-8 glass-card rounded-3xl text-center space-y-4">
    <h1 className="text-6xl font-black tracking-tighter gold-gradient-text">{title}</h1>
    <p className="text-xl text-muted-foreground italic max-w-2xl mx-auto">{description}</p>
  </div>
);

const AgnosticTable = ({ schemaId }: any) => (
  <div className="p-12 border-2 border-dashed border-primary/20 rounded-3xl text-center">
    <p className="text-xs font-black uppercase tracking-[0.4em] opacity-20">Agnostic Table for '{schemaId}' coming soon...</p>
  </div>
);

/**
 * CustomActorBridge: The Bridge for Radical Injection.
 */
const CustomActorBridge = ({ moduleName, api }: { moduleName: string, api: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      setIsReady(true);
    }
  }, []);

  return (
    <div className="w-full min-h-[100px] relative">
      <div ref={containerRef} className="w-full h-full" id={`custom-module-${moduleName}`} />
      
      {isReady && containerRef.current && (
        <AgnosticModuleLoader 
          moduleName={moduleName} 
          api={{ ...api, container: containerRef.current }}
        />
      )}
    </div>
  );
};

/**
 * AgnosticRenderer: The Universal Projector.
 */
export function AgnosticRenderer({ block }: { block: any }) {
  const { user } = useAuth();
  const router = useRouter();
  const { state } = useAppState();
  const { saveItem, deleteItem } = useAppDispatch();

  // STABILITY: Memoize the API to prevent infinite reload loops
  // Now includes full data orchestration capabilities
  const commonApi = useMemo(() => ({
    user,
    router,
    state,
    renderIcon: (name: string, props = {}) => {
      const Icon = (LucideIcons as any)[name];
      if (!Icon) return '';
      const icons: any = {
        Plus: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
        Save: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
        Trash2: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>',
        ChevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
        User: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        Layers: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91a1 1 0 0 0 0-1.83Z"/><path d="m2.6 12.08 8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91"/><path d="m2.6 17.08 8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91"/></svg>'
      };
      return icons[name] || '';
    },
    getGlobalData: (context: string) => state.data[context] || [],
    saveItem,
    deleteItem,
    // Harmony Listener Bridge
    onUpdate: (context: string, callback: (data: any) => void) => {
       // Note: In a real implementation, this would subscribe to a specific slice
       // For now, it's a proxy to the state update
       callback(state.data);
    }
  }), [user, router, state, saveItem, deleteItem]);

  try {
    switch (block.type) {
      case 'hero':
        return <AgnosticHero {...block} />;
      
      case 'form':
        return (
          <AgnosticForm 
            schemaId={block.schemaId} 
            title={block.title} 
            description={block.description} 
            logicModule={block.moduleName}
          />
        );

      case 'table':
        return <AgnosticTable schemaId={block.schemaId} />;

      case 'custom':
        return <CustomActorBridge moduleName={block.moduleName} api={commonApi} />;

      default:
        return (
          <div className="p-4 bg-destructive/5 text-destructive rounded-xl text-[10px] font-bold">
            Unknown Actor Type: {block.type}
          </div>
        );
    }
  } catch (err) {
    console.error('[AgnosticRenderer] Critical Projection Failure:', err);
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-3xl text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-destructive">Actor Projection Error</p>
      </div>
    );
  }
}
