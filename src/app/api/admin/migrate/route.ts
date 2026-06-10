import { NextRequest, NextResponse } from 'next/server';
import { GitHubStrategy } from '@/server/strategies/GitHubStrategy';
import { SupabaseStrategy } from '@/server/strategies/SupabaseStrategy';
import { LocalStrategy } from '@/server/strategies/LocalStrategy';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { getSiloPath } from '@/server/activeProject';
import type { AgnosticBridge } from '@agnostic/core';

export const dynamic = 'force-dynamic';
// Migrations can span many namespaces — requires Vercel Pro (60s) or longer.
// On Hobby plan (10s default) only small datasets will complete in time.
export const maxDuration = 60;

// ─── ADAPTER FACTORY ─────────────────────────────────────────────────────────

function buildAdapter(strategy: string): { adapter: AgnosticBridge } | { error: string } {
  switch (strategy) {
    case 'github': {
      const repo  = process.env.GITHUB_REPO;
      const token = process.env.GITHUB_TOKEN;
      if (!repo || !token) return { error: 'GITHUB_REPO y GITHUB_TOKEN no configurados' };
      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) return { error: 'GITHUB_REPO debe tener formato "owner/repo"' };
      return { adapter: new GitHubStrategy(owner, repoName, token, process.env.GITHUB_BRANCH) };
    }
    case 'supabase': {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) return { error: 'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY no configurados' };
      return { adapter: new SupabaseStrategy(url, key) };
    }
    case 'local': {
      return { adapter: new LocalStrategy(getSiloPath()) };
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

// ─── SQL SETUP GENERATOR (for Supabase target) ───────────────────────────────

function generateSetupSQL(namespaces: string[]): string {
  const blocks = namespaces.map(ns => `
CREATE TABLE IF NOT EXISTS "${ns}" (
  id          TEXT PRIMARY KEY,
  context     TEXT,
  data        JSONB         NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);`).join('\n');

  return `-- Agnostic System — Supabase table setup
-- Run this in the Supabase SQL editor BEFORE migrating data.
-- Tables are safe to run multiple times (IF NOT EXISTS).
${blocks}`;
}

// ─── ROUTE ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    from: string;
    to: string;
    dryRun?: boolean;
    namespaces?: string[];
  };

  const { from, to, dryRun = false, namespaces: nsOverride } = body;

  if (!from || !to) {
    return NextResponse.json({ error: '"from" y "to" son obligatorios' }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: '"from" y "to" deben ser diferentes' }, { status: 400 });
  }

  const srcResult = buildAdapter(from);
  const dstResult = buildAdapter(to);

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
  const from = new URL(req.url).searchParams.get('from') ?? 'github';
  const srcResult = buildAdapter(from);
  if ('error' in srcResult) {
    return NextResponse.json({ error: srcResult.error }, { status: 400 });
  }

  const namespaces = await discoverNamespaces(srcResult.adapter);
  const sql = generateSetupSQL(namespaces);

  return new NextResponse(sql, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
