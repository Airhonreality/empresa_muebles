'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Rocket, RefreshCw,
  Github, Cloud, Database, Shield, ChevronDown, ChevronRight,
  Eye, EyeOff, Loader2, Copy, Check, ExternalLink, ArrowRight,
  ArrowLeftRight, Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface CheckResult {
  componentId: string;
  componentType: string;
  status: 'pass' | 'fail' | 'warn';
  output?: string;
  time: string;
  latency_ms: number;
}

interface HealthData {
  status: 'pass' | 'warn' | 'fail';
  activeDataStrategy: 'github' | 'postgres' | 'supabase' | 'local';
  isDevelopment: boolean;
  isCustomDeploy: boolean;
  isVercel: boolean;
  isNetlify?: boolean;
  env_presence: Record<string, boolean>;
  checks: {
    'data:github':    CheckResult[];
    'data:postgres':  CheckResult[];
    'storage:r2':     CheckResult[];
    'data:supabase':  CheckResult[];
    'data:local':     CheckResult[];
    'auth:session':   CheckResult[];
  };
}

interface DeployState {
  id: string;
  readyState: string;
  url: string | null;
  errorMessage: string | null;
  pollCount: number;
}

interface SaveResult {
  saved: number;
  failed: number;
  errors: string[];
  deployment: { id: string; url: string | null; readyState: string } | null;
  warning?: string;
}

interface MigrationReport {
  namespace: string;
  read: number;
  written: number | string;
  skipped: boolean;
  errors: string[];
}

interface MigrationResult {
  dryRun: boolean;
  from: string;
  to: string;
  namespacesScanned: number;
  totalRead: number;
  totalWritten: number | string;
  totalErrors: number;
  success: boolean;
  setup_hint?: string;
  error?: string;
  report: MigrationReport[];
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS  = 5000;
const MAX_POLL_ATTEMPTS = 72; // 6 min max (72 × 5s)
const TERMINAL_STATES   = new Set(['READY', 'ERROR', 'CANCELED']);

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

export function StatusDot({ status }: { status: 'pass' | 'warn' | 'fail' | 'loading' }) {
  if (status === 'loading') return <Loader2 size={12} className="animate-spin text-muted-foreground shrink-0" />;
  if (status === 'pass')    return <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />;
  if (status === 'warn')    return <AlertCircle  size={12} className="text-amber-500 shrink-0" />;
  return                           <XCircle      size={12} className="text-destructive/70 shrink-0" />;
}

function ExistsBadge({ exists }: { exists: boolean }) {
  return exists
    ? <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
    : <span className="w-[11px] h-[11px] rounded-full border border-muted-foreground/30 shrink-0 block" />;
}

export function CopySnippet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2 bg-muted/40 border rounded-xl px-3 py-2 font-mono text-[10px] text-muted-foreground">
      <span className="flex-1 break-all whitespace-pre-wrap">{text}</span>
      <button onClick={handleCopy} className="shrink-0 text-muted-foreground/50 hover:text-primary transition-colors">
        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      </button>
    </div>
  );
}

// ─── CREDENTIAL FIELD ─────────────────────────────────────────────────────────

export function CredentialField({
  name, value, onChange, exists, sensitive = true, placeholder,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  exists: boolean;
  sensitive?: boolean;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const type = sensitive && !visible ? 'password' : 'text';

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono text-[9px] font-bold w-48 shrink-0 text-foreground/60 leading-tight">{name}</span>
      <div className="flex-1 flex items-center gap-1 bg-muted/30 border border-border/40 rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? (exists ? '— dejar vacío para mantener —' : 'Nuevo valor...')}
          className="flex-1 bg-transparent text-[10px] font-mono outline-none text-foreground placeholder:text-muted-foreground/40 min-w-0"
        />
        {sensitive && (
          <button onClick={() => setVisible(v => !v)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
            {visible ? <EyeOff size={10} /> : <Eye size={10} />}
          </button>
        )}
      </div>
      <ExistsBadge exists={exists} />
    </div>
  );
}

// ─── STRATEGY CARD ────────────────────────────────────────────────────────────

function StrategyCard({
  icon: Icon, title, subtitle, check, defaultOpen, children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  check?: CheckResult;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const status = check?.status ?? 'fail';

  return (
    <div className={cn(
      'rounded-[2rem] border shadow-sm overflow-hidden transition-all bg-card',
      status === 'pass' ? 'border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5'
      : status === 'warn' ? 'border-amber-500/20 bg-amber-50/5 dark:bg-amber-950/5'
      : 'border-destructive/20 bg-destructive/[0.02]',
    )}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className={cn(
          'h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
          status === 'pass' ? 'bg-emerald-500/10 text-emerald-600'
          : status === 'warn' ? 'bg-amber-500/10 text-amber-600'
          : 'bg-destructive/10 text-destructive/70',
        )}>
          <Icon size={15} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{title}</p>
          {subtitle && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        {check && (
          <span className={cn(
            'text-[9px] font-bold uppercase tracking-wider',
            status === 'pass' ? 'text-emerald-600' : status === 'warn' ? 'text-amber-600' : 'text-destructive/70',
          )}>
            {status === 'pass' ? 'OK' : status === 'warn' ? 'WARN' : 'FAIL'}
            {check.latency_ms > 0 && status === 'pass' ? ` · ${check.latency_ms}ms` : ''}
          </span>
        )}
        {open ? <ChevronDown size={14} className="text-muted-foreground/50 shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground/50 shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4 animate-in slide-in-from-top-1 duration-200">
          {check?.output && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-muted/30 text-[10px] text-muted-foreground">
              <AlertCircle size={12} className="shrink-0 mt-0.5 text-amber-500" />
              <span>{check.output}</span>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// ─── CONNECTED SERVICE CARD ───────────────────────────────────────────────────

function ConnectedServiceCard({
  icon: Icon, title, subtitle, onEdit, metadata,
}: {
  icon: React.ElementType; title: string; subtitle: string; onEdit: () => void; metadata?: Record<string, string>;
}) {
  return (
    <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-sm overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[12px] font-black uppercase tracking-widest text-foreground">{title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 mb-1.5">
            <CheckCircle2 size={11} className="text-emerald-500" />
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{subtitle}</p>
          </div>
          {metadata && Object.keys(metadata).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {Object.entries(metadata).map(([k, v]) => (
                <span key={k} className="text-[9.5px] text-muted-foreground font-mono bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-border/40 shadow-sm">
                  <span className="font-bold uppercase tracking-widest opacity-60 text-[8px]">{k}:</span> <span className="text-foreground font-medium">{v}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onEdit} className="h-8 rounded-full text-[9px] font-black uppercase tracking-widest px-4 border-dashed hover:border-solid hover:bg-muted/50 shrink-0">
        Modificar
      </Button>
    </div>
  );
}

// ─── ACTION ROW ───────────────────────────────────────────────────────────────

function ActionRow({
  onTest, onSave, testResult, testing, saving, isDevMode, isCloudBootstrapped
}: {
  onTest: () => void;
  onSave: (redeploy: boolean) => void;
  testResult: CheckResult | null;
  testing: boolean;
  saving: boolean;
  isDevMode: boolean;
  isCloudBootstrapped?: boolean;
}) {
  const testOk = testResult?.status === 'pass';
  const testWarn = testResult?.status === 'warn';

  return (
    <div className="space-y-3 pt-2">
      {testResult && (
        <div className={cn(
          'flex items-start gap-2 px-3 py-2.5 rounded-xl text-[10px] animate-in fade-in',
          testOk ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : testWarn ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
          : 'bg-destructive/10 text-destructive',
        )}>
          <StatusDot status={testResult.status} />
          <span className="leading-tight">{testOk ? `Conexión validada exitosamente (${testResult.latency_ms}ms)` : testResult.output ?? 'Error desconocido'}</span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline" size="sm"
          onClick={onTest}
          disabled={testing || saving}
          className="h-8 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-4 shadow-sm"
        >
          {testing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Probar conexión
        </Button>

        <Button
          size="sm"
          onClick={() => onSave(!!isCloudBootstrapped)}
          disabled={saving || testing}
          className="h-8 text-[9px] font-black uppercase tracking-widest rounded-xl gap-2 px-4 shadow-sm"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : isCloudBootstrapped ? <Rocket size={12} /> : <Database size={12} />}
          {isDevMode ? 'Guardar en .env.local' : isCloudBootstrapped ? 'Inyectar y Reiniciar' : 'Guardar y Redesplegar'}
        </Button>

        {!isCloudBootstrapped && !isDevMode && (
          <Button
            variant="ghost" size="sm"
            onClick={() => onSave(false)}
            disabled={saving || testing}
            className="h-8 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3 text-muted-foreground"
          >
            Solo guardar
          </Button>
        )}
      </div>

      {isDevMode && (
        <p className="text-[9px] text-muted-foreground italic bg-muted/30 px-3 py-2 rounded-lg">
          En desarrollo, se guardará directamente en <code className="bg-muted px-1 rounded font-bold">.env.local</code>. Reinicia el servidor para aplicar.
        </p>
      )}
    </div>
  );
}

// ─── DEPLOY ACTION OVERLAY ──────────────────────────────────────────────────────

function DeployActionOverlay({ deploy }: { deploy: DeployState }) {
  const isTerminal = TERMINAL_STATES.has(deploy.readyState);
  
  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2rem] animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-card border shadow-xl rounded-3xl p-8 max-w-sm w-full space-y-6 text-center">
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          {deploy.readyState === 'READY' ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-in zoom-in">
              <CheckCircle2 size={32} />
            </div>
          ) : deploy.readyState === 'ERROR' ? (
             <div className="w-16 h-16 rounded-full bg-destructive/20 text-destructive flex items-center justify-center animate-in zoom-in">
              <XCircle size={32} />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Rocket size={24} className="text-primary animate-pulse" />
            </>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
            {deploy.readyState === 'READY' ? '¡Despliegue Exitoso!' : deploy.readyState === 'ERROR' ? 'Falla en Despliegue' : 'Inyectando y Reiniciando...'}
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            {deploy.readyState === 'INITIALIZING' && '[1/3] Preparando compilación en la nube...'}
            {deploy.readyState === 'BUILDING' && '[2/3] Compilando bundle de producción...'}
            {deploy.readyState === 'DEPLOYING' && '[3/3] Instanciando contenedores edge...'}
            {(!['READY', 'ERROR', 'INITIALIZING', 'BUILDING', 'DEPLOYING'].includes(deploy.readyState)) && `Procesando: ${deploy.readyState}`}
            {deploy.readyState === 'READY' && 'Tu servidor está corriendo la nueva versión.'}
            {deploy.readyState === 'ERROR' && deploy.errorMessage}
          </p>
        </div>

        {!isTerminal && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DEPLOY STATUS BAR ────────────────────────────────────────────────────────

export function DeployStatusBar({ deploy, onDismiss }: { deploy: DeployState; onDismiss: () => void }) {
  const isTerminal = TERMINAL_STATES.has(deploy.readyState);

  return (
    <div className={cn(
      'rounded-xl border p-4 flex flex-col gap-2 transition-all',
      deploy.readyState === 'READY'
        ? 'border-emerald-500/20 bg-emerald-500/5'
        : deploy.readyState === 'ERROR'
          ? 'border-destructive/20 bg-destructive/5'
          : 'border-primary/20 bg-primary/5',
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {deploy.readyState === 'READY' && <CheckCircle2 size={14} className="text-emerald-500" />}
          {deploy.readyState === 'ERROR' && <XCircle size={14} className="text-destructive" />}
          {!isTerminal && <Loader2 size={14} className="animate-spin text-primary" />}
          <span className="text-[10px] font-bold text-foreground">
            {deploy.readyState === 'READY' && 'Despliegue completado con éxito'}
            {deploy.readyState === 'ERROR' && 'El despliegue falló'}
            {deploy.readyState === 'INITIALIZING' && 'Iniciando compilación en la nube...'}
            {deploy.readyState === 'BUILDING' && 'Compilando bundle de producción...'}
            {deploy.readyState === 'DEPLOYING' && 'Instanciando contenedores edge...'}
            {(!['READY', 'ERROR', 'INITIALIZING', 'BUILDING', 'DEPLOYING'].includes(deploy.readyState)) && `Procesando: ${deploy.readyState}`}
          </span>
        </div>
        <button onClick={onDismiss} className="text-[9px] font-black uppercase text-muted-foreground hover:text-foreground">
          Cerrar
        </button>
      </div>

      {!isTerminal && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
        </div>
      )}

      <p className="text-[9px] text-muted-foreground font-mono">
        ID: {deploy.id}
        {deploy.pollCount > 0 && ` · verificación ${deploy.pollCount}`}
      </p>

      {deploy.readyState === 'READY' && deploy.url && (
        <a
          href={deploy.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:underline w-fit"
        >
          <ExternalLink size={10} /> Abrir producción
        </a>
      )}

      {deploy.errorMessage && (
        <p className="text-[9px] text-destructive font-mono">{deploy.errorMessage}</p>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type FormMap = {
  github:   { GITHUB_TOKEN: string; GITHUB_REPO: string; GITHUB_BRANCH: string };
  postgres: { DATABASE_URL: string };
  r2:       { CF_ACCOUNT_ID: string; CF_R2_BUCKET: string; CF_R2_ACCESS_KEY_ID: string; CF_R2_SECRET_ACCESS_KEY: string; CF_R2_PUBLIC_URL: string };
  supabase: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  auth:     { SESSION_SECRET: string; API_SECRET_KEY: string };
  vercel:   { VERCEL_ACCESS_TOKEN: string; VERCEL_PROJECT_ID: string; VERCEL_TEAM_ID: string };
  netlify:  { NETLIFY_AUTH_TOKEN: string; NETLIFY_SITE_ID: string };
};

const EMPTY_FORMS: FormMap = {
  github:   { GITHUB_TOKEN: '', GITHUB_REPO: '', GITHUB_BRANCH: '' },
  postgres: { DATABASE_URL: '' },
  r2:       { CF_ACCOUNT_ID: '', CF_R2_BUCKET: '', CF_R2_ACCESS_KEY_ID: '', CF_R2_SECRET_ACCESS_KEY: '', CF_R2_PUBLIC_URL: '' },
  supabase: { SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' },
  auth:     { SESSION_SECRET: '', API_SECRET_KEY: '' },
  vercel:   { VERCEL_ACCESS_TOKEN: '', VERCEL_PROJECT_ID: '', VERCEL_TEAM_ID: '' },
  netlify:  { NETLIFY_AUTH_TOKEN: '', NETLIFY_SITE_ID: '' },
};

export function DeploySection() {
  const [health, setHealth]       = useState<HealthData | null>(null);
  const [loadingH, setLoadingH]   = useState(true);
  const [forms, setForms]         = useState<FormMap>(EMPTY_FORMS);
  const [testResults, setTestResults] = useState<Partial<Record<string, CheckResult>>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [savingId, setSavingId]   = useState<string | null>(null);
  const [saveMsg, setSaveMsg]     = useState<string | null>(null);
  const [deploy, setDeploy]       = useState<DeployState | null>(null);
  const [activeProviderTab, setActiveProviderTab] = useState<'vercel' | 'netlify'>('vercel');
  const [activeDataTab, setActiveDataTab] = useState<'github' | 'postgres' | 'supabase'>('github');

  const [editing, setEditing]     = useState<Record<string, boolean>>({});

  // Auto-migration state
  const [migrationPrompt, setMigrationPrompt] = useState<{
    from: string;
    to: string;
    credentials: Record<string, string>;
  } | null>(null);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount       = useRef(0);
  const activeDeployRef = useRef<string | null>(null);

  const isDevMode = !!health?.isDevelopment;
  const isCloudBootstrapped = !!health?.isNetlify || !!health?.isVercel;

  // ── Health fetch ─────────────────────────────────────────────────────────────

  const fetchHealth = useCallback(() => {
    setLoadingH(true);
    fetch('/api/admin/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoadingH(false));
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Synchronize dynamic active tab based on server activeDataStrategy
  useEffect(() => {
    if (health?.activeDataStrategy && health.activeDataStrategy !== 'local') {
      setActiveDataTab(health.activeDataStrategy);
    }
  }, [health?.activeDataStrategy]);

  // ── Deploy polling ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!deploy?.id || TERMINAL_STATES.has(deploy.readyState)) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }

    if (deploy.id !== activeDeployRef.current) {
      pollCount.current = 0;
      activeDeployRef.current = deploy.id;
    }

    const deployId = deploy.id;
    pollRef.current = setInterval(async () => {
      pollCount.current += 1;
      if (pollCount.current > MAX_POLL_ATTEMPTS) {
        clearInterval(pollRef.current!);
        setDeploy(d => d ? { ...d, readyState: 'ERROR', errorMessage: 'Timeout: el deploy tardó más de 6 minutos.' } : null);
        return;
      }
      try {
        const res = await fetch(`/api/admin/config/deploy-status?deploymentId=${deployId}`);
        const data = await res.json() as Partial<DeployState>;
        setDeploy(d => d ? { ...d, ...data, pollCount: pollCount.current } : null);
      } catch { /* network hiccup — keep polling */ }
    }, POLL_INTERVAL_MS);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [deploy?.id, deploy?.readyState]);

  // ── Form helpers ─────────────────────────────────────────────────────────────

  const setField = <S extends keyof FormMap>(section: S, key: keyof FormMap[S], value: string) => {
    setForms(f => ({ ...f, [section]: { ...f[section], [key]: value } }));
  };

  const presence = health?.env_presence ?? {};

  // ── Test connection ──────────────────────────────────────────────────────────

  const handleTest = async (strategy: string, credentials: Record<string, string>) => {
    setTestingId(strategy);
    setTestResults(r => ({ ...r, [strategy]: undefined }));
    try {
      const nonEmpty: Record<string, string> = {};
      for (const [k, v] of Object.entries(credentials)) { if (v) nonEmpty[k] = v; }
      const res = await fetch('/api/admin/health/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, credentials: nonEmpty }),
      });
      const data = await res.json() as CheckResult;
      setTestResults(r => ({ ...r, [strategy]: data }));
    } catch {
      setTestResults(r => ({ ...r, [strategy]: { componentId: strategy, componentType: 'unknown', status: 'fail', output: 'Error de red o falló respuesta de prueba', time: new Date().toISOString(), latency_ms: 0 } }));
    } finally {
      setTestingId(null);
    }
  };

  const handleTestM2M = async () => {
    setTestingId('m2m');
    setTestResults(r => ({ ...r, m2m: undefined }));
    const start = Date.now();
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': forms.auth.API_SECRET_KEY },
        body: JSON.stringify({ action: 'PING' }) // No valid action, we just want to bypass auth
      });
      // 401 means blocked. Anything else (even 400 Bad Request) means we passed the middleware
      const latency_ms = Date.now() - start;
      if (res.status !== 401) {
        setTestResults(r => ({ ...r, m2m: { componentId: 'm2m', componentType: 'auth', status: 'pass', output: 'Llave validada y operativa. Listo para inyectar Zaps.', time: new Date().toISOString(), latency_ms } }));
      } else {
        setTestResults(r => ({ ...r, m2m: { componentId: 'm2m', componentType: 'auth', status: 'fail', output: 'La llave fue rechazada por el servidor.', time: new Date().toISOString(), latency_ms } }));
      }
    } catch {
      setTestResults(r => ({ ...r, m2m: { componentId: 'm2m', componentType: 'auth', status: 'fail', output: 'Error de red al intentar validar.', time: new Date().toISOString(), latency_ms: 0 } }));
    } finally {
      setTestingId(null);
    }
  };

  // ── Master Deploy Orchestrator ───────────────────────────────────────────────
  
  const [orchestrator, setOrchestrator] = useState<{ active: boolean; step: number; log: string[]; error: string | null; done: boolean }>({ active: false, step: 0, log: [], error: null, done: false });

  const runMasterDeploy = async () => {
    setOrchestrator({ active: true, step: 1, log: ['[1/5] Iniciando Sniper Mode... Validando Host.'], error: null, done: false });
    
    const hasVercel = forms.vercel.VERCEL_ACCESS_TOKEN && forms.vercel.VERCEL_PROJECT_ID;
    const hasNetlify = forms.netlify.NETLIFY_AUTH_TOKEN && forms.netlify.NETLIFY_SITE_ID;
    
    if (!hasVercel && !hasNetlify) {
      setOrchestrator(prev => ({ ...prev, error: 'Host no detectado. Por favor, configura Vercel o Netlify en la sección 1.' }));
      return;
    }

    const provider = hasVercel ? 'vercel' : 'netlify';

    setOrchestrator(prev => ({ ...prev, step: 2, log: [...prev.log, '[2/5] Generando llaves criptográficas seguras...'] }));
    
    const sessionSecret = forms.auth.SESSION_SECRET || crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const apiSecret = forms.auth.API_SECRET_KEY || crypto.randomUUID().replace(/-/g, '') + 'A1';
    
    if (!forms.auth.SESSION_SECRET) setField('auth', 'SESSION_SECRET', sessionSecret);
    if (!forms.auth.API_SECRET_KEY) setField('auth', 'API_SECRET_KEY', apiSecret);

    let vars = [
      { key: 'SESSION_SECRET', value: sessionSecret, sensitive: true },
      { key: 'API_SECRET_KEY', value: apiSecret, sensitive: true }
    ];

    if (hasVercel) {
      vars.push({ key: 'VERCEL_ACCESS_TOKEN', value: forms.vercel.VERCEL_ACCESS_TOKEN, sensitive: true });
      vars.push({ key: 'VERCEL_PROJECT_ID', value: forms.vercel.VERCEL_PROJECT_ID, sensitive: false });
      if (forms.vercel.VERCEL_TEAM_ID) vars.push({ key: 'VERCEL_TEAM_ID', value: forms.vercel.VERCEL_TEAM_ID, sensitive: false });
    } else {
      vars.push({ key: 'NETLIFY_AUTH_TOKEN', value: forms.netlify.NETLIFY_AUTH_TOKEN, sensitive: true });
      vars.push({ key: 'NETLIFY_SITE_ID', value: forms.netlify.NETLIFY_SITE_ID, sensitive: false });
    }

    if (forms.postgres.DATABASE_URL) vars.push({ key: 'DATABASE_URL', value: forms.postgres.DATABASE_URL, sensitive: true });
    if (forms.supabase.SUPABASE_URL) {
      vars.push({ key: 'SUPABASE_URL', value: forms.supabase.SUPABASE_URL, sensitive: false });
      vars.push({ key: 'SUPABASE_SERVICE_ROLE_KEY', value: forms.supabase.SUPABASE_SERVICE_ROLE_KEY, sensitive: true });
    }

    setOrchestrator(prev => ({ ...prev, step: 3, log: [...prev.log, `[3/5] Inyectando batch de ${vars.length} variables en ${provider}...`] }));

    try {
      const res = await fetch('/api/admin/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, variables: vars, redeploy: true }),
      });
      const data = await res.json() as SaveResult;
      
      if (!res.ok) throw new Error(data.error || 'Fallo en inyección API');
      
      setOrchestrator(prev => ({ ...prev, step: 4, log: [...prev.log, `[4/5] Redespliegue iniciado (ID: ${data.deployment?.id || '?'}). Esperando contenedor...`] }));
      
      if (data.deployment) {
        pollCount.current = 0;
        setDeploy({ id: data.deployment.id, readyState: data.deployment.readyState, url: data.deployment.url, errorMessage: null, pollCount: 0 });
      }

      setOrchestrator(prev => ({ ...prev, step: 5, log: [...prev.log, '[5/5] Infraestructura aprovisionada exitosamente.'], done: true }));
      fetchHealth();

    } catch (err: any) {
      setOrchestrator(prev => ({ ...prev, error: err.message || 'Error desconocido al aprovisionar.' }));
    }
  };

  // ── Save environment ──────────────────────────────────────────────────────────

  const handleSave = async (section: string, vars: Array<{ key: string; value: string; sensitive?: boolean }>, redeploy: boolean) => {
    const nonEmpty = vars.filter(v => v.value.trim() !== '');
    if (nonEmpty.length === 0) {
      setSaveMsg('No hay valores nuevos para guardar. Ingresa al menos un valor.');
      setTimeout(() => setSaveMsg(null), 4000);
      return;
    }
    setSavingId(section);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/admin/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: section, variables: nonEmpty, redeploy }),
      });
      const data = await res.json() as SaveResult;
      if (data.deployment) {
        pollCount.current = 0;
        setDeploy({ id: data.deployment.id, readyState: data.deployment.readyState, url: data.deployment.url, errorMessage: null, pollCount: 0 });
      }
      if (data.warning) setSaveMsg(data.warning);
      else if (data.failed > 0) setSaveMsg(`${data.failed} variable(s) no se guardaron: ${data.errors.join(', ')}`);
      else setSaveMsg(`${data.saved} variable(s) guardadas correctamente.`);
      setTimeout(() => setSaveMsg(null), 6000);

      // Trigger active strategy change detection for automated migration dialog
      const previousStrategy = health?.activeDataStrategy || 'local';
      if (data.saved > 0 && previousStrategy !== section && (section === 'postgres' || section === 'github' || section === 'supabase')) {
        // Collect targeted credentials to feed the migrator POST directly
        const targetCreds: Record<string, string> = {};
        vars.forEach(v => { targetCreds[v.key] = v.value; });

        setMigrationPrompt({
          from: previousStrategy,
          to: section,
          credentials: targetCreds
        });
      }

      // Refresh health to reflect new env state
      if (data.saved > 0 && !redeploy) fetchHealth();
    } catch {
      setSaveMsg('Error de red al guardar. Intenta nuevamente.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Run Auto Migration ───────────────────────────────────────────────────────

  const handleRunMigration = async () => {
    if (!migrationPrompt) return;
    setMigrationRunning(true);
    setMigrationResult(null);
    try {
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: migrationPrompt.from,
          to: migrationPrompt.to,
          credentials: migrationPrompt.credentials,
          dryRun: false
        })
      });
      const data = await res.json() as MigrationResult;
      setMigrationResult(data);
      if (data.success) {
        fetchHealth(); // Update strategy status
      }
    } catch {
      setMigrationResult({
        dryRun: false,
        from: migrationPrompt.from,
        to: migrationPrompt.to,
        namespacesScanned: 0,
        totalRead: 0,
        totalWritten: 0,
        totalErrors: 1,
        success: false,
        error: 'La petición de migración falló debido a problemas de red o un timeout.',
        report: []
      });
    } finally {
      setMigrationRunning(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  const checks      = health?.checks;
  const githubCk    = checks?.['data:github']?.[0];
  const postgresCk  = checks?.['data:postgres']?.[0];
  const r2Ck        = checks?.['storage:r2']?.[0];
  const supabaseCk  = checks?.['data:supabase']?.[0];
  const sessionCk   = checks?.['auth:session']?.[0];
  const cloudCk     = checks?.['hosting:cloud']?.[0];

  const globalStatus = health?.status ?? 'fail';

  return (
    <div className="space-y-8 py-2 animate-in fade-in duration-500">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            {loadingH
              ? <Loader2 size={13} className="animate-spin text-muted-foreground" />
              : <StatusDot status={globalStatus} />
            }
            Configurador de Infraestructura
          </h3>
          {health && (
            <p className="text-[10px] text-muted-foreground">
              Persistencia Activa:{' '}
              <span className="font-black text-foreground capitalize bg-primary/10 text-primary px-2.5 py-0.5 rounded-full ml-1 text-[8px] uppercase tracking-wider">
                {health.activeDataStrategy === 'local' ? 'Local (Archivos JSON)' : health.activeDataStrategy}
              </span>
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchHealth} disabled={loadingH}
          className="h-8 text-[9px] font-black uppercase tracking-widest rounded-xl gap-2 px-4 text-muted-foreground hover:text-primary">
          <RefreshCw size={10} className={cn(loadingH && 'animate-spin')} /> Actualizar
        </Button>
      </div>

      {/* ── Save feedback ───────────────────────────────────────────── */}
      {saveMsg && (
        <div className="px-4 py-3 rounded-2xl bg-primary/5 text-[10px] text-primary border border-primary/20 animate-in fade-in duration-200">
          {saveMsg}
        </div>
      )}

      {/* ── Deploy status bar ───────────────────────────────────────── */}
      {deploy && (
        <DeployStatusBar deploy={deploy} onDismiss={() => setDeploy(null)} />
      )}

      {/* ── Orquestador ─────────────────────────────────────────────── */}
      <div className="rounded-[2rem] border-2 border-primary/30 bg-primary/5 p-6 space-y-4 mb-8 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" /> One-Click Provisioning
            </h3>
            <p className="text-[10px] text-muted-foreground mt-2 max-w-2xl font-medium leading-relaxed">
              Configura tus credenciales de Hosting abajo. Cuando estés listo, presiona este botón. 
              El Sniper Mode bloqueará la interfaz, autogenerará la seguridad faltante, inyectará en batch todas las variables y lanzará el redespliegue global.
            </p>
          </div>
          <Button 
            onClick={runMasterDeploy} 
            disabled={orchestrator.active && !orchestrator.done}
            className="font-bold uppercase tracking-widest text-[10px] h-10 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            {orchestrator.active && !orchestrator.done ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
            Aprovisionar Todo
          </Button>
        </div>

        {orchestrator.active && (
          <div className="bg-zinc-950 text-emerald-400 p-4 rounded-xl font-mono text-[10px] space-y-2 mt-4 shadow-inner border border-zinc-800">
            {orchestrator.log.map((l, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-zinc-600 select-none">$</span>
                <span className={i === orchestrator.log.length - 1 && !orchestrator.done && !orchestrator.error ? "animate-pulse text-emerald-300" : "text-emerald-500"}>{l}</span>
              </div>
            ))}
            {orchestrator.error && (
              <div className="text-rose-400 font-bold flex gap-3 mt-2 bg-rose-950/30 p-2 rounded">
                <span className="select-none">!</span>
                <span>ERROR: {orchestrator.error}</span>
              </div>
            )}
            {orchestrator.done && (
              <div className="text-emerald-300 font-bold mt-3 pt-3 border-t border-emerald-900/50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Listo. Monitorea el progreso de construcción arriba.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PASO 1: Hosting Cloud ────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">1</span>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Hosting & Plataforma Cloud</h4>
        </div>

        {isCloudBootstrapped && !editing.hosting ? (
          <ConnectedServiceCard
            icon={health?.isNetlify ? Cloud : Box}
            title={health?.isNetlify ? 'Netlify' : 'Vercel'}
            subtitle="Plataforma Conectada y Activa"
            metadata={cloudCk?.metadata ?? {
              'Site ID': health?.isNetlify ? forms.netlify.NETLIFY_SITE_ID : forms.vercel.VERCEL_PROJECT_ID
            }}
            onEdit={() => setEditing({ ...editing, hosting: true })}
          />
        ) : (
        <StrategyCard
          icon={Rocket}
          title="Proveedor de Hosting Cloud"
          subtitle={
            presence['VERCEL_ACCESS_TOKEN']
              ? 'Vercel — Bootstrap Habilitado'
              : presence['NETLIFY_AUTH_TOKEN']
                ? 'Netlify — Bootstrap Habilitado'
                : 'Sin bootstrap — Haz clic para configurar Vercel o Netlify'
          }
          check={
            presence['VERCEL_ACCESS_TOKEN'] || presence['NETLIFY_AUTH_TOKEN']
              ? { componentId: 'hosting', componentType: 'hosting', status: 'pass', time: '', latency_ms: 0 }
              : { componentId: 'hosting', componentType: 'hosting', status: 'fail', output: 'Requiere configurar Vercel o Netlify para habilitar redespliegues automáticos.', time: '', latency_ms: 0 }
          }
          defaultOpen={!presence['VERCEL_ACCESS_TOKEN'] && !presence['NETLIFY_AUTH_TOKEN']}
        >
          {/* Provider selector tabs */}
          <div className="flex border-b border-border/30 pb-2 mb-3 gap-2">
            <button
              onClick={() => setActiveProviderTab('vercel')}
              className={cn(
                'text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl border transition-all',
                activeProviderTab === 'vercel'
                  ? 'border-primary bg-primary/10 text-primary font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground font-normal'
              )}
            >
              Vercel
            </button>
            <button
              onClick={() => setActiveProviderTab('netlify')}
              className={cn(
                'text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl border transition-all',
                activeProviderTab === 'netlify'
                  ? 'border-primary bg-primary/10 text-primary font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground font-normal'
              )}
            >
              Netlify
            </button>
          </div>

          {activeProviderTab === 'vercel' && (
            <div className="space-y-3">
              <div className="text-[9px] text-muted-foreground leading-relaxed px-1 pb-1">
                Configura tu token personal de Vercel y el ID del proyecto para habilitar el guardado automático de variables y los redespliegues.
                <details className="mt-1.5 text-muted-foreground/60 cursor-pointer">
                  <summary className="hover:text-primary font-bold">¿Cómo obtener estos datos?</summary>
                  <div className="mt-1.5 space-y-2 pl-2.5 border-l border-border/40 text-[9px]">
                    <p><b>1. Token:</b> Vercel Dashboard → Settings → Tokens → Create token (scope: Full Account).</p>
                    <p><b>2. Project ID:</b> Vercel Dashboard → Tu proyecto → Settings → General → Project ID.</p>
                  </div>
                </details>
              </div>
              <div className="space-y-3">
                <CredentialField name="VERCEL_ACCESS_TOKEN" value={forms.vercel.VERCEL_ACCESS_TOKEN} onChange={v => setField('vercel', 'VERCEL_ACCESS_TOKEN', v)} exists={!!presence['VERCEL_ACCESS_TOKEN']} sensitive />
                <CredentialField name="VERCEL_PROJECT_ID" value={forms.vercel.VERCEL_PROJECT_ID} onChange={v => setField('vercel', 'VERCEL_PROJECT_ID', v)} exists={!!presence['VERCEL_PROJECT_ID']} sensitive={false} placeholder="prj_..." />
                <CredentialField name="VERCEL_TEAM_ID" value={forms.vercel.VERCEL_TEAM_ID} onChange={v => setField('vercel', 'VERCEL_TEAM_ID', v)} exists={!!presence['VERCEL_TEAM_ID']} sensitive={false} placeholder="team_... (opcional)" />
              </div>
              <ActionRow
                onTest={() => handleTest('vercel', { VERCEL_ACCESS_TOKEN: forms.vercel.VERCEL_ACCESS_TOKEN, VERCEL_PROJECT_ID: forms.vercel.VERCEL_PROJECT_ID, VERCEL_TEAM_ID: forms.vercel.VERCEL_TEAM_ID })}
                onSave={(redeploy) => {
                  handleSave('vercel', [
                    { key: 'VERCEL_ACCESS_TOKEN', value: forms.vercel.VERCEL_ACCESS_TOKEN, sensitive: true },
                    { key: 'VERCEL_PROJECT_ID', value: forms.vercel.VERCEL_PROJECT_ID, sensitive: false },
                    { key: 'VERCEL_TEAM_ID', value: forms.vercel.VERCEL_TEAM_ID, sensitive: false },
                  ], redeploy);
                  setEditing({ ...editing, hosting: false });
                }}
                testResult={testResults['vercel'] ?? null}
                testing={testingId === 'vercel'}
                saving={savingId === 'vercel'}
                isDevMode={isDevMode}
                isCloudBootstrapped={isCloudBootstrapped}
              />
            </div>
          )}

          {activeProviderTab === 'netlify' && (
            <div className="space-y-3">
              <div className="text-[9px] text-muted-foreground leading-relaxed px-1 pb-1">
                Configura tu token personal de Netlify y el Site ID para habilitar el guardado automático de variables y los redespliegues.
                <details className="mt-1.5 text-muted-foreground/60 cursor-pointer">
                  <summary className="hover:text-primary font-bold">Guía de Integración Netlify</summary>
                  <div className="mt-2 space-y-2.5 pl-3 border-l border-border/40 text-[9px] text-muted-foreground">
                    <div>
                      <b className="text-foreground">Paso 1: Obtener el Site ID</b>
                      <ol className="list-decimal ml-3 mt-1 space-y-0.5">
                        <li>Entra a Netlify y ve a la pestaña <b className="text-foreground">Projects</b> en el menú izquierdo.</li>
                        <li>Haz clic en tu proyecto.</li>
                        <li>En su menú interno izquierdo, entra a <b className="text-foreground">Project configuration</b>.</li>
                        <li>En la pestaña <b className="text-foreground">General</b>, baja hasta <b className="text-foreground">Site details</b>. El código largo con guiones (UUID) es tu Site ID.</li>
                      </ol>
                    </div>
                    <div>
                      <b className="text-foreground">Paso 2: Obtener el Auth Key (Personal Access Token)</b>
                      <ol className="list-decimal ml-3 mt-1 space-y-0.5">
                        <li>Ve a la esquina inferior izquierda y haz clic en tu avatar de usuario.</li>
                        <li>Entra a <b className="text-foreground">User settings</b> → <b className="text-foreground">Applications</b> → pestaña <b className="text-foreground">Personal access tokens</b>.</li>
                        <li>Haz clic en <b className="text-foreground">New access token</b>, ponle un nombre descriptivo y genéralo.</li>
                        <li className="text-destructive font-bold">Nota crítica: Cópialo de inmediato; no se vuelve a mostrar jamás.</li>
                      </ol>
                    </div>
                  </div>
                </details>
              </div>
              <CredentialField
                name="NETLIFY_AUTH_TOKEN"
                value={forms.netlify.NETLIFY_AUTH_TOKEN}
                onChange={v => setField('netlify', 'NETLIFY_AUTH_TOKEN', v)}
                exists={!!presence['NETLIFY_AUTH_TOKEN']}
                sensitive
              />
              <CredentialField
                name="NETLIFY_SITE_ID"
                value={forms.netlify.NETLIFY_SITE_ID}
                onChange={v => setField('netlify', 'NETLIFY_SITE_ID', v)}
                exists={!!presence['NETLIFY_SITE_ID']}
                sensitive={false}
                placeholder="site-uuid-..."
              />
              <ActionRow
                onTest={() => handleTest('netlify', {
                  NETLIFY_AUTH_TOKEN: forms.netlify.NETLIFY_AUTH_TOKEN,
                  NETLIFY_SITE_ID: forms.netlify.NETLIFY_SITE_ID
                })}
                onSave={(redeploy) => {
                  handleSave('netlify', [
                    { key: 'NETLIFY_AUTH_TOKEN', value: forms.netlify.NETLIFY_AUTH_TOKEN, sensitive: true },
                    { key: 'NETLIFY_SITE_ID', value: forms.netlify.NETLIFY_SITE_ID, sensitive: false },
                  ], redeploy);
                  setEditing({ ...editing, hosting: false });
                }}
                testResult={testResults['netlify'] ?? null}
                testing={testingId === 'netlify'}
                saving={savingId === 'netlify'}
                isDevMode={isDevMode}
                isCloudBootstrapped={isCloudBootstrapped}
              />
            </div>
          )}
        </StrategyCard>
        )}
      </div>

      {/* ── PASO 2: Persistencia de Datos ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">2</span>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Persistencia de Datos (Base de Datos / DNA)</h4>
        </div>

        {health?.activeDataStrategy !== 'local' && !editing.data ? (
          <ConnectedServiceCard
            icon={Database}
            title={health?.activeDataStrategy === 'github' ? 'GitHub Strategy' : health?.activeDataStrategy === 'postgres' ? 'PostgreSQL' : 'Supabase SDK'}
            subtitle="Sincronizado y Activo"
            metadata={
              health?.activeDataStrategy === 'github' ? githubCk?.metadata ?? { 'Repositorio': forms.github.GITHUB_REPO || 'Activo' }
              : health?.activeDataStrategy === 'postgres' ? postgresCk?.metadata ?? { 'Host': forms.postgres.DATABASE_URL ? '********' : 'Protegido' }
              : supabaseCk?.metadata ?? { 'Proyecto': forms.supabase.SUPABASE_URL || 'Protegido' }
            }
            onEdit={() => setEditing({ ...editing, data: true })}
          />
        ) : (
        <StrategyCard
          icon={Database}
          title="Persistencia & Base de Datos"
          subtitle={
            health?.activeDataStrategy === 'local'
              ? 'Local (Archivos JSON) — Cambia a un motor en la nube abajo'
              : `${health?.activeDataStrategy === 'github' ? 'GitHub Repo' : health?.activeDataStrategy === 'postgres' ? 'PostgreSQL' : 'Supabase SDK'} — Sincronizado y Activo`
          }
          check={
            health?.activeDataStrategy === 'github' ? githubCk
            : health?.activeDataStrategy === 'postgres' ? postgresCk
            : health?.activeDataStrategy === 'supabase' ? supabaseCk
            : { componentId: 'local', componentType: 'data', status: 'warn', output: 'Persistencia en archivos JSON locales. Los datos se perderán al redesplegar en la nube.', time: '', latency_ms: 0 }
          }
          defaultOpen={true}
        >
          {/* Strategy tab selector */}
          <div className="flex border-b border-border/30 pb-2 mb-3 gap-2">
            <button
              onClick={() => setActiveDataTab('github')}
              className={cn(
                'text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5',
                activeDataTab === 'github'
                  ? 'border-primary bg-primary/10 text-primary font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground font-normal'
              )}
            >
              GitHub Strategy
              {health?.activeDataStrategy === 'github' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveDataTab('postgres')}
              className={cn(
                'text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5',
                activeDataTab === 'postgres'
                  ? 'border-primary bg-primary/10 text-primary font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground font-normal'
              )}
            >
              PostgreSQL
              {health?.activeDataStrategy === 'postgres' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveDataTab('supabase')}
              className={cn(
                'text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5',
                activeDataTab === 'supabase'
                  ? 'border-primary bg-primary/10 text-primary font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground font-normal'
              )}
            >
              Supabase SDK
              {health?.activeDataStrategy === 'supabase' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>

          {activeDataTab === 'github' && (
            <div className="space-y-3">
              <div className="text-[9px] text-muted-foreground leading-relaxed px-1 pb-1">
                Guarda los registros y configuraciones como archivos JSON dentro de tu repositorio GitHub. 
                Es el método recomendado para mantener versionados y agnósticos los datos de tu proyecto.
              </div>
              <CredentialField name="GITHUB_TOKEN" value={forms.github.GITHUB_TOKEN} onChange={v => setField('github', 'GITHUB_TOKEN', v)} exists={!!presence['GITHUB_TOKEN']} sensitive />
              <CredentialField name="GITHUB_REPO" value={forms.github.GITHUB_REPO} onChange={v => setField('github', 'GITHUB_REPO', v)} exists={!!presence['GITHUB_REPO']} sensitive={false} placeholder="usuario/repositorio" />
              <CredentialField name="GITHUB_BRANCH" value={forms.github.GITHUB_BRANCH} onChange={v => setField('github', 'GITHUB_BRANCH', v)} exists={!!presence['GITHUB_BRANCH']} sensitive={false} placeholder="main (opcional)" />
              
              <ActionRow
                onTest={() => handleTest('github', { GITHUB_TOKEN: forms.github.GITHUB_TOKEN, GITHUB_REPO: forms.github.GITHUB_REPO, GITHUB_BRANCH: forms.github.GITHUB_BRANCH })}
                onSave={(redeploy) => {
                  handleSave('github', [
                    { key: 'GITHUB_TOKEN', value: forms.github.GITHUB_TOKEN, sensitive: true },
                    { key: 'GITHUB_REPO', value: forms.github.GITHUB_REPO, sensitive: false },
                    { key: 'GITHUB_BRANCH', value: forms.github.GITHUB_BRANCH, sensitive: false },
                  ], redeploy);
                  setEditing({ ...editing, data: false });
                }}
                testResult={testResults['github'] ?? null}
                testing={testingId === 'github'}
                saving={savingId === 'github'}
                isDevMode={isDevMode}
                isCloudBootstrapped={isCloudBootstrapped}
              />
            </div>
          )}

          {activeDataTab === 'postgres' && (
            <div className="space-y-3">
              <div className="text-[9px] text-muted-foreground leading-relaxed px-1 pb-1">
                Un único <code className="bg-muted px-1 rounded">DATABASE_URL</code> conecta con cualquier proveedor Postgres estándar (Supabase, Neon, Railway, Render).
                Las tablas se crean automáticamente en la primera consulta.
              </div>
              <CredentialField
                name="DATABASE_URL"
                value={forms.postgres.DATABASE_URL}
                onChange={v => setField('postgres', 'DATABASE_URL', v)}
                exists={!!presence['DATABASE_URL']}
                sensitive
                placeholder="postgresql://user:pass@host/db"
              />
              
              <ActionRow
                onTest={() => handleTest('postgres', { DATABASE_URL: forms.postgres.DATABASE_URL })}
                onSave={(redeploy) => {
                  handleSave('postgres', [
                    { key: 'DATABASE_URL', value: forms.postgres.DATABASE_URL, sensitive: true },
                  ], redeploy);
                  setEditing({ ...editing, data: false });
                }}
                testResult={testResults['postgres'] ?? null}
                testing={testingId === 'postgres'}
                saving={savingId === 'postgres'}
                isDevMode={isDevMode}
                isCloudBootstrapped={isCloudBootstrapped}
              />
            </div>
          )}

          {activeDataTab === 'supabase' && (
            <div className="space-y-3">
              <div className="text-[9px] text-muted-foreground leading-relaxed px-1 pb-1">
                Interactúa directamente con la API PostgREST a través del SDK de Supabase.
                Nota: Si tienes configurado tanto GitHub como Supabase, GitHub tiene prioridad de resolución.
              </div>
              <CredentialField name="SUPABASE_URL" value={forms.supabase.SUPABASE_URL} onChange={v => setField('supabase', 'SUPABASE_URL', v)} exists={!!presence['SUPABASE_URL']} sensitive={false} placeholder="https://xxxx.supabase.co" />
              <CredentialField name="SUPABASE_SERVICE_ROLE_KEY" value={forms.supabase.SUPABASE_SERVICE_ROLE_KEY} onChange={v => setField('supabase', 'SUPABASE_SERVICE_ROLE_KEY', v)} exists={!!presence['SUPABASE_SERVICE_ROLE_KEY']} sensitive />
              
              <ActionRow
                onTest={() => handleTest('supabase', { SUPABASE_URL: forms.supabase.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: forms.supabase.SUPABASE_SERVICE_ROLE_KEY })}
                onSave={(redeploy) => {
                  handleSave('supabase', [
                    { key: 'SUPABASE_URL', value: forms.supabase.SUPABASE_URL, sensitive: false },
                    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: forms.supabase.SUPABASE_SERVICE_ROLE_KEY, sensitive: true },
                  ], redeploy);
                  setEditing({ ...editing, data: false });
                }}
                testResult={testResults['supabase'] ?? null}
                testing={testingId === 'supabase'}
                saving={savingId === 'supabase'}
                isDevMode={isDevMode}
                isCloudBootstrapped={isCloudBootstrapped}
              />
            </div>
          )}
        </StrategyCard>
        )}
      </div>

      {/* ── PASO 3: Almacenamiento de Archivos (Multimedia) ──────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">3</span>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Archivos & Multimedia (Cloudflare R2) — Paso Crítico</h4>
        </div>

        {r2Ck?.status === 'pass' && !editing.r2 ? (
          <ConnectedServiceCard
            icon={Cloud}
            title="Cloudflare R2"
            subtitle="Sincronizado y listo"
            metadata={r2Ck?.metadata ?? {
              'Identificador': presence['CF_ACCOUNT_ID'] ? (forms.r2.CF_ACCOUNT_ID ? `${forms.r2.CF_ACCOUNT_ID.substring(0, 8)}...` : 'Protegido') : 'Protegido',
              'Bucket': presence['CF_R2_BUCKET'] ? forms.r2.CF_R2_BUCKET || 'Activo' : 'Protegido'
            }}
            onEdit={() => setEditing({ ...editing, r2: true })}
          />
        ) : (
        <StrategyCard
          icon={Cloud}
          title="Cloudflare R2"
          subtitle={r2Ck?.status === 'pass' ? 'Sincronizado y listo' : 'Requerido para la carga de multimedia y adjuntos'}
          check={r2Ck}
          defaultOpen={!r2Ck || r2Ck.status !== 'pass'}
        >
          <div className="text-[9.5px] text-muted-foreground leading-relaxed mb-1">
            Indispensable para el manejo correcto de imágenes y archivos. Evita bloqueos y garantiza alta disponibilidad.
            <details className="mt-1.5 text-muted-foreground/60 cursor-pointer">
              <summary className="hover:text-primary font-bold">🗺️ Guía de Integración R2 (Cloudflare)</summary>
              <div className="mt-2 space-y-3 pl-3 border-l border-border/40 text-[9px] text-muted-foreground">
                <p>🔗 <b>Enlace Inicial Directo:</b> Para empezar, usa su <a href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Panel de Control de Cloudflare (Dashboard)</a>.</p>
                <div>
                  <b className="text-foreground">🔐 Paso 1: El Account ID (ID de la cuenta)</b>
                  <p className="mt-0.5">Se encuentra visible en la URL al iniciar sesión. En <code className="bg-muted px-1 rounded">https://dash.cloudflare.com/4dc31a.../home/...</code>, el fragmento de texto entre <code className="bg-muted px-1 rounded">dash.cloudflare.com/</code> y <code className="bg-muted px-1 rounded">/home/...</code> es tu <b>CF_ACCOUNT_ID</b>.</p>
                </div>
                <div>
                  <b className="text-foreground">💳 Paso 2: Activación del Servicio R2</b>
                  <p className="mt-0.5">En el menú izquierdo ve a <b>Almacenamiento y base de datos</b> → <b>R2 Almacenamiento de objetos</b>. Si es tu primera vez, Cloudflare te exigirá hacer clic en el botón azul <b>Agregar suscripción a R2 a mi cuenta</b> (es nivel gratuito de 10GB, pero requiere tarjeta de respaldo para verificar identidad).</p>
                </div>
                <div>
                  <b className="text-foreground">📦 Paso 3: Crear el Contenedor (Bucket)</b>
                  <p className="mt-0.5">Haz clic en <b>Crear contenedor</b>. Asígnale el nombre exacto de tu proyecto en minúsculas y con guiones (ej. <code className="bg-muted px-1 rounded">veta-dorada</code>). Este es tu <b>CF_R2_BUCKET</b>.</p>
                </div>
                <div>
                  <b className="text-foreground">🔑 Paso 4: Generar las Claves de Acceso S3 (Tokens)</b>
                  <ol className="list-decimal ml-3 mt-1 space-y-0.5">
                    <li>Ve a la pantalla principal de R2 (Información general).</li>
                    <li>En la columna derecha, sección <b>Detalles de la cuenta</b>, busca <b>Tokens de la API</b> y haz clic en <b>&#123; &#125; Gestionar</b>.</li>
                    <li>Selecciona <b>Crear token de API</b>.</li>
                    <li><b className="text-destructive">Configuración crucial:</b> Ponle nombre y cambia los permisos obligatoriamente a <b>Editar</b> (si lo dejas en Solo lectura, tu app fallará al subir imágenes).</li>
                    <li>Al guardar, copia los dos valores resultantes a los campos correspondientes.</li>
                  </ol>
                </div>
                <div>
                  <b className="text-foreground">🌐 Paso 5: Habilitar la URL Pública de Desarrollo</b>
                  <ol className="list-decimal ml-3 mt-1 space-y-0.5">
                    <li>Haz clic en tu contenedor (en la lista de Buckets).</li>
                    <li>Ve a la pestaña superior <b>Configuración</b>.</li>
                    <li>Busca la sección <b>URL pública de desarrollo</b> y haz clic en <b>Habilitar</b>.</li>
                    <li>Tras confirmar, copia esa URL terminada en <code className="bg-muted px-1 rounded">.r2.dev</code> y pégala en <b>CF_R2_PUBLIC_URL</b>.</li>
                  </ol>
                </div>
              </div>
            </details>
          </div>
          <div className="space-y-3">
            <CredentialField name="CF_ACCOUNT_ID" value={forms.r2.CF_ACCOUNT_ID} onChange={v => setField('r2', 'CF_ACCOUNT_ID', v)} exists={!!presence['CF_ACCOUNT_ID']} sensitive={false} />
            <CredentialField name="CF_R2_BUCKET" value={forms.r2.CF_R2_BUCKET} onChange={v => setField('r2', 'CF_R2_BUCKET', v)} exists={!!presence['CF_R2_BUCKET']} sensitive={false} />
            <CredentialField name="CF_R2_ACCESS_KEY_ID" value={forms.r2.CF_R2_ACCESS_KEY_ID} onChange={v => setField('r2', 'CF_R2_ACCESS_KEY_ID', v)} exists={!!presence['CF_R2_ACCESS_KEY_ID']} sensitive />
            <CredentialField name="CF_R2_SECRET_ACCESS_KEY" value={forms.r2.CF_R2_SECRET_ACCESS_KEY} onChange={v => setField('r2', 'CF_R2_SECRET_ACCESS_KEY', v)} exists={!!presence['CF_R2_SECRET_ACCESS_KEY']} sensitive />
            <CredentialField name="CF_R2_PUBLIC_URL" value={forms.r2.CF_R2_PUBLIC_URL} onChange={v => setField('r2', 'CF_R2_PUBLIC_URL', v)} exists={!!presence['CF_R2_PUBLIC_URL']} sensitive={false} placeholder="https://pub-xxx.r2.dev (opcional)" />
          </div>
          <ActionRow
            onTest={() => handleTest('r2', { CF_ACCOUNT_ID: forms.r2.CF_ACCOUNT_ID, CF_R2_BUCKET: forms.r2.CF_R2_BUCKET, CF_R2_ACCESS_KEY_ID: forms.r2.CF_R2_ACCESS_KEY_ID, CF_R2_SECRET_ACCESS_KEY: forms.r2.CF_R2_SECRET_ACCESS_KEY })}
            onSave={(redeploy) => {
              handleSave('r2', [
                { key: 'CF_ACCOUNT_ID', value: forms.r2.CF_ACCOUNT_ID, sensitive: false },
                { key: 'CF_R2_BUCKET', value: forms.r2.CF_R2_BUCKET, sensitive: false },
                { key: 'CF_R2_ACCESS_KEY_ID', value: forms.r2.CF_R2_ACCESS_KEY_ID, sensitive: true },
                { key: 'CF_R2_SECRET_ACCESS_KEY', value: forms.r2.CF_R2_SECRET_ACCESS_KEY, sensitive: true },
                { key: 'CF_R2_PUBLIC_URL', value: forms.r2.CF_R2_PUBLIC_URL, sensitive: false },
              ], redeploy);
              setEditing({ ...editing, r2: false });
            }}
            testResult={testResults['r2'] ?? null}
            testing={testingId === 'r2'}
            saving={savingId === 'r2'}
            isDevMode={isDevMode}
            isCloudBootstrapped={isCloudBootstrapped}
          />
        </StrategyCard>
        )}
      </div>

      {/* ── PASO 4: Seguridad y Auth ────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">4</span>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Seguridad & Sesiones</h4>
        </div>

        {sessionCk?.status === 'pass' && !editing.auth ? (
          <ConnectedServiceCard
            icon={Shield}
            title="Auth & Seguridad"
            subtitle="Llaves seguras y activas"
            onEdit={() => setEditing({ ...editing, auth: true })}
          />
        ) : (
        <StrategyCard
          icon={Shield}
          title="Auth & Seguridad"
          check={sessionCk}
          defaultOpen={!sessionCk || sessionCk.status !== 'pass'}
        >
          <div className="space-y-4">
            {/* Session Secret */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">B2B: Sesión de Usuario (Cookies)</p>
                <Button variant="ghost" size="sm" className="h-6 text-[9px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary gap-1" onClick={() => setField('auth', 'SESSION_SECRET', crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''))}>
                  <Key size={10} /> Autogenerar Secreto
                </Button>
              </div>
              <CredentialField name="SESSION_SECRET" value={forms.auth.SESSION_SECRET} onChange={v => setField('auth', 'SESSION_SECRET', v)} exists={!!presence['SESSION_SECRET']} sensitive placeholder="Secreto de 64 caracteres..." />
            </div>

            {/* M2M API Key */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">M2M: Llave de Nube para Zaps (Vault API)</p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[9px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary gap-1" onClick={() => handleTestM2M()}>
                    {testingId === 'm2m' ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                    Validar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[9px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary gap-1" onClick={() => setField('auth', 'API_SECRET_KEY', crypto.randomUUID().replace(/-/g, '') + 'A1')}>
                    <Key size={10} /> Autogenerar Llave
                  </Button>
                </div>
              </div>
              <CredentialField name="API_SECRET_KEY" value={forms.auth.API_SECRET_KEY} onChange={v => setField('auth', 'API_SECRET_KEY', v)} exists={!!presence['API_SECRET_KEY']} sensitive placeholder="Secreto de Inyección CLI..." />
              {testResults['m2m'] && (
                <div className={`text-[9px] px-2 py-1.5 mt-1 rounded-md font-medium border ${testResults['m2m'].status === 'pass' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                  {testResults['m2m'].output}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/30">
            <ActionRow
              onTest={fetchHealth}
              onSave={(redeploy) => {
                handleSave('auth', [
                  { key: 'SESSION_SECRET', value: forms.auth.SESSION_SECRET, sensitive: true },
                  { key: 'API_SECRET_KEY', value: forms.auth.API_SECRET_KEY, sensitive: true },
                ], redeploy);
                setEditing({ ...editing, auth: false });
              }}
            testResult={sessionCk ?? null}
            testing={loadingH}
            saving={savingId === 'auth'}
            isDevMode={isDevMode}
            isCloudBootstrapped={isCloudBootstrapped}
          />
        </StrategyCard>
        )}
      </div>

      {/* ── .env.local template ─────────────────────────────────────── */}
      <div className="rounded-[2rem] border bg-muted/20 p-5 space-y-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plantilla .env.local de Referencia</p>
        <CopySnippet text={[
          '# Auth & Sessions',
          'SESSION_SECRET=',
          '',
          '# Hosting Cloud',
          'VERCEL_ACCESS_TOKEN=',
          'VERCEL_PROJECT_ID=',
          'VERCEL_TEAM_ID=',
          'NETLIFY_AUTH_TOKEN=',
          'NETLIFY_SITE_ID=',
          '',
          '# Datos — GitHub Strategy',
          'GITHUB_TOKEN=',
          'GITHUB_REPO=usuario/repo',
          'GITHUB_BRANCH=main',
          '',
          '# Archivos — Cloudflare R2',
          'CF_ACCOUNT_ID=',
          'CF_R2_BUCKET=',
          'CF_R2_ACCESS_KEY_ID=',
          'CF_R2_SECRET_ACCESS_KEY=',
          'CF_R2_PUBLIC_URL=',
          '',
          '# Datos — Supabase (alternativa a GitHub/Postgres)',
          'SUPABASE_URL=',
          'SUPABASE_SERVICE_ROLE_KEY=',
        ].join('\n')} />
      </div>

      {/* ── DIÁLOGO MIGRACIÓN AUTOMÁTICA ─────────────────────────────── */}
      <Dialog open={!!migrationPrompt} onOpenChange={(o) => { if (!o && !migrationRunning) setMigrationPrompt(null); }}>
        <DialogContent className="max-w-md rounded-[2rem] p-6 bg-card border shadow-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-primary animate-pulse" /> Sincronización de Datos Detectada
            </DialogTitle>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              Detectamos un cambio de persistencia hacia <span className="font-bold text-foreground uppercase">{migrationPrompt?.to}</span>. 
              ¿Deseas migrar y sincronizar los datos de <span className="font-bold text-foreground uppercase">{migrationPrompt?.from}</span> a su nueva ubicación?
            </p>
          </DialogHeader>

          {/* Estado de la Migración en Ejecución */}
          {migrationRunning && (
            <div className="py-6 flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-[10px] font-bold text-muted-foreground animate-pulse">Sincronizando registros en la base de datos...</p>
            </div>
          )}

          {/* Resultado de la Migración */}
          {migrationResult && (
            <div className={cn(
              'rounded-xl border p-4 space-y-2.5 text-xs',
              migrationResult.success
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-destructive/25 bg-destructive/5'
            )}>
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-[10px]">
                  Resultado de Sincronización
                </span>
                <span className={cn(
                  'font-black text-[9px] uppercase tracking-wider',
                  migrationResult.success ? 'text-emerald-600' : 'text-destructive'
                )}>
                  {migrationResult.success ? 'ÉXITO' : 'ERROR'}
                </span>
              </div>

              {migrationResult.error ? (
                <p className="text-[9px] font-mono text-destructive leading-normal">{migrationResult.error}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-muted-foreground bg-muted/20 p-2 rounded-lg">
                  <div>Tablas: <b className="text-foreground">{migrationResult.namespacesScanned}</b></div>
                  <div>Leídos: <b className="text-foreground">{migrationResult.totalRead}</b></div>
                  <div>Escritos: <b className="text-foreground">{migrationResult.totalWritten}</b></div>
                </div>
              )}

              {migrationResult.report.filter(r => !r.skipped || r.errors.length > 0).length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto mt-2 border-t pt-2">
                  {migrationResult.report
                    .filter(r => !r.skipped || r.errors.length > 0)
                    .map(r => (
                      <div key={r.namespace} className="flex items-center justify-between py-0.5 text-[9px]">
                        <span className="font-mono text-foreground/75 truncate max-w-[200px]">{r.namespace}</span>
                        <span className="font-mono text-muted-foreground shrink-0">{r.read} → {r.written}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2 justify-end">
            {!migrationResult ? (
              <>
                <Button 
                  variant="outline" 
                  disabled={migrationRunning}
                  onClick={() => setMigrationPrompt(null)}
                  className="flex-1 text-[9px] font-black uppercase tracking-widest h-9 rounded-xl"
                >
                  Omitir e Iniciar Vacío
                </Button>
                <Button 
                  onClick={handleRunMigration}
                  disabled={migrationRunning}
                  className="flex-1 text-[9px] font-black uppercase tracking-widest h-9 rounded-xl"
                >
                  {migrationRunning ? <Loader2 size={10} className="animate-spin mr-1.5" /> : null}
                  Sincronizar Datos ahora
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => { setMigrationPrompt(null); setMigrationResult(null); }}
                className="w-full text-[9px] font-black uppercase tracking-widest h-9 rounded-xl"
              >
                Cerrar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
