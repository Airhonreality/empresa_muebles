import { NextRequest, NextResponse } from 'next/server';
import { getActiveProvider } from '@/core/server/deploy/deployer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const deploymentId = new URL(req.url).searchParams.get('deploymentId');
  if (!deploymentId) {
    return NextResponse.json({ error: 'deploymentId requerido' }, { status: 400 });
  }

  const activeCloud = getActiveProvider();
  if (!activeCloud) {
    return NextResponse.json({ error: 'Proveedor cloud no configurado' }, { status: 503 });
  }

  const { provider, credentials } = activeCloud;

  if (provider === 'netlify') {
    const { token, siteId } = credentials as { token: string; siteId: string };

    const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deploymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Error de Netlify API: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json() as any;
    let readyState = 'QUEUED';
    if (data.state === 'ready') readyState = 'READY';
    else if (data.state === 'error') readyState = 'ERROR';
    else if (data.state === 'building' || data.state === 'processing') readyState = 'BUILDING';

    return NextResponse.json({
      id:           data.id,
      readyState,
      url:          data.ssl_url ?? data.url ?? null,
      errorMessage: data.error_message ?? null,
    });
  } else {
    const { token, projectId, teamId } = credentials as { token: string; projectId: string; teamId?: string };

    const teamQ = teamId ? `?teamId=${teamId}` : '';
    const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}${teamQ}`, {
      headers: { Authorization: `Bearer ${token}` },
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
}
