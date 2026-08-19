import sharp from "sharp";

export type ImageContext = "hero" | "galeria" | "avatar" | "general" | "logo";

/**
 * Infiere el contexto de la imagen a partir del prefijo (carpeta destino en R2).
 * Esto evita tener que modificar los componentes de la interfaz de usuario.
 */
export function inferContextFromPrefix(prefix: string): ImageContext {
  const p = prefix.toLowerCase();
  
  if (p.includes("portafolio") || p.includes("home") || p.includes("hero") || p.includes("public")) {
    return "hero";
  }
  if (p.includes("logo") || p.includes("marca")) {
    return "logo";
  }
  if (p.includes("avatar") || p.includes("perfil") || p.includes("usuario")) {
    return "avatar";
  }
  // Por defecto (cotizador, catálogo, etc.)
  return "general";
}

/**
 * Procesa un Buffer de imagen aplicando las reglas según su contexto.
 */
export async function optimizeImage(buffer: Buffer, mime: string, context: ImageContext): Promise<{ data: Buffer; contentType: string }> {
  // Si no es imagen raster o es un SVG, retornar sin tocar el binario
  if (!mime.startsWith("image/") || mime === "image/svg+xml") {
    return { data: buffer, contentType: mime };
  }

  // Logo: evitar pérdida de detalle o artefactos, máxima calidad
  if (context === "logo") {
     const logo = sharp(buffer, { failOn: "none" }).rotate();
     const webpLogo = await logo.webp({ quality: 95, effort: 4 }).toBuffer();
     return { data: webpLogo, contentType: "image/webp" };
  }

  const image = sharp(buffer, { failOn: "none" }).rotate(); // respeta EXIF
  
  if (context === "hero") {
    // 3840px (4K) máximo, calidad 95 para mantener máxima resolución y nitidez sin pixelarse
    image.resize(3840, 3840, { fit: "inside", withoutEnlargement: true });
    const webp = await image.webp({ quality: 95, effort: 6 }).toBuffer();
    return { data: webp, contentType: "image/webp" };
  } 
  
  if (context === "avatar") {
    // 400px, recorte cuadrado ideal para avatares
    image.resize(400, 400, { fit: "cover" }); 
    const webp = await image.webp({ quality: 82, effort: 4 }).toBuffer();
    return { data: webp, contentType: "image/webp" };
  }
  
  // Contexto "general" (catálogo, cotizador, genérico)
  // 1600px máximo, calidad 82
  image.resize(1600, 1600, { fit: "inside", withoutEnlargement: true });
  const webp = await image.webp({ quality: 82, effort: 4 }).toBuffer();
  return { data: webp, contentType: "image/webp" };
}
