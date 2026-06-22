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
  const body = await req.json() as { variables: EnvVarPayload[]; redeploy?: boolean };
  const { variables = [], redeploy = false } = body;

  if (variables.length === 0) {
    return NextResponse.json({ error: 'No se recibieron variables para guardar' }, { status: 400 });
  }

  // Determine if we are running in a local environment.
  const isLocal = (
    (!process.env.VERCEL || !process.env.NOW_REGION) &&
    !process.env.NETLIFY
  ) || process.env.NODE_ENV === 'development';

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
        isLocal: true,
        message: 'Variables guardadas localmente en .env.local. Por favor reinicia tu servidor de desarrollo para aplicar los cambios.'
      });
    } catch (err: any) {
      return NextResponse.json({
        error: `Error al guardar localmente en .env.local: ${err.message}`
      }, { status: 500 });
    }
  }

  const activeCloud = getActiveProvider();
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
