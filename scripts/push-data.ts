/**
 * ⚡ AGNOSTIC DATA DEPLOYER (push-data.ts)
 * ========================================
 * 
 * ROLE: Envía cualquier registro (Zaps, Templates, Rutas, etc.) desde la base de datos
 *       local en JSON hacia la base de datos de producción a través de la API del Vault.
 *       Esta es la herramienta universal de despliegue en la arquitectura Code-As-Data.
 * 
 * USAGE:
 * npm run push-data <namespace> <nombre_del_registro>
 * Ej: npm run push-data scripts exportar_pdf
 * Ej: npm run push-data templates propuesta_comercial
 */

import fs from 'fs';
import path from 'path';

async function push() {
  const namespace = process.argv[2];
  const recordName = process.argv[3];
  
  // Buscar target en los argumentos o en el entorno
  const targetArg = process.argv.find(arg => arg.startsWith('--target='));
  let targetUrl = targetArg ? targetArg.split('=')[1] : process.env.PRODUCTION_URL;

  if (!namespace || !recordName || namespace.startsWith('--') || recordName.startsWith('--')) {
    console.error('\n❌ Error: Parámetros incorrectos.');
    console.log('💡 Uso: npm run push-data <namespace> <nombre_registro>');
    console.log('💡 Ejemplo Zaps:      npm run push-data scripts exportar_propuesta');
    console.log('💡 Ejemplo Templates: npm run push-data templates propuesta_comercial\n');
    process.exit(1);
  }

  if (!targetUrl) {
    console.error('\n❌ Error: Falta la URL de Producción.');
    console.log('💡 Solución: Define PRODUCTION_URL en tu .env o pásala por --target=https://...\n');
    process.exit(1);
  }

  targetUrl = targetUrl.replace(/\/$/, '');

  console.log(`\n🚀 Buscando registro local: Namespace [${namespace}] -> Nombre [${recordName}]...`);
  
  const dbPath = path.join(process.cwd(), 'storage', 'db', `${namespace}.json`);
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Error: No se encontró la base de datos local en ${dbPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dbPath, 'utf8');
  const records = JSON.parse(rawData);
  const myRecord = records.find((s: any) => s.data?.name === recordName || s.name === recordName || s.data?.slug === recordName);
  
  if (!myRecord) {
    console.error(`❌ Error: El registro "${recordName}" no existe en ${namespace}.json.`);
    process.exit(1);
  }

  console.log(`📡 Destino (Vault API): ${targetUrl}/api/vault`);
  console.log(`📦 Payload a enviar: ${Buffer.byteLength(JSON.stringify(myRecord))} bytes`);

  const secretKey = process.env.API_SECRET_KEY || '';

  try {
    const response = await fetch(`${targetUrl}/api/vault`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-secret': secretKey
      },
      body: JSON.stringify({
        action: 'WRITE',
        namespace: namespace,
        record: myRecord
      })
    });

    if (response.ok) {
      console.log(`\n✅ ¡Éxito total! El registro "${recordName}" ya está activo en Producción.`);
    } else {
      console.error(`\n❌ Error devuelto por la nube:`, await response.text());
    }
  } catch (err: any) {
    console.error(`\n❌ Fallo de conexión: ${err.message}`);
    console.error(`   Asegúrate de que la URL de producción está activa y bien escrita.`);
  }
}

push().catch(console.error);
