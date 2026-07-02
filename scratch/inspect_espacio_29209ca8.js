const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = postgres(url);
  try {
    console.log('--- INSPECCIONANDO ESPACIO 29209ca8 y SU PROYECTO 933c4919 ---');

    // Espacio completo
    const espacio = await sql`
      SELECT * FROM agnostic_records WHERE id = '29209ca8-be7c-4a0e-8d1a-71b3c4ec7d0f';
    `;
    // Si el ID corto no es suficiente, busquemos por prefijo
    const espacioPorPrefijo = await sql`
      SELECT * FROM agnostic_records 
      WHERE namespace = 'espacio_variantes' AND id LIKE '29209ca8%';
    `;
    console.log('\nEspacio "Cocina integral" (29209ca8..):');
    console.log(JSON.stringify(espacioPorPrefijo, null, 2));

    // Proyecto 933c4919
    const proyecto = await sql`
      SELECT * FROM agnostic_records 
      WHERE namespace = 'proyectos' AND id LIKE '933c4919%';
    `;
    console.log('\nProyecto 933c4919:');
    console.log(JSON.stringify(proyecto, null, 2));

    // También búsqueda en cotizaciones
    const cotizacion = await sql`
      SELECT * FROM agnostic_records 
      WHERE namespace = 'cotizaciones' AND id LIKE '933c4919%';
    `;
    console.log('\nCotización 933c4919:');
    console.log(JSON.stringify(cotizacion, null, 2));

    // Items del espacio 29209ca8
    const items = await sql`
      SELECT id, data FROM agnostic_records 
      WHERE namespace = 'items_variante';
    `;
    const espacioId = espacioPorPrefijo[0]?.id;
    if (espacioId) {
      const itemsEspacio = items.filter(i => i.data.variante_id === espacioId);
      console.log(`\nItems en el espacio 29209ca8 (${itemsEspacio.length}):`);
      console.log(JSON.stringify(itemsEspacio, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
main();
