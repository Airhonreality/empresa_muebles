import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDeployer, getActiveProvider } from '@/core/server/deploy/deployer';

export const dynamic = 'force-dynamic';

interface EnvVarPayload {
  key: string;
  value: string;
  sensitive?: boolean;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { provider?: string; variables: EnvVarPayload[]; redeploy?: boolean };
  const { provider: hintProvider, variables = [], redeploy = false } = body;

  if (variables.length === 0) {
    return NextResponse.json({ error: 'No se recibieron variables para guardar' }, { status: 400 });
  }

  // Determine active cloud provider (either from env or from the incoming payload for bootstrapping)
  let activeCloud = getActiveProvider();
  
  if (!activeCloud && (hintProvider === 'vercel' || hintProvider === 'netlify')) {
    if (hintProvider === 'vercel') {
      const vToken = variables.find(v => v.key === 'VERCEL_ACCESS_TOKEN')?.value;
      const vProjectId = variables.find(v => v.key === 'VERCEL_PROJECT_ID')?.value;
      const vTeamId = variables.find(v => v.key === 'VERCEL_TEAM_ID')?.value;
      if (vToken && vProjectId) {
        activeCloud = {
          provider: 'vercel',
          credentials: { token: vToken, projectId: vProjectId, teamId: vTeamId }
        };
      }
    } else if (hintProvider === 'netlify') {
      const nToken = variables.find(v => v.key === 'NETLIFY_AUTH_TOKEN')?.value;
      const nSiteId = variables.find(v => v.key === 'NETLIFY_SITE_ID')?.value;
      if (nToken && nSiteId) {
        activeCloud = {
          provider: 'netlify',
          credentials: { token: nToken, siteId: nSiteId }
        };
      }
    }
  }

  // Determine if we are running in a local/custom environment that should save to .env.local
  // We only fallback to local save if we are explicitly in development OR if there is no cloud provider available/configured.
  const isLocal = process.env.NODE_ENV === 'development' || !activeCloud;

  if (isLocal) {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      let content = '';
      if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
      }

      const lines = content.split(/\r?\n/);
      
      for (const { key, value } of variables) {
        let found = false;
        const escapedValue = value.replace(/"/g, '\\"');
        const targetLine = `${key}="${escapedValue}"`;

        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(/^\s*([A-Za-z0-9_]+)\s*=/);
          if (match && match[1] === key) {
            lines[i] = targetLine;
            found = true;
            break;
          }
        }

        if (!found) {
          lines.push(targetLine);
        }
      }

      fs.writeFileSync(envPath, lines.join('\n'), 'utf8');

      return NextResponse.json({
        saved: variables.length,
        failed: 0,
        errors: [],
        deployment: null,
        message: process.env.NODE_ENV === 'development' 
          ? 'Variables guardadas localmente en .env.local. Por favor reinicia tu servidor de desarrollo para aplicar los cambios.'
          : 'Variables guardadas en .env.local. Por favor reinicia el contenedor o proceso del servidor manualmente para aplicar los cambios.'
      });
    } catch (err: any) {
      return NextResponse.json({
        error: `Error al guardar localmente en .env.local: ${err.message}`
      }, { status: 500 });
    }
  }

  // (If activeCloud is still null here, isLocal would have been true and we would have returned early above,
  // except if process.env.NODE_ENV === 'development' and they provided activeCloud. Wait, if development and they provide cloud creds,
  // we still save locally above. If they are in production and no activeCloud, they get the local custom deploy logic.)
  
  if (!activeCloud) {
    return NextResponse.json({
      error: 'Debe configurar las credenciales del proveedor cloud (Vercel o Netlify) en las variables de entorno de producción una única vez.',
    }, { status: 503 });
  }

  const { provider, credentials } = activeCloud;
  const deployer = getDeployer(provider);
  const result = await deployer.injectEnv(credentials, variables);

  if (result.errors.length > 0 && result.saved === 0) {
    return NextResponse.json({ error: result.errors.join(', ') }, { status: 502 });
  }

  if (!redeploy) {
    return NextResponse.json({
      saved: result.saved,
      failed: result.failed,
      errors: result.errors,
      deployment: null,
    });
  }

  let deployment = null;
  try {
    deployment = await deployer.redeploy(credentials);
  } catch (err: any) {
    return NextResponse.json({
      saved: result.saved,
      failed: result.failed,
      errors: result.errors,
      deployment: null,
      warning: `Variables guardadas, pero el redespliegue falló: ${err.message}`,
    });
  }

  return NextResponse.json({
    saved: result.saved,
    failed: result.failed,
    errors: result.errors,
    deployment,
  });
}
