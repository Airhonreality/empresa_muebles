Plan de Implementación: Rail + Plugin de Integraciones
Inventario de cambios
Archivo	Acción	Riesgo
packages / core / src / integration.ts	NUEVO	Cero — solo tipos
packages / core / src / index.ts	MODIFICAR — re -export integration	Mínimo
packages / core / src / config.ts	MODIFICAR — añadir integrations ? Mínimo — campo opcional
src / integrations / notion / adapter.ts	NUEVO	Cero — standalone
src / integrations / notion / ConfigPanel.tsx	NUEVO	Cero
src / integrations / notion / index.ts	NUEVO	Cero
src / lib / integrations / adapters.server.ts	NUEVO	Cero
src / app / api / admin / integrations / test / route.ts	NUEVO	Cero
src / app / api / admin / integrations / sources / route.ts	NUEVO	Cero
src / app / api / admin / integrations / records / route.ts	NUEVO	Cero
src / components / agnostic / designer / sections / IntegrationsSection.tsx	NUEVO	Cero
src / components / agnostic / plugins / ImportWizard / types.ts	MODIFICAR — extender ParsedSource	Mínimo — campos opcionales
src / components / agnostic / plugins / ImportWizard / ImportWizard.tsx	MODIFICAR — añadir mode prop	Bajo — backward compat
src / components / agnostic / plugins / ImportWizard / stages / SourceStage.tsx	MODIFICAR — tab integración	Medio — toca flujo activo
agnostic.config.ts	MODIFICAR — añadir integrations	Mínimo
AgnosticDesigner.tsx	MODIFICAR — rail + modos nuevos	Alto — flujo principal
Orden de implementación para minimizar regresiones:
B → E → C → D → A → F

Fase B — Contrato de Tipos(packages / core /)
REGLA CLAUDE.md: packages / es solo tipos.Cero implementación aquí.Si sientes la necesidad de añadir lógica: el problema está en cómo llamas la API.

    packages / core / src / integration.ts(NUEVO)

import type React from 'react';

export interface IntegrationMeta {
    id: string;
    name: string;
    description: string;
    icon?: string;
}

export interface IntegrationSource {
    id: string;
    name: string;
    recordCount?: number;
}

export interface IntegrationConfigPanelProps {
    envPresence: Record<string, boolean>;
    onSave: (vars: Record<string, string>) => Promise<void>;
}

export interface IntegrationClientModule {
    meta: IntegrationMeta;
    ConfigPanel: React.ComponentType<IntegrationConfigPanelProps>;
}

export type IntegrationClientLoader = () => Promise<IntegrationClientModule>;
Entropía anticipada: IntegrationConfigPanelProps.onSave recibe un Record<string, string> — la sección de integraciones lo envía a / api / admin / config / save(el mismo endpoint de DeploySection).Nunca a un endpoint de integrations propio: el guardado de credenciales ya está resuelto.

    packages / core / src / index.ts(MODIFICAR)
Añadir al final:


export * from './integration';
packages / core / src / config.ts(MODIFICAR)

import type { IntegrationClientLoader } from './integration';

export interface AgnosticConfig {
    storage?: string
    adminPath?: string
    blocks?: Record<string, BlockLoader>
    features?: { mail?: boolean; pdf?: boolean }
    integrations?: Record<string, IntegrationClientLoader>  // ← AÑADIR
}
Fase E — Notion Adapter(src / integrations / notion /)
Ubicación correcta: src / es la capa de proyecto.packages / jamás se toca.

    src / integrations / notion / adapter.ts(NUEVO)

import type { IntegrationSource } from '@agnostic/core';

const NOTION_VERSION = '2022-06-28';
const MAX_RECORDS = 5000;

export class NotionAdapter {
    private token: string;

    constructor(credentials: Record<string, string>) {
        this.token = credentials.NOTION_TOKEN ?? '';
    }

    private async fetch(path: string, options: RequestInit = {}) {
        const res = await globalThis.fetch(`https://api.notion.com/v1${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Notion-Version': NOTION_VERSION,
                'Content-Type': 'application/json',
                ...(options.headers ?? {}),
            },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? `Notion API error ${res.status}`);
        }
        return res.json();
    }

    async testConnection(): Promise<{ ok: boolean; message?: string }> {
        try {
            await this.fetch('/users/me');
            return { ok: true };
        } catch (e: any) {
            return { ok: false, message: e.message };
        }
    }

    async listSources(): Promise<IntegrationSource[]> {
        const data = await this.fetch('/search', {
            method: 'POST',
            body: JSON.stringify({
                filter: { value: 'database', property: 'object' },
                page_size: 100,
            }),
        });
        return (data.results ?? []).map((db: any) => ({
            id: db.id,
            name: db.title?.[0]?.plain_text ?? db.id,
        }));
    }

    async getRecords(databaseId: string): Promise<Array<Record<string, string>>> {
        const records: Array<Record<string, string>> = [];
        let cursor: string | undefined;

        while (records.length < MAX_RECORDS) {
            const body: Record<string, unknown> = { page_size: 100 };
            if (cursor) body.start_cursor = cursor;

            const data = await this.fetch(`/databases/${databaseId}/query`, {
                method: 'POST',
                body: JSON.stringify(body),
            });

            for (const page of data.results ?? []) {
                records.push(this.flattenPage(page));
            }

            if (!data.has_more) break;
            cursor = data.next_cursor;
        }

        return records;
    }

    private flattenPage(page: any): Record<string, string> {
        const out: Record<string, string> = { _notion_id: page.id };
        for (const [key, prop] of Object.entries<any>(page.properties ?? {})) {
            out[key] = this.flattenProperty(prop);
        }
        return out;
    }

    private flattenProperty(prop: any): string {
        switch (prop.type) {
            case 'title': return prop.title?.map((t: any) => t.plain_text).join('') ?? '';
            case 'rich_text': return prop.rich_text?.map((t: any) => t.plain_text).join('') ?? '';
            case 'number': return String(prop.number ?? '');
            case 'select': return prop.select?.name ?? '';
            case 'multi_select': return (prop.multi_select ?? []).map((o: any) => o.name).join(', ');
            case 'date': return prop.date?.start ?? '';
            case 'checkbox': return String(prop.checkbox ?? false);
            case 'url': return prop.url ?? '';
            case 'email': return prop.email ?? '';
            case 'phone_number': return prop.phone_number ?? '';
            case 'formula': return String(prop.formula?.string ?? prop.formula?.number ?? prop.formula?.boolean ?? '');
            case 'people': return (prop.people ?? []).map((p: any) => p.name ?? p.id).join(', ');
            case 'files': return (prop.files ?? []).map((f: any) => f.name).join(', ');
            case 'relation': return (prop.relation ?? []).map((r: any) => r.id).join(', ');
            case 'created_time': return prop.created_time ?? '';
            case 'last_edited_time': return prop.last_edited_time ?? '';
            default: return '';
        }
    }
}
Entropía: globalThis.fetch — Node 18 + (Next.js 15 lo garantiza). Si por alguna razón el entorno no lo tiene, usar undici.La decisión de usar globalThis.fetch elimina cualquier dependencia externa nueva.

    Entropía: MAX_RECORDS = 5000 — las bases de Notion grandes pausan la paginación.Si se alcanza el límite, los registros están truncados silenciosamente.La API de records devuelve metadatos sobre esto.

        src / integrations / notion / ConfigPanel.tsx(NUEVO)

'use client';

import React, { useState } from 'react';
import type { IntegrationConfigPanelProps } from '@agnostic/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ConfigPanel({ envPresence, onSave }: IntegrationConfigPanelProps) {
    const [token, setToken] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleTest = async () => {
        if (!token) return;
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/admin/integrations/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integrationId: 'notion', credentials: { NOTION_TOKEN: token } }),
            });
            setTestResult(await res.json());
        } catch {
            setTestResult({ ok: false, message: 'Error de red' });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!token || !testResult?.ok) return;
        setSaving(true);
        await onSave({ NOTION_TOKEN: token });
        setSaving(false);
        setToken('');
    };

    const hasToken = envPresence['NOTION_TOKEN'];

    return (
        <div className= "space-y-4 max-w-lg" >
        { hasToken && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600" >
                <CheckCircle size={ 14 } /> Token configurado
                    </div>
      )
}
<div className="space-y-1.5" >
    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground" >
        NOTION_TOKEN { hasToken ? '(reemplazar)' : '' }
</label>
    < Input
type = "password"
value = { token }
onChange = { e => { setToken(e.target.value); setTestResult(null); }}
placeholder = "secret_..."
className = "font-mono text-xs h-9"
    />
    </div>
    < div className = "flex gap-2" >
        <Button variant="outline" size = "sm" onClick = { handleTest } disabled = {!token || testing}
className = "text-[10px] font-black uppercase tracking-widest h-9" >
    { testing?<Loader2 size = { 12 } className = "animate-spin mr-1" /> : null}
          Probar Conexión
    </Button>
    < Button size = "sm" onClick = { handleSave } disabled = {!testResult?.ok || saving}
className = "text-[10px] font-black uppercase tracking-widest h-9" >
    { saving?<Loader2 size = { 12 } className = "animate-spin mr-1" /> : null}
          Guardar y Redesplegar
    </Button>
    </div>
{
    testResult && (
        <div className={ `flex items-center gap-2 text-xs font-semibold ${testResult.ok ? 'text-emerald-600' : 'text-destructive'}` }>
            { testResult.ok ? <CheckCircle size={ 13 } /> : <XCircle size={13} / >}
{ testResult.ok ? 'Conexión verificada' : testResult.message }
</div>
      )}
</div>
  );
}
src / integrations / notion / index.ts(NUEVO)

import type { IntegrationClientModule } from '@agnostic/core';
import { ConfigPanel } from './ConfigPanel';

const module: IntegrationClientModule = {
    meta: {
        id: 'notion',
        name: 'Notion',
        description: 'Lee bases de datos de Notion como fuentes de registros.',
        icon: 'N',
    },
    ConfigPanel,
};

export default module;
Fase C — API Routes de Integraciones
src / lib / integrations / adapters.server.ts(NUEVO)

import { NotionAdapter } from '@/integrations/notion/adapter';
import type { IntegrationSource } from '@agnostic/core';

export interface ServerAdapter {
    testConnection(): Promise<{ ok: boolean; message?: string }>;
    listSources?(): Promise<IntegrationSource[]>;
    getRecords?(sourceId: string): Promise<Array<Record<string, string>>>;
}

function getEnvCredentials(id: string): Record<string, string> {
    if (id === 'notion') return { NOTION_TOKEN: process.env.NOTION_TOKEN ?? '' };
    return {};
}

export function getAdapter(id: string, credentials?: Record<string, string>): ServerAdapter | null {
    const creds = credentials ?? getEnvCredentials(id);
    if (id === 'notion') return new NotionAdapter(creds);
    return null;
}
Por qué dos puntos de registro(agnostic.config + adapters.server.ts): el ConfigPanel usa 'use client' y no puede importarse en rutas de API.El adapter es Node.js puro.Separar ambos evita que Next.js intente ejecutar código del browser en el servidor.El acoplamiento es por clave id — añadir una integración nueva requiere tocar ambos archivos, lo cual es explícito y controlado.

    src / app / api / admin / integrations / test / route.ts(NUEVO)

import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const { integrationId, credentials } = body ?? {};

    if (!integrationId || typeof credentials !== 'object') {
        return NextResponse.json({ error: 'integrationId y credentials requeridos' }, { status: 400 });
    }

    const adapter = getAdapter(integrationId, credentials);
    if (!adapter) {
        return NextResponse.json({ error: `Integración desconocida: ${integrationId}` }, { status: 404 });
    }

    const result = await adapter.testConnection().catch((e: any) => ({ ok: false, message: e.message }));
    return NextResponse.json(result);
}
Entropía: credentials viene del cliente con el token en texto plano.Esta ruta solo se llama para validar antes de guardar — el token no se persiste aquí.Misma semántica que / api / admin / health / test que ya existe.

    src / app / api / admin / integrations / sources / route.ts(NUEVO)

import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const adapter = getAdapter(id);  // usa process.env — credenciales ya guardadas
    if (!adapter?.listSources) {
        return NextResponse.json({ error: `Integración ${id} no soporta listSources` }, { status: 404 });
    }

    const sources = await adapter.listSources().catch((e: any) => { throw e; });
    return NextResponse.json({ sources });
}
src / app / api / admin / integrations / records / route.ts(NUEVO)

import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    const sourceId = req.nextUrl.searchParams.get('sourceId');
    if (!id || !sourceId) return NextResponse.json({ error: 'id y sourceId requeridos' }, { status: 400 });

    const adapter = getAdapter(id);
    if (!adapter?.getRecords) {
        return NextResponse.json({ error: `Integración ${id} no soporta getRecords` }, { status: 404 });
    }

    const records = await adapter.getRecords(sourceId).catch((e: any) => { throw e; });
    return NextResponse.json({ records, capped: records.length >= 5000 });
}
Fase D — IntegrationsSection
src / components / agnostic / designer / sections / IntegrationsSection.tsx(NUEVO)

'use client';

import React, { useEffect, useState } from 'react';
import type { IntegrationClientModule } from '@agnostic/core';
import agnosticConfig from '@/../agnostic.config';
import { Button } from '@/components/ui/button';
import { Plug2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function IntegrationsSection({ envPresence }: { envPresence: Record<string, boolean> }) {
    const loaders = agnosticConfig.integrations ?? {};
    const ids = Object.keys(loaders);

    const [selected, setSelected] = useState<string | null>(ids[0] ?? null);
    const [modules, setModules] = useState<Record<string, IntegrationClientModule>>({});
    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!selected || modules[selected]) return;
        setLoading(selected);
        loaders[selected]!()
            .then(mod => setModules(prev => ({ ...prev, [selected]: mod })))
            .catch(() => toast.error(`Error cargando módulo ${selected}`))
            .finally(() => setLoading(null));
    }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = async (vars: Record<string, string>) => {
        const res = await fetch('/api/admin/config/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vars, redeploy: true }),
        });
        if (!res.ok) {
            toast.error('Error guardando variables');
            return;
        }
        toast.success('Variables guardadas. Redeploy iniciado.');
    };

    if (ids.length === 0) {
        return (
            <div className= "flex flex-col items-center justify-center h-full text-center gap-4 p-8" >
            <Plug2 size={ 32 } className = "text-muted-foreground/30" />
                <div className="space-y-1" >
                    <p className="text-xs font-black uppercase tracking-widest" > Sin integraciones registradas </p>
                        < p className = "text-[10px] text-muted-foreground" >
                            Añade integraciones en < code className = "font-mono bg-muted px-1 rounded" > agnostic.config.ts < /code> bajo la clave <code className="font-mono bg-muted px-1 rounded">integrations</code >.
          </p>
                                </div>
                                </div>
    );
    }

    const activeMod = selected ? modules[selected] : null;
    const Panel = activeMod?.ConfigPanel ?? null;

    return (
        <div className= "h-full flex overflow-hidden" >
        {/* Sidebar de integraciones */ }
        < aside className = "w-48 border-r flex flex-col gap-1 p-2 shrink-0" >
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 py-1" > Integraciones </p>
    {
        ids.map(id => (
            <button key= { id } onClick = {() => setSelected(id)}
    className = {`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${selected === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`
}>
    { loaders[id]? id : id }
    </button>
        ))}
</aside>

{/* Panel de configuración */ }
<div className="flex-1 overflow-y-auto p-8" >
    { loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground" >
            <Loader2 size={ 14 } className = "animate-spin" /> Cargando módulo...
</div>
        )}
{
    activeMod && !loading && (
        <div className="space-y-4" >
            <div className="space-y-1 border-b pb-4" >
                <h2 className="text-sm font-black uppercase tracking-widest" > { activeMod.meta.name } </h2>
                    < p className = "text-[10px] text-muted-foreground" > { activeMod.meta.description } </p>
                        </div>
    { Panel && <Panel envPresence={ envPresence } onSave = { handleSave } />}
    </div>
        )
}
</div>
    </div>
  );
}
Entropía anticipada:

agnosticConfig.integrations ?? {} — el ?? es obligatorio.Si alguien no declara integrations en su agnostic.config.ts, no hay crash.
El loader se llama una sola vez por ID(guarda en modules).Si el loader falla, el error va a toast y no rompe otros módulos.
selected se inicializa con ids[0] — si hay integraciones, se abre la primera por defecto.Si el usuario no tiene NOTION_TOKEN configurado, el ConfigPanel lo indica visualmente(no un crash).
Fase A — Rail Redesign
AgnosticDesigner.tsx(MODIFICAR)
Cambio 1 — Imports(línea 6 - 7):

Añadir a los imports de lucide - react: Upload, Plug2


import {
    Route as RouteIcon, FileJson, Zap, Shield, RotateCcw, Box, Plus, Trash2,
    Sparkles, Layout, Database, Settings2, ChevronsUpDown, Check,
    Users, Info, ExternalLink, Table2, Upload, Plug2    // ← Plug2, Upload añadidos
} from 'lucide-react';
Añadir import de IntegrationsSection (línea ~26):


import { IntegrationsSection } from './sections/IntegrationsSection';
Cambio 2 — ActiveMode type(línea 128):


// ANTES:
type ActiveMode = 'dna' | 'users' | 'silo' | 'deploy' | 'docs';

// DESPUÉS:
type ActiveMode = 'dna' | 'users' | 'import' | 'integrations' | 'infra' | 'docs';
Cambio 3 — Eliminar estado showImport(línea 149):


// ELIMINAR:
const [showImport, setShowImport] = useState(false);
Cambio 4 — Estado de envPresence para IntegrationsSection:

Añadir junto a los estados del wizard(línea ~136):


const [envPresence, setEnvPresence] = useState<Record<string, boolean>>({});
Modificar el useEffect del health fetch para también guardar envPresence:


useEffect(() => {
    fetch('/api/admin/health')
        .then(r => r.json())
        .then((h: WizardHealth & { activeDataStrategy?: string }) => {
            setEnvPresence(h.env_presence ?? {});          // ← AÑADIR
            const hasVercel = h.env_presence.VERCEL_ACCESS_TOKEN && h.env_presence.VERCEL_PROJECT_ID;
            const hasData = h.env_presence.DATABASE_URL || h.env_presence.GITHUB_REPO || h.env_presence.SUPABASE_URL;
            if ((h.isVercel && !hasVercel) || !hasData) setWizardHealth(h);
        })
        .catch(() => { });
}, []); // eslint-disable-line react-hooks/exhaustive-deps
Cambio 5 — RAIL(líneas 284 - 290):


// ANTES — un array plano:
const RAIL = [
    { id: 'dna' as const, icon: FileJson, label: 'DNA & Rutas' },
    { id: 'users' as const, icon: Users, label: 'Gestión de Acceso' },
    { id: 'silo' as const, icon: Shield, label: 'Config del Silo' },
    { id: 'deploy' as const, icon: Zap, label: 'Estado del Deploy' },
    { id: 'docs' as const, icon: Info, label: 'Guías & Ayuda' },
];

// DESPUÉS — dos grupos con separador visual:
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
Cambio 6 — JSX del rail(líneas 308 - 325):


<aside className="w-14 border-r flex flex-col items-center pt-4 pb-5 bg-muted/15 shrink-0 gap-1" >
    <div className="mb-4" > <Shield size={ 18 } className = "text-primary animate-pulse" /> </div>
{
    RAIL_TOP.map(({ id, icon: Icon, label }) => (
        <button key= { id } onClick = {() => setActiveMode(id)} title = { label }
className = {
    cn('w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
        activeMode === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}>
    <Icon size={ 16 } />
        </button>
  ))}
{/* Separador visual */ }
<div className="w-6 h-px bg-border/40 my-1" />
{
    RAIL_BOTTOM.map(({ id, icon: Icon, label }) => (
        <button key= { id } onClick = {() => setActiveMode(id)} title = { label }
className = {
    cn('w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
        activeMode === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}>
    <Icon size={ 16 } />
        </button>
  ))}
<div className="mt-auto" >
    <button onClick={ handleRefresh } title = "Sincronizar Estado"
className = "w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" >
    <RotateCcw size={ 14 } />
        </button>
        </div>
        </aside>
Cambio 7 — Eliminar botón trigger invisible(líneas 332 - 336):


// ELIMINAR COMPLETAMENTE este botón:
<button onClick={ () => setShowImport(true) } title = "Importar estructura externa (Wizard)"
className = "w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors" >
    <Database size={ 12 } />
        </button>
La cabecera de la sección DNA queda solo con el label, sin el botón.

    Cambio 8 — Canvas: nuevos modos(líneas 451 - 467):


{ activeMode === 'users' && <UserManager /> }
{
    activeMode === 'import' && (
        <ImportWizard mode="panel" open = { true} onClose = {() => setActiveMode('dna')
} />
)}
{
    activeMode === 'integrations' && (
        <IntegrationsSection envPresence={ envPresence } />
)
}
{ activeMode === 'infra' && <InfraCanvas config={ config } setConfig = { handleUpdateConfig } />}
{
    activeMode === 'docs' && (
        <div className="h-full overflow-y-auto p-8 max-w-4xl" >
            <DocsSection />
            </div>
)
}
// ELIMINAR: los bloques 'silo' y 'deploy' separados
Cambio 9 — InfraCanvas(función privada dentro del archivo):


function InfraCanvas({ config, setConfig }: { config: any; setConfig: (patch: any) => void }) {
    const [tab, setTab] = useState<'silo' | 'deploy'>('silo');
    return (
        <div className= "h-full flex flex-col overflow-hidden" >
        <div className="flex gap-1 p-3 border-b bg-muted/10 shrink-0" >
            {(['silo', 'deploy'] as const).map(t => (
                <button key= { t } onClick = {() => setTab(t)}
className = {
    cn('px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors',
        tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}>
    { t === 'silo' ? 'Silo' : 'Deploy'}
</button>
        ))}
</div>
    < div className = "flex-1 overflow-y-auto p-8 max-w-2xl" >
        { tab === 'silo' && <SystemSection config={ config } setConfig = { setConfig } />}
{ tab === 'deploy' && <DeploySection /> }
</div>
    </div>
  );
}
Cambio 10 — Eliminar el Dialog de ImportWizard al final(línea 490):


// ELIMINAR:
<ImportWizard open={ showImport } onClose = {() => setShowImport(false)} />
Fase F — ExtendedSourceStage
src / components / agnostic / plugins / ImportWizard / types.ts(MODIFICAR)
Extender ParsedSource con campos opcionales:


export interface ParsedSource {
    filename: string;
    headers: string[];
    rows: Record<string, string>[];
    rowCount: number;
    delimiter?: ';' | ',' | '\t';
    // Metadata de origen de integración (opcional)
    sourceType?: 'file' | 'integration';
    integrationId?: string;
    integrationSourceId?: string;
    displayName?: string;
}
Los campos nuevos son todos opcionales — el flujo de archivo existente no se toca.

    src / components / agnostic / plugins / ImportWizard / ImportWizard.tsx(MODIFICAR)

interface ImportWizardProps {
    open: boolean;
    onClose: () => void;
    mode?: 'dialog' | 'panel';  // default: 'dialog'
}

export function ImportWizard({ open, onClose, mode = 'dialog' }: ImportWizardProps) {
    // ... estados sin cambio ...

    const content = (
        <>
        <ImportWizardHeader stage= { stage } />
        <div className="flex-1 overflow-y-auto p-8 bg-muted/5" >
            {/* ... stages sin cambio ... */ }
            </div>
            </>
  );

    if (mode === 'panel') {
        return (
            <div className= "h-full flex flex-col bg-background overflow-hidden" >
            { content }
            </div>
    );
    }

    return (
        <Dialog open= { open } onOpenChange = {(isOpen) => !isOpen && onClose()
}>
    <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 rounded-3xl overflow-hidden border border-border bg-background shadow-2xl" >
        <DialogTitle className="sr-only" > Asistente de Importacion de Catalogo </DialogTitle>
{ content }
</DialogContent>
    </Dialog>
  );
}
Entropía: El Dialog provee aria - modal y focus trapping.En modo panel, estas garantías de accesibilidad se pierden.Para el MVP esto es aceptable dado que el modo panel vive dentro del designer(ya es un contexto modal por contexto visual).No añadir aria - modal artificial — sería mentir al árbol de accesibilidad.

    src / components / agnostic / plugins / ImportWizard / stages / SourceStage.tsx(MODIFICAR)
El cambio es aditivo — se añade un tab switcher antes de la zona de upload.El flujo de archivo existente no se modifica.


'use client';

import React, { useRef, useState, useEffect } from 'react';
// Añadir imports:
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, Plug2, Loader2 } from 'lucide-react';
import type { IntegrationSource } from '@agnostic/core';
import agnosticConfig from '@/../agnostic.config';

// En SourceStage, antes del return:
const integrationIds = Object.keys(agnosticConfig.integrations ?? {});

const [sourceType, setSourceType] = useState<'file' | 'integration'>(
    integrationIds.length > 0 ? 'file' : 'file'  // siempre empieza en 'file'
);
const [integrationId, setIntegrationId] = useState(integrationIds[0] ?? '');
const [integrationSources, setIntegrationSources] = useState<IntegrationSource[]>([]);
const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
const [intLoading, setIntLoading] = useState(false);
const [intError, setIntError] = useState<string | null>(null);
Fetch de sources al cambiar integrationId:


useEffect(() => {
    if (sourceType !== 'integration' || !integrationId) return;
    setIntLoading(true);
    setIntError(null);
    setIntegrationSources([]);
    setSelectedSourceId(null);
    fetch(`/api/admin/integrations/sources?id=${integrationId}`)
        .then(r => r.json())
        .then(d => setIntegrationSources(d.sources ?? []))
        .catch(() => setIntError('Error conectando con la integración'))
        .finally(() => setIntLoading(false));
}, [integrationId, sourceType]);
Cargar registros de la fuente seleccionada:


const handleLoadIntegration = async () => {
    if (!integrationId || !selectedSourceId) return;
    setLoading(true);
    setError(null);
    try {
        const res = await fetch(`/api/admin/integrations/records?id=${integrationId}&sourceId=${selectedSourceId}`);
        const { records, capped } = await res.json();
        if (!records?.length) throw new Error('La fuente no devolvió registros.');
        const headers = Object.keys(records[0]);
        if (!headers.length) throw new Error('La fuente no tiene columnas detectables.');
        const rows: Record<string, string>[] = records.map((r: Record<string, unknown>) => {
            const out: Record<string, string> = {};
            for (const h of headers) {
                const v = r[h];
                out[h] = typeof v === 'object' ? JSON.stringify(v ?? null) : String(v ?? '');
            }
            return out;
        });
        const selectedSource = integrationSources.find(s => s.id === selectedSourceId);
        setSource({
            filename: selectedSource?.name ?? selectedSourceId,
            headers,
            rows,
            rowCount: rows.length,
            sourceType: 'integration',
            integrationId,
            integrationSourceId: selectedSourceId,
            displayName: selectedSource?.name,
        });
        if (capped) setError(`Advertencia: la fuente tiene más de 5.000 registros. Se cargaron los primeros 5.000.`);
    } catch (e: any) {
        setError(e.message);
        setSource(null);
    } finally {
        setLoading(false);
    }
};
JSX del tab switcher — se inserta antes de la zona de upload:


{
    integrationIds.length > 0 && (
        <div className="flex gap-1 border rounded-xl p-1 bg-muted/20 w-fit" >
            {(['file', 'integration'] as const).map(t => (
                <button key= { t } onClick = {() => { setSourceType(t); setSource(null); setError(null); }}
className = {
    cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors',
        sourceType === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}>
    { t === 'file' ? 'Archivo' : 'Integración'}
</button>
    ))}
</div>
)}
Cuando sourceType === 'integration', reemplazar la zona de upload con el panel de integración:


{
    sourceType === 'integration' && integrationIds.length > 0 && (
        <div className="space-y-4 border rounded-2xl p-6" >
            {/* Selector de integración */ }
            < div className = "space-y-1.5" >
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground" > Integración </label>
                    < select value = { integrationId } onChange = { e => setIntegrationId(e.target.value) }
    className = "w-full h-9 px-3 border rounded-lg text-xs font-semibold bg-background" >
        { integrationIds.map(id => <option key={ id } value = { id } > { id } </option>) }
        </select>
        </div>
    {/* Lista de fuentes */ }
    { intLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground" > <Loader2 size={ 12 } className = "animate-spin" /> Obteniendo fuentes...</div> }
    { intError && <p className="text-xs text-destructive" > { intError } </p> }
    {
        !intLoading && integrationSources.length > 0 && (
            <div className="space-y-1.5" >
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground" > Base de datos / Tabla </label>
                    < select value = { selectedSourceId ?? ''
    } onChange = { e => { setSelectedSourceId(e.target.value); setSource(null); }
}
className = "w-full h-9 px-3 border rounded-lg text-xs font-semibold bg-background" >
    <option value="" > Seleccionar...</option>
{ integrationSources.map(s => <option key={ s.id } value = { s.id } > { s.name } </option>) }
</select>
    </div>
    )}
{
    selectedSourceId && !source && (
        <Button onClick={ handleLoadIntegration } disabled = { loading } size = "sm"
    className = "text-[10px] font-black uppercase tracking-widest h-9 gap-2" >
        { loading?<Loader2 size = { 12 } className = "animate-spin" /> : <Plug2 size={ 12 } />
}
        Cargar Registros
    </Button>
    )}
</div>
)}
Fase G — Registro en agnostic.config.ts(MODIFICAR)

import { defineConfig } from './packages/core/src/config';

export default defineConfig({
    storage: './storage',
    adminPath: '/_agnostic',
    blocks: {},
    features: { pdf: true, mail: false },
    integrations: {
        notion: () => import('./src/integrations/notion').then(m => m.default),
    },
});
Entropía: El.then(m => m.default) asegura que el loader devuelva el IntegrationClientModule directamente, no { default: module }. Si se usa dynamic import ESM estándar, el módulo puede llegar como { default: ... }.El.then lo normaliza.

Mapa de entropía consolidado
Riesgo	Síntoma	Mitigación
'use client' en NotionAdapter importado desde API route	Build error de Next.js	Separar adapter.ts(server) de ConfigPanel.tsx(client).API routes solo importan adapters.server.ts
Notion pagina 10k + registros	SourceStage congela el browser	MAX_RECORDS = 5000 en adapter + flag capped: true en response
agnosticConfig.integrations undefined	Crash en IntegrationsSection y SourceStage ?? {} en todos los accesos
silo y deploy como ActiveMode ya no existen	TypeScript error en cualquier código que usara setActiveMode('silo')	Buscar con grep antes de hacer el cambio.Grep: setActiveMode('silo') y setActiveMode('deploy')
Botón invisible de ImportWizard sigue presente	Dos formas de abrir ImportWizard en modo inconsistente	Eliminar líneas 332 - 336 explícitamente en la PR
headers = [] si Notion devuelve registros vacíos	Error silencioso en MappingStage	Guard explícito: if (!headers.length) throw new Error(...)
NOTION_TOKEN en el cliente	Fuga de credencial	ConfigPanel nunca llama / api / admin / integrations / sources con el token — eso lo hace el usuario ya autenticado en el panel.El token solo viaja en POST / integrations / test durante la validación inicial
InfraCanvas resetea su tab al cambiar a otro modo y volver	El usuario esperaría recordar el último sub - tab	Aceptable para MVP.Si molesta: mover infra_tab a estado en ConfigManager
Check de anti - patrones CLAUDE.md
✅ Cero camelCase en data layer — las variables de env se guardan como están(NOTION_TOKEN, DATABASE_URL)
✅ Cero lógica de negocio en packages / — solo tipos en integration.ts
✅ IDs con crypto.randomUUID() — ningún ID generado en este plan usa Math.random() o Date.now()
✅ Sin modificar getStrategy.ts, AgnosticRenderer.tsx, indra.ts
✅ adapters.server.ts es capa de proyecto(src / lib /) — no engine
✅ NotionAdapter.fetch() usa globalThis.fetch — sin dependencias externas nuevas
✅ Los registros de Notion llegan como Record<string, string> — la coerción de tipos no - string es explícita con JSON.stringify