import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const cssPath = path.join(process.cwd(), 'data-silo', 'styles', 'theme.css');
  try {
    const css = await fs.readFile(cssPath, 'utf-8');
    return new NextResponse(css, {
      headers: { 'Content-Type': 'text/css' },
    });
  } catch {
    return new NextResponse('', { status: 204 });
  }
}
