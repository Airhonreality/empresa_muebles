import { NextRequest, NextResponse } from 'next/server';
import { getProjectStorageRoot } from '@/server/activeProject';
import { buildR2S3Config } from '@/server/r2';
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
    const assetsDir = path.join(getProjectStorageRoot(), 'assets');
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

    // ── Cloudflare R2 (when CF vars are configured) ──────────────────────────
    const cfAccountId = process.env.CF_ACCOUNT_ID;
    const cfBucket    = process.env.CF_R2_BUCKET;
    const cfKeyId     = process.env.CF_R2_ACCESS_KEY_ID;
    const cfSecret    = process.env.CF_R2_SECRET_ACCESS_KEY;

    if (cfAccountId && cfBucket && cfKeyId && cfSecret) {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client(buildR2S3Config({
        accountId: cfAccountId,
        accessKeyId: cfKeyId,
        secretAccessKey: cfSecret,
      }));

      const buffer = Buffer.from(await file.arrayBuffer());
      await s3.send(new PutObjectCommand({
        Bucket: cfBucket,
        Key:    filename,
        Body:   buffer,
        ContentType: file.type,
      }));

      const publicBase = process.env.CF_R2_PUBLIC_URL?.replace(/\/$/, '');
      const url = publicBase ? `${publicBase}/${filename}` : filename;
      return NextResponse.json({ url });
    }

    // ── Local filesystem fallback ────────────────────────────────────────────
    const uploadsDir = path.join(getProjectStorageRoot(), 'assets');
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
