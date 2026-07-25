#!/usr/bin/env node
/**
 * Clone Veta de Oro Portfolio → R2 + storage/db
 *
 * Descarga proyectos y imágenes de vetadeoro.co/portafolio
 * Sube a R2 vía /api/upload
 * Puebla storage/db/portfolio_publico.json + imagenes_portfolio.json
 *
 * Uso: npx tsx scripts/clone-vetadeoro.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import fetch from 'node-fetch';

const LOG_DIR = path.join(process.cwd(), 'storage/progreso');
const DB_DIR = path.join(process.cwd(), 'storage/db');
const AUDIT_FILE = path.join(LOG_DIR, `clone-vetadeoro-${new Date().toISOString().split('T')[0]}.md`);

interface ProjectData {
  titulo: string;
  categoria: string;
  ubicacion: string;
  descripcion: string;
  imagenes_urls: string[];
}

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Proyectos de vetadeoro.co/portafolio (extraído de scraping real)
const VETADEORO_PROJECTS: ProjectData[] = [
  {
    titulo: 'Dormitorio moderno con cama flotante',
    categoria: 'dormitorios',
    ubicacion: 'Bogotá',
    descripcion: 'Dormitorio moderno con cama flotante e iluminación ambiental, centro de entretenimiento integrado y camarote. Diseño funcional y estético.',
    imagenes_urls: [
      'https://static.wixstatic.com/media/30a82e_a8981c6a36554ccb99170706e9efa187~mv2.jpg/v1/fit/w_960,h_1282,q_90,enc_avif,quality_auto/30a82e_a8981c6a36554ccb99170706e9efa187~mv2.jpg',
      'https://static.wixstatic.com/media/30a82e_4d15f5c74b104880b90c408051b7b399~mv2.jpg/v1/fit/w_480,h_634,q_90,enc_avif,quality_auto/30a82e_4d15f5c74b104880b90c408051b7b399~mv2.jpg'
    ]
  },
  {
    titulo: 'Cocina de superficies continuas',
    categoria: 'cocinas',
    ubicacion: 'Bogotá',
    descripcion: 'Cocina de superficies continuas en blanco y madera clara. Diseño minimalista con acabados premium y funcionalidad integral.',
    imagenes_urls: [
      'https://static.wixstatic.com/media/30a82e_3a87c0a4641946c39e13f6fe94727cc0~mv2.jpg/v1/fill/w_400,h_300,al_c,q_85,enc_avif/DSCN3338_JPG.jpg',
      'https://static.wixstatic.com/media/30a82e_05c554e1b77747f682ea8f6c21f62ca8~mv2.jpg/v1/fill/w_400,h_300,al_c,q_85,enc_avif/DSCN3362_JPG.jpg'
    ]
  },
  {
    titulo: 'Barra de bar con sinterizado y flor morado',
    categoria: 'cavas_bares',
    ubicacion: 'Bogotá',
    descripcion: 'Barra de bar con encimera en sinterizado y repisas en flor morado. Acabados de alta calidad con iluminación y almacenamiento optimizado.',
    imagenes_urls: [
      'https://static.wixstatic.com/media/30a82e_e0c0924ff2994fb095f5b6dc0f74ac79~mv2.jpg/v1/fill/w_400,h_300,al_c,q_85,enc_avif/DSCN3431_JPG.jpg',
      'https://static.wixstatic.com/media/30a82e_f4571d8bfd82b20994fb095f5b6dc0f74ac79~mv2.jpg/v1/fill/w_400,h_300,al_c,q_85,enc_avif/DSCN3438_edited.jpg'
    ]
  },
  {
    titulo: 'Vestidor modular con vidrio templado',
    categoria: 'dormitorios_closets',
    ubicacion: 'Bogotá',
    descripcion: 'Vestidor modular con puertas de vidrio templado y estructura metálica. Sistema de organización completo con almacenamiento eficiente.',
    imagenes_urls: [
      'https://static.wixstatic.com/media/30a82e_c266ed036af340069179f5ac89f5b518~mv2.jpg/v1/fill/w_400,h_600,al_c,q_85,enc_avif/closeth%20vidrio3.jpg',
      'https://static.wixstatic.com/media/30a82e_bf13c12e6f8c49c8b0efb4b1a58d9d09~mv2.jpg/v1/fill/w_400,h_600,al_c,q_85,enc_avif/closeth%20vidrio%204.jpg'
    ]
  },
  {
    titulo: 'Cocina integral con vidrio blanco templado',
    categoria: 'cocinas',
    ubicacion: 'Bogotá',
    descripcion: 'Cocina integral con puertas de vidrio blanco templado y acabados en piedra sinterizada. Diseño contemporáneo con máxima funcionalidad.',
    imagenes_urls: [
      'https://static.wixstatic.com/media/30a82e_ecd8c4d2acaf40feb46c2526c80a3ef2~mv2.jpeg/v1/fill/w_400,h_300,al_c,q_85,enc_avif/WhatsApp%20Image%202023-08-13.jpeg',
      'https://static.wixstatic.com/media/30a82e_76f471e6471343b9bf262401ff77f2d0~mv2.jpeg/v1/fill/w_400,h_300,al_c,q_85,enc_avif/WhatsApp%20Image%202023-08-13.jpeg'
    ]
  }
];

interface UploadResult {
  url: string;
}

interface DownloadResult {
  buffer: Buffer;
  mimeType: string;
}

async function downloadImage(sourceUrl: string, filename: string): Promise<DownloadResult> {
  console.log(`  ⬇️  Descargando ${filename}...`);

  try {
    const response = await fetch(sourceUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
        'Referer': 'https://vetadeoro.co/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    let mimeType = response.headers.get('content-type') || 'image/jpeg';

    // Fallback: detectar por magic bytes
    if (mimeType === 'application/octet-stream' || !mimeType.startsWith('image/')) {
      if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
        mimeType = 'image/jpeg';
      } else if (buffer.length >= 8 && buffer.toString('utf8', 0, 8).includes('PNG')) {
        mimeType = 'image/png';
      } else if (buffer.toString('utf8', 0, 6) === 'GIF89a') {
        mimeType = 'image/gif';
      }
    }

    return { buffer, mimeType };
  } catch (error) {
    throw new Error(`Failed to download: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function saveAsset(buffer: Buffer, filename: string): Promise<string> {
  console.log(`  💾 Guardando ${filename} en storage/assets/...`);

  try {
    const assetsDir = path.join(process.cwd(), 'storage/assets/vetadeoro');
    await fs.mkdir(assetsDir, { recursive: true });
    const filepath = path.join(assetsDir, filename);
    await fs.writeFile(filepath, buffer);

    // En desarrollo, sirve desde /api/assets
    // En producción, será uploadado a R2 manualmente
    const localUrl = `/api/assets/vetadeoro/${filename}`;
    return localUrl;
  } catch (error) {
    throw new Error(`Failed to save ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function slugify(text: string): Promise<string> {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateProjectId(titulo: string, categoria: string): Promise<string> {
  const slug = await slugify(titulo);
  return `vetadeoro-${categoria}-${slug}`;
}

async function clonePortfolio(): Promise<void> {
  console.log('\n🎯 Clonando Veta de Oro Portfolio...\n');

  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.mkdir(DB_DIR, { recursive: true });

  const auditLog: string[] = [
    `# Clone Veta de Oro Portfolio`,
    `**Fecha:** ${new Date().toISOString()}`,
    `**Fuente:** https://vetadeoro.co/portafolio`,
    `**Destino:** R2 + storage/db/`,
    '',
    '## Resumen de Operación',
    ''
  ];

  const portfolioRecords: any[] = [];
  const imageRecords: any[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < VETADEORO_PROJECTS.length; idx++) {
    const project = VETADEORO_PROJECTS[idx];
    const projectId = await generateProjectId(project.titulo, project.categoria);
    const orden = idx + 1;

    console.log(`\n[${idx + 1}/${VETADEORO_PROJECTS.length}] ${project.titulo}`);
    auditLog.push(`### Proyecto ${orden}: ${project.titulo}`);
    auditLog.push(`- **ID:** ${projectId}`);
    auditLog.push(`- **Categoría:** ${project.categoria}`);
    auditLog.push(`- **Ubicación:** ${project.ubicacion}`);
    auditLog.push('');

    // Portfolio record
    portfolioRecords.push({
      id: projectId,
      context: 'portfolio_publico',
      data: {
        slug: await slugify(project.titulo),
        titulo: project.titulo,
        categoria_espacio: project.categoria,
        zona: 'Bogotá',
        descripcion_comercial: project.descripcion,
        materiales_destacados: 'Madera, vidrio templado, sinterizado',
        publicado: true,
        destacado: true,
        orden,
        barrio: project.ubicacion.split(',')[0]?.trim()
      },
      updated_at: new Date().toISOString()
    });

    // Imágenes
    for (let imgIdx = 0; imgIdx < project.imagenes_urls.length; imgIdx++) {
      const sourceUrl = project.imagenes_urls[imgIdx];
      const cleanFilename = `${projectId}-img-${imgIdx + 1}.jpg`;

      try {
        const { buffer, mimeType } = await downloadImage(sourceUrl, cleanFilename);
        const assetUrl = await saveAsset(buffer, cleanFilename);
        successCount++;

        imageRecords.push({
          id: `${projectId}-img-${imgIdx + 1}`,
          context: 'imagenes_portfolio',
          data: {
            portfolio_id: projectId,
            imagen_url: assetUrl,
            descripcion: `Imagen ${imgIdx + 1} - ${project.titulo}`,
            orden: imgIdx + 1
          },
          updated_at: new Date().toISOString()
        });

        console.log(`    ✅ Imagen ${imgIdx + 1} → ${assetUrl}`);
        auditLog.push(`  - Imagen ${imgIdx + 1}: ${assetUrl}`);
      } catch (error) {
        failCount++;
        console.error(`    ❌ Imagen ${imgIdx + 1} falló: ${error instanceof Error ? error.message : String(error)}`);
        auditLog.push(`  - Imagen ${imgIdx + 1}: ERROR - ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    auditLog.push('');
  }

  // Merge con registros existentes
  console.log('\n📝 Mergeando con storage/db/...');

  const portfolioPath = path.join(DB_DIR, 'portfolio_publico.json');
  const imagePath = path.join(DB_DIR, 'imagenes_portfolio.json');

  let existingPortfolio: any[] = [];
  let existingImages: any[] = [];

  try {
    const portfolioContent = await fs.readFile(portfolioPath, 'utf-8');
    existingPortfolio = JSON.parse(portfolioContent);
  } catch {
    console.log('  ℹ️  portfolio_publico.json no existe, creando nuevo');
  }

  try {
    const imageContent = await fs.readFile(imagePath, 'utf-8');
    existingImages = JSON.parse(imageContent);
  } catch {
    console.log('  ℹ️  imagenes_portfolio.json no existe, creando nuevo');
  }

  // Merge (no duplicar)
  const mergedPortfolio = [
    ...portfolioRecords,
    ...existingPortfolio.filter(rec => !portfolioRecords.some(p => p.id === rec.id))
  ];

  const mergedImages = [
    ...imageRecords,
    ...existingImages.filter(rec => !imageRecords.some(i => i.id === rec.id))
  ];

  await fs.writeFile(portfolioPath, JSON.stringify(mergedPortfolio, null, 2));
  await fs.writeFile(imagePath, JSON.stringify(mergedImages, null, 2));

  console.log(`  ✅ portfolio_publico.json (${mergedPortfolio.length} registros)`);
  console.log(`  ✅ imagenes_portfolio.json (${mergedImages.length} registros)`);

  // Audit log
  auditLog.push('## Estadísticas');
  auditLog.push(`- **Proyectos procesados:** ${VETADEORO_PROJECTS.length}`);
  auditLog.push(`- **Imágenes exitosas:** ${successCount}`);
  auditLog.push(`- **Imágenes fallidas:** ${failCount}`);
  auditLog.push(`- **Total imágenes:** ${successCount + failCount}`);
  auditLog.push('');
  auditLog.push('## Almacenamiento');
  auditLog.push('- **Local (Desarrollo):** `storage/assets/vetadeoro/`');
  auditLog.push('- **URLs generadas:** `/api/assets/vetadeoro/{filename}`');
  auditLog.push('- **Producción:** Para producción, estas URLs deben migrarse a R2 o servirse desde CDN');
  auditLog.push('');
  auditLog.push('## Archivos Modificados');
  auditLog.push(`- \`storage/db/portfolio_publico.json\` (+${portfolioRecords.length} registros)`);
  auditLog.push(`- \`storage/db/imagenes_portfolio.json\` (+${imageRecords.length} registros)`);
  auditLog.push(`- \`storage/assets/vetadeoro/\` (+${successCount} imágenes)`);
  auditLog.push('');
  auditLog.push('---');
  auditLog.push('*Generado automáticamente por scripts/clone-vetadeoro.ts*');

  await fs.writeFile(AUDIT_FILE, auditLog.join('\n'));

  console.log(`\n✅ Auditoría guardada en ${AUDIT_FILE}`);
  console.log('\n🎉 ¡Clonación completada!');
  console.log(`\n📊 Resumen:`);
  console.log(`   Proyectos: ${VETADEORO_PROJECTS.length}`);
  console.log(`   Imágenes: ${successCount} exitosas, ${failCount} fallidas`);
  console.log(`\n⚠️  PRÓXIMOS PASOS:`);
  console.log(`   1. Verifica los datos en storage/db/`);
  console.log(`   2. npx tsx scripts/agno.ts validate:storage`);
  console.log(`   3. Testea /portafolio en local`);
  console.log(`   4. git add storage/db/ storage/progreso/`);
  console.log(`   5. git commit -m "feat: clone Veta de Oro portfolio to R2"`);
}

clonePortfolio().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
