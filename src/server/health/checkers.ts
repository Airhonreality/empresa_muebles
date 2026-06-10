import fs from 'fs/promises';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface CheckResult {
  componentId: string;
  componentType: string;
  status: 'pass' | 'fail' | 'warn';
  output?: string;
  time: string;
  latency_ms: number;
}

const TIMEOUT_MS = 5000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── DATA STRATEGY CHECKERS ──────────────────────────────────────────────────

export async function checkGitHub(
  token    = process.env.GITHUB_TOKEN,
  repo     = process.env.GITHUB_REPO,
  _branch  = process.env.GITHUB_BRANCH ?? 'main',
): Promise<CheckResult> {
  const id = 'github-strategy';
  const type = 'datastore';
  const time = new Date().toISOString();
  const start = Date.now();

  if (!token || !repo) {
    return { componentId: id, componentType: type, status: 'fail', output: 'GITHUB_TOKEN o GITHUB_REPO no configurados', time, latency_ms: 0 };
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    return { componentId: id, componentType: type, status: 'fail', output: 'GITHUB_REPO debe tener formato "owner/repo"', time, latency_ms: 0 };
  }

  try {
    const res = await withTimeout(
      fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
        cache: 'no-store',
      }),
      TIMEOUT_MS,
    );
    const latency_ms = Date.now() - start;

    if (res.status === 401 || res.status === 403) {
      return { componentId: id, componentType: type, status: 'fail', output: 'Token inválido o sin acceso al repositorio', time, latency_ms };
    }
    if (res.status === 404) {
      return { componentId: id, componentType: type, status: 'fail', output: `Repositorio "${repo}" no encontrado`, time, latency_ms };
    }
    if (!res.ok) {
      return { componentId: id, componentType: type, status: 'fail', output: `HTTP ${res.status}: ${res.statusText}`, time, latency_ms };
    }

    const data = await res.json() as { permissions?: { push?: boolean; maintain?: boolean; admin?: boolean } };
    const canWrite = data.permissions?.push === true || data.permissions?.maintain === true || data.permissions?.admin === true;

    if (!canWrite) {
      // Fine-grained tokens may not expose permissions object — treat as warn, not fail
      return { componentId: id, componentType: type, status: 'warn', output: 'Sin permiso de escritura confirmado. Verifica que el token tenga "Contents: Read and write".', time, latency_ms };
    }

    return { componentId: id, componentType: type, status: 'pass', time, latency_ms };
  } catch (err: unknown) {
    return { componentId: id, componentType: type, status: 'fail', output: err instanceof Error ? err.message : 'Error desconocido', time, latency_ms: Date.now() - start };
  }
}

export async function checkSupabase(
  url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY,
): Promise<CheckResult> {
  const id = 'supabase';
  const type = 'datastore';
  const time = new Date().toISOString();
  const start = Date.now();

  if (!url || !key) {
    return { componentId: id, componentType: type, status: 'fail', output: 'SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados', time, latency_ms: 0 };
  }

  try {
    const res = await withTimeout(
      fetch(`${url}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
      }),
      TIMEOUT_MS,
    );
    const latency_ms = Date.now() - start;

    if (res.status === 401 || res.status === 403) {
      return { componentId: id, componentType: type, status: 'fail', output: 'Credenciales Supabase inválidas', time, latency_ms };
    }
    // REST root returns 200 or 400 (no table specified) — both mean the service is reachable
    if (res.ok || res.status === 400) {
      return { componentId: id, componentType: type, status: 'pass', time, latency_ms };
    }
    return { componentId: id, componentType: type, status: 'fail', output: `HTTP ${res.status}: ${res.statusText}`, time, latency_ms };
  } catch (err: unknown) {
    return { componentId: id, componentType: type, status: 'fail', output: err instanceof Error ? err.message : 'Error desconocido', time, latency_ms: Date.now() - start };
  }
}

export async function checkLocal(siloPath: string): Promise<CheckResult> {
  const id = 'local-strategy';
  const type = 'datastore';
  const time = new Date().toISOString();
  const start = Date.now();

  // In Vercel, the filesystem is read-only after build. LocalStrategy is not persistent.
  // This is expected behaviour — return warn (not fail) so it doesn't fail the global status
  // when LocalStrategy is the active fallback and the user hasn't set cloud vars yet.
  if (process.env.VERCEL) {
    return {
      componentId: id, componentType: type, status: 'warn',
      output: 'LocalStrategy no es persistente en Vercel (filesystem de solo lectura). Configura GITHUB_REPO para persistencia real.',
      time, latency_ms: 0,
    };
  }

  try {
    await fs.access(siloPath, fs.constants.W_OK);
    return { componentId: id, componentType: type, status: 'pass', time, latency_ms: Date.now() - start };
  } catch {
    return { componentId: id, componentType: type, status: 'fail', output: `Directorio no escribible: ${siloPath}`, time, latency_ms: Date.now() - start };
  }
}

// ─── STORAGE CHECKER ─────────────────────────────────────────────────────────

export async function checkR2(
  accountId       = process.env.CF_ACCOUNT_ID,
  bucket          = process.env.CF_R2_BUCKET,
  accessKeyId     = process.env.CF_R2_ACCESS_KEY_ID,
  secretAccessKey = process.env.CF_R2_SECRET_ACCESS_KEY,
): Promise<CheckResult> {
  const id = 'cloudflare-r2';
  const type = 'object-store';
  const time = new Date().toISOString();
  const start = Date.now();

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    return { componentId: id, componentType: type, status: 'fail', output: 'Credenciales R2 incompletas', time, latency_ms: 0 };
  }

  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    // PutObject + DeleteObject verifies actual write permissions, not just list.
    // ListObjects only checks s3:ListBucket which is insufficient for upload operations.
    // Both commands share the same timeout budget to prevent partial hangs.
    const healthKey = '.agnostic-health-check';
    await withTimeout(
      (async () => {
        await client.send(new PutObjectCommand({ Bucket: bucket, Key: healthKey, Body: 'ok', ContentType: 'text/plain' }));
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: healthKey }));
      })(),
      TIMEOUT_MS,
    );

    return { componentId: id, componentType: type, status: 'pass', time, latency_ms: Date.now() - start };
  } catch (err: unknown) {
    return { componentId: id, componentType: type, status: 'fail', output: err instanceof Error ? err.message : 'Error desconocido', time, latency_ms: Date.now() - start };
  }
}

// ─── AUTH CHECKER ────────────────────────────────────────────────────────────

export async function checkSession(
  secret = process.env.SESSION_SECRET,
): Promise<CheckResult> {
  const id = 'session-secret';
  const type = 'system';
  const time = new Date().toISOString();

  if (!secret) {
    return { componentId: id, componentType: type, status: 'warn', output: 'SESSION_SECRET no configurado — sistema en modo abierto sin autenticación', time, latency_ms: 0 };
  }
  if (secret.length < 32) {
    return { componentId: id, componentType: type, status: 'warn', output: `SESSION_SECRET demasiado corto (${secret.length} chars). Mínimo: 32`, time, latency_ms: 0 };
  }
  return { componentId: id, componentType: type, status: 'pass', time, latency_ms: 0 };
}
