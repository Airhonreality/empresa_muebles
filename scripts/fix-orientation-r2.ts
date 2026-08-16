import { config } from 'dotenv';
config({ path: '.env.local' });
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { globSync } from 'glob';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const SOURCE_DIR = 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA';
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.CF_R2_BUCKET_NAME!;

function slugify(text: string) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  const txtFiles = globSync(`${SOURCE_DIR}/**/*.txt`.replace(/\\/g, '/'));
  console.log(`Buscando originales en ${txtFiles.length} archivos .txt para auto-rotarlas...`);

  for (const txtPath of txtFiles) {
    const parentDirName = path.basename(path.dirname(txtPath));
    const proyectoNombre = parentDirName.trim();
    const proyectoSlug = slugify(proyectoNombre);

    const content = fs.readFileSync(txtPath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let currentCategoria = 'General';
    let imgCounter = 1;

    for (let line of lines) {
      if (line.match(/^[a-zA-Z]/) && !line.includes(':\\')) {
        currentCategoria = line.replace(/[:\/]+$/g, '').trim();
        imgCounter = 1;
      } else if (line.includes(':\\')) {
        const srcPath = line.replace(/^['"]|['"]$/g, '');
        
        if (fs.existsSync(srcPath)) {
          const catSlug = slugify(currentCategoria);
          const destName = `${catSlug}-${imgCounter}.webp`;
          const r2Key = `portafolio/${proyectoSlug}/${destName}`;

          try {
            // El secreto para arreglar el giro: .rotate() auto-rota basado en EXIF
            const buffer = await sharp(srcPath)
              .rotate() 
              .webp({ quality: 85 })
              .toBuffer();

            console.log(`Re-subiendo rotada correctamente: ${r2Key}...`);
            await s3.send(new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: r2Key,
              Body: buffer,
              ContentType: 'image/webp',
              CacheControl: "public, max-age=31536000",
            }));

            imgCounter++;
          } catch(e: any) {
            console.error(`[ERROR SHARP] ${srcPath}`, e.message);
          }
        }
      }
    }
  }

  console.log('¡Rotaciones aplicadas y sobrescritas en R2!');
}

run().catch(e => {
  console.error("Error fatal:", e);
  process.exit(1);
});
