/**
 * LLM Helper para generar metadatos SEO optimizados para imágenes de espacios
 *
 * Utiliza el adaptador LLM configurado del usuario para:
 * - Analizar imagen con Vision (si está disponible)
 * - Generar alt_text SEO (125-150 chars)
 * - Generar keywords (8-10 términos)
 * - Generar descripción comercial (2-3 oraciones)
 *
 * Ejecutable en build-time o server-side con timeout 30s máx por imagen.
 */

'use server';

import { z } from 'zod';
import { generateText, generateObject } from 'ai';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getStrategy } from '@/server/getStrategy';
import type { SeoImageData, SpaceCategory } from '@/types/space-showcase';

interface GenerateSeoMetadataInput {
  imageFile: File | string;
  basicDescription: string;
  category: SpaceCategory;
  location?: string;
  imageFilename?: string;
}

/**
 * Obtiene la configuración AI activa del almacenamiento
 */
async function getActiveAiConfig(adapter: any) {
  try {
    const records = (await adapter.read('ai_config')) as any[];
    if (!Array.isArray(records)) return null;
    return records.find((r: any) => r.data?.active) ?? records[0] ?? null;
  } catch (error) {
    console.warn('[seo-metadata-generator] error reading ai_config:', error);
    return null;
  }
}

/**
 * Construye modelo Vercel AI SDK basado en provider configurado
 */
function buildModel(provider: string, model: string, apiKey: string) {
  try {
    switch (provider) {
      case 'openai': {
        const client = createOpenAI({ apiKey });
        return client(model || 'gpt-4o-mini');
      }
      case 'anthropic': {
        const client = createAnthropic({ apiKey });
        return client(model || 'claude-3-5-sonnet-20241022');
      }
      case 'mistral':
      default: {
        const client = createMistral({ apiKey });
        return client(model || 'mistral-large-latest');
      }
    }
  } catch (error) {
    throw new Error(`Failed to build model for provider "${provider}": ${error}`);
  }
}

/**
 * Convierte File a URL de datos (data:// URL en base64)
 * Soporta tanto cliente (FileReader) como servidor (Buffer)
 */
async function fileToDataUrl(file: File | any): Promise<string> {
  // En cliente: usar FileReader
  if (typeof window !== 'undefined' && file instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to convert file to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  }

  // En servidor: convertir Buffer a base64
  if (typeof window === 'undefined') {
    try {
      // Si es un File convertido a Buffer
      const buffer = file instanceof File
        ? Buffer.from(await file.arrayBuffer())
        : Buffer.isBuffer(file)
          ? file
          : Buffer.from(file);

      const mimeType = file.type || 'image/jpeg';
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      throw new Error(`Failed to convert file to data URL: ${error}`);
    }
  }

  throw new Error('Unable to convert file to data URL');
}

/**
 * Ejecuta función con timeout máximo
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  label: string = 'operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Genera metadatos SEO completos para una imagen usando LLM configurado
 */
export async function generateSeoMetadata(
  input: GenerateSeoMetadataInput
): Promise<SeoImageData> {
  const startTime = Date.now();
  const categoryLabel = {
    cocinas: 'Cocina',
    closets: 'Closet',
    cavas: 'Cava',
    recibidores: 'Recibidor',
    entretenimiento: 'Centro de entretenimiento',
    estudios: 'Estudio/Home office',
  }[input.category];

  const location = input.location || 'Bogotá';
  let imageUrl: string;
  let visionAnalysis = '';

  try {
    console.log(
      `[seo-metadata-generator] iniciando para ${input.category} en ${location}`
    );

    // Convertir File a URL si es necesario
    if (input.imageFile instanceof File) {
      imageUrl = await withTimeout(
        fileToDataUrl(input.imageFile),
        10000,
        'file conversion'
      );
    } else {
      imageUrl = input.imageFile;
    }

    // Obtener configuración LLM
    const adapter = getStrategy();
    const config = await getActiveAiConfig(adapter);

    if (!config) {
      console.warn('[seo-metadata-generator] no ai_config found, usando fallback');
      return createFallbackMetadata(input, categoryLabel, location);
    }

    const provider: string = config.data?.provider ?? 'mistral';
    const modelName: string = config.data?.model ?? 'mistral-large-latest';
    let apiKey: string = config.data?.api_key ?? '';

    if (!apiKey) {
      apiKey = getEnvApiKey(provider);
    }

    if (!apiKey) {
      console.warn(`[seo-metadata-generator] no api key for ${provider}, usando fallback`);
      return createFallbackMetadata(input, categoryLabel, location);
    }

    const model = buildModel(provider, modelName, apiKey);

    // Paso 1: Vision - Analizar imagen + descripción (con fallback a descripción simple)
    try {
      console.log('[seo-metadata-generator] llamada 1/4: vision analysis...');

      const visionResult = await withTimeout(
        generateObject({
          model,
          schema: z.object({
            analisis: z.string().describe('Análisis técnico de la imagen'),
          }),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  image: imageUrl,
                },
                {
                  type: 'text',
                  text: `Analiza esta imagen de ${categoryLabel} y proporciona una descripción técnica de:
- Estilo y acabados visibles
- Materiales aparentes (maderas, vidrio, metal, etc.)
- Colores y paleta
- Características funcionales destacadas

Descripción base proporcionada: "${input.basicDescription}"

Sé específico y comercial en el tono. Responde en español.`,
                },
              ],
            },
          ],
        }),
        15000,
        'vision analysis'
      );

      visionAnalysis = visionResult.object.analisis;
      console.log('[seo-metadata-generator] vision analysis completado');
    } catch (error) {
      console.warn('[seo-metadata-generator] vision falló, usando descripción base:', error);
      visionAnalysis = input.basicDescription;
    }

    // Paso 2: Generar alt_text (125-150 caracteres)
    console.log('[seo-metadata-generator] llamada 2/4: alt_text generation...');

    const altTextResult = await withTimeout(
      generateText({
        model,
        system: 'Eres un experto en SEO y accesibilidad. Responde SOLO con el texto solicitado, sin explicaciones ni formato adicional.',
        prompt: `Basándote en este análisis de imagen:
"${visionAnalysis}"

Genera un alt_text descriptivo de EXACTAMENTE 125-150 caracteres para accesibilidad SEO.
Debe incluir: tipo de espacio, estilo, materiales clave, y ubicación.
Formato sugerido: "${categoryLabel} integral moderna con [detalles] en ${location}"

Responde SOLO con el alt_text.`,
      }),
      10000,
      'alt_text generation'
    );

    const altText = altTextResult.text.trim().slice(0, 200);

    // Paso 3: Generar keywords (8-10 palabras clave)
    console.log('[seo-metadata-generator] llamada 3/4: keywords generation...');

    const keywordsResult = await withTimeout(
      generateText({
        model,
        system: 'Eres un experto en SEO. Responde SOLO con los keywords separados por comas, sin explicaciones.',
        prompt: `Basándote en este análisis:
"${visionAnalysis}"

Genera 8-10 keywords en español, separados por coma, optimizados para SEO local.
Incluye: tipo de espacio, estilo, materiales, ubicación, sinónimos.
Ejemplo: "cocina integral, muebles cocina, diseño bogotá, mármol, cerrajería"

Responde SOLO con los keywords separados por coma.`,
      }),
      10000,
      'keywords generation'
    );

    const keywords = keywordsResult.text
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 10);

    // Paso 4: Generar descripción comercial (2-3 oraciones)
    console.log('[seo-metadata-generator] llamada 4/4: descripción comercial...');

    const descriptionResult = await withTimeout(
      generateText({
        model,
        system: 'Eres un copywriter premium. Responde SOLO con la descripción, sin títulos ni explicaciones adicionales.',
        prompt: `Basándote en:
"${visionAnalysis}"

Escribe una descripción comercial de 50-100 palabras para presentar este ${categoryLabel} en página web.
Tono: premium, preciso, enfoque en calidad y personalización.
Estructura: Descripción visual + beneficio principal + llamado a acción sutil.

Responde SOLO con la descripción.`,
      }),
      10000,
      'description generation'
    );

    const descripcion = descriptionResult.text.trim();

    // Generar título optimizado
    const imageTitle = `${categoryLabel} ${input.basicDescription.substring(0, 30)} - ${location} | Veta Dorada`;

    // Generar estructura JSON-LD para ImageObject
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: imageTitle,
      description: descripcion,
      url: imageUrl,
      keywords: keywords.join(', '),
      inLanguage: 'es',
    };

    const elapsed = Date.now() - startTime;
    console.log(
      `[seo-metadata-generator] completado en ${elapsed}ms para ${input.category}`
    );

    return {
      imagen_filename:
        input.imageFilename ||
        `${input.category}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`,
      imagen_url: imageUrl,
      alt_text: altText,
      image_title: imageTitle,
      keywords,
      descripcion,
      structured_data: structuredData,
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(
      `[seo-metadata-generator] error después de ${elapsed}ms:`,
      error
    );
    return createFallbackMetadata(input, categoryLabel, location);
  }
}

/**
 * Crea metadatos fallback cuando la generación LLM falla
 */
function createFallbackMetadata(
  input: GenerateSeoMetadataInput,
  categoryLabel: string,
  location: string
): SeoImageData {
  const imageUrl =
    typeof input.imageFile === 'string' ? input.imageFile : 'image.jpg';

  return {
    imagen_filename:
      input.imageFilename ||
      `${input.category}-${Date.now()}-fallback.jpg`,
    imagen_url: imageUrl,
    alt_text: `${categoryLabel} personalizado ${input.basicDescription} en ${location}`,
    image_title: `${categoryLabel} - ${input.basicDescription} | Veta Dorada`,
    keywords: [
      input.category,
      'muebles',
      categoryLabel.toLowerCase(),
      location.toLowerCase(),
    ],
    descripcion: input.basicDescription,
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: `${categoryLabel} - ${input.basicDescription}`,
      inLanguage: 'es',
    },
  };
}

/**
 * Obtiene API key desde variables de entorno según el provider
 */
function getEnvApiKey(provider: string): string {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY ?? '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY ?? '';
    case 'mistral':
      return process.env.MISTRAL_API_KEY ?? '';
    default:
      return '';
  }
}

/**
 * Genera metadatos para múltiples imágenes en paralelo (con control de concurrencia)
 */
export async function generateSeoMetadataBatch(
  inputs: GenerateSeoMetadataInput[],
  maxConcurrency: number = 2
): Promise<SeoImageData[]> {
  const results: SeoImageData[] = [];

  for (let i = 0; i < inputs.length; i += maxConcurrency) {
    const batch = inputs.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(
      batch.map((input) => generateSeoMetadata(input))
    );
    results.push(...batchResults);
  }

  return results;
}
