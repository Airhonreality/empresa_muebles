import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'data-silo', 'assets');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${path.basename(file.name)}`;
    const dest = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(dest, buffer);

    return NextResponse.json({ url: `/api/assets/${filename}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
