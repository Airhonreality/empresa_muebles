'use client';

import { useAppState } from '@/context/AppContext';
import { AgnosticRenderer } from '@/components/agnostic/AgnosticRenderer';
import { AgnosticGuard } from '@/components/agnostic/AgnosticGuard';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { Layers, LayoutGrid } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Master Route (The Satellite Runtime v2.1)
 * 
 * 1. Resolves Materia paths.
 * 2. Manages Auth Guards.
 * 3. Orchestrates multiple 'Actors' via AgnosticRenderer.
 */
export default function MasterRoute() {
  const { slug } = useParams();
  const { state } = useAppState();
  
  const path = Array.isArray(slug) ? `/${slug.join('/')}` : `/${slug}`;

  const route = useMemo(() => {
    const routes = state.data['page_routes'] || [];
    return routes.find(r => r.data.path === path);
  }, [state.data, path]);

  if (state.system.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-mono text-[10px] uppercase tracking-[0.4em] opacity-30">Hydrating Atomic Core...</div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
        <Layers size={48} className="text-muted-foreground/20 mb-6" />
        <h1 className="text-4xl font-black tracking-tighter mb-2">404: Uncharted Entity</h1>
        <p className="text-xs text-muted-foreground italic max-w-xs">The route '{path}' has no projection in the current Materia storage.</p>
      </div>
    );
  }

  const blocks = (route.data.blocks as any[]) || [route.data];
  const { requiredRole, layoutStyle } = route.data as any;

  const content = (
    <div className={cn(
      "min-h-screen bg-background animate-in fade-in duration-1000 p-8 pb-32",
      layoutStyle === 'compact' ? "max-w-5xl mx-auto" : "w-full"
    )}>
      <div className="max-w-4xl mx-auto space-y-24 pt-12">
        {blocks.map((block, idx) => (
          <div key={idx} className="animate-in slide-in-from-bottom-8 duration-1000" style={{ animationDelay: `${idx * 200}ms` }}>
            <AgnosticRenderer block={block} />
          </div>
        ))}

        {blocks.length === 0 && (
          <div className="py-32 text-center opacity-10">
            <LayoutGrid size={64} className="mx-auto mb-4" />
            <p className="font-black uppercase tracking-widest text-sm">Empty Composition</p>
          </div>
        )}
      </div>
    </div>
  );

  if (requiredRole) {
    return <AgnosticGuard requiredRole={requiredRole}>{content}</AgnosticGuard>;
  }

  return content;
}
