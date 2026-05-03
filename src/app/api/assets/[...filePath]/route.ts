import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filePath: string[] }> }
) {
  const { filePath } = await params;
  const safeParts = filePath.map(p => path.basename(p));
  const absPath = path.join(process.cwd(), 'data-silo', 'assets', ...safeParts);

  try {
    const data = await fs.readFile(absPath);
    const ext = path.extname(absPath).toLowerCase();
    return new NextResponse(data, {
      headers: { 'Content-Type': MIME[ext] ?? 'application/octet-stream' },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
