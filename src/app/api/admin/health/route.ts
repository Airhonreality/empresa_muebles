import { NextResponse } from 'next/server';
import { checkGitHub, checkSupabase, checkPostgres, checkLocal, checkR2, checkSession, checkCloudDeployer } from '@/server/health/checkers';
import { getProjectStorageRoot } from '@/server/activeProject';
import { collectEnvPresence, resolveStorageStrategyName, type StorageStrategy } from '@/lib/agnostic/env-contract';
import { createPersistenceTopology } from '@/server/definitions/topology';
import { PersistentDefinitionReader } from '@/server/definitions/persistent';
import { resolveDefinitionMode, type DefinitionMode } from '@/lib/agnostic/definition-mode';

export const dynamic = 'force-dynamic';

export async function GET() {
  let activeDataStrategy: StorageStrategy | 'invalid' = 'invalid';
  let storageStrategyError: string | null = null;
  try {
    activeDataStrategy = resolveStorageStrategyName();
  } catch (error) {
    storageStrategyError = error instanceof Error
      ? error.message
      : 'Storage strategy configuration failed.';
  }
  let definitionMode: DefinitionMode | 'invalid' = 'invalid';
  let activeDefinitionRevision: string | null = null;
  let definitionError: string | null = null;
  try {
    definitionMode = resolveDefinitionMode();
    const definitionTopology = createPersistenceTopology();
    if (definitionTopology.revisionStore) {
      const reader = definitionMode === 'shadow'
        ? new PersistentDefinitionReader(definitionTopology.revisionStore)
        : definitionTopology.definitionReader;
      const revision = await reader.readActiveRevision();
      activeDefinitionRevision = revision.id;
    }
  } catch (error) {
    definitionError = error instanceof Error
      ? error.message
      : 'Definition revision check failed.';
  }

  const [github, postgres, r2, supabase, local, session, cloud] = await Promise.all([
    checkGitHub(),
    checkPostgres(),
    checkR2(),
    checkSupabase(),
    checkLocal(getProjectStorageRoot()),
    checkSession(),
    checkCloudDeployer(),
  ]);

  const activeDataCheck =
    activeDataStrategy === 'github'   ? github
    : activeDataStrategy === 'postgres' ? postgres
    : activeDataStrategy === 'supabase' ? supabase
    : local;

  const dataFails = activeDataCheck.status === 'fail'
    || storageStrategyError !== null
    || definitionMode === 'invalid'
    || (definitionMode === 'revision' && definitionError !== null);
  const anyWarn   = [activeDataCheck, r2, session].some(c => c.status === 'warn')
    || (definitionMode === 'shadow' && definitionError !== null);
  const globalStatus = dataFails ? 'fail' : anyWarn ? 'warn' : 'pass';

  return NextResponse.json(
    {
      status: globalStatus,
      description: 'Estado de los servicios del sistema',
      activeDataStrategy,
      storageStrategyError,
      definitionMode,
      activeDefinitionRevision,
      definitionError,
      isDevelopment: process.env.NODE_ENV === 'development',
      isCustomDeploy: process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY && !process.env.NETLIFY_AUTH_TOKEN && !process.env.VERCEL_ACCESS_TOKEN,
      isVercel: !!process.env.VERCEL && !!process.env.NOW_REGION,
      isNetlify: !!process.env.NETLIFY || !!process.env.NETLIFY_AUTH_TOKEN,
      env_presence: collectEnvPresence(),
      checks: {
        'data:github':    [github],
        'data:postgres':  [postgres],
        'storage:r2':     [r2],
        'data:supabase':  [supabase],
        'data:local':     [local],
        'auth:session':   [session],
        'hosting:cloud':  [cloud],
      },
    },
    { status: dataFails ? 503 : 200 },
  );
}
