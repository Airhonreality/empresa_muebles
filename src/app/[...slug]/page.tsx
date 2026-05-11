'use client';

/**
 * 🏛️ ARTEFACTO: page.tsx (MasterRoute)
 * ────────────
 * CAPA: Orchestration (Deterministic Entry Point)
 * VERSIÓN: 8.0
 * COMMIT: P3-M2.1-DETERMINISTIC-ORCHESTRATION
 * ADR: [adr_v8_0_deterministic_state.md]
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestación de la transición de Materia (Data) a Proyección (UI).
 * - Resolución dinámica de rutas y gestión de identidad de página (PageRecord).
 * - Sincronización del estado del sistema con el enrutador de Next.js.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Garantizar la provisión síncrona del PageRecordContext.
 * - NEVER: Contener lógica de persistencia directa (delegar a AppContext).
 * - NEVER: Importar bloques individuales (delegar a AgnosticRenderer).
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [SystemStore, DNAStore, Next.js Router]
 * - DOWNSTREAM: [AgnosticRenderer, ProjectSelector, OverlayOrchestrator]
 */
import { useDNAStore, useMateriaStore, useSystemStore, useActiveRoute, useActiveRecord } from '@/lib/agnostic/store';
import { AgnosticDNACompiler } from '@/lib/agnostic/Middleware';
import { AgnosticRenderer } from '@/components/agnostic/engine/AgnosticRenderer';
import { AgnosticGuard } from '@/components/agnostic/layouts/AgnosticGuard';
import { OverlayOrchestrator } from '@/components/agnostic/engine/OverlayOrchestrator';
import { ProjectSelector } from '@/components/agnostic/blocks/ProjectSelector';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createAgnosticAPI } from '@agnostic/core';
import { toast } from 'sonner';
import { useAppDispatch } from '@/context/AppContext'; // Temporarily kept for API bridging

export default function MasterRoute() {
  const { slug } = useParams();
  const router = useRouter();
  
  // --- ⚛️ ATOMIC STORES (v8.0) ---
  const { setNavigation, isLoading: isSystemLoading } = useSystemStore();
  const { data: materia } = useMateriaStore();
  const activeRoute = useActiveRoute();
  const activeRecord = useActiveRecord();
  
  // Bridge API (Legacy bridge to Supabase until full migration)
  const { saveItem, deleteItem, openOverlay, closeOverlay } = useAppDispatch();
  
  const path = Array.isArray(slug) ? `/${slug.join('/')}` : `/${slug}`;
  const stateRef = useRef({ data: materia }); // Mocking old state structure for core-compat
  stateRef.current = { data: materia };

  // 📡 NAVIGATION SENTINEL: Sync path to store
  useEffect(() => {
    setNavigation(path);
  }, [path, setNavigation]);

  // Master API for Overlays (v8.0)
  const masterApi = useMemo(() => createAgnosticAPI({
    router, saveItem, deleteItem, openOverlay, closeOverlay, stateRef, 
    block: { context: activeRoute?.data?.context }, toast
  }), [router, saveItem, deleteItem, openOverlay, closeOverlay, activeRoute, materia]);

  if (isSystemLoading && Object.keys(materia).length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-mono text-[10px] uppercase tracking-[0.4em] opacity-30 text-primary">Hydrating Atomic Core v8.0...</div>
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
        <Layers size={48} className="text-muted-foreground/20 mb-6" />
        <h1 className="text-4xl font-black tracking-tighter mb-2 italic">404: Uncharted Entity</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-xs">The projection '{path}' does not exist in the current DNA.</p>
      </div>
    );
  }

  const routeData = activeRoute?.data || {};
  let rawBlocks = (routeData.blocks as any[]) || (routeData.type ? [routeData] : []);
  
  // 🧬 DNA PURIFICATION (Middleware v7.1 + v8.0 Deterministic Resolver)
  const blocks = AgnosticDNACompiler.compilePage(rawBlocks, useDNAStore.getState().schemas);

  // 🔒 IDENTITY LOCK: If creating a project, ONLY show the first block
  const isCreating = path === '/create-project';
  const visibleBlocks = isCreating ? blocks.slice(0, 1) : blocks;

  const { requiredRole, layout } = activeRoute.data as any;
  const isFluid = layout === 'fluid';
  const activeSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug as string | undefined;

  const content = (
    <div className={cn(
      "min-h-screen bg-background transition-all duration-500",
      isFluid ? "w-full overflow-x-hidden" : "max-w-4xl mx-auto px-4 py-6 pb-20"
    )}>
      <div className={cn(
        "flex flex-col",
        isFluid ? "gap-0" : "gap-4 pt-4"
      )}>
        {!isFluid && <ProjectSelector />}

        {visibleBlocks.map((block, idx) => {
          const isStickyTop = block.sticky === 'top';
          const isStickyBottom = block.sticky === 'bottom';
          
          const handleSuccess = (record: any) => {
            const newSlug = record?.data?._slug;
            if (newSlug && newSlug !== activeSlug) {
              const redirectBase = block.config?.redirectOnCreate || block.redirectOnCreate || path.split('/').slice(0, -1).join('/');
              router.replace(`${redirectBase}/${newSlug}`);
            }
          };

          return (
            <div 
              key={`${idx}-${activeRecord?.id || 'new'}`} 
              className={cn(
                "w-full",
                isStickyTop && "sticky top-0 z-50 bg-background/80 backdrop-blur-md pb-4 pt-2 border-b border-border/10 -mx-4 px-4",
                isStickyBottom && "sticky bottom-0 z-50 bg-background/80 backdrop-blur-md pt-4 pb-2 border-t border-border/10 -mx-4 px-4 mt-auto shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)]"
              )}
            >
              <AgnosticRenderer 
                block={{ ...block, _activePath: path }} 
                onSuccess={handleSuccess}
              />
            </div>
          );
        })}
      </div>
      <OverlayOrchestrator api={masterApi} />
    </div>
  );

  return requiredRole ? <AgnosticGuard requiredRole={requiredRole}>{content}</AgnosticGuard> : content;
}
