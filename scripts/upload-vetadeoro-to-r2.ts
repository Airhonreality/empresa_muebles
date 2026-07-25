#!/usr/bin/env node
/**
 * Upload Veta de Oro images from local storage to R2 (Cloudflare)
 * Updates storage/db/ URLs to point to R2
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const R2_BUCKET = process.env.CF_R2_BUCKET;
const R2_KEY_ID = process.env.CF_R2_ACCESS_KEY_ID;
const R2_SECRET = process.env.CF_R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.CF_R2_PUBLIC_URL;

if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_KEY_ID || !R2_SECRET || !R2_PUBLIC_URL) {
  console.error('❌ R2 credentials missing in .env.local');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_KEY_ID,
    secretAccessKey: R2_SECRET,
  },
});

async function uploadToR2(filePath: string, key: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  console.log(`  ⬆️  ${key}`);

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

async function main() {
  console.log('🚀 Uploading Veta de Oro images to R2...\n');

  const assetsDir = path.join(process.cwd(), 'storage/assets/vetadeoro');
  const files = await fs.readdir(assetsDir);
  const jpgFiles = files.filter((f) => f.endsWith('.jpg'));

  const urlMap = new Map<string, string>();

  for (const file of jpgFiles) {
    const filePath = path.join(assetsDir, file);
    const r2Key = `vetadeoro/${file}`;
    const r2Url = await uploadToR2(filePath, r2Key);
    urlMap.set(`/api/assets/vetadeoro/${file}`, r2Url);
  }

  console.log('\n📝 Updating database URLs...\n');

  // Update imagenes_portfolio.json
  const imagenPath = path.join(process.cwd(), 'storage/db/imagenes_portfolio.json');
  const imagenes = JSON.parse(await fs.readFile(imagenPath, 'utf-8'));

  for (const rec of imagenes) {
    if (rec.data?.imagen_url && rec.data.imagen_url.includes('/api/assets/vetadeoro/')) {
      const newUrl = urlMap.get(rec.data.imagen_url);
      if (newUrl) {
        rec.data.imagen_url = newUrl;
        console.log(`  ✅ ${rec.id}`);
      }
    }
  }

  await fs.writeFile(imagenPath, JSON.stringify(imagenes, null, 2));

  // Update configuracion_comercial.json
  const configPath = path.join(process.cwd(), 'storage/db/configuracion_comercial.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

  for (const rec of config) {
    if (rec.data?.valor && rec.data.valor.includes('/api/assets/vetadeoro/')) {
      const newUrl = urlMap.get(rec.data.valor);
      if (newUrl) {
        rec.data.valor = newUrl;
        console.log(`  ✅ ${rec.id}`);
      }
    }
  }

  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  console.log('\n✅ Done! Images uploaded to R2 and URLs updated.');
  console.log('📌 Commit these changes and push to make production work.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
