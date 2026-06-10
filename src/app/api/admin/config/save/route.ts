import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface EnvVarPayload {
  key: string;
  value: string;
  sensitive?: boolean;
}

export async function POST(req: NextRequest) {
  const accessToken = process.env.VERCEL_ACCESS_TOKEN;
  const projectId   = process.env.VERCEL_PROJECT_ID;
  const teamId      = process.env.VERCEL_TEAM_ID;

  if (!accessToken || !projectId) {
    return NextResponse.json({
      error: 'VERCEL_ACCESS_TOKEN y VERCEL_PROJECT_ID deben configurarse manualmente en el Dashboard de Vercel (Settings → Environment Variables) una única vez.',
    }, { status: 503 });
  }

  const body = await req.json() as { variables: EnvVarPayload[]; redeploy?: boolean };
  const { variables = [], redeploy = false } = body;

  if (variables.length === 0) {
    return NextResponse.json({ error: 'No se recibieron variables para guardar' }, { status: 400 });
  }

  const teamQ  = teamId ? `&teamId=${teamId}` : '';
  const authH  = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  // Save each variable to Vercel — upsert=true overwrites existing values.
  // The inner async throws on both network failure AND Vercel API 4xx/5xx,
  // so Promise.allSettled correctly distinguishes saved vs failed.
  const results = await Promise.allSettled(
    variables.map(async v => {
      const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env?upsert=true${teamQ}`, {
        method: 'POST',
        headers: authH,
        body: JSON.stringify({
          key: v.key,
          value: v.value,
          type: v.sensitive !== false ? 'encrypted' : 'plain',
          target: ['production', 'preview', 'development'],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? res.statusText);
      }
      return res;
    }),
  );

  const saved  = results.filter(r => r.status === 'fulfilled').length;
  const errors: string[] = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      errors.push(`${variables[i].key}: ${(results[i] as PromiseRejectedResult).reason}`);
    }
  }

  if (!redeploy) {
    return NextResponse.json({ saved, failed: variables.length - saved, errors, deployment: null });
  }

  // ── REDEPLOY ─────────────────────────────────────────────────────────────────
  // gitSource is built from VERCEL_GIT_* env vars that Vercel injects automatically
  // into every production deployment. Not available in local dev (guarded above by
  // the 503 check on VERCEL_ACCESS_TOKEN which is prod-only).
  const gitProvider = process.env.VERCEL_GIT_PROVIDER;   // 'github' | 'gitlab' | 'bitbucket'
  const gitRepoId   = process.env.VERCEL_GIT_REPO_ID;    // numeric string, e.g. "123456789"
  const gitRef      = process.env.VERCEL_GIT_COMMIT_REF; // branch name, e.g. "main"

  if (!gitProvider || !gitRepoId || !gitRef) {
    return NextResponse.json({
      saved, failed: variables.length - saved, errors,
      deployment: null,
      warning: 'VERCEL_GIT_* no disponibles. El redeploy automático solo funciona cuando la app está desplegada en Vercel vía Git. Las variables SÍ fueron guardadas.',
    });
  }

  const teamQ2 = teamId ? `?teamId=${teamId}` : '';
  const deployRes = await fetch(`https://api.vercel.com/v13/deployments${teamQ2}`, {
    method: 'POST',
    headers: authH,
    body: JSON.stringify({
      name: projectId,
      target: 'production',
      gitSource: {
        type: gitProvider,
        repoId: gitRepoId,
        ref: gitRef,
      },
    }),
  });

  if (!deployRes.ok) {
    const err = await deployRes.json().catch(() => ({ error: { message: deployRes.statusText } })) as { error?: { message?: string } };
    return NextResponse.json({
      saved, failed: variables.length - saved, errors,
      deployment: null,
      warning: `Variables guardadas, pero el redeploy falló: ${err.error?.message ?? deployRes.statusText}`,
    });
  }

  const deploy = await deployRes.json() as { id: string; url?: string; readyState?: string };
  return NextResponse.json({
    saved,
    failed: variables.length - saved,
    errors,
    deployment: {
      id:         deploy.id,
      url:        deploy.url ? `https://${deploy.url}` : null,
      readyState: deploy.readyState ?? 'QUEUED',
    },
  });
}
