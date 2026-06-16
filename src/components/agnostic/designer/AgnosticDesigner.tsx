'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Route as RouteIcon, FileJson, Zap, Shield, RotateCcw, Box, Plus, Trash2,
  Sparkles, Layout, Database, Settings2, ChevronsUpDown, Check,
  Users, Info, ExternalLink, Table2, Upload, Plug2
} from 'lucide-react';
import { DataBrowser } from '@/components/specialized/DataBrowser';
import type { DataItem } from '@agnostic/core';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { useMateriaStore } from '@/lib/agnostic/store';
import { useAppDispatch } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SchemaField } from '@agnostic/core';
import { arrayMove } from '@dnd-kit/sortable';
import { SystemSection } from './sections/SystemSection';
import { DeploySection } from './sections/DeploySection';
import { DocsSection } from './sections/DocsSection';
import { SetupWizard } from './sections/SetupWizard';
import { ImportWizard } from '@/components/agnostic/plugins/ImportWizard';
import { IntegrationsSection } from './sections/IntegrationsSection';
import { RecursiveBlockComposer } from './components/RecursiveBlockComposer';
import { cn } from '@/lib/utils';
import { SYSTEM_NS, FIELD_META_SCHEMA } from '@/lib/agnostic/constants';
import { AgnosticConfigProjector } from '@/components/agnostic/modules/AgnosticConfigProjector';
import { UserManager } from '@/components/agnostic/admin/UserManager';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type NodeType = 'route' | 'block' | 'schema' | 'script';

interface SelectedNode {
  nodeType: NodeType;
  id: string;
  routeId?: string; // para bloques
}

/** Minimal tree node for the navigator list — no DnD, no visual designer concepts. */
interface TreeNode {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
  data?: any;
  isVirtualRoot?: boolean;
  children?: TreeNode[];
}

// ─── HELPERS PUROS ───────────────────────────────────────────────────────────

function findDeepBlock(blocks: any[], id: string): any {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.blocks?.length) {
      const found = findDeepBlock(b.blocks, id);
      if (found) return found;
    }
  }
  return null;
}

function deepUpdateBlock(blocks: any[], id: string, patch: any): any[] {
  return blocks.map(b => {
    if (b.id === id) return { ...b, ...patch };
    if (b.blocks?.length) return { ...b, blocks: deepUpdateBlock(b.blocks, id, patch) };
    return b;
  });
}

function deepRemoveBlock(blocks: any[], id: string): any[] {
  return blocks
    .filter(b => b.id !== id)
    .map(b => b.blocks?.length ? { ...b, blocks: deepRemoveBlock(b.blocks, id) } : b);
}

function removeNodeFromV3Tree(node: any, id: string): any {
  return {
    ...node,
    children: (node.children ?? [])
      .filter((c: any) => c.id !== id)
      .map((c: any) => removeNodeFromV3Tree(c, id)),
  };
}

function blockIconFor(type: string) {
  switch (type) {
    case 'frame':    return Box;
    case 'canvas':   return Box;
    case 'form':     return FileJson;
    case 'list':
    case 'collection': return Layout;
    case 'table':    return Database;
    case 'field':    return Sparkles;
    default:         return Shield;
  }
}


// ─── COMPONENTE MAESTRO ──────────────────────────────────────────────────────

export function ConfigManager({
  initialSection = 'routes',
  initialRouteId = null,
}: {
  initialSection?: string;
  initialRouteId?: string | null;
}) {
  const { data: materia } = useMateriaStore();
  const { saveItem, deleteItem, refreshStore } = useAppDispatch();

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(
    initialRouteId ? { nodeType: 'route', id: initialRouteId } : null
  );
  type ActiveMode = 'dna' | 'users' | 'import' | 'integrations' | 'infra' | 'docs';
  const [activeMode, setActiveMode] = useState<ActiveMode>('dna');

  // ─── SETUP WIZARD GATE ────────────────────────────────────────────────────
  type WizardHealth = { isVercel: boolean; env_presence: Record<string, boolean> };
  const [wizardHealth, setWizardHealth] = useState<WizardHealth | null>(null);
  const [envPresence, setEnvPresence] = useState<Record<string, boolean>>({});
  const [setupDismissed, setSetupDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('setup_wizard_dismissed') === 'true'
  );

  useEffect(() => {
    fetch('/api/admin/health')
      .then(r => r.json())
      .then((h: WizardHealth & { activeDataStrategy?: string }) => {
        setEnvPresence(h.env_presence ?? {});
        const hasVercel = h.env_presence.VERCEL_ACCESS_TOKEN && h.env_presence.VERCEL_PROJECT_ID;
        const hasData   = h.env_presence.DATABASE_URL || h.env_presence.GITHUB_REPO || h.env_presence.SUPABASE_URL;
        if ((h.isVercel && !hasVercel) || !hasData) setWizardHealth(h);
      })
      .catch(() => { /* health fail — don't block designer */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [pendingDelete, setPendingDelete] = useState<SelectedNode | null>(null);

  // ─── DATA CANVAS ─────────────────────────────────────────────────────────
  // When activeDataSchema is set, the canvas shows the DataBrowser inline
  // instead of the schema config editor. No page navigation needed.
  const [activeDataSchema, setActiveDataSchema] = useState<string | null>(null);

  const routes     = useMemo(() => materia[SYSTEM_NS.ROUTES]      ?? [], [materia]);
  const schemas    = useMemo(() => materia[SYSTEM_NS.SCHEMAS]     ?? [], [materia]);
  const scripts    = useMemo(() => materia['scripts']              ?? [], [materia]);
  const userLists  = useMemo(() => materia[SYSTEM_NS.USER_LISTS]  ?? [], [materia]);
  const passportItem = (materia[SYSTEM_NS.CONFIG] ?? []).find((item: any) => item.id === 'master_passport');
  const config     = (passportItem?.data as any) ?? {};

  const handleRefresh = async () => {
    await refreshStore();
    toast.success('Estado de realidad sincronizado');
  };

  const handleUpdateConfig = async (patch: any) => {
    const merged = {
      ...config,
      ...(patch.ui_tokens     ? { ui_tokens:      { ...(config.ui_tokens     || {}), ...patch.ui_tokens     } } : {}),
      ...(patch.layout_defaults ? { layout_defaults: { ...(config.layout_defaults || {}), ...patch.layout_defaults } } : {}),
    };
    await saveItem(SYSTEM_NS.CONFIG, { id: 'master_passport', data: merged });
    toast.success('Configuración del núcleo actualizada');
  };

  // ─── AÑADIR ENTIDADES ──────────────────────────────────────────────────────

  const handleAddRoute = async () => {
    const id   = crypto.randomUUID();
    const path = `/nueva-ruta-${Date.now().toString().slice(-4)}`;
    await saveItem(SYSTEM_NS.ROUTES, {
      id, context: SYSTEM_NS.ROUTES,
      data: { path, title: 'Nueva Página', isPrivate: false, blocks: [], order: routes.length },
    });
    setSelectedNode({ nodeType: 'route', id });
  };

  const handleAddSchema = async () => {
    const id = crypto.randomUUID();
    await saveItem(SYSTEM_NS.SCHEMAS, {
      id, context: SYSTEM_NS.SCHEMAS,
      data: { name: `nuevo_schema_${Date.now().toString().slice(-4)}`, fields: [], order: schemas.length }
    });
    setSelectedNode({ nodeType: 'schema', id });
  };

const handleAddScript = async () => {
    const id = crypto.randomUUID();
    await saveItem('scripts', {
      id, context: 'scripts',
      data: { name: `script_evento_${Date.now().toString().slice(-4)}`, description: 'Trigger disparado al salvar o procesar el formulario.', trigger: 'onSave', code: `// function run(record, api) {\n//   api.notify.success("Script ejecutado");\n// }`, order: scripts.length }
    });
    setSelectedNode({ nodeType: 'script', id });
  };

  // ─── REORDEN ───────────────────────────────────────────────────────────────

  const handleReorder = async (category: 'routes' | 'schemas' | 'scripts', activeId: string, overId: string) => {
    const items = category === 'routes' ? routes : category === 'schemas' ? schemas : scripts;
    const oldIndex = items.findIndex((item: any) => item.id === activeId);
    const newIndex = items.findIndex((item: any) => item.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    const ns = category === 'routes' ? SYSTEM_NS.ROUTES : category === 'schemas' ? SYSTEM_NS.SCHEMAS : 'scripts';
    await Promise.all(reordered.map((item: any, index: number) =>
      saveItem(ns, { ...item, data: { ...(item.data || {}), order: index } }, { silent: true })
    ));
  };

  // ─── SELECCIÓN ─────────────────────────────────────────────────────────────

  const handleSelectNode = (node: TreeNode) => {
    if (node.isVirtualRoot || !node.data) return;
    const { _nodeType, _routeId } = node.data;
    if (!_nodeType) return;
    setSelectedNode({ nodeType: _nodeType, id: node.id, routeId: _routeId });
  };

  const handleDeleteFromTree = (node: TreeNode) => {
    if (node.isVirtualRoot || !node.data) return;
    const { _nodeType, _routeId } = node.data;
    if (!_nodeType) return;
    setPendingDelete({ nodeType: _nodeType, id: node.id, routeId: _routeId });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (!selectedNode) return;
      e.preventDefault();
      setPendingDelete(selectedNode);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedNode]);

  // ─── ELIMINACIÓN ───────────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { nodeType, id, routeId } = pendingDelete;
    setPendingDelete(null);

    if (nodeType === 'route') {
      await deleteItem(SYSTEM_NS.ROUTES, id);
    } else if (nodeType === 'block' && routeId) {
      const route = routes.find((r: any) => r.id === routeId);
      if (route) {
        if (route.data?.root) {
          const newRoot = removeNodeFromV3Tree(route.data.root, id);
          await saveItem(SYSTEM_NS.ROUTES, { ...route, data: { ...route.data, root: newRoot } }, { silent: true });
        } else {
          const updatedBlocks = deepRemoveBlock(route.data?.blocks ?? [], id);
          await saveItem(SYSTEM_NS.ROUTES, { ...route, data: { ...route.data, blocks: updatedBlocks } }, { silent: true });
        }
        toast.success('Nodo eliminado');
      }
    } else if (nodeType === 'schema') {
      await deleteItem(SYSTEM_NS.SCHEMAS, id);
      toast.success('Blueprint eliminado');
    } else if (nodeType === 'script') {
      await deleteItem('scripts', id);
    }

    if (selectedNode?.id === id) setSelectedNode(null);
  };

  // ─── RAIL ─────────────────────────────────────────────────────────────────

  const RAIL_TOP: { id: ActiveMode; icon: React.ElementType; label: string }[] = [
    { id: 'dna', icon: FileJson, label: 'DNA & Rutas' },
    { id: 'users', icon: Users, label: 'Gestión de Acceso' },
    { id: 'import', icon: Upload, label: 'Importar Datos' },
    { id: 'integrations', icon: Plug2, label: 'Integraciones' },
  ];
  const RAIL_BOTTOM: { id: ActiveMode; icon: React.ElementType; label: string }[] = [
    { id: 'infra', icon: Shield, label: 'Infraestructura' },
    { id: 'docs', icon: Info, label: 'Guías & Ayuda' },
  ];

  if (wizardHealth && !setupDismissed) {
    return (
      <SetupWizard
        health={wizardHealth}
        onComplete={() => setWizardHealth(null)}
        onSkip={() => {
          localStorage.setItem('setup_wizard_dismissed', 'true');
          setSetupDismissed(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden select-none">

      {/* ── RAIL ─────────────────────────────────────────────────── */}
      <aside className="w-14 border-r flex flex-col items-center pt-4 pb-5 bg-muted/15 shrink-0 gap-1">
        <div className="mb-4"><Shield size={18} className="text-primary animate-pulse" /></div>
        {RAIL_TOP.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveMode(id)} title={label}
            className={cn('w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
              activeMode === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}>
            <Icon size={16} />
          </button>
        ))}
        {/* Separador visual */}
        <div className="w-6 h-px bg-border/40 my-1" />
        {RAIL_BOTTOM.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveMode(id)} title={label}
            className={cn('w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
              activeMode === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}>
            <Icon size={16} />
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={handleRefresh} title="Sincronizar Estado"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <RotateCcw size={14} />
          </button>
        </div>
      </aside>

      {/* ── NAVIGATOR (solo modo dna) ─────────────────────────────── */}
      {activeMode === 'dna' && (
        <aside className="w-72 border-r flex flex-col shrink-0 bg-background overflow-hidden">
          <div className="h-14 px-4 border-b flex items-center justify-between bg-muted/5 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Jerarquía del Sistema</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <NavSection label="Rutas" icon={RouteIcon} count={routes.length} onAdd={handleAddRoute}>
              {[...routes]
                .sort((a: any, b: any) => Number(a.data?.order ?? 0) - Number(b.data?.order ?? 0))
                .map((r: any) => {
                  const blockCount = (r.data?.blocks ?? []).length;
                  const path = r.data?.path;
                  return (
                    <NavItem key={r.id}
                      label={path || '/sin-ruta'}
                      badge={blockCount > 0 ? `${blockCount} blks` : undefined}
                      icon={RouteIcon}
                      isSelected={selectedNode?.id === r.id && selectedNode?.nodeType === 'route'}
                      onClick={() => { setActiveDataSchema(null); setSelectedNode({ nodeType: 'route', id: r.id }); }}
                      onDelete={() => setPendingDelete({ nodeType: 'route', id: r.id })}
                      extra={path ? (
                        <button
                          onClick={e => { e.stopPropagation(); window.open(path, '_blank'); }}
                          title="Abrir ruta en nueva pestaña"
                          className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-primary transition-all"
                        >
                          <ExternalLink size={9} />
                        </button>
                      ) : undefined}
                    />
                  );
                })}
            </NavSection>
            <NavSection label="Schemas" icon={FileJson} count={schemas.length} onAdd={handleAddSchema}>
              {[...schemas]
                .sort((a: any, b: any) => Number(a.data?.order ?? 0) - Number(b.data?.order ?? 0))
                .map((s: any) => {
                  const schemaName = s.data?.name;
                  const isDataActive = activeDataSchema === schemaName;
                  return (
                    <NavItem key={s.id}
                      label={schemaName || 'sin_nombre'}
                      badge={isDataActive ? 'datos' : `${(s.data?.fields ?? []).length} flds`}
                      icon={isDataActive ? Table2 : FileJson}
                      isSelected={(selectedNode?.id === s.id && selectedNode?.nodeType === 'schema') || isDataActive}
                      onClick={() => { setActiveDataSchema(null); setSelectedNode({ nodeType: 'schema', id: s.id }); }}
                      onDelete={() => setPendingDelete({ nodeType: 'schema', id: s.id })}
                      extra={schemaName ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setActiveDataSchema(isDataActive ? null : schemaName);
                            if (!isDataActive) setSelectedNode(null);
                          }}
                          title={isDataActive ? 'Volver al editor' : 'Ver datos del schema'}
                          className={cn(
                            'w-4 h-4 rounded flex items-center justify-center transition-all',
                            isDataActive
                              ? 'opacity-100 text-primary'
                              : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-primary'
                          )}
                        >
                          <Table2 size={9} />
                        </button>
                      ) : undefined}
                    />
                  );
                })}
            </NavSection>
            <NavSection label="Scripts" icon={Zap} count={scripts.length} onAdd={handleAddScript}>
              {[...scripts]
                .sort((a: any, b: any) => Number(a.data?.order ?? 0) - Number(b.data?.order ?? 0))
                .map((s: any) => (
                  <NavItem key={s.id}
                    label={s.data?.name || 'sin_script'}
                    badge={s.data?.trigger}
                    icon={Zap}
                    isSelected={selectedNode?.id === s.id && selectedNode?.nodeType === 'script'}
                    onClick={() => setSelectedNode({ nodeType: 'script', id: s.id })}
                    onDelete={() => setPendingDelete({ nodeType: 'script', id: s.id })}
                  />
                ))}
            </NavSection>
          </div>
        </aside>
      )}

      {/* ── CANVAS ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {activeMode === 'dna' && (() => {
          // Inline data browser: schema selected in "data mode"
          if (activeDataSchema) {
            const schemaItem = schemas.find((s: any) => s.data?.name === activeDataSchema);
            if (schemaItem) {
              return (
                <DataBrowserCanvas
                  schemaName={activeDataSchema}
                  schema={schemaItem.data}
                  onBack={() => setActiveDataSchema(null)}
                />
              );
            }
          }
          return (
            <div className="h-full overflow-y-auto p-8 bg-muted/5">
              <RightPanel
                node={selectedNode}
                routes={routes}
                schemas={schemas}
                scripts={scripts}
                userLists={userLists}
                saveItem={saveItem}
                deleteItem={deleteItem}
                setPendingDelete={setPendingDelete}
                onSelectNode={setSelectedNode}
              />
            </div>
          );
        })()}
        {activeMode === 'users' && <UserManager />}
        {activeMode === 'import' && (
          <ImportWizard mode="panel" open={true} onClose={() => setActiveMode('dna')} />
        )}
        {activeMode === 'integrations' && (
          <IntegrationsSection envPresence={envPresence} />
        )}
        {activeMode === 'infra' && (
          <InfraCanvas config={config} setConfig={handleUpdateConfig} />
        )}
        {activeMode === 'docs' && (
          <div className="h-full overflow-y-auto p-8 max-w-4xl">
            <DocsSection />
          </div>
        )}
      </main>

      {/* ── CONFIRM DELETE ────────────────────────────────────────── */}
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-card border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xs font-black uppercase tracking-widest">Confirmar eliminación</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Esta acción es irreversible. El elemento será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 rounded-xl">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}
              className="flex-1 text-[10px] font-black uppercase tracking-widest h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}

// Backward-compat alias — importers de AdminGear, SovereigntyOrchestrator, schema/page.tsx
export const AgnosticDesigner = ConfigManager;

// ─── RIGHT PANEL DISPATCHER ───────────────────────────────────────────────────

function RightPanel({
  node, routes, schemas, scripts, userLists, saveItem, deleteItem, setPendingDelete, onSelectNode,
}: {
  node: SelectedNode | null;
  routes: any[]; schemas: any[]; scripts: any[]; userLists: any[];
  saveItem: any; deleteItem: any;
  setPendingDelete: (n: SelectedNode) => void;
  onSelectNode: (n: SelectedNode) => void;
}) {
  if (!node) return <EmptyEditorState />;
  const common = { saveItem, deleteItem, setPendingDelete };

  switch (node.nodeType) {
    case 'route':
      return <RouteConfig key={node.id} routeId={node.id} routes={routes} userLists={userLists}
        schemas={schemas} scripts={scripts}
        saveItem={saveItem} deleteItem={deleteItem} setPendingDelete={setPendingDelete} onSelectNode={onSelectNode} />;
    case 'block':
      return <BlockConfig key={`${node.routeId}-${node.id}`} blockId={node.id} routeId={node.routeId!}
        routes={routes} schemas={schemas} tokens={[]} saveItem={saveItem} setPendingDelete={setPendingDelete} />;
    case 'schema':
      return <SchemaConfig key={node.id} schemaId={node.id} schemas={schemas} {...common} />;
    case 'script':
      return <ScriptConfig key={node.id} scriptId={node.id} scripts={scripts} {...common} />;
    default:
      return <EmptyEditorState />;
  }
}

// ─── SAVE INDICATOR ───────────────────────────────────────────────────────────

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null;
  return (
    <span className={cn('text-[10px] font-black uppercase tracking-widest transition-all',
      status === 'saving' ? 'text-muted-foreground animate-pulse' : 'text-primary/60')}>
      {status === 'saving' ? 'Guardando...' : '✓ Guardado'}
    </span>
  );
}

// ─── ROUTE ANATOMY ────────────────────────────────────────────────────────────
function collectRouteAnatomy(blocks: any[]): { contexts: string[]; zaps: string[] } {
  const contexts = new Set<string>();
  const zaps = new Set<string>();
  function walk(nodes: any[]) {
    for (const b of nodes) {
      if (b.context) contexts.add(b.context);
      if (b.config?.zap) zaps.add(b.config.zap);
      if (b.blocks?.length) walk(b.blocks);
    }
  }
  walk(blocks);
  return { contexts: [...contexts], zaps: [...zaps] };
}

// ─── 1. ROUTE CONFIG ─────────────────────────────────────────────────────────
function RouteConfig({
  routeId, routes, userLists, schemas, scripts, saveItem, deleteItem, setPendingDelete, onSelectNode,
}: {
  routeId: string; routes: any[]; userLists: any[]; schemas: any[]; scripts: any[];
  saveItem: any; deleteItem: any;
  setPendingDelete: (n: SelectedNode) => void;
  onSelectNode: (n: SelectedNode) => void;
}) {
  const route = useMemo(() => routes.find((r: any) => r.id === routeId), [routes, routeId]);
  const [local, setLocal] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const localRef  = useRef(local);
  const routeRef  = useRef(route);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (route) setLocal(route.data ?? {});
  }, [routeId]);

  const isDirty = route && JSON.stringify(local) !== JSON.stringify(route.data ?? {});
  useEffect(() => { isDirtyRef.current = !!isDirty; }, [isDirty]);
  useEffect(() => { localRef.current  = local;      }, [local]);
  useEffect(() => { routeRef.current  = route;      }, [route]);

  const debouncedLocal = useDebounce(local, 600);

  useEffect(() => {
    if (!isDirty || !route) return;
    setSaveStatus('saving');
    saveItem(SYSTEM_NS.ROUTES, { ...route, data: debouncedLocal }, { silent: true })
      .then(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); })
      .catch(() => setSaveStatus('idle'));
  }, [debouncedLocal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guardar al desmontar si hay cambios pendientes
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && routeRef.current) {
        saveItem(SYSTEM_NS.ROUTES, { ...routeRef.current, data: localRef.current }, { silent: true });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: any) => setLocal((prev: any) => ({ ...prev, ...patch }));

  if (!route) return null;

  const handleAddBlock = async () => {
    const newBlock = { id: crypto.randomUUID(), type: 'frame', title: 'Nuevo Frame', direction: 'vertical', blocks: [] };
    const updatedBlocks = [...(local.blocks ?? []), newBlock];
    const updatedLocal = { ...local, blocks: updatedBlocks };
    setLocal(updatedLocal);
    await saveItem(SYSTEM_NS.ROUTES, { ...route, data: updatedLocal }, { silent: true });
    onSelectNode({ nodeType: 'block', id: newBlock.id, routeId });
  };

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">

      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <RouteIcon size={16} /> Ruta en Edición
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
            Navegación topológica y composición de bloques
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          {local.path && (
            <Button variant="outline" size="sm" onClick={() => window.open(local.path, '_blank')}
              className="text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-primary/20 hover:border-primary gap-2">
              <ExternalLink size={12} /> Abrir Ruta
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setPendingDelete({ nodeType: 'route', id: routeId })}
            className="text-destructive/50 hover:text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest">
            <Trash2 size={14} className="mr-2" /> Eliminar Ruta
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-background border rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ruta de URL (Slug)</label>
            <Input value={local.path || ''} onChange={e => update({ path: e.target.value })} className="font-bold text-xs h-9" placeholder="/mi-ruta" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Título de la Página</label>
            <Input value={local.title || ''} onChange={e => update({ title: e.target.value })} className="font-bold text-xs h-9" placeholder="Mi Página" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Gobernanza de Acceso</label>
            <Select value={String(local.isPrivate ?? 'false')} onValueChange={val => update({ isPrivate: val === 'true' })}>
              <SelectTrigger className="h-9 text-xs font-semibold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Público (Acceso Global)</SelectItem>
                <SelectItem value="true">Privado (Autenticación Requerida)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ajuste del Canvas</label>
            <Select value={local.layout_mode || 'container'} onValueChange={val => update({ layout_mode: val })}>
              <SelectTrigger className="h-9 text-xs font-semibold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="canvas">Canvas Completo (Fluid)</SelectItem>
                <SelectItem value="container">Contenedor Centrado (Optimized)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Anatomía de la ruta */}
      {(() => {
        const { contexts, zaps } = collectRouteAnatomy(local.blocks ?? []);
        if (contexts.length === 0 && zaps.length === 0) return null;
        return (
          <div className="bg-background border rounded-2xl p-6 shadow-sm space-y-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
              Anatomía de la Ruta
            </label>
            {contexts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                  <Database size={9} /> Schemas activos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {contexts.map(ctx => {
                    const ok = schemas.some((s: any) => s.data?.name === ctx);
                    return (
                      <span key={ctx} className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border',
                        ok ? 'border-emerald-500/30 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                           : 'border-amber-500/30 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400'
                      )}>
                        <span className={cn('size-1.5 rounded-full shrink-0', ok ? 'bg-emerald-500' : 'bg-amber-500')} />
                        {ctx}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {zaps.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                  <Zap size={9} /> Zaps activos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {zaps.map(zap => {
                    const ok = scripts.some((s: any) => s.data?.name === zap);
                    return (
                      <span key={zap} className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border',
                        ok ? 'border-violet-500/30 text-violet-700 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400'
                           : 'border-red-500/30 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400'
                      )}>
                        <span className={cn('size-1.5 rounded-full shrink-0', ok ? 'bg-violet-500' : 'bg-red-500')} />
                        {zap}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Acceso permitido */}
      <div className="bg-background border rounded-2xl p-6 shadow-sm">
        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Acceso Permitido</label>
        <p className="text-[10px] text-muted-foreground mb-2">
          {((local.allowed_lists ?? []) as string[]).length === 0
            ? 'Página pública — sin restricción de acceso'
            : 'Solo usuarios en las listas seleccionadas (admin siempre incluido)'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {userLists.map((list: any) => {
            const name = list.data?.name as string;
            const active = ((local.allowed_lists ?? []) as string[]).includes(name);
            return (
              <button key={list.id}
                onClick={() => {
                  const current: string[] = (local.allowed_lists ?? []) as string[];
                  update({ allowed_lists: active ? current.filter(t => t !== name) : [...current, name] });
                }}
                className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/60')}>
                {name}
              </button>
            );
          })}
          {userLists.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">Sin listas definidas. Crea listas en el módulo de Acceso.</p>
          )}
        </div>
      </div>

      {/* Bloques de la ruta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Bloques del Layout — selecciona uno en el árbol para editarlo
          </h3>
          <Button onClick={handleAddBlock} variant="outline" size="sm"
            className="text-[10px] font-black uppercase tracking-widest border-dashed gap-2">
            <Plus size={12} /> Añadir Frame
          </Button>
        </div>
        {(local.blocks ?? []).length === 0 ? (
          <div className="text-center py-10 text-xs font-semibold text-muted-foreground border border-dashed rounded-2xl bg-background">
            Sin bloques. Añade un Frame para empezar a componer.
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground border rounded-xl p-3 bg-muted/10 space-y-1">
            {(local.blocks ?? []).map((b: any) => (
              <div key={b.id} className="flex items-center gap-2">
                {React.createElement(blockIconFor(b.type), { size: 11, className: 'text-primary/60 shrink-0' })}
                <span className="font-semibold">{b.config?.label ?? b.title ?? b.type}</span>
                {b.blocks?.length > 0 && <span className="text-muted-foreground/50">({b.blocks.length} hijos)</span>}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ─── 2. BLOCK CONFIG ─────────────────────────────────────────────────────────
function BlockConfig({
  blockId, routeId, routes, schemas, tokens, saveItem, setPendingDelete,
}: {
  blockId: string; routeId: string;
  routes: any[]; schemas: any[]; tokens: any[];
  saveItem: any; deleteItem?: any;
  setPendingDelete: (n: SelectedNode) => void;
}) {
  const route = useMemo(() => routes.find((r: any) => r.id === routeId), [routes, routeId]);
  const block = useMemo(() => route ? findDeepBlock(route.data?.blocks ?? [], blockId) : null, [route, blockId]);

  const [local, setLocal] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const localRef   = useRef<any>(null);
  const routeRef   = useRef<any>(route);
  const isDirtyRef = useRef(false);

  useEffect(() => { if (block) setLocal(block); }, [blockId]);
  useEffect(() => { localRef.current = local;   }, [local]);
  useEffect(() => { routeRef.current = route;   }, [route]);

  const isDirty = local && block && JSON.stringify(local) !== JSON.stringify(block);
  useEffect(() => { isDirtyRef.current = !!isDirty; }, [isDirty]);

  const debouncedLocal = useDebounce(local, 600);

  useEffect(() => {
    if (!isDirty || !route || !local) return;
    setSaveStatus('saving');
    const updatedBlocks = deepUpdateBlock(route.data?.blocks ?? [], blockId, local);
    saveItem(SYSTEM_NS.ROUTES, { ...route, data: { ...route.data, blocks: updatedBlocks } }, { silent: true })
      .then(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); })
      .catch(() => setSaveStatus('idle'));
  }, [debouncedLocal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (isDirtyRef.current && routeRef.current && localRef.current) {
        const updatedBlocks = deepUpdateBlock(routeRef.current.data?.blocks ?? [], blockId, localRef.current);
        saveItem(SYSTEM_NS.ROUTES, { ...routeRef.current, data: { ...routeRef.current.data, blocks: updatedBlocks } }, { silent: true });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!route || !block || !local) return (
    <div className="flex items-center justify-center h-40 text-xs text-muted-foreground font-semibold">
      Bloque no encontrado — puede haber sido eliminado.
    </div>
  );

  const update = (patch: any) => setLocal((prev: any) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">

      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
            {React.createElement(blockIconFor(local.type), { size: 16 })} Bloque en Edición
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
            Ruta padre: {route.data?.path}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <Button variant="ghost" size="sm"
            onClick={() => setPendingDelete({ nodeType: 'block', id: blockId, routeId })}
            className="text-destructive/50 hover:text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest">
            <Trash2 size={14} className="mr-2" /> Eliminar Bloque
          </Button>
        </div>
      </div>

      <RecursiveBlockComposer
        block={local}
        schemas={schemas}
        tokens={tokens}
        hideChildren={true}
        onUpdate={update}
        onRemove={() => setPendingDelete({ nodeType: 'block', id: blockId, routeId })}
      />

    </div>
  );
}

// ─── 3. SCHEMA CONFIG ─────────────────────────────────────────────────────────

function SchemaConfig({
  schemaId, schemas, saveItem, setPendingDelete,
}: {
  schemaId: string; schemas: any[];
  saveItem: any; deleteItem?: any;
  setPendingDelete: (n: SelectedNode) => void;
}) {
  const schema = useMemo(() => schemas.find((s: any) => s.id === schemaId), [schemas, schemaId]);

  const [localName, setLocalName]     = useState('');
  const [localFields, setLocalFields] = useState<SchemaField[]>([]);
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saving' | 'saved'>('idle');
  const [openFieldSettingsIdx, setOpenFieldSettingsIdx] = useState<number | null>(null);

  const schemaIdRef     = useRef(schemaId);
  const localNameRef    = useRef(localName);
  const localFieldsRef  = useRef(localFields);
  const isDirtyRef      = useRef(false);

  const isDirty = !!schema && schema.id === schemaId && (
    localName !== (schema.data?.name || '') ||
    JSON.stringify(localFields) !== JSON.stringify(schema.data?.fields || [])
  );

  useEffect(() => { schemaIdRef.current    = schemaId;    }, [schemaId]);
  useEffect(() => { localNameRef.current   = localName;   }, [localName]);
  useEffect(() => { localFieldsRef.current = localFields; }, [localFields]);
  useEffect(() => { isDirtyRef.current     = isDirty;     }, [isDirty]);

  const existingSections = useMemo(() =>
    [...new Set(localFields.map((f: any) => f.section).filter(Boolean))] as string[],
    [localFields]
  );

  const saveImmediately = async (targetId: string, name: string, fields: any[]) => {
    if (!name.trim()) return;
    setSaveStatus('saving');
    const s = schemas.find((s: any) => s.id === targetId);
    if (!s) return;
    try {
      await saveItem(SYSTEM_NS.SCHEMAS, { ...s, data: { name, fields } }, { silent: true });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch { setSaveStatus('idle'); }
  };

  useEffect(() => {
    if (isDirtyRef.current && schemaIdRef.current && schemaIdRef.current !== schemaId) {
      saveImmediately(schemaIdRef.current, localNameRef.current, localFieldsRef.current);
    }
    if (schema) { setLocalName(schema.data?.name || ''); setLocalFields(schema.data?.fields || []); }
  }, [schemaId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (isDirtyRef.current && schemaIdRef.current) {
        saveImmediately(schemaIdRef.current, localNameRef.current, localFieldsRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedName   = useDebounce(localName,   800);
  const debouncedFields = useDebounce(localFields, 800);

  useEffect(() => {
    if (!isDirty) return;
    saveImmediately(schemaId, debouncedName, debouncedFields);
  }, [debouncedName, debouncedFields]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!schema) return <div className="text-sm font-semibold opacity-40">Buscando blueprint del DNA...</div>;

  const handleAddField = () => {
    setLocalFields(prev => [...prev, {
      id: crypto.randomUUID(), key: `campo_${Date.now().toString().slice(-4)}`,
      label: 'Nuevo Campo', type: 'text', width: 'full'
    }]);
  };

  const handleUpdateField = (idx: number, patch: any) => {
    setLocalFields(prev => { const f = [...prev]; f[idx] = { ...f[idx], ...patch }; return f; });
  };

  const handleRemoveField = (fieldId: string) => {
    setLocalFields(prev => prev.filter((f: any) => f.id !== fieldId));
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">

      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <FileJson size={16} /> Esquema en Edición
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
            Arquitectura de estructuras de datos y planos de información
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SaveIndicator status={saveStatus} />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm"
                className="border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/5 font-bold uppercase text-[10px] tracking-widest gap-2 shadow-sm">
                <Database size={14} /> Capturar Datos (Live)
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background border-l shadow-2xl">
              <SheetHeader className="border-b pb-4 mb-4 text-left">
                <SheetTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Database size={16} /> Capturar en Caliente: {localName || 'Silo'}
                </SheetTitle>
                <SheetDescription className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Generar registros instantáneos en la base de datos desde el blueprint actual.
                </SheetDescription>
              </SheetHeader>
              <AgnosticFormEmbed schemaName={localName} fields={localFields} isDirty={isDirty} saveItem={saveItem} />
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="sm" onClick={() => setPendingDelete({ nodeType: 'schema', id: schemaId })}
            className="text-destructive/50 hover:text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest">
            <Trash2 size={14} className="mr-2" /> Eliminar Esquema
          </Button>
        </div>
      </div>

      {/* Nombre del Blueprint */}
      <div className="bg-background border rounded-2xl p-6 shadow-sm flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
          <FileJson size={20} />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Blueprint (Namespace)</label>
          <Input value={localName} onChange={e => setLocalName(e.target.value)} className="font-bold text-xs h-9" />
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Campos Estructurales (Átomos)</h3>
        </div>
        {localFields.length === 0 ? (
          <div className="text-center py-12 text-xs font-semibold text-muted-foreground border border-dashed rounded-2xl bg-background flex flex-col items-center gap-4">
            <span>Este esquema no tiene campos aún.</span>
            <Button onClick={handleAddField} variant="outline" size="sm"
              className="text-[10px] font-black uppercase tracking-widest border-dashed gap-2 w-48">
              <Plus size={12} /> Diseñar Primer Campo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {localFields.map((field: any, idx: number) => {
              const autoSlug = (field.label || '').toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
              return (
                <div key={field.id || idx} className="bg-background border rounded-xl p-4 shadow-sm hover:border-primary/20 transition-all flex flex-col gap-4 relative group">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">

                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Etiqueta Visual</label>
                      <Input value={field.label || ''}
                        onChange={e => {
                          const newLabel = e.target.value;
                          const newKey = newLabel.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
                          handleUpdateField(idx, { label: newLabel, key: newKey });
                        }}
                        placeholder="Ej. Nombre del Cliente" className="font-bold text-xs h-9 bg-muted/5 border-muted/80" />
                    </div>

                    <div className="w-full md:w-44 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Dato</label>
                      <Select value={field.type || 'text'} onValueChange={val => {
                        const patch: any = { type: val };
                        if (val === 'relation') patch.config = { ...(field.config || {}), relation: { entity: '', parent_key: 'id' } };
                        handleUpdateField(idx, patch);
                      }}>
                        <SelectTrigger className="h-9 font-bold text-xs bg-muted/5 border-muted/80"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto Plano</SelectItem>
                          <SelectItem value="number">Numérico</SelectItem>
                          <SelectItem value="select">Opciones (Select)</SelectItem>
                          <SelectItem value="date">Fecha</SelectItem>
                          <SelectItem value="boolean">Booleano</SelectItem>
                          <SelectItem value="textarea">Área de Texto</SelectItem>
                          <SelectItem value="relation">Relación (FK)</SelectItem>
                          <SelectItem value="object">Objeto Anidado</SelectItem>
                          <SelectItem value="array_of_objects">Lista de Objetos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {field.type === 'relation' && (
                      <div className="w-full md:w-44 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Blueprint Relacionado</label>
                        <Select value={field.config?.relation?.entity || ''}
                          onValueChange={val => handleUpdateField(idx, { config: { ...(field.config || {}), relation: { entity: val, parent_key: 'id' } } })}>
                          <SelectTrigger className="h-9 font-bold text-xs bg-primary/5 border-primary/20 text-primary"><SelectValue placeholder="Elegir blueprint" /></SelectTrigger>
                          <SelectContent>
                            {schemas.filter((s: any) => s.data?.name).map((s: any) => (
                              <SelectItem key={s.id} value={s.data.name}>{s.data.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="w-full md:w-44 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Slug (JSON Key)</label>
                      <div className="h-9 px-3 border bg-muted/20 rounded-lg flex items-center text-xs font-mono font-bold text-primary truncate border-muted/80 select-all">
                        {field.key || autoSlug || 'sin_clave'}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 pt-5 md:pt-0">
                      <input type="checkbox" id={`req-${field.id || idx}`} checked={!!field.required}
                        onChange={e => handleUpdateField(idx, { required: e.target.checked })}
                        className="w-4 h-4 rounded border-muted/80 accent-primary cursor-pointer" />
                      <label htmlFor={`req-${field.id || idx}`} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground select-none cursor-pointer">
                        Obligatorio
                      </label>
                    </div>

                    <div className="shrink-0 flex items-end gap-1 pt-5 md:pt-0">
                      <Button type="button" variant="ghost" size="icon"
                        onClick={() => setOpenFieldSettingsIdx(openFieldSettingsIdx === idx ? null : idx)}
                        className={cn('w-9 h-9 rounded-xl transition-colors',
                          openFieldSettingsIdx === idx ? 'text-primary bg-primary/5 border border-primary/10' : 'text-muted-foreground/60 hover:text-primary hover:bg-muted')}>
                        <Settings2 size={14} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveField(field.id)}
                        className="w-9 h-9 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/5">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {(field.type === 'object' || field.type === 'array_of_objects') && (
                    <SubFieldEditor fields={field.fields || []} schemas={schemas}
                      onChange={updated => handleUpdateField(idx, { fields: updated })} />
                  )}

                  {openFieldSettingsIdx === idx && (
                    <div className="w-full border-t border-dashed border-border/60 pt-4 mt-2 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1 max-w-xs">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Sección Visual (Tab)</label>
                        <SectionCombobox value={field.section ?? ''} options={existingSections}
                          onChange={val => handleUpdateField(idx, { section: val })} />
                      </div>
                      <div className="border-t border-border/10 pt-4">
                        <AgnosticConfigProjector schema={FIELD_META_SCHEMA} data={field}
                          onUpdate={patch => {
                            if (patch.isPrimary !== undefined) {
                              handleUpdateField(idx, { isPrimary: patch.isPrimary, config: { ...(field.config || {}), isPrimary: patch.isPrimary } });
                            } else {
                              handleUpdateField(idx, patch);
                            }
                          }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="pt-2">
              <Button onClick={handleAddField} variant="outline" size="sm"
                className="w-full border-dashed text-[10px] font-black uppercase tracking-widest gap-2 py-5 rounded-xl hover:bg-muted/10">
                <Plus size={12} /> Añadir Nuevo Campo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 4. SCRIPT CONFIG ─────────────────────────────────────────────────────────

function ScriptConfig({
  scriptId, scripts, saveItem, setPendingDelete,
}: {
  scriptId: string; scripts: any[];
  saveItem: any; deleteItem?: any;
  setPendingDelete: (n: SelectedNode) => void;
}) {
  const script = useMemo(() => scripts.find((s: any) => s.id === scriptId), [scripts, scriptId]);

  const [localName,        setLocalName]        = useState('');
  const [localTrigger,     setLocalTrigger]     = useState('onSave');
  const [localDescription, setLocalDescription] = useState('');
  const [localCode,        setLocalCode]        = useState('');
  const [saveStatus,       setSaveStatus]       = useState<'idle' | 'saving' | 'saved'>('idle');

  const refs = {
    id:          useRef(scriptId),
    name:        useRef(localName),
    trigger:     useRef(localTrigger),
    description: useRef(localDescription),
    code:        useRef(localCode),
    isDirty:     useRef(false),
  };

  useEffect(() => { if (script) { setLocalName(script.data?.name || ''); setLocalTrigger(script.data?.trigger || 'onSave'); setLocalDescription(script.data?.description || ''); setLocalCode(script.data?.code || ''); } }, [scriptId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { refs.id.current          = scriptId;        }, [scriptId]);
  useEffect(() => { refs.name.current        = localName;       }, [localName]);
  useEffect(() => { refs.trigger.current     = localTrigger;    }, [localTrigger]);
  useEffect(() => { refs.description.current = localDescription;}, [localDescription]);
  useEffect(() => { refs.code.current        = localCode;       }, [localCode]);

  const isDirty = script && (
    localName        !== (script.data?.name        || '') ||
    localTrigger     !== (script.data?.trigger     || 'onSave') ||
    localDescription !== (script.data?.description || '') ||
    localCode        !== (script.data?.code        || '')
  );
  useEffect(() => { refs.isDirty.current = !!isDirty; }, [isDirty]);

  const debouncedName        = useDebounce(localName,        800);
  const debouncedTrigger     = useDebounce(localTrigger,     200);
  const debouncedDescription = useDebounce(localDescription, 800);
  const debouncedCode        = useDebounce(localCode,        1000);

  const doSave = async (id: string, name: string, trigger: string, description: string, code: string) => {
    const s = scripts.find((s: any) => s.id === id);
    if (!s || !name.trim()) return;
    setSaveStatus('saving');
    try {
      await saveItem('scripts', { ...s, data: { name, trigger, description, code } }, { silent: true });
      setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000);
    } catch { setSaveStatus('idle'); }
  };

  useEffect(() => {
    if (!isDirty) return;
    doSave(scriptId, debouncedName, debouncedTrigger, debouncedDescription, debouncedCode);
  }, [debouncedName, debouncedTrigger, debouncedDescription, debouncedCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (refs.isDirty.current && refs.id.current) {
        doSave(refs.id.current, refs.name.current, refs.trigger.current, refs.description.current, refs.code.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!script) return <div className="text-sm font-semibold opacity-40">Buscando script de evento...</div>;

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">

      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Zap size={16} className="animate-bounce" /> Lógica en Edición
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
            Control de eventos funcionales y automatizaciones puras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <Button variant="ghost" size="sm" onClick={() => setPendingDelete({ nodeType: 'script', id: scriptId })}
            className="text-destructive/50 hover:text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest">
            <Trash2 size={14} className="mr-2" /> Eliminar Script
          </Button>
        </div>
      </div>

      <div className="bg-background border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Único del Script</label>
            <Input value={localName} onChange={e => setLocalName(e.target.value)} className="font-bold text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trigger de Ejecución</label>
            <Select value={localTrigger} onValueChange={setLocalTrigger}>
              <SelectTrigger className="text-xs font-semibold h-9"><SelectValue /></SelectTrigger>
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
          <Input value={localDescription} onChange={e => setLocalDescription(e.target.value)} className="text-xs" />
        </div>
      </div>

      <div className="bg-background border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="bg-muted/30 px-6 py-3 border-b flex items-center justify-between shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">function run(record, api)</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
        </div>
        <Textarea value={localCode} onChange={e => setLocalCode(e.target.value)}
          className="flex-1 w-full font-mono text-xs p-6 leading-relaxed resize-none rounded-none border-0 focus-visible:ring-0 bg-muted/30 text-foreground min-h-0 h-full"
          spellCheck={false} placeholder="// function run(record, api) { ... }" />
        <div className="bg-muted/10 px-6 py-2 border-t text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
          Entorno Isomórfico Protegido
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyEditorState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
      <div className="h-16 w-16 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-xl shadow-primary/[0.02]">
        <Sparkles size={28} className="animate-pulse" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Studio de Composición Paramétrica</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Selecciona cualquier ruta, bloque, blueprint o script en la jerarquía para habilitar las consolas de edición en tiempo real.
        </p>
      </div>
    </div>
  );
}

// ─── SECTION COMBOBOX ─────────────────────────────────────────────────────────

function SectionCombobox({ value, options, onChange }: { value: string; options: string[]; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}
          className="w-full justify-between font-bold text-xs h-9 bg-muted/5 border-muted/80 hover:bg-muted/10 text-left px-3">
          <span className="truncate">{value || 'Seleccionar Sección...'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 bg-card border rounded-xl shadow-lg z-50">
        <div className="flex gap-1.5 mb-2">
          <Input placeholder="Buscar o crear..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs font-semibold" />
          {search.trim() && !options.includes(search.trim()) && (
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10 shrink-0"
              onClick={() => { onChange(search.trim()); setSearch(''); setOpen(false); }}>
              <Plus size={14} />
            </Button>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.length === 0 && !search.trim() && (
            <div className="text-[10px] text-muted-foreground p-2 text-center uppercase tracking-wider font-bold">Sin secciones</div>
          )}
          {filtered.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={cn('flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors',
                value === opt ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground')}>
              <span>{opt}</span>
              {value === opt && <Check size={12} className="text-primary" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── SUB FIELD EDITOR ─────────────────────────────────────────────────────────

function SubFieldEditor({ fields = [], onChange, schemas }: { fields: SchemaField[]; onChange: (f: SchemaField[]) => void; schemas: any[] }) {
  const handleAddSub = () => {
    onChange([...fields, { id: crypto.randomUUID(), key: `sub_${Date.now().toString().slice(-4)}`, label: 'Sub Campo', type: 'text' as const }]);
  };
  const handleUpdateSub = (idx: number, patch: any) => {
    const updated = [...fields]; updated[idx] = { ...updated[idx], ...patch }; onChange(updated);
  };
  const handleRemoveSub = (idx: number) => onChange(fields.filter((_, i) => i !== idx));

  return (
    <div className="w-full bg-muted/5 border border-dashed rounded-xl p-4 space-y-3 animate-in slide-in-from-top-1 duration-200 mt-2">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estructura de Sub-campos Anidados</label>
      </div>
      {fields.length === 0 ? (
        <div className="text-[9px] text-center text-muted-foreground/60 py-4 font-bold uppercase tracking-wider">Sin sub-campos definidos</div>
      ) : (
        <div className="space-y-2">
          {fields.map((sub, idx) => {
            const autoSlug = (sub.label || '').toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
            return (
              <div key={sub.id || idx} className="flex flex-col md:flex-row md:items-center gap-3 bg-background border p-3 rounded-lg shadow-sm">
                <div className="flex-1 space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Etiqueta</label>
                  <Input value={sub.label || ''} onChange={e => {
                    const l = e.target.value; handleUpdateSub(idx, { label: l, key: l.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w-]+/g, '') });
                  }} placeholder="Ej. Nombre" className="font-bold text-xs h-8" />
                </div>
                <div className="w-full md:w-36 space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Tipo</label>
                  <Select value={sub.type || 'text'} onValueChange={val => {
                    const patch: any = { type: val };
                    if (val === 'relation') patch.config = { relation: { entity: '', parent_key: 'id' } };
                    handleUpdateSub(idx, patch);
                  }}>
                    <SelectTrigger className="h-8 font-bold text-xs bg-muted/5 border-muted/80"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="date">Fecha</SelectItem>
                      <SelectItem value="boolean">Booleano</SelectItem>
                      <SelectItem value="relation">Relación (FK)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(sub as any).type === 'relation' && (
                  <div className="w-full md:w-36 space-y-1 animate-in fade-in duration-200">
                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Relacionado</label>
                    <Select value={(sub as any).config?.relation?.entity || ''}
                      onValueChange={val => handleUpdateSub(idx, { config: { relation: { entity: val, parent_key: 'id' } } })}>
                      <SelectTrigger className="h-8 font-bold text-xs bg-primary/5 border-primary/20 text-primary"><SelectValue placeholder="Blueprint" /></SelectTrigger>
                      <SelectContent>
                        {schemas.filter((s: any) => s.data?.name).map((s: any) => (
                          <SelectItem key={s.id} value={s.data.name}>{s.data.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="w-full md:w-28 space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Key (Slug)</label>
                  <div className="h-8 px-2 border bg-muted/20 rounded-md flex items-center text-[10px] font-mono font-bold text-primary truncate select-all">
                    {sub.key || autoSlug || 'key'}
                  </div>
                </div>
                <div className="shrink-0 flex items-end pt-4 md:pt-0">
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSub(idx)}
                    className="w-8 h-8 rounded-lg text-destructive/40 hover:text-destructive hover:bg-destructive/5">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex justify-end pt-1">
        <Button onClick={handleAddSub} variant="outline" size="sm"
          className="text-[9px] font-black uppercase tracking-widest border-dashed gap-1 h-8 rounded-lg">
          <Plus size={10} /> Añadir Sub-campo
        </Button>
      </div>
    </div>
  );
}

// ─── AGNOSTIC FORM EMBED (Live Capture) ───────────────────────────────────────

function AgnosticFormEmbed({ schemaName, fields, isDirty, saveItem }: {
  schemaName: string; fields: any[]; isDirty: boolean; saveItem: any;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const set = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    const missing = fields.filter(f => f.required && (formData[f.key] === undefined || formData[f.key] === '')).map(f => f.label || f.key);
    if (missing.length > 0) { toast.error(`Campos requeridos: ${missing.join(', ')}`); return; }
    try {
      await saveItem(schemaName, { id: crypto.randomUUID(), context: schemaName, data: formData });
      toast.success(<div className="space-y-1 text-left">
        <p className="font-bold text-xs uppercase tracking-wider text-primary">¡Registro Guardado!</p>
        <pre className="text-[9px] font-mono p-2 bg-muted/20 rounded border leading-tight max-h-32 overflow-y-auto w-64">{JSON.stringify(formData, null, 2)}</pre>
      </div>, { duration: 5000 });
      setFormData({});
    } catch (e: any) { toast.error(`Error: ${e.message || e}`); }
  };

  return (
    <div className="space-y-6 py-4">
      {isDirty && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl p-3 text-[9px] uppercase tracking-widest font-black flex items-center gap-2">
          <Info size={14} className="shrink-0" />
          <span>Cambios locales sin guardar. El formulario usa la última versión guardada.</span>
        </div>
      )}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground font-semibold">Sin campos definidos.</div>
        ) : (
          fields.map(field => (
            <div key={field.id} className="space-y-1.5 text-left">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                {field.label || field.key} {field.required && <span className="text-destructive">*</span>}
              </label>
              {field.type === 'boolean' ? (
                <div className="flex items-center gap-2 py-1.5">
                  <input type="checkbox" checked={!!formData[field.key]} onChange={e => set(field.key, e.target.checked)} className="w-4 h-4 accent-primary cursor-pointer" />
                  <span className="text-xs font-semibold">Activo / Verdadero</span>
                </div>
              ) : field.type === 'select' ? (
                <Select value={formData[field.key] || ''} onValueChange={v => set(field.key, v)}>
                  <SelectTrigger className="h-9 font-semibold text-xs"><SelectValue placeholder="Seleccionar opción" /></SelectTrigger>
                  <SelectContent>
                    {(field.options || field.config?.options || []).map((opt: any) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label || opt.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea value={formData[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="font-semibold text-xs min-h-20" />
              ) : field.type === 'date' ? (
                <Input type="date" value={formData[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="font-semibold text-xs h-9" />
              ) : field.type === 'number' ? (
                <Input type="number" value={formData[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="font-semibold text-xs h-9" />
              ) : (
                <Input type="text" value={formData[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="font-semibold text-xs h-9" />
              )}
            </div>
          ))
        )}
      </div>
      <div className="pt-4 border-t">
        <Button onClick={handleSave} disabled={fields.length === 0}
          className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
          <Sparkles size={12} /> Guardar Registro
        </Button>
      </div>
    </div>
  );
}

// ─── DATA BROWSER CANVAS ─────────────────────────────────────────────────────
// Embeds the DataBrowser inside the designer canvas area.
// Fetches records client-side (no SSR needed here — designer is already client).

function DataBrowserCanvas({
  schemaName, schema, onBack,
}: {
  schemaName: string;
  schema: any;
  onBack: () => void;
}) {
  const [records, setRecords] = React.useState<DataItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/vault?namespace=${schemaName}`);
      const json = await res.json();
      setRecords(json.records ?? []);
    } catch (e) {
      console.error('[DataBrowserCanvas]', e);
    } finally {
      setLoading(false);
    }
  }, [schemaName]);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Database size={14} className="animate-pulse" />
        Cargando {schemaName}…
      </div>
    );
  }

  return (
    <DataBrowser
      schemaName={schemaName}
      schema={schema}
      initialRecords={records}
      onBack={onBack}
      className="h-full"
    />
  );
}

// ─── NAVIGATOR PRIMITIVES ─────────────────────────────────────────────────────

function NavSection({
  label, icon: Icon, count, onAdd, children,
}: {
  label: string;
  icon: React.ElementType;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-2 py-1.5 mb-0.5">
        <div className="flex items-center gap-1.5 text-muted-foreground/70">
          <Icon size={11} />
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
          <span className="text-[9px] font-bold opacity-50">({count})</span>
        </div>
        <button onClick={onAdd} title={`Añadir ${label}`}
          className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors">
          <Plus size={10} />
        </button>
      </div>
      <div className="space-y-0.5 pl-1">{children}</div>
    </div>
  );
}

function NavItem({
  label, badge, icon: Icon, isSelected, onClick, onDelete, extra,
}: {
  label: string;
  badge?: string;
  icon: React.ElementType;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  /** Extra action button(s) rendered before the delete button on hover */
  extra?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      <Icon size={11} className="shrink-0 opacity-70" />
      <span className="flex-1 text-[10px] font-semibold truncate">{label}</span>
      {badge && (
        <span className="text-[8px] font-bold uppercase tracking-wide opacity-50 shrink-0">{badge}</span>
      )}
      {/* Quick-action slot — visible on hover */}
      {extra}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive transition-all"
        title="Eliminar"
      >
        <Trash2 size={9} />
      </button>
    </div>
  );
}

function InfraCanvas({ config, setConfig }: { config: any; setConfig: (patch: any) => void }) {
  const [tab, setTab] = useState<'silo' | 'deploy'>('silo');
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex gap-1 p-3 border-b bg-muted/10 shrink-0">
        {(['silo', 'deploy'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors',
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {t === 'silo' ? 'Silo' : 'Deploy'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
        {tab === 'silo' && <SystemSection config={config} setConfig={setConfig} />}
        {tab === 'deploy' && <DeploySection />}
      </div>
    </div>
  );
}

