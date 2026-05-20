import { NextResponse } from 'next/server';
import { getSiloPath } from '@/server/activeProject';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const cssPath = path.join(getSiloPath(), 'styles', 'theme.css');
  try {
    const css = await fs.readFile(cssPath, 'utf-8');
    return new NextResponse(css, {
      headers: { 
        'Content-Type': 'text/css',
        'Cache-Control': 'no-cache, no-store, must-revalidate' // Keep it fresh during dev, but we could use public, max-age in prod
      },
    });
  } catch {
    return new NextResponse('', { status: 204 });
  }
}
