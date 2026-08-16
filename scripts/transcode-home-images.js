const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = path.join(__dirname, '..', 'public', 'images', 'home');

// Asegurar que el directorio destino existe
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const imagesToProcess = [
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\Ciro Rincon\\IMG_20260418_151034335_HDR_AE.jpg',
    dest: 'cocina-integral-madera-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\Screenshots\\Captura de pantalla 2026-07-28 180116.png',
    dest: 'diseno-3d-visualizacion-previa-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\En Taller\\IMG_20251222_135552274.jpg',
    dest: 'taller-fabricacion-muebles-madera-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\Angela y Luis - cocina baño wk closet\\Proceso y obra\\Obra\\IMG_20250531_100226281.jpg',
    dest: 'disenador-industrial-midiendo-espacio-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\Victoria giraldo\\IMG_20250415_160858012.jpg',
    dest: 'cocinas-integrales-diseno-fabricacion-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\Ciro Rincon\\IMG_20260601_115855302_HDR.jpg',
    dest: 'closets-vestidores-madera-amedida-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\Carlos Cortes y Paola\\IMG_20260306_122254619_HDR_AE.jpg',
    dest: 'centros-entretenimiento-mueble-tv-iluminacion-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\Neidy Snachez\\IMG20240727163108.jpg',
    dest: 'estudios-home-office-escritorio-amedida-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\Ciro Rincon\\IMG_20260418_150735794_HDR.jpg',
    dest: 'cavas-bares-madera-iluminacion-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA\\Ciro Rincon\\IMG_20260601_112640223_HDR.jpg',
    dest: 'consolas-recibidores-madera-entrada-bogota-1.webp'
  },
  {
    src: 'C:\\Users\\javir\\Pictures\\piso de madera.jpg',
    dest: 'pisos-madera-restauracion-bogota-1.webp'
  }
];

async function processImages() {
  console.log('Iniciando transcodificación a WebP...');
  for (const img of imagesToProcess) {
    const targetPath = path.join(targetDir, img.dest);
    try {
      if (!fs.existsSync(img.src)) {
        console.warn(`[OMITIDO] Archivo origen no encontrado: ${img.src}`);
        continue;
      }
      
      await sharp(img.src)
        .rotate() // auto-rota según el tag EXIF antes de descartar metadata (mismo fix que fix-orientation-r2.ts)
        .webp({ quality: 85 })
        .toFile(targetPath);
      
      const stats = fs.statSync(targetPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`[EXITO] Creado: ${img.dest} (${sizeKB} KB)`);
    } catch (err) {
      console.error(`[ERROR] Procesando ${img.src}:`, err.message);
    }
  }
  console.log('Proceso completado.');
}

processImages();
