const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = postgres(url);
  try {
    console.log('--- BUSCANDO A LORENA VACA / COCINA INTEGRAL ---');

    // 1. Buscar en clientes
    const clientes = await sql`
      SELECT id, namespace, data
      FROM agnostic_records
      WHERE namespace = 'clientes' AND (data->>'nombre' ILIKE '%Lorena%' OR data->>'nombre' ILIKE '%Vaca%');
    `;
    console.log('\nClientes encontrados:');
    console.log(JSON.stringify(clientes, null, 2));

    // 2. Buscar en proyectos y cotizaciones que coincidan con Lorena Vaca o Cocina integral
    const clienteIds = clientes.map(c => c.id);
    
    let proyectos = [];
    if (clienteIds.length > 0) {
      proyectos = await sql`
        SELECT id, namespace, data
        FROM agnostic_records
        WHERE namespace = 'proyectos' AND (data->>'cliente_id' IN (${clienteIds}) OR data->>'nombre_proyecto' ILIKE '%Lorena%');
      `;
    } else {
      proyectos = await sql`
        SELECT id, namespace, data
        FROM agnostic_records
        WHERE namespace = 'proyectos' AND data->>'nombre_proyecto' ILIKE '%Cocina%';
      `;
    }
    console.log('\nProyectos encontrados:');
    console.log(JSON.stringify(proyectos, null, 2));

    const cotizaciones = await sql`
      SELECT id, namespace, data
      FROM agnostic_records
      WHERE namespace = 'cotizaciones' AND (data->>'nombre_proyecto' ILIKE '%Lorena%' OR data->>'nombre_proyecto' ILIKE '%Vaca%');
    `;
    console.log('\nCotizaciones encontradas:');
    console.log(JSON.stringify(cotizaciones, null, 2));

    // 3. Buscar espacios relacionados con estos proyectos
    const proyectoIds = proyectos.map(p => p.id);
    if (proyectoIds.length > 0) {
      const espacios = await sql`
        SELECT id, namespace, data
        FROM agnostic_records
        WHERE namespace = 'espacio_variantes' AND (data->>'proyecto_id' IN (${proyectoIds}) OR data->>'cotizacion_id' IN (${proyectoIds}));
      `;
      console.log('\nEspacios encontrados:');
      console.log(JSON.stringify(espacios, null, 2));

      const espacioIds = espacios.map(e => e.id);
      if (espacioIds.length > 0) {
        const items = await sql`
          SELECT id, namespace, data
          FROM agnostic_records
          WHERE namespace = 'items_variante' AND data->>'variante_id' IN (${espacioIds});
        `;
        console.log(`\nItems encontrados (${items.length}):`);
        console.log(JSON.stringify(items.slice(0, 5), null, 2));
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
