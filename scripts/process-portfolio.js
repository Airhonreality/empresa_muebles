const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

const SOURCE_DIR = 'C:\\Users\\javir\\Pictures\\FOTOGRAFIA Y VIDEO VETA DORADAA DORADA';
const TARGET_DIR = path.join(__dirname, '..', 'public', 'images', 'portafolio');
const TS_OUTPUT = path.join(__dirname, '..', 'lib', 'seo', 'portafolio-images.ts');

function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const txtFiles = glob.sync(`${SOURCE_DIR}/**/*.txt`.replace(/\\/g, '/'));
  console.log(`Encontrados ${txtFiles.length} archivos .txt`);

  const portfolioData = [];

  for (const txtPath of txtFiles) {
    const parentDirName = path.basename(path.dirname(txtPath));
    const proyectoNombre = parentDirName.trim();
    const proyectoSlug = slugify(proyectoNombre);
    const projTargetDir = path.join(TARGET_DIR, proyectoSlug);

    if (!fs.existsSync(projTargetDir)) {
      fs.mkdirSync(projTargetDir, { recursive: true });
    }

    const content = fs.readFileSync(txtPath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let currentCategoria = 'General';
    let imgCounter = 1;

    const espaciosMap = new Map(); // key: categoria, val: array of imgs

    for (let line of lines) {
      if (line.match(/^[a-zA-Z]/) && !line.includes(':\\')) {
        // Es un encabezado de categoria
        currentCategoria = line.replace(/[:\/]+$/g, '').trim(); // quita dos puntos finales
        imgCounter = 1; // reset para nueva categoria
      } else if (line.includes(':\\')) {
        // Es una ruta de imagen (asumimos 1 por linea por las correcciones del usuario)
        const srcPath = line.replace(/^['"]|['"]$/g, ''); // limpia comillas sueltas
        
        if (fs.existsSync(srcPath)) {
          const catSlug = slugify(currentCategoria);
          const destName = `${catSlug}-${imgCounter}.webp`;
          const targetPath = path.join(projTargetDir, destName);

          // Transcodificamos
          try {
            await sharp(srcPath)
              .webp({ quality: 85 })
              .toFile(targetPath);
            console.log(`[EXITO] ${proyectoNombre} -> ${destName}`);
            
            // Registramos
            if (!espaciosMap.has(currentCategoria)) {
              espaciosMap.set(currentCategoria, []);
            }
            espaciosMap.get(currentCategoria).push({
              src: `/images/portafolio/${proyectoSlug}/${destName}`,
              alt: `${currentCategoria} diseñado a medida para proyecto en Bogotá - Veta Dorada`,
              title: `${currentCategoria} - Proyecto ${proyectoNombre}`
            });

            imgCounter++;
          } catch(e) {
            console.error(`[ERROR SHARP] ${srcPath}`, e.message);
          }
        } else {
          console.warn(`[NOT FOUND] No existe ruta: ${srcPath}`);
        }
      }
    }

    if (espaciosMap.size > 0) {
      const espaciosArr = Array.from(espaciosMap.entries()).map(([cat, imgs]) => ({
        categoria: cat,
        imagenes: imgs
      }));

      portfolioData.push({
        proyecto: proyectoNombre,
        slug: proyectoSlug,
        espacios: espaciosArr
      });
    }
  }

  // Generar archivo TS
  let tsContent = `// Archivo autogenerado con la metadata de Portafolio desde TXTs\n\n`;
  tsContent += `export const PORTAFOLIO_DATA = ${JSON.stringify(portfolioData, null, 2)};\n`;

  // Crear el directorio de TS_OUTPUT si no existe
  if (!fs.existsSync(path.dirname(TS_OUTPUT))) {
    fs.mkdirSync(path.dirname(TS_OUTPUT), { recursive: true });
  }

  fs.writeFileSync(TS_OUTPUT, tsContent, 'utf8');
  console.log(`\n\nArchivo TS generado en: ${TS_OUTPUT}`);
  console.log('Proceso de Portafolio y Landings finalizado.');
}

run();
