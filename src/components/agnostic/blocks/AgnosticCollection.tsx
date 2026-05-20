/**
 * 🏛️ ARTEFACTO: AgnosticCollection.tsx
 * ────────────
 * CAPA: Projection (Decentralized Blocks)
 * VERSIÓN: 9.0
 * COMMIT: P3-M4.3-AXIOMATIC-DECOUPLING
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestador y proveedor de datos para proyecciones de conjuntos (Record Sets).
 * - Manejo descentralizado de filtros relacionales, pivot de segmentación y ordenación.
 * - Delegación axiomática del dibujado visual a submódulos puros (AgnosticTable, AgnosticGroupedCard).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Mantener la pureza agnóstica (sin acoplamiento con entidades como cotizaciones o variantes).
 * - MUST: Utilizar el Primer Axioma de Nam P. Suh para delegar el renderizado en componentes independientes.
 */
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useDNAStore, useMateriaStore } from '@/lib/agnostic/store';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Trash2, ChevronRight, Plus } from 'lucide-react';
import { getModuleIcon } from '@/lib/agnostic/constants';
import { cn, getDeep } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/context/AppDispatchContext';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 🔌 Submódulos Axiomáticos de Visualización (Desacoplados)
import { AgnosticTable } from './AgnosticTable';
import { AgnosticGroupedCard } from './AgnosticGroupedCard';

const AgnosticRenderer = dynamic(() => import('../engine/AgnosticRenderer').then(mod => mod.AgnosticRenderer), {
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse bg-muted/10 rounded-lg" />
});

interface Props {
  schema: any;
  context: string;
  projection?: any;
  parentId?: string;
  parent_key?: string;
  segmentation_key?: string;
  segmentation_strategy?: string;
  segmentation_rename?: boolean;
  className?: string;
  view?: 'card_grid' | 'table' | 'editor_stack' | 'details';
  intent?: 'view' | 'create' | 'edit' | 'list';
  title?: string;
  description?: string;
  blocks?: any[];
  singular?: string;
  group_by_key?: string;
  searchable?: boolean;
  isCollapsible?: boolean;
}

export function AgnosticCollection({
  schema,
  context,
  projection,
  parentId,
  parent_key,
  segmentation_key,
  segmentation_strategy = 'none',
  segmentation_rename = false,
  className,
  view = 'card_grid',
  intent = 'list',
  title,
  description,
  blocks,
  singular,
  group_by_key,
  searchable = true,
  isCollapsible = true
}: Props) {
  const { data: materiaStore } = useMateriaStore();
  const { schemas } = useDNAStore();
  const { user } = useAuth();
  const { saveItem, deleteItem, openOverlay } = useAppDispatch();
  const params = useParams();

  const effectiveIsCollapsible = isCollapsible !== false;
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Derive parentId from URL slug when not explicitly provided (Camino B — no prop drilling)
  const urlId = Array.isArray(params.slug) ? params.slug.at(-1) : (params.slug as string | undefined);
  const effectiveParentId = parentId || (parent_key ? urlId : undefined);

  // Obtener registros de memoria
  const rawItems = useMemo(() => materiaStore[context] || [], [materiaStore, context]);

  // 1. Obtener todos los segmentos disponibles (Pivot)
  const allSegments = useMemo(() => {
    if (!segmentation_key) return [];
    return Array.from(new Set(
      rawItems.map((item: any) => item.data[segmentation_key]).filter(Boolean)
    )) as string[];
  }, [rawItems, segmentation_key]);

  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [renamingSegment, setRenamingSegment] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Inicializar segmento activo
  useEffect(() => {
    if (allSegments.length > 0 && !activeSegment) {
      setActiveSegment(allSegments[0]);
    }
  }, [allSegments, activeSegment]);

  const commitSegmentRename = async (oldName: string) => {
    const newName = renameValue.trim();
    setRenamingSegment(null);
    if (!newName || newName === oldName) return;
    const itemsToUpdate = rawItems.filter((item: any) =>
      item.data[segmentation_key!] === oldName &&
      (!parent_key || !effectiveParentId || item.data[parent_key] === effectiveParentId)
    );
    for (const item of itemsToUpdate) {
      await saveItem(context, { id: item.id, data: { ...item.data, [segmentation_key!]: newName } });
    }
    if (activeSegment === oldName) setActiveSegment(newName);
  };

  // 🧬 FILTRADO RELACIONAL Y SEGMENTACIÓN BÁSICA
  const filteredItems = useMemo(() => {
    let result = rawItems;
    
    // Filtro por relación (Parent-Child)
    if (effectiveParentId && parent_key) {
      result = result.filter((item: any) => item.data[parent_key] === effectiveParentId);
    }

    // Filtro por segmentación de pestañas globales (solo si no agrupamos por card)
    if (segmentation_key && activeSegment && segmentation_strategy !== 'none' && !group_by_key) {
      result = result.filter((item: any) => item.data[segmentation_key] === activeSegment);
    }

    return result;
  }, [rawItems, effectiveParentId, parent_key, segmentation_key, activeSegment, segmentation_strategy, group_by_key]);

  // APLICAR BÚSQUEDA Y ORDENAMIENTO COMPILADO
  const filteredAndSortedItems = useMemo(() => {
    let result = [...filteredItems];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.entries(item.data || {}).some(([key, val]) => 
          !key.startsWith('_') && String(val).toLowerCase().includes(query)
        )
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        const valA = String(a.data?.[sortField] || '').toLowerCase();
        const valB = String(b.data?.[sortField] || '').toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filteredItems, searchQuery, sortField, sortDirection]);

  if (!schema) return null;

  const activeProjection = projection || schema.projection_map;
  const safeBlackout = activeProjection?.blackout || [];
  const safeSwitches = activeProjection?.switches || [];

  const handleAddItem = async () => {
    const newItem: Record<string, unknown> = {};
    
    if (effectiveParentId && parent_key) {
      newItem[parent_key] = effectiveParentId;
    }
    
    // Inyectar el segmento actual en el registro nuevo
    if (segmentation_key && activeSegment && !group_by_key) {
      newItem[segmentation_key] = activeSegment;
    }
    
    // Inicializar campo de agrupación si aplica
    if (group_by_key) {
      newItem[group_by_key] = 'Nuevo Espacio / Elemento';
      if (segmentation_key) {
        newItem[segmentation_key] = allSegments[0] || 'Inicial';
      }
    }
    
    await saveItem(context, { data: newItem });
    setIsExpanded(true);
  };

  return (
    <div className={cn("@container w-full space-y-6 animate-in fade-in duration-700", className)}>
      {/* HEADER DE LA COLECCIÓN */}
      <div 
        className={cn("flex items-center justify-between group/header border-b pb-4", effectiveIsCollapsible ? "cursor-pointer" : "cursor-default")} 
        onClick={effectiveIsCollapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-4">
           <div className="p-2 bg-muted rounded-lg text-primary">
              {React.createElement(getModuleIcon('collection'), { size: 20 })}
           </div>
           <div className="space-y-0.5">
             <div className="flex items-center gap-3">
               {effectiveIsCollapsible && (
                 <ChevronRight className={cn("w-4 h-4 transition-transform duration-300 text-muted-foreground", isExpanded && "rotate-90 text-primary")} />
               )}
               <h2 className="text-2xl font-bold tracking-tight">{title || schema.name || 'Colección'}</h2>
             </div>
             {description && (
               <p className={cn("text-[10px] font-bold text-muted-foreground uppercase tracking-wider", effectiveIsCollapsible ? "ml-7" : "ml-0")}>
                 {description}
               </p>
             )}
           </div>
        </div>
        <div className="flex items-center gap-2">
          {(intent === 'create' || intent === 'edit') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); handleAddItem(); }}
              className="h-8 px-4 rounded-md font-bold text-[10px] uppercase tracking-wider gap-2"
            >
              <Plus className="w-4 h-4" />
              Añadir {singular || schema.name?.replace(/_/g, ' ') || context || 'Materia'}
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-300 space-y-6">
          
          {/* 🧩 SEGMENT SELECTOR GLOBAL (SOLO SI NO HAY AGRUPACIÓN ACTIVA) */}
          {segmentation_key && segmentation_strategy !== 'none' && !group_by_key && (
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              {segmentation_strategy === 'tabs' && (
                <div className="flex items-center gap-3">
                  {allSegments.length > 0 ? (
                    <Tabs value={activeSegment || ''} onValueChange={setActiveSegment} className="w-fit animate-in fade-in duration-300">
                      <TabsList className="bg-muted/50">
                        {allSegments.map(seg => (
                          <TabsTrigger
                            key={seg}
                            value={seg}
                            className="text-[10px] font-bold uppercase tracking-wider px-4"
                            onDoubleClick={segmentation_rename ? (e) => {
                              e.preventDefault();
                              setRenamingSegment(seg);
                              setRenameValue(seg);
                            } : undefined}
                          >
                            {segmentation_rename && renamingSegment === seg ? (
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { e.preventDefault(); commitSegmentRename(seg); }
                                  if (e.key === 'Escape') { setRenamingSegment(null); }
                                }}
                                onBlur={() => commitSegmentRename(seg)}
                                onClick={e => e.stopPropagation()}
                                className="w-20 bg-transparent outline-none text-[10px] font-bold uppercase tracking-wider text-center border-b border-primary/40"
                              />
                            ) : seg}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider italic">
                      Sin segmentación de {segmentation_key.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 🔀 MOTOR DE SELECCIÓN DE LAYOUT DESACOPLADO */}
          {view === 'table' ? (
            <AgnosticTable
              items={filteredAndSortedItems}
              schema={schema}
              context={context}
              saveItem={saveItem}
              deleteItem={deleteItem}
              openOverlay={openOverlay}
              intent={intent}
              singular={singular}
              safeBlackout={safeBlackout}
              safeSwitches={safeSwitches}
              user={user}
              searchable={searchable}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortField={sortField}
              setSortField={setSortField}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              schemas={schemas}
              materiaStore={materiaStore}
            />
          ) : group_by_key ? (
            <div className="flex flex-col gap-6">
              {(() => {
                const groupsMap = new Map<string, any[]>();
                filteredAndSortedItems
                  .filter((item: any) => !item.data.visibility_whitelist || (user && item.data.visibility_whitelist.includes(user.role)))
                  .forEach(item => {
                    const groupValue = (group_by_key && item.data[group_by_key]) ? String(item.data[group_by_key]) : 'Elemento sin nombre';
                    if (!groupsMap.has(groupValue)) groupsMap.set(groupValue, []);
                    groupsMap.get(groupValue)!.push(item);
                  });
                
                return Array.from(groupsMap.entries()).map(([gName, gItems], idx) => (
                  <AgnosticGroupedCard
                    key={`${gName}-${idx}`}
                    groupName={gName}
                    items={gItems}
                    schema={schema}
                    context={context}
                    group_by_key={group_by_key}
                    segmentation_key={segmentation_key}
                    segmentation_strategy={segmentation_strategy}
                    segmentation_rename={segmentation_rename}
                    blocks={blocks}
                    activeProjection={activeProjection}
                    safeBlackout={safeBlackout}
                    safeSwitches={safeSwitches}
                    user={user}
                    saveItem={saveItem}
                    deleteItem={deleteItem}
                    intent={intent}
                    singular={singular}
                    schemas={schemas}
                  />
                ));
              })()}
            </div>
          ) : (
            // GRID / STACK DEFAULT LAYOUT
            <div className={cn(
              view === 'card_grid' 
                ? "grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-6" 
                : "flex flex-col gap-6"
            )}>
              {filteredAndSortedItems
                .filter((item: any) => !item.data.visibility_whitelist || (user && item.data.visibility_whitelist.includes(user.role)))
                .map((item, index) => (
                  <Card key={item.id || `card-${index}`} className={cn(
                    "group overflow-hidden border transition-all duration-300",
                    view === 'editor_stack' ? "bg-muted/10" : "hover:border-primary/50 shadow-sm"
                  )}>
                    <CardHeader className="p-4 border-b flex flex-col gap-4 bg-muted/30">
                      <div className="flex items-center justify-between w-full">
                        {(() => {
                          const titleKey = activeProjection?.title || 
                                           schema?.fields?.find((f: any) => f.isPrimary || f.config?.isPrimary)?.key ||
                                           schema?.fields?.find((f: any) => f.type === 'text')?.key || 
                                           'name';
                          const rawTitle = getDeep(item.data, titleKey);
                          const displayTitle = typeof rawTitle === 'string' ? rawTitle.replace(/_/g, ' ') : (rawTitle !== undefined ? String(rawTitle) : 'Elemento sin nombre');
                          return (
                            <Input
                              defaultValue={displayTitle}
                              onBlur={(e) => {
                                const newValue = e.target.value;
                                const currentVal = getDeep(item.data, titleKey);
                                if (newValue && newValue !== currentVal) {
                                  saveItem(context, { ...item, data: { ...item.data, [titleKey]: newValue } });
                                }
                              }}
                              className="h-8 px-2 text-sm font-bold tracking-tight bg-transparent border-transparent hover:border-border focus:bg-background transition-all"
                            />
                          );
                        })()}
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
                      {((blocks && blocks.length > 0) ? blocks : (activeProjection?.blocks || [])).length > 0 ? (
                        ((blocks && blocks.length > 0) ? blocks : (activeProjection?.blocks || [])).map((subBlock: any, bIdx: number) => {
                           let resolvedParentKey = subBlock.parent_key || subBlock.config?.parent_key;
                           if (!resolvedParentKey) {
                              const parentEntity = context;
                              const childSchema = schemas.find((s: any) => s.id === subBlock.schema_id || s.data?.name === subBlock.context) as any;
                              const relationField = (childSchema?.data?.fields as any[])?.find((f: any) => f.type === 'relation' && f.config?.relation?.entity === parentEntity);
                              resolvedParentKey = relationField?.key || `${parentEntity}_id`;
                          }
                          return (
                            <div key={subBlock.id || bIdx} className="w-full">
                              <AgnosticRenderer
                                block={subBlock}
                                parentId={item.id}
                                parentKey={resolvedParentKey}
                                context={subBlock.context || subBlock.config?.context}
                                record={item}
                              />
                            </div>
                          );
                        })
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
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
