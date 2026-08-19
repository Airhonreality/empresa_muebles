import { readFileSync } from "fs";
import { uploadFileToR2 } from "../lib/r2/upload";

async function main() {
  const filePath = String.raw`C:\Users\javir\Pictures\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\Ciro Rincon\IMG_20260418_151034335_HDR_AE.jpg`;
  console.log("Leyendo archivo original:", filePath);
  
  try {
    const buffer = readFileSync(filePath);
    
    // Aquí es donde inyectamos el nombre SEO desde el cliente/script
    // No tocamos el archivo original en tu disco.
    const seoFileName = "cocina-integral-lujo-madera-bogota.jpg";
    console.log("Formateando archivo con nombre SEO:", seoFileName);

    // Simulamos un File de navegador
    const fileMock = {
      name: seoFileName,
      type: "image/jpeg",
      arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    } as any as File;

    console.log("Subiendo a R2 con prefijo 'home' (contexto 'hero')...");
    const url = await uploadFileToR2(fileMock, "home");
    
    console.log("==================================================");
    console.log("¡Éxito! URL pública generada:");
    console.log(url);
    console.log("==================================================");
  } catch (error) {
    console.error("Error en la prueba:", error);
  }
}

main();
