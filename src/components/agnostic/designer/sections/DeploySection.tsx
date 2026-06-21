'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Rocket, RefreshCw,
  Github, Cloud, Database, Shield, ChevronDown, ChevronRight,
  Eye, EyeOff, Loader2, Copy, Check, ExternalLink, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  isVercel: boolean;
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

type SaveResult = {
  saved: number;
  failed: number;
  errors: string[];
  deployment: { id: string; url: string | null; readyState: string } | null;
  warning?: string;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS  = 5000;
const MAX_POLL_ATTEMPTS = 72; // 6 min max (72 × 5s)
const TERMINAL_STATES   = new Set(['READY', 'ERROR', 'CANCELED']);

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

export function StatusDot({ status }: { status: 'pass' | 'warn' | 'fail' | 'loading' }) {
  if (status === 'loading') return <Loader2 size={12} className="animate-spin text-muted-foreground" />;
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
    <div className="flex items-center gap-2 bg-muted/40 border rounded-lg px-3 py-2 font-mono text-[10px] text-muted-foreground">
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
      <div className="flex-1 flex items-center gap-1 bg-muted/30 border border-border/40 rounded-lg px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
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
      'rounded-2xl border shadow-sm overflow-hidden transition-all',
      status === 'pass' ? 'border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10'
      : status === 'warn' ? 'border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10'
      : 'border-destructive/20 bg-destructive/5',
    )}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3 animate-in slide-in-from-top-1 duration-200">
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
  onTest, onSave, testResult, testing, saving, isDevMode,
}: {
  onTest: () => void;
  onSave: (redeploy: boolean) => void;
  testResult: CheckResult | null;
  testing: boolean;
  saving: boolean;
  isDevMode: boolean;
}) {
  const testOk = testResult?.status === 'pass';
  const testWarn = testResult?.status === 'warn';

  return (
    <div className="space-y-2 pt-1">
      {/* Test result message */}
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
          onClick={() => onSave(!isDevMode)}
          disabled={saving || testing}
          className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3"
        >
          {saving ? <Loader2 size={10} className="animate-spin" /> : isDevMode ? <Database size={10} /> : <Rocket size={10} />}
          {isDevMode ? 'Guardar en .env.local' : 'Guardar y redesplegar'}
        </Button>

        {!isDevMode && (
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
    </div>
  );
}

// ─── DEPLOY STATUS BAR ────────────────────────────────────────────────────────

export function DeployStatusBar({ deploy, onDismiss }: { deploy: DeployState; onDismiss: () => void }) {
  const isTerminal = TERMINAL_STATES.has(deploy.readyState);

  return (
    <div className={cn(
      'rounded-2xl border p-4 space-y-2',
      deploy.readyState === 'READY' ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10'
      : deploy.readyState === 'ERROR' ? 'border-destructive/30 bg-destructive/5'
      : 'border-primary/20 bg-primary/5',
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket size={13} className={cn(deploy.readyState === 'READY' ? 'text-emerald-600' : deploy.readyState === 'ERROR' ? 'text-destructive' : 'text-primary animate-bounce')} />
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
            {deploy.readyState === 'READY' ? 'Despliegue completado'
              : deploy.readyState === 'ERROR' ? 'Error en despliegue'
              : deploy.readyState === 'CANCELED' ? 'Despliegue cancelado'
              : `Desplegando — ${deploy.readyState}`}
          </p>
        </div>
        {isTerminal && (
          <button onClick={onDismiss} className="text-[9px] text-muted-foreground hover:text-foreground transition-colors">
            Cerrar
          </button>
        )}
      </div>

      {/* Indeterminate progress — Vercel API has no percentage, only states */}
      {!isTerminal && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
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
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:underline"
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

// ─── BOOTSTRAP GATE ──────────────────────────────────────────────────────────

function BootstrapGate() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-amber-500 shrink-0" />
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Bootstrap requerido
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        <code className="bg-muted px-1 rounded text-[9px]">VERCEL_ACCESS_TOKEN</code> y{' '}
        <code className="bg-muted px-1 rounded text-[9px]">VERCEL_PROJECT_ID</code> no detectados.
        Configúralos manualmente en el Dashboard de Vercel <strong>una única vez</strong> para habilitar el guardado automático desde este panel.
      </p>
      <ol className="space-y-2.5">
        {[
          {
            title: '1. Obtén tu Access Token',
            body: 'Vercel Dashboard → Settings → Tokens → Create token (scope: Full Account).',
            snippet: 'VERCEL_ACCESS_TOKEN=vercel_pat_...',
          },
          {
            title: '2. Obtén el Project ID',
            body: 'Vercel Dashboard → Tu proyecto → Settings → General → Project ID.',
            snippet: 'VERCEL_PROJECT_ID=prj_...',
          },
          {
            title: '3. (Condicional) Team ID',
            body: 'Solo si usas cuenta de equipo: Settings → General → Team ID.',
            snippet: 'VERCEL_TEAM_ID=team_...',
          },
        ].map(s => (
          <li key={s.title} className="space-y-1">
            <p className="text-[10px] font-bold text-foreground/80">{s.title}</p>
            <p className="text-[10px] text-muted-foreground">{s.body}</p>
            <CopySnippet text={s.snippet} />
          </li>
        ))}
      </ol>
      <p className="text-[9px] text-muted-foreground italic">
        Las funciones de Probar Conexión funcionan sin bootstrap — solo el guardado a Vercel lo requiere.
      </p>
    </div>
  );
}

// ─── MIGRATION PANEL ─────────────────────────────────────────────────────────

type MigrationReport = {
  namespace: string;
  read: number;
  written: number | string;
  skipped: boolean;
  errors: string[];
};

type MigrationResult = {
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
};

const MIGRATE_STRATEGIES = ['github', 'postgres', 'supabase', 'local'] as const;
type MigrateStrategy = typeof MIGRATE_STRATEGIES[number];

function MigrationPanel() {
  const [open, setOpen]             = useState(false);
  const [from, setFrom]             = useState<MigrateStrategy>('github');
  const [to, setTo]                 = useState<MigrateStrategy>('supabase');
  const [running, setRunning]       = useState(false);
  const [result, setResult]         = useState<MigrationResult | null>(null);
  const [setupSql, setSetupSql]     = useState<string | null>(null);
  const [loadingSql, setLoadingSql] = useState(false);

  const run = async (dryRun: boolean) => {
    if (from === to) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, dryRun }),
      });
      const data = await res.json() as MigrationResult;
      setResult(data);
    } catch {
      setResult({ dryRun, from, to, namespacesScanned: 0, totalRead: 0, totalWritten: 0, totalErrors: 1, success: false, error: 'Error de red o timeout', report: [] });
    } finally {
      setRunning(false);
    }
  };

  const fetchSetupSql = async () => {
    setLoadingSql(true);
    setSetupSql(null);
    try {
      const res = await fetch(`/api/admin/migrate?from=${from}&to=${to}`);
      setSetupSql(await res.text());
    } finally {
      setLoadingSql(false);
    }
  };

  const activeNs = from !== to;

  return (
    <div className="rounded-2xl border border-border/40 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-muted/40 text-muted-foreground">
          <ArrowRight size={15} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-foreground">Migrar datos</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Mueve todos los registros de una estrategia a otra sin pérdida</p>
        </div>
        {open ? <ChevronDown size={14} className="text-muted-foreground/50 shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground/50 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3 animate-in slide-in-from-top-1 duration-200">

          {/* Strategy selectors */}
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Desde</p>
              <div className="flex gap-1">
                {MIGRATE_STRATEGIES.map(s => (
                  <button key={s} onClick={() => { setFrom(s); setResult(null); setSetupSql(null); }}
                    className={cn(
                      'text-[9px] px-2.5 py-1 rounded-lg font-mono font-bold border transition-all',
                      from === s
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/40 text-muted-foreground hover:border-primary/30',
                    )}
                  >{s}</button>
                ))}
              </div>
            </div>

            <ArrowRight size={12} className="text-muted-foreground/40 mb-2 shrink-0" />

            <div className="space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Hacia</p>
              <div className="flex gap-1">
                {MIGRATE_STRATEGIES.map(s => (
                  <button key={s} onClick={() => { setTo(s); setResult(null); setSetupSql(null); }}
                    disabled={s === from}
                    className={cn(
                      'text-[9px] px-2.5 py-1 rounded-lg font-mono font-bold border transition-all',
                      to === s
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/40 text-muted-foreground hover:border-primary/30',
                      s === from && 'opacity-30 pointer-events-none',
                    )}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Setup notes per target */}
          {to === 'postgres' && (
            <div className="rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-500/20 px-3 py-2.5">
              <p className="text-[9px] text-emerald-700 dark:text-emerald-400">
                PostgreSQL — no necesitas preparar nada. La tabla <code className="bg-muted px-1 rounded">agnostic_records</code> se crea automáticamente en el primer write.
              </p>
            </div>
          )}
          {to === 'supabase' && (
            <div className="rounded-xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-500/20 px-3 py-2.5 space-y-2">
              <p className="text-[9px] text-amber-700 dark:text-amber-400">
                Supabase (PostgREST) requiere crear las tablas antes de migrar. Considera usar <code className="bg-muted px-1 rounded">DATABASE_URL</code> con la URL de Postgres directa para evitar este paso.
              </p>
              <button
                onClick={fetchSetupSql}
                disabled={loadingSql}
                className="flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                {loadingSql && <Loader2 size={10} className="animate-spin" />}
                Generar SQL de setup (PostgREST)
              </button>
              {setupSql && <CopySnippet text={setupSql} />}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => run(true)}
              disabled={running || !activeNs}
              className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3"
            >
              {running ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              Simular
            </Button>
            <Button
              size="sm"
              onClick={() => run(false)}
              disabled={running || !activeNs}
              className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3"
            >
              {running ? <Loader2 size={10} className="animate-spin" /> : <ArrowRight size={10} />}
              Ejecutar migración
            </Button>
          </div>

          {running && (
            <p className="text-[9px] text-muted-foreground animate-pulse">
              Migrando — esto puede tardar según el volumen de datos...
            </p>
          )}

          {/* Results */}
          {result && (
            <div className={cn(
              'rounded-xl border p-3 space-y-2',
              result.success
                ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-destructive/30 bg-destructive/5',
            )}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-foreground">
                  {result.dryRun ? 'Simulación' : 'Migración'}: {result.from} → {result.to}
                </span>
                <span className={cn(
                  'text-[9px] font-bold uppercase tracking-wider',
                  result.success ? 'text-emerald-600' : 'text-destructive',
                )}>
                  {result.success ? 'OK' : 'ERROR'}
                </span>
              </div>

              {result.error ? (
                <p className="text-[9px] text-destructive font-mono">{result.error}</p>
              ) : (
                <div className="flex gap-4 text-[9px] font-mono text-muted-foreground">
                  <span>espacios: <b className="text-foreground">{result.namespacesScanned}</b></span>
                  <span>leídos: <b className="text-foreground">{result.totalRead}</b></span>
                  <span>escritos: <b className="text-foreground">{result.totalWritten}</b></span>
                  {result.totalErrors > 0 && (
                    <span className="text-destructive">errores: <b>{result.totalErrors}</b></span>
                  )}
                </div>
              )}

              {result.setup_hint && (
                <p className="text-[9px] text-amber-600 dark:text-amber-400">{result.setup_hint}</p>
              )}

              {/* Per-namespace detail — only show non-empty or errored */}
              {result.report.filter(r => !r.skipped || r.errors.length > 0).length > 0 && (
                <div className="space-y-0.5 max-h-44 overflow-y-auto">
                  {result.report
                    .filter(r => !r.skipped || r.errors.length > 0)
                    .map(r => (
                      <div key={r.namespace} className="flex items-center gap-2 py-0.5">
                        <StatusDot status={r.errors.length > 0 ? 'fail' : 'pass'} />
                        <span className="font-mono text-[9px] flex-1 text-foreground/70">{r.namespace}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {r.read} → {r.written}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          <p className="text-[9px] text-muted-foreground italic leading-relaxed">
            La migración es idempotente — ejecutarla varias veces no duplica datos. Mantén ambas estrategias configuradas hasta verificar el destino, luego elimina las variables de la fuente y redesplega.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

type FormMap = {
  github:   { GITHUB_TOKEN: string; GITHUB_REPO: string; GITHUB_BRANCH: string };
  postgres: { DATABASE_URL: string };
  r2:       { CF_ACCOUNT_ID: string; CF_R2_BUCKET: string; CF_R2_ACCESS_KEY_ID: string; CF_R2_SECRET_ACCESS_KEY: string; CF_R2_PUBLIC_URL: string };
  supabase: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  auth:     { SESSION_SECRET: string };
};

const EMPTY_FORMS: FormMap = {
  github:   { GITHUB_TOKEN: '', GITHUB_REPO: '', GITHUB_BRANCH: '' },
  postgres: { DATABASE_URL: '' },
  r2:       { CF_ACCOUNT_ID: '', CF_R2_BUCKET: '', CF_R2_ACCESS_KEY_ID: '', CF_R2_SECRET_ACCESS_KEY: '', CF_R2_PUBLIC_URL: '' },
  supabase: { SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' },
  auth:     { SESSION_SECRET: '' },
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

  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount       = useRef(0);
  const activeDeployRef = useRef<string | null>(null); // tracks deploy.id to avoid count reset on readyState changes

  // process.env.VERCEL is server-only — never accessible in 'use client' bundles.
  // We read isVercel from the health response (server sets it correctly).
  // Default true (disabled) until health loads — prevents a flash of an enabled Save button in dev.
  const isDevMode = !health?.isVercel;

  // ── Health fetch ─────────────────────────────────────────────────────────────

  const fetchHealth = useCallback(() => {
    setLoadingH(true);
    fetch('/api/admin/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoadingH(false));
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  // ── Deploy polling (terminates on terminal state or max attempts) ─────────────
  // Dependencies: [deploy?.id, deploy?.readyState] — effect re-runs when state changes,
  // but pollCount must NOT reset on readyState changes (only on new deployments).

  useEffect(() => {
    if (!deploy?.id || TERMINAL_STATES.has(deploy.readyState)) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }

    // Only reset counter when a genuinely new deployment starts, not on readyState transitions.
    if (deploy.id !== activeDeployRef.current) {
      pollCount.current = 0;
      activeDeployRef.current = deploy.id;
    }

    const deployId = deploy.id; // capture to avoid stale closure
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

  // ── Test ─────────────────────────────────────────────────────────────────────

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
      setTestResults(r => ({ ...r, [strategy]: { componentId: strategy, componentType: 'unknown', status: 'fail', output: 'Error de red', time: new Date().toISOString(), latency_ms: 0 } }));
    } finally {
      setTestingId(null);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

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
        body: JSON.stringify({ variables: nonEmpty, redeploy }),
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
      // Refresh health to reflect new env state
      if (data.saved > 0 && !redeploy) fetchHealth();
    } catch {
      setSaveMsg('Error de red al guardar. Intenta nuevamente.');
    } finally {
      setSavingId(null);
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
    <div className="space-y-4 py-2 animate-in fade-in duration-500">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
            {loadingH
              ? <Loader2 size={13} className="animate-spin text-muted-foreground" />
              : <StatusDot status={globalStatus} />
            }
            Configurador de Servicios
          </h3>
          {health && (
            <p className="text-[9px] text-muted-foreground">
              Estrategia activa: <span className="font-bold text-foreground/70">{health.activeDataStrategy}</span>
              {' · '}
              <span className={cn(
                'font-bold',
                globalStatus === 'pass' ? 'text-emerald-600' : globalStatus === 'warn' ? 'text-amber-600' : 'text-destructive',
              )}>{globalStatus.toUpperCase()}</span>
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchHealth} disabled={loadingH}
          className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3 text-muted-foreground hover:text-primary">
          <RefreshCw size={10} className={cn(loadingH && 'animate-spin')} /> Actualizar
        </Button>
      </div>

      {/* ── Bootstrap gate ──────────────────────────────────────────── */}
      {health && !presence['VERCEL_ACCESS_TOKEN'] && <BootstrapGate />}

      {/* ── Save feedback ───────────────────────────────────────────── */}
      {saveMsg && (
        <div className="px-3 py-2 rounded-xl bg-muted/50 text-[10px] text-muted-foreground border border-border/40">
          {saveMsg}
        </div>
      )}

      {/* ── Deploy status bar ───────────────────────────────────────── */}
      {deploy && (
        <DeployStatusBar deploy={deploy} onDismiss={() => setDeploy(null)} />
      )}

      {/* ── GitHub Strategy ─────────────────────────────────────────── */}
      <StrategyCard
        icon={Github}
        title="Datos — GitHub Strategy"
        subtitle={health?.activeDataStrategy === 'github' ? 'Estrategia activa' : undefined}
        check={githubCk}
        defaultOpen={!githubCk || githubCk.status !== 'pass'}
      >
        <div className="space-y-2">
          <CredentialField name="GITHUB_TOKEN" value={forms.github.GITHUB_TOKEN} onChange={v => setField('github', 'GITHUB_TOKEN', v)} exists={!!presence['GITHUB_TOKEN']} sensitive />
          <CredentialField name="GITHUB_REPO" value={forms.github.GITHUB_REPO} onChange={v => setField('github', 'GITHUB_REPO', v)} exists={!!presence['GITHUB_REPO']} sensitive={false} placeholder="usuario/repositorio" />
          <CredentialField name="GITHUB_BRANCH" value={forms.github.GITHUB_BRANCH} onChange={v => setField('github', 'GITHUB_BRANCH', v)} exists={!!presence['GITHUB_BRANCH']} sensitive={false} placeholder="main (opcional)" />
        </div>
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
        />
      </StrategyCard>

      {/* ── PostgreSQL / Neon ───────────────────────────────────────── */}
      <StrategyCard
        icon={Database}
        title="Datos — PostgreSQL"
        subtitle={
          health?.activeDataStrategy === 'postgres'
            ? 'Estrategia activa'
            : 'Neon · Supabase · Railway · Render'
        }
        check={postgresCk}
        defaultOpen={health?.activeDataStrategy === 'postgres' && postgresCk?.status !== 'pass'}
      >
        <div className="text-[9px] text-muted-foreground px-1 pb-1 leading-relaxed">
          Un único <code className="bg-muted px-1 rounded">DATABASE_URL</code> conecta con cualquier proveedor Postgres estándar.
          Las tablas se crean automáticamente — no necesitas ejecutar SQL de setup.
        </div>
        <div className="space-y-2">
          <CredentialField
            name="DATABASE_URL"
            value={forms.postgres.DATABASE_URL}
            onChange={v => setField('postgres', 'DATABASE_URL', v)}
            exists={!!presence['DATABASE_URL']}
            sensitive
            placeholder="postgresql://user:pass@host/db"
          />
        </div>
        <ActionRow
          onTest={() => handleTest('postgres', { DATABASE_URL: forms.postgres.DATABASE_URL })}
          onSave={(redeploy) => handleSave('postgres', [
            { key: 'DATABASE_URL', value: forms.postgres.DATABASE_URL, sensitive: true },
          ], redeploy)}
          testResult={testResults['postgres'] ?? null}
          testing={testingId === 'postgres'}
          saving={savingId === 'postgres'}
          isDevMode={isDevMode}
        />
      </StrategyCard>

      {/* ── Cloudflare R2 ───────────────────────────────────────────── */}
      <StrategyCard
        icon={Cloud}
        title="Archivos — Cloudflare R2"
        check={r2Ck}
        defaultOpen={!r2Ck || r2Ck.status !== 'pass'}
      >
        <div className="space-y-2">
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
        />
      </StrategyCard>

      {/* ── Supabase ────────────────────────────────────────────────── */}
      <StrategyCard
        icon={Database}
        title="Datos — Supabase (Opcional)"
        subtitle={health?.activeDataStrategy === 'supabase' ? 'Estrategia activa' : 'Alternativa a GitHub Strategy'}
        check={supabaseCk}
        defaultOpen={health?.activeDataStrategy === 'supabase' && supabaseCk?.status !== 'pass'}
      >
        <div className="text-[9px] text-muted-foreground px-1 pb-1">
          Prioridad: <code className="bg-muted px-1 rounded">GITHUB_REPO</code> &gt; <code className="bg-muted px-1 rounded">SUPABASE_URL</code> &gt; Local. Si ambas están configuradas, GitHub gana.
        </div>
        <div className="space-y-2">
          <CredentialField name="SUPABASE_URL" value={forms.supabase.SUPABASE_URL} onChange={v => setField('supabase', 'SUPABASE_URL', v)} exists={!!presence['SUPABASE_URL']} sensitive={false} placeholder="https://xxxx.supabase.co" />
          <CredentialField name="SUPABASE_SERVICE_ROLE_KEY" value={forms.supabase.SUPABASE_SERVICE_ROLE_KEY} onChange={v => setField('supabase', 'SUPABASE_SERVICE_ROLE_KEY', v)} exists={!!presence['SUPABASE_SERVICE_ROLE_KEY']} sensitive />
        </div>
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
        />
      </StrategyCard>

      {/* ── Auth ────────────────────────────────────────────────────── */}
      <StrategyCard
        icon={Shield}
        title="Auth & Seguridad"
        check={sessionCk}
        defaultOpen={!sessionCk || sessionCk.status !== 'pass'}
      >
        <div className="space-y-2">
          <CredentialField name="SESSION_SECRET" value={forms.auth.SESSION_SECRET} onChange={v => setField('auth', 'SESSION_SECRET', v)} exists={!!presence['SESSION_SECRET']} sensitive />
        </div>
        {!presence['SESSION_SECRET'] && (
          <div className="space-y-1.5">
            <p className="text-[9px] text-muted-foreground font-bold">Genera un secreto de 64 caracteres:</p>
            <CopySnippet text={`# PowerShell\n$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()\n$b = New-Object byte[] 32; $rng.GetBytes($b)\n[System.BitConverter]::ToString($b).Replace('-','').ToLower()\n\n# macOS/Linux\nopenssl rand -hex 32`} />
          </div>
        )}
        {/* Session check is purely local (length ≥ 32) — no external connection to test.
            The health status shown in the card header IS the live check result. */}
        <ActionRow
          onTest={fetchHealth}
          onSave={(redeploy) => handleSave('auth', [
            { key: 'SESSION_SECRET', value: forms.auth.SESSION_SECRET, sensitive: true },
          ], redeploy)}
          testResult={sessionCk ?? null}
          testing={loadingH}
          saving={savingId === 'auth'}
          isDevMode={isDevMode}
        />
      </StrategyCard>

      {/* ── Migration Panel ─────────────────────────────────────────── */}
      <MigrationPanel />

      {/* ── .env.local template ─────────────────────────────────────── */}
      <div className="rounded-2xl border bg-muted/20 p-4 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plantilla .env.local</p>
        <CopySnippet text={[
          '# Auth',
          'SESSION_SECRET=',
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
          '# Datos — Supabase (alternativa a GitHub)',
          'SUPABASE_URL=',
          'SUPABASE_SERVICE_ROLE_KEY=',
        ].join('\n')} />
      </div>

    </div>
  );
}
