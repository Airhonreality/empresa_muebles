import { getDefinitionAwareBridge } from './src/server/definitions/topology';
import { LocalStrategy } from './src/server/strategies/LocalStrategy';
import { getProjectStorageRoot } from './src/server/activeProject';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const adapter = getDefinitionAwareBridge(); 
  const storageRoot = getProjectStorageRoot();
  
  const [schemas, routes, scripts] = await Promise.all([
    adapter.read('schema_definitions'),
    adapter.read('page_routes'),
    adapter.read('scripts')
  ]);
  
  const namespaces = new Set([
    ...schemas.map(s => s.data?.name).filter(Boolean),
    ...routes.map(r => r.data?.path).filter(Boolean),
    ...scripts.map(s => s.data?.name).filter(Boolean)
  ]);
  
  const dbDir = path.join(storageRoot, 'db');
  const files = await fs.readdir(dbDir);
  for (const file of files) {
    if (file.endsWith('.json')) namespaces.add(file.slice(0, -5));
  }
  
  console.log(`Exportando ${namespaces.size} namespaces...`);
  
  for (const namespace of namespaces) {
    try {
      const records = await adapter.read(namespace);
      const outputPath = path.join(storageRoot, 'db-export', `${namespace}.json`);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(records, null, 2));
      console.log(`✓ ${namespace}: ${records.length} registros`);
    } catch (error) {
      console.error(`✗ ${namespace}: ${error.message}`);
    }
  }
  
  console.log('¡Exportación completada! Archivos en storage/db-export/');
}

main().catch(console.error);
