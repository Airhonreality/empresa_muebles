/**
 * ⚡ AGNOSTIC ZAP DEPLOYER (push-zap.ts)
 * ========================================
 * 
 * ROLE: Envía un script de lógica (Zap) desde el entorno de desarrollo local
 *       hacia la base de datos de producción a través de la API del Vault.
 *       Este es el paso canónico para desplegar reglas de negocio en la arquitectura Code-As-Data.
 * 
 * USAGE:
 * npm run push-zap mi_script_pdf --target=https://mi-dominio-real.com
 * (O puedes configurar PRODUCTION_URL en tu archivo .env para no escribir el dominio siempre)
 */

import fs from 'fs';
import path from 'path';

async function push() {
  const zapName = process.argv[2];
  
  // Buscar target en los argumentos o en el entorno
  const targetArg = process.argv.find(arg => arg.startsWith('--target='));
  let targetUrl = targetArg ? targetArg.split('=')[1] : process.env.PRODUCTION_URL;

  if (!zapName || zapName.startsWith('--')) {
    console.error('\n❌ Error: Debes especificar el nombre del zap.');
    console.log('💡 Ejemplo: npm run push-zap exportar_propuesta --target=https://muebles.vercel.app\n');
    process.exit(1);
  }

  if (!targetUrl) {
    console.error('\n❌ Error: Falta la URL de Producción.');
    console.log('💡 Solución: Pasa el argumento --target=https://... o define PRODUCTION_URL en tu .env\n');
    process.exit(1);
  }

  // Limpiar posible barra al final de la URL
  targetUrl = targetUrl.replace(/\/$/, '');

  console.log(`\n🚀 Iniciando despliegue de Zap: "${zapName}"...`);
  
  const dbPath = path.join(process.cwd(), 'storage', 'db', 'scripts.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Error: No se encontró la base de datos local en ${dbPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dbPath, 'utf8');
  const scripts = JSON.parse(rawData);
  const miZap = scripts.find((s: any) => s.data?.name === zapName || s.name === zapName);
  
  if (!miZap) {
    console.error(`❌ Error: El zap "${zapName}" no existe en el entorno local.`);
    process.exit(1);
  }

  console.log(`📡 Destino (Vault API): ${targetUrl}/api/vault`);
  console.log(`📦 Payload a enviar: ${Buffer.byteLength(JSON.stringify(miZap))} bytes`);

  try {
    const response = await fetch(`${targetUrl}/api/vault`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'WRITE',
        namespace: 'scripts',
        record: miZap
      })
    });

    if (response.ok) {
      console.log(`\n✅ ¡Éxito total! El Zap "${zapName}" ya está activo en Producción.`);
    } else {
      console.error(`\n❌ Error en el despliegue:`, await response.text());
    }
  } catch (err: any) {
    console.error(`\n❌ Fallo de conexión: ${err.message}`);
    console.error(`   Asegúrate de que la URL de producción está activa y bien escrita.`);
  }
}

push().catch(console.error);
