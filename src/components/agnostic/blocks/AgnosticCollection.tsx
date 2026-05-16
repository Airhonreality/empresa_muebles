/**
 * 🏛️ ARTEFACTO: AgnosticCollection.tsx
 * ────────────
 * CAPA: Projection (Decentralized Blocks)
 * VERSIÓN: 8.1
 * COMMIT: P3-M3.3-DYNAMIC-SEGMENTATION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestación y proyección de conjuntos de materia (Record Sets).
 * - Soporte para Segmentación de Datos (Pivot) basado en claves de partición.
 * - Implementación de filtrado relacional jerárquico (Parent/Child).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Delegar la resolución de sub-bloques al AgnosticRenderer.
 * - MUST: Utilizar el 'segmentation_key' para particionar el conjunto de datos si está presente.
 * - NEVER: Contener lógica de negocio específica de un satélite o dominio.
 * 
 * 📜 ADR: [2026-05-11] DYNAMIC_DATA_SEGMENTATION
 * - DECISIÓN: Sustituir el hardcode de variantes por un motor de pivote basado en ADN.
 * - MOTIVO: Permitir que cualquier campo del esquema actúe como eje de segmentación (Variantes, Idiomas, Categorías).
 * - IMPACTO: Agnosticidad total en la visualización de colecciones complejas.
 */
'use client';

import React, { useMemo, useState } from 'react';
import { useDNAStore, useMateriaStore, useActiveRecord } from '@/lib/agnostic/store';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Trash2, ChevronRight, Plus } from 'lucide-react';
import { getModuleIcon } from '@/lib/agnostic/constants';
import { cn, getDeep } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAppDispatch } from '@/context/AppContext';
import { AgnosticLogicEngine } from '@/lib/agnostic/AgnosticLogicEngine';
import dynamic from 'next/dynamic';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AgnosticRenderer = dynamic(() => import('../engine/AgnosticRenderer').then(mod => mod.AgnosticRenderer), {
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse bg-muted/10 rounded-lg" />
});

interface Props {
  context?: string; 
  schemaId?: string;
  schema_id?: string; // 🏛️ DEV Standard
  view?: 'card_grid' | 'data_list' | 'editor_stack';
  projection?: any;
  title?: string;
  description?: string;
  switches?: string[];
  blackout?: string[];
  className?: string;
  defaultCollapsed?: boolean;
  parent_key?: string; // 🛰️ Standard FK
  parent_id?: string;  // 🛰️ Standard Parent Link
  segmentation_key?: string; // 🧩 Pivot Field
  segmentation_strategy?: 'none' | 'tabs' | 'steps' | 'select';
  segmentation_zap?: string; // 🧠 Fase 7: Logic-Driven Pivot
  intent?: 'create' | 'edit' | 'list' | 'view';
}

export function AgnosticCollection({ 
  context: propsContext, 
  schemaId, 
  schema_id,
  view = 'card_grid', 
  projection,
  title,
  description,
  switches = [],
  blackout = [],
  className,
  defaultCollapsed = false,
  parent_key,
  parent_id: propsParentId,
  segmentation_key,
  segmentation_strategy = 'none',
  segmentation_zap,
  intent = 'list'
}: Props) {
  const { data: materiaStore } = useMateriaStore();
  const { schemas } = useDNAStore();
  const activeRecordFromStore = useActiveRecord();
  
  // 🏛️ ISOMORPHIC IDENTITY
  const resolvedSchemaId = schema_id || schemaId;
  
  // 🏺 RESOLVE ACTIVE PARENT
  const parentId = propsParentId || activeRecordFromStore?.id;
  
  const { user } = useAuth();
  const { saveItem, deleteItem } = useAppDispatch();
  
  // 🛰️ STRICT EXPLICIT CONTEXT (Spec v7.0) - GRAVEDAD AXIOMÁTICA (Fase 5)
  const context = propsContext || 'system';
  
  // 🧹 NORMALIZE PROJECTION FILTERS
  const safeSwitches = useMemo(() => 
    Array.isArray(switches) ? switches : (typeof switches === 'string' ? (switches as string).split(',').map(s => s.trim()).filter(Boolean) : []),
    [switches]
  );
  const safeBlackout = useMemo(() => 
    Array.isArray(blackout) ? blackout : (typeof blackout === 'string' ? (blackout as string).split(',').map(s => s.trim()).filter(Boolean) : []),
    [blackout]
  );

  const [isExpanded, setIsExpanded] = React.useState(!defaultCollapsed);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [visibleSegments, setVisibleSegments] = useState<string[]>([]);
 
  const rawItems = (materiaStore[context] || []) as any[];
  
  // 🧬 SCHEMA BINDING: Búsqueda dual por ID técnico o Slug de diseño
  const schemaItem = schemas.find(s => s.id === resolvedSchemaId || s.data?.slug === resolvedSchemaId);
  const schema = schemaItem?.data || null;

  // 🧩 RESOLVE ALL POTENTIAL SEGMENTS (Unique values of segmentation_key)
  const allSegments = useMemo(() => {
    if (!segmentation_key || !rawItems.length) return [];
    const values = new Set(rawItems.map(item => item.data[segmentation_key]).filter(Boolean));
    return Array.from(values) as string[];
  }, [rawItems, segmentation_key]);

  // 🧠 Fase 7: LOGIC-DRIVEN PIVOT (System Capability)
  React.useEffect(() => {
    async function resolveReality() {
      const filtered = await AgnosticLogicEngine.getVisibleSegments(
        context, 
        activeRecordFromStore, 
        allSegments, 
        segmentation_zap
      );
      setVisibleSegments(filtered);
      
      // Auto-set first visible segment if current is invalid
      if (filtered.length > 0 && (!activeSegment || !filtered.includes(activeSegment))) {
        setActiveSegment(filtered[0]);
      }
    }
    resolveReality();
  }, [allSegments, activeRecordFromStore, context, segmentation_zap]);

  // 🧬 PURE PROJECTION FILTERING (Relational + Segmentation)
  const items = useMemo(() => {
    let filtered = rawItems;
    
    // 1. Relational Filter (SOLO si hay parent_key explícito en el bloque)
    if (parentId && parent_key && propsContext !== 'vault_catalogo') {
      filtered = filtered.filter((item: any) => item.data[parent_key] === parentId);
    }

    // 2. Segmentation Filter (Pivot)
    if (segmentation_key && activeSegment && segmentation_strategy !== 'none') {
      filtered = filtered.filter((item: any) => item.data[segmentation_key] === activeSegment);
    }

    return filtered;
  }, [rawItems, parentId, parent_key, segmentation_key, activeSegment, segmentation_strategy, propsContext]);

  if (!schema) return null;

  const activeProjection = projection || schema.projection_map;

  const handleAddItem = async () => {
    const newItem: Record<string, unknown> = {
      name: `Nuevo ${schema.name || context}`,
    };
    
    if (parentId && parent_key) {
      newItem[parent_key] = parentId;
    }
    
    // 🧩 AUTO-PARTITION: New items inherit current segment
    if (segmentation_key && activeSegment) {
      newItem[segmentation_key] = activeSegment;
    }
    
    await saveItem(context, { data: newItem });
    setIsExpanded(true);
  };

  return (
    <div className={cn("@container w-full space-y-6 animate-in fade-in duration-700", className)}>
      <div className="flex items-center justify-between group/header cursor-pointer border-b pb-4" onClick={() => setIsExpanded(!isExpanded)}>
        {(title || description) || true && (
          <div className="flex items-center gap-4">
             <div className="p-2 bg-muted rounded-lg text-primary">
                {React.createElement(getModuleIcon('collection'), { size: 20 })}
             </div>
             <div className="space-y-0.5">
               <div className="flex items-center gap-3">
                 <ChevronRight className={cn("w-4 h-4 transition-transform duration-300 text-muted-foreground", isExpanded && "rotate-90 text-primary")} />
                 <h2 className="text-2xl font-bold tracking-tight">{title || schema.name || 'Colección'}</h2>
               </div>
               {description && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-7">{description}</p>}
             </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {(intent === 'create' || intent === 'edit') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); handleAddItem(); }}
              className="h-8 px-4 rounded-md font-bold text-[10px] uppercase tracking-wider gap-2"
            >
              <Plus className="w-4 h-4" />
              Añadir {schema.name?.replace('schema_', '').replace(/_/g, ' ') || context || 'Materia'}
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-300 space-y-6">
          {/* 🧩 SEGMENT SELECTOR (Pivot Engine - Fase 4) */}
          {segmentation_key && visibleSegments.length > 0 && segmentation_strategy !== 'none' && (
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              {segmentation_strategy === 'tabs' && (
                <Tabs value={activeSegment || ''} onValueChange={setActiveSegment} className="w-fit">
                  <TabsList className="bg-muted/50">
                    {visibleSegments.map(s => (
                      <TabsTrigger key={s} value={s} className="text-[10px] font-bold uppercase tracking-wider">
                        {s}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              {segmentation_strategy === 'steps' && (
                <div className="flex items-center gap-2">
                  {visibleSegments.map((s, idx) => (
                    <React.Fragment key={s}>
                      <button
                        onClick={() => setActiveSegment(s)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
                          activeSegment === s 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                            : "bg-muted/30 text-muted-foreground border-transparent hover:border-muted-foreground/20"
                        )}
                      >
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-background/20 text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{s}</span>
                      </button>
                      {idx < visibleSegments.length - 1 && <div className="w-4 h-[1px] bg-border" />}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {segmentation_strategy === 'select' && (
                <Select value={activeSegment || ''} onValueChange={setActiveSegment}>
                  <SelectTrigger className="w-[200px] h-8 text-[10px] font-bold uppercase tracking-widest">
                    <SelectValue placeholder="Seleccionar segmento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleSegments.map(s => (
                      <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase tracking-widest">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider gap-2 opacity-50 hover:opacity-100"
                onClick={() => {
                  const name = prompt("Nombre del nuevo segmento:");
                  if (name) {
                    // Logic to add a new segment would require updating an item or having a placeholder
                    // For now, we just set the active segment to show the intent
                    setActiveSegment(name);
                  }
                }}
              >
                <Plus className="w-3 h-3" />
                Nuevo Segmento
              </Button>
            </div>
          )}

          {items.length > 0 && (
            <div className={cn(
              view === 'card_grid' 
                ? "grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-6" 
                : "flex flex-col gap-6"
            )}>
              {items.filter((item: any) => !item.data.visibility_whitelist || (user && item.data.visibility_whitelist.includes(user.role))).map((item, index) => {
                return (
                  <Card key={item.id || `temp-${index}`} className={cn(
                    "group overflow-hidden border transition-all duration-300",
                    view === 'editor_stack' ? "bg-muted/10" : "hover:border-primary/50 shadow-sm"
                  )}>
                    <CardHeader className="p-4 border-b flex flex-col gap-4 bg-muted/30">
                      <div className="flex items-center justify-between w-full">
                        <Input
                          defaultValue={getDeep(item.data, activeProjection?.title || 'name')?.replace('schema_', '').replace(/_/g, ' ') || 'Elemento sin nombre'}
                          onBlur={(e) => {
                            const newValue = e.target.value;
                            const titleKey = activeProjection?.title || 'name';
                            const currentVal = getDeep(item.data, titleKey);
                            if (newValue && newValue !== currentVal) {
                              saveItem(context, { ...item, data: { ...item.data, [titleKey]: newValue } });
                            }
                          }}
                          className="h-8 px-2 text-sm font-bold tracking-tight bg-transparent border-transparent hover:border-border focus:bg-background transition-all"
                        />
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8 opacity-40 hover:opacity-100"><ArrowRight className="w-4 h-4" /></Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteItem(context, item.id)}
                            className="w-8 h-8 opacity-40 hover:opacity-100 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      {activeProjection?.blocks ? (
                        activeProjection.blocks.map((block: any, bIdx: number) => (
                          <div key={bIdx} className="w-full">
                            <AgnosticRenderer 
                              block={block} 
                              parentId={item.id}
                              parentKey={block.config?.parent_key || `${context.replace('schema_', '')}_id`}
                              context={context}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(item.data).map(([key, val]) => {
                            if (key.startsWith('_') || key.endsWith('_id') || key === activeProjection?.title || key === activeProjection?.badge) return null;
                            if (safeBlackout.includes(key)) return null;
                            if (safeSwitches.length > 0 && !safeSwitches.includes(key)) return null;

                            return (
                              <div key={key} className="space-y-1">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">{key.replace(/_/g, ' ')}</span>
                                <p className="text-xs font-medium text-foreground truncate">{String(val)}</p>
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
