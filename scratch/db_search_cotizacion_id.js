const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not defined.');
    process.exit(1);
  }

  const sql = postgres(url);
  try {
    console.log('--- BÚSQUEDA GLOBAL DE REFERENCIAS A COTIZACION_ID EN NEON ---');

    // Buscar qué namespaces tienen registros cuyo data contiene la llave 'cotizacion_id'
    const results = await sql`
      SELECT 
        namespace, 
        count(*) as total_con_cotizacion_id
      FROM agnostic_records
      WHERE data ? 'cotizacion_id'
      GROUP BY namespace;
    `;

    console.log('\nNamespaces con la propiedad "cotizacion_id" en su JSON data:');
    console.table(results);

    // Si hay otros namespaces, mostrar una muestra
    for (const r of results) {
      if (r.namespace !== 'espacio_variantes') {
        console.log(`\nMuestra de ${r.namespace} con 'cotizacion_id':`);
        const sample = await sql`
          SELECT id, namespace, data->>'cotizacion_id' as cot_id, data
          FROM agnostic_records
          WHERE namespace = ${r.namespace} AND data ? 'cotizacion_id'
          LIMIT 3;
        `;
        console.log(JSON.stringify(sample, null, 2));
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
