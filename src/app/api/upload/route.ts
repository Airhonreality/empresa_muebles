/**
 * 📁 UPLOAD ENDPOINT (v2.0 — MIME + SIZE HARDENED)
 * =================================================
 * MIME whitelist: images, PDF, plain text, CSV, Excel.
 * Max size: 5 MB.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSiloPath } from '@/server/activeProject';
import fs   from 'fs/promises';
import path from 'path';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function GET() {
  try {
    const assetsDir = path.join(getSiloPath(), 'assets');
    await fs.mkdir(assetsDir, { recursive: true });
    const files = await fs.readdir(assetsDir);
    const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
    const urls = files
      .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .map(f => `/api/assets/${f}`);
    return NextResponse.json({ urls });
  } catch (err) {
    return NextResponse.json({ urls: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `File type '${file.type}' is not allowed.` },
        { status: 415 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds the 5 MB limit (received ${(file.size / 1024 / 1024).toFixed(2)} MB).` },
        { status: 413 },
      );
    }

    const uploadsDir = path.join(getSiloPath(), 'assets');
    await fs.mkdir(uploadsDir, { recursive: true });

    // path.basename strips directory traversal attempts
    const filename = `${Date.now()}-${path.basename(file.name)}`;
    const dest     = path.join(uploadsDir, filename);
    await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/api/assets/${filename}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
