'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import { useDNAStore, useMateriaStore } from '@/lib/agnostic/store';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Bot, X, Send, Settings, Terminal, Loader2, Check, Wifi, RefreshCw, XCircle } from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────

// Modelos que NO soportan tool calling — el servidor los reemplaza automáticamente
const FIM_MODEL_PATTERNS = ['codestral', 'embed', 'moderation'];
function isFimModel(model: string) {
  return FIM_MODEL_PATTERNS.some(p => model.toLowerCase().includes(p));
}

const PROVIDERS = [
  { value: 'mistral',   label: 'Mistral' },
  { value: 'openai',    label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini',    label: 'Google Gemini' },
  { value: 'ollama',    label: 'Ollama (local)' },
];

// Fallback estático solo para cuando el proveedor no tiene api_key aún
const FALLBACK_MODELS: Record<string, { value: string; label: string }[]> = {
  mistral:   [{ value: 'mistral-large-latest', label: 'Mistral Large (fallback)' }],
  openai:    [{ value: 'gpt-4o-mini',          label: 'GPT-4o Mini (fallback)' }],
  anthropic: [{ value: 'claude-sonnet-4-6',    label: 'Claude Sonnet 4.6 (fallback)' }],
  gemini:    [{ value: 'gemini-2.0-flash',     label: 'Gemini 2.0 Flash (fallback)' }],
  ollama:    [{ value: 'llama3.1',             label: 'Llama 3.1 (fallback)' }],
};

const DEFAULT_MANIFEST = JSON.stringify({
  golden_rules: [
    "snake_case para todos los field keys. Nunca camelCase.",
    "block.context debe coincidir exactamente con schema.data.name.",
    "Siempre ejecutar 'commit --force' para aplicar cambios pendientes.",
    "Verificar con 'ls' antes de crear para evitar duplicados.",
    "Crear schema antes de agregar bloques que lo referencian."
  ],
  field_types: ["text","number","select","relation","boolean","date","textarea","image","password","markdown"],
  block_types: ["collection","form","table","action","nav","embed","text","hero","divider","spacer","markdown"],
  position_values: ["flow","fixed-top","fixed-bottom","sticky-top"],
  command_chains: {
    nueva_entidad_con_pagina: [
      "create-schema <name> field:<key>:<type>:<label> ...",
      "commit --force",
      "create-route /<path> <Titulo>",
      "add-block /<path> collection schema:<name>",
      "add-block /<path> form schema:<name> intent:create",
      "commit --force"
    ],
    campo_relacion: [
      "add-field <schema> <key> relation label:<Label> entity:<target_schema>",
      "commit --force"
    ],
    campo_select: [
      "add-field <schema> <key> select label:<Label> options:<a,b,c>",
      "commit --force"
    ],
    nav_data_driven: [
      "create-schema nav_links field:label:text field:path:text field:icon:text field:orden:number field:grupo:text",
      "commit --force",
      "add-block /<route> nav schema:nav_links",
      "update-block /<route> <blockId> position sticky-top",
      "update-block /<route> <blockId> grupo main",
      "commit --force"
    ],
    bloque_reutilizable: [
      "create-route /shared/<name> <Titulo>",
      "add-block /shared/<name> <type> schema:<entity>",
      "commit --force",
      "add-block /<host-route> embed context:/shared/<name>",
      "commit --force"
    ]
  },
  common_mistakes: [
    "camelCase en keys: mal 'nombreCliente', bien 'nombre_cliente'.",
    "Crear records antes de que exista el schema.",
    "Context del bloque que no coincide exactamente con el nombre del schema.",
    "Olvidar 'commit --force' después de encolar cambios.",
    "Usar 'set' para crear campos nuevos — usa 'add-field' para eso."
  ]
}, null, 2);

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AiConfig {
  id?: string;
  provider: string;
  model: string;
  api_key: string;
  custom_rules?: string;
  manifest?: string;
}

type SettingsTab = 'conexion' | 'reglas' | 'manifest';

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MdCode({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const isAgno = lang === 'agno';
  return (
    <div className={cn('my-2 rounded-md overflow-hidden border', isAgno ? 'border-primary/30 bg-primary/5' : 'border-border/30 bg-muted/40')}>
      {isAgno && (
        <div className="flex items-center justify-between px-3 py-1 bg-primary/10 border-b border-primary/20">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary">
            <Terminal size={9} /> agno
          </span>
          <button
            onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="text-[9px] text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
          >
            {copied ? <><Check size={9} /> copiado</> : 'copiar'}
          </button>
        </div>
      )}
      <pre className={cn('px-3 py-2 text-[11px] font-mono overflow-x-auto leading-relaxed', isAgno ? 'text-primary/90' : 'text-foreground/80')}>{code}</pre>
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        h1: ({ children }) => <h1 className="font-black text-sm mb-1 mt-2 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="font-black text-[13px] mb-1 mt-2 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="font-bold text-[12px] mb-0.5 mt-1.5 first:mt-0">{children}</h3>,
        ul: ({ children }) => <ul className="ml-3 mb-1.5 space-y-0.5 list-disc list-outside">{children}</ul>,
        ol: ({ children }) => <ol className="ml-3 mb-1.5 space-y-0.5 list-decimal list-outside">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ children, className }) => {
          const lang = (className ?? '').replace('language-', '');
          if (lang) return <MdCode lang={lang} code={String(children).trimEnd()} />;
          return <code className="px-1 py-0.5 rounded bg-muted/70 font-mono text-[10px] text-primary">{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
        hr: () => <hr className="my-2 border-border/30" />,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/30 pl-2 my-1.5 text-muted-foreground italic">{children}</blockquote>,
        a: ({ children, href }) => <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────

type ConnStatus = 'idle' | 'testing' | 'ok' | 'error';

function SettingsPanel() {
  const [tab, setTab] = useState<SettingsTab>('conexion');
  const [config, setConfig] = useState<AiConfig>({
    provider: 'mistral', model: '', api_key: '',
    custom_rules: '', manifest: DEFAULT_MANIFEST,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [manifestError, setManifestError] = useState('');
  const [models, setModels] = useState<{ value: string; label: string }[]>([]);
  const [connStatus, setConnStatus] = useState<ConnStatus>('idle');
  const [connMsg, setConnMsg] = useState('');

  // Carga config guardada al abrir el panel
  // Si hay api_key + model guardados → marca como "ok" directamente (el chat ya funciona)
  useEffect(() => {
    fetch('/api/vault?namespace=ai_config')
      .then(r => r.json())
      .then((res: any) => {
        const records: any[] = res.records ?? [];
        const active = records.find(r => r.data?.active) ?? records[0];
        if (active) {
          const loaded = {
            id:           active.id,
            provider:     active.data.provider    ?? 'mistral',
            model:        active.data.model       ?? '',
            api_key:      active.data.api_key     ?? '',
            custom_rules: active.data.custom_rules ?? '',
            manifest:     active.data.manifest     ?? DEFAULT_MANIFEST,
          };
          setConfig(loaded);
          if (loaded.api_key && loaded.model) {
            setConnStatus('ok');
            setConnMsg(`Usando ${loaded.model}`);
            // Inyectar modelo guardado en la lista para que el select lo muestre
            setModels([{ value: loaded.model, label: loaded.model }]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Llama POST /api/models con la key actual del form (no del vault)
  const handleConnect = async () => {
    if (!config.api_key && config.provider !== 'ollama') {
      setConnStatus('error');
      setConnMsg('Ingresa una API key primero');
      return;
    }
    setConnStatus('testing');
    setConnMsg('');
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider:   config.provider,
          api_key:    config.api_key,
          ollama_url: (config as any).ollama_url,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setConnStatus('error');
        setConnMsg(json.error ?? `Error ${res.status}`);
        setModels([]);
      } else {
        setModels(json.models ?? []);
        setConnStatus('ok');
        setConnMsg(`${json.count ?? json.models?.length ?? 0} modelos disponibles`);
        // Auto-seleccionar el primero si no hay modelo guardado aún
        if (!config.model && json.models?.length) {
          setConfig(c => ({ ...c, model: json.models[0].value }));
        }
      }
    } catch (e: any) {
      setConnStatus('error');
      setConnMsg(e.message ?? 'Error de red');
      setModels([]);
    }
  };

  const handleSave = async () => {
    if (tab === 'manifest') {
      try { JSON.parse(config.manifest ?? ''); setManifestError(''); }
      catch { setManifestError('JSON inválido'); return; }
    }
    setSaving(true);
    try {
      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'ai_config',
          record: { ...(config.id ? { id: config.id } : {}), data: { ...config, active: true } },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const tabClass = (t: SettingsTab) => cn(
    'px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-colors',
    tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
  );

  return (
    <div className="border-b border-border/40 bg-muted/10">
      <div className="flex gap-1 px-3 pt-3 pb-2">
        <button className={tabClass('conexion')}  onClick={() => setTab('conexion')}>Conexión</button>
        <button className={tabClass('reglas')}    onClick={() => setTab('reglas')}>Reglas</button>
        <button className={tabClass('manifest')}  onClick={() => setTab('manifest')}>Manifest</button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* TAB: Conexión */}
        {tab === 'conexion' && (
          <>
            {/* Proveedor */}
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Proveedor</label>
              <select
                value={config.provider}
                onChange={e => {
                  setConfig(c => ({ ...c, provider: e.target.value, model: '' }));
                  setConnStatus('idle');
                  setModels([]);
                }}
                className="w-full h-8 rounded-md border border-border/40 bg-background px-2 text-xs font-medium"
              >
                {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* API Key */}
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">API Key</label>
              <Input
                type="password"
                value={config.api_key}
                onChange={e => {
                  setConfig(c => ({ ...c, api_key: e.target.value }));
                  if (connStatus !== 'idle') { setConnStatus('idle'); setModels([]); }
                }}
                placeholder="sk-..."
                autoComplete="new-password"
                className="h-8 text-xs font-mono border-border/40 bg-background"
              />
            </div>

            {/* Botón Conectar + estado */}
            <div className="space-y-1.5">
              <button
                onClick={handleConnect}
                disabled={connStatus === 'testing'}
                className={cn(
                  'w-full h-8 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border',
                  connStatus === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
                    : connStatus === 'error'
                    ? 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20'
                    : 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10'
                )}
              >
                {connStatus === 'testing' ? (
                  <><Loader2 size={11} className="animate-spin" /> Conectando…</>
                ) : connStatus === 'ok' ? (
                  <><RefreshCw size={11} /> Ver todos los modelos</>
                ) : connStatus === 'error' ? (
                  <><XCircle size={11} /> Reintentar</>
                ) : (
                  <><RefreshCw size={11} /> Conectar y cargar modelos</>
                )}
              </button>

              {/* Mensaje de estado */}
              {connMsg && (
                <p className={cn(
                  'text-[9px] font-mono px-1',
                  connStatus === 'ok' ? 'text-emerald-600' : 'text-destructive'
                )}>
                  {connStatus === 'ok' ? '✓ ' : '✗ '}{connMsg}
                </p>
              )}
            </div>

            {/* Selector de modelo — solo visible si hay modelos cargados */}
            {models.length > 0 && (
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                  Modelo <span className="text-primary/50 normal-case font-normal">({models.length})</span>
                </label>
                <select
                  value={config.model}
                  onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}
                  className="w-full h-8 rounded-md border border-border/40 bg-background px-2 text-xs font-medium"
                >
                  {models.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {isFimModel(config.model) && (
                  <p className="text-[9px] text-amber-600 font-mono px-1">
                    ⚠ Este modelo es FIM (code completion) y no soporta tool calling. El servidor usará mistral-large-latest automáticamente.
                  </p>
                )}
              </div>
            )}

            {/* Modelo manual cuando no hay lista (sin conexión aún) */}
            {models.length === 0 && config.model && (
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Modelo actual (guardado)</label>
                <Input
                  value={config.model}
                  onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}
                  className="h-8 text-xs font-mono border-border/40 bg-background"
                />
                {isFimModel(config.model) && (
                  <p className="text-[9px] text-amber-600 font-mono px-1">
                    ⚠ FIM model — sin tool calling. Se usará mistral-large-latest.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* TAB: Reglas */}
        {tab === 'reglas' && (
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              Reglas del negocio
            </label>
            <Textarea
              value={config.custom_rules ?? ''}
              onChange={e => setConfig(c => ({ ...c, custom_rules: e.target.value }))}
              placeholder={`Ejemplos:\n- Responde siempre en español\n- El negocio se llama X\n- Los precios van en COP\n- Los schemas de cliente usan el prefijo cli_`}
              className="min-h-[140px] text-xs font-mono border-border/40 bg-background resize-none leading-relaxed"
            />
            <p className="text-[9px] text-muted-foreground/60">
              Lenguaje natural. Se inyecta en el system prompt de cada mensaje.
            </p>
          </div>
        )}

        {/* TAB: Manifest */}
        {tab === 'manifest' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                Manifest técnico (JSON)
              </label>
              <button
                onClick={() => setConfig(c => ({ ...c, manifest: DEFAULT_MANIFEST }))}
                className="text-[8px] text-primary/60 hover:text-primary transition-colors"
              >
                restaurar default
              </button>
            </div>
            <Textarea
              value={config.manifest ?? DEFAULT_MANIFEST}
              onChange={e => { setConfig(c => ({ ...c, manifest: e.target.value })); setManifestError(''); }}
              className="min-h-[160px] text-[10px] font-mono border-border/40 bg-background resize-none leading-relaxed"
              spellCheck={false}
            />
            {manifestError && (
              <p className="text-[9px] text-destructive font-mono">{manifestError}</p>
            )}
            <div className="rounded-md border border-border/30 bg-muted/20 px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                <Wifi size={8} className="inline mr-1" />
                Estado del sistema — inyectado automáticamente
              </p>
              <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
                Schemas y rutas actuales se generan en tiempo real antes de cada mensaje. No necesitas escribirlos aquí.
              </p>
            </div>
          </div>
        )}

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="w-full h-7 text-[10px] font-black uppercase tracking-widest"
        >
          {saving ? <Loader2 size={12} className="animate-spin" />
            : saved  ? <><Check size={12} /> Guardado</>
            : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
}

// ── Tool call pill (AI SDK v6: part.type = 'tool-{name}', state = 'input-*'/'output-*') ──

function ToolPill({ part }: { part: any }) {
  // v6: toolName lives in part.toolName (dynamic) or derived from part.type
  const toolName: string = part.toolName ?? part.type.replace(/^tool-/, '');
  const state: string = part.state ?? '';
  const isPending = state === 'input-streaming' || state === 'input-available';
  const isError = state === 'output-error';

  // v6: args → input, result → output
  const input = part.input ?? part.args ?? {};
  const output = part.output ?? part.result;

  const label = toolName === 'observe' ? 'observe'
    : toolName === 'execute_agno'      ? (input?.command ?? 'execute_agno')
    : toolName;

  const ok = !isError && (output == null || output?.ok !== false);

  const summary = isError
    ? (part.errorText ?? 'error')
    : (!isPending && output != null)
      ? toolName === 'observe'
        ? `${output.schemas?.length ?? 0} schemas · ${output.routes?.length ?? 0} rutas`
        : output.ok
          ? (output.action ?? 'ok')
          : output.error
      : null;

  return (
    <div className={cn(
      'flex items-start gap-1.5 px-2 py-1 rounded-md border text-[10px] font-mono my-0.5',
      isPending ? 'border-primary/20 bg-primary/5 text-primary/70'
        : ok    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700'
        :          'border-destructive/20 bg-destructive/5 text-destructive'
    )}>
      {isPending
        ? <Loader2 size={9} className="animate-spin shrink-0 mt-0.5" />
        : ok ? <Check size={9} className="shrink-0 mt-0.5" />
             : <XCircle size={9} className="shrink-0 mt-0.5" />
      }
      <span className="truncate">
        {label}
        {summary && <span className="opacity-60 ml-1">→ {summary}</span>}
      </span>
    </div>
  );
}

// ── Mensaje ───────────────────────────────────────────────────────────────────

function Message({ message }: { message: any }) {
  const isUser = message.role === 'user';
  const parts: any[] = message.parts ?? [];

  if (isUser) {
    const text = parts.find((p: any) => p.type === 'text')?.text ?? '';
    return (
      <div className="flex gap-2 text-xs justify-end">
        <div className="max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed bg-primary text-primary-foreground rounded-tr-none">
          {text}
        </div>
      </div>
    );
  }

  const isToolPart = (p: any) => typeof p.type === 'string' && p.type.startsWith('tool-');

  const hasParts = parts.some(p => p.type === 'text' || isToolPart(p));
  if (!hasParts) return null;

  return (
    <div className="flex gap-2 text-xs justify-start">
      <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
        <Bot size={11} className="text-primary" />
      </div>
      <div className="max-w-[90%] space-y-0.5">
        {parts.map((part: any, i: number) => {
          if (part.type === 'step-start') {
            return <div key={i} className="border-t border-border/20 my-1 w-full" />;
          }
          if (part.type === 'text' && part.text) {
            return (
              <div key={i} className="rounded-xl px-3 py-2 text-[12px] leading-relaxed bg-muted/60 text-foreground rounded-tl-none">
                <MarkdownContent text={part.text} />
              </div>
            );
          }
          if (isToolPart(part)) {
            return <ToolPill key={i} part={part} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function AgnoChat() {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevStatus = useRef<string>('ready');

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // After AI executes commands, bypass the SSR cycle and hydrate Zustand stores directly.
  // router.refresh() alone can't trigger re-hydration because AgnosticShell only hydrates
  // on path change — stores would stay stale until navigation.
  useEffect(() => {
    if (prevStatus.current === 'streaming' && status === 'ready') {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      const ranCommands = lastAssistant?.parts?.some(
        (p: any) => p.type === 'tool-execute_agno' && p.state === 'output-available'
      );
      if (ranCommands) {
        fetch('/api/vault?namespace=all')
          .then(r => r.json())
          .then((res: any) => {
            if (!res.success || !res.data) return;
            const fresh = res.data as Record<string, any[]>;
            useDNAStore.getState().hydrate(
              fresh[SYSTEM_NS.ROUTES]  ?? [],
              fresh[SYSTEM_NS.SCHEMAS] ?? []
            );
            useMateriaStore.getState().hydrate(fresh);
          })
          .catch(() => {});
      }
    }
    prevStatus.current = status;
  }, [status, messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage({ text });
  };

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const HINTS = ['crear schema productos', 'añadir ruta /clientes', 'validate — verificar contratos'];

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          'bg-primary text-primary-foreground hover:scale-105 active:scale-95',
          open && 'opacity-80'
        )}
        title="agno chat"
      >
        {open ? <X size={18} /> : <Bot size={18} />}
      </button>

      {/* Panel */}
      {open && (
        <div className={cn(
          'fixed bottom-20 right-6 z-50 w-[390px] rounded-2xl border border-border/60 bg-background shadow-2xl',
          'flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200'
        )} style={{ height: '560px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <Terminal size={13} className="text-primary" />
              <span className="text-[11px] font-black uppercase tracking-widest">agno chat</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(s => !s)}
                className={cn(
                  'p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors',
                  showSettings && 'text-primary bg-primary/10'
                )}
              >
                <Settings size={13} />
              </button>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-[9px] font-bold"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {/* Settings */}
          {showSettings && <div className="overflow-y-auto max-h-[380px] shrink-0"><SettingsPanel /></div>}

          {/* Mensajes */}
          {!showSettings && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <Bot size={28} className="text-primary/30" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">agno assistant</p>
                    <p className="text-[10px] text-muted-foreground/60 max-w-[220px]">
                      Describe lo que quieres construir. Generaré los comandos agno exactos.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 w-full max-w-[260px]">
                    {HINTS.map(hint => (
                      <button
                        key={hint}
                        onClick={() => setInput(hint)}
                        className="text-left px-3 py-1.5 rounded-lg border border-border/40 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all font-mono"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map(m => (
                <Message key={m.id} message={m} />
              ))}
              {isLoading && (
                <div className="flex gap-2 items-center">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot size={11} className="text-primary" />
                  </div>
                  <div className="flex gap-1 px-3 py-2 bg-muted/60 rounded-xl rounded-tl-none">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          {!showSettings && (
            <form onSubmit={handleSubmit} className="flex gap-2 px-3 py-3 border-t border-border/40 bg-muted/10 shrink-0">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Describe lo que necesitas..."
                disabled={isLoading}
                className="flex-1 h-8 text-xs border-border/40 bg-background focus:ring-0"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-8 w-8 shrink-0">
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
