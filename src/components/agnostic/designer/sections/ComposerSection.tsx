'use client';

/**
 * 🏛️ ARTEFACTO: ComposerSection.tsx
 * ────────────
 * CAPA: Staging (Block Composition)
 * VERSIÓN: 1.5
 * COMMIT: P2-M2.6-ADR-COMPOSER-ISO
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestación de la composición de bloques para una ruta específica.
 * - Sincronización de estados entre el árbol de bloques y el buffer de Staging.
 * - Interfaz de navegación contextual entre el mapa de rutas y el diseño de contenido.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Garantizar que los cambios solo afecten a la ruta seleccionada.
 * - NEVER: Persistir cambios directamente en el servidor sin pasar por el Commit del Manager.
 * - ALWAYS: Mantener una referencia clara de la ruta en edición (Context Header).
 * 
 * 📜 ADR: [2026-05-11] COMPOSER_VIEWPORT_ISO
 * - DECISIÓN: Aislar la vista del compositor como un 'viewport' dedicado dentro del manager.
 * - MOTIVO: Prevenir distracciones visuales y mejorar el enfoque en el diseño de la estructura fractal.
 * - IMPACTO: Flujo de trabajo profesional con navegación clara (Breadcrumbs).
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [AgnosticConfigManager]
 * - DOWNSTREAM: [RecursiveBlockComposer, Page Routes Registry]
 */

import { useMemo, useState } from 'react';
import { RecursiveBlockComposer } from '../components/RecursiveBlockComposer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ArrowLeft, Layout, Zap, Plus, Maximize2, Database } from 'lucide-react';
import { registry } from '@/lib/agnostic/Registry';
import { AgnosticLayoutControls } from '../AgnosticLayoutControls';

interface ComposerSectionProps {
  routeId: string;
  routes: any[];
  schemas: any[];
  vaults: any[];
  onUpdateRoutes: (routes: any[]) => void;
  onBack: () => void;
}

export function ComposerSection({ routeId, routes, schemas, vaults, onUpdateRoutes, onBack }: ComposerSectionProps) {
  const [showLayout, setShowLayout] = useState(false);
  
  // 🎯 SELECTOR DE CONTEXTO: Buscamos en el borrador inyectado
  const route = useMemo(() => routes.find((r: any) => r.id === routeId), [routes, routeId]);
  const routeData = useMemo(() => route?.data || route || {}, [route]);

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 bg-destructive/5 rounded-full">
          <Layout size={32} className="text-destructive opacity-50" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ruta no encontrada en el Staging</p>
        <Button onClick={onBack} variant="outline" className="rounded-xl uppercase text-[10px] font-bold tracking-widest">
          Volver al Mapa
        </Button>
      </div>
    );
  }

  // 🛠️ HANDLERS: Actualización del borrador local de rutas (Systemic Style)
  const handleUpdateBlocks = (newBlocks: any[]) => {
    const updatedRoutes = routes.map(r => {
      if (r.id === routeId) {
        return { 
          ...r, 
          data: { 
            ...(r.data || {}), 
            blocks: newBlocks 
          } 
        };
      }
      return r;
    });
    onUpdateRoutes(updatedRoutes);
  };

  const handleUpdateRoute = (patch: any) => {
    const updatedRoutes = routes.map(r => {
      if (r.id === routeId) {
        return { 
          ...r, 
          data: { 
            ...(r.data || {}), 
            ...patch
          } 
        };
      }
      return r;
    });
    onUpdateRoutes(updatedRoutes);
  };

  const handleAddBlock = () => {
    const newBlock = {
      id: `block_${crypto.randomUUID().slice(0, 8)}`,
      type: 'section',
      config: { title: 'Nueva Sección' },
      blocks: []
    };
    
    // 🛡️ CORRECCIÓN DE PUNTERO: routeData ya es el payload (.data)
    const currentBlocks = Array.isArray(routeData?.blocks) ? routeData.blocks : [];
    handleUpdateBlocks([...currentBlocks, newBlock]);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* 🧭 CONTEXT HEADER */}
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-20 py-4 border-b border-border/10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="rounded-xl hover:bg-muted/10"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="space-y-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 leading-none">
              <Layout size={14} />
              Componiendo: <span className="opacity-60">{routeData.path}</span>
            </h3>
            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest opacity-40">
              Draft ID: {route.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className={cn("h-11 px-6 rounded-2xl gap-3 transition-all", showLayout && "bg-primary text-primary-foreground border-primary")}
            onClick={() => setShowLayout(!showLayout)}
          >
            <Maximize2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Layout de Ruta</span>
          </Button>

          <Button 
            onClick={handleAddBlock}
            size="sm"
            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none"
          >
            <Plus size={12} /> Añadir Bloque Raíz
          </Button>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex items-center gap-2">
              <Zap size={10} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Staging Link Active</span>
            </div>
            
            <Button 
              onClick={async () => {
                await onUpdateRoutes(routes);
                toast.success('Realidad Cristalizada: Ruta actualizada en el servidor');
              }}
              size="sm"
              className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 bg-emerald-500 text-white hover:bg-emerald-600 border-none px-4 shadow-lg shadow-emerald-500/20"
            >
              <Database size={12} /> Cristalizar Ruta
            </Button>
          </div>
        </div>
      </div>

      {/* 🧬 PROYECCIÓN DE CAPACIDAD: LAYOUT DE RUTA */}
      {showLayout && (
        <div className="p-12 bg-muted/5 border border-border/10 rounded-[3.5rem] animate-in slide-in-from-top-4 duration-500">
          <AgnosticLayoutControls 
            data={routeData} 
            onUpdate={(layout) => handleUpdateRoute({ layout })} 
          />
        </div>
      )}

      {/* 🧱 COMPOSITION CANVAS */}
      <div className="space-y-6">
        {routeData.blocks?.map((block: any, idx: number) => (
          <RecursiveBlockComposer
            key={block.id || idx}
            block={block}
            idx={idx}
            schemas={schemas}
            vaults={vaults}
            onUpdate={(patch) => {
              const newBlocks = [...(routeData.blocks || [])];
              newBlocks[idx] = { ...block, ...patch };
              handleUpdateBlocks(newBlocks);
            }}
            onRemove={() => {
              const newBlocks = (routeData.blocks || []).filter((_: any, i: number) => i !== idx);
              handleUpdateBlocks(newBlocks);
            }}
          />
        ))}

        {(!routeData.blocks || routeData.blocks.length === 0) && (
          <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-border/10 rounded-[3rem] bg-muted/5 transition-colors hover:bg-muted/10">
            <Layout size={40} className="text-muted-foreground/10 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Lienzo en Blanco</p>
            <Button 
              variant="outline" 
              onClick={handleAddBlock}
              className="mt-6 text-[10px] font-black uppercase tracking-[0.1em] border-primary/20 hover:bg-primary/5 rounded-xl px-10 h-10"
            >
              Comenzar Arquitectura
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
