const fs = require('fs');
const path = require('path');

const dbPath = (filename) => path.join(__dirname, '../storage/db', filename);

function searchInFile(filename, id) {
  const filePath = dbPath(filename);
  if (!fs.existsSync(filePath)) {
    console.log(`Archivo local ${filename} no existe.`);
    return [];
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const found = content.filter(item => {
    const dataStr = JSON.stringify(item);
    return dataStr.includes(id);
  });
  return found;
}

async function main() {
  const id = '286b5b77-02da-49e4-a32e-d54020e713a7';
  console.log('--- BUSCANDO REGISTROS LOCALES (DISCO) PARA LORENA VACA ---');

  const proyectos = searchInFile('proyectos.json', id);
  console.log(`\nProyectos locales con ID ${id}: ${proyectos.length}`);
  console.log(JSON.stringify(proyectos, null, 2));

  const cotizaciones = searchInFile('cotizaciones.json', id);
  console.log(`\nCotizaciones locales con ID ${id}: ${cotizaciones.length}`);
  console.log(JSON.stringify(cotizaciones, null, 2));

  const espacios = searchInFile('espacio_variantes.json', id);
  console.log(`\nEspacios locales apuntando a ${id}: ${espacios.length}`);
  console.log(JSON.stringify(espacios, null, 2));

  if (espacios.length > 0) {
    const items = JSON.parse(fs.readFileSync(dbPath('items_variante.json'), 'utf-8'));
    const espacioIds = espacios.map(e => e.id);
    const itemsRel = items.filter(item => item.data && espacioIds.includes(item.data.variante_id));
    console.log(`\nItems locales vinculados a estos espacios: ${itemsRel.length}`);
    console.log(JSON.stringify(itemsRel.slice(0, 5), null, 2));
  }
}

main();
