import fs from 'fs/promises';
import path from 'path';
import { getStrategyName } from '../src/server/getStrategy';
import { createCliResult, printCliResult, type CliFinding, type CliResult } from './cli-reporter';

type BootstrapState = {
  current_step?: string;
  completed: string[];
  provider?: 'netlify' | 'vercel';
  database?: 'neon' | 'postgres';
  files?: 'r2';
  production_url?: string;
  updated_at: string;
};

type CheckStatus = 'ok' | 'warn' | 'fail';

type BootstrapCheck = {
  id: string;
  status: CheckStatus;
  message: string;
};

type RemoteCheck = BootstrapCheck & {
  metadata?: Record<string, unknown>;
};

const ROOT_DIR = process.env.INIT_CWD || process.cwd();
const STATE_PATH = path.join(ROOT_DIR, '.agno', 'bootstrap-state.json');

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonArray(filePath: string): Promise<any[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err?.code === 'ENOENT') return [];
    throw err;
  }
}

function hasEnv(name: string): boolean {
  return !!process.env[name];
}

function checkUrlLike(value: string | undefined): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function fetchJsonWithTimeout(url: string, init?: RequestInit, timeoutMs = 15000): Promise<{ status: number; json: any }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  } finally {
    clearTimeout(timeout);
  }
}

export async function readBootstrapState(): Promise<BootstrapState | null> {
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    return JSON.parse(raw) as BootstrapState;
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeBootstrapState(patch: Partial<BootstrapState>): Promise<BootstrapState> {
  const existing = await readBootstrapState();
  const next: BootstrapState = {
    ...existing,
    ...patch,
    completed: patch.completed ?? existing?.completed ?? [],
    updated_at: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(next, null, 2) + '\n', 'utf8');
  return next;
}

export async function bootstrapDoctor(): Promise<BootstrapCheck[]> {
  const checks: BootstrapCheck[] = [];
  const storageDb = path.join(ROOT_DIR, 'storage', 'db');
  const schemas = await readJsonArray(path.join(storageDb, 'schema_definitions.json'));
  const routes = await readJsonArray(path.join(storageDb, 'page_routes.json'));
  const scripts = await readJsonArray(path.join(storageDb, 'scripts.json'));
  const activeStrategy = getStrategyName();

  checks.push({
    id: 'storage_root',
    status: await pathExists(path.join(ROOT_DIR, 'storage', 'AGENTS.md')) ? 'ok' : 'fail',
    message: 'storage/AGENTS.md presente',
  });

  checks.push({
    id: 'storage_contract',
    status: await pathExists(storageDb) ? 'ok' : 'warn',
    message: `storage/db detectado. schemas:${schemas.length} routes:${routes.length} zaps:${scripts.length}`,
  });

  checks.push({
    id: 'netlify_config',
    status: await pathExists(path.join(ROOT_DIR, 'netlify.toml')) ? 'ok' : 'warn',
    message: 'netlify.toml requerido para despliegue Netlify reproducible',
  });

  checks.push({
    id: 'hosting_bootstrap',
    status: hasEnv('NETLIFY_AUTH_TOKEN') && hasEnv('NETLIFY_SITE_ID') ? 'ok' : 'warn',
    message: 'NETLIFY_AUTH_TOKEN y NETLIFY_SITE_ID habilitan inyeccion de env y redeploy',
  });

  checks.push({
    id: 'database_url',
    status: hasEnv('DATABASE_URL') ? 'ok' : 'warn',
    message: 'DATABASE_URL debe apuntar a Neon/Postgres pooled para produccion serverless',
  });

  checks.push({
    id: 'active_strategy',
    status: activeStrategy === 'postgres' ? 'ok' : 'warn',
    message: `estrategia activa: ${activeStrategy}. Para produccion objetivo: postgres`,
  });

  checks.push({
    id: 'r2',
    status: hasEnv('CF_ACCOUNT_ID') && hasEnv('CF_R2_BUCKET') && hasEnv('CF_R2_ACCESS_KEY_ID') && hasEnv('CF_R2_SECRET_ACCESS_KEY') ? 'ok' : 'warn',
    message: 'Cloudflare R2 requiere CF_ACCOUNT_ID, CF_R2_BUCKET, CF_R2_ACCESS_KEY_ID y CF_R2_SECRET_ACCESS_KEY',
  });

  checks.push({
    id: 'auth_secrets',
    status: hasEnv('SESSION_SECRET') && hasEnv('API_SECRET_KEY') ? 'ok' : 'warn',
    message: 'SESSION_SECRET y API_SECRET_KEY requeridos para produccion gobernable',
  });

  checks.push({
    id: 'production_url',
    status: checkUrlLike(process.env.PRODUCTION_URL) ? 'ok' : 'warn',
    message: 'PRODUCTION_URL permite verificar la app desplegada desde CLI',
  });

  return checks;
}

export async function printBootstrapDoctor(options: { json?: boolean } = {}): Promise<void> {
  printCliResult(await bootstrapDoctorResult(), options);
}

export async function bootstrapDoctorResult(): Promise<CliResult> {
  const checks = await bootstrapDoctor();
  const counts = checks.reduce((acc, check) => {
    acc[check.status] += 1;
    return acc;
  }, { ok: 0, warn: 0, fail: 0 } as Record<CheckStatus, number>);
  const findings: CliFinding[] = checks
    .filter(check => check.status !== 'ok')
    .map(check => ({
      level: check.status === 'fail' ? 'error' : 'warn',
      code: `AGNO_BOOTSTRAP_${check.id.toUpperCase()}`,
      message: check.message,
      suggestion: bootstrapSuggestion(check.id),
    }));

  return createCliResult({
    command: 'bootstrap doctor',
    summary: { ok: counts.ok, warnings: counts.warn, errors: counts.fail },
    findings,
    metadata: { checks },
  });
}

export async function printBootstrapStatus(): Promise<void> {
  const state = await readBootstrapState();
  console.log('Bootstrap status');
  if (!state) {
    console.log('- state: no existe .agno/bootstrap-state.json');
    return;
  }
  console.log(`- current_step: ${state.current_step ?? 'no_definido'}`);
  console.log(`- completed: ${state.completed.length ? state.completed.join(', ') : 'ninguno'}`);
  if (state.provider) console.log(`- provider: ${state.provider}`);
  if (state.database) console.log(`- database: ${state.database}`);
  if (state.files) console.log(`- files: ${state.files}`);
  if (state.production_url) console.log(`- production_url: ${state.production_url}`);
  console.log(`- updated_at: ${state.updated_at}`);
}

export async function startBootstrapInstall(): Promise<void> {
  const existing = await readBootstrapState();
  const state = await writeBootstrapState(existing ?? {
    current_step: 'preflight',
    completed: [],
    provider: 'netlify',
    database: 'neon',
    files: 'r2',
    production_url: process.env.PRODUCTION_URL,
    updated_at: new Date().toISOString(),
  });

  console.log('Bootstrap install');
  console.log('Primera version instalada: estado persistente y diagnostico.');
  console.log(`- current_step: ${state.current_step ?? 'preflight'}`);
  console.log('- siguiente: npx tsx scripts/agno.ts bootstrap doctor');
  console.log('- esta fase todavia no crea recursos externos ni pide secretos interactivos.');
}

export async function printBootstrapVerify(options: { json?: boolean } = {}): Promise<void> {
  const doctor = await bootstrapDoctorResult();
  const remoteChecks = await bootstrapRemoteVerify();
  const remoteFindings: CliFinding[] = remoteChecks
    .filter(check => check.status !== 'ok')
    .map(check => ({
      level: check.status === 'fail' ? 'error' : 'warn',
      code: `AGNO_REMOTE_${check.id.toUpperCase()}`,
      message: check.message,
      suggestion: check.id.includes('production')
        ? 'Configura PRODUCTION_URL y verifica que el deploy este accesible.'
        : 'Valida token/site id de Netlify.',
      metadata: check.metadata,
    }));

  if (!remoteChecks.length) {
    remoteFindings.push({
      level: 'warn',
      code: 'AGNO_REMOTE_VERIFY_SKIPPED',
      message: 'Verify remoto omitido: configura PRODUCTION_URL y/o NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID.',
      suggestion: 'Carga .env.local con PRODUCTION_URL y credenciales de Netlify para validar el deploy real.',
    });
  }

  printCliResult(createCliResult({
    command: 'bootstrap verify',
    summary: {
      doctor_warnings: doctor.findings.filter(f => f.level === 'warn').length,
      doctor_errors: doctor.findings.filter(f => f.level === 'error').length,
      remote_checks: remoteChecks.length,
    },
    findings: [...doctor.findings, ...remoteFindings],
    metadata: { doctor: doctor.metadata, remoteChecks },
  }), options);
}

export async function bootstrapRemoteVerify(): Promise<RemoteCheck[]> {
  const checks: RemoteCheck[] = [];
  const productionUrl = process.env.PRODUCTION_URL?.replace(/\/+$/, '');

  if (productionUrl) {
    try {
      const health = await fetchJsonWithTimeout(`${productionUrl}/api/admin/health`);
      checks.push({
        id: 'production_health',
        status: health.status < 500 && health.json?.status !== 'fail' ? (health.json?.status === 'pass' ? 'ok' : 'warn') : 'fail',
        message: `GET /api/admin/health -> HTTP ${health.status}`,
        metadata: {
          app_status: health.json?.status ?? 'sin_json',
          active_strategy: health.json?.activeDataStrategy ?? 'desconocida',
          is_netlify: health.json?.isNetlify ?? false,
        },
      });
    } catch (err: any) {
      checks.push({
        id: 'production_health',
        status: 'fail',
        message: err?.message ?? 'No se pudo consultar /api/admin/health',
      });
    }

    try {
      const auth = await fetchJsonWithTimeout(`${productionUrl}/api/auth/status`);
      checks.push({
        id: 'production_auth_status',
        status: auth.status < 500 ? 'ok' : 'fail',
        message: `GET /api/auth/status -> HTTP ${auth.status}`,
        metadata: {
          has_users: auth.json?.has_users ?? 'desconocido',
          can_bootstrap_admin: auth.json?.can_bootstrap_admin ?? 'desconocido',
          active_strategy: auth.json?.active_strategy ?? 'desconocida',
          blockers: Array.isArray(auth.json?.blockers) ? auth.json.blockers.join(' | ') : '',
        },
      });
    } catch (err: any) {
      checks.push({
        id: 'production_auth_status',
        status: 'fail',
        message: err?.message ?? 'No se pudo consultar /api/auth/status',
      });
    }
  }

  if (process.env.NETLIFY_AUTH_TOKEN && process.env.NETLIFY_SITE_ID) {
    try {
      const site = await fetchJsonWithTimeout(`https://api.netlify.com/api/v1/sites/${process.env.NETLIFY_SITE_ID}`, {
        headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` },
      });
      checks.push({
        id: 'netlify_site',
        status: site.status === 200 ? 'ok' : 'fail',
        message: `Netlify site API -> HTTP ${site.status}`,
        metadata: {
          name: site.json?.name ?? 'desconocido',
          url: site.json?.ssl_url ?? site.json?.url ?? 'desconocida',
          repo: site.json?.build_settings?.repo_url ? 'configurado' : 'no_detectado',
        },
      });
    } catch (err: any) {
      checks.push({
        id: 'netlify_site',
        status: 'fail',
        message: err?.message ?? 'No se pudo consultar Netlify API',
      });
    }
  }

  return checks;
}

function bootstrapSuggestion(id: string): string {
  switch (id) {
    case 'hosting_bootstrap': return 'Configura NETLIFY_AUTH_TOKEN y NETLIFY_SITE_ID.';
    case 'database_url': return 'Configura DATABASE_URL pooled/serverless de Neon/Postgres.';
    case 'active_strategy': return 'Asegura que DATABASE_URL tenga prioridad y no quede GITHUB_REPO obsoleto.';
    case 'r2': return 'Configura CF_ACCOUNT_ID, CF_R2_BUCKET, CF_R2_ACCESS_KEY_ID y CF_R2_SECRET_ACCESS_KEY.';
    case 'auth_secrets': return 'Genera SESSION_SECRET y API_SECRET_KEY antes de crear el primer admin.';
    case 'production_url': return 'Configura PRODUCTION_URL para validar health remoto.';
    default: return 'Revisa el bootstrap doctor y completa la configuracion faltante.';
  }
}
