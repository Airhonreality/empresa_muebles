import { NextRequest, NextResponse } from 'next/server';
import { getProjectStorageRoot } from '@/server/activeProject';
import fs   from 'fs/promises';
import path from 'path';

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

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
    const sourceUrl = formData.get('sourceUrl') as string | null;

    let buffer: Buffer;
    let mimeType: string;
    let fileName: string;

    if (sourceUrl) {
      const res = await fetch(sourceUrl, {
        headers: { 'User-Agent': BROWSER_USER_AGENT },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: ${res.statusText}` },
          { status: 400 },
        );
      }

      mimeType = res.headers.get('content-type') || '';
      const isHtml = mimeType.includes('text/html');

      if (isHtml) {
        return NextResponse.json(
          { error: 'URL points to a webpage, not an image. Please provide a direct image URL.' },
          { status: 400 },
        );
      }

      if (!ALLOWED_MIME.has(mimeType.split(';')[0])) {
        return NextResponse.json(
          { error: `Content type '${mimeType}' is not allowed.` },
          { status: 415 },
        );
      }

      const contentLength = res.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File exceeds the 5 MB limit.` },
          { status: 413 },
        );
      }

      buffer = Buffer.from(await res.arrayBuffer());
      fileName = path.basename(new URL(sourceUrl).pathname) || `image_${Date.now()}`;
    } else if (file) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `File type '${file.type}' is not allowed.` },
          { status: 415 },
        );
      }
      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File exceeds the 5 MB limit.` },
          { status: 413 },
        );
      }
      buffer = Buffer.from(await file.arrayBuffer());
      mimeType = file.type;
      fileName = file.name;
    } else {
      return NextResponse.json(
        { error: 'No file or sourceUrl provided' },
        { status: 400 },
      );
    }

    const filename = `${Date.now()}-${path.basename(fileName)}`;

    // ── Cloudflare R2 (when CF vars are configured) ──────────────────────────
    const cfAccountId = process.env.CF_ACCOUNT_ID;
    const cfBucket    = process.env.CF_R2_BUCKET;
    const cfKeyId     = process.env.CF_R2_ACCESS_KEY_ID;
    const cfSecret    = process.env.CF_R2_SECRET_ACCESS_KEY;

    if (cfAccountId && cfBucket && cfKeyId && cfSecret) {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${cfAccountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: cfKeyId, secretAccessKey: cfSecret },
      });

      await s3.send(new PutObjectCommand({
        Bucket: cfBucket,
        Key:    filename,
        Body:   buffer,
        ContentType: mimeType,
      }));

      const publicBase = process.env.CF_R2_PUBLIC_URL?.replace(/\/$/, '');
      const url = publicBase ? `${publicBase}/${filename}` : filename;
      return NextResponse.json({ url });
    }

    // ── Local filesystem fallback ────────────────────────────────────────────
    const uploadsDir = path.join(getProjectStorageRoot(), 'assets');
    await fs.mkdir(uploadsDir, { recursive: true });
    const dest = path.join(uploadsDir, filename);
    await fs.writeFile(dest, buffer);
    return NextResponse.json({ url: `/api/assets/${filename}` });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
