import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * 🏛️ ARTEFACTO: route.ts (Bootstrap Endpoint)
 * ────────────
 * CAPA: Server API (Ignition Layer)
 * VERSIÓN: 2.0 (Plan Definitivo)
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - GET: Descubre silos locales escaneando el directorio storage/ buscando carpetas válidas con subcarpeta /db/.
 * - POST:
 *   - action === 'SWITCH': Cambia de proyecto activo actualizando únicamente el master_passport.
 *   - action === 'INIT': Inicializa estructura del silo (db/, manifest.json, arrays vacíos) y lo activa en master_passport.
 */

export async function GET() {
  const storageRoot = path.join(process.cwd(), 'storage');
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const entries = await fs.readdir(storageRoot, { withFileTypes: true });
    
    const allDirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    const tenants: string[] = [];
    
    for (const name of allDirs) {
      try {
        await fs.access(path.join(storageRoot, name, 'db'));
        tenants.push(name);
      } catch {
        // No es un tenant o silo estructurado válido, omitir silenciosamente
      }
    }
    
    return NextResponse.json({
      success: true,
      tenants,
      github_ready: !!process.env.GITHUB_TOKEN
    });
  } catch (err) {
    console.error('[Bootstrap GET] Fail:', err);
    return NextResponse.json({ success: true, tenants: [], github_ready: !!process.env.GITHUB_TOKEN });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action requerida' },
        { status: 400 }
      );
    }

    const storageRoot = path.join(process.cwd(), 'storage');
    const systemConfigPath = path.join(storageRoot, 'system_config.json');

    // ── SWITCH & INIT: Estrategia Local ──────────────────────────────────────
    if (action === 'SWITCH' || action === 'INIT') {
      const { project_identity } = body;
      if (!project_identity) {
        return NextResponse.json(
          { success: false, error: 'project_identity requerido' },
          { status: 400 }
        );
      }

      // Slugify: minúsculas, sin espacios ni caracteres especiales
      const slug = project_identity
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '');

      if (!slug) {
        return NextResponse.json({ success: false, error: 'Nombre inválido' }, { status: 400 });
      }

      if (action === 'SWITCH') {
        const passport = [
          {
            id: 'master_passport',
            context: 'system_config',
            data: {
              project_identity: slug,
              storage_strategy: 'LocalStrategy',
              dna_strategy: 'local',
            },
            updated_at: new Date().toISOString(),
          },
        ];
        await atomicWrite(systemConfigPath, passport);
        return NextResponse.json({ success: true });
      }

      if (action === 'INIT') {
        const dbDir = path.join(storageRoot, slug, 'db');
        await fs.mkdir(dbDir, { recursive: true });

        // 1. Escribir esquemas del tenant inicializados como arrays vacíos
        await atomicWrite(path.join(dbDir, 'page_routes.json'), []);
        await atomicWrite(path.join(dbDir, 'schema_definitions.json'), []);

        // 2. Escribir un manifest.json inicial por defecto
        const manifest = {
          name: slug,
          version: '1.0.0'
        };
        await atomicWrite(path.join(storageRoot, slug, 'manifest.json'), manifest);

        // 3. Activar en master_passport de configuración general
        const passport = [
          {
            id: 'master_passport',
            context: 'system_config',
            data: {
              project_identity: slug,
              storage_strategy: 'LocalStrategy',
              dna_strategy: 'local',
            },
            updated_at: new Date().toISOString(),
          },
        ];
        await atomicWrite(systemConfigPath, passport);

        return NextResponse.json({ success: true });
      }
    }

    // ── CONNECT_GITHUB: Estrategia de Persistencia Remota Soberana ─────────────
    if (action === 'CONNECT_GITHUB') {
      const { github_repo, github_branch = 'main' } = body;
      const token = process.env.GITHUB_TOKEN;

      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'GITHUB_TOKEN no está configurado. Agrégalo como variable de entorno en Vercel o en .env.local.'
        }, { status: 400 });
      }

      if (!github_repo || !github_repo.includes('/')) {
        return NextResponse.json({ success: false, error: 'github_repo inválido. Formato: owner/repo' }, { status: 400 });
      }

      const [owner, repo] = github_repo.split('/');

      // 1. Verificar acceso al repo con el token del entorno
      const verifyRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 
          Authorization: `token ${token}`, 
          Accept: 'application/vnd.github.v3+json' 
        }
      });
      if (!verifyRes.ok) {
        return NextResponse.json({
          success: false,
          error: 'Repositorio no encontrado o GITHUB_TOKEN sin acceso. Verifica que el token tenga scope "repo".'
        }, { status: 403 });
      }

      // 2. Inicializar estructura en el repo si no existe
      const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
      const ghHeaders = { 
        Authorization: `token ${token}`,
        'Content-Type': 'application/json', 
        Accept: 'application/vnd.github.v3+json' 
      };

      const systemConfigContent = JSON.stringify([{
        id: 'master_passport',
        context: 'system_config',
        data: {
          project_identity: github_repo,
          storage_strategy: 'GitHubStrategy',
          github_repo,
          github_branch,
          dna_strategy: 'local',
        },
        updated_at: new Date().toISOString(),
      }], null, 2);

      for (const [filePath, content] of [
        [`db/page_routes.json`, '[]'],
        [`db/schema_definitions.json`, '[]'],
        [`db/system_config.json`, systemConfigContent],
        [`manifest.json`, JSON.stringify({ name: repo, version: '1.0.0' }, null, 2)],
      ] as [string, string][]) {
        const check = await fetch(`${baseUrl}/${filePath}?ref=${github_branch}`, { headers: ghHeaders });
        if (check.status === 404) {
          await fetch(`${baseUrl}/${filePath}`, {
            method: 'PUT', 
            headers: ghHeaders,
            body: JSON.stringify({
              message: `[agnostic] init: ${filePath}`,
              content: Buffer.from(content).toString('base64'),
              branch: github_branch,
            }),
          });
        }
      }

      // 3. Guardar solo la dirección (NO el secreto) en system_config.json
      const passport = [{
        id: 'master_passport',
        context: 'system_config',
        data: {
          project_identity: github_repo,
          storage_strategy: 'GitHubStrategy',
          github_repo,
          github_branch,
          dna_strategy: 'local',
        },
        updated_at: new Date().toISOString()
      }];
      
      try {
        await atomicWrite(systemConfigPath, passport);
      } catch (writeErr: any) {
        if (writeErr.code === 'EROFS' || writeErr.code === 'EACCES') {
          console.warn('[Bootstrap POST] Read-only filesystem detected on Serverless environment. Local config write skipped because env vars are active.');
        } else {
          throw writeErr;
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: `Acción desconocida: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[Bootstrap POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * Escribe datos de forma atómica a un archivo usando un temporal y rename.
 */
async function atomicWrite(filePath: string, data: unknown) {
  const tmp = filePath + '.tmp';
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmp, filePath);
}
