'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Rocket, RefreshCw,
  Github, Cloud, Database, Shield, ChevronDown, ChevronRight,
  Eye, EyeOff, Loader2, Copy, Check, ExternalLink, ArrowRight,
  ArrowLeftRight
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

// ─── ACTION ROW ───────────────────────────────────────────────────────────────

function ActionRow({
  onTest, onSave, testResult, testing, saving, isDevMode, isCustomDeploy
}: {
  onTest: () => void;
  onSave: (redeploy: boolean) => void;
  testResult: CheckResult | null;
  testing: boolean;
  saving: boolean;
  isDevMode: boolean;
  isCustomDeploy?: boolean;
}) {
  const testOk = testResult?.status === 'pass';
  const testWarn = testResult?.status === 'warn';

  return (
    <div className="space-y-2 pt-1">
      {testResult && (
        <div className={cn(
          'flex items-start gap-2 px-3 py-2 rounded-xl text-[10px]',
          testOk ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : testWarn ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
          : 'bg-destructive/10 text-destructive',
        )}>
          <StatusDot status={testResult.status} />
          <span>{testOk ? `Conexión exitosa (${testResult.latency_ms}ms)` : testResult.output ?? 'Error desconocido'}</span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline" size="sm"
          onClick={onTest}
          disabled={testing || saving}
          className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3"
        >
          {testing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
          Probar conexión
        </Button>

        <Button
          size="sm"
          onClick={() => onSave(!isDevMode && !isCustomDeploy)}
          disabled={saving || testing}
          className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3"
        >
          {saving ? <Loader2 size={10} className="animate-spin" /> : isDevMode || isCustomDeploy ? <Database size={10} /> : <Rocket size={10} />}
          {isDevMode ? 'Guardar en .env.local' : isCustomDeploy ? 'Aplicar localmente' : 'Guardar y redesplegar'}
        </Button>

        {(!isDevMode && !isCustomDeploy) && (
          <Button
            variant="ghost" size="sm"
            onClick={() => onSave(false)}
            disabled={saving || testing}
            className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3 text-muted-foreground"
          >
            Solo guardar
          </Button>
        )}
      </div>

      {isDevMode && (
        <p className="text-[9px] text-muted-foreground italic">
          En desarrollo, se guardará directamente en tu archivo <code className="bg-muted px-1 rounded">.env.local</code>. Deberás reiniciar el servidor de desarrollo para aplicar los cambios.
        </p>
      )}
      {isCustomDeploy && (
        <p className="text-[9px] text-muted-foreground italic text-amber-600/80">
          Entorno custom detectado. Se guardará en <code className="bg-muted px-1 rounded">.env.local</code>. Deberás reiniciar el contenedor o servidor manualmente para aplicar.
        </p>
      )}
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
  auth:     { SESSION_SECRET: string };
  vercel:   { VERCEL_ACCESS_TOKEN: string; VERCEL_PROJECT_ID: string; VERCEL_TEAM_ID: string };
  netlify:  { NETLIFY_AUTH_TOKEN: string; NETLIFY_SITE_ID: string };
};

const EMPTY_FORMS: FormMap = {
  github:   { GITHUB_TOKEN: '', GITHUB_REPO: '', GITHUB_BRANCH: '' },
  postgres: { DATABASE_URL: '' },
  r2:       { CF_ACCOUNT_ID: '', CF_R2_BUCKET: '', CF_R2_ACCESS_KEY_ID: '', CF_R2_SECRET_ACCESS_KEY: '', CF_R2_PUBLIC_URL: '' },
  supabase: { SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' },
  auth:     { SESSION_SECRET: '' },
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
  const isCustomDeploy = !!health?.isCustomDeploy;

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
  const githubCk    = checks?.['data:github'][0];
  const postgresCk  = checks?.['data:postgres'][0];
  const r2Ck        = checks?.['storage:r2'][0];
  const supabaseCk  = checks?.['data:supabase'][0];
  const sessionCk   = checks?.['auth:session'][0];

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

      {/* ── PASO 1: Hosting Cloud ────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">1</span>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Hosting & Plataforma Cloud</h4>
        </div>

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

          {activeProviderTab === 'vercel' ? (
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
              <CredentialField
                name="VERCEL_ACCESS_TOKEN"
                value={forms.vercel.VERCEL_ACCESS_TOKEN}
                onChange={v => setField('vercel', 'VERCEL_ACCESS_TOKEN', v)}
                exists={!!presence['VERCEL_ACCESS_TOKEN']}
                sensitive
              />
              <CredentialField
                name="VERCEL_PROJECT_ID"
                value={forms.vercel.VERCEL_PROJECT_ID}
                onChange={v => setField('vercel', 'VERCEL_PROJECT_ID', v)}
                exists={!!presence['VERCEL_PROJECT_ID']}
                sensitive={false}
                placeholder="prj_..."
              />
              <CredentialField
                name="VERCEL_TEAM_ID"
                value={forms.vercel.VERCEL_TEAM_ID}
                onChange={v => setField('vercel', 'VERCEL_TEAM_ID', v)}
                exists={!!presence['VERCEL_TEAM_ID']}
                sensitive={false}
                placeholder="team_... (opcional)"
              />
              <ActionRow
                onTest={() => handleTest('vercel', {
                  VERCEL_ACCESS_TOKEN: forms.vercel.VERCEL_ACCESS_TOKEN,
                  VERCEL_PROJECT_ID: forms.vercel.VERCEL_PROJECT_ID,
                  VERCEL_TEAM_ID: forms.vercel.VERCEL_TEAM_ID
                })}
                onSave={(redeploy) => handleSave('vercel', [
                  { key: 'VERCEL_ACCESS_TOKEN', value: forms.vercel.VERCEL_ACCESS_TOKEN, sensitive: true },
                  { key: 'VERCEL_PROJECT_ID', value: forms.vercel.VERCEL_PROJECT_ID, sensitive: false },
                  { key: 'VERCEL_TEAM_ID', value: forms.vercel.VERCEL_TEAM_ID, sensitive: false }
                ], redeploy)}
                testResult={testResults['vercel'] ?? null}
                testing={testingId === 'vercel'}
                saving={savingId === 'vercel'}
                isDevMode={isDevMode}
                isCustomDeploy={false} // Explicitly false to allow bootstrapping Vercel in production
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[9px] text-muted-foreground leading-relaxed px-1 pb-1">
                Configura tu token de acceso personal de Netlify y el Site ID para habilitar el guardado automático de variables y los redespliegues.
                <details className="mt-1.5 text-muted-foreground/60 cursor-pointer">
                  <summary className="hover:text-primary font-bold">¿Cómo obtener estos datos?</summary>
                  <div className="mt-1.5 space-y-2 pl-2.5 border-l border-border/40 text-[9px]">
                    <p><b>1. Token:</b> Netlify Dashboard → User Settings → Applications → Personal access tokens → New access token.</p>
                    <p><b>2. Site ID:</b> Netlify Dashboard → Tu sitio → Site configuration → General → Site details → Site ID.</p>
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
                onSave={(redeploy) => handleSave('netlify', [
                  { key: 'NETLIFY_AUTH_TOKEN', value: forms.netlify.NETLIFY_AUTH_TOKEN, sensitive: true },
                  { key: 'NETLIFY_SITE_ID', value: forms.netlify.NETLIFY_SITE_ID, sensitive: false }
                ], redeploy)}
                testResult={testResults['netlify'] ?? null}
                testing={testingId === 'netlify'}
                saving={savingId === 'netlify'}
                isDevMode={isDevMode}
                isCustomDeploy={false} // Explicitly false to allow bootstrapping Netlify in production
              />
            </div>
          )}
        </StrategyCard>
      </div>

      {/* ── PASO 2: Persistencia de Datos ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">2</span>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Persistencia de Datos (Base de Datos / DNA)</h4>
        </div>

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
                onSave={(redeploy) => handleSave('github', [
                  { key: 'GITHUB_TOKEN', value: forms.github.GITHUB_TOKEN, sensitive: true },
                  { key: 'GITHUB_REPO', value: forms.github.GITHUB_REPO, sensitive: false },
                  { key: 'GITHUB_BRANCH', value: forms.github.GITHUB_BRANCH, sensitive: false },
                ], redeploy)}
                testResult={testResults['github'] ?? null}
                testing={testingId === 'github'}
                saving={savingId === 'github'}
                isDevMode={isDevMode}
                isCustomDeploy={isCustomDeploy}
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
                onSave={(redeploy) => handleSave('postgres', [
                  { key: 'DATABASE_URL', value: forms.postgres.DATABASE_URL, sensitive: true },
                ], redeploy)}
                testResult={testResults['postgres'] ?? null}
                testing={testingId === 'postgres'}
                saving={savingId === 'postgres'}
                isDevMode={isDevMode}
                isCustomDeploy={isCustomDeploy}
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
                onSave={(redeploy) => handleSave('supabase', [
                  { key: 'SUPABASE_URL', value: forms.supabase.SUPABASE_URL, sensitive: false },
                  { key: 'SUPABASE_SERVICE_ROLE_KEY', value: forms.supabase.SUPABASE_SERVICE_ROLE_KEY, sensitive: true },
                ], redeploy)}
                testResult={testResults['supabase'] ?? null}
                testing={testingId === 'supabase'}
                saving={savingId === 'supabase'}
                isDevMode={isDevMode}
                isCustomDeploy={isCustomDeploy}
              />
            </div>
          )}
        </StrategyCard>
      </div>

      {/* ── PASO 3: Almacenamiento de Archivos (Multimedia) ──────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">3</span>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Archivos & Multimedia (Cloudflare R2) — Paso Crítico</h4>
        </div>

        <StrategyCard
          icon={Cloud}
          title="Cloudflare R2"
          subtitle={r2Ck?.status === 'pass' ? 'Sincronizado y listo' : 'Requerido para la carga de multimedia y adjuntos'}
          check={r2Ck}
          defaultOpen={!r2Ck || r2Ck.status !== 'pass'}
        >
          <div className="text-[9.5px] text-muted-foreground leading-relaxed mb-1">
            Indispensable para el manejo correcto de imágenes y archivos cargados desde el panel dinámico. 
            Previene almacenamiento ineficiente en disco o base de datos.
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
            onSave={(redeploy) => handleSave('r2', [
              { key: 'CF_ACCOUNT_ID', value: forms.r2.CF_ACCOUNT_ID, sensitive: false },
              { key: 'CF_R2_BUCKET', value: forms.r2.CF_R2_BUCKET, sensitive: false },
              { key: 'CF_R2_ACCESS_KEY_ID', value: forms.r2.CF_R2_ACCESS_KEY_ID, sensitive: true },
              { key: 'CF_R2_SECRET_ACCESS_KEY', value: forms.r2.CF_R2_SECRET_ACCESS_KEY, sensitive: true },
              { key: 'CF_R2_PUBLIC_URL', value: forms.r2.CF_R2_PUBLIC_URL, sensitive: false },
            ], redeploy)}
            testResult={testResults['r2'] ?? null}
            testing={testingId === 'r2'}
            saving={savingId === 'r2'}
            isDevMode={isDevMode}
            isCustomDeploy={isCustomDeploy}
          />
        </StrategyCard>
      </div>

      {/* ── PASO 4: Seguridad y Auth ────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">4</span>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Seguridad & Sesiones</h4>
        </div>

        <StrategyCard
          icon={Shield}
          title="Auth & Seguridad"
          check={sessionCk}
          defaultOpen={!sessionCk || sessionCk.status !== 'pass'}
        >
          <div className="space-y-3">
            <CredentialField name="SESSION_SECRET" value={forms.auth.SESSION_SECRET} onChange={v => setField('auth', 'SESSION_SECRET', v)} exists={!!presence['SESSION_SECRET']} sensitive />
          </div>
          {!presence['SESSION_SECRET'] && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[9px] text-muted-foreground font-bold">Genera un secreto seguro de 64 caracteres:</p>
              <CopySnippet text={`# PowerShell\n$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()\n$b = New-Object byte[] 32; $rng.GetBytes($b)\n[System.BitConverter]::ToString($b).Replace('-','').ToLower()\n\n# macOS/Linux\nopenssl rand -hex 32`} />
            </div>
          )}
          <ActionRow
            onTest={fetchHealth}
            onSave={(redeploy) => handleSave('auth', [
              { key: 'SESSION_SECRET', value: forms.auth.SESSION_SECRET, sensitive: true },
            ], redeploy)}
            testResult={sessionCk ?? null}
            testing={loadingH}
            saving={savingId === 'auth'}
            isDevMode={isDevMode}
            isCustomDeploy={isCustomDeploy}
          />
        </StrategyCard>
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
