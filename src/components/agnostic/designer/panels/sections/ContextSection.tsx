'use client';

import React, { useState, useMemo } from 'react';
import type { Node, RenderMode } from '@agnostic/core';
import { Database, X, Settings2, Plus, ChevronsUpDown, ArrowRight, Shuffle, List, FileInput, CreditCard, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FieldPickerModal } from '../FieldPickerModal';

// ─── PROJECTION MODES ─────────────────────────────────────────────────────────

type ProjectionMode = 'libre' | 'form' | 'list' | 'card' | 'sheet';

const PROJECTION_OPTIONS: {
  value: ProjectionMode;
  label: string;
  hint: string;
  icon: React.ComponentType<any>;
}[] = [
  { value: 'libre',  label: 'Libre',   hint: 'Cada campo es un átomo en el árbol — diseño libre',  icon: Shuffle     },
  { value: 'form',   label: 'Form',    hint: 'Vista de formulario auto-organizada',                  icon: FileInput   },
  { value: 'list',   label: 'Lista',   hint: 'Tabla / colección de registros',                       icon: List        },
  { value: 'card',   label: 'Tarjeta', hint: 'Registro único en vista de tarjeta',                   icon: CreditCard  },
  { value: 'sheet',  label: 'Sheet',   hint: 'Formulario en panel lateral',                           icon: PanelRight  },
];

// ─── SCHEMA PICKER POPOVER ────────────────────────────────────────────────────

function SchemaCombobox({
  schemas,
  excluded,
  onSelect,
}: {
  schemas: any[];
  excluded: string[];
  onSelect: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const available = useMemo(
    () => schemas.filter((s: any) =>
      s.data?.name &&
      !excluded.includes(s.data.name) &&
      (!search || s.data.name.toLowerCase().includes(search.toLowerCase()))
    ),
    [schemas, excluded, search]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm"
          className="w-full h-8 border-dashed border-primary/20 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest gap-1.5 text-muted-foreground hover:text-primary">
          <Plus size={11} /> Proyectar Schema
          <ChevronsUpDown size={10} className="ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 bg-card border rounded-xl shadow-lg z-[10000]">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar schema..."
          className="h-7 text-xs font-semibold mb-2"
          autoFocus
        />
        <div className="max-h-52 overflow-y-auto space-y-0.5">
          {available.length === 0 && (
            <p className="text-center py-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Sin schemas disponibles</p>
          )}
          {available.map((s: any) => (
            <div key={s.id}
              onClick={() => { onSelect(s.data.name); setOpen(false); setSearch(''); }}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{s.data.name}</span>
              <span className="text-[9px] opacity-50">{s.data?.fields?.length ?? 0} campos</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── PROJECTION MODE PICKER (second step) ────────────────────────────────────

function ProjectionModePicker({
  schemaName,
  schemas,
  onConfirm,
  onCancel,
}: {
  schemaName: string;
  schemas: any[];
  onConfirm: (mode: ProjectionMode, selectedFields?: string[]) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<ProjectionMode>('libre');
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const schemaItem = schemas.find((s: any) => s.data?.name === schemaName);

  const handleModeConfirm = () => {
    if (mode === 'libre') {
      setShowFieldPicker(true);
    } else {
      onConfirm(mode);
    }
  };

  if (showFieldPicker) {
    return (
      <FieldPickerModal
        schemaName={schemaName}
        schema={schemaItem}
        currentFilter={undefined}
        onConfirm={keys => onConfirm('libre', keys)}
        onClose={() => setShowFieldPicker(false)}
      />
    );
  }

  return (
    <div className="mt-2 p-3 bg-muted/10 border border-primary/10 rounded-xl space-y-3 animate-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2">
        <Database size={11} className="text-primary shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary truncate">{schemaName}</span>
        <ArrowRight size={10} className="text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground font-bold">¿Cómo proyectar?</span>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {PROJECTION_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <button key={opt.value}
              onClick={() => setMode(opt.value)}
              title={opt.hint}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border py-2 px-1 text-[9px] font-black uppercase tracking-widest transition-colors',
                mode === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground hover:bg-muted/30 border-transparent hover:text-foreground'
              )}
            >
              <Icon size={13} />
              {opt.label}
            </button>
          );
        })}
      </div>

      <p className="text-[9px] text-muted-foreground leading-relaxed">
        {PROJECTION_OPTIONS.find(o => o.value === mode)?.hint}
      </p>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}
          className="flex-1 h-7 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          Cancelar
        </Button>
        <Button size="sm" onClick={handleModeConfirm}
          className="flex-1 h-7 text-[9px] font-black uppercase tracking-widest gap-1">
          {mode === 'libre' ? 'Elegir campos' : 'Añadir'}
          <ArrowRight size={10} />
        </Button>
      </div>
    </div>
  );
}

// ─── LIBRE PROJECTION CHIP (schema with field atoms) ─────────────────────────

function LibreChip({
  schemaName,
  schemas,
  filter,
  onEditFilter,
  onRemove,
}: {
  schemaName: string;
  schemas: any[];
  filter: string[] | undefined;
  onEditFilter: () => void;
  onRemove: () => void;
}) {
  const schemaItem = schemas.find((s: any) => s.data?.name === schemaName);
  const allFields = schemaItem?.data?.fields ?? [];
  const activeCount = filter ? filter.length : allFields.length;

  return (
    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
      <Shuffle size={11} className="text-primary shrink-0" />
      <span className="text-xs font-bold text-primary flex-1 truncate">{schemaName}</span>
      <span className="text-[9px] font-black text-muted-foreground shrink-0">
        libre · {activeCount}/{allFields.length} campos
      </span>
      <button onClick={onEditFilter}
        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        title="Editar campos proyectados">
        <Settings2 size={11} />
      </button>
      <button onClick={onRemove}
        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Quitar proyección y eliminar nodos de campo">
        <X size={11} />
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export interface ProjectionPayload {
  mode: ProjectionMode;
  schemaName: string;
  selectedFields?: string[];
}

interface Props {
  node: Node;
  schemas: any[];
  onChange: (patch: Partial<Node>) => void;
  onProjectSchema: (payload: ProjectionPayload) => void;
  onRemoveLibreProjection: (schemaName: string) => void;
}

export function ContextSection({ node, schemas, onChange, onProjectSchema, onRemoveLibreProjection }: Props) {
  const [pendingSchema, setPendingSchema] = useState<string | null>(null);
  const [pickerForFilter, setPickerForFilter] = useState<string | null>(null);

  // Which schemas are currently in libre mode (in node.contexts[])
  const libreSchemas = node.contexts;

  const handleSelectSchema = (schemaName: string) => {
    setPendingSchema(schemaName);
  };

  const handleConfirmProjection = (mode: ProjectionMode, selectedFields?: string[]) => {
    if (!pendingSchema) return;
    onProjectSchema({ mode, schemaName: pendingSchema, selectedFields });
    setPendingSchema(null);
  };

  const applyFilter = (schemaName: string, selectedKeys: string[]) => {
    const schemaItem = schemas.find((s: any) => s.data?.name === schemaName);
    const allKeys = (schemaItem?.data?.fields ?? []).map((f: any) => f.key);
    const isAll = selectedKeys.length === allKeys.length;
    const context_filter = { ...node.context_filter };
    if (isAll) delete context_filter[schemaName];
    else context_filter[schemaName] = selectedKeys;
    onChange({ context_filter: Object.keys(context_filter).length ? context_filter : undefined });
  };

  return (
    <section className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Database size={12} className="text-primary" /> Contexto de Datos
      </h4>

      <div className="space-y-2">
        {/* Libre projection chips */}
        {libreSchemas.map(ctx => (
          <LibreChip
            key={ctx}
            schemaName={ctx}
            schemas={schemas}
            filter={node.context_filter?.[ctx]}
            onEditFilter={() => setPickerForFilter(ctx)}
            onRemove={() => onRemoveLibreProjection(ctx)}
          />
        ))}

        {/* Schema selector */}
        <SchemaCombobox
          schemas={schemas}
          excluded={libreSchemas}
          onSelect={handleSelectSchema}
        />

        {/* Projection mode picker (inline, appears after selecting schema) */}
        {pendingSchema && (
          <ProjectionModePicker
            schemaName={pendingSchema}
            schemas={schemas}
            onConfirm={handleConfirmProjection}
            onCancel={() => setPendingSchema(null)}
          />
        )}
      </div>

      {/* Field filter picker for libre schemas */}
      {pickerForFilter && (
        <FieldPickerModal
          schemaName={pickerForFilter}
          schema={schemas.find((s: any) => s.data?.name === pickerForFilter)}
          currentFilter={node.context_filter?.[pickerForFilter]}
          onConfirm={keys => { applyFilter(pickerForFilter, keys); setPickerForFilter(null); }}
          onClose={() => setPickerForFilter(null)}
        />
      )}
    </section>
  );
}
