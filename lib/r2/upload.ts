"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { optimizeImage, inferContextFromPrefix } from "./optimize";

// Inicializar cliente de R2 (Cloudflare R2 es compatible con S3 SDK)
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CF_R2_BUCKET_NAME!;
const PUBLIC_DOMAIN = process.env.CF_R2_PUBLIC_DOMAIN || `https://${BUCKET_NAME}.r2.cloudflarestorage.com`;

/**
 * Sube un archivo a Cloudflare R2 y devuelve su URL pública.
 * @param file - Archivo a subir (debe ser una imagen).
 * @param prefix - Prefijo para la clave en R2 (ej: 'portafolio/', 'cotizador/').
 * @returns URL pública del archivo subido.
 */
export async function uploadFileToR2(file: File, prefix: string = "portafolio"): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen");
  }

  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);
  
  // Inferir el contexto (hero, general, logo, avatar) a partir de la carpeta destino
  const context = inferContextFromPrefix(prefix);
  
  // Procesar la imagen con sharp
  const { data: optimizedBuffer, contentType } = await optimizeImage(rawBuffer, file.type, context);

  const timestamp = Date.now();
  // Al cambiar formato a webp, asegurarse de cambiar la extensión si es necesario
  let sanitizedName = file.name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
    
  if (contentType === "image/webp" && !sanitizedName.endsWith(".webp")) {
    sanitizedName = sanitizedName.replace(/\.[^/.]+$/, "") + ".webp";
  }

  const key = `${prefix}/${timestamp}-${sanitizedName}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: optimizedBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // Cache de 1 año
    })
  );

  return `${PUBLIC_DOMAIN}/${key}`;
}

/**
 * Elimina un archivo de Cloudflare R2.
 * @param key - Clave del archivo en R2 (sin el prefijo de URL).
 */
export async function deleteFileFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Extrae la clave de R2 de una URL pública.
 * Ejemplo: "https://bucket.r2.cloudflarestorage.com/portafolio/123-foto.jpg" -> "portafolio/123-foto.jpg"
 */
export async function extractR2KeyFromUrl(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.substring(1); // Remover el "/" inicial
    return path || null;
  } catch {
    return null;
  }
}
