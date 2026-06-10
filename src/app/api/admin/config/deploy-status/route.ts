import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const accessToken = process.env.VERCEL_ACCESS_TOKEN;
  const teamId      = process.env.VERCEL_TEAM_ID;

  if (!accessToken) {
    return NextResponse.json({ error: 'VERCEL_ACCESS_TOKEN no configurado' }, { status: 503 });
  }

  const deploymentId = new URL(req.url).searchParams.get('deploymentId');
  if (!deploymentId) {
    return NextResponse.json({ error: 'deploymentId requerido' }, { status: 400 });
  }

  const teamQ = teamId ? `?teamId=${teamId}` : '';
  const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}${teamQ}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Error de Vercel API: ${res.statusText}` }, { status: res.status });
  }

  const data = await res.json() as { id: string; readyState: string; url?: string; errorMessage?: string };

  return NextResponse.json({
    id:           data.id,
    readyState:   data.readyState,
    url:          data.url ? `https://${data.url}` : null,
    errorMessage: data.errorMessage ?? null,
  });
}
