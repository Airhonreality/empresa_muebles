'use client';

import { useState } from 'react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { DataItem } from '@/core/types';
import { 
  Route, Plus, Save, Trash2, Edit3, ExternalLink, 
  Layout, Search, Shield, ChevronRight, LayoutGrid, Braces
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AgnosticInput } from '@/components/agnostic/AgnosticInput';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  t: (key: string) => string;
}

export function PageRoutesPanel({ t }: Props) {
  const { state } = useAppState();
  const { saveItem, deleteItem } = useAppDispatch();
  const routes = state.data['page_routes'] ?? [];
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Partial<DataItem>>({});

  const openNew = () => {
    setEditingRoute({
      id: `route_${Date.now()}`,
      data: { path: '/', name: '', type: 'form', blocks: [] }
    });
    setIsEditorOpen(true);
  };

  const openEdit = (item: DataItem) => {
    setEditingRoute(item);
    setIsEditorOpen(true);
  };

  const updateData = (patch: any) => {
    setEditingRoute(prev => ({
      ...prev,
      data: { ...prev.data, ...patch }
    }));
  };

  const handleSave = async () => {
    if (!editingRoute.id || !editingRoute.data?.path) return;
    await saveItem('page_routes', editingRoute as DataItem);
    setIsEditorOpen(false);
    toast.success('Route projection updated.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Route className="text-primary" size={24} />
            {t('routes.title')}
          </h2>
          <p className="text-muted-foreground text-xs font-medium opacity-50 italic">Dynamic Path Orchestration</p>
        </div>
        <Button onClick={openNew} size="sm" variant="outline" className="rounded-xl px-4 font-bold border-primary/20 text-primary">
          <Plus size={16} className="mr-2" />
          {t('routes.new')}
        </Button>
      </div>

      <Separator className="bg-border/20" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {routes.map(item => (
          <Card key={item.id} className="group overflow-hidden border-border/30 hover:border-primary/50 transition-all bg-background/40 rounded-2xl hover:shadow-xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-primary/5 text-primary rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Layout size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{item.data.name as string}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <code className="text-[10px] text-muted-foreground font-mono">{item.data.path as string}</code>
                     {item.data.requiredRole && <Badge variant="outline" className="text-[8px] py-0 px-1 border-primary/20 text-primary uppercase">{item.data.requiredRole as string}</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                 <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 rounded-lg"><Edit3 size={14} /></Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive" 
                   onClick={() => deleteItem('page_routes', item.id)}><Trash2 size={14} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent className="sm:max-w-[500px] p-0 bg-background/95 backdrop-blur-2xl border-l-border/10 flex flex-col">
          <div className="p-6 border-b border-border/5 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md z-10">
            <SheetTitle className="text-lg font-black tracking-tight flex items-center gap-3">
              <Braces size={18} className="text-primary" />
              {editingRoute.data?.name || 'New Route'}
            </SheetTitle>
            <Button onClick={handleSave} size="sm" className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
              <Save size={14} className="mr-2" /> Save Route
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Route Name</label>
                <AgnosticInput 
                  value={editingRoute.data?.name || ''} 
                  onSync={(val) => updateData({ name: val })}
                  className="h-11 bg-muted/20 border-none rounded-xl px-4 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Physical Path</label>
                <div className="relative">
                  <AgnosticInput 
                    value={editingRoute.data?.path || '/'} 
                    onSync={(val) => updateData({ path: val })}
                    className="h-11 bg-muted/20 border-none rounded-xl pl-4 pr-10 font-mono text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/20"><ChevronRight size={16} /></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Security Role</label>
                  <Select value={editingRoute.data?.requiredRole || 'public'} onValueChange={(val) => updateData({ requiredRole: val })}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl px-4 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/10 bg-background/95 backdrop-blur-xl">
                      <SelectItem value="public" className="text-xs font-bold uppercase tracking-wider">Public</SelectItem>
                      <SelectItem value="admin" className="text-xs font-bold uppercase tracking-wider">Admin</SelectItem>
                      <SelectItem value="user" className="text-xs font-bold uppercase tracking-wider">Standard User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Layout Style</label>
                  <Select value={editingRoute.data?.layoutStyle || 'compact'} onValueChange={(val) => updateData({ layoutStyle: val })}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl px-4 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/10 bg-background/95 backdrop-blur-xl">
                      <SelectItem value="compact" className="text-xs font-bold uppercase tracking-wider">Compact</SelectItem>
                      <SelectItem value="full" className="text-xs font-bold uppercase tracking-wider">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-border/5" />

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Composition Blocks</h4>
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-mono">{(editingRoute.data?.blocks?.length || 0)} Units</Badge>
                 </div>
                 <div className="p-8 border-2 border-dashed border-border/10 rounded-2xl text-center space-y-3 bg-muted/5">
                    <LayoutGrid size={24} className="mx-auto text-muted-foreground/20" />
                    <p className="text-[9px] text-muted-foreground italic max-w-[180px] mx-auto">Blocks will be managed here in the next update. Using fallback single-block mode.</p>
                 </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
