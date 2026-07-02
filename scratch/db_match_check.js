const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not defined in env.');
    process.exit(1);
  }

  const sql = postgres(url);
  try {
    console.log('--- COMPATIBILIDAD DE IDS COTIZACIÓN VS PROYECTO ---');

    const result = await sql`
      SELECT 
        e.id as espacio_id, 
        e.data->>'nombre_espacio' as nombre, 
        e.data->>'cotizacion_id' as cot_id,
        p.id as proyecto_match_id,
        p.data->>'nombre_proyecto' as proyecto_nombre
      FROM agnostic_records e
      LEFT JOIN agnostic_records p 
        ON p.namespace = 'proyectos' AND p.id = e.data->>'cotizacion_id'
      WHERE e.namespace = 'espacio_variantes' AND e.data->>'cotizacion_id' IS NOT NULL;
    `;

    console.log(`\nRelaciones encontradas para los ${result.length} espacios con 'cotizacion_id':`);
    console.table(result.map(r => ({
      espacio_id: r.espacio_id.slice(0, 8),
      nombre_espacio: r.nombre,
      cotizacion_id: r.cot_id ? r.cot_id.slice(0, 8) : 'null',
      proyecto_found: r.proyecto_match_id ? 'SÍ (' + r.proyecto_nombre + ')' : 'NO'
    })));

    // Chequear si hay cotizaciones que NO están en proyectos
    const orphanCotizaciones = await sql`
      SELECT c.id, c.data->>'nombre_proyecto' as nombre
      FROM agnostic_records c
      LEFT JOIN agnostic_records p ON p.namespace = 'proyectos' AND p.id = c.id
      WHERE c.namespace = 'cotizaciones' AND p.id IS NULL;
    `;
    console.log('\nCotizaciones en Neon que NO existen en Proyectos (Huérfanas):');
    console.table(orphanCotizaciones);

    // Chequear si hay proyectos que NO están en cotizaciones
    const newProyectos = await sql`
      SELECT p.id, p.data->>'nombre_proyecto' as nombre
      FROM agnostic_records p
      LEFT JOIN agnostic_records c ON c.namespace = 'cotizaciones' AND c.id = p.id
      WHERE p.namespace = 'proyectos' AND c.id IS NULL;
    `;
    console.log('\nProyectos en Neon que NO existen en Cotizaciones (Nuevos):');
    console.table(newProyectos);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
