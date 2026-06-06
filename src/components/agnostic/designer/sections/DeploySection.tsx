'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Shield, Github, Cloud, Database, Rocket, Copy, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface EnvStatus {
  auth:    { SESSION_SECRET: boolean };
  github:  { GITHUB_TOKEN: boolean; GITHUB_REPO: boolean; GITHUB_BRANCH: boolean };
  r2:      { CF_ACCOUNT_ID: boolean; CF_R2_BUCKET: boolean; CF_R2_ACCESS_KEY_ID: boolean; CF_R2_SECRET_ACCESS_KEY: boolean; CF_R2_PUBLIC_URL: boolean };
  supabase:{ SUPABASE_URL: boolean; SUPABASE_SERVICE_ROLE_KEY: boolean };
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

function EnvVar({ name, ok }: { name: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <span className="font-mono text-[10px] font-bold text-foreground/80">{name}</span>
      {ok
        ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
        : <XCircle     size={13} className="text-destructive/60 shrink-0" />}
    </div>
  );
}

function CopySnippet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2 bg-muted/40 border rounded-lg px-3 py-2 font-mono text-[10px] text-muted-foreground group">
      <span className="flex-1 break-all">{text}</span>
      <button onClick={handleCopy} className="shrink-0 text-muted-foreground/50 hover:text-primary transition-colors">
        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      </button>
    </div>
  );
}

function Tutorial({ steps }: { steps: { title: string; body: React.ReactNode }[] }) {
  return (
    <ol className="space-y-3 mt-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[9px] font-black">{i + 1}</span>
          <div className="space-y-1.5 flex-1">
            <p className="text-[11px] font-bold text-foreground/80">{step.title}</p>
            <div className="text-[10px] text-muted-foreground leading-relaxed">{step.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ServiceCard({
  icon: Icon, title, vars, ok, children,
}: {
  icon: React.ElementType;
  title: string;
  vars: boolean[];
  ok: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(!ok);

  return (
    <div className={cn(
      'rounded-2xl border shadow-sm overflow-hidden transition-all',
      ok ? 'border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10'
         : 'border-destructive/20 bg-destructive/5 dark:bg-destructive/5',
    )}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className={cn(
          'h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
          ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive/70',
        )}>
          <Icon size={15} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{title}</p>
          <p className={cn('text-[9px] font-bold uppercase tracking-wider mt-0.5',
            ok ? 'text-emerald-600' : 'text-destructive/70',
          )}>
            {ok ? `${vars.length}/${vars.length} configurado` : `${vars.filter(Boolean).length}/${vars.length} configurado`}
          </p>
        </div>
        {open ? <ChevronDown size={14} className="text-muted-foreground/50" /> : <ChevronRight size={14} className="text-muted-foreground/50" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-3 animate-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function DeploySection() {
  const [status, setStatus] = useState<EnvStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/env-status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    fetch('/api/admin/env-status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Rocket size={14} className="animate-bounce" /> Verificando entorno...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2">
        <p className="text-xs font-bold text-destructive">No se pudo leer el estado del entorno.</p>
        <p className="text-[10px] text-muted-foreground">Verifica que /api/admin/env-status responda correctamente.</p>
      </div>
    );
  }

  const allVars = [
    status.auth.SESSION_SECRET,
    status.github.GITHUB_TOKEN, status.github.GITHUB_REPO,
    status.r2.CF_ACCOUNT_ID, status.r2.CF_R2_BUCKET, status.r2.CF_R2_ACCESS_KEY_ID, status.r2.CF_R2_SECRET_ACCESS_KEY,
  ];
  const configuredCount = allVars.filter(Boolean).length;
  const totalCount      = allVars.length;
  const allOk           = configuredCount === totalCount;

  const authOk    = status.auth.SESSION_SECRET;
  const githubOk  = status.github.GITHUB_TOKEN && status.github.GITHUB_REPO;
  const r2Ok      = status.r2.CF_ACCOUNT_ID && status.r2.CF_R2_BUCKET && status.r2.CF_R2_ACCESS_KEY_ID && status.r2.CF_R2_SECRET_ACCESS_KEY;
  const supabaseOk = status.supabase.SUPABASE_URL && status.supabase.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <div className="space-y-5 py-2 animate-in fade-in duration-500">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
            <Rocket size={14} className="text-primary" /> Estado del Despliegue
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {allOk
              ? 'Todas las variables de entorno están configuradas.'
              : `${configuredCount}/${totalCount} variables core configuradas — revisa las secciones en rojo.`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reload}
          className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3 text-muted-foreground hover:text-primary">
          Actualizar
        </Button>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────── */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', allOk ? 'bg-emerald-500' : 'bg-primary')}
          style={{ width: `${(configuredCount / totalCount) * 100}%` }}
        />
      </div>

      {/* ── Auth ─────────────────────────────────────────────────── */}
      <ServiceCard icon={Shield} title="Auth & Seguridad" vars={[status.auth.SESSION_SECRET]} ok={authOk}>
        <EnvVar name="SESSION_SECRET" ok={status.auth.SESSION_SECRET} />
        {!status.auth.SESSION_SECRET && (
          <Tutorial steps={[
            {
              title: 'Genera un secreto de 64 caracteres hexadecimales',
              body: (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground">En PowerShell:</p>
                  <CopySnippet text={`$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $b = New-Object byte[] 32; $rng.GetBytes($b); [System.BitConverter]::ToString($b).Replace('-','').ToLower()`} />
                  <p className="text-[10px] text-muted-foreground mt-1">En macOS/Linux:</p>
                  <CopySnippet text="openssl rand -hex 32" />
                </div>
              ),
            },
            {
              title: 'Añade SESSION_SECRET a tu archivo .env.local (dev) o en Vercel',
              body: (
                <div className="space-y-2">
                  <CopySnippet text="SESSION_SECRET=aqui_pega_el_valor_generado" />
                  <p>En Vercel: <strong>Settings → Environment Variables</strong> → añade <code className="text-[9px] bg-muted px-1 rounded">SESSION_SECRET</code> con el valor.</p>
                </div>
              ),
            },
            {
              title: 'Sin SESSION_SECRET el sistema funciona en modo abierto (sin login)',
              body: <p>Puedes operar sin él en desarrollo. Para producción con usuarios, esta variable es obligatoria.</p>,
            },
          ]} />
        )}
      </ServiceCard>

      {/* ── GitHub Strategy ──────────────────────────────────────── */}
      <ServiceCard icon={Github} title="Datos — GitHub Strategy" vars={[status.github.GITHUB_TOKEN, status.github.GITHUB_REPO]} ok={githubOk}>
        <EnvVar name="GITHUB_TOKEN" ok={status.github.GITHUB_TOKEN} />
        <EnvVar name="GITHUB_REPO"  ok={status.github.GITHUB_REPO} />
        <EnvVar name="GITHUB_BRANCH (opcional)" ok={status.github.GITHUB_BRANCH} />
        {!githubOk && (
          <Tutorial steps={[
            {
              title: 'Crea un Personal Access Token en GitHub',
              body: (
                <div className="space-y-1.5">
                  <p>Ir a <strong>github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens</strong>.</p>
                  <p>Permisos mínimos requeridos: <code className="text-[9px] bg-muted px-1 rounded">Contents: Read and write</code></p>
                  <p>Selecciona el repositorio del fork como repositorio objetivo.</p>
                </div>
              ),
            },
            {
              title: 'Obtén el nombre del repositorio',
              body: (
                <div className="space-y-1.5">
                  <p>El formato es <code className="text-[9px] bg-muted px-1 rounded">usuario/nombre-repo</code>. Por ejemplo:</p>
                  <CopySnippet text="GITHUB_REPO=mi-org/mi-proyecto-clone" />
                </div>
              ),
            },
            {
              title: 'Añade las variables al entorno',
              body: (
                <div className="space-y-1.5">
                  <CopySnippet text={`GITHUB_TOKEN=github_pat_...\nGITHUB_REPO=usuario/repo\nGITHUB_BRANCH=main`} />
                  <p>En Vercel: <strong>Settings → Environment Variables</strong>. No expongas GITHUB_TOKEN en el cliente.</p>
                </div>
              ),
            },
          ]} />
        )}
      </ServiceCard>

      {/* ── Cloudflare R2 ────────────────────────────────────────── */}
      <ServiceCard icon={Cloud} title="Archivos — Cloudflare R2" vars={[status.r2.CF_ACCOUNT_ID, status.r2.CF_R2_BUCKET, status.r2.CF_R2_ACCESS_KEY_ID, status.r2.CF_R2_SECRET_ACCESS_KEY]} ok={r2Ok}>
        <EnvVar name="CF_ACCOUNT_ID"           ok={status.r2.CF_ACCOUNT_ID} />
        <EnvVar name="CF_R2_BUCKET"            ok={status.r2.CF_R2_BUCKET} />
        <EnvVar name="CF_R2_ACCESS_KEY_ID"     ok={status.r2.CF_R2_ACCESS_KEY_ID} />
        <EnvVar name="CF_R2_SECRET_ACCESS_KEY" ok={status.r2.CF_R2_SECRET_ACCESS_KEY} />
        <EnvVar name="CF_R2_PUBLIC_URL (opcional)" ok={status.r2.CF_R2_PUBLIC_URL} />
        {!r2Ok && (
          <Tutorial steps={[
            {
              title: 'Crea una cuenta gratuita en Cloudflare (cloudflare.com)',
              body: <p>El plan gratuito de R2 incluye 10 GB de almacenamiento y 1M de operaciones/mes.</p>,
            },
            {
              title: 'Obtén tu Account ID',
              body: (
                <div className="space-y-1.5">
                  <p>En el Dashboard de Cloudflare, en la barra lateral derecha (o en <strong>Workers & Pages → Overview</strong>), verás el <strong>Account ID</strong>.</p>
                  <CopySnippet text="CF_ACCOUNT_ID=abc123def456..." />
                </div>
              ),
            },
            {
              title: 'Crea un bucket R2',
              body: (
                <div className="space-y-1.5">
                  <p><strong>R2 Object Storage → Create bucket</strong>. Elige un nombre único (sin espacios).</p>
                  <CopySnippet text="CF_R2_BUCKET=mi-proyecto-assets" />
                </div>
              ),
            },
            {
              title: 'Genera las API Keys de R2',
              body: (
                <div className="space-y-1.5">
                  <p><strong>R2 → Manage R2 API Tokens → Create API Token</strong>.</p>
                  <p>Permisos: <code className="text-[9px] bg-muted px-1 rounded">Object Read & Write</code> para el bucket específico.</p>
                  <p>Guarda el <strong>Access Key ID</strong> y <strong>Secret Access Key</strong> — el secreto solo se muestra una vez.</p>
                  <CopySnippet text={`CF_R2_ACCESS_KEY_ID=...\nCF_R2_SECRET_ACCESS_KEY=...`} />
                </div>
              ),
            },
            {
              title: '(Opcional) Habilita acceso público al bucket',
              body: (
                <div className="space-y-1.5">
                  <p>En la configuración del bucket → <strong>Public Access</strong>. Puedes usar el dominio <code className="text-[9px] bg-muted px-1 rounded">pub-xxx.r2.dev</code> de Cloudflare o conectar un dominio propio.</p>
                  <CopySnippet text="CF_R2_PUBLIC_URL=https://pub-xxx.r2.dev" />
                  <p>Sin esta variable, los uploads funcionan pero la URL devuelta es solo el nombre del archivo.</p>
                </div>
              ),
            },
          ]} />
        )}
      </ServiceCard>

      {/* ── Supabase (optional) ──────────────────────────────────── */}
      <ServiceCard
        icon={Database}
        title="Base de Datos — Supabase (Opcional)"
        vars={[status.supabase.SUPABASE_URL, status.supabase.SUPABASE_SERVICE_ROLE_KEY]}
        ok={supabaseOk}
      >
        <EnvVar name="SUPABASE_URL"              ok={status.supabase.SUPABASE_URL} />
        <EnvVar name="SUPABASE_SERVICE_ROLE_KEY" ok={status.supabase.SUPABASE_SERVICE_ROLE_KEY} />
        {!supabaseOk && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-muted/30 text-[10px] text-muted-foreground leading-relaxed">
            Supabase es la estrategia de base de datos relacional. No es obligatoria si usas GitHub Strategy para los datos JSON.
            Configura solo si el manifest del proyecto especifica <code className="text-[9px] bg-muted px-1 rounded">strategy: "supabase"</code>.
          </div>
        )}
        {!supabaseOk && (
          <Tutorial steps={[
            {
              title: 'Crea un proyecto en supabase.com (plan gratuito disponible)',
              body: <p>Proyecto nuevo → guarda el <strong>Project URL</strong> y la <strong>service_role key</strong> (en Settings → API).</p>,
            },
            {
              title: 'Añade las variables al entorno',
              body: (
                <CopySnippet text={`SUPABASE_URL=https://xxxx.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=eyJ...`} />
              ),
            },
          ]} />
        )}
      </ServiceCard>

      {/* ── Quick reference .env template ───────────────────────── */}
      <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plantilla .env.local completa</p>
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
          '# Base de datos — Supabase (opcional)',
          'SUPABASE_URL=',
          'SUPABASE_SERVICE_ROLE_KEY=',
        ].join('\n')} />
      </div>

    </div>
  );
}
