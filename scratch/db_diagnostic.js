const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not defined in env.');
    process.exit(1);
  }

  const sql = postgres(url);
  try {
    console.log('--- DIAGNÓSTICO DE BASE DE DATOS NEON ---');

    // 1. Conteo de registros por namespace
    const namespaces = await sql`
      SELECT namespace, count(*) as cnt 
      FROM agnostic_records 
      WHERE namespace IN ('proyectos', 'cotizaciones', 'espacio_variantes', 'items_variante')
      GROUP BY namespace;
    `;
    console.log('\nConteos por namespace:');
    console.table(namespaces);

    // 2. Analizar campos en data de espacio_variantes
    const espacios = await sql`
      SELECT id, data->>'nombre_espacio' as nombre, data->>'cotizacion_id' as cot_id, data->>'proyecto_id' as proy_id
      FROM agnostic_records
      WHERE namespace = 'espacio_variantes';
    `;
    
    let totalEspacios = espacios.length;
    let conCotizacionId = espacios.filter(e => e.cot_id).length;
    let conProyectoId = espacios.filter(e => e.proy_id).length;
    let ambos = espacios.filter(e => e.cot_id && e.proy_id).length;
    let ninguno = espacios.filter(e => !e.cot_id && !e.proy_id).length;

    console.log('\nAnálisis de espacio_variantes:');
    console.log(`- Total registros: ${totalEspacios}`);
    console.log(`- Con 'cotizacion_id': ${conCotizacionId}`);
    console.log(`- Con 'proyecto_id': ${conProyectoId}`);
    console.log(`- Con ambos: ${ambos}`);
    console.log(`- Con ninguno: ${ninguno}`);

    if (espacios.length > 0) {
      console.log('\nMuestra de espacio_variantes (primeros 5):');
      console.table(espacios.slice(0, 5));
    }

    // 3. Analizar registros de proyectos y cotizaciones
    const proyectosSample = await sql`
      SELECT id, data->>'nombre_proyecto' as nombre_proyecto, data->>'nombre' as nombre
      FROM agnostic_records
      WHERE namespace = 'proyectos'
      LIMIT 5;
    `;
    console.log('\nMuestra de proyectos:');
    console.table(proyectosSample);

    const cotizacionesSample = await sql`
      SELECT id, data->>'nombre_proyecto' as nombre_proyecto, data->>'nombre' as nombre, data->>'nombre_cotizacion' as nombre_cotizacion
      FROM agnostic_records
      WHERE namespace = 'cotizaciones'
      LIMIT 5;
    `;
    console.log('\nMuestra de cotizaciones:');
    console.table(cotizacionesSample);

  } catch (err) {
    console.error('Error durante el diagnóstico:', err);
  } finally {
    await sql.end();
  }
}

main();
