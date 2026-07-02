/**
 * 🏛️ ARTEFACTO: AgnosticTable.tsx
 * ────────────
 * CAPA: Projection (Decentralized Blocks)
 * VERSIÓN: 2.0
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Renderizado e interactividad tabular agnóstica pura (DataTable view).
 * - Búsqueda inline, paginación y ordenamiento dinámico por columnas.
 * - Despacho de overlay para edición y eliminación inline de registros.
 * - Resolución relacional inteligente para mostrar nombres legibles en vez de UUIDs.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser completamente agnóstico al dominio (muebles, cotizaciones, etc.).
 * - NEVER: Contener lógica rígida de validación de negocio.
 */
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2, ArrowUpDown, SlidersHorizontal, Search } from 'lucide-react';
import { cn, getDeep } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgnosticLogicEngine } from '@/lib/agnostic/AgnosticLogicEngine';
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData';

interface AgnosticTableProps {
  items: any[];
  schema: any;
  context: string;
  saveItem: (context: string, payload: any) => Promise<any>;
  deleteItem: (context: string, id: string) => Promise<void>;
  openOverlay: (overlay: any) => void;
  intent?: string;
  singular?: string;
  safeBlackout: string[];
  safeSwitches: string[];
  user: any;
  searchable?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: string | null;
  setSortField: (field: string | null) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (dir: 'asc' | 'desc') => void;
  schemas: any[];
  materiaStore: any;
}

// 🏛️ RESOLVER DYNAMIC RELATION LABELS
function resolveRelationLabel(
  item: any, 
  field: any, 
  schemas: any[], 
  materiaStore: any
): string {
  if (!field || field.type !== 'relation') return '';
  const relId = item.data?.[field.key];
  if (!relId) return '';

  const relEntity = field.config?.relation?.entity;
  if (!relEntity) return String(relId);

  const relList = materiaStore[relEntity] || [];
  const relItem = relList.find((r: any) => r.id === relId);
  if (!relItem) return String(relId);

  const relatedSchema = schemas.find((s: any) => s.id === relEntity || s.data?.name === relEntity || s.data?.slug === relEntity)?.data;
  const relFields = Array.isArray(relatedSchema?.fields) ? (relatedSchema.fields as any[]) : [];

  // Priority order to resolve readable labels dynamically
  const prioKeys = [
    field.config?.relation?.displayField,
    field.config?.relation?.display_field,
    relFields.find((f: any) => f.isPrimary || f.config?.isPrimary)?.key,
    relFields.find((f: any) => f.key === 'name' || f.key === 'nombre' || f.key === 'descripcion' || f.key === 'label' || f.key === 'title')?.key,
    relFields.find((f: any) => f.type === 'text' && f.key !== 'sku' && f.key !== 'id')?.key,
    'name'
  ].filter(Boolean);

  for (const k of prioKeys) {
    const val = relItem.data?.[k];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val);
    }
  }

  return relItem.data?.name || relItem.data?.descripcion || relItem.data?.nombre || String(relId);
}

function RelationCell({
  item,
  field,
  val,
  handleInlineSave,
  schemas,
  searchQuery,
  setSearchQuery
}: {
  item: any;
  field: any;
  val: any;
  handleInlineSave: (item: any, key: string, value: any) => Promise<void>;
  schemas: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const rel = field.config?.relation;
  const { data: relatedList, isLoading } = useRelationData(rel?.entity);

  const relatedSchema = rel ? schemas.find((s: any) => s.id === rel.entity || s.data?.name === rel.entity || s.data?.slug === rel.entity)?.data : null;
  const relFields = Array.isArray(relatedSchema?.fields) ? (relatedSchema.fields as any[]) : [];

  const displayKey = field.config?.relation?.displayField || 
                     field.config?.relation?.display_field || 
                     relFields.find((f: any) => f.isPrimary || f.config?.isPrimary)?.key ||
                     relFields.find((f: any) => f.key === 'name' || f.key === 'nombre' || f.key === 'descripcion' || f.key === 'label' || f.key === 'title')?.key ||
                     'name';

  const q = searchQuery.toLowerCase();
  const filteredList = q
    ? relatedList.filter((r: any) => {
        const labelVal = r.data?.[displayKey] || r.data?.name || r.data?.descripcion || r.data?.nombre || '';
        return String(labelVal).toLowerCase().includes(q);
      })
    : relatedList;

  return (
    <Select 
      name={field.key} 
      value={String(val || '')}
      onValueChange={(newVal) => handleInlineSave(item, field.key, newVal)}
    >
      <SelectTrigger className="bg-transparent hover:bg-muted/10 border-none h-7 py-0.5 px-2 text-xs font-semibold focus:ring-1 focus:ring-primary/20 rounded w-full flex items-center justify-between gap-1 shadow-none">
        <SelectValue placeholder={isLoading ? "Cargando..." : "Seleccionar..."} />
      </SelectTrigger>
      <SelectContent className="rounded-md border border-border bg-popover shadow-md max-h-60 overflow-y-auto z-[9999]">
        <div className="p-2 border-b sticky top-0 bg-popover z-50">
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8 text-[10px] font-bold uppercase tracking-wider"
          />
        </div>
        {isLoading ? (
          <div className="p-3 text-[10px] text-center text-muted-foreground font-bold uppercase tracking-wider animate-pulse">
            Cargando opciones...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-3 text-[10px] text-center text-muted-foreground font-bold uppercase tracking-wider">
            Sin resultados
          </div>
        ) : (
          <>
            {filteredList.slice(0, 100).map((r: any) => {
              let label = '';
              const prioKeys = [displayKey, 'name', 'nombre', 'descripcion', 'label', 'title'];
              for (const k of prioKeys) {
                const valOpt = r.data?.[k];
                if (valOpt !== undefined && valOpt !== null && String(valOpt).trim() !== '') {
                  label = String(valOpt);
                  break;
                }
              }
              if (!label) {
                label = r.data?.name || r.data?.descripcion || r.data?.nombre || r.id;
              }
              return (
                <SelectItem key={r.id} value={String(r.id)} className="text-xs font-semibold">
                  {label}
                </SelectItem>
              );
            })}
            {filteredList.length > 100 && (
              <div className="p-2 text-[9px] text-center text-muted-foreground/60 font-semibold bg-muted/20 border-t uppercase tracking-wider">
                Mostrando primeros 100 resultados de {filteredList.length}
              </div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

export function AgnosticTable({
  items,
  schema,
  context,
  saveItem,
  deleteItem,
  openOverlay,
  intent,
  singular,
  safeBlackout,
  safeSwitches,
  user,
  searchable = true,
  searchQuery,
  setSearchQuery,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  schemas,
  materiaStore,
}: AgnosticTableProps) {
  const [searchQueries, setSearchQueries] = React.useState<Record<string, string>>({});
  
  const handleSort = (fieldKey: string) => {
    if (sortField === fieldKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(fieldKey);
      setSortDirection('asc');
    }
  };

  const handleInlineSave = async (item: any, key: string, value: any) => {
    const nextData = { ...item.data, [key]: value };
    const computedData = AgnosticLogicEngine.compute(schema, nextData, materiaStore);
    if (saveItem) {
      await saveItem(context, { id: item.id, data: computedData });
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 🔍 GLASSMORPHIC DATATABLE SEARCH & ACTION BAR */}
      {searchable !== false && (
        <div className="ag-toolbar animate-in fade-in duration-300">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar en todos los campos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border h-9 font-bold text-xs"
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Proyección Inteligente Activa
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="ag-empty-state text-xs font-bold uppercase tracking-wider">
          No se encontraron registros en esta proyección
        </div>
      ) : (
        <div className="ag-table-shell animate-in fade-in duration-500">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                {((schema.fields || []) as any[]).map((field: any, fieldIndex: number) => {
                  if (field.key.startsWith('_') || safeBlackout.includes(field.key)) return null;
                  if (safeSwitches.length > 0 && !safeSwitches.includes(field.key)) return null;
                  const isSorted = sortField === field.key;
                  return (
                    <th 
                      key={field.key} 
                      onClick={() => handleSort(field.key)}
                      className={cn(
                        "h-9 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap",
                        fieldIndex === 0 && "sticky left-0 z-10 bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {field.label}
                        <ArrowUpDown className={cn("w-3 h-3 transition-colors", isSorted ? "text-primary" : "text-muted-foreground/30")} />
                      </div>
                    </th>
                  );
                })}
                {(intent === 'create' || intent === 'edit') && (
                  <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {items.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="hover:bg-muted/5 transition-colors group/row">
                  {((schema.fields || []) as any[]).map((field: any, fieldIndex: number) => {
                    if (field.key.startsWith('_') || safeBlackout.includes(field.key)) return null;
                    if (safeSwitches.length > 0 && !safeSwitches.includes(field.key)) return null;
                    
                    const val = getDeep(item.data, field.key);
                    
                    // Determine if field is derived/computed (and thus readonly)
                    const isDerived = !!field.config?.derivation || 
                                      field.readOnly || 
                                      field.key === 'id' || 
                                      (field.key.endsWith('_id') && field.key !== 'catalogo_id');

                    const isEditable = (intent === 'create' || intent === 'edit') && !isDerived;

                    return (
                      <td key={field.key} className={cn(
                        "h-[var(--ag-table-row)] p-1 text-xs font-semibold text-foreground truncate max-w-[220px] min-w-[120px]",
                        fieldIndex === 0 && "sticky left-0 z-[5] bg-card"
                      )}>
                        {isEditable ? (
                          field.type === 'relation' ? (
                            <RelationCell
                              item={item}
                              field={field}
                              val={val}
                              handleInlineSave={handleInlineSave}
                              schemas={schemas}
                              searchQuery={searchQueries[`${item.id}-${field.key}`] || ''}
                              setSearchQuery={(q) => setSearchQueries(prev => ({ ...prev, [`${item.id}-${field.key}`]: q }))}
                            />
                          ) : (
                            <Input
                              type={field.type === 'number' ? 'number' : 'text'}
                              key={`${item.id}-${field.key}-${val}`}
                              defaultValue={val !== undefined && val !== null ? val : ''}
                              onBlur={(e) => handleInlineSave(item, field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleInlineSave(item, field.key, field.type === 'number' ? Number(e.currentTarget.value) : e.currentTarget.value);
                                  e.currentTarget.blur();
                                }
                              }}
                              className="bg-transparent hover:bg-muted/10 focus:bg-background border-none h-7 py-0.5 px-2 text-xs font-semibold focus:ring-1 focus:ring-primary/20 rounded w-full shadow-none"
                            />
                          )
                        ) : (
                          <div className="px-2 py-0.5 truncate text-muted-foreground font-bold">
                            {field.type === 'relation' ? (
                              resolveRelationLabel(item, field, schemas, materiaStore)
                            ) : field.type === 'boolean' ? (
                              val ? 'SÍ' : 'NO'
                            ) : (
                              String(val !== undefined && val !== null ? val : '')
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {(intent === 'create' || intent === 'edit') && (
                    <td className="p-1 text-right">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground/50 group-hover/row:text-foreground transition-colors duration-200">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openOverlay({ type: 'DIALOG', title: `Editar ${singular || 'Elemento'}`, component: 'AgnosticForm', props: { schema, context, record: item, activeRecord: item, hideSubmit: false } })}
                          className="w-7 h-7 hover:text-primary hover:bg-primary/10 transition-colors rounded-md"
                          title="Editar Ficha"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteItem(context, item.id)}
                          className="w-7 h-7 hover:text-destructive hover:bg-destructive/10 transition-colors rounded-md"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
