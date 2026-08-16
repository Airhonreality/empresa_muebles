const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function rotateImg(fileName, deg) {
  const filePath = path.join(__dirname, '..', 'public', 'images', 'home', fileName);
  const tempPath = filePath + '.tmp.webp';
  
  if (!fs.existsSync(filePath)) {
    console.log(`No se encontró: ${filePath}`);
    return;
  }

  // Se fuerza la rotación de píxeles pasando los grados explícitamente a .rotate()
  await sharp(filePath).rotate(deg).webp({ quality: 85 }).toFile(tempPath);
  fs.renameSync(tempPath, filePath);
  console.log(`Píxeles rotados ${deg} grados para: ${fileName}`);
}

async function run() {
  await rotateImg('disenador-industrial-midiendo-espacio-bogota-1.webp', 90);
  await rotateImg('taller-fabricacion-muebles-madera-bogota-1.webp', 90);
}

run().catch(console.error);
