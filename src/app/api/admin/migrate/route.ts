import { NextRequest, NextResponse } from 'next/server';
import { GitHubStrategy }  from '@/server/strategies/GitHubStrategy';
import { SupabaseStrategy } from '@/server/strategies/SupabaseStrategy';
import { PostgresStrategy } from '@/server/strategies/PostgresStrategy';
import { LocalStrategy }   from '@/server/strategies/LocalStrategy';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { getProjectStorageRoot } from '@/server/activeProject';
import type { AgnosticBridge } from '@agnostic/core';

export const dynamic = 'force-dynamic';
// Migrations can span many namespaces — requires Vercel Pro (60s) or longer.
// On Hobby plan (10s default) only small datasets will complete in time.
export const maxDuration = 60;

// ─── ADAPTER FACTORY ─────────────────────────────────────────────────────────

function buildAdapter(strategy: string, credentials?: Record<string, string>): { adapter: AgnosticBridge } | { error: string } {
  switch (strategy) {
    case 'github': {
      const repo  = credentials?.GITHUB_REPO || process.env.GITHUB_REPO;
      const token = credentials?.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
      if (!repo || !token) return { error: 'GITHUB_REPO y GITHUB_TOKEN no configurados' };
      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) return { error: 'GITHUB_REPO debe tener formato "owner/repo"' };
      return { adapter: new GitHubStrategy(owner, repoName, token, credentials?.GITHUB_BRANCH || process.env.GITHUB_BRANCH) };
    }
    case 'supabase': {
      const url = credentials?.SUPABASE_URL || process.env.SUPABASE_URL;
      const key = credentials?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) return { error: 'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY no configurados' };
      return { adapter: new SupabaseStrategy(url, key) };
    }
    case 'postgres': {
      const url = credentials?.DATABASE_URL || process.env.DATABASE_URL;
      if (!url) return { error: 'DATABASE_URL no configurado' };
      return { adapter: new PostgresStrategy(url) };
    }
    case 'local': {
      return { adapter: new LocalStrategy(getProjectStorageRoot()) };
    }
    default:
      return { error: `Estrategia desconocida: "${strategy}". Válidas: github, supabase, local` };
  }
}

// ─── NAMESPACE DISCOVERY ─────────────────────────────────────────────────────

async function discoverNamespaces(source: AgnosticBridge): Promise<string[]> {
  const core = Object.values(SYSTEM_NS) as string[];

  try {
    const schemas = await source.read(SYSTEM_NS.SCHEMAS);
    const custom: string[] = [];
    for (const s of schemas) {
      const name = (s.data as Record<string, unknown>)?.slug
        ?? (s.data as Record<string, unknown>)?.name
        ?? null;
      if (name && typeof name === 'string' && !core.includes(name) && !custom.includes(name)) {
        custom.push(name);
      }
    }
    return [...core, ...custom];
  } catch {
    return core;
  }
}

// ─── SQL SETUP GENERATOR ─────────────────────────────────────────────────────
// postgres target: single table, auto-created on first write — no manual SQL needed.
// supabase (PostgREST) target: still requires one table per namespace.

function generateSetupSQL(to: string, namespaces: string[]): string {
  if (to !== 'supabase') {
    return `-- No SQL manual requerido para la estrategia "${to}".
-- PostgresStrategy crea la tabla agnostic_records automáticamente en el primer write.
--
-- Schema de referencia (ya ejecutado por el engine):
CREATE TABLE IF NOT EXISTS agnostic_records (
  id         TEXT        NOT NULL,
  namespace  TEXT        NOT NULL,
  context    TEXT,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (namespace, id)
);
CREATE INDEX IF NOT EXISTS idx_agnostic_ns ON agnostic_records (namespace);`;
  }

  // Legacy Supabase PostgREST: one table per namespace
  const blocks = namespaces.map(ns => `
CREATE TABLE IF NOT EXISTS "${ns}" (
  id          TEXT PRIMARY KEY,
  context     TEXT,
  data        JSONB         NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);`).join('\n');

  return `-- Agnostic System — Supabase (PostgREST) table setup
-- Ejecuta este SQL en el SQL Editor de Supabase ANTES de migrar datos.
-- Considera usar DATABASE_URL con la conexión directa de Postgres en su lugar
-- para no necesitar este paso (PostgresStrategy crea la tabla automáticamente).
${blocks}`;
}

// ─── ROUTE ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    from: string;
    to: string;
    dryRun?: boolean;
    namespaces?: string[];
    credentials?: Record<string, string>;
  };

  const { from, to, dryRun = false, namespaces: nsOverride, credentials } = body;

  if (!from || !to) {
    return NextResponse.json({ error: '"from" y "to" son obligatorios' }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: '"from" y "to" deben ser diferentes' }, { status: 400 });
  }

  const srcResult = buildAdapter(from);
  const dstResult = buildAdapter(to, credentials);

  if ('error' in srcResult) return NextResponse.json({ error: `[origen] ${srcResult.error}` }, { status: 400 });
  if ('error' in dstResult) return NextResponse.json({ error: `[destino] ${dstResult.error}` }, { status: 400 });

  const source = srcResult.adapter;
  const target = dstResult.adapter;

  const namespaces = nsOverride?.length ? nsOverride : await discoverNamespaces(source);

  // ── Migrate ────────────────────────────────────────────────────────────────

  type NsReport = {
    namespace: string;
    read: number;
    written: number;
    skipped: boolean;
    errors: string[];
  };

  const report: NsReport[] = [];

  for (const ns of namespaces) {
    const entry: NsReport = { namespace: ns, read: 0, written: 0, skipped: false, errors: [] };

    try {
      const records = await source.read(ns);
      entry.read = records.length;

      if (records.length === 0) {
        entry.skipped = true;
        report.push(entry);
        continue;
      }

      if (dryRun) {
        entry.written = records.length; // would write
      } else {
        for (const record of records) {
          try {
            await target.write(ns, { id: record.id, data: record.data as Record<string, unknown> });
            entry.written++;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            // Surface table-not-found errors clearly for Supabase targets
            const hint = msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('does not exist')
              ? ' — ejecuta el SQL de setup en Supabase antes de migrar'
              : '';
            entry.errors.push(`${record.id.slice(0, 8)}: ${msg}${hint}`);
          }
        }
      }
    } catch (err: unknown) {
      entry.errors.push(`Lectura fallida: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }

    report.push(entry);
  }

  const totalRead    = report.reduce((s, r) => s + r.read, 0);
  const totalWritten = report.reduce((s, r) => s + r.written, 0);
  const totalErrors  = report.reduce((s, r) => s + r.errors.length, 0);

  return NextResponse.json({
    dryRun,
    from,
    to,
    namespacesScanned: namespaces.length,
    totalRead,
    totalWritten: dryRun ? `${totalWritten} (simulado)` : totalWritten,
    totalErrors,
    success: totalErrors === 0,
    report,
    ...(to === 'supabase' && totalErrors > 0
      ? { setup_hint: 'Ejecuta GET /api/admin/migrate/setup-sql antes de migrar a Supabase' }
      : {}),
  });
}

// ─── SETUP SQL ENDPOINT ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const from = params.get('from') ?? 'github';
  const to   = params.get('to')   ?? 'postgres';

  const srcResult = buildAdapter(from);
  if ('error' in srcResult) {
    return NextResponse.json({ error: srcResult.error }, { status: 400 });
  }

  const namespaces = await discoverNamespaces(srcResult.adapter);
  const sql = generateSetupSQL(to, namespaces);

  return new NextResponse(sql, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
