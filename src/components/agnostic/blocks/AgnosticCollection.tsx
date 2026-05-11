/**
 * 🏛️ ARTEFACTO: AgnosticCollection.tsx
 * ────────────
 * CAPA: Projection (Decentralized Blocks)
 * VERSIÓN: 8.0
 * ADR: [adr_v8_0_deterministic_state.md]
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestación y proyección de conjuntos de materia (Record Sets).
 * - Implementación de recursividad fractal y filtrado relacional.
 * - Inferencia de contexto dinámico (Axiomatic Gravity).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Delegar la persistencia al despachador de estado (AppContext).
 * - MUST: Proyectar el icono canónico desde el Visual Registry.
 * - NEVER: Gestionar lógica de navegación o estados de ruta.
 */
'use client';

import React, { useMemo, useState, useRef } from 'react';
import { useDNAStore, useMateriaStore, useActiveRecord } from '@/lib/agnostic/store';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Trash2, ChevronRight, Plus } from 'lucide-react';
import { getModuleIcon } from '@/lib/agnostic/constants';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAppDispatch } from '@/context/AppContext';
import dynamic from 'next/dynamic';
import { generateGhostSchema } from '@/lib/agnostic/GhostFactory';

const AgnosticRenderer = dynamic(() => import('../engine/AgnosticRenderer').then(mod => mod.AgnosticRenderer), {
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse bg-muted/10 rounded-lg" />
});

interface Props {
  context?: string; 
  schemaId?: string;
  view?: 'card_grid' | 'data_list' | 'editor_stack';
  projection?: any;
  title?: string;
  description?: string;
  switches?: string[];
  blackout?: string[];
  className?: string;
  defaultCollapsed?: boolean;
  parentKey?: string;
}

export function AgnosticCollection({ 
  context: propsContext, 
  schemaId, 
  view = 'card_grid', 
  projection,
  title,
  description,
  switches = [],
  blackout = [],
  className,
  defaultCollapsed = false,
  parentKey
}: Props) {
  const { data: materiaStore } = useMateriaStore();
  const { schemas } = useDNAStore();
  const activeRecord = useActiveRecord();
  
  const { user } = useAuth();
  const { saveItem, deleteItem } = useAppDispatch();
  
  // 🛰️ STRICT EXPLICIT CONTEXT (Spec v7.0)
  const context = propsContext || 'system';
  
  const [isExpanded, setIsExpanded] = React.useState(!defaultCollapsed);
  const [activeVariants, setActiveVariants] = React.useState<Record<string, string>>({});

  const rawItems = (materiaStore[context] || []) as any[];
  
  const schemaItem = schemas.find(s => s.id === schemaId);
  const schema = schemaItem?.data || null;

  // 🧬 PURE PROJECTION FILTERING (No Gravity Inference)
  const items = useMemo(() => {
    if (!activeRecord || !parentKey) return rawItems;
    return rawItems.filter((item: any) => item.data[parentKey] === activeRecord.id);
  }, [rawItems, activeRecord?.id, parentKey]);

  if (!schema) return null;

  const activeProjection = projection || schema.projection_map;

  const handleAddItem = async () => {
    if (!activeRecord || !parentKey) {
      toast.error("Vínculo relacional incompleto");
      return;
    }

    const newItem: Record<string, unknown> = {
      name: `Nuevo ${schema.name || context}`,
      [parentKey]: activeRecord.id 
    };
    
    await saveItem(context, { data: newItem });
    setIsExpanded(true);
  };

  return (
    <div className={cn("@container w-full space-y-4 animate-in fade-in duration-700", className)}>
      <div className="flex items-center justify-between group/header cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {(title || description) && (
          <div className="flex items-center gap-4">
             <div className="p-2 bg-primary/5 text-primary/40 rounded-xl">
                {React.createElement(getModuleIcon('collection'), { size: 18 })}
             </div>
             <div className="space-y-0.5">
               <div className="flex items-center gap-3">
                 <ChevronRight className={cn("w-4 h-4 transition-transform duration-300 opacity-20 group-hover/header:opacity-100", isExpanded && "rotate-90 text-primary opacity-100")} />
                 {title && <h2 className="text-2xl font-serif font-black tracking-tighter italic">{title}</h2>}
               </div>
               {description && <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] ml-7">{description}</p>}
             </div>
          </div>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); handleAddItem(); }}
          className="h-7 px-3 rounded-full border-primary/20 bg-primary/5 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <Plus className="w-3 h-3 mr-2" />
          Añadir {schema.name.replace('schema_', '').replace(/_/g, ' ')}
        </Button>
      </div>

      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          {items.length > 0 && (
            <div className={cn(
              view === 'card_grid' 
                ? "grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-6" 
                : "flex flex-col gap-4"
            )}>
              {items.filter((item: any) => !item.data.visibility_whitelist || (user && item.data.visibility_whitelist.includes(user.role))).map((item, index) => {
                const currentVariant = activeVariants[item.id] || 'V1';
                const variants = ['V1', 'V2', 'V3']; // In a real scenario, this could come from item.data.variants

                return (
                  <Card key={item.id || `temp-${index}`} className={cn(
                    "group overflow-hidden border-border/40 transition-all duration-500",
                    view === 'editor_stack' ? "bg-card/20 backdrop-blur-xl border-border/30" : "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5"
                  )}>
                    <CardHeader className={cn(
                      "p-4 border-b border-border/10 flex flex-col gap-3 bg-muted/5",
                      view === 'editor_stack' && "py-3 px-4"
                    )}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Input
                            defaultValue={item.data[activeProjection?.title || 'name']?.replace('schema_', '').replace(/_/g, ' ') || 'Ambiente sin nombre'}
                            onBlur={(e) => {
                              const newValue = e.target.value;
                              const currentVal = item.data[activeProjection?.title || 'name'];
                              if (newValue && newValue !== currentVal) {
                                saveItem(context, { ...item, data: { ...item.data, [activeProjection?.title || 'name']: newValue } });
                              }
                            }}
                            className="h-7 px-2 py-0 text-sm font-serif italic font-black tracking-tight bg-transparent border-transparent hover:border-border/30 focus:border-primary/50 focus:bg-background/50 transition-all rounded shadow-none w-[200px]"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7 opacity-20 hover:opacity-100"><ArrowRight className="w-4 h-4" /></Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteItem(context, item.id)}
                            className="w-7 h-7 opacity-20 hover:opacity-100 hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* 🎭 VARIANT SELECTOR (The Sovereignty Hub) */}
                      <div className="flex items-center gap-1.5 p-1 bg-muted/20 rounded-lg w-fit self-start">
                        {variants.map(v => (
                          <button
                            key={v}
                            onClick={() => setActiveVariants(prev => ({ ...prev, [item.id]: v }))}
                            className={cn(
                              "px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all",
                              currentVariant === v 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-muted-foreground/60 hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            {v}
                          </button>
                        ))}
                        <button className="px-2 py-1 text-muted-foreground/30 hover:text-primary transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      {activeProjection?.blocks ? (
                        activeProjection.blocks.map((block: any, bIdx: number) => (
                          <div key={bIdx} className="w-full">
                            <AgnosticRenderer 
                              block={block} 
                              parentId={item.id}
                              parentKey={block.config?.parentKey || `${context.replace('schema_', '')}_id`}
                              variantId={currentVariant} // 🧬 Pass the variant filter down to child sheets
                            />
                          </div>
                        ))
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(item.data).map(([key, val]) => {
                            if (key.startsWith('_') || key.endsWith('_id') || key === activeProjection?.title || key === activeProjection?.badge) return null;
                            if (blackout.includes(key)) return null;
                            if (switches.length > 0 && !switches.includes(key)) return null;

                            return (
                              <div key={key} className="space-y-1 overflow-hidden">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 block">{key.replace(/_/g, ' ')}</span>
                                <p className="text-xs font-bold text-foreground/70 truncate">{String(val)}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

