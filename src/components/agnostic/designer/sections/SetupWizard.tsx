'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Database, Github, Cloud, Server, CheckCircle2, AlertCircle,
  Loader2, Rocket, ArrowRight, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CredentialField, StatusDot, DeployStatusBar, CopySnippet } from './DeploySection';

// ─── LOCAL TYPES ──────────────────────────────────────────────────────────────

interface CheckResult {
  componentId: string; componentType: string;
  status: 'pass' | 'fail' | 'warn';
  output?: string; time: string; latency_ms: number;
}

interface DeployState {
  id: string; readyState: string;
  url: string | null; errorMessage: string | null; pollCount: number;
}

type DataStrategy = 'postgres' | 'github' | 'local';
type WizardStep   = 'vercel' | 'data' | 'r2' | 'summary';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS  = 5000;
const MAX_POLL_ATTEMPTS = 72;
const TERMINAL_STATES   = new Set(['READY', 'ERROR', 'CANCELED']);

const SENSITIVE_KEYS = new Set([
  'VERCEL_ACCESS_TOKEN', 'DATABASE_URL', 'GITHUB_TOKEN',
  'CF_R2_ACCESS_KEY_ID', 'CF_R2_SECRET_ACCESS_KEY',
  'SESSION_SECRET', 'SUPABASE_SERVICE_ROLE_KEY',
]);

const STEP_LABELS: Record<WizardStep, string> = {
  vercel:  'Vercel API',
  data:    'Datos',
  r2:      'Archivos',
  summary: 'Deploy',
};

// ─── PUBLIC PROPS ─────────────────────────────────────────────────────────────

export interface SetupWizardProps {
  health: { isVercel: boolean; env_presence: Record<string, boolean> };
  onComplete: () => void;
  onSkip: () => void;
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export function SetupWizard({ health, onComplete, onSkip }: SetupWizardProps) {
  const { isVercel, env_presence: presence } = health;

  const hasVercel = presence.VERCEL_ACCESS_TOKEN && presence.VERCEL_PROJECT_ID;
  const hasData   = presence.DATABASE_URL || presence.GITHUB_REPO || presence.SUPABASE_URL;
  const hasR2     = presence.CF_R2_ACCESS_KEY_ID && presence.CF_R2_BUCKET;

  const steps: WizardStep[] = [];
  if (isVercel && !hasVercel) steps.push('vercel');
  if (!hasData)               steps.push('data');
  if (!hasR2)                 steps.push('r2');
  steps.push('summary');

  const [showWelcome, setShowWelcome] = useState(true);
  const [stepIdx, setStepIdx]         = useState(0);
  const [buffer, setBuffer]           = useState<Record<string, string>>({});
  const [dataStrategy, setDataStrategy] = useState<DataStrategy | null>(null);

  const addToBuffer = useCallback((vars: Record<string, string>) => {
    setBuffer(prev => ({ ...prev, ...vars }));
  }, []);

  const advance = useCallback(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), [steps.length]);
  const goBack  = useCallback(() => setStepIdx(i => Math.max(i - 1, 0)), []);

  const current = steps[stepIdx];

  if (showWelcome) {
    return (
      <WelcomeScreen
        isVercel={isVercel}
        steps={steps}
        onStart={() => setShowWelcome(false)}
        onSkip={onSkip}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <StepShell steps={steps} current={current} onBack={stepIdx > 0 ? goBack : undefined} onSkip={onSkip}>
        {current === 'vercel' && (
          <VercelStep
            presence={presence}
            isVercel={isVercel}
            onAdvance={(vars) => { addToBuffer(vars); advance(); }}
          />
        )}
        {current === 'data' && (
          <DataStrategyStep
            presence={presence}
            onAdvance={(strategy, vars) => { setDataStrategy(strategy); addToBuffer(vars); advance(); }}
          />
        )}
        {current === 'r2' && (
          <R2Step
            presence={presence}
            dataStrategy={dataStrategy}
            onAdvance={(vars) => { addToBuffer(vars); advance(); }}
            onSkip={advance}
          />
        )}
        {current === 'summary' && (
          <SummaryStep
            buffer={buffer}
            isVercel={isVercel}
            onComplete={onComplete}
          />
        )}
      </StepShell>
    </div>
  );
}

// ─── WELCOME SCREEN ───────────────────────────────────────────────────────────

function WelcomeScreen({ isVercel, steps, onStart, onSkip }: {
  isVercel: boolean; steps: WizardStep[];
  onStart: () => void; onSkip: () => void;
}) {
  const ROWS: { icon: React.ElementType; label: string; desc: string; key: WizardStep; cond: boolean }[] = [
    { icon: Server,   label: 'Vercel API',          desc: 'Token para que el panel guarde variables en tu proyecto sin tocar el dashboard.',        key: 'vercel',  cond: isVercel },
    { icon: Database, label: 'Estrategia de datos',  desc: 'PostgreSQL, GitHub o Local — donde viven los registros de tu aplicación.',               key: 'data',    cond: true },
    { icon: Cloud,    label: 'Cloudflare R2',         desc: 'Archivos, imágenes y PDFs subidos por tus usuarios. 10 GB gratis al mes.',               key: 'r2',      cond: true },
  ];

  return (
    <div className="h-full flex items-center justify-center bg-background p-8">
      <div className="max-w-lg w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Rocket size={18} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Setup Wizard</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Tu stack en ~5 minutos</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Acabas de hacer fork del Agnostic System. Hay tres capas que configurar antes de que todo funcione.
          </p>
        </div>

        <div className="rounded-2xl border bg-muted/10 p-6 space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Stack a configurar</p>
          {ROWS.filter(r => r.cond).map(({ icon: Icon, label, desc, key }) => {
            const needed = steps.includes(key);
            return (
              <div key={key} className={cn('flex items-start gap-3', !needed && 'opacity-40')}>
                <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
                  needed ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground')}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 space-y-0.5 pt-0.5 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{label}</p>
                  <p className="text-[9px] text-muted-foreground leading-snug">{desc}</p>
                </div>
                {needed
                  ? <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  : <CheckCircle2 size={14} className="text-emerald-500 mt-1.5 shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={onStart} className="h-10 px-6 text-[10px] font-black uppercase tracking-widest gap-2">
            <ArrowRight size={14} /> Comenzar configuración
          </Button>
          <button onClick={onSkip}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Ya lo sé, ir al panel →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STEP SHELL ───────────────────────────────────────────────────────────────

function StepShell({ steps, current, onBack, onSkip, children }: {
  steps: WizardStep[]; current: WizardStep;
  onBack?: () => void; onSkip: () => void;
  children: React.ReactNode;
}) {
  const currentIdx = steps.indexOf(current);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-8 py-4 flex items-center gap-2 shrink-0 bg-background">
        {steps.map((step, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          return (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 transition-all',
                  active ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : done  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
                )}>
                  {done ? <Check size={10} /> : <span>{i + 1}</span>}
                </div>
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-widest hidden sm:block',
                  active ? 'text-foreground' : done ? 'text-primary/70' : 'text-muted-foreground/40',
                )}>
                  {STEP_LABELS[step]}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-px max-w-10', done ? 'bg-primary/30' : 'bg-border')} />
              )}
            </React.Fragment>
          );
        })}
        <button onClick={onSkip}
          className="ml-auto text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0">
          Omitir →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </div>

      {onBack && (
        <div className="border-t px-8 py-3 shrink-0">
          <button onClick={onBack}
            className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            ← Anterior
          </button>
        </div>
      )}
    </div>
  );
}

// ─── STEP HEADER ─────────────────────────────────────────────────────────────

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1 pb-2 border-b">
      <h2 className="text-base font-black uppercase tracking-widest text-foreground">{title}</h2>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── VERCEL STEP ─────────────────────────────────────────────────────────────

function VercelStep({ presence, isVercel, onAdvance }: {
  presence: Record<string, boolean>;
  isVercel: boolean;
  onAdvance: (vars: Record<string, string>) => void;
}) {
  const [token,     setToken]     = useState('');
  const [projectId, setProjectId] = useState('');
  const [teamId,    setTeamId]    = useState('');

  if (!isVercel) {
    return (
      <div className="space-y-5">
        <StepHeader title="Vercel API" desc="Entorno detectado: desarrollo local." />
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-[10px] text-muted-foreground leading-relaxed">
          Las variables se gestionan en <code className="bg-muted px-1 rounded">.env.local</code> — no necesitas tokens de Vercel en este entorno.
        </div>
        <Button onClick={() => onAdvance({})} className="h-9 text-[10px] font-black uppercase tracking-widest gap-2">
          Continuar <ArrowRight size={12} />
        </Button>
      </div>
    );
  }

  const canAdvance = (!!token || presence.VERCEL_ACCESS_TOKEN) && (!!projectId || presence.VERCEL_PROJECT_ID);

  return (
    <div className="space-y-6">
      <StepHeader
        title="Conectar Vercel API"
        desc="Permite que el panel guarde variables de entorno directamente en tu proyecto sin tocar el dashboard manualmente."
      />

      <div className="rounded-2xl border bg-muted/20 p-5 space-y-3">
        <CredentialField name="VERCEL_ACCESS_TOKEN" value={token} onChange={setToken}
          exists={presence.VERCEL_ACCESS_TOKEN} sensitive placeholder="vercel_pat_..." />
        <CredentialField name="VERCEL_PROJECT_ID" value={projectId} onChange={setProjectId}
          exists={presence.VERCEL_PROJECT_ID} sensitive={false} placeholder="prj_..." />
        <CredentialField name="VERCEL_TEAM_ID" value={teamId} onChange={setTeamId}
          exists={presence.VERCEL_TEAM_ID} sensitive={false} placeholder="team_... (solo cuentas de equipo)" />
      </div>

      <div className="text-[9px] text-muted-foreground space-y-1 leading-relaxed">
        <p>Vercel Dashboard → Settings → Tokens → Create (scope: Full Account)</p>
        <p>Project ID: tu proyecto → Settings → General → Project ID</p>
      </div>

      <p className="text-[9px] text-muted-foreground/50 italic">
        Las credenciales se validan al guardar en el último paso — se envían todas juntas en un único redespliegue.
      </p>

      <Button disabled={!canAdvance}
        onClick={() => onAdvance({
          ...(token     ? { VERCEL_ACCESS_TOKEN: token }   : {}),
          ...(projectId ? { VERCEL_PROJECT_ID: projectId } : {}),
          ...(teamId    ? { VERCEL_TEAM_ID: teamId }       : {}),
        })}
        className="h-9 text-[10px] font-black uppercase tracking-widest gap-2">
        Continuar <ArrowRight size={12} />
      </Button>
    </div>
  );
}

// ─── DATA STRATEGY STEP ───────────────────────────────────────────────────────

const STRATEGY_CARDS: {
  id: DataStrategy; icon: React.ElementType;
  title: string; subtitle: string; warn?: string;
}[] = [
  { id: 'postgres', icon: Database, title: 'PostgreSQL',
    subtitle: 'Neon · Railway · Supabase PG. Zero-DDL. Recomendado para producción.' },
  { id: 'github',   icon: Github,   title: 'GitHub Strategy',
    subtitle: 'Datos en JSON en tu repo. Para proyectos sin uploads masivos.',
    warn: 'Archivos binarios llenan el repositorio. Configura R2 en el paso siguiente.' },
  { id: 'local',    icon: Server,   title: 'Local (Solo desarrollo)',
    subtitle: 'Archivos en disco. No persiste en Vercel — solo para desarrollo.' },
];

function DataStrategyStep({ presence, onAdvance }: {
  presence: Record<string, boolean>;
  onAdvance: (strategy: DataStrategy, vars: Record<string, string>) => void;
}) {
  const [selected,   setSelected]   = useState<DataStrategy | null>(null);
  const [pgUrl,      setPgUrl]      = useState('');
  const [ghToken,    setGhToken]    = useState('');
  const [ghRepo,     setGhRepo]     = useState('');
  const [testResult, setTestResult] = useState<CheckResult | null>(null);
  const [testing,    setTesting]    = useState(false);

  const handleTest = async () => {
    if (!selected || selected === 'local') return;
    setTesting(true);
    setTestResult(null);
    const creds = selected === 'postgres'
      ? { DATABASE_URL: pgUrl }
      : { GITHUB_TOKEN: ghToken, GITHUB_REPO: ghRepo };
    const nonEmpty = Object.fromEntries(Object.entries(creds).filter(([, v]) => v));
    try {
      const res = await fetch('/api/admin/health/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: selected, credentials: nonEmpty }),
      });
      setTestResult(await res.json());
    } catch {
      setTestResult({ componentId: selected, componentType: selected, status: 'fail',
        output: 'Error de red', time: new Date().toISOString(), latency_ms: 0 });
    } finally { setTesting(false); }
  };

  const canTest = selected === 'postgres'
    ? (!!pgUrl || presence.DATABASE_URL)
    : selected === 'github'
    ? (!!ghToken || presence.GITHUB_TOKEN) && (!!ghRepo || presence.GITHUB_REPO)
    : false;

  const canAdvance = selected === 'local'
    || testResult?.status === 'pass'
    || testResult?.status === 'warn';

  const handleAdvance = () => {
    if (!selected) return;
    const vars = selected === 'postgres' ? (pgUrl ? { DATABASE_URL: pgUrl } : {})
      : selected === 'github' ? {
          ...(ghToken ? { GITHUB_TOKEN: ghToken } : {}),
          ...(ghRepo  ? { GITHUB_REPO: ghRepo }   : {}),
        }
      : {};
    onAdvance(selected, vars);
  };

  return (
    <div className="space-y-6">
      <StepHeader
        title="Estrategia de Datos"
        desc="¿Dónde viven los registros de tu aplicación? Determina qué variables necesitas."
      />

      <div className="space-y-2">
        {STRATEGY_CARDS.map(({ id, icon: Icon, title, subtitle, warn }) => (
          <button key={id}
            onClick={() => { setSelected(id); setTestResult(null); }}
            className={cn(
              'w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all',
              selected === id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border/60 hover:border-primary/30 hover:bg-muted/30',
            )}
          >
            <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
              selected === id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{title}</p>
              <p className="text-[9px] text-muted-foreground leading-snug">{subtitle}</p>
              {selected === id && warn && (
                <div className="mt-2 flex items-start gap-1.5 text-[9px] text-amber-600 dark:text-amber-400">
                  <AlertCircle size={10} className="shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              )}
            </div>
            <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-1.5 transition-all',
              selected === id ? 'border-primary bg-primary' : 'border-border')}>
              {selected === id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>

      {selected === 'postgres' && (
        <div className="rounded-2xl border bg-muted/20 p-4 animate-in fade-in duration-200">
          <CredentialField name="DATABASE_URL" value={pgUrl} onChange={setPgUrl}
            exists={presence.DATABASE_URL} sensitive placeholder="postgresql://user:pass@host/db" />
        </div>
      )}
      {selected === 'github' && (
        <div className="rounded-2xl border bg-muted/20 p-4 space-y-3 animate-in fade-in duration-200">
          <CredentialField name="GITHUB_TOKEN" value={ghToken} onChange={setGhToken} exists={presence.GITHUB_TOKEN} sensitive />
          <CredentialField name="GITHUB_REPO"  value={ghRepo}  onChange={setGhRepo}  exists={presence.GITHUB_REPO}  sensitive={false} placeholder="usuario/repositorio" />
        </div>
      )}
      {selected === 'local' && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10 p-3 text-[9px] text-amber-700 dark:text-amber-400 leading-relaxed">
          Local no persiste en Vercel (filesystem efímero). Recomendado solo para desarrollo.
        </div>
      )}

      {selected && selected !== 'local' && (
        <div className="space-y-3">
          {testResult && (
            <div className={cn('flex items-start gap-2 px-3 py-2 rounded-xl text-[10px]',
              testResult.status === 'pass' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : testResult.status === 'warn' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'bg-destructive/10 text-destructive')}>
              <StatusDot status={testResult.status} />
              <span>{testResult.status === 'pass'
                ? `Conexión exitosa (${testResult.latency_ms}ms)`
                : testResult.output ?? 'Error desconocido'}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !canTest}
            className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5">
            {testing ? <Loader2 size={10} className="animate-spin" /> : <Database size={10} />}
            Probar conexión
          </Button>
        </div>
      )}

      {selected && canAdvance && (
        <Button onClick={handleAdvance} className="h-9 text-[10px] font-black uppercase tracking-widest gap-2">
          Continuar <ArrowRight size={12} />
        </Button>
      )}
    </div>
  );
}

// ─── R2 STEP ─────────────────────────────────────────────────────────────────

function R2Step({ presence, dataStrategy, onAdvance, onSkip }: {
  presence: Record<string, boolean>;
  dataStrategy: DataStrategy | null;
  onAdvance: (vars: Record<string, string>) => void;
  onSkip: () => void;
}) {
  const [accountId, setAccountId] = useState('');
  const [bucket,    setBucket]    = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [testResult, setTestResult] = useState<CheckResult | null>(null);
  const [testing,    setTesting]    = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const nonEmpty: Record<string, string> = {};
    if (accountId) nonEmpty.CF_ACCOUNT_ID          = accountId;
    if (bucket)    nonEmpty.CF_R2_BUCKET            = bucket;
    if (accessKey) nonEmpty.CF_R2_ACCESS_KEY_ID     = accessKey;
    if (secretKey) nonEmpty.CF_R2_SECRET_ACCESS_KEY = secretKey;
    try {
      const res = await fetch('/api/admin/health/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: 'r2', credentials: nonEmpty }),
      });
      setTestResult(await res.json());
    } catch {
      setTestResult({ componentId: 'r2', componentType: 'r2', status: 'fail',
        output: 'Error de red', time: new Date().toISOString(), latency_ms: 0 });
    } finally { setTesting(false); }
  };

  const canTest = (!!accountId || presence.CF_ACCOUNT_ID)
    && (!!bucket    || presence.CF_R2_BUCKET)
    && (!!accessKey || presence.CF_R2_ACCESS_KEY_ID)
    && (!!secretKey || presence.CF_R2_SECRET_ACCESS_KEY);

  const canAdvance = testResult?.status === 'pass' || testResult?.status === 'warn';

  const handleAdvance = () => {
    const vars: Record<string, string> = {};
    if (accountId) vars.CF_ACCOUNT_ID          = accountId;
    if (bucket)    vars.CF_R2_BUCKET            = bucket;
    if (accessKey) vars.CF_R2_ACCESS_KEY_ID     = accessKey;
    if (secretKey) vars.CF_R2_SECRET_ACCESS_KEY = secretKey;
    if (publicUrl) vars.CF_R2_PUBLIC_URL        = publicUrl;
    onAdvance(vars);
  };

  return (
    <div className="space-y-6">
      <StepHeader
        title="Almacenamiento de Archivos — Cloudflare R2"
        desc="Donde viven las imágenes, PDFs y archivos que tus usuarios suban. 10 GB gratis/mes. S3-compatible."
      />

      {dataStrategy === 'github' && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10 p-4">
          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-[10px] text-amber-700 dark:text-amber-400">
            <p className="font-black uppercase tracking-widest">Recomendado con GitHub Strategy</p>
            <p>Sin R2, cada archivo subido genera un commit en el repositorio. Con uso real, el repo se llena en días.</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-muted/20 p-5 space-y-3">
        <CredentialField name="CF_ACCOUNT_ID"           value={accountId}  onChange={setAccountId}  exists={presence.CF_ACCOUNT_ID}           sensitive={false} />
        <CredentialField name="CF_R2_BUCKET"             value={bucket}     onChange={setBucket}     exists={presence.CF_R2_BUCKET}             sensitive={false} />
        <CredentialField name="CF_R2_ACCESS_KEY_ID"      value={accessKey}  onChange={setAccessKey}  exists={presence.CF_R2_ACCESS_KEY_ID}      sensitive />
        <CredentialField name="CF_R2_SECRET_ACCESS_KEY"  value={secretKey}  onChange={setSecretKey}  exists={presence.CF_R2_SECRET_ACCESS_KEY}  sensitive />
        <CredentialField name="CF_R2_PUBLIC_URL"         value={publicUrl}  onChange={setPublicUrl}  exists={presence.CF_R2_PUBLIC_URL}         sensitive={false} placeholder="https://pub-xxx.r2.dev (opcional)" />
      </div>

      {testResult && (
        <div className={cn('flex items-start gap-2 px-3 py-2 rounded-xl text-[10px]',
          testResult.status === 'pass' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : testResult.status === 'warn' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
          : 'bg-destructive/10 text-destructive')}>
          <StatusDot status={testResult.status} />
          <span>{testResult.status === 'pass'
            ? `R2 conectado (${testResult.latency_ms}ms)`
            : testResult.output ?? 'Error de conexión R2'}</span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !canTest}
          className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5">
          {testing ? <Loader2 size={10} className="animate-spin" /> : <Cloud size={10} />}
          Probar R2
        </Button>

        {canAdvance && (
          <Button size="sm" onClick={handleAdvance}
            className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5">
            Continuar <ArrowRight size={10} />
          </Button>
        )}

        <button onClick={onSkip}
          className={cn('text-[9px] font-bold uppercase tracking-widest transition-colors',
            dataStrategy === 'github'
              ? 'text-amber-600 dark:text-amber-500 hover:text-amber-700'
              : 'text-muted-foreground hover:text-foreground')}>
          {dataStrategy === 'github' ? 'Omitir (no recomendado)' : 'Omitir — sin uploads'}
        </button>
      </div>
    </div>
  );
}

// ─── SUMMARY STEP ────────────────────────────────────────────────────────────

function SummaryStep({ buffer, isVercel, onComplete }: {
  buffer: Record<string, string>;
  isVercel: boolean;
  onComplete: () => void;
}) {
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [deploy,  setDeploy]  = useState<DeployState | null>(null);

  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount   = useRef(0);
  const deployIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!deploy?.id || TERMINAL_STATES.has(deploy.readyState)) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (deploy?.readyState === 'READY') onComplete();
      return;
    }
    if (deploy.id !== deployIdRef.current) {
      pollCount.current = 0;
      deployIdRef.current = deploy.id;
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
        const res  = await fetch(`/api/admin/config/deploy-status?deploymentId=${deployId}`);
        const data = await res.json() as Partial<DeployState>;
        setDeploy(d => d ? { ...d, ...data, pollCount: pollCount.current } : null);
      } catch { /* keep polling */ }
    }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [deploy?.id, deploy?.readyState, onComplete]);

  const entries = Object.entries(buffer).filter(([, v]) => v.trim() !== '');

  const handleSave = async () => {
    if (entries.length === 0) { onComplete(); return; }
    setSaving(true);
    setSaveMsg(null);
    try {
      const variables = entries.map(([key, value]) => ({
        key, value, sensitive: SENSITIVE_KEYS.has(key),
      }));
      const res  = await fetch('/api/admin/config/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables, redeploy: true }),
      });
      const data = await res.json();
      if (data.deployment) {
        pollCount.current = 0;
        setDeploy({ id: data.deployment.id, readyState: data.deployment.readyState,
          url: data.deployment.url, errorMessage: null, pollCount: 0 });
      } else {
        setSaveMsg(data.warning ?? `${data.saved ?? 0} variable(s) guardadas.`);
      }
    } catch {
      setSaveMsg('Error de red al guardar. Intenta nuevamente.');
    } finally { setSaving(false); }
  };

  const localEnvBlock = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  return (
    <div className="space-y-6">
      <StepHeader
        title="Resumen & Deploy"
        desc={isVercel
          ? 'Se guardarán todas las variables en Vercel en un único redespliegue.'
          : 'Copia el bloque de variables a tu .env.local y reinicia el servidor de desarrollo.'}
      />

      {entries.length > 0 ? (
        <div className="rounded-2xl border bg-muted/20 p-4 space-y-2.5">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Variables a guardar</p>
          {entries.map(([key]) => (
            <div key={key} className="flex items-center gap-3">
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
              <span className="font-mono text-[10px] text-foreground/70 flex-1">{key}</span>
              <span className="font-mono text-[10px] text-muted-foreground/30">{'●'.repeat(6)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 p-4 text-[10px] text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={14} />
          Todas las variables ya estaban configuradas. Puedes ir al panel directamente.
        </div>
      )}

      {deploy && <DeployStatusBar deploy={deploy} onDismiss={() => setDeploy(null)} />}

      {saveMsg && (
        <div className="px-3 py-2 rounded-xl bg-muted/50 text-[10px] text-muted-foreground border">
          {saveMsg}
        </div>
      )}

      {!deploy && (
        isVercel ? (
          <Button onClick={handleSave} disabled={saving}
            className="h-9 text-[10px] font-black uppercase tracking-widest gap-2">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
            {entries.length > 0 ? 'Guardar todo y redesplegar' : 'Ir al panel'}
          </Button>
        ) : (
          <div className="space-y-4">
            {entries.length > 0 && (
              <>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Copia a tu .env.local</p>
                <CopySnippet text={localEnvBlock} />
              </>
            )}
            <Button onClick={onComplete} className="h-9 text-[10px] font-black uppercase tracking-widest gap-2">
              Ir al panel <ArrowRight size={12} />
            </Button>
          </div>
        )
      )}
    </div>
  );
}
