'use client';

import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { DataItem } from '@/core/types';
import { 
  Layout, Plus, Save, Trash2, Edit3, Layers, 
  Settings2, MoveRight, ShieldAlert, Zap 
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface Props {
  t: (key: string) => string;
}

export function PageRoutesPanel({ t }: Props) {
  const { state } = useAppState();
  const { saveItem, deleteItem } = useAppDispatch();
  const routes = state.data['page_routes'] ?? [];
  const schemas = state.data['schema_definitions'] ?? [];

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({
    path: '',
    name: '',
    layoutStyle: 'compact',
    requiredRole: '',
    fallbackPath: '',
    blocks: []
  });

  const openNew = () => {
    setEditId(`route_${Date.now()}`);
    setEditData({ path: '/', name: '', layoutStyle: 'compact', requiredRole: '', fallbackPath: '', blocks: [] });
    setIsEditorOpen(true);
  };

  const openEdit = (item: DataItem) => {
    setEditId(item.id);
    setEditData({
      ...item.data,
      blocks: item.data.blocks ?? []
    });
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editId) return;
    await saveItem('page_routes', { id: editId, context: 'page_routes', data: editData });
    setIsEditorOpen(false);
  };

  const addBlock = () => {
    setEditData({
      ...editData,
      blocks: [...editData.blocks, { type: 'form', schemaId: '', title: '', description: '' }]
    });
  };

  const updateBlock = (idx: number, patch: any) => {
    const newBlocks = [...editData.blocks];
    newBlocks[idx] = { ...newBlocks[idx], ...patch };
    setEditData({ ...editData, blocks: newBlocks });
  };

  const removeBlock = (idx: number) => {
    setEditData({ ...editData, blocks: editData.blocks.filter((_: any, i: number) => i !== idx) });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Layout className="text-primary" size={24} /> {t('routes.title')}
          </h2>
          <p className="text-muted-foreground text-xs font-medium opacity-50 italic">Dynamic Route Orchestrator</p>
        </div>
        <Button onClick={openNew} size="sm" variant="outline" className="rounded-xl px-4 font-bold border-primary/20 text-primary transition-all"><Plus size={16} /><span>{t('routes.new')}</span></Button>
      </div>

      <Separator className="bg-border/20" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {routes.map(route => (
          <Card key={route.id} className="group overflow-hidden border-border/30 hover:border-primary/50 transition-all bg-background/40 rounded-2xl border hover:shadow-xl">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all"><Layers size={18} /></div>
                <div>
                   <h3 className="text-sm font-black tracking-tight">{route.data.name}</h3>
                   <code className="text-[10px] text-muted-foreground font-mono">{route.data.path}</code>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => openEdit(route)} className="h-8 w-8 rounded-lg"><Edit3 size={14} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/50" onClick={() => { if (confirm('Delete route?')) deleteItem('page_routes', route.id); }}><Trash2 size={14} /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="flex gap-2 items-center">
                 <Badge variant="outline" className="text-[9px] uppercase tracking-widest px-1.5 py-0 border-border/20">{route.data.layoutStyle}</Badge>
                 {route.data.requiredRole ? (
                    <Badge className="bg-primary/10 text-primary text-[9px] font-bold border-none"><ShieldAlert size={10} className="mr-1" /> {route.data.requiredRole}</Badge>
                 ) : (
                    <Badge variant="secondary" className="text-[9px] font-bold opacity-40 italic">Public Access</Badge>
                 )}
                 <span className="text-[10px] text-muted-foreground ml-auto">{route.data.blocks?.length || 0} Blocks</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent className="sm:max-w-[800px] w-full p-0 bg-background/98 backdrop-blur-3xl border-l-border/20 flex flex-col">
          <div className="p-6 border-b border-border/10 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-md z-30">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/5 text-primary rounded-lg"><Settings2 size={18} /></div>
              <SheetTitle className="text-base font-black tracking-tight">{editData.name || 'New Route Configuration'}</SheetTitle>
            </div>
            <div className="flex gap-2">
               <Button size="sm" variant="ghost" onClick={() => setIsEditorOpen(false)} className="rounded-xl px-4 h-9 text-xs font-bold">{t('common.cancel')}</Button>
               <Button size="sm" onClick={handleSave} className="rounded-xl px-6 h-9 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Save size={14} className="mr-2" />{t('common.save')}</Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
            {/* --- IDENTITY & ROUTING LAYER --- */}
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Scene Definition</p>
                  </div>
                  <div className="space-y-4 p-5 bg-muted/5 border border-border/10 rounded-3xl">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Path</label>
                        <AgnosticInput value={editData.path} onSync={(v) => setEditData({...editData, path: v})} placeholder="/example" ghost className="font-mono text-sm font-bold" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Friendly Name</label>
                        <AgnosticInput value={editData.name} onSync={(v) => setEditData({...editData, name: v})} placeholder="Dashboard Name" ghost className="font-black text-lg" />
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <ShieldAlert className="text-primary/40" size={14} />
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sovereign Security</p>
                  </div>
                  <div className="space-y-4 p-5 bg-primary/[0.02] border border-primary/10 rounded-3xl">
                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Required Role (Empty = Public)</label>
                        <Select value={editData.requiredRole || 'none'} onValueChange={(v) => setEditData({...editData, requiredRole: v === 'none' ? '' : v})}>
                           <SelectTrigger className="bg-transparent border-none p-0 h-auto focus:ring-0">
                              <SelectValue placeholder="Select Role" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="none">Public (No Guard)</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="customer">Customer</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-1 pt-2">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Redirection Fallback (on fail)</label>
                        <AgnosticInput value={editData.fallbackPath} onSync={(v) => setEditData({...editData, fallbackPath: v})} placeholder="/login" ghost className="text-xs font-mono" />
                     </div>
                  </div>
               </div>
            </div>

            <Separator className="bg-border/5" />

            {/* --- COMPOSITION LAYER --- */}
            <div className="space-y-6 pb-20">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Zap size={14} className="text-primary animate-pulse" />
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">Block Composition</p>
                  </div>
                  <Button onClick={addBlock} variant="ghost" size="sm" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary rounded-xl"><Plus size={12} className="mr-1.5" /> Add Block</Button>
               </div>

               <div className="space-y-4">
                  {editData.blocks.map((block: any, idx: number) => (
                    <div key={idx} className="group relative p-6 bg-background border border-border/10 rounded-3xl hover:border-primary/20 transition-all shadow-sm">
                       <button onClick={() => removeBlock(idx)} className="absolute -right-2 -top-2 w-7 h-7 bg-destructive/10 text-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"><Trash2 size={12} /></button>
                       <div className="grid grid-cols-12 gap-6">
                          <div className="col-span-3 space-y-3">
                             <label className="text-[8px] font-black uppercase text-muted-foreground/40">Block Type</label>
                             <Select value={block.type} onValueChange={(v) => updateBlock(idx, { type: v })}>
                                <SelectTrigger className="bg-muted/10 border-none h-9 rounded-xl text-[10px] font-bold uppercase tracking-tight">
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="form">Agnostic Form</SelectItem>
                                   <SelectItem value="table">Data Table</SelectItem>
                                   <SelectItem value="custom">Custom Actor</SelectItem>
                                   <SelectItem value="hero">Hero Section</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                          <div className="col-span-4 space-y-3">
                             <label className="text-[8px] font-black uppercase text-muted-foreground/40">Materia Entity (Schema)</label>
                             <Select value={block.schemaId} onValueChange={(v) => updateBlock(idx, { schemaId: v })}>
                                <SelectTrigger className="bg-muted/10 border-none h-9 rounded-xl text-[10px] font-bold">
                                   <SelectValue placeholder="Select Schema" />
                                </SelectTrigger>
                                <SelectContent>
                                   {schemas.map((s: any) => (
                                     <SelectItem key={s.id} value={s.id}>{s.data.name}</SelectItem>
                                   ))}
                                </SelectContent>
                             </Select>
                          </div>
                          <div className="col-span-5 space-y-3">
                             <label className="text-[8px] font-black uppercase text-muted-foreground/40">Block Identity</label>
                             <AgnosticInput value={block.title} onSync={(v) => updateBlock(idx, { title: v })} placeholder="Block Title" ghost className="font-bold text-sm" />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
