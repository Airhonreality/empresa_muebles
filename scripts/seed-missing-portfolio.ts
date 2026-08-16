import { config } from 'dotenv';
config({ path: '.env.local' });
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { globSync } from 'glob';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db, client } from '../lib/db/client';
import { clientes, proyectos, portafolio } from '../lib/db/schema';
import { eq, like } from 'drizzle-orm';
import crypto from 'crypto';

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

async function getOrCreateCliente() {
  const dummy = await db.select().from(clientes).where(eq(clientes.nombre, 'Dummy Portafolio')).limit(1);
  if (dummy.length > 0) return dummy[0].id;
  
  const id = crypto.randomUUID();
  await db.insert(clientes).values({
    id, nombre: 'Dummy Portafolio', telefono: '0000', email: 'dummy@veta.com'
  });
  return id;
}

async function getOrCreateProyecto(clienteId: string, nombreP: string) {
  const ex = await db.select().from(proyectos).where(eq(proyectos.nombreProyecto, nombreP)).limit(1);
  if (ex.length > 0) return ex[0].id;

  const id = uuidv4();
  await db.insert(proyectos).values({
    id, clienteId, nombreProyecto: nombreP, estado: 'Entregado'
  });
  return id;
}

async function processTxts() {
  const clienteId = await getOrCreateCliente();
  const currentDbPortafolio = await db.select().from(portafolio);

  const txtFiles = globSync(`${SOURCE_DIR}/**/*.txt`.replace(/\\/g, '/'));
  
  for (const txtPath of txtFiles) {
    const parentDirName = path.basename(path.dirname(txtPath));
    const isCarlos = parentDirName.includes('Carlos');
    
    const content = fs.readFileSync(txtPath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let blocks = [{ nombre: parentDirName.trim(), lines: [] as string[] }];
    
    if (isCarlos) {
      blocks = [
        { nombre: 'Carlos Cortes - Tocadores', lines: [] },
        { nombre: 'Carlos Cortes - Centro de TV', lines: [] }
      ];
      let currentBlock = 0;
      for (const line of lines) {
        if (line.toLowerCase().includes('proyecto 2')) {
          currentBlock = 1;
        } else {
          blocks[currentBlock].lines.push(line);
        }
      }
    } else {
      blocks[0].lines = lines;
    }

    for (const block of blocks) {
      if (block.lines.length === 0) continue;
      
      const proyectoNombre = block.nombre;
      const proyectoSlug = slugify(proyectoNombre);
      
      if (currentDbPortafolio.some(p => p.slug === `portafolio-${proyectoSlug}`)) {
        console.log(`Saltando ${proyectoNombre}, ya existe en portafolio.`);
        continue; // ya existe
      }

      console.log(`Procesando faltante: ${proyectoNombre}`);
      const pId = await getOrCreateProyecto(clienteId, proyectoNombre);

      let currentCategoria = 'General';
      let imgCounter = 1;
      const newUrls: string[] = [];
      const uniquePaths = new Set(); // To dedupe text copies

      for (let line of block.lines) {
        if (line.match(/^[a-zA-Z]/) && !line.includes(':\\')) {
          currentCategoria = line.replace(/[:\/]+$/g, '').trim();
          imgCounter = 1;
        } else if (line.includes(':\\')) {
          const srcPath = line.replace(/^['"]|['"]$/g, '');
          if (uniquePaths.has(srcPath)) continue;
          uniquePaths.add(srcPath);

          if (fs.existsSync(srcPath)) {
            const destName = `missing-${slugify(currentCategoria)}-${imgCounter}.webp`;
            const r2Key = `portafolio/${proyectoSlug}/${destName}`;

            try {
              const buffer = await sharp(srcPath).rotate().webp({ quality: 85 }).toBuffer();
              console.log(`Subiendo faltante: ${r2Key}`);
              await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME, Key: r2Key, Body: buffer, ContentType: 'image/webp', CacheControl: "public, max-age=31536000",
              }));
              newUrls.push(`${PUBLIC_DOMAIN}/${r2Key}`);
              imgCounter++;
            } catch(e) { }
          }
        }
      }

      if (newUrls.length > 0) {
        await db.insert(portafolio).values({
          proyectoId: pId,
          titulo: `Proyecto ${proyectoNombre}`,
          categoriaEspacio: 'Residencial',
          galeriaPortafolioUrl: newUrls,
          imagenPortafolioUrl: newUrls[0],
          slug: `portafolio-${proyectoSlug}`,
          publicado: true
        });
        console.log(`Insertado en portafolio: ${proyectoNombre}`);
      }
    }
  }
}

processTxts().then(() => {
  console.log("Completado");
  client.end();
}).catch(console.error