import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  // Prevent path traversal
  const safeName = path.basename(name);
  const filePath = path.join(process.cwd(), 'data-silo', 'modules', safeName);

  try {
    const code = await fs.readFile(filePath, 'utf-8');
    return new NextResponse(code, {
      headers: { 'Content-Type': 'text/javascript' },
    });
  } catch {
    return NextResponse.json({ error: `Module "${safeName}" not found` }, { status: 404 });
  }
}
