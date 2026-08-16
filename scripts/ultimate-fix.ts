import { config } from 'dotenv';
config({ path: '.env.local' });
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { globSync } from 'glob';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db, client } from '../lib/db/client';
import { portafolio } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

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
const PUBLIC_DOMAIN = 'https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev';

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
  const currentDbProyectos = await db.select().from(portafolio);
  
  const txtFiles = globSync(`${SOURCE_DIR}/**/*.txt`.replace(/\\/g, '/'));
  console.log(`Buscando originales en ${txtFiles.length} archivos .txt para rotar y renombrar infaliblemente...`);

  for (const txtPath of txtFiles) {
    const parentDirName = path.basename(path.dirname(txtPath));
    const proyectoNombre = parentDirName.trim();
    const proyectoSlug = slugify(proyectoNombre);

    const content = fs.readFileSync(txtPath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let currentCategoria = 'General';
    let imgCounter = 1;
    const newUrls: string[] = [];

    for (let line of lines) {
      if (line.match(/^[a-zA-Z]/) && !line.includes(':\\')) {
        currentCategoria = line.replace(/[:\/]+$/g, '').trim();
        imgCounter = 1;
      } else if (line.includes(':\\')) {
        const srcPath = line.replace(/^['"]|['"]$/g, '');
        
        if (fs.existsSync(srcPath)) {
          const catSlug = slugify(currentCategoria);
          // ACA EL TRUCO: Nombre de archivo completemente NUEVO para aniquilar el cache de edge de Cloudflare
          const destName = `${catSlug}-${imgCounter}-definitivo.webp`;
          const r2Key = `portafolio/${proyectoSlug}/${destName}`;

          try {
            // Se fuerza rotación de EXIF
            const buffer = await sharp(srcPath)
              .rotate() 
              .webp({ quality: 85 })
              .toBuffer();

            console.log(`Subiendo ${r2Key} con nuevo nombre...`);
            await s3.send(new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: r2Key,
              Body: buffer,
              ContentType: 'image/webp',
              CacheControl: "public, max-age=31536000",
            }));
            
            newUrls.push(`${PUBLIC_DOMAIN}/${r2Key}`);
            imgCounter++;
          } catch(e: any) {
            console.error(`[ERROR SHARP] ${srcPath}`, e.message);
          }
        }
      }
    }

    if (newUrls.length > 0) {
      // Buscar cual portafolio es en la BD
      const targetP = currentDbProyectos.find(p => p.slug.includes(proyectoSlug));
      if (targetP) {
        console.log(`Actualizando BD para ${targetP.slug} con ${newUrls.length} fotos nuevas...`);
        await db.update(portafolio)
          .set({ 
            galeriaPortafolioUrl: newUrls, 
            imagenPortafolioUrl: newUrls[0] || null 
          })
          .where(eq(portafolio.id, targetP.id));
      }
    }
  }

  console.log('¡Finalizado todo el renombre!');
  await client.end();
}

run().catch(e => {
  console.error("Error fatal:", e);
  client.end();
  process.exit(1);
});
