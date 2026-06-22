import { NextRequest, NextResponse } from 'next/server';
import { checkGitHub, checkR2, checkSupabase, checkPostgres } from '@/server/health/checkers';
import { getDeployer } from '@/core/server/deploy/deployer';

export const dynamic = 'force-dynamic';

const TESTABLE = ['github', 'r2', 'supabase', 'postgres', 'vercel', 'netlify'] as const;
type TestableStrategy = typeof TESTABLE[number];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { strategy: string; credentials?: Record<string, string> };
    const { strategy, credentials = {} } = body;

    if (!TESTABLE.includes(strategy as TestableStrategy)) {
      return NextResponse.json({ error: `Estrategia "${strategy}" no soporta test en caliente. Estrategias válidas: ${TESTABLE.join(', ')}` }, { status: 400 });
    }

    // Empty string → undefined → checker/provider falls back to process.env.*
    const get = (k: string) => credentials[k] || undefined;

    const result = await (async () => {
      switch (strategy as TestableStrategy) {
        case 'github':   return checkGitHub(get('GITHUB_TOKEN'), get('GITHUB_REPO'), get('GITHUB_BRANCH'));
        case 'r2':       return checkR2(get('CF_ACCOUNT_ID'), get('CF_R2_BUCKET'), get('CF_R2_ACCESS_KEY_ID'), get('CF_R2_SECRET_ACCESS_KEY'));
        case 'supabase': return checkSupabase(get('SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'));
        case 'postgres': return checkPostgres(get('DATABASE_URL'));
        case 'vercel': {
          const deployer = getDeployer('vercel');
          const token = get('VERCEL_ACCESS_TOKEN');
          const projectId = get('VERCEL_PROJECT_ID');
          const teamId = get('VERCEL_TEAM_ID');
          
          if (!token || !projectId) {
            return { componentId: 'vercel', componentType: 'hosting', status: 'fail', output: 'VERCEL_ACCESS_TOKEN y VERCEL_PROJECT_ID son obligatorios.', time: new Date().toISOString(), latency_ms: 0 };
          }
          
          const ok = await deployer.validate({ token, projectId, teamId });
          return {
            componentId: 'vercel',
            componentType: 'hosting',
            status: ok ? 'pass' : 'fail',
            output: ok ? 'Conexión con Vercel exitosa.' : 'Token, Project ID o Team ID inválidos.',
            time: new Date().toISOString(),
            latency_ms: 0
          };
        }
        case 'netlify': {
          const deployer = getDeployer('netlify');
          const token = get('NETLIFY_AUTH_TOKEN');
          const siteId = get('NETLIFY_SITE_ID');
          
          if (!token || !siteId) {
            return { componentId: 'netlify', componentType: 'hosting', status: 'fail', output: 'NETLIFY_AUTH_TOKEN y NETLIFY_SITE_ID son obligatorios.', time: new Date().toISOString(), latency_ms: 0 };
          }
          
          const ok = await deployer.validate({ token, siteId });
          return {
            componentId: 'netlify',
            componentType: 'hosting',
            status: ok ? 'pass' : 'fail',
            output: ok ? 'Conexión con Netlify exitosa.' : 'Token o Site ID inválidos.',
            time: new Date().toISOString(),
            latency_ms: 0
          };
        }
      }
    })();

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: `Solicitud inválida: ${err.message}` }, { status: 400 });
  }
}
