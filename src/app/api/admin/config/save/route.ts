import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getDeployer, getActiveProvider } from '@/core/server/deploy/deployer';
import { inferOwnerEmailAssignments } from '@/core/server/deploy/provider-owner-email';
import { writeEnvFile } from '@/lib/agnostic/env-file';

export const dynamic = 'force-dynamic';

interface EnvVarPayload {
  key: string;
  value: string;
  sensitive?: boolean;
}

type SaveResponse = {
  saved: number;
  failed: number;
  errors: string[];
  deployment: { id: string; url: string | null; readyState: string } | null;
  message?: string;
  warning?: string;
  error?: string;
  resolvedVariables?: Array<{ key: string; value: string }>;
};

type ActiveCloud = NonNullable<ReturnType<typeof getActiveProvider>>;
type EnvLike = Record<string, string | undefined>;

const OWNER_EMAIL_KEYS = new Set([
  'VERCEL_ACCOUNT_EMAIL',
  'NETLIFY_ACCOUNT_EMAIL',
  'GITHUB_ACCOUNT_EMAIL',
  'DATABASE_ACCOUNT_EMAIL',
  'CF_ACCOUNT_EMAIL',
  'SUPABASE_ACCOUNT_EMAIL',
]);

function normalizeAssignments(variables: EnvVarPayload[]): EnvVarPayload[] {
  const merged = new Map<string, EnvVarPayload>();

  for (const variable of variables) {
    if (!variable.key || !variable.value) continue;
    merged.set(variable.key, variable);
  }

  return [...merged.values()];
}

function splitRuntimeAndMetadata(variables: EnvVarPayload[]): { runtime: EnvVarPayload[]; metadata: EnvVarPayload[] } {
  const runtime: EnvVarPayload[] = [];
  const metadata: EnvVarPayload[] = [];

  for (const variable of variables) {
    if (OWNER_EMAIL_KEYS.has(variable.key)) metadata.push(variable);
    else runtime.push(variable);
  }

  return { runtime, metadata };
}

function applyAssignmentsToProcessEnv(assignments: EnvVarPayload[]): void {
  for (const { key, value } of assignments) {
    process.env[key] = value;
  }
}

function readValue(keys: string[], env: EnvLike): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function buildActiveCloudFromHint(hintProvider: string | undefined, env: EnvLike): ActiveCloud | null {
  if (hintProvider === 'vercel') {
    const vToken = readValue(['VERCEL_ACCESS_TOKEN'], env);
    const vProjectId = readValue(['VERCEL_PROJECT_ID'], env);
    const vTeamId = readValue(['VERCEL_TEAM_ID'], env);
    if (vToken && vProjectId) {
      return {
        provider: 'vercel',
        credentials: { token: vToken, projectId: vProjectId, teamId: vTeamId },
      };
    }
  }

  if (hintProvider === 'netlify') {
    const nToken = readValue(['NETLIFY_AUTH_TOKEN'], env);
    const nSiteId = readValue(['NETLIFY_SITE_ID'], env);
    if (nToken && nSiteId) {
      return {
        provider: 'netlify',
        credentials: { token: nToken, siteId: nSiteId },
      };
    }
  }

  return null;
}

function makeLocalMessage(): string {
  return process.env.NODE_ENV === 'development'
    ? 'Variables guardadas localmente en .env.local. Por favor reinicia tu servidor de desarrollo para aplicar los cambios.'
    : 'Variables guardadas en .env.local. Por favor reinicia el contenedor o proceso del servidor manualmente para aplicar los cambios.';
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { provider?: string; variables: EnvVarPayload[]; redeploy?: boolean };
  const { provider: hintProvider, variables = [], redeploy = false } = body;

  if (variables.length === 0) {
    return NextResponse.json({ error: 'No se recibieron variables para guardar' }, { status: 400 });
  }

  const envSnapshot: Record<string, string | undefined> = { ...process.env };
  const normalizedVariables = normalizeAssignments(variables);
  for (const variable of normalizedVariables) {
    envSnapshot[variable.key] = variable.value;
  }

  const activeCloud = getActiveProvider() ?? buildActiveCloudFromHint(hintProvider, envSnapshot);

  const inferredOwnerVariables = await inferOwnerEmailAssignments(envSnapshot);
  const backupVariables = normalizeAssignments([...normalizedVariables, ...inferredOwnerVariables]);
  const { runtime: runtimeVariables } = splitRuntimeAndMetadata(backupVariables);
  const envPath = path.resolve(process.cwd(), '.env.local');

  try {
    await writeEnvFile(envPath, backupVariables);
    applyAssignmentsToProcessEnv(backupVariables);
  } catch (err: any) {
    return NextResponse.json({
      error: `Error al guardar localmente en .env.local: ${err.message}`,
    }, { status: 500 });
  }

  if (process.env.NODE_ENV === 'development' || !activeCloud) {
    return NextResponse.json({
      saved: backupVariables.length,
      failed: 0,
      errors: [],
      deployment: null,
      resolvedVariables: inferredOwnerVariables,
      message: makeLocalMessage(),
    } satisfies SaveResponse);
  }

  const { provider, credentials } = activeCloud;
  const deployer = getDeployer(provider);
  let result: { saved: number; failed: number; errors: string[] } = {
    saved: 0,
    failed: runtimeVariables.length,
    errors: [],
  };

  if (runtimeVariables.length > 0) {
    try {
      result = await deployer.injectEnv(credentials, runtimeVariables);
    } catch (err: any) {
      result = {
        saved: 0,
        failed: runtimeVariables.length,
        errors: [err?.message ?? String(err)],
      };
    }
  }

  const warning = result.errors.length > 0
    ? `Respaldo local guardado en .env.local; la sincronización remota tuvo incidencias: ${result.errors.join(', ')}`
    : runtimeVariables.length === 0
      ? 'Solo se guardaron metadatos locales; no se ejecutó sincronización remota.'
      : undefined;

  if (!redeploy || runtimeVariables.length === 0 || result.saved === 0) {
    return NextResponse.json({
      saved: backupVariables.length,
      failed: result.failed,
      errors: result.errors,
      deployment: null,
      warning,
      resolvedVariables: inferredOwnerVariables,
    } satisfies SaveResponse);
  }

  let deployment = null;
  try {
    deployment = await deployer.redeploy(credentials);
  } catch (err: any) {
    return NextResponse.json({
      saved: backupVariables.length,
      failed: result.failed,
      errors: result.errors,
      deployment: null,
      warning: warning
        ? `${warning}. Adicionalmente, el redespliegue falló: ${err.message}`
        : `Variables guardadas, pero el redespliegue falló: ${err.message}`,
      resolvedVariables: inferredOwnerVariables,
    } satisfies SaveResponse);
  }

  return NextResponse.json({
    saved: backupVariables.length,
    failed: result.failed,
    errors: result.errors,
    deployment,
    warning,
    resolvedVariables: inferredOwnerVariables,
  } satisfies SaveResponse);
}
