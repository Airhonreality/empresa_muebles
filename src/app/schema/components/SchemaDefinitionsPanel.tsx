'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { DataItem, FieldDefinition } from '@/core/types';
import { 
  Database, Plus, Save, X, Trash2, ChevronUp, ChevronDown, 
  Layout, Code, Layers, Settings2, Edit3, Type, Hash, List, 
  Image as ImageIcon, CheckSquare, AlignLeft, Settings, Search, Asterisk, PlusCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AgnosticInput } from '@/components/agnostic/AgnosticInput';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  t: (key: string) => string;
}

// --- OPTIMIZATION: Memoized Field Row using Agnostic Primitives ---
const FieldRow = memo(({ 
  field, 
  isFirst, 
  isLast, 
  onUpdate, 
  onRemove, 
  onMove, 
  onAddTag, 
  onRemoveTag 
}: { 
  field: FieldDefinition & { originalIndex: number }, 
  isFirst: boolean,
  isLast: boolean,
  onUpdate: (i: number, patch: Partial<FieldDefinition>) => void,
  onRemove: (i: number) => void,
  onMove: (i: number, dir: 'up' | 'down') => void,
  onAddTag: (i: number, tag: string) => void,
  onRemoveTag: (i: number, tagIdx: number) => void
}) => {
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type size={12} />;
      case 'number': return <Hash size={12} />;
      case 'select': return <List size={12} />;
      case 'textarea': return <AlignLeft size={12} />;
      case 'image': return <ImageIcon size={12} />;
      case 'boolean': return <CheckSquare size={12} />;
      default: return <Code size={12} />;
    }
  };

  return (
    <div className="group flex items-center gap-4 bg-transparent hover:bg-muted/5 p-1 px-2 rounded-lg transition-colors border-b border-border/5">
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-30 transition-opacity">
        <button onClick={() => onMove(field.originalIndex, 'up')} disabled={isFirst}><ChevronUp size={10} /></button>
        <button onClick={() => onMove(field.originalIndex, 'down')} disabled={isLast}><ChevronDown size={10} /></button>
      </div>

      <button 
        onClick={() => onUpdate(field.originalIndex, { required: !field.required })}
        className={cn(
          "w-5 h-5 flex items-center justify-center rounded-md border transition-all shrink-0",
          field.required ? "bg-primary border-primary text-primary-foreground shadow-md" : "border-border/30 text-muted-foreground/20 hover:border-primary/40 hover:text-primary/40"
        )}
      >
        <Asterisk size={10} className={cn("transition-transform", field.required ? "rotate-0 scale-110" : "rotate-45")} />
      </button>

      <div className="flex-1 flex items-center gap-4 h-9">
        <div className="w-[120px]">
          <AgnosticInput
            value={field.key}
            onSync={(val) => onUpdate(field.originalIndex, { key: val })}
            placeholder="key"
            ghost
            className="text-[11px] font-mono font-bold text-foreground/70"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <AgnosticInput
            value={field.label}
            onSync={(val) => onUpdate(field.originalIndex, { label: val })}
            placeholder="Label Name"
            ghost
            className="text-xs font-semibold text-foreground/90"
          />
        </div>
        
        <div className="w-[110px]">
          <Select value={field.type} onValueChange={(val) => onUpdate(field.originalIndex, { type: val as any })}>
            <SelectTrigger className="h-7 bg-muted/5 border-none hover:bg-muted/10 transition-all rounded-lg text-[9px] font-black uppercase tracking-tight px-2">
               <div className="flex items-center gap-2">
                  {getFieldIcon(field.type)}
                  <SelectValue />
               </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-2xl border-border/20 bg-background/95 backdrop-blur-xl">
               {(['text', 'number', 'select', 'textarea', 'image', 'boolean'] as const).map(t => (
                 <SelectItem key={t} value={t} className="text-[10px] font-bold uppercase">{t}</SelectItem>
               ))}
            </SelectContent>
          </Select>
        </div>

        {field.type === 'select' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-primary/60 hover:text-primary bg-primary/5 rounded-lg border border-primary/10">
                 <List size={12} className="mr-1.5" />
                 {field.options?.length || 0} Options
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl shadow-2xl z-[100]" align="end">
               <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                     <input
                        placeholder="Add new option..."
                        className="h-8 w-full bg-muted/20 border-none rounded-lg px-3 text-xs font-medium focus:ring-1 focus:ring-primary/30 outline-none"
                        onKeyDown={e => {
                           if (e.key === 'Enter') {
                              const val = e.currentTarget.value.trim();
                              if (val) { onAddTag(field.originalIndex, val); e.currentTarget.value = ''; }
                           }
                        }}
                     />
                     <PlusCircle size={18} className="text-primary/40" />
                  </div>
                  <Separator className="bg-border/10" />
                  <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                     {(field.options ?? []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center justify-between group/opt p-1.5 rounded-lg hover:bg-muted/20 transition-colors">
                           <span className="text-xs font-semibold text-foreground/80">{opt}</span>
                           <button onClick={() => onRemoveTag(field.originalIndex, optIdx)} className="text-destructive/30 hover:text-destructive transition-colors">
                              <X size={12} />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <button onClick={() => onRemove(field.originalIndex)} className="h-8 w-8 flex items-center justify-center text-destructive/20 hover:text-destructive hover:bg-destructive/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={14} /></button>
    </div>
  );
});

FieldRow.displayName = 'FieldRow';

export function SchemaDefinitionsPanel({ t }: Props) {
  const { state } = useAppState();
  const { saveItem, deleteItem } = useAppDispatch();
  const schemas = state.data['schema_definitions'] ?? [];
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFields, setEditFields] = useState<FieldDefinition[]>([]);
  const [fieldSearch, setFieldSearch] = useState('');

  const openNew = () => {
    setEditId(`schema_${Date.now()}`);
    setEditName('');
    setEditFields([]);
    setIsEditorOpen(true);
  };

  const openEdit = (item: DataItem) => {
    setEditId(item.id);
    setEditName(item.data.name as string);
    setEditFields((item.data.fields as FieldDefinition[]) ?? []);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editId) return;
    await saveItem('schema_definitions', { id: editId, context: 'schema_definitions', data: { name: editName, fields: editFields } });
    setIsEditorOpen(false);
  };

  const addField = useCallback(() => setEditFields(f => [{ key: '', label: '', type: 'text', required: false }, ...f]), []);
  const updateField = useCallback((i: number, patch: Partial<FieldDefinition>) => setEditFields(f => f.map((fld, idx) => (idx === i ? { ...fld, ...patch } : fld))), []);
  const removeField = useCallback((i: number) => setEditFields(f => f.filter((_, idx) => idx !== i)), []);
  const handleAddTag = useCallback((i: number, tag: string) => setEditFields(f => f.map((fld, idx) => (idx === i ? { ...fld, options: [...(fld.options ?? []), tag] } : fld))), []);
  const handleRemoveTag = useCallback((i: number, tagIndex: number) => setEditFields(f => f.map((fld, idx) => (idx === i ? { ...fld, options: (fld.options ?? []).filter((_, tidx) => tidx !== tagIndex) } : fld))), []);
  const moveField = useCallback((i: number, direction: 'up' | 'down') => setEditFields(f => {
    const newFields = [...f];
    const target = direction === 'up' ? i - 1 : i + 1;
    if (target < 0 || target >= newFields.length) return f;
    [newFields[i], newFields[target]] = [newFields[target], newFields[i]];
    return newFields;
  }), []);

  const filteredFields = useMemo(() => {
    return editFields.map((f, i) => ({ ...f, originalIndex: i }))
      .filter(f => !fieldSearch || f.key.toLowerCase().includes(fieldSearch.toLowerCase()) || f.label.toLowerCase().includes(fieldSearch.toLowerCase()));
  }, [editFields, fieldSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Database className="text-primary" size={24} /> {t('schema.definitions')}
          </h2>
          <p className="text-muted-foreground text-xs font-medium opacity-50 italic">Core Data Engine</p>
        </div>
        <Button onClick={openNew} size="sm" variant="outline" className="rounded-xl px-4 font-bold border-primary/20 text-primary transition-all"><Plus size={16} /><span>{t('schema.new_schema')}</span></Button>
      </div>

      <Separator className="bg-border/20" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schemas.map(item => (
          <Card key={item.id} className="group overflow-hidden border-border/30 hover:border-primary/50 transition-all bg-background/40 rounded-2xl border hover:shadow-xl">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all"><Layout size={18} /></div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 rounded-lg"><Edit3 size={14} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/50" onClick={() => { if (confirm('Delete schema?')) deleteItem('schema_definitions', item.id); }}><Trash2 size={14} /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <h3 className="text-base font-bold text-foreground truncate">{item.data.name as string}</h3>
              <Badge variant="secondary" className="bg-muted/50 text-[9px] px-1.5 py-0 mt-1">{((item.data.fields as FieldDefinition[]) ?? []).length} Fields</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent className="sm:max-w-[850px] w-full p-0 bg-background/98 backdrop-blur-3xl border-l-border/20 flex flex-col">
          <div className="p-6 border-b border-border/10 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-md z-30">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/5 text-primary rounded-lg"><Settings2 size={18} /></div>
              <div>
                <SheetTitle className="text-base font-black tracking-tight">{editName || 'New Definition'}</SheetTitle>
                <SheetDescription className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Core Performance v1.0</SheetDescription>
              </div>
            </div>
            <div className="flex gap-2">
               <Button size="sm" variant="ghost" onClick={() => setIsEditorOpen(false)} className="rounded-xl px-4 h-9 text-xs font-bold">{t('common.cancel')}</Button>
               <Button size="sm" onClick={handleSave} className="rounded-xl px-6 h-9 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Save size={14} className="mr-2" />{t('common.save')}</Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-32 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-1">{t('schema.schema_name')}</label>
              <AgnosticInput
                value={editName}
                onSync={(val) => setEditName(val)}
                placeholder="Name your schema..."
                ghost
                className="text-2xl font-black focus:bg-transparent"
              />
              <Separator className="bg-primary/20 w-32 h-1 rounded-full" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between sticky top-[0px] bg-background/80 py-3 backdrop-blur-md z-20 border-b border-border/5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">{t('schema.fields_arch')}</span>
                  <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 border-primary/20 text-primary/60">{editFields.length}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
                    <input placeholder="Search..." value={fieldSearch} onChange={e => setFieldSearch(e.target.value)} className="h-8 w-32 bg-muted/10 border-none rounded-lg pl-8 pr-2 text-[10px] font-bold focus:ring-1 focus:ring-primary/20 transition-all outline-none" />
                  </div>
                  <Button size="sm" variant="outline" onClick={addField} className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5"><Plus size={12} className="mr-1.5" />{t('schema.add_field')}</Button>
                </div>
              </div>

              <div className="space-y-1">
                {filteredFields.map((f) => (
                  <FieldRow key={f.originalIndex} field={f} isFirst={f.originalIndex === 0} isLast={f.originalIndex === editFields.length - 1} onUpdate={updateField} onRemove={removeField} onMove={moveField} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
