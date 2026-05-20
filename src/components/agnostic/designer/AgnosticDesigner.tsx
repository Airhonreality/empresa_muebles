'use client';

/**
 * 🏛️ ARTEFACTO: AgnosticDesigner.tsx
 * ────────────
 * CAPA: Designer (Universal Orchestration Panel)
 * VERSIÓN: 2.0
 * COMMIT: P3-M4.5-DESIGNER-PURIFIED-STUDIO
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Shell del Parametric Designer con tres paneles reactivos y colapsables.
 * - Sincronización de Rutas de navegación, Átomos del DNA y Triggers de Eventos.
 * - Barra lateral izquierda colapsable (Hover-triggered Config Sidebar).
 * - Centralización en 3 pestañas principales de navegación pura en panel medio.
 * - Editor ultra-veloz en fila horizontal para atributos de esquemas (Javier UX).
 * - Barra extrema derecha de utilidades y filtros relacionales (Smart Tagging).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Mantener el compilador limpio de errores de tipado.
 * - NEVER: Duplicar lógica de persistencia; usar dispatchers unificados.
 * - ALWAYS: Preservar un espacio de canvas expandido y limpio.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Route as RouteIcon, FileJson, Zap, Shield, RotateCcw, Box, Plus, Trash2, Sparkles, Layout, Info, Database, Palette, ExternalLink, Settings2, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useMateriaStore } from '@/lib/agnostic/store';
import { useAppDispatch } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AgnosticTreeView, TreeNode } from './AgnosticTreeView';
import { SystemSection } from './sections/SystemSection';
import { ImportWizard } from '@/components/agnostic/plugins/ImportWizard';
import { RecursiveBlockComposer } from './components/RecursiveBlockComposer';
import { cn } from '@/lib/utils';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── CONTRATOS DE EDICIÓN INTERNA ───────────────────────────────────────────

const routeItemSchema = {
  name: 'Page Route',
  fields: [
    { key: "path", label: "Ruta de URL (Slug)", width: "half", required: true },
    { key: "title", label: "Título de la Página", width: "half", required: true },
    {
      key: "isPrivate",
      label: "Gobernanza de Acceso",
      width: "half",
      type: "select",
      options: [
        { label: "Público (Acceso Global)", value: false },
        { label: "Privado (Autenticación Requerida)", value: true }
      ]
    },
    {
      key: "layout_mode",
      label: "Ajuste del Canvas",
      width: "half",
      type: "select",
      options: [
        { label: "Canvas Completo (Fluid)", value: "canvas" },
        { label: "Contenedor Centrado (Optimized)", value: "container" }
      ]
    }
  ]
};

// ─── COMPONENTE MAESTRO ──────────────────────────────────────────────────────

export function AgnosticDesigner({
  initialSection = 'routes',
  initialRouteId = null
}: {
  initialSection?: string;
  initialRouteId?: string | null;
}) {
  const { data: materia } = useMateriaStore();
  const { saveItem, deleteItem, refreshStore } = useAppDispatch();

  // Estados de navegación contextual
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(initialRouteId);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  const [centerTab, setCenterTab] = useState<'routes' | 'schemas' | 'logic'>(
    initialSection === 'dna' ? 'schemas' : (initialSection === 'scripts' ? 'logic' : 'routes')
  );

  // Estado del Panel de Configuración Colapsable (Stage 2)
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Estado del Wizard de Importación
  const [showImport, setShowImport] = useState(false);

  // Estado de eliminación pendiente para confirmaciones AlertDialog (Stage 4)
  const [pendingDelete, setPendingDelete] = useState<{ type: 'route' | 'schema' | 'script'; id: string } | null>(null);

  // Resoluciones de datos unificadas
  const routes = useMemo(() => materia[SYSTEM_NS.ROUTES] ?? [], [materia]);
  const schemas = useMemo(() => materia[SYSTEM_NS.SCHEMAS] ?? [], [materia]);
  const scripts = useMemo(() => materia['scripts'] ?? [], [materia]);

  const passportItem = (materia[SYSTEM_NS.CONFIG] ?? []).find(item => item.id === 'master_passport');
  const config = (passportItem?.data as any) ?? {};

  const handleRefresh = async () => {
    await refreshStore();
    toast.success('Estado de realidad sincronizado');
  };

  const handleUpdateConfig = async (patch: any) => {
    const merged = {
      ...config,
      ...(patch.ui_tokens ? { ui_tokens: { ...(config.ui_tokens || {}), ...patch.ui_tokens } } : {}),
      ...(patch.layout_defaults ? { layout_defaults: { ...(config.layout_defaults || {}), ...patch.layout_defaults } } : {}),
    };
    await saveItem(SYSTEM_NS.CONFIG, { id: 'master_passport', data: merged });
    toast.success('Configuración del núcleo actualizada');
  };

  // ─── ACCIONES DE RUTAS ──────────────────────────────────────────────────────

  const handleAddRoute = async () => {
    const newRoute = {
      id: crypto.randomUUID(),
      context: SYSTEM_NS.ROUTES,
      data: {
        path: `/nueva-ruta-${Date.now().toString().slice(-4)}`,
        title: 'Nueva Página',
        isPrivate: false,
        layout_mode: 'container',
        blocks: []
      }
    };
    await saveItem(SYSTEM_NS.ROUTES, newRoute);
    setSelectedRouteId(newRoute.id);
  };

  const handleSaveRoute = async (id: string, patch: any) => {
    const route = routes.find((r: any) => r.id === id);
    if (!route) return;
    await saveItem(SYSTEM_NS.ROUTES, { ...route, data: { ...(route.data || {}), ...patch } });
  };

  const handleRemoveRoute = async (id: string) => {
    setPendingDelete({ type: 'route', id });
  };

  // ─── ACCIONES DE SCHEMAS ────────────────────────────────────────────────────

  const handleAddSchema = async () => {
    const id = crypto.randomUUID();
    const newSchema = {
      id,
      context: SYSTEM_NS.SCHEMAS,
      data: {
        name: `nuevo_schema_${Date.now().toString().slice(-4)}`,
        fields: []
      }
    };
    await saveItem(SYSTEM_NS.SCHEMAS, newSchema);
    setSelectedSchemaId(id);
  };

  const handleSaveSchema = async (id: string, data: any) => {
    const schema = schemas.find((s: any) => s.id === id);
    if (!schema) return;
    await saveItem(SYSTEM_NS.SCHEMAS, { ...schema, data });
  };

  const handleRemoveSchema = async (id: string) => {
    setPendingDelete({ type: 'schema', id });
  };

  // ─── ACCIONES DE SCRIPTS ────────────────────────────────────────────────────

  const handleAddScript = async () => {
    const id = crypto.randomUUID();
    const newScript = {
      id,
      context: 'scripts',
      data: {
        name: `script_evento_${Date.now().toString().slice(-4)}`,
        description: 'Trigger disparado al salvar o procesar el formulario.',
        trigger: 'onSave',
        code: `// JS puro - function run(record, api) {\nconsole.log("Script disparado exitosamente", record);\n// }`
      }
    };
    await saveItem('scripts', newScript);
    setSelectedScriptId(id);
  };

  const handleSaveScript = async (id: string, data: any) => {
    const script = scripts.find((s: any) => s.id === id);
    if (!script) return;
    await saveItem('scripts', { ...script, data });
  };

  const handleRemoveScript = async (id: string) => {
    setPendingDelete({ type: 'script', id });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    setPendingDelete(null);
    if (type === 'route') {
      await deleteItem(SYSTEM_NS.ROUTES, id);
      if (selectedRouteId === id) setSelectedRouteId(null);
    } else if (type === 'schema') {
      await deleteItem(SYSTEM_NS.SCHEMAS, id);
      if (selectedSchemaId === id) setSelectedSchemaId(null);
      toast.success('Blueprint de datos eliminado');
    } else if (type === 'script') {
      await deleteItem('scripts', id);
      if (selectedScriptId === id) setSelectedScriptId(null);
    }
  };

  // ─── CONSTRUCCIÓN DE NODOS DEL TREE ──────────────────────────────────────────

  const routeNodes = useMemo<TreeNode[]>(() => routes.map((r: any) => ({
    id: r.id,
    label: r.data?.path || '/sin-ruta',
    icon: RouteIcon,
    badge: `${r.data?.blocks?.length ?? 0} Blks`,
    data: r
  })), [routes]);

  const schemaNodes = useMemo<TreeNode[]>(() => schemas.map((s: any) => ({
    id: s.id,
    label: s.data?.name || 'sin_nombre',
    icon: FileJson,
    badge: `${s.data?.fields?.length ?? 0} Flds`,
    data: s
  })), [schemas]);

  const scriptNodes = useMemo<TreeNode[]>(() => scripts.map((s: any) => ({
    id: s.id,
    label: s.data?.name || 'sin_nombre_script',
    icon: Zap,
    badge: s.data?.trigger || 'onSave',
    data: s
  })), [scripts]);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden select-none">

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* PANEL 1: CONFIG (NÚCLEO Y PASAPORTE) ─ Hover-Collapsible (Stage 2)     */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "border-r flex flex-col shrink-0 bg-muted/15 transition-all duration-300 ease-in-out z-30 shadow-sm",
          isConfigOpen ? "w-72" : "w-16"
        )}
        onMouseEnter={() => setIsConfigOpen(true)}
        onMouseLeave={() => setIsConfigOpen(false)}
      >
        <div className={cn(
          "p-4 border-b flex items-center justify-between bg-background transition-all duration-300 h-14",
          isConfigOpen ? "px-4" : "px-0 justify-center"
        )}>
          {isConfigOpen ? (
            <>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Sovereign Núcleo</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="w-7 h-7 rounded-full text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={12} />
              </Button>
            </>
          ) : (
            <Shield size={18} className="text-primary animate-pulse" />
          )}
        </div>

        {isConfigOpen ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-in fade-in duration-300">
            <SystemSection config={config} setConfig={handleUpdateConfig} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center py-6 gap-2 text-muted-foreground">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2.5 hover:bg-muted rounded-lg transition-colors w-10 h-10 flex items-center justify-center"
              title="Configurar Silo y Tokens"
            >
              <Shield size={16} className="text-primary animate-pulse" />
            </button>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2.5 hover:bg-muted rounded-lg transition-colors w-10 h-10 flex items-center justify-center"
              title="Estrategia de Persistencia"
            >
              <Database size={16} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2.5 hover:bg-muted rounded-lg transition-colors w-10 h-10 flex items-center justify-center"
              title="Design Tokens"
            >
              <Palette size={16} className="text-muted-foreground" />
            </button>
            <div className="mt-auto">
              <button
                onClick={handleRefresh}
                className="p-2.5 hover:bg-muted rounded-lg transition-colors w-10 h-10 flex items-center justify-center"
                title="Sincronizar Estado"
              >
                <RotateCcw size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* PANEL 2: JERARQUÍA / 3 TABS DE NAVEGACIÓN PURA ─ Fijo 320px (Stage 1)  */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <aside className="w-80 border-r flex flex-col shrink-0 bg-background">
        <Tabs value={centerTab} onValueChange={(val: any) => setCenterTab(val)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full rounded-none border-b h-14 px-3 bg-muted/20 gap-1">
            <TabsTrigger value="routes" className="flex-1 text-[10px] font-black uppercase tracking-wider h-8">Rutas</TabsTrigger>
            <TabsTrigger value="schemas" className="flex-1 text-[10px] font-black uppercase tracking-wider h-8">Esquemas</TabsTrigger>
            <TabsTrigger value="logic" className="flex-1 text-[10px] font-black uppercase tracking-wider h-8">Lógica</TabsTrigger>
          </TabsList>

          {/* Rutas Tree View */}
          <TabsContent value="routes" className="flex-1 overflow-y-auto p-4 m-0">
            <AgnosticTreeView
              nodes={routeNodes}
              selectedId={selectedRouteId}
              onSelect={(node) => {
                setSelectedRouteId(node.id);
                setSelectedSchemaId(null);
                setSelectedScriptId(null);
              }}
              onAdd={handleAddRoute}
              addLabel="Registrar Nueva Ruta"
              emptyMessage="No hay rutas definidas en el sitemap."
            />
          </TabsContent>

          {/* Esquemas Tree View */}
          <TabsContent value="schemas" className="flex-1 overflow-y-auto p-4 m-0">
            <AgnosticTreeView
              nodes={schemaNodes}
              selectedId={selectedSchemaId}
              onSelect={(node) => {
                setSelectedSchemaId(node.id);
                setSelectedRouteId(null);
                setSelectedScriptId(null);
              }}
              onAdd={handleAddSchema}
              addLabel="Diseñar Nuevo Blueprint"
              emptyMessage="No hay blueprints definidos en el DNA."
            />
          </TabsContent>

          {/* Lógica Tree View */}
          <TabsContent value="logic" className="flex-1 overflow-y-auto p-4 m-0">
            <AgnosticTreeView
              nodes={scriptNodes}
              selectedId={selectedScriptId}
              onSelect={(node) => {
                setSelectedScriptId(node.id);
                setSelectedRouteId(null);
                setSelectedSchemaId(null);
              }}
              onAdd={handleAddScript}
              addLabel="Registrar Evento Script"
              emptyMessage="No hay scripts de lógica definidos."
            />
          </TabsContent>
        </Tabs>

        {/* 🗃️ IMPORT WIZARD ENTRY DRAWER */}
        <div className="p-3 border-t bg-muted/10 shrink-0">
          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            className="w-full h-10 rounded-xl border-dashed border-primary/20 hover:border-primary/50 text-[10px] font-black tracking-widest uppercase gap-2 hover:bg-primary/5 transition-all shadow-sm"
          >
            <Database size={13} className="text-primary animate-pulse" />
            Importar Estructura (Wizard)
          </Button>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* PANEL 3: EDITOR CONTEXTUAL REACTIVO ─ Flex-1                           */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8 bg-muted/5">
        {selectedRouteId && (
          <RouteEditor
            routeId={selectedRouteId}
            routes={routes}
            schemas={schemas}
            onSave={handleSaveRoute}
            onRemove={handleRemoveRoute}
          />
        )}
        {selectedSchemaId && (
          <SchemaEditor
            schemaId={selectedSchemaId}
            schemas={schemas}
            onSave={handleSaveSchema}
            onRemove={handleRemoveSchema}
          />
        )}
        {selectedScriptId && (
          <ScriptEditor
            scriptId={selectedScriptId}
            scripts={scripts}
            onSave={handleSaveScript}
            onRemove={handleRemoveScript}
          />
        )}
        {!selectedRouteId && !selectedSchemaId && !selectedScriptId && (
          <EmptyEditorState />
        )}
      </main>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* PANEL 4: BARRA EXTREMA DERECHA (SMART TAGGING - Stage 4)               */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <aside className="w-12 border-l flex flex-col shrink-0 items-center py-6 bg-muted/10 text-muted-foreground gap-6">
        <div className="p-2 hover:bg-muted hover:text-primary rounded-lg transition-colors cursor-pointer" title="Etiquetas Inteligentes (Smart Tags)">
          <Zap size={16} />
        </div>
        <div className="p-2 hover:bg-muted hover:text-primary rounded-lg transition-colors cursor-pointer" title="Relaciones y Filtros Dinámicos">
          <FileJson size={16} />
        </div>
        <div className="p-2 hover:bg-muted hover:text-primary rounded-lg transition-colors cursor-pointer" title="Parámetros de Rejilla y Layout">
          <Layout size={16} />
        </div>
        <div className="p-2 hover:bg-muted hover:text-primary rounded-lg transition-colors cursor-pointer mt-auto" title="Ayuda Axiomática">
          <Info size={16} />
        </div>
      </aside>

      {/* modal de confirmación AlertDialog premium (Stage 4) */}
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-card border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xs font-black uppercase tracking-widest text-foreground">
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Esta acción es irreversible. El elemento será eliminado permanentemente de la estructura del sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 rounded-xl">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🗃️ IMPORT WIZARD DIALOG MODAL */}
      <ImportWizard open={showImport} onClose={() => setShowImport(false)} />

    </div>
  );
}

// ─── SUB-COMPONENTES: EDITORES DEL PANEL DERECHO ───────────────────────────

// 1. ROUTE EDITOR (Composición de Rutas y Bloques)
function RouteEditor({
  routeId,
  routes,
  schemas,
  onSave,
  onRemove
}: {
  routeId: string;
  routes: any[];
  schemas: any[];
  onSave: (id: string, patch: any) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const route = useMemo(() => routes.find((r: any) =>
    r.id === routeId), [routes, routeId]);

  const [localData, setLocalData] =
    useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local cuando cambia la ruta seleccionada
  useEffect(() => {
    if (route?.data) setLocalData(route.data);
  }, [routeId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!route) return <div className="text-sm font-semibold opacity-40">Buscando estructura de ruta...</div>;

  const isDirty = JSON.stringify(localData) !==
    JSON.stringify(route.data || {});

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(routeId, localData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = () => {
    setLocalData((prev: any) => ({
      ...prev,
      blocks: [...(prev.blocks || []), { type: 'form', schema_id: '', config: {} }]
    }));
  };

  const handleUpdateBlock = (idx: number, blockPatch: any) => {
    setLocalData((prev: any) => {
      const blocks = [...(prev.blocks || [])];
      blocks[idx] = { ...blocks[idx], ...blockPatch };
      return { ...prev, blocks };
    });
  };

  const handleRemoveBlock = (idx: number) => {
    if (!confirm('¿Eliminar este bloque del layout?'))
      return;
    setLocalData((prev: any) => ({
      ...prev,
      blocks: (prev.blocks || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Cabecera */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <RouteIcon size={16} className="text-primary" /> Ruta en Edición
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
            Navegación topológica y composición fractal
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="text-[10px] font-black uppercase tracking-widest h-9 rounded-xl gap-2"
            >
              <Sparkles size={12} />
              {isSaving ? 'Guardando...' : 'Guardar Ruta'}
            </Button>
          )}
          {localData.path && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(localData.path, '_blank')}
              className="text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-primary/20 hover:border-primary hover:bg-primary/5 gap-2"
            >
              <ExternalLink size={12} /> Abrir Ruta
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(routeId)}
            className="text-destructive/50 hover:text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest"
          >
            <Trash2 size={14} className="mr-2" /> Eliminar Ruta
          </Button>
        </div>
      </div>

      {/* Metadata de la ruta — inputs controlados directos */}
      <div className="bg-background border rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ruta de URL (Slug)</label>
            <Input
              value={localData.path || ''}
              onChange={(e) => setLocalData((prev: any) => ({ ...prev, path: e.target.value }))}
              className="font-bold text-xs h-9"
              placeholder="/mi-ruta"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Título de la Página</label>
            <Input
              value={localData.title || ''}
              onChange={(e) => setLocalData((prev: any) => ({ ...prev, title: e.target.value }))}
              className="font-bold text-xs h-9"
              placeholder="Mi Página"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Gobernanza de Acceso</label>
            <Select
              value={String(localData.isPrivate ?? 'false')}
              onValueChange={(val) => setLocalData((prev: any) => ({ ...prev, isPrivate: val === 'true' }))}
            >
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Público (Acceso Global)</SelectItem>
                <SelectItem value="true">Privado (Autenticación Requerida)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ajuste del Canvas</label>
            <Select
              value={localData.layout_mode || 'canvas'}
              onValueChange={(val) => setLocalData((prev: any) => ({ ...prev, layout_mode: val }))}
            >
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canvas">Canvas Completo (Fluid)</SelectItem>
                <SelectItem value="container">Contenedor Centrado (Optimized)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Composición de Bloques */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Árbol de Bloques de la Interfaz
          </h3>
          <Button
            onClick={handleAddBlock}
            variant="outline"
            size="sm"
            className="text-[10px] font-black uppercase tracking-widest border-dashed gap-2"
          >
            <Plus size={12} /> Añadir Bloque al Layout
          </Button>
        </div>

        {(localData.blocks || []).length === 0 ? (
          <div className="text-center py-12 text-xs font-semibold text-muted-foreground border border-dashed rounded-2xl bg-background">
            Esta página no contiene bloques. Añade tu primer bloque para empezar a componer.
          </div>
        ) : (
          <div className="space-y-4">
            {(localData.blocks || []).map((block: any, idx: number) => (
              <div key={block.id || idx} className="bg-background border rounded-2xl p-6 shadow-sm hover:border-primary/20 transition-all relative group">
                <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBlock(idx)}
                    className="w-8 h-8 rounded-full text-destructive/40 hover:text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <div className="mb-4 flex items-center gap-2 text-xs font-bold text-muted-foreground border-b pb-3 uppercase tracking-widest">
                  <Layout size={12} />
                  <span>Bloque #{idx + 1} ({block.type})</span>
                </div>
                <RecursiveBlockComposer
                  block={block}
                  schemas={schemas}
                  onUpdate={(patch) => handleUpdateBlock(idx, patch)}
                  onRemove={() => handleRemoveBlock(idx)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// 2. SCHEMA EDITOR (Estado local + botón explícito Guardar)
function SchemaEditor({
  schemaId,
  schemas,
  onSave,
  onRemove
}: {
  schemaId: string;
  schemas: any[];
  onSave: (id: string, data: any) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const schema = useMemo(() => schemas.find((s: any) => s.id === schemaId), [schemas, schemaId]);

  const [localName, setLocalName] = useState('');
  const [localFields, setLocalFields] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [openFieldSettingsIdx, setOpenFieldSettingsIdx] = useState<number | null>(null);

  // Sincronizar estado local cuando se cambia de schema seleccionado
  useEffect(() => {
    if (schema) {
      setLocalName(schema.data?.name || '');
      setLocalFields(schema.data?.fields || []);
    }
  }, [schemaId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!schema) return <div className="text-sm font-semibold opacity-40">Buscando blueprint del DNA...</div>;

  const isDirty =
    localName !== (schema.data?.name || '') ||
    JSON.stringify(localFields) !== JSON.stringify(schema.data?.fields || []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(schemaId, { name: localName, fields: localFields });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddField = () => {
    setLocalFields(prev => [...prev, {
      id: crypto.randomUUID(),
      key: `campo_${Date.now().toString().slice(-4)}`,
      label: 'Nuevo Campo',
      type: 'text',
      width: 'full'
    }]);
  };

  const handleUpdateField = (idx: number, patch: any) => {
    setLocalFields(prev => {
      const fields = [...prev];
      fields[idx] = { ...fields[idx], ...patch };
      return fields;
    });
  };

  const handleRemoveField = (fieldId: string) => {
    setLocalFields(prev => prev.filter((f: any) => f.id !== fieldId));
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Cabecera */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <FileJson size={16} className="text-primary" /> Esquema en Edición
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
            Arquitectura de estructuras de datos y planos de información
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="text-[10px] font-black uppercase tracking-widest h-9 rounded-xl gap-2"
            >
              <Sparkles size={12} />
              {isSaving ? 'Guardando...' : 'Guardar Esquema'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(schemaId)}
            className="text-destructive/50 hover:text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest"
          >
            <Trash2 size={14} className="mr-2" /> Eliminar Esquema
          </Button>
        </div>
      </div>

      {/* Editor de Nombre Principal */}
      <div className="bg-background border rounded-2xl p-6 shadow-sm flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
          <FileJson size={20} />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Blueprint (Namespace)</label>
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="font-bold text-xs h-9"
          />
        </div>
      </div>

      {/* Lista de Átomos (Inline Row Editor) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Campos Estructurales (Átomos)
          </h3>
          <Button
            onClick={handleAddField}
            variant="outline"
            size="sm"
            className="text-[10px] font-black uppercase tracking-widest border-dashed gap-2"
          >
            <Plus size={12} /> Añadir Nuevo Campo
          </Button>
        </div>

        {localFields.length === 0 ? (
          <div className="text-center py-12 text-xs font-semibold text-muted-foreground border border-dashed rounded-2xl bg-background">
            Este esquema no tiene campos aún. Diseña los primeros campos de información.
          </div>
        ) : (
          <div className="space-y-3">
            {localFields.map((field: any, idx: number) => {
              const autoSlug = (field.label || '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '_')
                .replace(/[^\w-]+/g, '');

              return (
                <div key={field.id || idx} className="bg-background border rounded-xl p-4 shadow-sm hover:border-primary/20 transition-all flex flex-col gap-4 relative group">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
                    {/* Etiqueta Visual */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Etiqueta Visual</label>
                      <Input
                        value={field.label || ''}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          const newKey = newLabel.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
                          handleUpdateField(idx, { label: newLabel, key: newKey });
                        }}
                        placeholder="Ej. Nombre del Cliente"
                        className="font-bold text-xs h-9 bg-muted/5 border-muted/80 focus-visible:ring-primary/20"
                      />
                    </div>

                    {/* Tipo de Dato */}
                    <div className="w-full md:w-44 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Dato</label>
                      <Select
                        value={field.type || 'text'}
                        onValueChange={(val) => {
                          const patch: any = { type: val };
                          if (val === 'relation') {
                            patch.config = {
                              ...(field.config || {}),
                              relation: { entity: '', parent_key: 'id' }
                            };
                          }
                          handleUpdateField(idx, patch);
                        }}
                      >
                        <SelectTrigger className="h-9 font-bold text-xs bg-muted/5 border-muted/80 focus:ring-primary/20">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text" className="font-bold text-xs">Texto Plano</SelectItem>
                          <SelectItem value="number" className="font-bold text-xs">Numérico</SelectItem>
                          <SelectItem value="select" className="font-bold text-xs">Opciones (Select)</SelectItem>
                          <SelectItem value="date" className="font-bold text-xs">Fecha</SelectItem>
                          <SelectItem value="boolean" className="font-bold text-xs">Booleano</SelectItem>
                          <SelectItem value="textarea" className="font-bold text-xs">Área de Texto</SelectItem>
                          <SelectItem value="relation" className="font-bold text-xs">Relación (FK)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Relación Agnóstica (FK) */}
                    {field.type === 'relation' && (
                      <div className="w-full md:w-44 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Blueprint Relacionado</label>
                        <Select
                          value={field.config?.relation?.entity || ''}
                          onValueChange={(val) => {
                            const updatedConfig = {
                              ...(field.config || {}),
                              relation: { entity: val, parent_key: 'id' }
                            };
                            handleUpdateField(idx, { config: updatedConfig });
                          }}
                        >
                          <SelectTrigger className="h-9 font-bold text-xs bg-primary/5 border-primary/20 text-primary focus:ring-primary/20">
                            <SelectValue placeholder="Elegir parent blueprint" />
                          </SelectTrigger>
                          <SelectContent>
                            {schemas.map((s: any) => (
                              <SelectItem key={s.id} value={s.data?.name || ''} className="font-bold text-xs">
                                {s.data?.name || 'sin_nombre'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Slug del Campo (Read-Only) */}
                    <div className="w-full md:w-44 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Slug (JSON Key)</label>
                      <div className="h-9 px-3 border bg-muted/20 rounded-lg flex items-center justify-between text-xs font-mono font-bold text-primary truncate border-muted/80 select-all">
                        <span>{field.key || autoSlug || 'sin_clave'}</span>
                      </div>
                    </div>

                    {/* ¿Es Obligatorio? Checkbox en Línea (Ultra-usable) */}
                    <div className="shrink-0 flex items-center gap-2 pt-5 md:pt-0">
                      <input
                        type="checkbox"
                        id={`req-${field.id || idx}`}
                        checked={!!field.required}
                        onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                        className="w-4 h-4 rounded border-muted/80 bg-muted/5 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                      />
                      <label htmlFor={`req-${field.id || idx}`} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground select-none cursor-pointer">
                        Obligatorio
                      </label>
                    </div>

                    {/* Acciones */}
                    <div className="shrink-0 flex items-end gap-1 pt-5 md:pt-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpenFieldSettingsIdx(openFieldSettingsIdx === idx ? null : idx)}
                        className={cn(
                          "w-9 h-9 rounded-xl transition-colors",
                          openFieldSettingsIdx === idx ? "text-primary bg-primary/5 border border-primary/10" : "text-muted-foreground/60 hover:text-primary hover:bg-muted"
                        )}
                        title="Ajustes Avanzados"
                      >
                        <Settings2 size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(field.id)}
                        className="w-9 h-9 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/5"
                        title="Eliminar Campo"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* 🧬 COLLAPSIBLE ADVANCED SETTINGS PANEL */}
                  {openFieldSettingsIdx === idx && (
                    <div className="w-full border-t border-dashed border-border/60 pt-4 mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">

                      {/* Sección Organizativa */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sección Visual (Tab)</label>
                        <Input
                          value={field.section || 'General'}
                          onChange={(e) => handleUpdateField(idx, { section: e.target.value })}
                          placeholder="Ej. General, Facturación"
                          className="font-bold text-xs h-9 bg-muted/5 border-muted/80 focus-visible:ring-primary/20"
                        />
                      </div>

                      {/* Ancho del Campo */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ancho Visual</label>
                        <Select
                          value={field.width || 'full'}
                          onValueChange={(val) => handleUpdateField(idx, { width: val })}
                        >
                          <SelectTrigger className="h-9 font-bold text-xs bg-muted/5 border-muted/80 focus:ring-primary/20">
                            <SelectValue placeholder="Seleccionar ancho" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full" className="font-bold text-xs">Completo (100%)</SelectItem>
                            <SelectItem value="half" className="font-bold text-xs">Mitad (50%)</SelectItem>
                            <SelectItem value="third" className="font-bold text-xs">Un Tercio (33%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Placeholder de Entrada */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Placeholder / Indicación</label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                          placeholder="Ej. Escriba sin guiones..."
                          className="font-bold text-xs h-9 bg-muted/5 border-muted/80 focus-visible:ring-primary/20"
                        />
                      </div>

                      {/* Toggles booleanos avanzados */}
                      <div className="md:col-span-3 flex flex-wrap gap-6 mt-2 border-t border-border/30 pt-3">
                        {/* Clave Primaria */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`prim-${field.id || idx}`}
                            checked={!!field.isPrimary || !!field.config?.isPrimary}
                            onChange={(e) => handleUpdateField(idx, { isPrimary: e.target.checked, config: { ...(field.config || {}), isPrimary: e.target.checked } })}
                            className="w-4 h-4 rounded border-muted/80 bg-muted/5 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                          />
                          <label htmlFor={`prim-${field.id || idx}`} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground select-none cursor-pointer">
                            ¿Es Identificador Primario? (Muestra en listas/búsquedas)
                          </label>
                        </div>

                        {/* Solo Lectura */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`ro-${field.id || idx}`}
                            checked={!!field.readOnly}
                            onChange={(e) => handleUpdateField(idx, { readOnly: e.target.checked })}
                            className="w-4 h-4 rounded border-muted/80 bg-muted/5 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                          />
                          <label htmlFor={`ro-${field.id || idx}`} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground select-none cursor-pointer">
                            ¿Es de Solo Lectura? (Calculado/Fijo)
                          </label>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// 3. SCRIPT EDITOR (Estado local + botón explícito Guardar)
function ScriptEditor({
  scriptId,
  scripts,
  onSave,
  onRemove
}: {
  scriptId: string;
  scripts: any[];
  onSave: (id: string, data: any) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const script = useMemo(() => scripts.find((s: any) => s.id === scriptId), [scripts, scriptId]);

  const [localName, setLocalName] = useState('');
  const [localTrigger, setLocalTrigger] = useState('onSave');
  const [localDescription, setLocalDescription] = useState('');
  const [localCode, setLocalCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local al cambiar el script seleccionado
  useEffect(() => {
    if (script) {
      setLocalName(script.data?.name || '');
      setLocalTrigger(script.data?.trigger || 'onSave');
      setLocalDescription(script.data?.description || '');
      setLocalCode(script.data?.code || '');
    }
  }, [scriptId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!script) return <div className="text-sm font-semibold opacity-40">Buscando script de evento...</div>;

  const isDirty =
    localName !== (script.data?.name || '') ||
    localTrigger !== (script.data?.trigger || 'onSave') ||
    localDescription !== (script.data?.description || '') ||
    localCode !== (script.data?.code || '');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(scriptId, {
        name: localName,
        trigger: localTrigger,
        description: localDescription,
        code: localCode
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Cabecera */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Zap size={16} className="text-primary animate-bounce" /> Lógica en Edición
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
            Control de eventos funcionales y automatizaciones puras
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="text-[10px] font-black uppercase tracking-widest h-9 rounded-xl gap-2"
            >
              <Sparkles size={12} />
              {isSaving ? 'Guardando...' : 'Guardar Script'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(scriptId)}
            className="text-destructive/50 hover:text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest"
          >
            <Trash2 size={14} className="mr-2" /> Eliminar Script
          </Button>
        </div>
      </div>

      {/* Editor de Propiedades */}
      <div className="bg-background border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Único del Script</label>
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="font-bold text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trigger de Ejecución</label>
            <Select
              value={localTrigger}
              onValueChange={(val) => setLocalTrigger(val)}
            >
              <SelectTrigger className="text-xs font-semibold h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onSave">onSave — Al guardar registro</SelectItem>
                <SelectItem value="onDelete">onDelete — Al eliminar registro</SelectItem>
                <SelectItem value="onOpen">onOpen — Al abrir interfaz</SelectItem>
                <SelectItem value="onLoad">onLoad — Al cargar datos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Operacional</label>
          <Input
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Editor de Código */}
      <div className="bg-background border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="bg-muted/30 px-6 py-3 border-b flex items-center justify-between shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">function run(record, api)</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
        </div>
        <Textarea
          value={localCode}
          onChange={(e) => setLocalCode(e.target.value)}
          className="flex-1 w-full font-mono text-xs p-6 leading-relaxed resize-none rounded-none border-0 focus-visible:ring-0 bg-muted/30 text-foreground min-h-0 h-full"
          spellCheck={false}
          placeholder="// function run(record, api) { ... }"
        />
        <div className="bg-muted/10 px-6 py-2 border-t text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
          Entorno Isomórfico Protegido
        </div>
      </div>

    </div>
  );
}

// 4. EMPTY DESIGNER STATE (Placeholder Premium)
function EmptyEditorState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
      <div className="h-16 w-16 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-xl shadow-primary/[0.02]">
        <Sparkles size={28} className="animate-pulse" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
          Studio de Composición Paramétrica
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Selecciona cualquier ruta, blueprint de datos o script de control en el panel central de jerarquía para habilitar las consolas avanzadas de edición y diseño visual en tiempo real.
        </p>
      </div>
    </div>
  );
}
