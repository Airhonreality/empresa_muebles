export {};

/**
 * 🔍 INSPECT NEON TABLE STRUCTURE
 * Verificar tipo de datos y estructura exacta
 */

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL no configurado');
    process.exit(1);
  }

  const postgres = await import('postgres');
  const sql = postgres.default(DATABASE_URL);

  try {
    console.log('✓ Conectado a Neon\n');

    // 1. Ver estructura de la tabla
    console.log('📋 ESTRUCTURA DE agnostic_records:');
    const structure = await sql`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'agnostic_records'
      ORDER BY ordinal_position
    `;
    console.table(structure);

    // 2. Ver datos de page_routes - pero RAW
    console.log('\n📊 DATOS DE page_routes (PRIMERAS 3):');
    const routes = await sql`
      SELECT
        id,
        namespace,
        context,
        data,
        typeof(data) as data_type_postgres,
        created_at
      FROM agnostic_records
      WHERE namespace = 'page_routes'
      ORDER BY created_at DESC
      LIMIT 3
    `;

    routes.forEach((route, i) => {
      console.log(`\n[${i + 1}]`);
      console.log(`  id: ${route.id}`);
      console.log(`  context: ${route.context}`);
      console.log(`  data_type_postgres: ${route.data_type_postgres || '?'}`);
      console.log(`  data (raw):`, typeof route.data, route.data?.constructor?.name);

      // Intentar parsear
      let parsed = route.data;
      if (typeof route.data === 'string') {
        try {
          parsed = JSON.parse(route.data);
        } catch (e) {
          console.log(`  ❌ NO SE PUEDE PARSEAR JSON`);
        }
      }

      if (parsed && typeof parsed === 'object') {
        console.log(`  data.path: ${parsed.path || '❌ SIN PATH'}`);
        console.log(`  data.title: ${parsed.title || '❌ SIN TITLE'}`);
        console.log(`  data keys: ${Object.keys(parsed).join(', ')}`);
      }
    });

    await sql.end();
  } catch (error) {
    console.error('❌ Error:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
