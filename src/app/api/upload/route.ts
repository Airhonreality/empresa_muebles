import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

import { getProjectStorageRoot } from '@/server/activeProject';

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

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllowedContentType(contentType: string) {
  return ALLOWED_MIME.has(contentType) || contentType.startsWith('image/');
}

function cleanFilename(name: string) {
  const base = path.basename(name).trim() || 'asset';
  return base.replace(/[^a-zA-Z0-9._-]/g, '-');
}

async function persistAsset(params: {
  buffer: Buffer;
  contentType: string;
  filename: string;
}) {
  const { buffer, contentType, filename } = params;

  const cfAccountId = process.env.CF_ACCOUNT_ID;
  const cfBucket = process.env.CF_R2_BUCKET;
  const cfKeyId = process.env.CF_R2_ACCESS_KEY_ID;
  const cfSecret = process.env.CF_R2_SECRET_ACCESS_KEY;

  if (cfAccountId && cfBucket && cfKeyId && cfSecret) {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${cfAccountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: cfKeyId,
        secretAccessKey: cfSecret,
      },
    });

    await s3.send(new PutObjectCommand({
      Bucket: cfBucket,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    }));

    const publicBase = process.env.CF_R2_PUBLIC_URL?.replace(/\/$/, '');
    return publicBase ? `${publicBase}/${filename}` : filename;
  }

  const uploadsDir = path.join(getProjectStorageRoot(), 'assets');
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);
  return `/api/assets/${filename}`;
}

export async function GET() {
  try {
    const assetsDir = path.join(getProjectStorageRoot(), 'assets');
    await fs.mkdir(assetsDir, { recursive: true });
    const files = await fs.readdir(assetsDir);
    const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
    const urls = files
      .filter((fileName) => IMAGE_EXTS.has(path.extname(fileName).toLowerCase()))
      .map((fileName) => `/api/assets/${fileName}`);
    return NextResponse.json({ urls });
  } catch {
    return NextResponse.json({ urls: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    let file: File | null = null;
    let sourceUrl = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({} as Record<string, unknown>));
      sourceUrl = String(body.source_url || body.url || '').trim();
    } else {
      const formData = await req.formData();
      file = formData.get('file') as File | null;
      sourceUrl = String(formData.get('source_url') || formData.get('url') || '').trim();
    }

    let buffer: Buffer;
    let mimeType: string;
    let filename: string;

    if (file) {
      if (!isAllowedContentType(file.type)) {
        return NextResponse.json({ error: `File type '${file.type}' is not allowed.` }, { status: 415 });
      }
      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: 'File exceeds the 5 MB limit.' }, { status: 413 });
      }

      buffer = Buffer.from(await file.arrayBuffer());
      mimeType = file.type;
      filename = `${Date.now()}-${cleanFilename(file.name)}`;
    } else if (sourceUrl) {
      if (!isHttpUrl(sourceUrl)) {
        return NextResponse.json({ error: 'Source URL must use http or https.' }, { status: 400 });
      }

      // Send browser-like headers: many image hosts / CDNs return an HTML
      // page (or 403) to header-less server fetches (bot / hotlink protection).
      const response = await fetch(sourceUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });
      if (!response.ok) {
        return NextResponse.json({ error: `Could not fetch source URL (${response.status}).` }, { status: 400 });
      }

      mimeType = (response.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim();
      if (!mimeType.startsWith('image/')) {
        const hint = mimeType.startsWith('text/html')
          ? 'La URL apunta a una página web, no a una imagen. Copia el enlace directo (clic derecho sobre la imagen → "Copiar dirección de imagen").'
          : `El contenido de la URL es '${mimeType}', no una imagen.`;
        return NextResponse.json({ error: hint }, { status: 415 });
      }

      buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: 'File exceeds the 5 MB limit.' }, { status: 413 });
      }

      const sourceName = cleanFilename(path.basename(new URL(sourceUrl).pathname) || 'imagen');
      filename = `${Date.now()}-${sourceName}`;
    } else {
      return NextResponse.json({ error: 'No file or source URL provided' }, { status: 400 });
    }

    const url = await persistAsset({ buffer, contentType: mimeType, filename });
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
