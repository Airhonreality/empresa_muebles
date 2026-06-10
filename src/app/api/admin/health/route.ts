import { NextResponse } from 'next/server';
import { checkGitHub, checkSupabase, checkLocal, checkR2, checkSession } from '@/server/health/checkers';
import { getSiloPath } from '@/server/activeProject';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Mirror exactly the resolution logic of getStrategy.ts (no I/O here, pure env read)
  const activeDataStrategy: 'github' | 'supabase' | 'local' =
    process.env.GITHUB_REPO  ? 'github'
    : process.env.SUPABASE_URL ? 'supabase'
    : 'local';

  const [github, r2, supabase, local, session] = await Promise.all([
    checkGitHub(),
    checkR2(),
    checkSupabase(),
    checkLocal(getSiloPath()),
    checkSession(),
  ]);

  // Global status: only the ACTIVE data strategy determines fail/warn.
  // LocalStrategy returning 'warn' in Vercel is expected — it must not cause 503.
  const activeDataCheck =
    activeDataStrategy === 'github' ? github
    : activeDataStrategy === 'supabase' ? supabase
    : local;

  const dataFails = activeDataCheck.status === 'fail';
  // Only count warns from: active data strategy, storage (R2), and auth.
  // Inactive data strategy checks (e.g. LocalStrategy warn in Vercel when GitHub is active)
  // must NOT pollute the global status — they are expected/informational, not actionable.
  const anyWarn = [activeDataCheck, r2, session].some(c => c.status === 'warn');

  const globalStatus = dataFails ? 'fail' : anyWarn ? 'warn' : 'pass';

  return NextResponse.json(
    {
      status: globalStatus,
      description: 'Estado de los servicios del sistema',
      activeDataStrategy,
      isVercel: !!process.env.VERCEL,
      // Boolean presence map — supersedes /api/admin/env-status
      env_presence: {
        VERCEL_ACCESS_TOKEN:     !!process.env.VERCEL_ACCESS_TOKEN,
        VERCEL_PROJECT_ID:       !!process.env.VERCEL_PROJECT_ID,
        GITHUB_TOKEN:            !!process.env.GITHUB_TOKEN,
        GITHUB_REPO:             !!process.env.GITHUB_REPO,
        GITHUB_BRANCH:           !!process.env.GITHUB_BRANCH,
        CF_ACCOUNT_ID:           !!process.env.CF_ACCOUNT_ID,
        CF_R2_BUCKET:            !!process.env.CF_R2_BUCKET,
        CF_R2_ACCESS_KEY_ID:     !!process.env.CF_R2_ACCESS_KEY_ID,
        CF_R2_SECRET_ACCESS_KEY: !!process.env.CF_R2_SECRET_ACCESS_KEY,
        CF_R2_PUBLIC_URL:        !!process.env.CF_R2_PUBLIC_URL,
        SUPABASE_URL:            !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SESSION_SECRET:          !!process.env.SESSION_SECRET,
      },
      checks: {
        'data:github':   [github],
        'storage:r2':    [r2],
        'data:supabase': [supabase],
        'data:local':    [local],
        'auth:session':  [session],
      },
    },
    { status: dataFails ? 503 : 200 },
  );
}
