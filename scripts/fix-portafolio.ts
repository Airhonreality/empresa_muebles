import { config } from 'dotenv';
config({ path: '.env.local' });

import { db, client } from '../lib/db/client';
import { proyectos, portafolio } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.CF_R2_BUCKET_NAME!;
const PUBLIC_DOMAIN = process.env.CF_R2_PUBLIC_DOMAIN || `https://${BUCKET_NAME}.r2.cloudflarestorage.com`;

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
  console.log("Recuperando imágenes desde R2...");
  
  const currentDbProyectos = await db.select().from(proyectos);
  const neonProjectSlugsToIds = new Map<string, string>();
  for (const p of currentDbProyectos) {
    const pSlug = slugify(p.nombreProyecto.split('-')[0].trim());
    neonProjectSlugsToIds.set(pSlug, p.id);
  }

  const list = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: 'portafolio/' }));
  if (!list.Contents) {
    console.log("No hay imagenes en R2");
    await client.end();
    return;
  }

  // Agrupar por carpeta (proyecto)
  const proyectosImages = new Map<string, string[]>();
  for (const obj of list.Contents) {
    if (!obj.Key) continue;
    // obj.Key = "portafolio/ciro-rincon/cocina-1.webp"
    const parts = obj.Key.split('/');
    if (parts.length < 3) continue;
    const dirName = parts[1];
    
    if (!proyectosImages.has(dirName)) {
      proyectosImages.set(dirName, []);
    }
    proyectosImages.get(dirName)!.push(`${PUBLIC_DOMAIN}/${obj.Key}`);
  }

  for (const [dirName, urls] of proyectosImages.entries()) {
    let matchedProjectId = neonProjectSlugsToIds.get(dirName);
    if (!matchedProjectId) {
      for (const [slug, id] of neonProjectSlugsToIds.entries()) {
        if (slug.includes(dirName) || dirName.includes(slug)) {
          matchedProjectId = id;
          break;
        }
      }
    }

    if (!matchedProjectId) {
      console.log(`No se encontró proyecto para ${dirName}`);
      continue;
    }

    console.log(`Guardando en DB portafolio: ${dirName} (${urls.length} fotos)`);
    const portafolioSlug = `portafolio-${dirName}-${Date.now().toString().slice(-4)}`;
    
    await db.insert(portafolio).values({
      proyectoId: matchedProjectId,
      titulo: `Proyecto ${dirName.replace(/-/g, ' ')}`,
      slug: portafolioSlug,
      publicado: true,
      categoriaEspacio: 'residencial',
      galeriaPortafolioUrl: urls,
      imagenPortafolioUrl: urls[0],
    });
  }

  console.log("¡Arreglado exitosamente!");
  await client.end();
}

run().catch(e => {
  console.error("Error fatal:", e);
  client.end();
  process.exit(1);
});
