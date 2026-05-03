import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const STORAGE_PATH = process.env.STORAGE_PATH || 'storage/default';
  const cssPath = path.join(process.cwd(), STORAGE_PATH, 'styles', 'theme.css');
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
