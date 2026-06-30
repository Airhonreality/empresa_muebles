'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useDNAStore, useMateriaStore, useSystemStore } from '@/lib/agnostic/store';
import { AgnosticRenderer } from '@/components/agnostic/engine/AgnosticRenderer';
import { RouteResolution } from '@/lib/agnostic/resolver';
import { cn } from '@/lib/utils';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { useSyncPulse } from '@/hooks/useSyncPulse';

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
  const { hydrate: hydrateDNA }             = useDNAStore();
  const { hydrate: hydrateMateria }         = useMateriaStore();
  const { setNavigation, setActiveRecord }  = useSystemStore();

  // Watch the primary data context of this page for remote changes.
  // When another user writes to the same namespace, the SHA changes and
  // the store refreshes automatically — no full page reload required.
  const watchedNamespaces = useMemo(
    () => (resolution.context ? [resolution.context] : []),
    [resolution.context]
  );
  useSyncPulse(watchedNamespaces);

  // Hydrate Zustand ONCE per navigation — SSR data flows into client stores
  useEffect(() => {
    const routes  = initialData[SYSTEM_NS.ROUTES]  || [];
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

  // Document title — driven by route title + active record name
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pageTitle = (resolution.route?.data as any)?.title || 'Agnostic';
    if (resolution.activeRecord) {
      const r = resolution.activeRecord as any;
      const name = r.nombre_proyecto || r.nombre || r.name || r.title || (r.id as string)?.substring(0, 8);
      document.title = `${pageTitle} : ${name}`;
    } else {
      document.title = pageTitle;
    }
  }, [resolution.route, resolution.activeRecord]);

  const liveRoutes = useDNAStore((s) => s.routes);
  const liveRoute  = liveRoutes.find((r: any) => r.id === resolution.route?.id);
  const liveData   = (liveRoute?.data as any) ?? (resolution.route?.data as any);
  const blocks     = (liveData?.blocks ?? resolution.blocks) as typeof resolution.blocks;

  const { route, activeRecord, intent, path } = resolution;
  const routeData   = (route?.data || {}) as any;
  const pageLayout  = (routeData.layout || {}) as any;
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
          gap:     `${pageLayout.gap ?? 1.5}rem`,
          padding: paddingToCss(pageLayout.padding) || 'var(--ag-page-padding)',
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
            {(block.position === 'fixed-top' || block.position === 'fixed-bottom') && (
              <div className="shrink-0" style={{ height: (block as any).position_height ?? 56 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </main>
  );
}
