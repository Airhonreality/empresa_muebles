/**
 * 🎨 SATELLITE STYLES ENDPOINT
 * ============================
 * Sirve el CSS compilado del satélite activo.
 *
 * Archivos que lee (en orden de prioridad):
 *   1. storage/[tenant]/styles/compiled.css  → CSS compilado por el satélite
 *      (puede ser output de Tailwind, PostCSS, Bootstrap, vanilla CSS, etc.)
 *   2. Si no existe compiled.css → retorna 204 (No Content), sin error.
 *
 * El tokens.css (overrides de variables) se inyecta en línea desde layout.tsx;
 * este endpoint es sólo para el CSS de utilidades/clases propias del satélite.
 */
import { NextRequest, NextResponse } from 'next/server';
import fs   from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const host         = req.headers.get('host') ?? '';
  const activeTenant = process.env.ACTIVE_TENANT ??
    (host && !host.includes('localhost') ? host.split('.')[0] : 'default');

  const compiledPath = path.join(
    process.cwd(),
    'storage',
    activeTenant,
    'styles',
    'compiled.css',
  );

  try {
    const css = await fs.readFile(compiledPath, 'utf-8');
    return new NextResponse(css, {
      headers: {
        'Content-Type':  'text/css; charset=utf-8',
        // Revalidar cada minuto en producción; en dev siempre fresco.
        'Cache-Control': process.env.NODE_ENV === 'production'
          ? 'public, max-age=60, stale-while-revalidate=300'
          : 'no-cache, no-store',
      },
    });
  } catch {
    // compiled.css no existe todavía — respuesta vacía, sin error.
    return new NextResponse(null, { status: 204 });
  }
}
