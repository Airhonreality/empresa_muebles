const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../storage/db/schema_definitions.json');
const schemas = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

function dumpSchema(name) {
  const schema = schemas.find(s => s.data && s.data.name === name);
  if (!schema) {
    console.log(`Schema ${name} no encontrado en schema_definitions.json`);
    return;
  }
  console.log(`\nFields for schema "${name}":`);
  schema.data.fields.forEach(f => {
    const rel = f.config && f.config.relation ? ` -> ${f.config.relation.entity}` : '';
    console.log(`  - ${f.key} (${f.type}${rel})`);
  });
}

dumpSchema('contratos');
dumpSchema('imagenes_espacio');
dumpSchema('proyectos');
