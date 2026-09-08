"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { optimizeImage, inferContextFromPrefix } from "./optimize";

const MAX_CLONE_SIZE_BYTES = 5 * 1024 * 1024;
const CLONE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

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

function buildKey(prefix: string, fileName: string, contentType: string): string {
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
  let sanitizedName = fileName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  if (contentType === "image/webp" && !sanitizedName.endsWith(".webp")) {
    sanitizedName = sanitizedName.replace(/\.[^/.]+$/, "") + ".webp";
  }
  return `${cleanPrefix}/${Date.now()}-${sanitizedName}`;
}

async function persistBufferToR2(opts: { rawBuffer: Buffer; mime: string; prefix: string; fileName: string }): Promise<string> {
  const { rawBuffer, mime, prefix, fileName } = opts;

  const context = inferContextFromPrefix(prefix);
  const { data: optimizedBuffer, contentType } = await optimizeImage(rawBuffer, mime, context);

  const key = buildKey(prefix, fileName, contentType);
  const { client, bucket, publicDomain } = getR2Context();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: optimizedBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${publicDomain}/${key}`;
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
): Promise<CloneResult> {
  try {
    let file: File;
    let prefix = prefixParam;

    if (typeof FormData !== "undefined" && input instanceof FormData) {
      const formFile = input.get("file");
      if (!formFile || !(formFile instanceof File)) {
        return { ok: false, url: null, error: "No se proporcionó ningún archivo en el formulario" };
      }
      file = formFile;
      const formPrefix = input.get("prefix");
      if (typeof formPrefix === "string" && formPrefix.trim()) {
        prefix = formPrefix.trim();
      }
    } else if (input instanceof File) {
      file = input;
    } else {
      return { ok: false, url: null, error: "Formato de entrada no válido para la subida de imagen" };
    }

    if (!file.type || !file.type.startsWith("image/")) {
      return { ok: false, url: null, error: "Solo se permiten archivos de imagen válidos (JPG, PNG, WebP, etc.)" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    const url = await persistBufferToR2({ rawBuffer, mime: file.type, prefix, fileName: file.name });
    return { ok: true, url };
  } catch (error) {
    console.error("[uploadFileToR2]", error);
    const msg = error instanceof Error ? error.message : "Fallo al conectar con Cloudflare R2";
    return { ok: false, url: null, error: `No se pudo subir la imagen: ${msg}` };
  }
}

/**
 * Clona una imagen remota (URL de un sitio externo) a Cloudflare R2 y devuelve su URL
 * pública permanente. Es la base de la "ley R2": toda referencia externa pasa por acá
 * antes de persistirse en la DB, para que la whitelist sea efectivamente estricta.
 * Porta el mecanismo legacy `persistAsset` de `main` (SmartImageInput/rehost).
 *
 * Devuelve un resultado estructurado en vez de lanzar: en producción Next.js reemplaza
 * cualquier mensaje de un throw en una Server Action por "An error occurred in the Server
 * Components render" (ocultando la causa real). Con { ok: false, error } el usuario y
 * el log ven el motivo real.
 */
export type CloneResult =
  | { ok: true; url: string }
  | { ok: false; url: null; error: string };

export async function clonarUrlAR2(sourceUrl: string, prefixParam: string = "general"): Promise<CloneResult> {
  try {
    const source = sourceUrl.trim();
    if (!isHttpUrl(source)) {
      return { ok: false, url: null, error: "La URL debe usar el protocolo http o https." };
    }

    const response = await fetch(source, { redirect: "follow", headers: CLONE_HEADERS });
    if (!response.ok) {
      return {
        ok: false,
        url: null,
        error: `La imagen no respondió (HTTP ${response.status}). La URL puede estar expirada o muerte.`,
      };
    }

    const mime = (response.headers.get("content-type") || "application/octet-stream").split(";")[0].trim();
    if (!mime.startsWith("image/")) {
      const hint = mime.startsWith("text/html")
        ? "La URL apunta a una página web, no a una imagen. Copia el enlace directo (clic derecho sobre la imagen → \"Copiar dirección de imagen\")."
        : `El contenido de la URL es '${mime}', no una imagen.`;
      return { ok: false, url: null, error: hint };
    }

    const rawBuffer = Buffer.from(await response.arrayBuffer());
    if (rawBuffer.byteLength > MAX_CLONE_SIZE_BYTES) {
      return {
        ok: false,
        url: null,
        error: `La imagen supera el límite de ${MAX_CLONE_SIZE_BYTES / 1024 / 1024} MB.`,
      };
    }

    let sourceName = "imagen";
    try {
      const base = new URL(source).pathname.split("/").pop() ?? "imagen";
      if (base) sourceName = base;
    } catch {
      // sourceURL ya validada http/https; no debería fallar
    }

    const url = await persistBufferToR2({ rawBuffer, mime, prefix: prefixParam, fileName: sourceName });
    return { ok: true, url };
  } catch (error) {
    console.error("[clonarUrlAR2]", error);
    const msg = error instanceof Error ? error.message : "Fallo en la conexión con el sitio de origen.";
    return { ok: false, url: null, error: `No se pudo clonar la imagen: ${msg}` };
  }
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
