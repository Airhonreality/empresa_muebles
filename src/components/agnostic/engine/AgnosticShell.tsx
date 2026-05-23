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
import { SYSTEM_NS } from '@/lib/agnostic/constants';

interface ShellProps {
  initialData: Record<string, any>;
  resolution: RouteResolution;
}

const MAX_WIDTH_MAP: Record<string, string> = {
  'sm': 'max-w-sm', 'md': 'max-w-md', 'lg': 'max-w-lg',
  'xl': 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl', '5xl': 'max-w-5xl', 'full': 'max-w-full'
};

function paddingToCss(p?: number[]): string {
  if (!p || p.length < 4) return '';
  return `${p[0]}rem ${p[1]}rem ${p[2]}rem ${p[3]}rem`;
}

export function AgnosticShell({ initialData, resolution }: ShellProps) {
  const router = useRouter();
  const { hydrate: hydrateDNA } = useDNAStore();
  const { hydrate: hydrateMateria, data: materia } = useMateriaStore();
  const { setNavigation, setActiveRecord } = useSystemStore();
  const { saveItem, deleteItem, openOverlay, closeOverlay } = useAppDispatch();

  // 1. ATOMIC HYDRATION (Only once or on data change)
  useEffect(() => {
    const routes = initialData[SYSTEM_NS.ROUTES] || [];
    const schemas = initialData[SYSTEM_NS.SCHEMAS] || [];
    hydrateDNA(routes, schemas);
    hydrateMateria(initialData);
    
    setNavigation(resolution.path);
    if (resolution.activeRecord) {
      setActiveRecord(resolution.activeRecord.id, resolution.context);
    } else {
      setActiveRecord(null, resolution.context);
    }
  }, [resolution.path, hydrateDNA, hydrateMateria, setNavigation, setActiveRecord]);

  // 🏛️ Dynamic Isomorphic Document Title Resolution (Axiomatic Principle)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pageTitle = resolution.route?.data?.title || resolution.route?.name || 'Agnostic System';
      if (resolution.activeRecord) {
        const record = resolution.activeRecord;
        const recordName = record.nombre_proyecto || record.nombre || record.name || record.title || record.id?.substring(0, 8);
        document.title = `${pageTitle} : ${recordName}`;
      } else {
        document.title = pageTitle;
      }
    }
  }, [resolution.route, resolution.activeRecord]);

  const stateRef = useRef({ data: initialData });
  stateRef.current = { data: materia || initialData };

  const liveRoutes = useDNAStore((s) => s.routes);
  const liveRoute = liveRoutes.find((r: any) => r.id === resolution.route?.id);
  const blocks = ((liveRoute?.data as any)?.blocks ?? resolution.blocks) as typeof resolution.blocks;

  const masterApi = useMemo(() => createAgnosticAPI({
    router, saveItem, deleteItem, openOverlay, closeOverlay, stateRef: stateRef as any, 
    block: { context: resolution.context }, toast, user: null
  }), [router, saveItem, deleteItem, openOverlay, closeOverlay, resolution.context]);

  const { route, activeRecord, intent, path } = resolution;
  const routeData = (route?.data || {}) as any;
  const pageLayout = (routeData.layout || {}) as any;
  const isHorizontal = pageLayout.direction === 'horizontal';

  return (
    <main className="min-h-screen bg-background">
      <div
        className={cn(
          'flex mx-auto w-full',
          isHorizontal ? 'flex-row' : 'flex-col',
          MAX_WIDTH_MAP[pageLayout.max_width] || 'max-w-full'
        )}
        style={{
          gap: `${pageLayout.gap ?? 1.5}rem`,
          padding: paddingToCss(pageLayout.padding) || '2rem',
        }}
      >
        {blocks.map((block, idx) => (
          <React.Fragment key={`${idx}-${activeRecord?.id || 'new'}`}>
            <AgnosticRenderer
              block={{ ...block, _activePath: path }}
              context={resolution.context}
              intent={intent}
              record={activeRecord}
            />
            {/* Spacer compensates for fixed-position blocks that leave the flow */}
            {(block.position === 'fixed-top' || block.position === 'fixed-bottom') && (
              <div className="shrink-0" style={{ height: block.position_height ?? 56 }} />
            )}
          </React.Fragment>
        ))}
      </div>
      <OverlayOrchestrator api={masterApi} />
    </main>
  );
}
