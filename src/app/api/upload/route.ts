import { NextRequest, NextResponse } from 'next/server';
import { getSiloPath } from '@/server/activeProject';
import fs   from 'fs/promises';
import path from 'path';

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv',
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
  } catch {
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
      return NextResponse.json({ error: `File type '${file.type}' is not allowed.` }, { status: 415 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `File exceeds the 5 MB limit.` }, { status: 413 });
    }

    const filename = `${Date.now()}-${path.basename(file.name)}`;

    // ── Vercel Blob (when BLOB_READ_WRITE_TOKEN is configured) ───────────────
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(filename, file.stream(), {
        access: 'public',
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url });
    }

    // ── Local filesystem fallback ────────────────────────────────────────────
    const uploadsDir = path.join(getSiloPath(), 'assets');
    await fs.mkdir(uploadsDir, { recursive: true });
    const dest = path.join(uploadsDir, filename);
    await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/api/assets/${filename}` });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
