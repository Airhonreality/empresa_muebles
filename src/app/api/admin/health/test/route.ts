import { NextRequest, NextResponse } from 'next/server';
import { checkGitHub, checkR2, checkSupabase } from '@/server/health/checkers';

export const dynamic = 'force-dynamic';

const TESTABLE = ['github', 'r2', 'supabase'] as const;
type TestableStrategy = typeof TESTABLE[number];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { strategy: string; credentials?: Record<string, string> };
    const { strategy, credentials = {} } = body;

    if (!TESTABLE.includes(strategy as TestableStrategy)) {
      return NextResponse.json({ error: `Estrategia "${strategy}" no soporta test en caliente. Estrategias válidas: ${TESTABLE.join(', ')}` }, { status: 400 });
    }

    // Empty string → undefined → checker falls back to process.env.*.
    // This means "Probar" with no inputs tests the existing server configuration.
    const get = (k: string) => credentials[k] || undefined;

    // IIFE ensures TypeScript knows result is always assigned — avoids undefined response.
    const result = await (async () => {
      switch (strategy as TestableStrategy) {
        case 'github':   return checkGitHub(get('GITHUB_TOKEN'), get('GITHUB_REPO'), get('GITHUB_BRANCH'));
        case 'r2':       return checkR2(get('CF_ACCOUNT_ID'), get('CF_R2_BUCKET'), get('CF_R2_ACCESS_KEY_ID'), get('CF_R2_SECRET_ACCESS_KEY'));
        case 'supabase': return checkSupabase(get('SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'));
      }
    })();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
}
