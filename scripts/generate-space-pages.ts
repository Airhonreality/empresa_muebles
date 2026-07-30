/**
 * Script de build: Lee storage/site-content/espacios/ → genera data files tipados
 *
 * Uso: npx tsx scripts/generate-space-pages.ts (ejecutado en build time)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface ImageMetadata {
  alt_text: string;
  image_title: string;
  keywords: string[];
  descripcion: string;
  structured_data?: Record<string, unknown>;
}

interface CategoryMetadata {
  categoryId: string;
  title: string;
  subtitle?: string;
  description: string;
  descriptionExtended?: string;
  slug: string;
  route: string;
  ogImage?: string;
  benefits?: string[];
  socialProofStats?: {
    projectsCompleted?: number;
    satisfiedClients?: number;
    yearsExperience?: number;
  };
  processNote?: string;
  ctaConfig?: {
    whatsappLink?: string;
    calendarLink?: string;
    emailLink?: string;
  };
  testimonials?: Array<{
    name: string;
    role?: string;
    text: string;
    rating?: number;
  }>;
  images: Array<{
    filename: string;
    metaFile: string;
  }>;
}

interface SeoImageData {
  imagen_url: string;
  imagen_filename: string;
  alt_text: string;
  image_title: string;
  keywords: string[];
  descripcion: string;
  structured_data?: Record<string, unknown>;
}

interface SpacePageData {
  categoryId: string;
  title: string;
  subtitle?: string;
  description: string;
  descriptionExtended?: string;
  slug: string;
  route: string;
  ogImage?: string;
  benefits?: string[];
  socialProofStats?: {
    projectsCompleted?: number;
    satisfiedClients?: number;
    yearsExperience?: number;
  };
  processNote?: string;
  ctaConfig?: {
    whatsappLink?: string;
    calendarLink?: string;
    emailLink?: string;
  };
  testimonials?: Array<{
    name: string;
    role?: string;
    text: string;
    rating?: number;
  }>;
  images: SeoImageData[];
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  No se pudo leer ${filePath}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function getImageFiles(categoryDir: string): Promise<string[]> {
  const files = await fs.readdir(categoryDir);
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  return files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return imageExts.includes(ext) && !f.includes('.meta.json');
  });
}

async function processCategory(categoryDir: string, categoryId: string): Promise<void> {
  console.log(`\n📂 Procesando categoría: ${categoryId}`);

  // 1. Lee metadata.json
  const metadataPath = path.join(categoryDir, 'metadata.json');
  const categoryMetadata = await readJson<CategoryMetadata>(metadataPath);

  if (!categoryMetadata) {
    console.warn(`⚠️  metadata.json no encontrado en ${categoryDir}`);
    return;
  }

  // 2. Procesa cada imagen
  const processedImages: SeoImageData[] = [];

  for (const imgConfig of categoryMetadata.images) {
    const imagePath = path.join(categoryDir, imgConfig.filename);
    const metaPath = path.join(categoryDir, imgConfig.metaFile);

    // Verifica que la imagen existe
    try {
      await fs.access(imagePath);
    } catch {
      console.warn(`⚠️  Imagen no encontrada: ${imagePath}`);
      continue;
    }

    // Lee metadatos
    let imageMeta = await readJson<ImageMetadata>(metaPath);

    if (!imageMeta) {
      console.warn(`⚠️  ${imgConfig.metaFile} no encontrado. Generando fallback...`);
      // Fallback: crea metadatos básicos (sin LLM por ahora)
      imageMeta = {
        alt_text: `${categoryMetadata.title} - ${imgConfig.filename}`,
        image_title: categoryMetadata.title,
        keywords: categoryMetadata.title.split(' '),
        descripcion: categoryMetadata.description,
      };
    }

    // Genera public URL relativa
    const publicUrl = `/site-content/espacios/${categoryId}/${imgConfig.filename}`;

    processedImages.push({
      imagen_url: publicUrl,
      imagen_filename: imgConfig.filename,
      alt_text: imageMeta.alt_text,
      image_title: imageMeta.image_title,
      keywords: Array.isArray(imageMeta.keywords) ? imageMeta.keywords : imageMeta.keywords.split(',').map(k => k.trim()),
      descripcion: imageMeta.descripcion,
      structured_data: imageMeta.structured_data || {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name: imageMeta.image_title,
        description: imageMeta.alt_text,
      },
    });

    console.log(`  ✓ ${imgConfig.filename}`);
  }

  if (processedImages.length === 0) {
    console.warn(`⚠️  No se encontraron imágenes para ${categoryId}`);
    return;
  }

  // 3. Crea objeto de página tipado
  const pageData: SpacePageData = {
    categoryId: categoryMetadata.categoryId,
    title: categoryMetadata.title,
    subtitle: categoryMetadata.subtitle,
    description: categoryMetadata.description,
    descriptionExtended: categoryMetadata.descriptionExtended,
    slug: categoryMetadata.slug,
    route: categoryMetadata.route,
    ogImage: categoryMetadata.ogImage || processedImages[0]?.imagen_url,
    benefits: categoryMetadata.benefits,
    socialProofStats: categoryMetadata.socialProofStats,
    processNote: categoryMetadata.processNote,
    ctaConfig: categoryMetadata.ctaConfig,
    testimonials: categoryMetadata.testimonials,
    images: processedImages,
  };

  // 4. Escribe archivo de datos tipado
  const dataFilePath = path.join(PROJECT_ROOT, 'src/data/spaces', `data-${categoryId}.ts`);
  const dataFileContent = `// Auto-generated by scripts/generate-space-pages.ts
// DO NOT EDIT MANUALLY
import type { SpacePageData } from '@/types/space-showcase';

export const data: SpacePageData = ${JSON.stringify(pageData, null, 2)};

export const {
  images,
  testimonials,
  ctaConfig,
  socialProofStats,
  ...pageMetadata
} = data;
`;

  await writeJson(dataFilePath, null); // Ensure directory exists
  await fs.writeFile(dataFilePath, dataFileContent);
  console.log(`  ✅ Generado: src/data/spaces/data-${categoryId}.ts`);
}

async function main(): Promise<void> {
  console.log('🔨 Generando páginas de espacios...\n');

  const categories = ['cocinas', 'closets', 'cavas', 'recibidores', 'entretenimiento', 'estudios'];
  const storageRoot = path.join(PROJECT_ROOT, 'storage/site-content/espacios');

  // Verifica que storage/site-content/espacios/ existe
  try {
    await fs.access(storageRoot);
  } catch {
    console.error(`❌ Directorio no encontrado: ${storageRoot}`);
    console.log('📂 Crea la estructura:');
    console.log('  storage/site-content/espacios/{cocinas,closets,cavas,...}/metadata.json');
    process.exit(1);
  }

  let processedCount = 0;

  for (const categoryId of categories) {
    const categoryDir = path.join(storageRoot, categoryId);

    try {
      await fs.access(categoryDir);
      await processCategory(categoryDir, categoryId);
      processedCount++;
    } catch (error) {
      console.warn(`⚠️  Saltando ${categoryId}: directorio no encontrado`);
    }
  }

  console.log(`\n✅ Completado: ${processedCount}/${categories.length} categorías procesadas`);
  console.log('\n📁 Archivos generados en: src/data/spaces/');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
