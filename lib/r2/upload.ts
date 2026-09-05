"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { optimizeImage, inferContextFromPrefix } from "./optimize";

let cachedR2Client: S3Client | null = null;

function getR2Context(): { client: S3Client; bucket: string; publicDomain: string } {
  const accountId = process.env.CF_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CF_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CF_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CF_R2_BUCKET_NAME || "veta-dorada";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      `Credenciales incompletas de Cloudflare R2 en runtime: ` +
      `ACCOUNT_ID=${accountId ? "OK" : "FALTA"}, ` +
      `ACCESS_KEY=${accessKeyId ? "OK" : "FALTA"}, ` +
      `SECRET=${secretAccessKey ? "OK" : "FALTA"}`
    );
  }

  if (!cachedR2Client) {
    cachedR2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // Fallback canónico seguro: el dominio público r2.dev de Veta de Oro.
  // Nunca debe apuntar al endpoint privado r2.cloudflarestorage.com porque requiere credenciales S3 y no es público.
  const configuredDomain = process.env.CF_R2_PUBLIC_DOMAIN;
  const publicDomain = (configuredDomain && !configuredDomain.includes("r2.cloudflarestorage.com"))
    ? configuredDomain.replace(/\/$/, "")
    : "https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev";

  return { client: cachedR2Client, bucket, publicDomain };
}

/**
 * Sube un archivo a Cloudflare R2 y devuelve su URL pública permanente.
 * @param input - FormData conteniendo 'file' y opcionalmente 'prefix', o directamente un objeto File.
 * @param prefixParam - Prefijo de carpeta en R2 si no se pasa en FormData (ej: 'catalogo', 'cotizador/disenio').
 * @returns URL pública permanente en R2.
 */
export async function uploadFileToR2(
  input: FormData | File,
  prefixParam: string = "portafolio"
): Promise<string> {
  let file: File;
  let prefix = prefixParam;

  if (typeof FormData !== "undefined" && input instanceof FormData) {
    const formFile = input.get("file");
    if (!formFile || !(formFile instanceof File)) {
      throw new Error("No se proporcionó ningún archivo en el formulario");
    }
    file = formFile;
    const formPrefix = input.get("prefix");
    if (typeof formPrefix === "string" && formPrefix.trim()) {
      prefix = formPrefix.trim();
    }
  } else if (input instanceof File) {
    file = input;
  } else {
    throw new Error("Formato de entrada no válido para la subida de imagen");
  }

  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen válidos (JPG, PNG, WebP, etc.)");
  }

  // Limpiar el prefijo de slashes redundantes
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");

  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);
  
  // Inferir el contexto (hero, general, logo, avatar) a partir de la carpeta destino
  const context = inferContextFromPrefix(cleanPrefix);
  
  // Procesar la imagen con sharp (optimización, respeto de orientación EXIF, conversión WebP)
  const { data: optimizedBuffer, contentType } = await optimizeImage(rawBuffer, file.type, context);

  const timestamp = Date.now();
  // Al cambiar formato a webp, asegurarse de cambiar la extensión si es necesario
  let sanitizedName = file.name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
    
  if (contentType === "image/webp" && !sanitizedName.endsWith(".webp")) {
    sanitizedName = sanitizedName.replace(/\.[^/.]+$/, "") + ".webp";
  }

  const key = `${cleanPrefix}/${timestamp}-${sanitizedName}`;

  const { client, bucket, publicDomain } = getR2Context();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: optimizedBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable", // Cache de 1 año en Cloudflare edge
    })
  );

  return `${publicDomain}/${key}`;
}

/**
 * Elimina un archivo de Cloudflare R2.
 * @param key - Clave del archivo en R2 (sin el prefijo de URL).
 */
export async function deleteFileFromR2(key: string): Promise<void> {
  const { client, bucket } = getR2Context();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
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
