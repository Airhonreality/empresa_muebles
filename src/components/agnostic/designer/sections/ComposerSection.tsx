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

import { useMemo } from 'react';
import { RecursiveBlockComposer } from '../components/RecursiveBlockComposer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layout, Zap, Plus } from 'lucide-react';

interface ComposerSectionProps {
  routeId: string;
  routes: any[];
  schemas: any[];
  vaults: any[];
  onUpdateRoutes: (routes: any[]) => void;
  onBack: () => void;
}

export function ComposerSection({ routeId, routes, schemas, vaults, onUpdateRoutes, onBack }: ComposerSectionProps) {
  
  // 🎯 SELECTOR DE CONTEXTO: Buscamos en el borrador inyectado
  const route = useMemo(() => routes.find((r: any) => r.id === routeId), [routes, routeId]);

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

  // 🛠️ HANDLERS: Actualización del borrador local de rutas
  const handleUpdateBlocks = (newBlocks: any[]) => {
    const updatedRoutes = routes.map(r => 
      r.id === routeId ? { ...r, blocks: newBlocks } : r
    );
    onUpdateRoutes(updatedRoutes);
  };

  const handleAddBlock = () => {
    const newBlock = {
      id: `block_${crypto.randomUUID().slice(0, 8)}`,
      type: 'section',
      config: { title: 'Nueva Sección' },
      blocks: []
    };
    handleUpdateBlocks([...(route.blocks || []), newBlock]);
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
              Componiendo: <span className="opacity-60">{route.path}</span>
            </h3>
            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest opacity-40">
              Draft ID: {route.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleAddBlock}
            size="sm"
            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none"
          >
            <Plus size={12} /> Añadir Bloque Raíz
          </Button>
          <div className="px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex items-center gap-2">
            <Zap size={10} className="text-emerald-500" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Staging Link Active</span>
          </div>
        </div>
      </div>

      {/* 🧱 COMPOSITION CANVAS */}
      <div className="space-y-6">
        {route.blocks?.map((block: any, idx: number) => (
          <RecursiveBlockComposer
            key={block.id || idx}
            block={block}
            idx={idx}
            schemas={schemas}
            vaults={vaults}
            onUpdate={(patch) => {
              const newBlocks = [...(route.blocks || [])];
              newBlocks[idx] = { ...block, ...patch };
              handleUpdateBlocks(newBlocks);
            }}
            onRemove={() => {
              const newBlocks = route.blocks.filter((_: any, i: number) => i !== idx);
              handleUpdateBlocks(newBlocks);
            }}
          />
        ))}

        {(!route.blocks || route.blocks.length === 0) && (
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
