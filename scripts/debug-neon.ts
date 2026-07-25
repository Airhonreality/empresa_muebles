/**
 * 🔍 DEBUG NEON - Verificar qué hay realmente en la base de datos
 */

const DATABASE_URL = process.env.DATABASE_URL || '';

async function main() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL no configurado');
    process.exit(1);
  }

  const postgres = await import('postgres');
  const sql = postgres.default(DATABASE_URL);

  try {
    console.log('✓ Conectado a Neon\n');

    // Query 1: Contar registros por namespace
    console.log('📊 Registros por namespace:');
    const namespaces = await sql`
      SELECT namespace, COUNT(*) as count
      FROM agnostic_records
      GROUP BY namespace
      ORDER BY count DESC
    `;
    console.table(namespaces);

    // Query 2: Ver rutas específicamente
    console.log('\n📋 Rutas en Neon (page_routes namespace):');
    const routes = await sql`
      SELECT id, context, data, created_at, updated_at
      FROM agnostic_records
      WHERE namespace = 'page_routes'
      ORDER BY created_at DESC
      LIMIT 21
    `;

    console.log(`\n✓ Total page_routes en Neon: ${routes.length}\n`);

    if (routes.length === 0) {
      console.error('❌ NO HAY RUTAS EN NEON!!');
      process.exit(1);
    }

    // Verificar estructura
    let countWithTitle = 0;
    let countWithoutTitle = 0;

    routes.forEach((route, i) => {
      let data = route.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      const hasTitle = !!data.title;
      if (hasTitle) countWithTitle++;
      else countWithoutTitle++;

      console.log(
        `[${i + 1}] ${data.path || 'SIN PATH'} → ${
          data.title || '❌ SIN TITLE'
        }`
      );
    });

    console.log(`\n📊 Resumen:`);
    console.log(`  ✓ Con title: ${countWithTitle}`);
    console.log(`  ❌ Sin title: ${countWithoutTitle}`);

    if (countWithoutTitle > 0) {
      console.log(
        '\n⚠️  PROBLEMA DETECTADO: Hay rutas sin title en Neon!'
      );
      console.log('    El sync está escribiendo, pero los titles NO llegan a la BD.');
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Error conectando a Neon:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
