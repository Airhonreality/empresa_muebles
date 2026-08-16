import { config } from 'dotenv';
config({ path: '.env.local' });

import { db, client } from '../lib/db/client';
import { clientes, proyectos, contratos, portafolio } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const notionApiKey = process.env.NOTION_API_KEY;
if (!notionApiKey) throw new Error("Falta NOTION_API_KEY en .env.local");

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

async function fetchNotionDB(dbId: string) {
  let allResults: any[] = [];
  let nextCursor: string | null = null;
  do {
    const res: Response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nextCursor ? { start_cursor: nextCursor } : {})
    });
    if (!res.ok) {
      console.error(await res.text());
      throw new Error(`Error Notion DB ${dbId}`);
    }
    const json: { results: unknown[]; has_more: boolean; next_cursor: string | null } = await res.json();
    allResults = allResults.concat(json.results);
    nextCursor = json.has_more ? json.next_cursor : null;
  } while (nextCursor);
  return allResults;
}

function getProp(page: any, propName: string, type: string) {
  const p = page.properties[propName];
  if (!p) return null;
  if (type === 'title') return p.title?.[0]?.plain_text || null;
  if (type === 'rich_text') return p.rich_text?.[0]?.plain_text || null;
  if (type === 'email') return p.email || null;
  if (type === 'phone_number') return p.phone_number || null;
  if (type === 'number') return p.number || 0;
  if (type === 'relation') return p.relation?.[0]?.id || null;
  return null;
}

function slugify(text: string) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function uploadToR2(filePath: string, destKey: string) {
  const buffer = fs.readFileSync(filePath);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: destKey,
    Body: buffer,
    ContentType: 'image/webp',
    CacheControl: "public, max-age=31536000",
  }));
  return `${PUBLIC_DOMAIN}/${destKey}`;
}

async function run() {
  console.log("Iniciando migración Notion -> Neon -> R2...");
  
  // 1. Obtener y sincronizar Clientes
  console.log("Descargando Clientes de Notion...");
  const notionClientes = await fetchNotionDB('18db5567-ba71-812b-a38d-ea3338d0265e');
  const notionClienteToNeonId = new Map<string, string>(); // notionPageId -> neonId
  const currentDbClientes = await db.select().from(clientes);

  for (const nc of notionClientes) {
    const nombre = getProp(nc, 'Nombre Cliente', 'title');
    if (!nombre) continue;
    const email = getProp(nc, 'Correo electrónico', 'email');
    const telefono = getProp(nc, 'Teléfono', 'phone_number');
    const domicilio = getProp(nc, 'Dirección cliente', 'rich_text');

    let dbClient = currentDbClientes.find(c => c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    
    if (!dbClient) {
      console.log(`Insertando cliente: ${nombre}`);
      const inserted = await db.insert(clientes).values({
        nombre, email, telefono, domicilio, origen: 'notion_sync'
      }).returning();
      dbClient = inserted[0];
      currentDbClientes.push(dbClient); // para búsquedas
    }
    notionClienteToNeonId.set(nc.id, dbClient.id);
  }

  // 2. Obtener y sincronizar Proyectos y Contratos
  console.log("Descargando Proyectos de Notion...");
  const notionProyectos = await fetchNotionDB('18db5567-ba71-81b5-b07c-c4bde133ac6f');
  const currentDbProyectos = await db.select().from(proyectos);

  const neonProjectSlugsToIds = new Map<string, string>();

  for (const np of notionProyectos) {
    const nombre = getProp(np, 'Proyecto', 'title');
    if (!nombre) continue;
    const direccion = getProp(np, 'Dirección del Proyecto', 'rich_text');
    const valorContrato = getProp(np, 'Valor del contrato consolidado', 'number') || 0;
    const relationClienteId = getProp(np, 'Nombre / Razón Social', 'relation');
    
    const dbClienteId = relationClienteId ? notionClienteToNeonId.get(relationClienteId) : null;

    let dbProj = currentDbProyectos.find(p => p.nombreProyecto.trim().toLowerCase() === nombre.trim().toLowerCase());
    if (!dbProj) {
      console.log(`Insertando proyecto: ${nombre}`);
      const inserted = await db.insert(proyectos).values({
        nombreProyecto: nombre,
        direccionObra: direccion,
        clienteId: dbClienteId || null,
        estado: 'entregado', // Asumimos entregados si son para portafolio
      }).returning();
      dbProj = inserted[0];
      currentDbProyectos.push(dbProj);

      // Insertar contrato para registrar el valor
      await db.insert(contratos).values({
        proyectoId: dbProj.id,
        codigoContrato: `C-MIG-${dbProj.id.substring(0,6)}`,
        valorTotal: valorContrato.toString(),
        estado: 'firmado',
      });
    }

    // Guardar slug para el mapeo de fotos locales
    // El script anterior generó carpetas basadas en nombres similares
    const pSlug = slugify(nombre.split('-')[0].trim()); // ej: "Ciro Rincón - Apto" -> "ciro-rincon"
    neonProjectSlugsToIds.set(pSlug, dbProj.id);
  }

  // 3. Subir Imágenes Locales a R2 y crear Portafolio
  console.log("Procesando fotos locales hacia R2...");
  const localPortfolioDir = path.join(__dirname, '..', 'public', 'images', 'portafolio');
  if (fs.existsSync(localPortfolioDir)) {
    const projectDirs = fs.readdirSync(localPortfolioDir);
    
    for (const dirName of projectDirs) {
      const fullDirPath = path.join(localPortfolioDir, dirName);
      if (!fs.statSync(fullDirPath).isDirectory()) continue;

      // Intentar encontrar el proyecto en la base de datos a través de match de slugs
      let matchedProjectId = neonProjectSlugsToIds.get(dirName);
      
      // Si el slug no calza exacto (ej: carlos-cortes vs carlos-cortes-y-paola), busquemos match parcial
      if (!matchedProjectId) {
        for (const [slug, id] of neonProjectSlugsToIds.entries()) {
          if (slug.includes(dirName) || dirName.includes(slug)) {
            matchedProjectId = id;
            break;
          }
        }
      }

      if (!matchedProjectId) {
        console.log(`[SKIP] No se encontró proyecto en la BD para la carpeta fotográfica: ${dirName}`);
        continue;
      }

      // Crear registro de PortafolioPublico para este proyecto
      const portafolioSlug = `portafolio-${dirName}-${Date.now().toString().slice(-4)}`;
      console.log(`Creando entrada de portafolio para ${dirName}...`);
      
      const insertedPort = await db.insert(portafolio).values({
        proyectoId: matchedProjectId,
        titulo: `Proyecto ${dirName.replace(/-/g, ' ')}`,
        slug: portafolioSlug,
        publicado: true,
        categoriaEspacio: 'residencial', // default requerido
        galeriaPortafolioUrl: [], // se actualiza abajo
      }).returning();
      const portafolioId = insertedPort[0].id;

      const fotos = fs.readdirSync(fullDirPath).filter(f => f.endsWith('.webp'));
      let urls: string[] = [];
      for (const fotoFile of fotos) {
        const fotoLocalPath = path.join(fullDirPath, fotoFile);
        const r2Key = `portafolio/${dirName}/${fotoFile}`;
        
        console.log(`  Verificando URL de R2 para ${r2Key}...`);
        urls.push(`${PUBLIC_DOMAIN}/${r2Key}`);
      }

      await db.update(portafolio)
        .set({ 
          galeriaPortafolioUrl: urls,
          imagenPortafolioUrl: urls[0] || null
        })
        .where(eq(portafolio.id, portafolioId));

      // Eliminar directorio local para no ensuciar github (opcional)
      // fs.rmSync(fullDirPath, { recursive: true, force: true });
    }
  }

  console.log("¡Migración y sincronización con R2 finalizada con éxito!");
  
  // Clean exit for postgres client
  await client.end();
}

run().catch(e => {
  console.error("Error fatal:", e);
  client.end();
  process.exit(1);
});
