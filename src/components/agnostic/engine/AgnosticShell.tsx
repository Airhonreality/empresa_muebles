'use client';

/**
 * 🏛️ ARTEFACTO: AgnosticShell.tsx
 * ────────────
 * CAPA: Projection (Deterministic Shell)
 * VERSIÓN: 1.0
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Carcasa liviana para la proyección de bloques.
 * - Hidratación única de Zustand desde el servidor.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useDNAStore, useMateriaStore, useSystemStore } from '@/lib/agnostic/store';
import { AgnosticRenderer } from '@/components/agnostic/engine/AgnosticRenderer';
import { OverlayOrchestrator } from '@/components/agnostic/engine/OverlayOrchestrator';
import { RouteResolution } from '@/lib/agnostic/resolver';
import { cn } from '@/lib/utils';
import { createAgnosticAPI } from '@agnostic/core';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppDispatch } from '@/context/AppContext';

interface ShellProps {
  initialData: Record<string, any>;
  resolution: RouteResolution;
}

export function AgnosticShell({ initialData, resolution }: ShellProps) {
  const router = useRouter();
  const { hydrate: hydrateDNA } = useDNAStore();
  const { hydrate: hydrateMateria, data: materia } = useMateriaStore();
  const { setNavigation, setActiveRecord, isLoading } = useSystemStore();
  const { saveItem, deleteItem, openOverlay, closeOverlay } = useAppDispatch();

  // 1. ATOMIC HYDRATION (Only once or on data change)
  useEffect(() => {
    const routes = initialData['page_routes'] || [];
    const schemas = initialData['schema_definitions'] || [];
    hydrateDNA(routes, schemas);
    hydrateMateria(initialData);
    
    setNavigation(resolution.path);
    if (resolution.activeRecord) {
      setActiveRecord(resolution.activeRecord.id, resolution.context);
    }
  }, [initialData, resolution]);

  const stateRef = useRef({ data: initialData });
  stateRef.current = { data: materia || initialData };

  const masterApi = useMemo(() => createAgnosticAPI({
    router, saveItem, deleteItem, openOverlay, closeOverlay, stateRef, 
    block: { context: resolution.context }, toast
  }), [router, saveItem, deleteItem, openOverlay, closeOverlay, resolution.context]);

  const { route, blocks, activeRecord, intent, path } = resolution;
  const routeData = route?.data || {};
  const layoutConfig = routeData.layout || { direction: 'vertical', sizing: 'fill', padding: [4, 4, 4, 4], gap: 1.5 };

  return (
    <main 
      className={cn(
        "agnostic-frame min-h-screen bg-background transition-all duration-500",
        layoutConfig.clip !== false && "overflow-hidden"
      )}
      style={{
        display: 'flex',
        flexDirection: layoutConfig.direction === 'horizontal' ? 'row' : 'column',
        gap: `${layoutConfig.gap || 0}rem`,
        paddingTop: `${layoutConfig.padding?.[0] || 0}rem`,
        paddingRight: `${layoutConfig.padding?.[1] || 0}rem`,
        paddingBottom: `${layoutConfig.padding?.[2] || 0}rem`,
        paddingLeft: `${layoutConfig.padding?.[3] || 0}rem`,
        alignItems: layoutConfig.align?.includes('c') ? 'center' : (layoutConfig.align?.includes('r') ? 'flex-end' : 'flex-start'),
        justifyContent: layoutConfig.align?.includes('m') ? 'center' : (layoutConfig.align?.includes('b') ? 'flex-end' : 'flex-start'),
      } as React.CSSProperties}
    >
      <div className={cn(
        "flex",
        layoutConfig.direction === 'horizontal' ? 'flex-row' : 'flex-col',
        layoutConfig.sizing === 'fill' ? 'w-full flex-1' : 'w-auto'
      )}
      style={{ gap: `${layoutConfig.gap || 0}rem` }}
      >
        {blocks.map((block, idx) => (
          <div key={`${idx}-${activeRecord?.id || 'new'}`} className="w-full">
            <AgnosticRenderer 
              block={{ ...block, _activePath: path }} 
              context={resolution.context}
              intent={intent}
              record={activeRecord}
            />
          </div>
        ))}
      </div>
      <OverlayOrchestrator api={masterApi} />
    </main>
  );
}
