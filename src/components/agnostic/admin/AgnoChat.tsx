'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Bot, X, Send, Settings, Terminal, Loader2, Check, Wifi } from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { value: 'mistral',   label: 'Mistral' },
  { value: 'openai',    label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini',    label: 'Google Gemini' },
  { value: 'ollama',    label: 'Ollama (local)' },
];

const MODELS: Record<string, { value: string; label: string }[]> = {
  mistral: [
    { value: 'mistral-large-latest',  label: 'Mistral Large' },
    { value: 'mistral-small-latest',  label: 'Mistral Small' },
    { value: 'codestral-latest',      label: 'Codestral' },
    { value: 'open-mistral-nemo',     label: 'Mistral Nemo' },
    { value: 'ministral-8b-latest',   label: 'Ministral 8B' },
  ],
  openai: [
    { value: 'gpt-4o',      label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'o1-mini',     label: 'o1 Mini' },
    { value: 'o3-mini',     label: 'o3 Mini' },
  ],
  anthropic: [
    { value: 'claude-opus-4-7',           label: 'Claude Opus 4.7' },
    { value: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  ollama: [
    { value: 'llama3.1',      label: 'Llama 3.1' },
    { value: 'llama3',        label: 'Llama 3' },
    { value: 'mistral',       label: 'Mistral (local)' },
    { value: 'codellama',     label: 'Code Llama' },
    { value: 'deepseek-coder',label: 'DeepSeek Coder' },
  ],
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

// ── Helpers de contenido ──────────────────────────────────────────────────────

function parseContent(text: string) {
  const parts = text.split(/(```agno[\s\S]*?```|```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```agno')) {
      return <AgnoBlock key={i} code={part.slice(7, -3).trim()} />;
    }
    if (part.startsWith('```')) {
      return <CodeBlock key={i} code={part.slice(3, -3).replace(/^\w+\n/, '').trim()} />;
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });
}

function AgnoBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 rounded-md border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-primary/10 border-b border-primary/20">
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary">
          <Terminal size={10} /> agno
        </span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-[9px] text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
        >
          {copied ? <><Check size={9} /> copiado</> : 'copiar'}
        </button>
      </div>
      <pre className="px-3 py-2 text-[11px] font-mono text-primary/90 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="my-1.5 px-3 py-2 rounded-md bg-muted/60 text-[11px] font-mono overflow-x-auto leading-relaxed">{code}</pre>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────

function SettingsPanel() {
  const [tab, setTab] = useState<SettingsTab>('conexion');
  const [config, setConfig] = useState<AiConfig>({
    provider: 'mistral', model: 'mistral-large-latest', api_key: '',
    custom_rules: '', manifest: DEFAULT_MANIFEST,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [manifestError, setManifestError] = useState('');

  useEffect(() => {
    fetch('/api/vault?namespace=ai_config')
      .then(r => r.json())
      .then((records: any[]) => {
        const active = records?.find(r => r.data?.active) ?? records?.[0];
        if (active) {
          setConfig({
            id: active.id,
            provider: active.data.provider ?? 'mistral',
            model: active.data.model ?? 'mistral-large-latest',
            api_key: active.data.api_key ?? '',
            custom_rules: active.data.custom_rules ?? '',
            manifest: active.data.manifest ?? DEFAULT_MANIFEST,
          });
        }
      })
      .catch(() => {});
  }, []);

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

  const currentModels = MODELS[config.provider] ?? [];

  return (
    <div className="border-b border-border/40 bg-muted/10">
      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-2">
        <button className={tabClass('conexion')}  onClick={() => setTab('conexion')}>Conexión</button>
        <button className={tabClass('reglas')}    onClick={() => setTab('reglas')}>Reglas</button>
        <button className={tabClass('manifest')}  onClick={() => setTab('manifest')}>Manifest</button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* TAB: Conexión */}
        {tab === 'conexion' && (
          <>
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Proveedor</label>
              <select
                value={config.provider}
                onChange={e => {
                  const p = e.target.value;
                  const firstModel = MODELS[p]?.[0]?.value ?? '';
                  setConfig(c => ({ ...c, provider: p, model: firstModel }));
                }}
                className="w-full h-8 rounded-md border border-border/40 bg-background px-2 text-xs font-medium"
              >
                {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Modelo</label>
              <select
                value={config.model}
                onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}
                className="w-full h-8 rounded-md border border-border/40 bg-background px-2 text-xs font-medium"
              >
                {currentModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                <option value="__custom__" disabled>── custom ──</option>
              </select>
              {!currentModels.find(m => m.value === config.model) && (
                <Input
                  value={config.model}
                  onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}
                  placeholder="modelo-custom"
                  className="h-7 text-xs font-mono border-border/40 bg-background mt-1"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">API Key</label>
              <Input
                type="password"
                value={config.api_key}
                onChange={e => setConfig(c => ({ ...c, api_key: e.target.value }))}
                placeholder="sk-..."
                autoComplete="new-password"
                className="h-8 text-xs font-mono border-border/40 bg-background"
              />
            </div>
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
            : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}

// ── Mensaje ───────────────────────────────────────────────────────────────────

function Message({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';
  return (
    <div className={cn('flex gap-2 text-xs', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
          <Bot size={11} className="text-primary" />
        </div>
      )}
      <div className={cn(
        'max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-none'
          : 'bg-muted/60 text-foreground rounded-tl-none'
      )}>
        {isUser ? content : parseContent(content)}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function AgnoChat() {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
  });

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const HINTS = ['crear schema productos', 'añadir ruta /clientes', 'ver estructura actual'];

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
              {messages.map(m => <Message key={m.id} role={m.role} content={m.content} />)}
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
                value={input ?? ''}
                onChange={e => setInput(e.target.value)}
                placeholder="Describe lo que necesitas..."
                disabled={isLoading}
                className="flex-1 h-8 text-xs border-border/40 bg-background focus:ring-0"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={isLoading || !input?.trim()} className="h-8 w-8 shrink-0">
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
