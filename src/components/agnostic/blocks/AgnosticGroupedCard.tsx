/**
 * 🏛️ ARTEFACTO: AgnosticGroupedCard.tsx
 * ────────────
 * CAPA: Projection (Decentralized Blocks)
 * VERSIÓN: 1.0
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Renderizado agnóstico de layouts agrupados por clave jerárquica (e.g. Espacios).
 * - Aislamiento atómico de estado de segmentación (tabs) para evitar desincronización global.
 * - Ciclo de vida dinámico para renombrar grupos y agregar nuevas variantes bajo demanda.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Resolver dinámicamente la clave parentKey de los sub-bloques sin hardcodear.
 * - NEVER: Contener lógica rígida de nombres del ERP o negocio satélite.
 */
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Trash2, Plus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Importación dinámica para prevenir dependencias circulares complejas en tiempo de compilación
const AgnosticRenderer = dynamic(() => import('../engine/AgnosticRenderer').then(mod => mod.AgnosticRenderer), {
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse bg-muted/10 rounded-lg" />
});

interface AgnosticGroupedCardProps {
  groupName: string;
  items: any[];
  schema: any;
  context: string;
  group_by_key: string;
  segmentation_key?: string;
  segmentation_strategy?: string;
  blocks?: any[];
  activeProjection?: any;
  safeBlackout: string[];
  safeSwitches: string[];
  user: any;
  saveItem: (context: string, payload: any) => Promise<any>;
  deleteItem: (context: string, id: string) => Promise<void>;
  intent?: string;
  singular?: string;
  schemas: any[];
  segmentation_rename?: boolean;
}

export function AgnosticGroupedCard({
  groupName,
  items,
  schema,
  context,
  group_by_key,
  segmentation_key,
  segmentation_strategy,
  blocks,
  activeProjection,
  safeBlackout,
  safeSwitches,
  user,
  saveItem,
  deleteItem,
  intent,
  singular,
  schemas,
  segmentation_rename = false,
}: AgnosticGroupedCardProps) {
  
  const segments = segmentation_key
    ? Array.from(new Set(items.map((i: any) => i.data[segmentation_key]).filter(Boolean))) as string[]
    : [];

  const [activeSegment, setActiveSegment] = useState<string | null>(segments[0] || null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSegment, setIsAddingSegment] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [renamingSegment, setRenamingSegment] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const commitSegmentRename = async (oldName: string) => {
    const newName = renameValue.trim();
    setRenamingSegment(null);
    if (!newName || newName === oldName || !segmentation_key) return;
    const itemsToUpdate = items.filter((i: any) => i.data[segmentation_key] === oldName);
    for (const it of itemsToUpdate) {
      await saveItem(context, { id: it.id, data: { ...it.data, [segmentation_key]: newName } });
    }
    setActiveSegment(newName);
  };

  // Fallback al primer item si no coincide la variante activa
  const activeItem = segmentation_key 
    ? (items.find((i: any) => i.data[segmentation_key] === activeSegment) || items[0])
    : items[0];

  const handleAddVariant = async () => {
    if (segmentation_key && newSegmentName.trim() && activeItem) {
      const newItem = { ...activeItem.data };
      delete newItem.id;
      newItem[segmentation_key] = newSegmentName.trim();
      
      await saveItem(context, { data: newItem });
      setActiveSegment(newSegmentName.trim());
      setIsAddingSegment(false);
      setNewSegmentName('');
    }
  };

  return (
    <Card className="group overflow-hidden border bg-muted/10 transition-all duration-300">
      <CardHeader className="p-4 border-b flex flex-col gap-4 bg-muted/30">
        <div className="flex items-center justify-between w-full">
          <Input
            defaultValue={groupName}
            onBlur={(e) => {
              const newValue = e.target.value;
              if (newValue && newValue !== groupName) {
                items.forEach((it: any) => {
                  saveItem(context, { ...it, data: { ...it.data, [group_by_key]: newValue } });
                });
              }
            }}
            className="h-8 px-2 text-sm font-bold tracking-tight bg-transparent border-transparent hover:border-border focus:bg-background transition-all max-w-[250px]"
          />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="w-8 h-8 opacity-40 hover:opacity-100">
              <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
            </Button>
            {activeItem && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={async () => {
                  if (confirm(`¿Confirmas la eliminación de "${groupName}" y todos sus registros asociados?`)) {
                    for (const it of items) {
                      await deleteItem(context, it.id);
                    }
                  }
                }} 
                className="w-8 h-8 opacity-40 hover:opacity-100 hover:text-destructive"
                title="Eliminar elemento y todos sus registros"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {segmentation_key && segmentation_strategy === 'tabs' && (
          <div className="flex items-center gap-3">
            {segments.length > 0 ? (
              <Tabs value={activeSegment || ''} onValueChange={setActiveSegment} className="w-fit animate-in fade-in duration-300">
                <TabsList className="bg-muted/50 h-8">
                  {segments.map(s => (
                    <TabsTrigger
                      key={s}
                      value={s}
                      className="text-[10px] font-bold uppercase tracking-wider px-3 flex items-center gap-1.5"
                      onDoubleClick={segmentation_rename ? (e) => {
                        e.preventDefault();
                        setRenamingSegment(s);
                        setRenameValue(s);
                      } : undefined}
                    >
                      {segmentation_rename && renamingSegment === s ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); commitSegmentRename(s); }
                            if (e.key === 'Escape') { setRenamingSegment(null); }
                          }}
                          onBlur={() => commitSegmentRename(s)}
                          onClick={e => e.stopPropagation()}
                          className="w-16 bg-transparent outline-none text-[10px] font-bold uppercase tracking-wider text-center border-b border-primary/40"
                        />
                      ) : s}
                      {segments.length > 1 && renamingSegment !== s && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const itemToDelete = items.find((i: any) => i.data[segmentation_key] === s);
                            if (itemToDelete) {
                              deleteItem(context, itemToDelete.id);
                              if (activeSegment === s) {
                                const remaining = segments.filter(x => x !== s);
                                setActiveSegment(remaining[0] || null);
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              e.preventDefault();
                              const itemToDelete = items.find((i: any) => i.data[segmentation_key] === s);
                              if (itemToDelete) {
                                deleteItem(context, itemToDelete.id);
                                if (activeSegment === s) {
                                  const remaining = segments.filter(x => x !== s);
                                  setActiveSegment(remaining[0] || null);
                                }
                              }
                            }
                          }}
                          className="hover:text-destructive p-0.5 rounded-sm hover:bg-muted/50 transition-colors ml-1 cursor-pointer inline-flex items-center justify-center"
                          title="Eliminar"
                        >
                          <X className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider italic">
                Sin segmentación
              </span>
            )}
            
            {intent !== 'view' && (
              <div className="flex items-center gap-2">
                {isAddingSegment ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      autoFocus
                      placeholder={`Nueva ${segmentation_key.replace(/_/g, ' ')}...`}
                      value={newSegmentName}
                      onChange={e => setNewSegmentName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddVariant();
                        if (e.key === 'Escape') setIsAddingSegment(false);
                      }}
                      className="h-8 w-32 text-[10px] uppercase font-bold"
                    />
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleAddVariant}><Check className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsAddingSegment(false)}><X className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingSegment(true)} className="h-8 text-[10px] uppercase font-bold text-muted-foreground">
                    <Plus className="w-3 h-3 mr-1" /> Añadir
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && activeItem && (
        <CardContent className="p-4 space-y-4">
          {((blocks && blocks.length > 0) ? blocks : (activeProjection?.blocks || [])).map((subBlock: any, bIdx: number) => {
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
                  parentId={activeItem.id}
                  parentKey={resolvedParentKey}
                  context={subBlock.context || subBlock.config?.context}
                  record={activeItem}
                />
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
