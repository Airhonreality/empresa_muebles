const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = postgres(url);
  try {
    console.log('--- INSPECCIONANDO EL REGISTRO DEL PROYECTO DE LORENA VACA ---');

    // 1. Mostrar el registro completo de Lorena Vaca en la tabla 'proyectos'
    const proyecto = await sql`
      SELECT * FROM agnostic_records 
      WHERE namespace = 'proyectos' AND id = '286b5b77-02da-49e4-a32e-d54020e713a7';
    `;
    console.log('\nProyecto Lorena Vaca:');
    console.log(JSON.stringify(proyecto, null, 2));

    // 2. Buscar en la tabla 'cotizaciones' por si hay algún registro con el mismo ID
    const cotizacion = await sql`
      SELECT * FROM agnostic_records 
      WHERE namespace = 'cotizaciones' AND id = '286b5b77-02da-49e4-a32e-d54020e713a7';
    `;
    console.log('\nCotización Lorena Vaca (mismo ID):');
    console.log(JSON.stringify(cotizacion, null, 2));

    // 3. Buscar globalmente en agnostic_records por el ID '286b5b77-02da-49e4-a32e-d54020e713a7'
    const todosConId = await sql`
      SELECT id, namespace, context, data FROM agnostic_records 
      WHERE id = '286b5b77-02da-49e4-a32e-d54020e713a7';
    `;
    console.log('\nTodos los registros en Neon con este ID:');
    console.log(JSON.stringify(todosConId, null, 2));

    // 4. Buscar espacio_variantes que apunten a este ID (por si acaso filtramos mal antes)
    const espacios = await sql`
      SELECT id, namespace, data FROM agnostic_records 
      WHERE namespace = 'espacio_variantes' AND (data->>'proyecto_id' = '286b5b77-02da-49e4-a32e-d54020e713a7' OR data->>'cotizacion_id' = '286b5b77-02da-49e4-a32e-d54020e713a7');
    `;
    console.log('\nEspacios apuntando a Lorena Vaca:');
    console.log(JSON.stringify(espacios, null, 2));

    // 5. ¿Hay algún espacio_variantes suelto o huérfano que mencione "Lorena" o "Vaca" en su data?
    const espaciosTexto = await sql`
      SELECT id, namespace, data FROM agnostic_records
      WHERE namespace = 'espacio_variantes' AND (data::text ILIKE '%Lorena%' OR data::text ILIKE '%Vaca%');
    `;
    console.log('\nEspacios que contienen "Lorena" o "Vaca" en el JSON completo:');
    console.log(JSON.stringify(espaciosTexto, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
